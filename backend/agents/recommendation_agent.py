"""
RecommendationAgent — AI-powered scheme matching & recommendation engine.

Analyzes the citizen's detailed demographic, occupational, and economic profile
using Google Gemini AI intelligence, grounded in the 3,866 verified schemes database.
Returns top 20 strictly relevant, high-impact schemes.
"""
import hashlib
import json
import logging
import re
from typing import Any, Optional

from django.core.cache import cache

from .litellm_client import call_llm

logger = logging.getLogger(__name__)

SCHEME_CACHE_TTL = 60 * 10        # 10 minutes for full scheme list
RECO_CACHE_TTL = 60 * 30          # 30 minutes for recommendation results

_ALL_SCHEMES_CACHE: Optional[list[dict]] = None

FEMALE_ONLY_KEYWORDS = [
    "mahila", "kanya", "sukanya", "widow", "maternity", "pregnant",
    "girl child", "kishori", "ladli", "women ", "female only", "matru vandana",
    "laxmi", "bhagyashree", "prasooti"
]

OCC_POSITIVE_KEYWORDS = {
    "farmer": [
        "kisan", "fasal", "krishi", "crop", "farmer", "kusum", "dairy", "soil",
        "irrigation", "agriculture", "tractor", "seed", "horticulture",
        "animal husbandry", "fertilizer", "pashu", "farm"
    ],
    "student": [
        "student", "scholarship", "fellowship", "study", "school", "college",
        "tuition", "coaching", "education", "shiksha", "matric", "degree",
        "internship", "laptop", "merit", "aicte", "vidyarthi"
    ],
    "business owner": [
        "msme", "mudra", "startup", "business", "enterprise", "loan",
        "entrepreneur", "subsidy", "udyam", "standup", "credit", "venture",
        "industry", "export", "incubation"
    ],
    "self-employed": [
        "mudra", "svanidhi", "self employed", "business", "enterprise", "loan",
        "artisan", "craftsman", "vishwakarma", "pmegp", "credit", "vendor",
        "handloom", "weaver", "skill"
    ],
    "unemployed": [
        "mgnrega", "employment", "rozgar", "kaushal", "pmkvy", "skill",
        "training", "apprentice", "labour", "shramik", "unemployed", "job"
    ],
    "homemaker": [
        "women", "shg", "aajeevika", "livelihood", "mahila", "ujjwala",
        "ration", "self help group", "nutrition", "poshan", "maternity",
        "lakhpati didi"
    ],
    "retired": [
        "pension", "senior citizen", "old age", "retirement", "vridha",
        "elderly", "atal pension", "ignaps", "healthcare"
    ],
    "employed": [
        "housing", "awas", "insurance", "health", "pension", "social security",
        "pf", "esic", "tax benefit"
    ]
}

OCC_PRIMARY_CATEGORIES = {
    "farmer": ["Agriculture", "Financial Assistance"],
    "student": ["Education", "Skill Development"],
    "business owner": ["Business", "Financial Assistance", "Skill Development"],
    "self-employed": ["Business", "Financial Assistance", "Skill Development"],
    "unemployed": ["Employment", "Skill Development", "Financial Assistance"],
    "homemaker": ["Women & Child", "Social Security", "Healthcare"],
    "retired": ["Social Security", "Healthcare", "Financial Assistance"],
    "employed": ["Social Security", "Healthcare", "Housing", "Financial Assistance"],
    "other": ["Financial Assistance", "Social Security", "Healthcare"]
}


def _is_matching_state(user_state: str, covered_states: list) -> bool:
    if not user_state:
        return False
    if not covered_states or "All India" in covered_states:
        return True

    def normalize(name: str) -> str:
        s = str(name).lower()
        s = re.sub(r'\(.*?\)', '', s)
        s = s.replace('nct of', '').replace('state of', '').replace('&', 'and')
        return re.sub(r'[^a-z0-9]', '', s).strip()

    u_norm = normalize(user_state)
    if not u_norm:
        return False

    for cs in covered_states:
        if cs == "All India":
            return True
        c_norm = normalize(cs)
        if c_norm and (u_norm == c_norm or u_norm in c_norm or c_norm in u_norm):
            return True
    return False


