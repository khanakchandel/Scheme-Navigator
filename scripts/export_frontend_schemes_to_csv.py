"""
export_frontend_schemes_to_csv.py

Reads the TypeScript scheme data files from the frontend and exports them to a
CSV file compatible with the backend's import_schemes management command.

Usage:
    python scripts/export_frontend_schemes_to_csv.py
    python scripts/export_frontend_schemes_to_csv.py --output my_schemes.csv

The script uses Node.js to evaluate the TypeScript data (via a small JS shim),
or falls back to a pure-Python regex parser if Node is unavailable.

Requirements (for the Node path):
    npm install -g ts-node   (or use the project's local ts-node)

Requirements (for the regex path):
    Python 3.10+, json, re, csv (all stdlib)
"""
import csv
import json
import os
import re
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
WORKSPACE_ROOT = SCRIPT_DIR.parent
FRONTEND_DATA_DIR = WORKSPACE_ROOT / "Frontend-Scheme-Navigator-main" / "src" / "data"
DEFAULT_OUTPUT = WORKSPACE_ROOT / "schemes_seed.csv"

SCHEMES_FILES = [
    FRONTEND_DATA_DIR / "schemes.ts",
    FRONTEND_DATA_DIR / "moreSchemes.ts",
]


# ---------------------------------------------------------------------------
# Node.js extraction path (most accurate)
# ---------------------------------------------------------------------------

NODE_SHIM = """
// Minimal shim to extract scheme objects from TypeScript data files
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const files = process.argv.slice(2);
const allSchemes = [];

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  // Strip TypeScript type annotations, imports, exports
  src = src
    .replace(/^import\\s+.*?;/gm, '')
    .replace(/^export\\s+(const|let|var|type|interface)\\s+/gm, 'var ')
    .replace(/:\\s*[A-Z][A-Za-z<>\\[\\]|,\\s]+(?=[=;,{\\)])/g, '')
    .replace(/as\\s+[A-Za-z]+/g, '');

  try {
    const sandbox = { module: { exports: {} }, exports: {}, allSchemes, Array };
    vm.runInNewContext(src, sandbox);
    // Collect any array variables that look like scheme arrays
    for (const key of Object.keys(sandbox)) {
      const val = sandbox[key];
      if (Array.isArray(val) && val.length > 0 && val[0] && val[0].slug) {
        allSchemes.push(...val);
      }
    }
  } catch (e) {
    // ignore parse errors for individual files
  }
}

process.stdout.write(JSON.stringify(allSchemes));
"""


def _try_node_extraction() -> list[dict] | None:
    """Attempt to extract schemes using Node.js. Returns None if unavailable."""
    try:
        shim_path = SCRIPT_DIR / "_shim_tmp.js"
        shim_path.write_text(NODE_SHIM, encoding="utf-8")

        result = subprocess.run(
            ["node", str(shim_path)] + [str(f) for f in SCHEMES_FILES if f.exists()],
            capture_output=True,
            text=True,
            timeout=30,
        )
        shim_path.unlink(missing_ok=True)

        if result.returncode == 0 and result.stdout.strip():
            parsed = json.loads(result.stdout)
            if isinstance(parsed, list) and parsed:
                return parsed
    except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
        pass
    return None


# ---------------------------------------------------------------------------
# Pure-Python regex extraction path (fallback)
# ---------------------------------------------------------------------------

def _extract_object_literals(src: str) -> list[str]:
    """Extract top-level object literals from a TS array declaration."""
    # Find the array content between the first [ and matching ]
    start = src.find("[")
    if start == -1:
        return []
    depth = 0
    in_str = False
    str_char = ""
    objs = []
    obj_start = None

    i = start
    while i < len(src):
        ch = src[i]
        if in_str:
            if ch == "\\" and i + 1 < len(src):
                i += 2
                continue
            if ch == str_char:
                in_str = False
        else:
            if ch in ('"', "'", "`"):
                in_str = True
                str_char = ch
            elif ch == "{":
                if depth == 1:
                    obj_start = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 1 and obj_start is not None:
                    objs.append(src[obj_start : i + 1])
                    obj_start = None
            elif ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    break
        i += 1

    return objs


def _ts_obj_to_dict(ts_obj: str) -> dict | None:
    """
    Best-effort conversion of a TypeScript object literal to a Python dict.
    Handles unquoted keys, single-quoted strings, trailing commas.
    """
    # Remove TypeScript type casts and as-expressions
    s = re.sub(r"\s+as\s+\w+", "", ts_obj)
    # Quote unquoted object keys
    s = re.sub(r"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*):", r'\1"\2"\3:', s)
    # Replace single quotes with double quotes (careful with apostrophes)
    s = re.sub(r"(?<!\\)'([^'\\]*(?:\\.[^'\\]*)*)'", r'"\1"', s)
    # Remove trailing commas before ] or }
    s = re.sub(r",\s*([\]}])", r"\1", s)
    # Remove multi-line comments
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.DOTALL)
    s = re.sub(r"//[^\n]*", "", s)
    # Replace undefined with null
    s = s.replace(": undefined", ": null")
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return None


