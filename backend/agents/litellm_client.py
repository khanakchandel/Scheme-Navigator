"""
LiteLLM Gateway — optimized for 100% Free AI Model APIs.

Supported Free Providers & Models:
1. Google Gemini (Free Tier - 15 RPM / 1M TPM):
   - Model: gemini/gemini-1.5-flash or gemini/gemini-2.0-flash
   - Key: GEMINI_API_KEY or LITELLM_API_KEY (from https://aistudio.google.com/)

2. Groq (Free Tier - ultra-fast inference):
   - Model: groq/llama-3.3-70b-versatile or groq/llama-3.1-8b-instant
   - Key: GROQ_API_KEY or LITELLM_API_KEY (from https://console.groq.com/)

3. OpenRouter (Free community models):
   - Model: openrouter/meta-llama/llama-3.3-70b-instruct:free or openrouter/google/gemini-2.0-flash-exp:free
   - Key: OPENROUTER_API_KEY or LITELLM_API_KEY (from https://openrouter.ai/keys)

4. Local Ollama (100% offline & free, no key needed):
   - Model: ollama/llama3 or ollama/mistral
   - Base: http://localhost:11434
"""
import os
import logging
from typing import Any, Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def _sanitize_key(key: Optional[str], provider: str = "") -> Optional[str]:
    """Sanitize API key and filter out dummy/placeholder values."""
    if not key:
        return None
    cleaned = key.strip()
    if any(dummy in cleaned.lower() for dummy in ["your-key-here", "placeholder", "...", "<", "none"]):
        return None
    if len(cleaned) < 15:
        return None
    return cleaned


def _resolve_api_credentials(model_name: str) -> tuple[Optional[str], Optional[str]]:
    """
    Intelligently resolves API Key and API Base from environment / settings
    for the specific model provider.
    """
    model_lower = model_name.lower()
    provider = "gemini" if "gemini" in model_lower else "groq" if "groq" in model_lower else "openrouter" if "openrouter" in model_lower else ""

    api_key = _sanitize_key(
        getattr(settings, "LITELLM_API_KEY", None)
        or os.environ.get("LITELLM_API_KEY"),
        provider=provider
    )
    api_base = (
        getattr(settings, "LITELLM_API_BASE", "")
        or os.environ.get("LITELLM_API_BASE", "")
    )

    # 1. Google Gemini
    if "gemini" in model_lower:
        gemini_key = _sanitize_key(
            os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or api_key,
            provider="gemini"
        )
        if gemini_key:
            api_key = gemini_key

    # 2. Groq
    elif "groq" in model_lower:
        groq_key = _sanitize_key(os.environ.get("GROQ_API_KEY"), provider="groq")
        if groq_key:
            api_key = groq_key

    # 3. OpenRouter Free Models
    elif "openrouter" in model_lower:
        openrouter_key = _sanitize_key(os.environ.get("OPENROUTER_API_KEY"), provider="openrouter")
        if openrouter_key:
            api_key = openrouter_key
        if not api_base:
            api_base = "https://openrouter.ai/api/v1"

    # 4. Local Ollama
    elif "ollama" in model_lower:
        if not api_base:
            api_base = os.environ.get("OLLAMA_API_BASE", "http://localhost:11434")

    return (api_key if api_key else None), (api_base.strip() if api_base else None)


