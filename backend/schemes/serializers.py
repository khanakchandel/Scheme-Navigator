"""
Scheme serializer — outputs all fields in the shape the frontend expects.
The nested JSON fields (eligibility, benefits, etc.) are stored as JSONB
and returned verbatim, so no nested serializer indirection is needed.
"""
from rest_framework import serializers
from .models import Scheme
import re
from urllib.parse import urlparse, parse_qs

URL_REGEX = re.compile(r'https?://[^\s\'"<>]+')


# Direct Official Portal Mapping Registry
KNOWN_SCHEMES_PORTALS = {
    'aaby': 'https://eshram.gov.in',
    'aam-aadmi-bima-yojana': 'https://eshram.gov.in',
    'pm-kisan': 'https://pmkisan.gov.in',
    'pm-kisan-samman-nidhi': 'https://pmkisan.gov.in',
    'pmjay': 'https://beneficiary.nha.gov.in',
    'ayushman-bharat-pmjay': 'https://beneficiary.nha.gov.in',
    'ayushman-vaya-vandana-senior-citizens': 'https://beneficiary.nha.gov.in',
    'pm-vishwakarma-scheme': 'https://pmvishwakarma.gov.in',
    'pm-vishwakarma': 'https://pmvishwakarma.gov.in',
    'pradhan-mantri-mudra-yojana': 'https://www.udyamimitra.in',
    'pradhan-mantri-mudra-yojana-pmmy': 'https://www.udyamimitra.in',
    'pm-mudra': 'https://www.udyamimitra.in',
    'prime-minister-employment-generation-programme': 'https://www.kviconline.gov.in/pmegpeportal',
    'sukanya-samriddhi-yojana': 'https://www.indiapost.gov.in',
    'atal-pension-yojana': 'https://enps.nsdl.com',
    'pm-svanidhi': 'https://pmsvanidhi.mohua.gov.in',
    'pmsvanidhi': 'https://pmsvanidhi.mohua.gov.in',
    'pm-matru-vandana-yojana': 'https://pmmvy.wcd.gov.in',
    'pmmvy': 'https://pmmvy.wcd.gov.in',
    'pm-shram-yogi-mandhan': 'https://maandhan.in',
    'pm-sym': 'https://maandhan.in',
    'national-scholarship-portal': 'https://scholarships.gov.in',
    'post-matric-scholarship-sc-obc-minority': 'https://scholarships.gov.in',
    'pre-matric-scholarship': 'https://scholarships.gov.in',
    'pm-uchchatar-shiksha-protsahan-yojana': 'https://scholarships.gov.in',
    'pm-fasal-bima-yojana': 'https://pmfby.gov.in',
    'pmfby': 'https://pmfby.gov.in',
    'kisan-credit-card': 'https://pmkisan.gov.in',
    'kcc': 'https://pmkisan.gov.in',
    'pm-awas-yojana-urban': 'https://pmaymis.gov.in',
    'pm-awas-yojana-gramin': 'https://pmayg.nic.in',
    'pmay': 'https://pmaymis.gov.in',
    'stand-up-india': 'https://www.standupmitra.in',
    'udyam-registration': 'https://udyamregistration.gov.in',
    'pm-kusum': 'https://pmkusum.mnre.gov.in',
    'swamitva-scheme': 'https://swamitva.nic.in',
    'jan-aushadhi-scheme': 'https://janaushadhi.gov.in',
    'national-apprenticeship-promotion-scheme': 'https://www.apprenticeshipindia.gov.in',
}