def _regex_extraction() -> list[dict]:
    """Parse scheme objects using pure Python regex fallback."""
    all_schemes: list[dict] = []
    for path in SCHEMES_FILES:
        if not path.exists():
            print(f"  [skip] {path} not found")
            continue
        src = path.read_text(encoding="utf-8")
        obj_strs = _extract_object_literals(src)
        for obj_str in obj_strs:
            d = _ts_obj_to_dict(obj_str)
            if d and d.get("slug"):
                all_schemes.append(d)
    return all_schemes


# ---------------------------------------------------------------------------
# Scheme → CSV row conversion
# ---------------------------------------------------------------------------

def _safe_str(val) -> str:
    if val is None:
        return ""
    if isinstance(val, bool):
        return str(val).lower()
    return str(val)


def _pipe(val) -> str:
    if not val:
        return ""
    if isinstance(val, list):
        return "|".join(str(v) for v in val)
    return str(val)


def _scheme_to_row(scheme: dict) -> dict:
    elig = scheme.get("eligibility") or {}
    return {
        "slug": _safe_str(scheme.get("slug")),
        "name": _safe_str(scheme.get("name")),
        "short_name": _safe_str(scheme.get("shortName") or scheme.get("short_name", "")),
        "tagline": _safe_str(scheme.get("tagline")),
        "category": _safe_str(scheme.get("category")),
        "level": _safe_str(scheme.get("level", "Central")),
        "covered_states": _pipe(scheme.get("coveredStates") or scheme.get("covered_states")),
        "short_description": _safe_str(
            scheme.get("shortDescription") or scheme.get("short_description", "")
        ),
        "detailed_description": _safe_str(
            scheme.get("detailedDescription") or scheme.get("detailed_description", "")
        ),
        "popular_score": _safe_str(scheme.get("popularScore") or scheme.get("popular_score", 0)),
        "tags": _pipe(scheme.get("tags")),
        # Flat eligibility
        "elig_min_age": _safe_str(elig.get("minAge")),
        "elig_max_age": _safe_str(elig.get("maxAge")),
        "elig_genders": _pipe(elig.get("allowedGenders")),
        "elig_categories": _pipe(elig.get("allowedCategories")),
        "elig_occupations": _pipe(elig.get("allowedOccupations")),
        "elig_max_income": _safe_str(elig.get("maxAnnualIncome")),
        "elig_income_ranges": _pipe(elig.get("incomeRangesAllowed")),
        "elig_area_types": _pipe(elig.get("areaEligibility")),
        "elig_requires_disability": _safe_str(elig.get("requiresDisability", False)),
        "elig_requires_bpl": _safe_str(elig.get("requiresBPL", False)),
        "elig_requires_minority": _safe_str(elig.get("requiresMinority", False)),
        "elig_custom_conditions": _pipe(elig.get("customConditions")),
        # JSON columns
        "benefits_json": json.dumps(scheme.get("benefits") or [], ensure_ascii=False),
        "documents_json": json.dumps(scheme.get("documents") or [], ensure_ascii=False),
        "application_steps_json": json.dumps(
            scheme.get("applicationSteps") or scheme.get("application_steps") or [],
            ensure_ascii=False,
        ),
        "verification_json": json.dumps(
            scheme.get("verification") or {}, ensure_ascii=False
        ),
    }


FIELDNAMES = [
    "slug", "name", "short_name", "tagline", "category", "level",
    "covered_states", "short_description", "detailed_description",
    "popular_score", "tags",
    "elig_min_age", "elig_max_age", "elig_genders", "elig_categories",
    "elig_occupations", "elig_max_income", "elig_income_ranges",
    "elig_area_types", "elig_requires_disability", "elig_requires_bpl",
    "elig_requires_minority", "elig_custom_conditions",
    "benefits_json", "documents_json", "application_steps_json", "verification_json",
]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Export frontend scheme data to CSV")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output CSV path")
    args = parser.parse_args()

    output_path = Path(args.output)
    print(f"Frontend data dir: {FRONTEND_DATA_DIR}")
    print("Attempting Node.js extraction...")
    schemes = _try_node_extraction()

    if schemes:
        print(f"  Node extraction succeeded: {len(schemes)} schemes")
    else:
        print("  Node unavailable or failed — falling back to regex parser")
        schemes = _regex_extraction()
        print(f"  Regex extraction found: {len(schemes)} schemes")

    if not schemes:
        print("ERROR: No schemes extracted. Check that the frontend data files exist.")
        sys.exit(1)

    # Deduplicate by slug
    seen: set[str] = set()
    unique_schemes = []
    for s in schemes:
        slug = s.get("slug") or s.get("id", "")
        if slug and slug not in seen:
            seen.add(slug)
            unique_schemes.append(s)

    print(f"Unique schemes after deduplication: {len(unique_schemes)}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for scheme in unique_schemes:
            try:
                row = _scheme_to_row(scheme)
                writer.writerow(row)
            except Exception as exc:
                slug = scheme.get("slug", "?")
                print(f"  [warn] Skipping scheme '{slug}': {exc}")

    print(f"\nExported to: {output_path}")
    print(f"Next step: python manage.py import_schemes --source csv --file {output_path}")


if __name__ == "__main__":
    main()