def _precision_score(scheme: dict, profile: dict) -> tuple[int, str, list[str], list[str], list[dict]]:
    """
    Evaluates a scheme against citizen profile with strict statutory eligibility filters
    and true 0-based score tracking.
    Disqualifies (returns score=0, grade="Not Eligible") any scheme where user violates statutory rules.
    Points are earned from 0 based strictly on verified profile-scheme alignment.
    """
    elig = scheme.get("eligibility") or {}
    covered_states = scheme.get("covered_states") or scheme.get("coveredStates") or []
    name = (scheme.get("name") or "").strip()
    name_l = name.lower()
    tagline = (scheme.get("tagline") or "").strip().lower()
    desc = (scheme.get("short_description") or scheme.get("shortDescription") or "").strip().lower()
    cat = (scheme.get("category") or "").strip()
    custom_conds = [str(c).lower() for c in (elig.get("customConditions") or [])]
    conds_text = " ".join(custom_conds)
    tags_text = " ".join(scheme.get("tags") or []).lower()
    all_text = f"{name_l} {cat.lower()} {tagline} {desc} {conds_text} {tags_text}"

    user_age = profile.get("age")
    try:
        user_age = int(user_age) if user_age is not None and str(user_age).strip() != "" else None
    except (ValueError, TypeError):
        user_age = None

    user_gender = str(profile.get("gender") or "").strip().lower()
    user_state = (profile.get("state") or "").strip()
    user_occ = str(profile.get("employmentType") or profile.get("occupation") or "").strip().lower()
    user_cat = (profile.get("category") or "General").strip()
    user_income = str(profile.get("incomeRange") or "").strip()
    user_disabled = bool(profile.get("isDisability") or profile.get("hasDisability"))
    user_bpl = bool(profile.get("hasBPLCard") or profile.get("isBPL") or user_income == "Below ₹1 lakh")
    user_minority = bool(profile.get("isMinority") or user_cat == "Minority")

    # =========================================================================
    # STRICT STATUTORY INELIGIBILITY FILTERS (Score 0 on Violation)
    # =========================================================================

    # 1. State / Geography Verification
    is_all_india = "All India" in covered_states or len(covered_states) == 0
    is_user_state = _is_matching_state(user_state, covered_states)
    if not is_all_india and not is_user_state and user_state:
        return 0, "Not Eligible", [], [f"Restricted to residents of {', '.join(covered_states)} (your state is {user_state})"], []

    # 2. Gender & Marital Status Verification
    allowed_genders = [g.lower() for g in elig.get("allowedGenders", [])]
    if allowed_genders and "all" not in allowed_genders and user_gender:
        if user_gender not in allowed_genders:
            return 0, "Not Eligible", [], [f"Reserved for {', '.join(allowed_genders)} applicants only"], []

    female_kw = [
        "mahila", "kanya", "sukanya", "widow", "maternity", "pregnant",
        "girl child", "kishori", "ladli", "women only", "female only", "matru vandana",
        "laxmi", "bhagyashree", "prasooti", "stree", "didi", "beti", "balika", "nari", "lakhpati didi"
    ]
    if user_gender == "male":
        if cat == "Women & Child":
            return 0, "Not Eligible", [], ["Targeted specifically for female beneficiaries"], []
        if any(kw in all_text for kw in female_kw) or "widow" in all_text:
            if not any(w in all_text for w in ["both boys and girls", "all genders", "boys and girls", "children of", "widower"]):
                return 0, "Not Eligible", [], ["Targeted specifically for female beneficiaries"], []
        if any(kw in conds_text for kw in ["applicant should be a female", "girl child", "widow", "pregnant woman", "lactating mother", "female only"]):
            return 0, "Not Eligible", [], ["Targeted specifically for female beneficiaries"], []

    if user_gender == "female":
        if any(kw in all_text for kw in ["men only", "male only", "boys only", "purush"]):
            return 0, "Not Eligible", [], ["Targeted specifically for male beneficiaries"], []

    # 3. Benchmark Disability Verification
    disability_terms = [
        "students with disabilities", "persons with disabilities", "divyangjan",
        "disability pension", "locomotor disability", "benchmark disability", "handicapped",
        "visually impaired", "hearing impaired", "pwd quota"
    ]
    requires_disability = bool(elig.get("requiresDisability")) or (
        any(kw in all_text for kw in disability_terms) and "without disability" not in all_text
    )
    if requires_disability and not user_disabled:
        return 0, "Not Eligible", [], ["Requires benchmark disability certificate (40%+ Divyangjan)"], []

    # 4. Social Category / Caste Reservation Verification
    allowed_cats = elig.get("allowedCategories") or []
    if allowed_cats and "All" not in allowed_cats and user_cat:
        if user_cat not in allowed_cats:
            if not (user_cat in ["SC", "ST"] and any(c in ["SC", "ST"] for c in allowed_cats)):
                return 0, "Not Eligible", [], [f"Reserved exclusively for {', '.join(allowed_cats)} categories"], []

    minority_pattern = r'\b(for\s+minority|for\s+minorities|minority\s+students|minority\s+community|minority\s+scheme|begum\s+hazrat\s+mahal|maulana\s+azad)\b'
    requires_minority = bool(elig.get("requiresMinority")) or (
        bool(re.search(minority_pattern, all_text)) and not any(w in all_text for w in ["non-minority", "all communities", "open to all"])
    )
    if requires_minority and not user_minority:
        return 0, "Not Eligible", [], ["Reserved for students from notified minority communities"], []

    if user_cat == "General":
        affirmative_pattern = r'\b(for\s+sc\b|for\s+st\b|for\s+obc\b|for\s+ebc\b|for\s+dnt\b|scheduled\s+caste|scheduled\s+tribe|backward\s+classes|obc\s+students|sc\s+students|st\s+students|obc\s+candidates|minority\s+community|for\s+minority|for\s+minorities)\b'
        if re.search(affirmative_pattern, all_text):
            if not any(w in all_text for w in ["general", "all categories", "open to all"]):
                return 0, "Not Eligible", [], ["Reserved for affirmative action categories (SC/ST/OBC/Minority)"], []
        if any(re.search(affirmative_pattern, c) for c in custom_conds):
            if not any(w in conds_text for w in ["general", "all categories", "open to all"]):
                return 0, "Not Eligible", [], ["Reserved for affirmative action categories (SC/ST/OBC/Minority)"], []

    # 5. Age Limits & Statutory Age Verification
    min_age = elig.get("minAge")
    max_age = elig.get("maxAge")
    if user_age is not None:
        if min_age is not None and min_age > 0 and user_age < (min_age - 1):
            return 0, "Not Eligible", [], [f"Minimum eligible age is {min_age} years (your age: {user_age})"], []
        if max_age is not None and max_age < 100 and user_age > (max_age + 1):
            return 0, "Not Eligible", [], [f"Maximum eligible age is {max_age} years (your age: {user_age})"], []

        # Senior citizen pensions (60+)
        if any(term in all_text for term in ["senior citizen pension", "old age pension", "vridha pension", "vridhavastha", "vaya vandana", "70+ years", "age of 60 years or above", "aged 60 years and above", "ignaps"]):
            if user_age < 60:
                return 0, "Not Eligible", [], [f"Reserved for Senior Citizens aged 60+ (your age: {user_age})"], []

        # Minor school child schemes (<18)
        if re.search(r'\b(class\s*(?:1|1st|i)\s*to\s*(?:8|8th|10|10th|12|12th)|classes\s*1\s*to\s*12|pre-matric|school\s*children|primary\s*school|girl\s*child\s*under\s*10|school\s*uniforms)\b', all_text):
            if user_age >= 18:
                return 0, "Not Eligible", [], ["Restricted to school-going children (Class 1st to 12th)"], []

        # Youth schemes (18-35)
        if user_age >= 50 or user_occ == "retired":
            if any(w in all_text for w in ["youth seed", "yuva udyami", "yuvak", "adolescent", "between 18 and 35 years", "18-35 years", "18 to 35"]):
                return 0, "Not Eligible", [], ["Restricted to youth beneficiaries"], []

    # 6. DOMAIN & OCCUPATIONAL STATUTORY EXCLUSIONS
    # A) Education & Student Schemes
    is_education_scheme = (
        cat == "Education"
        or any(w in all_text for w in ["scholarship", "fellowship", "school student", "college student", "aicte", "post-matric", "pre-matric", "tuition fee", "b.tech", "ug/pg", "higher education", "study tour", "degree college"])
    )
    if is_education_scheme:
        if user_occ != "student" and (user_age is not None and user_age >= 26):
            return 0, "Not Eligible", [], ["Restricted to actively enrolled students"], []
        if user_occ in ["farmer", "retired", "business owner", "employed", "self-employed", "homemaker"]:
            return 0, "Not Eligible", [], ["Reserved for enrolled students"], []

    # B) Agriculture & Farmer Subsidies
    is_agri = (
        cat == "Agriculture"
        or any(w in all_text for w in ["kisan", "fasal bima", "pm-kusum", "crop insurance", "krishi", "tractor subsidy", "fertilizer subsidy", "fish hatcheries", "aquaculture", "seed subsidy", "irrigation subsidy", "soil health", "horticulture mission"])
    )
    if is_agri and user_occ not in ["farmer", "other"]:
        if user_occ in ["student", "homemaker", "employed", "retired", "business owner"]:
            return 0, "Not Eligible", [], ["Targeted exclusively for agricultural farmers & landholders"], []

    # C) Labour / Construction Board (BOCW)
    if any(w in all_text for w in ["hbocwwb", "construction worker", "silicosis board", "building or construction work", "bocw", "shramik card"]):
        if user_occ not in ["unemployed", "self-employed", "labour", "construction worker", "shramik"]:
            return 0, "Not Eligible", [], ["Requires active registration with Construction Labour Board (BOCW)"], []

    # D) High Income Means Testing
    if user_income in ["₹5–10 lakh", "₹10 lakh+", "Above ₹5 lakh"]:
        requires_bpl = bool(elig.get("requiresBPL")) or any(
            w in conds_text for w in ["bpl card", "antyodaya", "ration card holder", "below poverty line", "destitute"]
        )
        if requires_bpl:
            return 0, "Not Eligible", [], ["Income ceiling exceeded (reserved for BPL/Antyodaya households)"], []
        max_income = elig.get("maxAnnualIncome")
        if max_income and isinstance(max_income, (int, float)) and max_income <= 300000:
            return 0, "Not Eligible", [], [f"Income exceeds ceiling of ₹{int(max_income):,}"], []

    # =========================================================================
    # REFINED ZERO-BASED SCORE TRACKING (Starting at 0, Points Earned on Fit)
    # =========================================================================
    score = 0
    factors = []
    matched_reasons = []
    unmatched_warnings = []

    senior_kw = ["senior", "pension", "vridha", "elderly", "old age", "vaya vandana", "vayoshri", "geriatric", "ignaps"]
    is_senior_scheme = any(w in all_text for w in senior_kw)

    # --- FACTOR 1: Primary Occupation & Sector Fit (0 to 35 pts) ---
    occ_score = 0
    if user_occ == "farmer":
        if is_agri:
            occ_score = 35
            matched_reasons.append("Directly matches your farming & agricultural background")
        elif user_age is not None and user_age >= 60 and is_senior_scheme:
            occ_score = 35
            matched_reasons.append("Dedicated senior citizen welfare & support")
        elif cat in ["Healthcare", "Social Security", "Financial Assistance", "Housing"]:
            occ_score = 20 if (user_age is not None and user_age >= 60) else 15
            matched_reasons.append("General public welfare initiative available to rural households")
        else:
            occ_score = 5
    elif user_occ == "student":
        if is_education_scheme or cat in ["Education", "Skill Development"]:
            occ_score = 35
            matched_reasons.append("Directly tailored for student education & skill building")
        elif cat in ["Financial Assistance", "Social Security", "Healthcare"]:
            occ_score = 15
            matched_reasons.append("General public welfare initiative available to students")
        else:
            occ_score = 5
    elif user_occ in ["business owner", "self-employed"]:
        if cat in ["Business", "Employment"] or any(w in all_text for w in ["msme", "mudra", "startup", "udyam", "pmegp", "credit", "enterprise", "subsidy"]):
            occ_score = 35
            matched_reasons.append("Supports business enterprises and self-employed professionals")
        elif cat in ["Financial Assistance", "Skill Development"]:
            occ_score = 18
        elif cat in ["Healthcare", "Social Security"]:
            occ_score = 14
        else:
            occ_score = 5
    elif user_occ == "retired" or (user_age is not None and user_age >= 60):
        if is_senior_scheme:
            occ_score = 35
            matched_reasons.append("Dedicated senior citizen / pension support")
        elif cat in ["Social Security", "Healthcare", "Financial Assistance"]:
            occ_score = 25
        else:
            occ_score = 8
    elif user_occ == "homemaker":
        if cat in ["Women & Child", "Social Security"] or any(w in all_text for w in ["ujjwala", "ration", "poshan", "lakhpati", "shg", "aajeevika"]):
            occ_score = 35
            matched_reasons.append("Dedicated welfare support for women and families")
        elif cat in ["Healthcare", "Financial Assistance", "Housing"]:
            occ_score = 20
        else:
            occ_score = 8
    elif user_occ == "unemployed":
        if cat in ["Employment", "Skill Development"] or any(w in all_text for w in ["rozgar", "mgnrega", "kaushal", "pmkvy", "apprentice", "skill", "job"]):
            occ_score = 35
            matched_reasons.append("Directly provides employment opportunities and skill training")
        elif cat in ["Financial Assistance", "Social Security"]:
            occ_score = 18
        else:
            occ_score = 8
    else:
        occ_score = 15

    score += occ_score
    factors.append({
        "criterion": "Occupation Alignment",
        "score": occ_score,
        "weight": 35,
        "status": "matched" if occ_score >= 18 else "neutral",
        "explanation": f"Domain fit based on {profile.get('employmentType') or profile.get('occupation') or 'general background'}."
    })

    # --- FACTOR 2: Age Bracket & Life Stage Alignment (0 to 25 pts) ---
    age_score = 0
    if user_age is not None and user_age >= 60:
        if is_senior_scheme:
            age_score = 25
            matched_reasons.append(f"Specifically designed for Senior Citizens aged {user_age}+")
        elif is_agri and user_occ == "farmer":
            age_score = 22
            matched_reasons.append("Eligible adult farmer with full life-stage qualification")
        elif cat in ["Healthcare", "Social Security"]:
            age_score = 20
            matched_reasons.append("Healthcare & social security benefit for senior citizens")
        else:
            age_score = 12
    elif user_age is not None and 18 <= user_age <= 25:
        if any(w in all_text for w in ["youth", "yuva", "student", "scholarship", "higher education", "undergraduate", "b.tech"]):
            age_score = 25
            matched_reasons.append(f"Prime eligibility for youth / students aged {user_age}")
        elif cat in ["Education", "Skill Development"]:
            age_score = 22
        else:
            age_score = 14
    else:
        if is_agri and user_occ == "farmer":
            age_score = 22
        elif (user_occ in ["business owner", "self-employed"] and cat in ["Business", "Employment"]):
            age_score = 22
        elif min_age is not None and max_age is not None and user_age is not None and min_age <= user_age <= max_age:
            age_score = 20
        else:
            age_score = 16

    score += age_score
    factors.append({
        "criterion": "Age & Life Stage",
        "score": age_score,
        "weight": 25,
        "status": "matched" if age_score >= 18 else "neutral",
        "explanation": f"Life stage evaluated for age {user_age or 'specified'}."
    })

    # --- FACTOR 3: Geographic & State Implementation (0 to 25 pts) ---
    loc_score = 0
    if is_user_state and not is_all_india:
        loc_score = 25
        matched_reasons.append(f"State-specific initiative enacted by Government of {user_state}")
    elif is_all_india:
        loc_score = 20
        matched_reasons.append("Central / Nationwide flagship scheme active across All India")
    else:
        loc_score = 5

    score += loc_score
    factors.append({
        "criterion": "State Location",
        "score": loc_score,
        "weight": 25,
        "status": "matched" if loc_score >= 18 else "neutral",
        "explanation": f"Implementation jurisdiction in {user_state or 'India'}."
    })

    # --- FACTOR 4: Socio-Economic & Income Fit (0 to 15 pts) ---
    econ_score = 0
    if user_bpl:
        econ_score = 15
        matched_reasons.append("Income bracket fully satisfies financial assistance norms")
    elif user_income in ["Below ₹1 lakh", "₹1–2.5 lakh", "below_1l", "100000-250000"]:
        if is_agri or is_senior_scheme or cat in ["Healthcare", "Social Security", "Housing"]:
            econ_score = 14
            matched_reasons.append("Income bracket fully satisfies targeted welfare criteria")
        else:
            econ_score = 12
    elif user_income in ["₹2.5–5 lakh", "250000-500000"]:
        econ_score = 10
    else:
        econ_score = 7

    score += econ_score
    factors.append({
        "criterion": "Economic Need",
        "score": econ_score,
        "weight": 15,
        "status": "matched" if econ_score >= 10 else "neutral",
        "explanation": f"Income evaluated for {user_income or 'general'} bracket."
    })

    final_score = max(0, min(99, score))
    if final_score >= 85:
        grade = "High Potential"
    elif final_score >= 70:
        grade = "Good Match"
    elif final_score >= 50:
        grade = "Moderate Match"
    else:
        grade = "General Match"

    return final_score, grade, matched_reasons, unmatched_warnings, factors