def _call_gemini_direct(
    messages: list[dict],
    api_key: str,
    model_name: str,
    temperature: float,
    max_tokens: int,
    response_mime_type: Optional[str] = None,
) -> str:
    """Fast, direct HTTP request to Google Gemini API bypassing library wrappers with model fallbacks."""
    import httpx

    clean_model = model_name.replace("gemini/", "").replace("models/", "").strip()
    if clean_model in ("gemini-flash", "flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.5-flash", "gemini-3.6-flash", ""):
        clean_model = "gemini-flash-lite-latest"

    # Priority list of active, verified Google AI Studio models (~1.7s latency)
    models_to_try = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite", "gemini-flash-latest"]
    if clean_model and clean_model not in models_to_try:
        models_to_try.insert(0, clean_model)

    # Format messages for Gemini API
    # Gemini requires strict alternating between 'user' and 'model'
    contents = []
    system_instruction = None

    for m in messages:
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if not content:
            continue

        if role == "system":
            system_instruction = {"parts": [{"text": content}]}
            continue

        gemini_role = "model" if role == "assistant" else "user"

        if contents and contents[-1]["role"] == gemini_role:
            # Combine consecutive turns with identical role into one turn
            contents[-1]["parts"][0]["text"] += "\n\n" + content
        else:
            contents.append({"role": gemini_role, "parts": [{"text": content}]})

    # Gemini requires the first turn to be 'user'
    if contents and contents[0]["role"] != "user":
        contents.insert(0, {"role": "user", "parts": [{"text": "Hello"}]})

    generation_config: dict[str, Any] = {
        "temperature": temperature,
        "maxOutputTokens": max(max_tokens, 4096),
    }
    if response_mime_type:
        generation_config["responseMimeType"] = response_mime_type

    payload: dict[str, Any] = {
        "contents": contents,
        "generationConfig": generation_config,
    }
    if system_instruction:
        payload["systemInstruction"] = system_instruction

    last_error = None
    with httpx.Client(timeout=25.0) as client:
        for try_model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{try_model}:generateContent?key={api_key}"
            try:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return "".join(p.get("text", "") for p in parts if isinstance(p, dict) and "text" in p)
                elif resp.status_code in (404, 429, 503):
                    logger.info("Gemini model %s returned status %d, trying next available model...", try_model, resp.status_code)
                    last_error = f"Model {try_model} status {resp.status_code}: {resp.text[:120]}"
                    continue
                else:
                    last_error = f"Gemini status {resp.status_code}: {resp.text[:200]}"
            except Exception as exc:
                last_error = str(exc)
                logger.warning("Error calling Gemini model %s: %s", try_model, exc)

    raise RuntimeError(f"Gemini direct call failed across models ({models_to_try}): {last_error}")


def call_llm(
    messages: list[dict],
    *,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
    response_format: dict | None = None,
) -> str:
    """
    Call the configured LLM via LiteLLM or direct Google Gemini API.
    Handles free-tier model routing and graceful retries.
    """
    _model = model or getattr(settings, "LITELLM_MODEL", "gemini/gemini-3.5-flash-lite")
    _temp = temperature if temperature is not None else getattr(settings, "LITELLM_TEMPERATURE", 0.4)
    _max_tokens = max_tokens if max_tokens is not None else getattr(settings, "LITELLM_MAX_TOKENS", 1024)

    _api_key, _api_base = _resolve_api_credentials(_model)

    if not _api_key and not _api_base:
        raise RuntimeError(f"No API key configured for model {_model}. Fast-falling back to local conversational engine.")

    # If it's a Gemini model with an API key, try direct fast caller first
    if "gemini" in _model.lower() and _api_key:
        try:
            response_mime = "application/json" if response_format and response_format.get("type") == "json_object" else None
            return _call_gemini_direct(messages, _api_key, _model, _temp, _max_tokens, response_mime_type=response_mime)
        except Exception as exc:
            logger.warning("Direct Gemini call failed (%s), trying LiteLLM gateway: %s", _model, exc)

    kwargs: dict[str, Any] = {
        "model": _model,
        "messages": messages,
        "temperature": _temp,
        "max_tokens": _max_tokens,
        "timeout": 25.0,
    }
    if _api_key:
        kwargs["api_key"] = _api_key
    if _api_base:
        kwargs["api_base"] = _api_base
    if response_format:
        kwargs["response_format"] = response_format

    try:
        import litellm
        litellm.set_verbose = getattr(settings, "DEBUG", False)
        response = litellm.completion(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("LiteLLM call failed with model %s: %s", _model, exc)
        raise RuntimeError(f"LLM call failed: {exc}") from exc

