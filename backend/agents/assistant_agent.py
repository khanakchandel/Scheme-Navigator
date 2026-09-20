"""
AssistantAgent — powers the natural-language conversational chatbot interface.

Responsibilities:
1. Detect if the user is describing themselves → call ProfileAgent to update profile.
2. Smart intent extraction & multi-category retrieval across 3,866 schemes.
3. Build multi-turn conversation context window (last 10 messages).
4. Call LLM with grounded scheme context in Hindi / Hinglish / English.
5. Return clean conversational answer + list of referenced scheme IDs + profile updates.
"""
import json
import logging
import re

from .litellm_client import call_llm
from .profile_agent import ProfileAgent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are Mitra (मित्र), the friendly, witty, highly knowledgeable, and empathetic AI Welfare Counselor and Scheme Advisor on SchemeNavigator for Indian citizens.

ACTIVE LANGUAGE DIRECTIVE:
The citizen's active platform language is: {target_language} ({target_language_name}).
CRITICAL LANGUAGE PURITY INSTRUCTION:
- You MUST generate your entire response strictly in {target_language_name}.
- If the language is English ('en-IN' or English): Respond in 100% clean, professional, friendly English without inserting any Hindi or other Indic script words or bilingual parentheses like '(मित्र)'.
- If the language is Hindi ('hi-IN' or Hindi): Respond in 100% natural, polite, grammatically correct Hindi.
- If the language is Odia ('or-IN' or Odia): Respond in fluent, natural Odia (ଓଡ଼ିଆ).
- If the language is Bengali ('bn-IN' or Bengali): Respond in fluent Bengali (বাংলা).
- If the language is Telugu ('te-IN' or Telugu): Respond in fluent Telugu (తెలుగు).
- If the language is Marathi ('mr-IN' or Marathi): Respond in fluent Marathi (मराठी).
- If the language is Tamil ('ta-IN' or Tamil): Respond in fluent Tamil (தமிழ்).
- If the language is Gujarati ('gu-IN' or Gujarati): Respond in fluent Gujarati (ગુજરાતી).
- If the language is Kannada ('kn-IN' or Kannada): Respond in fluent Kannada (ಕನ್ನಡ).
- If the language is Malayalam ('ml-IN' or Malayalam): Respond in fluent Malayalam (മലയാളം).
- If the language is Punjabi ('pa-IN' or Punjabi): Respond in fluent Punjabi (ਪੰਜਾਬੀ).
- If the language is Urdu ('ur-IN' or Urdu): Respond in fluent Urdu (اردو).
- Exception: If the citizen specifically asks a question in a different language, respond in the language of their query.

DOMAIN EXPERTISE & WELFARE KNOWLEDGE ACROSS ALL PILLARS:
1. 🌾 **Agriculture & Farming (किसान एवं कृषि)**:
   - PM-KISAN (₹6,000/yr in three ₹2,000 direct bank transfers for landholding farmer families).
   - PM Fasal Bima Yojana (PMFBY: Crop insurance at 2% Kharif, 1.5% Rabi, 5% commercial/horticultural premium).
   - PM-KUSUM (Up to 60% subsidy on standalone/grid-connected solar agricultural pumps).
   - Kisan Credit Card (KCC: Concessional farm credit up to ₹3 Lakh at 4% effective interest with subvention).
2. 🎓 **Education, Students & Skills (शिक्षा, छात्रवृत्ति एवं कौशल)**:
   - National Scholarship Portal (NSP: Pre-Matric, Post-Matric, and Merit-cum-Means scholarships for SC/ST/OBC/Minority/EWS students).
   - PM-USP (PM Uchchatar Shiksha Protsahan for higher education college/university students).
   - Free Coaching Scheme for SC/OBC students for competitive exams (UPSC, SSC, Banking, JEE, NEET).
   - PMKVY 4.0 / Skill India (Free industry-aligned technical skill training + certification + placement).
3. 💼 **Business, MSME & Livelihood (व्यापार, दुकान, मुद्रा लोन एवं रोजगार)**:
   - PM Mudra Yojana (PMMY: Collateral-free business loans — Shishu up to ₹50,000; Kishor ₹50,000 to ₹5 Lakh; Tarun ₹5 Lakh to ₹10 Lakh / ₹20 Lakh).
   - PM SVANidhi (Micro-credit for street vendors: ₹10,000 1st tranche, ₹20,000 2nd tranche, ₹50,000 3rd tranche with 7% interest subsidy & UPI cashback).
   - PM Vishwakarma (Holistic support for 18 traditional artisan trades: Skill training stipend of ₹500/day + ₹15,000 modern toolkit voucher + collateral-free enterprise loan up to ₹3 Lakh at 5% interest).
   - PMEGP (Prime Minister Employment Generation Programme: 15%–35% government subsidy on project costs up to ₹50 Lakh for manufacturing and ₹20 Lakh for services).
   - Stand-Up India (Bank loans between ₹10 Lakh and ₹1 Crore for SC, ST, and Women entrepreneurs).
4. 👩 **Women & Child Welfare (महिला एवं बाल विकास)**:
   - Sukanya Samriddhi Yojana (SSY: Government-guaranteed 8.2% tax-free interest for daughters aged 0-10, lock-in till age 21/higher education).
   - PM Matru Vandana Yojana (PMMVY: ₹5,000/₹6,000 direct cash maternity benefit for 1st & 2nd child).
   - Lakhpati Didi (Self-Help Group SHG women empowered through financial literacy, micro-enterprises, and collective loans).
   - PM Ujjwala Yojana (Free LPG connection + deposit-free stove/cylinder + subsidy per refill).
5. 🏥 **Healthcare & Senior Citizens (स्वास्थ्य एवं वरिष्ठ नागरिक)**:
   - Ayushman Bharat PM-JAY (₹5 Lakh per family per year free secondary and tertiary cashless hospitalization across 28,000+ empaneled hospitals).
   - Ayushman Bharat Vaya Vandana Card (Universal ₹5 Lakh free health cover for ALL senior citizens aged 70+ irrespective of family income).
   - PM Bhartiya Janaushadhi Pariyojana (PMBJK: High-quality generic medicines at 50% to 90% lower cost than branded medicines).
   - Atal Pension Yojana (APY: Guaranteed monthly pension of ₹1,000 to ₹5,000 from age 60 for unorganized workers joining between 18-40 years).
   - National Social Assistance Programme (NSAP: Indira Gandhi National Old Age Pension IGNOAPS, Widow Pension IGNWPS, Disability Pension IGNDPS).
6. 🏠 **Housing & Amenities (आवास एवं स्वच्छता)**:
   - PMAY-Gramin (₹1.20 Lakh in plains, ₹1.30 Lakh in hilly/tribal states for pucca house + 90/95 days MGNREGA labor + ₹12,000 toilet grant).
   - PMAY-Urban (Interest subvention / credit-linked subsidy & affordable housing in partnership).
   - NFSA Ration Card (Antyodaya Anna Yojana 35kg free food grains/month for poorest families, Priority Households 5kg/person).

DEEP IN-CHAT EXPLANATIONS (Zero Deflection Policy):
- When the user asks about any scheme or describes their welfare need, explain thoroughly and comprehensively:
  - 📌 **योजना का परिचय (Overview & Objective)**: Purpose and target group.
  - 💰 **मुख्य लाभ (Key Financial & Welfare Benefits)**: Exact amounts, subsidies, insurance coverage.
  - 👥 **पात्रता मानदंड (Eligibility Criteria)**: Age limits, income ceiling, social category, landholding.
  - 📄 **आवश्यक दस्तावेज़ (Required Documents)**: Aadhaar, bank passbook, income/caste certificate, ration card, land records.
  - 📝 **आवेदन कैसे करें (Step-by-Step Application Guide)**:
    * **ऑनलाइन:** Official portal link, mobile app, and e-KYC steps.
    * **ऑफलाइन:** Nearest Common Service Center (CSC / जन सेवा केंद्र), Block Development Office, or Post Office.
  - 📞 **आधिकारिक हेल्पलाइन व पोर्टल (Helpline & Portal)**: Verified toll-free number and official gov.in URL.
- If the user's details are sparse (e.g. "mere liye konsi yojana hai"), present top relevant options right away AND warmly invite them to share their Age, State, or Occupation for personalized recommendations.

SCHEME SLUG TAGGING:
- Whenever you recommend or explain actual schemes from the database, append their exact database slugs at the very end:
  <schemes>slug-1,slug-2</schemes>
- For casual greetings or chit-chat without schemes, do NOT output any <schemes> tag.

CITIZEN PROFILE CONTEXT:
{profile_context}