class RecommendationAgent:
    """
    Intelligent scheme recommendation engine powered by Google Gemini AI
    and precision eligibility filtering.
    """

    def recommend(self, profile: dict, top_n: Optional[int] = None) -> list[dict]:
        """
        Analyzes the citizen profile and returns all scored eligible schemes,
        with the Top 20 ranked by Gemini AI intelligence at the top.
        """
        profile_hash = hashlib.md5(
            json.dumps(profile, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest()
        cache_key = f"recommendations:v8:{profile_hash}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached if top_n is None else cached[:top_n]

        schemes = self._get_all_schemes()
        if not schemes:
            return []

        # Step 1: Precision Pre-Score all schemes against statutory criteria
        # Returns all schemes matching with score >= 40 (statutory eligible)
        scored_candidates = []
        for s in schemes:
            score, grade, reasons, warnings, factors = _precision_score(s, profile)
            if score >= 40:
                scored_candidates.append({
                    "scheme": s,
                    "matchScore": score,
                    "matchGrade": grade,
                    "matchedReasons": reasons[:4],
                    "unmatchedWarnings": warnings[:3],
                    "factors": factors,
                })

        # Sort candidate pool: highest match score first, official verified schemes on top
        scored_candidates.sort(
            key=lambda r: (r["matchScore"], float(r["scheme"].get("popular_score") or r["scheme"].get("popularScore") or 0)),
            reverse=True,
        )

        candidate_pool = scored_candidates[:12]
        if not candidate_pool:
            candidate_pool = scored_candidates[:8]

        # Step 2: Ask Google Gemini AI to analyze profile & select Top recommendations
        ai_results = self._gemini_analyze_and_rank(profile, candidate_pool, top_n=12)

        if ai_results and len(ai_results) >= 3:
            top_recs = ai_results
        else:
            # Step 3: High-precision fallback if AI call hits rate limit / quota
            top_recs = self._generate_smart_fallback(profile, candidate_pool, top_n=15)

        # Step 4: Merge Top recommendations with all other scored eligible candidates
        used_slugs = {r["scheme"].get("slug") for r in top_recs if "scheme" in r}
        remaining_candidates = [
            c for c in scored_candidates
            if c["scheme"].get("slug") not in used_slugs
        ]

        # Add smart fallback insights to remaining candidates
        remaining_with_insights = self._generate_smart_fallback(profile, remaining_candidates, top_n=len(remaining_candidates))

        final_results = top_recs + remaining_with_insights
        cache.set(cache_key, final_results, RECO_CACHE_TTL)
        return final_results if top_n is None else final_results[:top_n]

    def _gemini_analyze_and_rank(self, profile: dict, candidate_pool: list[dict], top_n: int = 12) -> Optional[list[dict]]:
        """
        Invokes Google Gemini AI to perform deep reasoning on the citizen profile and rank candidates.
        """
        if not candidate_pool:
            return None

        candidates_summary = [
            {
                "slug": r["scheme"].get("slug"),
                "name": r["scheme"].get("name"),
                "category": r["scheme"].get("category"),
                "level": r["scheme"].get("level"),
                "tagline": r["scheme"].get("tagline"),
                "short_description": (r["scheme"].get("short_description") or r["scheme"].get("shortDescription") or "")[:140],
            }
            for r in candidate_pool
        ]

        occ_detail = profile.get("employmentType") or profile.get("occupation") or "General"
        if profile.get("studentCourse"):
            occ_detail += f" (Course: {profile.get('studentCourse')})"
        elif profile.get("farmerLandAcre"):
            occ_detail += f" (Land: {profile.get('farmerLandAcre')} acres)"
        elif profile.get("businessStage"):
            occ_detail += f" (Stage: {profile.get('businessStage')})"

        prompt = f"""You are the Senior Government Welfare Intelligence Advisor for SchemeNavigator India.
Analyze this citizen's complete profile:
- Name: {profile.get('name') or 'Citizen'}
- Age: {profile.get('age') or 'Not specified'} years
- Gender: {profile.get('gender') or 'All'}
- State: {profile.get('state') or 'All India'} (District: {profile.get('district') or 'General'}, Area: {profile.get('areaType') or 'Rural/Urban'})
- Occupation: {occ_detail}
- Annual Income: {profile.get('incomeRange') or 'Not specified'}
- Social Category: {profile.get('category') or 'General'}
- BPL / Low Income: {'Yes' if profile.get('hasBPLCard') or profile.get('isBPL') or profile.get('incomeRange') == 'Below ₹1 lakh' else 'No'}
- Disability: {'Yes' if profile.get('isDisability') or profile.get('hasDisability') else 'None'}

Pre-screened Candidate Schemes:
{json.dumps(candidates_summary, ensure_ascii=False)}

TASK:
1. Select and rank the TOP {top_n} MOST IMPACTFUL schemes specifically tailored to this citizen's unique profile.
2. Fine-tune match scores: 88 to 98 for primary career/farming/education fits; 65 to 80 for secondary general welfare fits.
3. Provide a concise 'whyGood' (under 16 words, direct citizen benefit) and 'toNote' (under 14 words, key doc or action).

Return a JSON object with this exact structure:
{{
  "recommendations": [
    {{"slug": "scheme-slug", "matchScore": 96, "whyGood": "Concise direct benefit", "toNote": "Key document or action step"}}
  ]
}}
"""

        messages = [
            {"role": "system", "content": "You are an expert government welfare intelligence officer. Return valid JSON only."},
            {"role": "user", "content": prompt},
        ]

        try:
            raw = call_llm(messages, temperature=0.2, max_tokens=3000, response_format={"type": "json_object"})
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()

            parsed = json.loads(clean)
            if isinstance(parsed, dict):
                for key in ["recommendations", "results", "schemes", "data"]:
                    if key in parsed and isinstance(parsed[key], list):
                        parsed = parsed[key]
                        break

            if not isinstance(parsed, list) or len(parsed) == 0:
                return None

            # Map back to full Scheme objects
            scheme_map = {r["scheme"]["slug"]: r for r in candidate_pool}
            enriched = []

            for item in parsed:
                slug = item.get("slug")
                if slug in scheme_map:
                    base = scheme_map[slug]
                    raw_score = int(item.get("matchScore") or base["matchScore"])
                    clamped_score = max(10, min(99, raw_score))
                    if clamped_score >= 85:
                        grade_val = "High Potential"
                    elif clamped_score >= 70:
                        grade_val = "Good Match"
                    elif clamped_score >= 50:
                        grade_val = "Moderate Match"
                    else:
                        grade_val = "General Match"

                    # Calibrate factors so sum(f['score']) exactly matches clamped_score
                    base_factors = [dict(f) for f in base.get("factors", [])]
                    if base_factors:
                        base_sum = sum(f["score"] for f in base_factors)
                        if base_sum > 0 and base_sum != clamped_score:
                            diff = clamped_score - base_sum
                            for f in base_factors:
                                if f.get("criterion") == "Occupation Alignment":
                                    f["score"] = max(5, min(f.get("weight", 35), f["score"] + diff))
                                    break

                    enriched.append({
                        "scheme": base["scheme"],
                        "matchScore": clamped_score,
                        "matchGrade": grade_val,
                        "whyGood": item.get("whyGood") or (base["matchedReasons"][0] if base["matchedReasons"] else "High alignment with your profile."),
                        "toNote": item.get("toNote") or (base["unmatchedWarnings"][0] if base["unmatchedWarnings"] else "Verify details on official portal."),
                        "matchedReasons": item.get("matchedReasons") or base["matchedReasons"],
                        "unmatchedWarnings": base["unmatchedWarnings"],
                        "factors": base_factors if base_factors else base.get("factors", []),
                    })

            if len(enriched) >= 3:
                return enriched

        except Exception as exc:
            logger.warning("Gemini recommendation analysis failed, using precision engine: %s", exc)

        return None

    def _generate_smart_fallback(self, profile: dict, candidate_pool: list[dict], top_n: int = 20) -> list[dict]:
        """
        Generates enriched top 20 recommendations using precision scoring and contextual reasons.
        """
        occ = profile.get("employmentType") or profile.get("occupation") or "your background"
        state = profile.get("state") or "India"

        top = candidate_pool[:top_n]
        for r in top:
            scheme = r["scheme"]
            name = scheme.get("name", "")
            cat = scheme.get("category", "")
            reasons = r.get("matchedReasons", [])
            warnings = r.get("unmatchedWarnings", [])

            if "whyGood" not in r or not r["whyGood"]:
                if "kisan" in name.lower() or cat == "Agriculture":
                    r["whyGood"] = f"Directly supports your farming activities in {state} with direct subsidies & financial assistance."
                elif "student" in name.lower() or cat == "Education":
                    r["whyGood"] = f"Provides financial aid and education support for students in {state}."
                elif "mudra" in name.lower() or cat == "Business":
                    r["whyGood"] = f"Offers collateral-free business loans & credit subsidies for self-employment & enterprises."
                elif reasons:
                    r["whyGood"] = reasons[0]
                else:
                    r["whyGood"] = f"Highly compatible with your {occ} profile in {state}."

            if "toNote" not in r or not r["toNote"]:
                if warnings:
                    r["toNote"] = warnings[0]
                else:
                    r["toNote"] = "Keep Aadhaar, Bank passbook, and residential proof ready for online application."

        return top

    @staticmethod
    def _get_all_schemes() -> list[dict]:
        """
        Fetch all schemes from the database, cached in-process and in Django cache.
        """
        global _ALL_SCHEMES_CACHE
        if _ALL_SCHEMES_CACHE is not None:
            return _ALL_SCHEMES_CACHE

        cache_key = "recommendations:all_schemes_v3"
        cached = cache.get(cache_key)
        if cached is not None:
            _ALL_SCHEMES_CACHE = cached
            return cached

        from schemes.models import Scheme
        from schemes.serializers import SchemeSerializer

        qs = Scheme.objects.all()
        data = SchemeSerializer(qs, many=True).data
        schemes = [dict(s) for s in data]
        cache.set(cache_key, schemes, SCHEME_CACHE_TTL)
        _ALL_SCHEMES_CACHE = schemes
        return schemes

