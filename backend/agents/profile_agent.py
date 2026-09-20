"""
ProfileAgent — extracts a structured UserProfile from natural language text.

Used by the AssistantAgent when a user describes their situation in chat
instead of filling the survey form.
"""
import json
import logging

from .litellm_client import call_llm

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a profile extraction assistant for an Indian government scheme navigator.

Your task is to extract structured user profile information from a natural-language description.

Return ONLY a valid JSON object with these fields (include only fields you can confidently extract):
{
  "name": string | null,
  "age": integer | null,
  "gender": "male" | "female" | "other" | null,
  "state": string | null,
  "district": string | null,
  "areaType": "Urban" | "Rural" | "Semi-Urban" | null,
  "category": "General" | "OBC" | "SC" | "ST" | "EWS" | "Minority" | null,
  "isDisability": boolean | null,
  "hasBPLCard": boolean | null,
  "isMinority": boolean | null,
  "employmentType": "Student" | "Farmer" | "Business owner" | "Employed" | "Unemployed" | "Self-employed" | "Homemaker" | "Retired" | "Other" | null,
  "studentCourse": string | null,
  "farmerLandAcre": number | null,
  "businessStage": string | null,
  "annualIncome": number | null,
  "incomeRange": "Below ₹1 lakh" | "₹1–2.5 lakh" | "₹2.5–5 lakh" | "₹5–10 lakh" | "₹10 lakh+" | null
}

Rules:
- If you cannot determine a field with confidence, set it to null.
- For state names, use the standard Indian state names (e.g. "Maharashtra", "Uttar Pradesh").
- Income ranges: if the user mentions an amount, map it to the nearest range.
- Return ONLY the JSON object, no prose or markdown fences.
"""


class ProfileAgent:
    """
    Extracts a structured UserProfile dict from a natural-language description.
    """

    def extract(self, text: str) -> dict:
        """
        Parse `text` and return a (potentially partial) UserProfile dict.

        Args:
            text: Free-form natural language description of the user's situation.

        Returns:
            A dict with UserProfile fields (camelCase keys, matching TypeScript interface).
            Unknown / uncertain fields are omitted.
        """
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ]

        try:
            raw = call_llm(
                messages,
                temperature=0.1,  # low temperature for deterministic extraction
                max_tokens=512,
                response_format={"type": "json_object"},
            )
            parsed = json.loads(raw)
        except (RuntimeError, json.JSONDecodeError) as exc:
            logger.warning("ProfileAgent failed to parse LLM output: %s", exc)
            return {}

        # Remove null values so callers can merge cleanly
        return {k: v for k, v in parsed.items() if v is not None}
