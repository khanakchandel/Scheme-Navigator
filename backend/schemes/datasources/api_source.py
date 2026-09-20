"""
GovernmentAPIDataSource (api_source.py)

Live integration adapter for Government Scheme APIs (e.g. MyScheme.gov.in,
India.gov.in, Open Government Data / Data.gov.in, or State Government portals).

Features:
1. Dynamic normalization mapping government API fields into standard Scheme models.
2. Supports API key / Bearer token authentication or open data endpoints.
3. Supports pagination (page, offset, limit) and batch collection.
4. Fallback defaults for missing metadata ensuring schema integrity.
"""
import logging
import re
import urllib.parse
from typing import Any, Dict, List, Optional

from django.conf import settings
import requests

from .base import DataSource

logger = logging.getLogger(__name__)


def _slugify(text: str) -> str:
    """Convert any string to a clean URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)[:100]


def _normalize_category(cat: Optional[str]) -> str:
    """Normalize raw API category to one of the standard categories."""
    if not cat:
        return "Social Security"
    c = cat.strip().lower()
    if any(w in c for w in ["edu", "scholarship", "student", "fellowship", "school", "college"]):
        return "Education"
    if any(w in c for w in ["agri", "farm", "kisan", "crop", "irrigation", "soil", "fisher", "rural"]):
        return "Agriculture"
    if any(w in c for w in ["employ", "job", "career", "labour", "worker", "unemploy", "service provider"]):
        return "Employment"
    if any(w in c for w in ["business", "msme", "startup", "entrepreneur", "trade", "industry", "commerce"]):
        return "Business"
    if any(w in c for w in ["women", "child", "girl", "matru", "beti", "mother", "female"]):
        return "Women & Child"
    if any(w in c for w in ["house", "awas", "shelter", "urban housing"]):
        return "Housing"
    if any(w in c for w in ["health", "medical", "ayushman", "arogya", "hospital", "doctor", "sanitation"]):
        return "Healthcare"
    if any(w in c for w in ["skill", "training", "vocational", "kaushal", "capacity building"]):
        return "Skill Development"
    if any(w in c for w in ["finance", "credit", "subsidy", "grant", "loan", "monetary", "banking", "insurance"]):
        return "Financial Assistance"
    return "Social Security"


def _normalize_states(states_raw: Any) -> List[str]:
    """Parse states into a clean list of Indian states or ['All India']."""
    if not states_raw:
        return ["All India"]
    if isinstance(states_raw, str):
        s_lower = states_raw.strip().lower()
        if s_lower in ["all", "all india", "national", "central", "pan india", "pan-india", ""]:
            return ["All India"]
        return [s.strip() for s in states_raw.split(",") if s.strip()]
    if isinstance(states_raw, list):
        parsed = [str(s).strip() for s in states_raw if s and str(s).strip() and str(s).lower() != "all"]
        return parsed if parsed else ["All India"]
    return ["All India"]


class ExternalAPIDataSource(DataSource):
    """
    Government Scheme API Data Source (APIMitra & MyScheme mirror).
    Fetches schemes directly from live REST API endpoints.
    """

    def __init__(
        self,
        url: Optional[str] = None,
        api_key: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        page_size: int = 50,
        max_pages: int = 20,
    ):
        self.url = url or getattr(settings, "GOVT_SCHEME_API_URL", "https://api.apimitra.in/schemes")
        self.api_key = api_key or getattr(settings, "GOVT_SCHEME_API_KEY", "")
        self.page_size = page_size
        self.max_pages = max_pages

        # Build headers - APIMitra requires x-api-key header
        self.headers = headers or {
            "Accept": "application/json",
            "User-Agent": "SchemeNavigator-Sync/1.0",
        }
        if self.api_key:
            self.headers["x-api-key"] = self.api_key
            self.headers["Authorization"] = f"Bearer {self.api_key}"

    def fetch_schemes(self) -> List[Dict[str, Any]]:
        """
        Fetch all schemes from the configured government API endpoint.
        Handles pagination and maps raw JSON records to Scheme model dictionaries.
        """
        if not self.url:
            raise ValueError(
                "Government API URL is not set. Please provide --url argument or set GOVT_SCHEME_API_URL in .env"
            )

        all_raw_items: List[Dict[str, Any]] = []
        page = 1

        logger.info("Starting scheme fetch from Government API: %s", self.url)

        while page <= self.max_pages:
            try:
                # Add pagination query parameters
                parsed_url = urllib.parse.urlparse(self.url)
                query_dict = urllib.parse.parse_qs(parsed_url.query)
                query_dict["page"] = [str(page)]
                query_dict["limit"] = [str(self.page_size)]

                updated_query = urllib.parse.urlencode(query_dict, doseq=True)
                request_url = urllib.parse.urlunparse(
                    (parsed_url.scheme, parsed_url.netloc, parsed_url.path, parsed_url.params, updated_query, parsed_url.fragment)
                )

                response = requests.get(request_url, headers=self.headers, timeout=25)

                if response.status_code != 200:
                    logger.warning(
                        "Government API responded with status %s on page %s. Response: %s",
                        response.status_code, page, response.text[:200]
                    )
                    break

                json_data = response.json()

                # Extract items array from common response envelopes
                items = []
                if isinstance(json_data, list):
                    items = json_data
                elif isinstance(json_data, dict):
                    for key in ["data", "schemes", "results", "records", "items", "scheme_list"]:
                        if key in json_data and isinstance(json_data[key], list):
                            items = json_data[key]
                            break

                if not items:
                    logger.info("No more scheme records returned on page %s.", page)
                    break

                all_raw_items.extend(items)
                logger.info("Page %s: Fetched %s records (Total so far: %s)", page, len(items), len(all_raw_items))

                # If returned less than page_size, end of records reached
                if len(items) < self.page_size:
                    break

                page += 1

            except requests.RequestException as exc:
                logger.error("HTTP error while fetching schemes on page %s: %s", page, exc)
                if not all_raw_items:
                    raise RuntimeError(f"Failed to fetch schemes from Government API: {exc}") from exc
                break

        logger.info("Total %s raw records fetched. Normalizing schema...", len(all_raw_items))
        return self._normalize_records(all_raw_items)

    def _normalize_records(self, raw_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transforms raw government JSON items into Scheme model dictionaries."""
        normalized: List[Dict[str, Any]] = []

        for item in raw_items:
            try:
                name = (
                    item.get("scheme_name")
                    or item.get("name")
                    or item.get("schemeName")
                    or item.get("title")
                    or item.get("scheme_title")
                    or ""
                ).strip()

                if not name:
                    continue

                slug = (
                    item.get("slug")
                    or item.get("id")
                    or item.get("scheme_id")
                    or item.get("schemeId")
                    or item.get("code")
                    or _slugify(name)
                )
                slug = str(slug).strip().lower()

                short_desc = (
                    item.get("brief")
                    or item.get("short_description")
                    or item.get("shortDescription")
                    or item.get("brief_description")
                    or item.get("description")
                    or item.get("summary")
                    or item.get("tagline")
                    or f"{name} is a public welfare scheme offering support and benefits."
                ).strip()

                detailed_desc = (
                    item.get("detailed_description")
                    or item.get("detailedDescription")
                    or item.get("details")
                    or item.get("overview")
                    or short_desc
                ).strip()

                raw_categories = item.get("categories") or item.get("category") or item.get("scheme_category") or ""
                category = _normalize_category(str(raw_categories))

                level_raw = str(item.get("level") or item.get("scheme_type") or item.get("type") or "Central").lower()
                level = "State" if "state" in level_raw else "Central"

                states = _normalize_states(
                    item.get("beneficiary_state")
                    or item.get("covered_states")
                    or item.get("coveredStates")
                    or item.get("states")
                    or item.get("state")
                )

                # Tags parsing
                tags_raw = item.get("tags") or [category, level]
                if isinstance(tags_raw, str):
                    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
                elif isinstance(tags_raw, list):
                    tags = [str(t).strip() for t in tags_raw if t]
                else:
                    tags = [category, level]

                # Eligibility heuristics from raw data
                elig_raw = item.get("eligibility") or item.get("eligibility_criteria") or {}
                eligibility: Dict[str, Any] = {}
                if isinstance(elig_raw, dict):
                    eligibility = {
                        "minAge": elig_raw.get("minAge") or elig_raw.get("min_age"),
                        "maxAge": elig_raw.get("maxAge") or elig_raw.get("max_age"),
                        "allowedGenders": elig_raw.get("allowedGenders") or elig_raw.get("genders") or ["All"],
                        "allowedCategories": elig_raw.get("allowedCategories") or elig_raw.get("caste_categories") or ["All"],
                        "allowedOccupations": elig_raw.get("allowedOccupations") or elig_raw.get("occupations") or ["All"],
                        "maxAnnualIncome": elig_raw.get("maxAnnualIncome") or elig_raw.get("max_income"),
                        "requiresDisability": elig_raw.get("requiresDisability") or elig_raw.get("is_pwd", False),
                        "requiresBPL": elig_raw.get("requiresBPL") or elig_raw.get("is_bpl", False),
                        "areaEligibility": elig_raw.get("areaEligibility") or elig_raw.get("area", "Both"),
                        "customConditions": elig_raw.get("customConditions") or elig_raw.get("conditions", []),
                    }
                else:
                    # Smart default based on tags and category
                    allowed_genders = ["All"]
                    if any(w in str(raw_categories).lower() or w in str(tags_raw).lower() for w in ["women", "female", "girl"]):
                        allowed_genders = ["Female"]

                    allowed_occupations = ["All"]
                    if any(w in str(raw_categories).lower() or w in str(tags_raw).lower() for w in ["farmer", "agriculture", "kisan"]):
                        allowed_occupations = ["Farmer / Agriculture"]
                    elif any(w in str(raw_categories).lower() or w in str(tags_raw).lower() for w in ["student", "scholarship", "education"]):
                        allowed_occupations = ["Student"]
                    elif any(w in str(raw_categories).lower() or w in str(tags_raw).lower() for w in ["artisan", "handicrafts"]):
                        allowed_occupations = ["Artisan / Handicraft Worker"]
                    elif any(w in str(raw_categories).lower() or w in str(tags_raw).lower() for w in ["business", "entrepreneur", "msme"]):
                        allowed_occupations = ["Self-Employed / Business Owner"]

                    eligibility = {
                        "allowedGenders": allowed_genders,
                        "allowedCategories": ["All"],
                        "allowedOccupations": allowed_occupations,
                        "customConditions": [f"Resident of {states[0] if states != ['All India'] else 'India'}"] if states != ["All India"] else [],
                    }

                # Benefits normalization
                benefits_raw = item.get("benefits") or item.get("financial_assistance") or item.get("benefit_details") or []
                benefits: List[Dict[str, Any]] = []
                if isinstance(benefits_raw, list):
                    for b in benefits_raw:
                        if isinstance(b, dict):
                            benefits.append({
                                "title": b.get("title") or b.get("type") or "Direct Welfare Benefit",
                                "description": b.get("description") or b.get("details") or str(b),
                                "amount": b.get("amount"),
                                "frequency": b.get("frequency") or "As per scheme guidelines",
                            })
                        elif isinstance(b, str):
                            benefits.append({
                                "title": "Scheme Entitlement",
                                "description": b,
                                "frequency": "Direct Benefit Transfer / In-kind",
                            })
                if not benefits:
                    benefits = [{
                        "title": f"{name} Assistance",
                        "description": short_desc,
                        "frequency": "Direct Benefit / Welfare Support",
                    }]

                # Documents normalization
                docs_raw = item.get("documents") or item.get("required_documents") or item.get("document_checklist") or []
                documents: List[Dict[str, Any]] = []
                if isinstance(docs_raw, list):
                    for d in docs_raw:
                        if isinstance(d, dict):
                            documents.append({
                                "name": d.get("name") or d.get("title") or "Required Document",
                                "mandatory": d.get("mandatory", True),
                                "description": d.get("description") or "Valid document proof",
                            })
                        elif isinstance(d, str):
                            documents.append({
                                "name": d,
                                "mandatory": True,
                                "description": "Official verification document",
                            })
                if not documents:
                    documents = [
                        {"name": "Aadhaar Card", "mandatory": True, "description": "Identity proof for DBT"},
                        {"name": "Bank Account Passbook", "mandatory": True, "description": "Active bank account linked with Aadhaar"},
                        {"name": "Proof of Residence / Domicile", "mandatory": False, "description": "State domicile proof if required"},
                    ]

                # Application Steps normalization
                steps_raw = item.get("application_steps") or item.get("steps_to_apply") or item.get("how_to_apply") or []
                steps: List[Dict[str, Any]] = []
                if isinstance(steps_raw, list):
                    for idx, s in enumerate(steps_raw, 1):
                        if isinstance(s, dict):
                            steps.append({
                                "stepNumber": s.get("stepNumber") or s.get("step") or idx,
                                "title": s.get("title") or f"Step {idx}",
                                "description": s.get("description") or str(s),
                            })
                        elif isinstance(s, str):
                            steps.append({
                                "stepNumber": idx,
                                "title": f"Step {idx}",
                                "description": s,
                            })
                if not steps:
                    steps = [
                        {"stepNumber": 1, "title": "Online Registration", "description": f"Visit the official government portal (myscheme.gov.in/schemes/{slug}) and sign up."},
                        {"stepNumber": 2, "title": "Fill Application & Attach Documents", "description": "Fill out personal demographic information and upload required identity proofs."},
                        {"stepNumber": 3, "title": "Verification & Sanction", "description": "The nodal department verifies eligibility criteria and sanctions the scheme benefits."},
                    ]

                # Verification & Portal URLs
                official_url = (
                    item.get("official_url")
                    or item.get("officialPortalUrl")
                    or item.get("url")
                    or item.get("portal_url")
                    or item.get("website")
                    or item.get("apply_url")
                    or f"https://www.myscheme.gov.in/schemes/{slug}"
                )
                ministry = (
                    item.get("ministry")
                    or item.get("ministryOrAuthority")
                    or item.get("department")
                    or item.get("nodal_agency")
                    or "Government of India"
                )

                verification = {
                    "officialPortalUrl": official_url,
                    "ministryOrAuthority": ministry,
                    "sourceDepartment": ministry,
                    "isOfficialVerified": True,
                    "helpline": item.get("helpline") or item.get("tollfree") or "1800-111-555",
                }

                normalized_scheme = {
                    "slug": slug,
                    "name": name,
                    "short_name": item.get("short_title") or item.get("short_name") or item.get("shortName") or name[:40],
                    "tagline": item.get("tagline") or short_desc[:120],
                    "category": category,
                    "level": level,
                    "covered_states": states,
                    "short_description": short_desc,
                    "detailed_description": detailed_desc,
                    "eligibility": eligibility,
                    "benefits": benefits,
                    "documents": documents,
                    "application_steps": steps,
                    "verification": verification,
                    "tags": tags,
                    "popular_score": float(item.get("priority") or item.get("popular_score") or item.get("popularity") or 80.0),
                }

                normalized.append(normalized_scheme)
            except Exception as e:
                logger.warning("Error normalizing scheme record %s: %s", item.get("scheme_name", "Unknown"), e)

        return normalized
