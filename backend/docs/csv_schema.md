# CSV Schema Reference — SchemeNavigator Backend

This document describes the expected column structure for CSV files imported via:

```
python manage.py import_schemes --source csv --file <path>.csv
```

---

## Required Columns

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `slug` | string | Unique URL-safe identifier (used as primary key for upserts) | `pm-kisan-samman-nidhi` |
| `name` | string | Full official scheme name | `Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)` |
| `category` | string | One of the allowed categories (see below) | `Agriculture` |

## Strongly Recommended Columns

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `tagline` | string | One-line description | `₹6,000/year direct income support for farmers` |
| `level` | string | `Central` or `State` | `Central` |
| `short_description` | string | 1–2 sentence summary | `Provides ₹6,000 per year in three equal installments…` |
| `detailed_description` | string | Full description | (multi-sentence paragraph) |
| `covered_states` | pipe-separated string | States where scheme applies; use `All India` for nationwide | `All India` or `Maharashtra\|Goa` |
| `popular_score` | float | Relative popularity score (0–100) | `95.0` |
| `tags` | pipe-separated string | Search/discovery tags | `farmer\|income\|subsidy\|agriculture` |
| `short_name` | string | Abbreviated name | `PM-KISAN` |

---

## Eligibility Flat Columns (all optional)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `elig_min_age` | integer | Minimum eligible age | `18` |
| `elig_max_age` | integer | Maximum eligible age | `60` |
| `elig_genders` | pipe-separated | Allowed genders (`male`, `female`, `other`, `all`) | `female` or `all` |
| `elig_categories` | pipe-separated | Caste/social categories (`General`, `OBC`, `SC`, `ST`, `EWS`, `Minority`, `All`) | `SC\|ST\|OBC` |
| `elig_occupations` | pipe-separated | Allowed occupation types | `Farmer\|Self-employed` |
| `elig_max_income` | integer | Maximum annual income in INR (0 = no ceiling) | `200000` |
| `elig_income_ranges` | pipe-separated | Allowed income range labels | `Below ₹1 lakh\|₹1–2.5 lakh` |
| `elig_area_types` | pipe-separated | Allowed area types (`Urban`, `Rural`, `Semi-Urban`, `All`) | `Rural\|Semi-Urban` |
| `elig_requires_disability` | boolean | `true` if only for persons with disability | `false` |
| `elig_requires_bpl` | boolean | `true` if only for BPL card holders | `false` |
| `elig_requires_minority` | boolean | `true` if only for minority communities | `false` |
| `elig_custom_conditions` | pipe-separated | Free-text additional conditions | `Must own agricultural land\|Must have Aadhar` |

---

## JSON Override Columns (optional — override flat eligibility columns if present)

If you prefer to store complex nested data as JSON strings, use these columns.
They take precedence over the flat eligibility columns above.

| Column | Type | Description |
|--------|------|-------------|
| `eligibility_json` | JSON string | Full EligibilityCriteria object (see structure below) |
| `benefits_json` | JSON string | Array of Benefit objects |
| `documents_json` | JSON string | Array of DocumentRequirement objects |
| `application_steps_json` | JSON string | Array of ApplicationStep objects |
| `verification_json` | JSON string | VerificationInfo object |

### `eligibility_json` structure

```json
{
  "minAge": 18,
  "maxAge": 60,
  "allowedGenders": ["female"],
  "allowedStates": [],
  "allowedCategories": ["SC", "ST", "OBC"],
  "allowedOccupations": ["Farmer"],
  "maxAnnualIncome": 200000,
  "incomeRangesAllowed": ["Below ₹1 lakh", "₹1–2.5 lakh"],
  "requiresDisability": false,
  "requiresMinority": false,
  "requiresBPL": false,
  "areaEligibility": ["Rural", "Semi-Urban"],
  "customConditions": ["Must own agricultural land"]
}
```

### `benefits_json` structure

```json
[
  {
    "title": "Annual Income Support",
    "description": "₹6,000 per year in three equal installments directly into bank account",
    "amountOrValue": "₹6,000/year",
    "type": "Financial Assistance"
  }
]
```

Allowed `type` values: `Financial Assistance`, `Scholarship`, `Subsidy`, `Loan & Credit`, `Insurance`,
`Skill Training`, `Housing`, `Healthcare`, `Pension`, `Equipment`, `Social Security`

### `documents_json` structure

```json
[
  {
    "id": "aadhaar",
    "name": "Aadhaar Card",
    "description": "12-digit unique identity number",
    "isMandatory": true,
    "documentType": "identity"
  }
]
```

Allowed `documentType` values: `identity`, `income`, `residence`, `education`, `bank`, `caste`, `business`, `other`

### `application_steps_json` structure

```json
[
  {
    "stepNumber": 1,
    "title": "Visit PM-KISAN Portal",
    "description": "Go to pmkisan.gov.in and click 'Farmer Corner'",
    "tips": "Keep Aadhaar and bank passbook ready",
    "actionUrl": "https://pmkisan.gov.in"
  }
]
```

### `verification_json` structure

```json
{
  "sourceDepartment": "Department of Agriculture & Farmers Welfare",
  "ministryOrAuthority": "Ministry of Agriculture & Farmers Welfare",
  "lastUpdated": "2024-01-15",
  "officialPortalUrl": "https://pmkisan.gov.in",
  "helpline": "155261",
  "isOfficialVerified": true
}
```

---

## Allowed Category Values

`Education`, `Agriculture`, `Employment`, `Business`, `Women & Child`, `Housing`,
`Healthcare`, `Social Security`, `Financial Assistance`, `Skill Development`

---

## Example CSV Row (minimal)

```csv
slug,name,category,level,short_description,covered_states,tags
pm-kisan-samman-nidhi,PM-KISAN,Agriculture,Central,Direct income support of ₹6000/year for farmers,All India,farmer|income|agriculture
```

## Example CSV Row (full flat)

```csv
slug,name,tagline,category,level,short_description,detailed_description,covered_states,popular_score,tags,elig_min_age,elig_max_age,elig_genders,elig_occupations,elig_max_income
pm-kisan-samman-nidhi,Pradhan Mantri Kisan Samman Nidhi,₹6000/year for small farmers,Agriculture,Central,Direct income support...,Full details...,All India,95,farmer|income|subsidy,18,75,all,Farmer,200000
```

---

## Import Command

```bash
# Basic import
python manage.py import_schemes --source csv --file data/schemes.csv

# Dry run (validate without writing to DB)
python manage.py import_schemes --source csv --file data/schemes.csv --dry-run

# Re-import (idempotent — updates existing schemes by slug)
python manage.py import_schemes --source csv --file data/schemes_updated.csv
```