STATE_DIRECT_PORTALS = {
    'Assam': 'https://sewasetu.assam.gov.in',
    'Odisha': 'https://edistrict.odisha.gov.in',
    'Puducherry': 'https://edistrict.py.gov.in',
    'Delhi': 'https://edistrict.delhigovt.nic.in',
    'Uttar Pradesh': 'https://edistrict.up.gov.in',
    'Maharashtra': 'https://aaplesarkar.mahaonline.gov.in',
    'Karnataka': 'https://sevasindhu.karnataka.gov.in',
    'Tamil Nadu': 'https://www.tnesevai.tn.gov.in',
    'Bihar': 'https://serviceonline.bihar.gov.in',
    'West Bengal': 'https://edistrict.wb.gov.in',
    'Rajasthan': 'https://jansoochna.rajasthan.gov.in',
    'Gujarat': 'https://digitalgujarat.gov.in',
    'Madhya Pradesh': 'https://mpedistrict.gov.in',
    'Punjab': 'https://esewa.punjab.gov.in',
    'Haryana': 'https://saralharyana.gov.in',
    'Andhra Pradesh': 'https://navasakam.ap.gov.in',
    'Telangana': 'https://tg.meeseva.gov.in',
    'Kerala': 'https://edistrict.kerala.gov.in',
    'Jharkhand': 'https://jharsewa.jharkhand.gov.in',
    'Chhattisgarh': 'https://edistrict.cgstate.gov.in',
    'Himachal Pradesh': 'https://edistrict.hp.gov.in',
    'Uttarakhand': 'https://eservices.uk.gov.in',
    'Jammu and Kashmir': 'https://jkeservices.jk.gov.in',
    'Goa': 'https://goaonline.gov.in',
    'Tripura': 'https://edistrict.tripura.gov.in',
    'Meghalaya': 'https://megedistrict.gov.in',
    'Manipur': 'https://eservicesmanipur.gov.in',
    'Nagaland': 'https://edistrict.nagaland.gov.in',
    'Mizoram': 'https://edistrict.mizoram.gov.in',
    'Sikkim': 'https://services.sikkim.gov.in',
    'Arunachal Pradesh': 'https://eservice.arunachal.gov.in',
    'Chandigarh': 'https://chdservices.gov.in',
}

MINISTRY_DIRECT_PORTALS = {
    'Ministry of Education': 'https://scholarships.gov.in',
    'Ministry Of Social Justice and Empowerment': 'https://socialjustice.gov.in',
    'Ministry Of Science And Technology': 'https://online-inspire.gov.in',
    'Ministry Of Commerce And Industry': 'https://www.startupindia.gov.in',
    'Ministry Of Agriculture and Farmers Welfare': 'https://pmkisan.gov.in',
    'Ministry Of Micro, Small and Medium Enterprises': 'https://udyamregistration.gov.in',
    'Ministry Of Textiles': 'https://handicrafts.nic.in',
    'Ministry of Electronics and Information Technology': 'https://www.digitalindia.gov.in',
    'Ministry Of Youth Affairs & Sports': 'https://yas.nic.in',
    'Ministry Of Culture': 'https://indiaculture.gov.in',
    'Ministry Of Finance': 'https://www.udyamimitra.in',
    'Ministry Of Home Affairs': 'https://mha.gov.in',
    'Ministry Of Defence': 'https://mod.gov.in',
    'Ministry Of Health & Family Welfare': 'https://beneficiary.nha.gov.in',
    'Ministry Of Labour and Employment': 'https://eshram.gov.in',
    'Ministry of Fisheries,Animal Husbandry and Dairying': 'https://dof.gov.in',
    'Ministry Of Minority Affairs': 'https://scholarships.gov.in',
    'Ministry Of Skill Development And Entrepreneurship': 'https://www.skillindia.gov.in',
    'Ministry Of Communication': 'https://dot.gov.in',
    'Ministry of Women and Child Development': 'https://wcd.nic.in',
    'Ministry Of Housing and Urban Affairs': 'https://pmsvanidhi.mohua.gov.in',
    'Ministry Of Rural Development': 'https://rural.nic.in',
}