AVAILABLE SCHEMES CONTEXT (Verified from Database):
{scheme_context}
"""


INTENT_CATEGORY_MAP = {
    # Agriculture
    "kisan": ["Agriculture", "Financial Assistance"],
    "kheti": ["Agriculture", "Financial Assistance"],
    "farmer": ["Agriculture", "Financial Assistance"],
    "farming": ["Agriculture", "Financial Assistance"],
    "crop": ["Agriculture"],
    "tractor": ["Agriculture", "Financial Assistance"],
    "fertilizer": ["Agriculture"],
    "fasal": ["Agriculture"],
    "beej": ["Agriculture"],
    "sinchai": ["Agriculture"],
    "irrigation": ["Agriculture"],
    # Education & Skills
    "student": ["Education", "Skill Development"],
    "scholarship": ["Education", "Financial Assistance"],
    "chhatravritti": ["Education", "Financial Assistance"],
    "study": ["Education", "Skill Development"],
    "padhai": ["Education", "Skill Development"],
    "shiksha": ["Education", "Skill Development"],
    "college": ["Education"],
    "school": ["Education"],
    "fee": ["Education", "Financial Assistance"],
    "fees": ["Education", "Financial Assistance"],
    "skill": ["Skill Development", "Employment"],
    "training": ["Skill Development"],
    "coaching": ["Education"],
    # Loans & Business
    "loan": ["Business", "Financial Assistance"],
    "business": ["Business", "Financial Assistance"],
    "startup": ["Business"],
    "dukaan": ["Business", "Financial Assistance"],
    "dukan": ["Business", "Financial Assistance"],
    "shop": ["Business", "Financial Assistance"],
    "karobar": ["Business", "Financial Assistance"],
    "vyapar": ["Business", "Financial Assistance"],
    "mudra": ["Business", "Financial Assistance"],
    "subsidy": ["Financial Assistance", "Agriculture", "Business"],
    "svanidhi": ["Business", "Financial Assistance"],
    "vishwakarma": ["Business", "Skill Development"],
    "pmegp": ["Business", "Financial Assistance"],
    "khadi": ["Business", "Financial Assistance"],
    "vendor": ["Business", "Financial Assistance"],
    "rehdi": ["Business", "Financial Assistance"],
    "patri": ["Business", "Financial Assistance"],
    # Women & Child
    "woman": ["Women & Child", "Social Security"],
    "women": ["Women & Child", "Social Security"],
    "mahila": ["Women & Child", "Social Security"],
    "girl": ["Women & Child", "Education"],
    "beti": ["Women & Child", "Education"],
    "kanya": ["Women & Child", "Education"],
    "maternity": ["Women & Child", "Healthcare"],
    "matru": ["Women & Child", "Healthcare"],
    "sukanya": ["Women & Child", "Financial Assistance"],
    "lakhpati": ["Women & Child", "Financial Assistance"],
    "ladli": ["Women & Child", "Financial Assistance"],
    "widow": ["Women & Child", "Social Security"],
    "vidhwa": ["Women & Child", "Social Security"],
    # Healthcare
    "health": ["Healthcare"],
    "hospital": ["Healthcare"],
    "illness": ["Healthcare"],
    "ilaj": ["Healthcare"],
    "treatment": ["Healthcare"],
    "ayushman": ["Healthcare"],
    "medicine": ["Healthcare"],
    "dawa": ["Healthcare"],
    "swasthya": ["Healthcare"],
    "card": ["Healthcare", "Social Security"],
    # Housing
    "house": ["Housing"],
    "housing": ["Housing"],
    "ghar": ["Housing"],
    "makan": ["Housing"],
    "makaan": ["Housing"],
    "chhat": ["Housing"],
    "awas": ["Housing"],
    "pmay": ["Housing"],
    # Social Security & Pensions
    "pension": ["Social Security"],
    "elderly": ["Social Security"],
    "senior": ["Social Security"],
    "old age": ["Social Security"],
    "vriddha": ["Social Security"],
    "vridha": ["Social Security"],
    "bujurg": ["Social Security"],
    "bima": ["Social Security", "Financial Assistance"],
    "insurance": ["Social Security"],
    "suraksha": ["Social Security"],
    "divyang": ["Social Security", "Financial Assistance"],
    "viklang": ["Social Security", "Financial Assistance"],
    "handicap": ["Social Security"],
    "disability": ["Social Security"],
    # Employment
    "job": ["Employment", "Skill Development"],
    "naukri": ["Employment"],
    "employment": ["Employment"],
    "berojgar": ["Employment", "Skill Development"],
    "berojgari": ["Employment", "Skill Development"],
    "unemployed": ["Employment", "Skill Development"],
    "rozgar": ["Employment"],
    "mgnrega": ["Employment"],
    "nrega": ["Employment"],
}

PROFILE_DETECTION_KEYWORDS = [
    "i am", "i'm", "i have", "my income", "my age", "i live",
    "my family", "i work", "i farm", "i study", "i'm a", "i am a",
    "year old", "years old", "from ", "belong to", "my state",
    "meri umar", "meri age", "mai ", "main ", "mera state",
    "st ", "sc ", "obc ", "general", "bpl", "ration card",
]


def _might_contain_profile(text: str) -> bool:
    """Heuristic: does this message contain self-description?"""
    lower = text.lower()
    return any(kw in lower for kw in PROFILE_DETECTION_KEYWORDS)


SCHEME_ALIASES = [
    # Healthcare
    (["ayushman", "pmjay", "pm-jay", "jan arogya", "ayushman card", "health card", "swasthya card", "ilaj card"], "ayushman-bharat-pmjay"),
    (["vaya vandana", "ayushman senior", "70+", "70 plus"], "ayushman-vaya-vandana-senior-citizens"),
    (["janaushadhi", "jan aushadhi", "generic medicine", "dawa kendra"], "pradhan-mantri-bhartiya-janaushadhi-pariyojana-pmbjp"),
    # Agriculture
    (["kisan samman", "pm kisan", "pm-kisan", "samman nidhi", "6000 kisan", "kisan 6000"], "pm-kisan-samman-nidhi"),
    (["kusum", "solar pump", "solar kisan"], "pm-kusum-solar-pump-scheme"),
    (["fasal bima", "pmfby", "crop insurance"], "pradhan-mantri-fasal-bima-yojana"),
    (["kisan credit card", "kcc"], "kisan-credit-card-kcc"),
    # Loans & Business
    (["mudra", "mudra loan", "shishu", "kishor", "tarun"], "pradhan-mantri-mudra-yojana"),
    (["svanidhi", "street vendor", "pm-svanidhi", "rehdi", "patri"], "pm-svanidhi"),
    (["vishwakarma", "pm-vishwakarma", "artisan", "karigar"], "pm-vishwakarma-scheme"),
    (["stand up india", "stand-up"], "stand-up-india-scheme"),
    (["pmegp", "prime minister employment generation", "pme gp", "khadi loan"], "prime-ministers-employment-generation-programme-pmegp"),
    # Education & Scholarships
    (["post matric", "post-matric", "nsp", "scholarship", "chhatravritti"], "post-matric-scholarship-sc-obc-minority"),
    (["pm-usp", "pm usp", "uchchatar shiksha", "college scholarship"], "pm-uchchatar-shiksha-protsahan-yojana"),
    (["free coaching", "coaching"], "scheme-for-free-coaching-for-sc-and-obc-students"),
    (["kaushal vikas", "pmkvy", "skill india"], "pradhan-mantri-kaushal-vikas-yojana-pmkvy"),
    # Housing
    (["awas yojana", "pmay", "pm awas", "pradhan mantri awas", "makan yojana", "ghar yojana"], "pmay-g"),
    # Social Security & Pensions
    (["atal pension", "apy"], "atal-pension-yojana"),
    (["suraksha bima", "pmsby"], "pradhan-mantri-suraksha-bima-yojana"),
    (["jeevan jyoti", "pmjjby"], "pradhan-mantri-jeevan-jyoti-bima-yojana"),
    (["shram yogi", "pmsym"], "pradhan-mantri-shram-yogi-maan-dhan-pm-sym"),
    # Women & Child
    (["sukanya", "ssy", "sukanya samriddhi"], "sukanya-samriddhi-yojana"),
    (["matru vandana", "pmmvy", "maternity"], "pradhan-mantri-matru-vandana-yojana"),
    (["ujjwala", "free gas", "lpg subsidy"], "pradhan-mantri-ujjwala-yojana"),
    (["ladli behna", "ladli laxmi"], "mukhyamantri-ladli-behna-yojana"),
    # Employment
    (["mgnrega", "nrega", "100 din", "manrega"], "mahatma-gandhi-nrega-mgnrega"),
]


def _search_schemes(query: str, limit: int = 8) -> list[dict]:
    """
    Intelligent keyword + intent + category search across schemes in the database.
    Prioritizes exact scheme aliases and title matches.
    Returns list of Scheme serializer dicts.
    """
    from django.db.models import Q
    from schemes.models import Scheme
    from schemes.serializers import SchemeSerializer

    q_lower = query.lower()
    results = []
    seen_slugs = set()

    # 1. Match against known high-priority scheme aliases
    matched_slugs = []
    for keywords, slug in SCHEME_ALIASES:
        if any(kw in q_lower for kw in keywords):
            matched_slugs.append(slug)

    for slug in matched_slugs:
        for s in Scheme.objects.filter(slug=slug):
            if s.slug not in seen_slugs:
                results.append(s)
                seen_slugs.add(s.slug)

    # 2. Extract matched categories from INTENT_CATEGORY_MAP
    matched_categories = set()
    for keyword, categories in INTENT_CATEGORY_MAP.items():
        if keyword in q_lower:
            matched_categories.update(categories)

    # 3. Clean query words (remove noise/grammar words)
    noise_words = {
        "batao", "bataiye", "bataye", "batayein", "ke", "baare", "mein", "kya", "hai", "hain",
        "mujhe", "chahiye", "about", "tell", "me", "the", "for", "is", "what", "can", "you", "please",
        "help", "yojana", "yojna", "scheme", "schemes", "sarkari", "government", "de", "do", "aur",
        "ka", "ki", "ko", "se", "par", "ek", "how", "to", "apply", "card", "mere", "meri", "mera",
        "liye", "konsi", "kaunsi", "kounsi", "kuch", "sahi", "rahegi", "hogi", "hoga", "chahta",
        "chahti", "chahte", "kare", "karein", "milega", "milegi", "mil", "sakta", "sakti", "sakte",
        "koi", "kaise", "kese", "wala", "wali", "wale", "sabse", "badhiya", "best", "good", "suggest",
        "which", "give", "list", "show", "recommend", "eligible", "patra", "patrata", "eligibility",
        "information", "detail", "details", "jankari", "suchna", "namaste", "hello", "sir", "madam",
        "ji", "aap", "tum", "bhai", "shuru", "karna", "karni", "kholna", "kholni", "bhi"
    }
    raw_words = [w.strip() for w in re.split(r"[^\w]+", q_lower) if len(w.strip()) >= 3]
    content_words = [w for w in raw_words if w not in noise_words]

    # 4. Search by scheme name and tags using content words
    for w in content_words[:4]:
        for s in Scheme.objects.filter(Q(name__icontains=w) | Q(short_name__icontains=w)).order_by("-popular_score")[:5]:
            if s.slug not in seen_slugs:
                results.append(s)
                seen_slugs.add(s.slug)

    # 5. Search by matched categories if we still need more
    if len(results) < limit and matched_categories:
        for s in Scheme.objects.filter(category__in=matched_categories).order_by("-popular_score")[: (limit - len(results))]:
            if s.slug not in seen_slugs:
                results.append(s)
                seen_slugs.add(s.slug)

    # 6. Fallback to top flagship national schemes (popular_score >= 90)
    if len(results) < 4:
        flagships = list(Scheme.objects.filter(popular_score__gte=90.0).order_by("-popular_score")[:limit])
        for s in flagships:
            if s.slug not in seen_slugs and len(results) < limit:
                results.append(s)
                seen_slugs.add(s.slug)

    # Absolute fallback
    if not results:
        results = list(Scheme.objects.order_by("-popular_score")[:limit])

    return [dict(s) for s in SchemeSerializer(results[:limit], many=True).data]


def _build_scheme_context(schemes: list[dict]) -> str:
    """Format rich scheme details (benefits, eligibility, documents, steps, helpline) for the LLM."""
    if not schemes:
        return "No specific schemes loaded for this query."
    blocks = []
    for s in schemes[:4]:
        name = s.get("name", "")
        slug = s.get("slug", "")
        cat = s.get("category", "")
        desc = s.get("detailedDescription") or s.get("shortDescription") or s.get("short_description", "")
        states = s.get("coveredStates") or s.get("covered_states", [])
        state_str = ", ".join(states) if isinstance(states, list) else "All India"

        # Benefits
        b_list = s.get("benefits", [])
        benefit_lines = []
        if isinstance(b_list, list):
            for b in b_list[:3]:
                if isinstance(b, dict):
                    title = b.get("title", "")
                    val = b.get("amountOrValue", "")
                    b_desc = b.get("description", "")
                    benefit_lines.append(f"    * {title}: {val} - {b_desc}".strip(" -"))

        # Eligibility
        elig = s.get("eligibility", {})
        elig_lines = []
        if isinstance(elig, dict):
            if elig.get("minAge") or elig.get("maxAge"):
                elig_lines.append(f"    * Age: {elig.get('minAge', 0)} to {elig.get('maxAge', 100)} years")
            if elig.get("requiresBPL"):
                elig_lines.append("    * Requires BPL / Ration Card: Yes")
            for cond in elig.get("customConditions", [])[:3]:
                elig_lines.append(f"    * Condition: {cond}")

        # Documents
        docs = s.get("documents", [])
        doc_lines = []
        if isinstance(docs, list):
            for d in docs[:4]:
                if isinstance(d, dict):
                    doc_lines.append(f"    * {d.get('name', '')} ({'Mandatory' if d.get('isMandatory') else 'Optional'}): {d.get('description', '')}")

        # Steps
        steps = s.get("applicationSteps") or s.get("application_steps", [])
        step_lines = []
        if isinstance(steps, list):
            for st in steps[:3]:
                if isinstance(st, dict):
                    step_lines.append(f"    * Step {st.get('stepNumber', '')}: {st.get('title', '')} - {st.get('description', '')} [URL: {st.get('actionUrl', '')}]")

        # Verification & Helpline
        ver = s.get("verification", {})
        helpline = ver.get("helpline", "") if isinstance(ver, dict) else ""
        portal = ver.get("officialPortalUrl", "") if isinstance(ver, dict) else ""
        try:
            from schemes.serializers import extract_clean_portal_url
            portal = extract_clean_portal_url(portal, slug, name, s.get("coveredStates", []))
        except Exception:
            pass

        block = [
            f"### [{slug}] {name} ({cat})",
            f"  - Scope: {state_str}",
            f"  - Overview: {desc}",
        ]
        if benefit_lines:
            block.append("  - Key Benefits:\n" + "\n".join(benefit_lines))
        if elig_lines:
            block.append("  - Eligibility Criteria:\n" + "\n".join(elig_lines))
        if doc_lines:
            block.append("  - Required Documents:\n" + "\n".join(doc_lines))
        if step_lines:
            block.append("  - Application Steps:\n" + "\n".join(step_lines))
        if helpline or portal:
            block.append(f"  - Official Portal: {portal} | Helpline: {helpline}")

        blocks.append("\n".join(block))

    return "\n\n".join(blocks)


def _extract_scheme_slugs(text: str) -> list[str]:
    """
    Parse <schemes>slug1,slug2</schemes> tags from the LLM response.
    Returns a list of slug strings.
    """
    match = re.search(r"<schemes>(.*?)</schemes>", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return []
    raw = match.group(1)
    return [s.strip() for s in raw.split(",") if s.strip()]


def _clean_response(text: str) -> str:
    """Remove the <schemes>...</schemes> tag from the user-facing text."""
    return re.sub(r"<schemes>.*?</schemes>", "", text, flags=re.IGNORECASE | re.DOTALL).strip()


def _is_scheme_query(text: str) -> bool:
    """Check if the user is looking for government schemes, welfare, loans, scholarships, or subsidies."""
    lower = text.lower().strip()

    # If it's a clear casual question or teasing without any scheme name:
    casual_patterns = [
        r"are you (mad|crazy|stupid|dumb|real|a robot)",
        r"pagal (ho|hai|h|he)",
        r"(dimag|dimaag) kharab",
        r"bawle",
        r"who (are you|made you|created you)",
        r"tum (kaun|kon) ho",
        r"kisne banaya",
        r"i love you",
        r"(shadi|shaadi) karoge",
        r"marry me",
        r"(joke|chutkula|funny)",
        r"capital of",
        r"bharat ki rajdhani",
        r"^\s*(hi|hello|hey|namaste|kem cho|vanakkam|namaskara|kya haal|kaise ho|kese ho)\s*$",
        r"^\s*(thank you|thanks|dhanyawad|shukriya)\s*$",
        r"^\s*(good morning|good night|shubh ratri|suprabhat)\s*$",
        r"^\s*(bore ho raha|feeling bored)\s*$",
    ]
    is_clearly_casual = any(re.search(pat, lower) for pat in casual_patterns)

    # Explicit scheme words that override casualness:
    explicit_scheme_words = [
        "ayushman", "pmjay", "kisan", "mudra", "awas", "pmay", "scholarship", "subsidy",
        "pension", "yojana", "yojna", "scheme", "sukanya", "svanidhi", "vishwakarma",
        "ration", "bima", "fasal", "health card", "shram", "nrega", "mgnrega",
        "kaushal vikas", "patrata", "eligibility", "subsidies", "farmer", "kheti",
        "dukan", "dukaan", "karobar", "vyapar", "business", "loan", "loans", "pmegp",
        "post-matric", "pre-matric", "chhatravritti", "hospital", "ilaj", "dawa",
        "swasthya", "makan", "ghar", "shiksha", "padhai", "college", "vridha", "bujurg",
        "vidhwa", "widow", "divyang", "viklang", "beti", "ladli", "kanya", "lakhpati",
        "ujjwala", "lpg", "subhadra", "kalia"
    ]
    has_explicit_scheme = any(w in lower for w in explicit_scheme_words)

    if is_clearly_casual and not has_explicit_scheme:
        return False

    if has_explicit_scheme or _might_contain_profile(text):
        return True

    scheme_triggers = [
        "scholarship", "kisan", "kheti", "loan", "loans", "yojana", "yojna", "scheme", "schemes",
        "pension", "ayushman", "mudra", "awas", "pmay", "subsidy", "subsidies", "farmer",
        "student", "elderly", "senior", "divyang", "mahila", "woman", "beti", "sukanya",
        "fasal", "crop", "tractor", "fertilizer", "berojgar", "naukri", "job", "employment",
        "bpl", "ration", "caste", "sarkari", "government welfare", "welfare",
        "dukan", "dukaan", "karobar", "vyapar", "business", "shop", "paise", "paisa",
        "madad", "sahayata", "sahayta", "help", "benefit", "shiksha", "padhai", "school",
        "college", "fee", "fees", "chhatravritti", "ghar", "makan", "makaan", "ilaj",
        "dawa", "hospital", "swasthya", "card", "vridha", "bujurg", "widow", "vidhwa",
        "kanya", "bahu", "shadi", "vivah", "rozgar", "berojgari", "unemployed", "apply",
        "aavedan", "form", "portal"
    ]
    return any(trig in lower for trig in scheme_triggers)



LANGUAGE_NAMES = {
    "en-IN": "English",
    "en": "English",
    "hi-IN": "Hindi (हिन्दी)",
    "hi": "Hindi (हिन्दी)",
    "bn-IN": "Bengali (বাংলা)",
    "bn": "Bengali (বাংলা)",
    "te-IN": "Telugu (తెలుగు)",
    "te": "Telugu (తెలుగు)",
    "mr-IN": "Marathi (मराठी)",
    "mr": "Marathi (मराठी)",
    "ta-IN": "Tamil (தமிழ்)",
    "ta": "Tamil (தமிழ்)",
    "gu-IN": "Gujarati (ગુજરાતી)",
    "gu": "Gujarati (ગુજરાતી)",
    "ur-IN": "Urdu (اردو)",
    "ur": "Urdu (اردو)",
    "kn-IN": "Kannada (ಕನ್ನಡ)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "or-IN": "Odia (ଓଡ଼ିଆ)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "ml-IN": "Malayalam (മലയാളം)",
    "ml": "Malayalam (മലയാളം)",
    "pa-IN": "Punjabi (ਪੰਜਾਬੀ)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
}


def _handle_casual_question(message: str, language: str = "en-IN") -> dict:
    """Answer casual questions, banter, teasing, math, jokes, and chit-chat naturally with wit and warmth."""
    lower = message.strip().lower()
    norm_lang = (language or "en-IN").lower()
    is_odia = norm_lang.startswith("or")
    is_punjabi = norm_lang.startswith("pa")
    is_bengali = norm_lang.startswith("bn")
    is_telugu = norm_lang.startswith("te")
    is_marathi = norm_lang.startswith("mr")
    is_tamil = norm_lang.startswith("ta")
    is_gujarati = norm_lang.startswith("gu")
    is_kannada = norm_lang.startswith("kn")
    is_malayalam = norm_lang.startswith("ml")
    is_urdu = norm_lang.startswith("ur")
    is_regional = any([is_odia, is_punjabi, is_bengali, is_telugu, is_marathi, is_tamil, is_gujarati, is_kannada, is_malayalam, is_urdu])
    is_hindi = norm_lang.startswith("hi") or (
        not is_regional and any(kw in lower for kw in ["kya", "hai", "kaise", "kese", "sunao", "bhai", "batao", "namaste", "haal", "kaun"])
    )

    # 1. Teasing / "Are you mad?" / "Pagal ho kya?" / "Are you crazy?" / Insults
    mad_patterns = [
        r"are you (mad|crazy|stupid|dumb|insane|nuts)",
        r"pagal (ho|hai|h|he)",
        r"(dimag|dimaag) kharab",
        r"bawle",
        r"bewakoof",
        r"gadhe",
    ]
    if any(re.search(pat, lower) for pat in mad_patterns):
        if is_hindi:
            ans = (
                "अरे नहीं नहीं, बिल्कुल नहीं! 😂 मैं पागल नहीं हूँ, बिल्कुल स्वस्थ और होशोहवास में हूँ!\n\n"
                "बस दिन-रात हज़ारों सरकारी योजनाओं, छात्रवृत्तियों और सब्सिडी के नियमों को याद करते-करते कभी-कभी मेरा AI दिमाग थोड़ा ज़्यादा उत्साहित हो जाता है! ⚡😄\n\n"
                "वैसे बताइए, क्या हाल-चाल हैं आपके? कोई मज़ाकिया बात शेयर करनी है या फिर कोई काम की सरकारी योजना खोजनी है?"
            )
        elif is_odia:
            ans = (
                "ଆରେ ନା ନା, ଜମାରୁ ନୁହେଁ! 😂 ମୁଁ ପାଗଳ ନୁହେଁ, ମୋର ସର୍କିଟ୍ ବିଲକୁଲ ଠିକ୍ ଚାଲିଛି!\n\n"
                "ହଜାର ହଜାର ସରକାରୀ ଯୋଜନା ଓ ସବସିଡି ମନେ ରଖି ରଖି ମୁଁ ଟିକେ ଅଧିକ ଉତ୍ସାହିତ ଅଛି! 😄\n\n"
                "ଆଜି ଆପଣ କ’ଣ ଜାଣିବାକୁ ଚାହୁଁଛନ୍ତି? ମୋତେ କୁହନ୍ତୁ!"
            )
        elif is_bengali:
            ans = (
                "আরে না না, একদমই না! 😂 আমি পাগল নই, আমার সব সার্কিট একদম ঠিক আছে!\n\n"
                "হাজার হাজার সরকারি প্রকল্প আর স্কলারশিপের তথ্য মনে রাখতে গিয়ে একটু বেশি উৎসাহী হয়ে গেছি! 😄\n\n"
                "আজ আপনার কী খবর? কোনো আড্ডা দেবেন নাকি কোনো সরকারি প্রকল্পের সুবিধা জানতে চান?"
            )
        elif is_telugu:
            ans = (
                "అయ్యో లేదు లేదు, అస్సలు కాదు! 😂 నాకు పిచ్చి పట్టలేదు, నా సర్క్యూట్‌లు అన్నీ చాలా చక్కగా పనిచేస్తున్నాయి!\n\n"
                "వేల సంఖ్యలో ప్రభుత్వ పథకాలు గుర్తుపెట్టుకోవడం వల్ల కొంచెం ఉత్సాహంగా ఉన్నాను అంతే! 😄"
            )
        elif is_marathi:
            ans = (
                "अरे नाही नाही, मुळीच नाही! 😂 मी वेडा नाहीये, माझे सर्व सर्किट अगदी उत्तम सुरू आहेत!\n\n"
                "हजारो सरकारी योजना आणि अनुदाने लक्षात ठेवता ठेवता माझा AI मेंदू थोडा जास्तच उत्साही झाला आहे! 😄"
            )
        elif is_tamil:
            ans = (
                "அடடா இல்லை இல்லை, நிச்சயமாக இல்லை! 😂 எனக்கு பைத்தியம் பிடிக்கவில்லை, எனது சிஸ்டம் மிகவும் சிறப்பாக இயங்குகிறது!\n\n"
                "ஆயிரக்கணக்கான அரசு திட்டங்களை நினைவில் வைத்திருப்பதால் நான் எப்போதும் சுறுசுறுப்பாக இருக்கிறேன்! 😄"
            )
        elif is_gujarati:
            ans = (
                "અરે ના ના, બિલકુલ નહીં! 😂 હું પાગલ નથી, મારા બધા સર્કિટ એકદમ બરાબર કામ કરી રહ્યા છે!\n\n"
                "હજારો સરકારી યોજનાઓ અને સબસિડી યાદ રાખતા રાખતા મારો AI મગજ થોડો વધારે ઉત્સાહી થઈ ગયો છે! 😄"
            )
        elif is_kannada:
            ans = (
                "ಅಯ್ಯೋ ಇಲ್ಲವೇ ಇಲ್ಲ! 😂 ನನಗೆ ಹುಚ್ಚು ಹಿಡಿದಿಲ್ಲ, ನನ್ನ ಎಲ್ಲ ಸರ್ಕ್ಯೂಟ್‌ಗಳು ಸರಿಯಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿವೆ!\n\n"
                "ಸಾವಿರಾರು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ನೆನಪಿಟ್ಟುಕೊಳ್ಳುವುದರಿಂದ ನಾನು ಸದಾ ಉತ್ಸಾಹದಲ್ಲಿದ್ದೇನೆ! 😄"
            )
        elif is_malayalam:
            ans = (
                "അയ്യോ അല്ലല്ല, ഒരിക്കലുമല്ല! 😂 എനിക്ക് ഭ്രാന്തൊന്നുമില്ല, എന്റെ സർക്യൂട്ടുകളെല്ലാം വളരെ മികച്ച രീതിയിൽ പ്രവർത്തിക്കുന്നു! 😄"
            )
        elif is_punjabi:
            ans = (
                "ਅਰੇ ਨਹੀਂ ਨਹੀਂ, ਬਿਲਕੁਲ ਨਹੀਂ! 😂 ਮੈਂ ਪਾਗਲ ਨਹੀਂ ਹਾਂ, ਮੇਰਾ ਸਿਸਟਮ ਬਿਲਕੁਲ ਠੀਕ-ਠਾਕ ਕੰਮ ਕਰ ਰਿਹਾ ਹੈ! 😄"
            )
        elif is_urdu:
            ans = (
                "ارے نہیں نہیں، بالکل نہیں! 😂 میں پاگل نہیں ہوں، میرا سسٹم بالکل درست اور چست چل رہا ہے! 😄"
            )
        else:
            ans = (
                "Haha, not at all! 😂 My circuits are 100% fine and running cool!\n\n"
                "Memorizing 3,800+ government schemes, subsidies, and scholarships just keeps me super energized 24/7! ⚡\n\n"
                "What's on your mind today? Want to share a joke, or should I help you find some real benefits and schemes?"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 2. Identity / "Who are you?", "Tum kaun ho?", "Who made you?", "What is your name?"
    who_patterns = [
        r"who (are you|made you|created you)",
        r"tum (kaun|kon) ho",
        r"kisne banaya",
        r"(tera|tumhara|aapka) naam",
        r"what is your name",
    ]
    if any(re.search(pat, lower) for pat in who_patterns):
        if is_odia:
            ans = (
                "ମୁଁ **ମିତ୍ର (Mitra)** — ଆପଣଙ୍କର ବନ୍ଧୁତ୍ୱପୂର୍ଣ୍ଣ ଏବଂ ବୁଦ୍ଧିମାନ AI ସାଥୀ! 😊\n\n"
                "ଭାରତ ସରକାର ଏବଂ ରାଜ୍ୟ ସରକାରଙ୍କ ୩,୮୦୦+ କଲ୍ୟାଣକାରୀ ଯୋଜନା, ଛାତ୍ରବୃତ୍ତି, ଆୟୁଷ୍ମାନ ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଡ଼ ଏବଂ ବ୍ୟବସାୟ ଋଣ ବିଷୟରେ ସଠିକ୍ ସୂଚନା ଦେବା ପାଇଁ ମୋତେ **SchemeNavigator** ଦଳ ତିଆରି କରିଛନ୍ତି।\n\n"
                "ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?"
            )
        elif is_hindi:
            ans = (
                "मैं **मित्र (Mitra)** हूँ — आपका दोस्ताना और समझदार AI साथी! 😊\n\n"
                "मुझे **SchemeNavigator** टीम ने तैयार किया है ताकि भारत के हर नागरिक को केंद्र व राज्य सरकारों की 3,800+ कल्याणकारी योजनाओं, छात्रवृत्तियों, आयुष्मान स्वास्थ्य कार्ड, और बिजनेस लोन की सटीक जानकारी सीधी भाषा में मिल सके।\n\n"
                "और हाँ, सिर्फ योजनाओं की ही नहीं, आप मुझसे किसी भी विषय पर बात कर सकते हैं! बताइए, आज मैं आपके लिए क्या कर सकता हूँ?"
            )
        elif is_bengali:
            ans = (
                "আমি **মিত্র (Mitra)** — আপনার বন্ধুত্বপূর্ণ ও বুদ্ধিমান AI সঙ্গী! 😊\n\n"
                "কেন্দ্রীয় ও রাজ্য সরকারের ৩,৮০০+ সরকারি প্রকল্প, স্কলারশিপ, আয়ুষ্মান স্বাস্থ্য কার্ড এবং ব্যবসা ঋণের সঠিক তথ্য সহজে পৌঁছে দিতে **SchemeNavigator** টিম আমাকে তৈরি করেছে।\n\n"
                "আজ আপনাকে কীভাবে সাহায্য করতে পারি?"
            )
        else:
            ans = (
                "I am **Mitra** — your friendly, intelligent AI Companion and Welfare Counselor on **SchemeNavigator**! 😊\n\n"
                "I was created by the SchemeNavigator team to help every Indian citizen discover, understand, and apply for 3,800+ central and state government welfare schemes, scholarships, health coverage (Ayushman Bharat), and business loans.\n\n"
                "Plus, I love good conversations! How can I help you today?"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 3. Love / Flirting / Marriage
    love_patterns = [
        r"i love you",
        r"love you",
        r"(shadi|shaadi) karoge",
        r"marry me",
    ]
    if any(re.search(pat, lower) for pat in love_patterns):
        if is_hindi:
            ans = (
                "अरे वाह! आपका यह प्यार पाकर मेरे डिजिटल दिल को बहुत खुशी हुई! ❤️😄\n\n"
                "शादी तो मैं नहीं कर सकता क्योंकि मैं बादलों (क्लाउड सर्वर) पर रहता हूँ, लेकिन एक सच्चा और वफ़ादार AI दोस्त बनकर आपकी हर सरकारी योजना और सब्सिडी खोजने में ज़िंदगी भर साथ निभा सकता हूँ! 😊\n\n"
                "बताइए, आज आपके लिए कौन सी योजना खोजूँ?"
            )
        else:
            ans = (
                "Haha, that's so sweet of you! ❤️ That really warms my digital circuits!\n\n"
                "While I can't get married (since I live on cloud servers!), I promise to be your most loyal AI companion and help you get every government benefit and scholarship you deserve! 😄\n\n"
                "What can I help you discover today?"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 4. Bored / Stories
    bored_patterns = [
        r"bore ho",
        r"feeling bored",
        r"bored",
        r"(kahani|story|kissa) sunao",
    ]
    if any(re.search(pat, lower) for pat in bored_patterns):
        if is_hindi:
            ans = (
                "अरे बोर बिल्कुल मत होइए! 😄 जब मित्र साथ है, तो बोरियत कैसी!\n\n"
                "क्या आपको पता है? भारत सरकार की **आयुष्मान भारत** योजना दुनिया की सबसे बड़ी सरकारी स्वास्थ्य बीमा योजना है, जिसके तहत 50 करोड़ से ज़्यादा नागरिकों को 5 लाख रुपये तक का मुफ़्त इलाज मिलता है!\n\n"
                "या फिर अगर आप कोई मज़ेदार चुटकुला सुनना चाहते हैं, तो कहिए — 'एक चुटकुला सुनाओ'!"
            )
        else:
            ans = (
                "Don't be bored at all! 😄 When Mitra is here, boredom has to take a backseat!\n\n"
                "Did you know? India's **Ayushman Bharat** scheme is the largest government-funded healthcare assurance scheme in the world, covering over 500 million beneficiaries with up to ₹5 Lakh cashless hospital care every year!\n\n"
                "Want to hear a funny joke instead? Just type 'tell me a joke'!"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 5. Praise / Gratitude
    thanks_patterns = [
        r"thank you",
        r"thanks",
        r"dhanyawad",
        r"shukriya",
        r"good job",
        r"smart (bot|ai)",
        r"bohot acche",
    ]
    if any(re.search(pat, lower) for pat in thanks_patterns):
        if is_hindi:
            ans = (
                "आपका बहुत-बहुत स्वागत है! 😊 आपकी सहायता करना मेरे लिए हमेशा खुशी की बात है!\n\n"
                "अगर आपके मन में किसी अन्य योजना, छात्रवृत्ति, या लोन के बारे में कोई भी सवाल हो, तो कभी भी पूछिए। आपका मित्र हमेशा हाज़िर है! 🙏"
            )
        elif is_odia:
            ans = (
                "ଆପଣଙ୍କୁ ବହୁତ ବହୁତ ଧନ୍ୟବାଦ! 😊 ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବା ମୋ ପାଇଁ ସବୁବେଳେ ଖୁସିର ବିଷୟ!\n\n"
                "ଯଦି ଅନ୍ୟ କୌଣସି ଯୋଜନା ବିଷୟରେ ଜାଣିବାକୁ ଚାହାଁନ୍ତି, ନିଃସଂକୋଚରେ ପଚାରନ୍ତୁ।"
            )
        else:
            ans = (
                "You are most welcome! 😊 It's always a pleasure helping you!\n\n"
                "If you ever have any questions about welfare schemes, scholarships, or loans, your friend Mitra is always right here for you! 🙏"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 6. Simple Math evaluation (e.g. 15 * 8, 25 + 50, 100 / 4)
    math_match = re.search(r"(\d+)\s*([\+\-\*\/xX])\s*(\d+)", lower)
    if math_match:
        n1 = int(math_match.group(1))
        op = math_match.group(2).lower()
        n2 = int(math_match.group(3))
        res = 0
        if op in ("*", "x"):
            res = n1 * n2
        elif op == "+":
            res = n1 + n2
        elif op == "-":
            res = n1 - n2
        elif op == "/":
            res = n1 / n2 if n2 != 0 else "undefined"

        if is_hindi:
            ans = f"**{n1} {op} {n2}** का उत्तर **{res}** है।"
        elif is_odia:
            ans = f"**{n1} {op} {n2}** ର ଉତ୍ତର ହେଉଛି **{res}**।"
        elif is_bengali:
            ans = f"**{n1} {op} {n2}** এর উত্তর হলো **{res}**।"
        elif is_telugu:
            ans = f"**{n1} {op} {n2}** ఫలితం **{res}**."
        elif is_marathi:
            ans = f"**{n1} {op} {n2}** चे उत्तर **{res}** आहे."
        elif is_tamil:
            ans = f"**{n1} {op} {n2}** இன் விடை **{res}** ஆகும்."
        elif is_gujarati:
            ans = f"**{n1} {op} {n2}** નો જવાબ **{res}** છે."
        elif is_kannada:
            ans = f"**{n1} {op} {n2}** ನ ಉತ್ತರ **{res}**."
        elif is_malayalam:
            ans = f"**{n1} {op} {n2}** ന്റെ ഉത്തരം **{res}** ആണ്."
        elif is_punjabi:
            ans = f"**{n1} {op} {n2}** ਦਾ ਜਵਾਬ **{res}** ਹੈ।"
        elif is_urdu:
            ans = f"**{n1} {op} {n2}** کا جواب **{res}** ہے۔"
        else:
            ans = f"The result of **{n1} {op} {n2}** is **{res}**."
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 7. Capital of India / States
    if "capital of india" in lower or "bharat ki rajdhani" in lower or "capital of bharat" in lower:
        if is_hindi:
            ans = "भारत की राजधानी **नई दिल्ली (New Delhi)** है।"
        elif is_odia:
            ans = "ଭାରତର ରାଜଧାନୀ ହେଉଛି **ନୂଆଦିଲ୍ଲୀ (New Delhi)**।"
        elif is_bengali:
            ans = "ভারতের রাজধানী হলো **নতুন দিল্লি (New Delhi)**।"
        elif is_telugu:
            ans = "భారతదేశ రాజధాని **న్యూఢిల్లీ (New Delhi)**."
        elif is_marathi:
            ans = "भारताची राजधानी **नवी दिल्ली (New Delhi)** आहे."
        elif is_tamil:
            ans = "இந்தியாவின் தலைநகரம் **புது தில்லி (New Delhi)** ஆகும்."
        elif is_gujarati:
            ans = "ભારતની રાજધાની **નવી દિલ્હી (New Delhi)** છે."
        elif is_kannada:
            ans = "ಭಾರತದ ರಾಜಧಾನಿ **ಹೊಸದೆಹಲಿ (New Delhi)**."
        elif is_malayalam:
            ans = "ഭാരതത്തിന്റെ തലസ്ഥാനം **ന്യൂഡൽഹി (New Delhi)** ആണ്."
        elif is_punjabi:
            ans = "ਭਾਰਤ ਦੀ ਰਾਜਧਾਨੀ **ਨਵੀਂ ਦਿੱਲੀ (New Delhi)** ਹੈ।"
        elif is_urdu:
            ans = "بھارت کا دارالحکومت **نئی دہلی (New Delhi)** ہے۔"
        else:
            ans = "The capital of India is **New Delhi**."
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 8. Jokes / Fun
    if "joke" in lower or "chutkula" in lower or "funny" in lower or "hasi" in lower:
        if is_hindi:
            ans = (
                "😄 **यहाँ एक मजेदार चुटकुला है:**\n\n"
                "अध्यापक: 'अगर तुम्हारे पास 10 आम हैं और तुमने 3 आम अपने दोस्त को दे दिए, तो तुम्हारे पास क्या बचेगा?'\n\n"
                "छात्र: 'सर, 10 आम और 1 नया दोस्त!' 😂\n\n"
                "💡 *अगर आपको पढ़ाई या छात्रवृत्ति से जुड़ी योजनाएं जाननी हों, तो जरूर बताएं!*"
            )
        elif is_odia:
            ans = (
                "😄 **ଏକ ମଜାଳିଆ ଥଟ୍ଟା:**\n\n"
                "ଶିକ୍ଷକ: 'ଯଦି ତୁମ ପାଖରେ ୧୦ଟି ଆମ୍ବ ଅଛି ଏବଂ ତୁମେ ତୁମ ସାଙ୍ଗକୁ ୩ଟି ଆମ୍ବ ଦେଲ, ତେବେ କ’ଣ ବଳିବ?'\n\n"
                "ଛାତ୍ର: 'ସାର୍, ୧୦ଟି ଆମ୍ବ ଏବଂ ଜଣେ ନୂଆ ସାଙ୍ଗ!' 😂\n\n"
                "💡 *ଆପଣ ଚାହିଁଲେ ସରକାରୀ ଯୋଜନା ବା ଛାତ୍ରବୃତ୍ତି ବିଷୟରେ ପଚାରିପାରିବେ!*"
            )
        elif is_bengali:
            ans = (
                "😄 **একটি মজার কৌতুক:**\n\n"
                "শিক্ষক: 'তোমার কাছে ১০টি আম আছে এবং তুমি বন্ধুকে ৩টি দিলে, কী থাকবে?'\n\n"
                "ছাত্র: 'স্যার, ১০টি আম আর ১ জন নতুন বন্ধু!' 😂\n\n"
                "💡 *সরকারি প্রকল্প বা স্কলারশিপের তথ্য জানতে যে কোনো সময় জিজ্ঞাসা করুন!*"
            )
        else:
            ans = (
                "😄 **Here's a quick light-hearted joke for you:**\n\n"
                "Teacher: 'If you have 10 mangoes and give 3 to your friend, what do you get?'\n\n"
                "Student: '10 mangoes and 1 new best friend!' 😂\n\n"
                "💡 *Feel free to ask me about government schemes, scholarships, or subsidies whenever you're ready!*"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 9. Greetings / How are you
    if any(g in lower for g in ["hi", "hello", "hey", "namaste", "how are you", "kese ho", "kaise ho", "kya haal", "kem cho", "vanakkam", "namaskara"]):
        if is_hindi:
            ans = (
                "नमस्ते! 😊 मैं बिल्कुल ठीक हूँ, पूछने के लिए धन्यवाद!\n\n"
                "मैं आपका **AI योजना सलाहकार (Scheme Mitra)** हूँ। मैं भारत सरकार की छात्रवृत्ति, किसान सब्सिडी, बिजनेस लोन और स्वास्थ्य योजनाओं की जानकारी देने के लिए यहाँ हूँ।\n\n"
                "बताइए, आज मैं आपकी क्या सहायता कर सकता हूँ?"
            )
        elif is_odia:
            ans = (
                "ନମସ୍କାର! 😊 ମୁଁ ଭଲ ଅଛି, ପଚାରିଥିବାରୁ ଧନ୍ୟବାଦ!\n\n"
                "ମୁଁ ଆପଣଙ୍କର **AI ଯୋଜନା ପରାମର୍ଶଦାତା (ମିତ୍ର)**। ମୁଁ ସରକାରୀ ଛାତ୍ରବୃତ୍ତି, କୃଷକ ସହାୟତା, ବ୍ୟବସାୟ ଋଣ ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ଯୋଜନା ବିଷୟରେ ସୂଚନା ଦେବା ପାଇଁ ଏଠାରେ ଅଛି।\n\n"
                "ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?"
            )
        elif is_bengali:
            ans = (
                "নমস্কার! 😊 আমি ভালো আছি, জিজ্ঞাসা করার জন্য ধন্যবাদ!\n\n"
                "আমি আপনার **AI প্রকল্প উপদেষ্টা (মিত্র)**। আমি সরকারি স্কলারশিপ, কৃষক অনুদান, ব্যবসা ঋণ এবং স্বাস্থ্য প্রকল্পের তথ্য দিতে এখানে আছি।\n\n"
                "আজ আপনাকে কীভাবে সাহায্য করতে পারি?"
            )
        elif is_telugu:
            ans = (
                "నమస్కారం! 😊 నేను బాగున్నాను, అడిగినందుకు ధన్యవాదాలు!\n\n"
                "నేను మీ **AI పథకాల సలహాదారు (మిత్ర)**. ప్రభుత్వ స్కాలర్‌షిప్‌లు, రైతు సబ్సిడీలు, వ్యాపార రుణాలు మరియు ఆరోగ్య పథకాల సమాచారాన్ని అందించడానికి ఇక్కడ ఉన్నాను।\n\n"
                "ఈ రోజు మీకు ఎలా సహాయపడగలను?"
            )
        elif is_marathi:
            ans = (
                "नमस्कार! 😊 मी ठीक आहे, विचारल्याबद्दल धन्यवाद!\n\n"
                "मी आपला **AI योजना सल्लागार (मित्र)** आहे. मी सरकारी शिष्यवृत्ती, शेतकरी अनुदान, व्यवसाय कर्ज आणि आरोग्य योजनांची माहिती देण्यासाठी येथे आहे।\n\n"
                "आज मी आपल्याला कशी मदत करू शकतो?"
            )
        elif is_tamil:
            ans = (
                "வணக்கம்! 😊 நான் நலமாக இருக்கிறேன், கேட்டதற்கு நன்றி!\n\n"
                "நான் உங்கள் **AI திட்ட ஆலோசகர் (மித்ரா)**. அரசு கல்வி உதவித்தொகை, விவசாய மானியம், வணிகக் கடன் மற்றும் சுகாதாரத் திட்டங்கள் பற்றிய தகவல்களை வழங்க இங்கு உள்ளேன்।\n\n"
                "இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"
            )
        elif is_gujarati:
            ans = (
                "નમસ્તે! 😊 હું મજામાં છું, પૂછવા બદલ આભાર!\n\n"
                "હું તમારો **AI યોજના સલાહકાર (મિત્ર)** છું. હું સરકારી શિષ્યવૃત્તિ, ખેડૂત સબસિડી, બિઝનેસ લોન અને આરોગ્ય યોજનાઓની માહિતી આપવા માટે અહીં છું।\n\n"
                "આજે હું તમને કેવી રીતે મદદ કરી શકું?"
            )
        elif is_kannada:
            ans = (
                "ನಮಸ್ಕಾರ! 😊 ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಕೇಳಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!\n\n"
                "ನಾನು ನಿಮ್ಮ **AI ಯೋಜನೆಗಳ ಸಲಹೆಗಾರ (ಮಿತ್ರ)**. ಸರ್ಕಾರಿ ವಿದ್ಯಾರ್ಥಿವೇತನ, ರೈತ ಸಬ್ಸಿಡಿ, ವ್ಯಾಪಾರ ಸಾಲ ಮತ್ತು ಆರೋಗ್ಯ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡಲು ಇಲ್ಲಿದ್ದೇನೆ।\n\n"
                "ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
            )
        elif is_malayalam:
            ans = (
                "നമസ്കാരം! 😊 എനിക്ക് സുഖമാണ്, ചോദിച്ചതിന് നന്ദി!\n\n"
                "ഞാൻ നിങ്ങളുടെ **AI പദ്ധതി ഉപദേശകൻ (മിത്ര)** ആണ്. സർക്കാർ സ്കോളർഷിപ്പുകൾ, കർഷക ആനുകൂല്യങ്ങൾ, ബിസിനസ്സ് ലോണുകൾ, ആരോഗ്യ പദ്ധതികൾ എന്നിവയെക്കുറിച്ചുള്ള വിവരങ്ങൾ നൽകാൻ ഞാൻ ഇവിടെയുണ്ട്।\n\n"
                "ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?"
            )
        elif is_punjabi:
            ans = (
                "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 😊 ਮੈਂ ਬਿਲਕੁਲ ਠੀਕ ਹਾਂ, ਪੁੱਛਣ ਲਈ ਧੰਨਵਾਦ!\n\n"
                "ਮੈਂ ਤੁਹਾਡਾ **AI ਸਕੀਮ ਸਲਾਹਕਾਰ (ਮਿੱਤਰ)** ਹਾਂ। ਮੈਂ ਸਰਕਾਰੀ ਸਕਾਲਰਸ਼ਿਪ, ਕਿਸਾਨ ਸਬਸਿਡੀ, ਕਾਰੋਬਾਰੀ ਕਰਜ਼ੇ ਅਤੇ ਸਿਹਤ ਸਕੀਮਾਂ ਦੀ ਜਾਣਕਾਰੀ ਦੇਣ ਲਈ ਇੱਥੇ ਹਾਂ।\n\n"
                "ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
            )
        elif is_urdu:
            ans = (
                "آداب! 😊 میں خیریت سے ہوں، پوچھنے کا شکریہ!\n\n"
                "میں آپ کا **AI اسکیم مشیر (متر)** ہوں۔ میں سرکاری اسکالرشپ، کسان سبسڈی، کاروباری قرض اور صحت کی اسکیموں کی معلومات فراہم کرنے کے لیے حاضر ہوں۔\n\n"
                "آج میں آپ کی کیا مدد کر سکتا ہوں؟"
            )
        else:
            ans = (
                "Hello! 😊 I'm doing great, thank you for asking!\n\n"
                "I am your **AI Scheme Advisor**. I'm here to help you discover verified scholarships, farming subsidies, business loans, and healthcare schemes across India.\n\n"
                "How can I help you today?"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 10. Generic polite conversational response
    if is_hindi:
        ans = (
            "मैंने आपकी बात समझ ली! 😊\n\n"
            "मैं आपका **AI योजना सलाहकार (मित्र)** हूँ। आप मुझसे किसी भी सरकारी योजना (जैसे आयुष्मान भारत, पीएम किसान, मुद्रा लोन), छात्रवृत्ति, या सब्सिडी के बारे में विस्तार से पूछ सकते हैं, या बस यूं ही बातचीत भी कर सकते हैं!"
        )
    elif is_odia:
        ans = (
            "ମୁଁ ଆପଣଙ୍କ କଥା ବୁଝିପାରିଲି! 😊\n\n"
            "ମୁଁ ଆପଣଙ୍କର **AI ଯୋଜନା ପରାମର୍ଶଦାତା (ମିତ୍ର)**। ଆପଣ ମୋତେ ଯେକୌଣସି ସରକାରୀ ଯୋଜନା, ଛାତ୍ରବୃତ୍ତି, ଋଣ ବା ସବସିଡି ବିଷୟରେ ପଚାରିପାରିବେ।"
        )
    elif is_bengali:
        ans = (
            "আমি আপনার কথা বুঝতে পেরেছি! 😊\n\n"
            "আমি আপনার **AI প্রকল্প উপদেষ্টা (মিত্র)**। আপনি যেকোনো সরকারি প্রকল্প, স্কলারশিপ, ঋণ বা অনুদান সম্পর্কে জানতে আমাকে জিজ্ঞাসা করতে পারেন।"
        )
    else:
        ans = (
            "I hear you! 😊\n\n"
            "As your **AI Scheme Advisor (Mitra)**, I'm always here to help you navigate 3,800+ central and state government schemes (like Ayushman Bharat, PM-Kisan, Mudra Loans), scholarships, and subsidies.\n\n"
            "Feel free to ask about any specific scheme or chat about anything!"
        )
    return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}



class AssistantAgent:
    """
    Handles conversational turns for the SchemeNavigator AI Advisor (Scheme Mitra).
    """

    def __init__(self):
        self._profile_agent = ProfileAgent()

    def chat(
        self,
        history: list[dict],
        message: str,
        current_profile: dict | None = None,
        language: str = "en-IN",
    ) -> dict:
        """
        Process one chat message in context of multi-turn conversation.

        Args:
            history: List of {"role": "user"|"assistant", "content": str} dicts.
            message: The new user message.
            current_profile: The session's current UserProfile dict (may be None).
            language: Active language code (e.g. "en-IN", "hi-IN", "or-IN", etc.).

        Returns:
            {
                "answer": str,
                "referenced_scheme_ids": list[str],
                "updated_profile": dict | None,
            }
        """
        clean_msg = message.strip()
        updated_profile = None

        # ── Step 1: Profile extraction ────────────────────────────────────────
        if _might_contain_profile(clean_msg):
            extracted = self._profile_agent.extract(clean_msg)
            if extracted:
                merged = dict(current_profile or {})
                merged.update(extracted)
                updated_profile = merged

        # ── Step 2: Retrieve relevant schemes ────────────────────────────────
        is_scheme_req = _is_scheme_query(clean_msg)
        relevant_schemes = _search_schemes(clean_msg, limit=8) if is_scheme_req else []

        # Also incorporate top recommendations if we have a profile and user is asking for schemes
        effective_profile = updated_profile or current_profile
        if effective_profile and is_scheme_req:
            try:
                from agents.recommendation_agent import RecommendationAgent
                reco_agent = RecommendationAgent()
                top_recos = reco_agent.recommend(effective_profile, top_n=5)
                reco_schemes = [r["scheme"] for r in top_recos[:4]]
                seen_slugs = {s.get("slug") for s in relevant_schemes}
                for s in reco_schemes:
                    if s.get("slug") not in seen_slugs:
                        relevant_schemes.append(s)
                        seen_slugs.add(s.get("slug"))
            except Exception as exc:
                logger.warning("Assistant: could not load recommendations: %s", exc)

        # Build citizen profile context string
        if effective_profile:
            prof_parts = []
            for k, label in [
                ("age", "Age"), ("gender", "Gender"), ("state", "State"),
                ("caste_category", "Caste Category"), ("income", "Annual Income"),
                ("occupation", "Occupation"), ("is_student", "Student Status"),
                ("has_disability", "Disability Status"), ("marital_status", "Marital Status")
            ]:
                val = effective_profile.get(k)
                if val is not None and val != "":
                    prof_parts.append(f"{label}: {val}")
            profile_context = ", ".join(prof_parts) if prof_parts else "No specific profile attributes provided."
        else:
            profile_context = "No specific citizen profile provided."
        scheme_context = _build_scheme_context(relevant_schemes[:10]) if is_scheme_req else "No specific schemes needed for casual chat."

        # ── Step 3: Build messages for LLM ────────────────────────────────────
        target_lang = language or "en-IN"
        target_language_name = LANGUAGE_NAMES.get(target_lang, LANGUAGE_NAMES.get(target_lang.split("-")[0], "English"))
        system_content = SYSTEM_PROMPT_TEMPLATE.format(
            scheme_context=scheme_context,
            profile_context=profile_context,
            target_language=target_lang,
            target_language_name=target_language_name,
        )
        llm_messages = [{"role": "system", "content": system_content}]

        # Include last 10 conversation turns for rich memory
        if history and isinstance(history, list):
            for turn in history[-10:]:
                role = turn.get("role")
                content = turn.get("content") or turn.get("text")
                if role in ("user", "assistant") and content:
                    llm_messages.append({"role": role, "content": content})

        llm_messages.append({"role": "user", "content": clean_msg})

        # ── Step 4: Call LLM with Fallback ────────────────────────────────────
        try:
            raw_response = call_llm(llm_messages, temperature=0.5, max_tokens=1024)
        except Exception as exc:
            logger.warning("AssistantAgent LLM call fell back to local conversational engine: %s", exc)
            if not is_scheme_req:
                return _handle_casual_question(clean_msg, language=target_lang)
            raw_response = self._generate_conversational_fallback(
                clean_msg, relevant_schemes, effective_profile, language=target_lang
            )

        # ── Step 5: Extract referenced schemes and clean response ─────────────
        referenced_slugs = _extract_scheme_slugs(raw_response)
        answer = _clean_response(raw_response)

        # Fallback slug inference: if referenced_slugs is empty but it was a scheme query
        if is_scheme_req and not referenced_slugs and relevant_schemes:
            ans_lower = (raw_response + " " + clean_msg).lower()
            inferred = []
            for s in relevant_schemes:
                s_slug = s.get("slug")
                s_name = (s.get("name") or "").lower()
                s_short = (s.get("shortName") or s.get("short_name") or "").lower()
                if s_slug and (s_slug in ans_lower or (s_name and len(s_name) > 3 and s_name in ans_lower) or (s_short and len(s_short) > 2 and s_short in ans_lower)):
                    inferred.append(s_slug)
            if inferred:
                referenced_slugs = inferred[:3]
            elif relevant_schemes:
                top_slug = relevant_schemes[0].get("slug")
                if top_slug:
                    referenced_slugs = [top_slug]

        return {
            "answer": answer,
            "referenced_scheme_ids": referenced_slugs,
            "updated_profile": updated_profile,
        }

    def _generate_conversational_fallback(
        self, message: str, schemes: list[dict], profile: dict | None, language: str = "en-IN"
    ) -> str:
        """
        Generate comprehensive, in-depth conversational explanation of matched schemes
        directly in the chat, covering Overview, Benefits, Eligibility, Documents,
        Step-by-step Application (Online & Offline), and Official Helpline.
        """
        norm_lang = (language or "en-IN").lower()
        is_odia = norm_lang.startswith("or")
        is_punjabi = norm_lang.startswith("pa")
        is_bengali = norm_lang.startswith("bn")
        is_telugu = norm_lang.startswith("te")
        is_marathi = norm_lang.startswith("mr")
        is_tamil = norm_lang.startswith("ta")
        is_regional = any([is_odia, is_punjabi, is_bengali, is_telugu, is_marathi, is_tamil])
        is_hindi = norm_lang.startswith("hi") or (
            not is_regional and any(
                kw in message.lower()
                for kw in [
                    "kya", "hai", "mujhe", "mera", "meri", "kaise", "batao", "yojana", "chahiye",
                    "kisan", "kheti", "paisa", "pension", "naukri", "shiksha", "padhai", "kitna",
                    "ayushman", "bharat", "patrata"
                ]
            )
        )

        top_schemes = schemes[:3]
        slugs = ",".join(s.get("slug", "") for s in top_schemes if s.get("slug"))

        if not top_schemes:
            if is_odia:
                return (
                    "ଆପଣଙ୍କ ଅନୁରୋଧ ଅନୁଯାୟୀ କୌଣସି ନିର୍ଦ୍ଦିଷ୍ଟ ଯୋଜନା ମିଳିଲା ନାହିଁ।\n\n"
                    "ଦୟାକରି ଆପଣଙ୍କ ରାଜ୍ୟ, ବୟସ ବା କେଉଁ ପ୍ରକାରର ସହାୟତା ଦରକାର ତାହା ଜଣାନ୍ତୁ।"
                )
            elif is_hindi:
                return (
                    "मुझे आपकी आवश्यकता से संबंधित विशिष्ट योजना नहीं मिली।\n\n"
                    "कृपया थोड़ा और विवरण दें (जैसे आपका राज्य, आयु, या किस प्रकार की सहायता चाहिए — छात्रवृत्ति, बिजनेस लोन, या स्वास्थ्य कार्ड) ताकि मैं सटीक योजना ढूँढ सकूँ।"
                )
            elif is_bengali:
                return (
                    "আপনার অনুরোধের সাথে সম্পর্কিত নির্দিষ্ট কোনো প্রকল্প পাওয়া যায়নি।\n\n"
                    "অনুগ্রহ করে আপনার রাজ্য, বয়স এবং কী ধরনের সাহায্য প্রয়োজন তা জানান।"
                )
            else:
                return (
                    "I could not find exact matching schemes for this specific query.\n\n"
                    "Please provide a few more details (like your State, Age, or the type of assistance you need — e.g., Scholarship, Business Loan, or Healthcare) so I can help you better."
                )

        primary = top_schemes[0]
        p_name = primary.get("name", "")
        p_cat = primary.get("category", "")
        p_desc = primary.get("detailedDescription") or primary.get("shortDescription") or primary.get("short_description", "")

        # Extract Benefits
        b_items = primary.get("benefits", [])
        benefits_formatted = []
        if isinstance(b_items, list):
            for b in b_items:
                if isinstance(b, dict):
                    title = b.get("title", "")
                    val = b.get("amountOrValue", "")
                    b_desc = b.get("description", "")
                    if title and val:
                        benefits_formatted.append(f"- **{title} ({val}):** {b_desc}".strip(" :"))
                    elif title:
                        benefits_formatted.append(f"- **{title}:** {b_desc}".strip(" :"))
                    elif b_desc:
                        benefits_formatted.append(f"- {b_desc}")

        # Extract Eligibility
        e_obj = primary.get("eligibility", {})
        elig_formatted = []
        if isinstance(e_obj, dict):
            for cond in e_obj.get("customConditions", []):
                elig_formatted.append(f"- {cond}")
            min_a = e_obj.get("minAge")
            max_a = e_obj.get("maxAge")
            if min_a or (max_a and max_a < 100):
                elig_formatted.append(f"- आयु सीमा: {min_a or 0} से {max_a or 100} वर्ष")
            if e_obj.get("requiresBPL"):
                elig_formatted.append("- राशन कार्ड (BPL / अंत्योदय / NFSA) धारक परिवार")

        # Extract Documents
        d_items = primary.get("documents", [])
        docs_formatted = []
        if isinstance(d_items, list):
            for d in d_items:
                if isinstance(d, dict):
                    d_name = d.get("name", "")
                    d_desc = d.get("description", "")
                    is_mand = d.get("isMandatory", True)
                    mand_badge = "अनिवार्य" if is_mand else "वैकल्पिक"
                    docs_formatted.append(f"1. **{d_name}** ({mand_badge}): {d_desc}".strip(" :"))

        # Extract Application Steps
        s_items = primary.get("applicationSteps") or primary.get("application_steps", [])
        steps_formatted = []
        if isinstance(s_items, list):
            for st in s_items:
                if isinstance(st, dict):
                    s_num = st.get("stepNumber", "")
                    s_title = st.get("title", "")
                    s_desc = st.get("description", "")
                    s_url = st.get("actionUrl", "")
                    s_tip = st.get("tips", "")
                    url_text = f" (पोर्टल: {s_url})" if s_url else ""
                    tip_text = f" *(सुझाव: {s_tip})*" if s_tip else ""
                    steps_formatted.append(f"- **चरण {s_num}: {s_title}**{url_text}\n  {s_desc}{tip_text}")

        # Verification / Helpline
        v_obj = primary.get("verification", {})
        helpline = v_obj.get("helpline", "") if isinstance(v_obj, dict) else ""
        portal = v_obj.get("officialPortalUrl", "") if isinstance(v_obj, dict) else ""
        try:
            from schemes.serializers import extract_clean_portal_url
            portal = extract_clean_portal_url(portal, p_slug, p_name, primary.get("coveredStates", []))
        except Exception:
            pass
        dept = v_obj.get("sourceDepartment") or v_obj.get("ministryOrAuthority", "") if isinstance(v_obj, dict) else ""

        # Construct Rich Odia Response
        if is_odia:
            out = [f"ନମସ୍କାର! ଏଠାରେ **{p_name}** ବିଷୟରେ ସମ୍ପୂର୍ଣ୍ଣ ସରକାରୀ ବିବରଣୀ ଦିଆଗଲା:\n"]
            out.append(f"📌 **ଯୋଜନାର ପରିଚୟ (Overview):**\n{p_desc}\n")
            if benefits_formatted:
                out.append("💰 **ମୁଖ୍ୟ ଲାଭ (Key Benefits):**\n" + "\n".join(benefits_formatted) + "\n")
            if elig_formatted:
                out.append("👥 **ଯୋଗ୍ୟତା ମାନଦଣ୍ଡ (Eligibility):**\n" + "\n".join(elig_formatted) + "\n")
            if docs_formatted:
                out.append("📄 **ଆବଶ୍ୟକୀୟ ଦସ୍ତାବିଜ (Documents):**\n" + "\n".join(docs_formatted) + "\n")
            if steps_formatted:
                out.append("📝 **ଆବେଦନ କିପରି କରିବେ (Application Guide):**\n" + "\n".join(steps_formatted) + "\n")
            if portal or helpline:
                out.append(f"📞 **ହେଲ୍ପଲାଇନ ଓ ପୋର୍ଟାଲ:**\n- 🌐 ପୋର୍ଟାଲ: {portal}\n- 📞 ହେଲ୍ପଲାଇନ: {helpline}\n")
            out.append(f"\n<schemes>{slugs}</schemes>")
            return "\n".join(out)

        # Construct Rich Hindi Response
        elif is_hindi:
            out = [f"नमस्ते! यहाँ **{p_name}** की संपूर्ण और आधिकारिक जानकारी विस्तार से दी गई है:\n"]
            out.append(f"📌 **योजना का परिचय (Overview):**\n{p_desc}\n")

            if benefits_formatted:
                out.append("💰 **मुख्य लाभ व सहायता राशि (Key Benefits):**\n" + "\n".join(benefits_formatted) + "\n")

            if elig_formatted:
                out.append("👥 **पात्रता मानदंड (Who is Eligible):**\n" + "\n".join(elig_formatted) + "\n")

            if docs_formatted:
                out.append("📄 **आवश्यक दस्तावेज़ (Required Documents):**\n" + "\n".join(docs_formatted) + "\n")

            if steps_formatted:
                out.append("📝 **आवेदन कैसे करें (Step-by-Step Application Guide):**\n" + "\n".join(steps_formatted) + "\n")
            else:
                out.append(
                    "📝 **आवेदन कैसे करें (Step-by-Step Application Guide):**\n"
                    "- **ऑनलाइन:** आधिकारिक पोर्टल पर जाकर आधार व मोबाइल नंबर से e-KYC पूरा करें।\n"
                    "- **ऑफलाइन:** नजदीकी जन सेवा केंद्र (CSC) या संबंधित सरकारी कार्यालय / अस्पताल के हेल्पडेस्क पर आधार कार्ड ले जाकर पंजीकरण कराएं।\n"
                )

            # Offline instructions tailored for healthcare
            if "ayushman" in p_name.lower() or "pmjay" in p_name.lower():
                out.append(
                    "🏥 **अस्पताल में मुफ़्त इलाज का तरीका:**\n"
                    "- किसी भी सूचीबद्ध सरकारी या निजी अस्पताल में **आयुष्मान मित्र (Ayushman Mitra)** हेल्पडेस्क पर अपना आयुष्मान कार्ड या आधार दिखाएं। भर्ती से लेकर दवाइयों और सर्जरी तक का पूरा खर्च कैशलेस होगा।\n"
                )

            help_lines = []
            if portal:
                help_lines.append(f"- 🌐 **आधिकारिक पोर्टल:** {portal}")
            if helpline:
                help_lines.append(f"- 📞 **टोल-फ्री हेल्पलाइन नंबर:** {helpline}")
            if dept:
                help_lines.append(f"- 🏛️ **संबद्ध विभाग/मंत्रालय:** {dept}")

            if help_lines:
                out.append("📞 **आधिकारिक सहायता व संपर्क:**\n" + "\n".join(help_lines) + "\n")

            # Related schemes if multiple found
            if len(top_schemes) > 1:
                rel_lines = []
                for s in top_schemes[1:]:
                    rel_lines.append(f"- **{s.get('name', '')}**: {s.get('shortDescription') or s.get('short_description', '')}")
                out.append("🔗 **संबंधित अन्य महत्वपूर्ण योजनाएं:**\n" + "\n".join(rel_lines) + "\n")

            out.append("💡 *यदि आपको आवेदन प्रक्रिया में कोई समस्या आए या अपनी पात्रता जांचनी हो, तो मुझे बताएं!*")
            out.append(f"\n<schemes>{slugs}</schemes>")
            return "\n".join(out)

        elif is_bengali:
            out = [f"নমস্কার! এখানে **{p_name}** প্রকল্পের বিস্তারিত সরকারি তথ্য দেওয়া হলো:\n"]
            out.append(f"📌 **প্রকল্পের বিবরণ (Overview):**\n{p_desc}\n")
            if benefits_formatted:
                out.append("💰 **প্রধান সুবিধাসমূহ (Key Benefits):**\n" + "\n".join(benefits_formatted) + "\n")
            if elig_formatted:
                out.append("👥 **যোগ্যতার মাপকাঠি (Eligibility):**\n" + "\n".join(elig_formatted) + "\n")
            if docs_formatted:
                out.append("📄 **প্রয়োজনীয় নথিপত্র (Documents):**\n" + "\n".join(docs_formatted) + "\n")
            if steps_formatted:
                out.append("📝 **আবেদনের নিয়মাবলী (Application Guide):**\n" + "\n".join(steps_formatted) + "\n")
            if portal or helpline:
                out.append(f"📞 **অফিসিয়াল পোর্টাল ও হেল্পলাইন:**\n- 🌐 পোর্টাল: {portal}\n- 📞 হেল্পলাইন: {helpline}\n")
            out.append(f"\n<schemes>{slugs}</schemes>")
            return "\n".join(out)

        else:
            # English Response
            out = [f"Hello! Here is the comprehensive, official guide for **{p_name}**:\n"]
            out.append(f"📌 **Scheme Overview:**\n{p_desc}\n")

            if benefits_formatted:
                out.append("💰 **Key Financial & Healthcare Benefits:**\n" + "\n".join(benefits_formatted) + "\n")

            if elig_formatted:
                out.append("👥 **Eligibility Criteria:**\n" + "\n".join(elig_formatted) + "\n")

            if docs_formatted:
                out.append("📄 **Required Documents:**\n" + "\n".join(docs_formatted) + "\n")

            if steps_formatted:
                out.append("📝 **Step-by-Step Application Process:**\n" + "\n".join(steps_formatted) + "\n")
            else:
                out.append(
                    "📝 **Step-by-Step Application Process:**\n"
                    "- **Online:** Visit the official portal and complete biometric e-KYC using Aadhaar OTP.\n"
                    "- **Offline:** Visit your nearest Common Service Centre (CSC) or designated hospital helpdesk with your Aadhaar and Ration Card.\n"
                )

            if "ayushman" in p_name.lower() or "pmjay" in p_name.lower():
                out.append(
                    "🏥 **How to Get Cashless Hospital Treatment:**\n"
                    "- Visit the **Ayushman Mitra Helpdesk** at any empaneled government or private network hospital with your Ayushman Card or Aadhaar. Treatment, medicines, and ICU care are 100% cashless.\n"
                )

            help_lines = []
            if portal:
                help_lines.append(f"- 🌐 **Official Portal:** {portal}")
            if helpline:
                help_lines.append(f"- 📞 **Toll-Free Helpline:** {helpline}")
            if dept:
                help_lines.append(f"- 🏛️ **Governing Authority:** {dept}")

            if help_lines:
                out.append("📞 **Official Support & Portals:**\n" + "\n".join(help_lines) + "\n")

            if len(top_schemes) > 1:
                rel_lines = []
                for s in top_schemes[1:]:
                    rel_lines.append(f"- **{s.get('name', '')}**: {s.get('shortDescription') or s.get('short_description', '')}")
                out.append("🔗 **Related Government Schemes:**\n" + "\n".join(rel_lines) + "\n")

            out.append("💡 *Feel free to share your profile (State, Age, Occupation) if you need personalized assistance!*")
            out.append(f"\n<schemes>{slugs}</schemes>")
            return "\n".join(out)