def resolve_direct_portal_url(slug: str, name: str, covered_states: list, dept: str) -> str:
    s_clean = (slug or '').lower()
    n_clean = (name or '').lower()

    for k, url in KNOWN_SCHEMES_PORTALS.items():
        if k == s_clean or k in s_clean or k in n_clean:
            return url

    if any(w in n_clean for w in ['scholarship', 'fellowship', 'vidyarthi', 'shiksha', 'stipend']):
        return 'https://scholarships.gov.in'
    if any(w in n_clean for w in ['kisan', 'farmer', 'krishi', 'crop', 'paddy', 'farming']):
        return 'https://pmkisan.gov.in'
    if any(w in n_clean for w in ['bima', 'insurance', 'ayushman', 'arogya', 'swasthya', 'health']):
        return 'https://beneficiary.nha.gov.in'
    if any(w in n_clean for w in ['mudra', 'loan', 'credit', 'subsidy', 'business', 'udyam', 'coir', 'handicraft', 'industry']):
        return 'https://udyamregistration.gov.in'
    if any(w in n_clean for w in ['pension', 'vridha', 'old age', 'divyang', 'disability']):
        return 'https://enps.nsdl.com'
    if any(w in n_clean for w in ['awas', 'housing', 'ghar']):
        return 'https://pmaymis.gov.in'
    if any(w in n_clean for w in ['labour', 'worker', 'shramik', 'employment', 'rozgar', 'job']):
        return 'https://eshram.gov.in'

    if isinstance(covered_states, list) and len(covered_states) > 0 and 'All India' not in covered_states:
        for st in covered_states:
            if st in STATE_DIRECT_PORTALS:
                return STATE_DIRECT_PORTALS[st]

    for m, m_url in MINISTRY_DIRECT_PORTALS.items():
        if m.lower() in (dept or '').lower() or (dept or '').lower() in m.lower():
            return m_url

    return 'https://services.india.gov.in'


def extract_clean_portal_url(raw_val: str, slug: str = '', name: str = '', covered_states: list = None, dept: str = '') -> str:
    if not raw_val or str(raw_val).strip() in ('#', 'none', 'None', 'null', ''):
        return resolve_direct_portal_url(slug, name, covered_states or [], dept)

    cleaned = re.sub(r'chrome-extension://[a-z0-9]+/https?://', 'https://', str(raw_val))
    cleaned = re.sub(r'chrome-extensionhttps?://', 'https://', cleaned)

    lines = [l.strip() for l in cleaned.splitlines() if l.strip() and not l.strip().startswith('file:///')]
    if not lines:
        return resolve_direct_portal_url(slug, name, covered_states or [], dept)

    candidates = []
    priority_keywords = [
        (['official website', 'official portal', 'portal', 'website', 'online application', 'apply', 'registration', 'apply online', 'portal login'], 120),
        (['sanman portal', 'sso', 'edistrict', 'service', 'dbt', 'mahaonline', 'e-services'], 100),
        (['application form', 'application status', 'scheme details', 'detail', 'details', 'about'], 80),
        (['guidelines', 'guideline', 'notification', 'circular', 'order', 'amendment', 'press release'], 50),
        (['user manual', 'faq', 'contact'], 30),
    ]

    for line in lines:
        found_urls = URL_REGEX.findall(line)
        for u in found_urls:
            u = u.rstrip('.,;)]#\'"')
            if not u.startswith('http'):
                continue
            if 'google.co.in/url?' in u or 'google.com/url?' in u:
                try:
                    p = urlparse(u)
                    qs = parse_qs(p.query)
                    if 'url' in qs:
                        u = qs['url'][0]
                except Exception:
                    pass
            if 'translate.goog' in u:
                u = re.sub(r'([a-zA-Z0-9\-]+)-([a-zA-Z0-9\-]+)-gov-in\.translate\.goog', r'\1.\2.gov.in', u)
                u = re.sub(r'([a-zA-Z0-9\-]+)-gov-in\.translate\.goog', r'\1.gov.in', u)
                u = re.sub(r'\.translate\.goog', '', u)
            if ':8080' in u:
                u = u.replace(':8080', '')

            line_lower = line.lower()
            score = 10
            for kws, s_val in priority_keywords:
                if any(kw in line_lower for kw in kws):
                    score = s_val
                    break
            try:
                domain = urlparse(u).netloc.lower()
                if any(domain.endswith(tld) for tld in ['.gov.in', '.nic.in']):
                    score += 50
                elif any(domain.endswith(tld) for tld in ['.org.in', '.ac.in', '.res.in', '.edu.in', '.in']):
                    score += 20
                if any(bad in domain for bad in ['drive.google.com', 'docs.google.com', 'dropbox.com', 'amazonaws.com', 'govtschemes.in', 'google.com', 'google.co.in']):
                    score -= 100
            except Exception:
                continue

            if u.lower().endswith('.pdf'):
                score -= 25
            else:
                score += 15
            candidates.append((score, u))

    if not candidates:
        return resolve_direct_portal_url(slug, name, covered_states or [], dept)
    candidates.sort(key=lambda x: x[0], reverse=True)
    if candidates[0][0] <= 0:
        return resolve_direct_portal_url(slug, name, covered_states or [], dept)
    return candidates[0][1]


class SchemeSerializer(serializers.ModelSerializer):
    # Expose the database PK as 'id' to match TypeScript Scheme.id
    id = serializers.CharField(source="slug")

    class Meta:
        model = Scheme
        fields = [
            "id",
            "slug",
            "name",
            "short_name",
            "tagline",
            "category",
            "level",
            "covered_states",
            "short_description",
            "detailed_description",
            "eligibility",
            "benefits",
            "documents",
            "application_steps",
            "verification",
            "popular_score",
            "tags",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Rename snake_case keys to camelCase to match TypeScript interface
        data["shortName"] = data.pop("short_name", "") or data.get("name", "")
        covered = data.pop("covered_states", []) or []
        data["coveredStates"] = covered
        data["shortDescription"] = data.pop("short_description", "") or ""
        data["detailedDescription"] = data.pop("detailed_description", "") or data.get("shortDescription", "")
        raw_steps = data.pop("application_steps", []) or []
        data["popularScore"] = data.pop("popular_score", 0) or 0
        data["tags"] = data.get("tags") or []

        ver = data.get("verification") or {}
        dept = (ver.get("sourceDepartment") or ver.get("ministryOrAuthority") or "Government Department") if isinstance(ver, dict) else "Government Department"
        raw_portal = ver.get("officialPortalUrl") if isinstance(ver, dict) else ""
        portal_url = extract_clean_portal_url(raw_portal, instance.slug, instance.name, covered, dept)

        # Normalize documents
        docs = []
        for idx, doc in enumerate(data.get("documents") or []):
            if isinstance(doc, dict):
                docs.append({
                    "id": str(doc.get("id") or f"doc-{idx + 1}"),
                    "name": doc.get("name") or "Required Document",
                    "description": doc.get("description") or "",
                    "isMandatory": bool(doc.get("isMandatory") if "isMandatory" in doc else doc.get("mandatory", False)),
                    "documentType": doc.get("documentType") or "other",
                })
            elif isinstance(doc, str):
                docs.append({
                    "id": f"doc-{idx + 1}",
                    "name": doc,
                    "description": "Required for verification",
                    "isMandatory": True,
                    "documentType": "other",
                })
        data["documents"] = docs

        # Normalize benefits
        benefits = []
        for idx, b in enumerate(data.get("benefits") or []):
            if isinstance(b, dict):
                benefits.append({
                    "title": b.get("title") or "Scheme Benefit",
                    "description": b.get("description") or "",
                    "amountOrValue": b.get("amountOrValue") or b.get("amount") or b.get("frequency") or "",
                    "type": b.get("type") or "Financial Assistance",
                })
            elif isinstance(b, str):
                benefits.append({
                    "title": b,
                    "description": "",
                    "amountOrValue": "",
                    "type": "Financial Assistance",
                })
        data["benefits"] = benefits

        # Normalize application steps
        steps = []
        for idx, step in enumerate(raw_steps):
            if isinstance(step, dict):
                act_url = step.get("actionUrl") or portal_url
                if "myscheme.gov.in" in act_url:
                    act_url = portal_url
                steps.append({
                    "stepNumber": step.get("stepNumber") or (idx + 1),
                    "title": step.get("title") or f"Step {idx + 1}",
                    "description": step.get("description") or "",
                    "tips": step.get("tips") or "",
                    "actionUrl": act_url,
                })
            elif isinstance(step, str):
                steps.append({
                    "stepNumber": idx + 1,
                    "title": f"Step {idx + 1}",
                    "description": step,
                    "tips": "",
                    "actionUrl": portal_url,
                })
        data["applicationSteps"] = steps

        # Normalize verification
        if isinstance(ver, dict):
            data["verification"] = {
                "sourceDepartment": ver.get("sourceDepartment") or ver.get("ministryOrAuthority") or "Government Department",
                "ministryOrAuthority": ver.get("ministryOrAuthority") or ver.get("sourceDepartment") or "Government Ministry",
                "lastUpdated": ver.get("lastUpdated") or "Current Fiscal Year",
                "officialPortalUrl": portal_url,
                "helpline": ver.get("helpline") or "1800-111-555",
                "isOfficialVerified": ver.get("isOfficialVerified", True),
            }

        return data
