"""
Assistant views — stateless.

Conversation messages are no longer stored on the server.  Each chat request
is a single-turn call to the LLM with no persistent history.
The frontend (SchemeAdvisorChat) maintains the visible message list in
component state, which is discarded when the component unmounts.

GET  /api/assistant/messages/  — always returns an empty list
POST /api/assistant/chat/      — runs single-turn LLM call, returns answer
"""
import logging

from rest_framework.response import Response
from rest_framework.views import APIView

from sessions_app.profile_views import _require_session
from schemes.models import Scheme
from schemes.serializers import SchemeSerializer
from agents.assistant_agent import AssistantAgent

logger = logging.getLogger(__name__)


class AssistantMessagesView(APIView):
    """
    GET /api/assistant/messages/  — conversation history is not stored server-side
    """

    def get(self, request):
        _require_session(request)
        return Response({"messages": []})


SLUG_ALIASES = {
    "ayushman-bharat": "ayushman-bharat-pmjay",
    "pmjay": "ayushman-bharat-pmjay",
    "pm-jay": "ayushman-bharat-pmjay",
    "ayushman-card": "ayushman-bharat-pmjay",
    "ayushman": "ayushman-bharat-pmjay",
    "vaya-vandana": "ayushman-vaya-vandana-senior-citizens",
    "pm-kisan": "pm-kisan-samman-nidhi",
    "pmkisan": "pm-kisan-samman-nidhi",
    "kisan-samman-nidhi": "pm-kisan-samman-nidhi",
    "mudra": "pradhan-mantri-mudra-yojana",
    "mudra-loan": "pradhan-mantri-mudra-yojana",
    "pmmy": "pradhan-mantri-mudra-yojana",
    "pmay": "pmay-g",
    "pm-awas": "pmay-g",
    "pmay-gramin": "pmay-g",
    "sukanya": "sukanya-samriddhi-yojana",
    "sukanya-samriddhi": "sukanya-samriddhi-yojana",
    "ssy": "sukanya-samriddhi-yojana",
    "svanidhi": "pm-svanidhi",
    "pm-svanidhi": "pm-svanidhi",
    "vishwakarma": "pm-vishwakarma",
    "pm-vishwakarma": "pm-vishwakarma",
    "kusum": "pm-kusum-solar-pump-scheme",
    "pm-kusum": "pm-kusum-solar-pump-scheme",
    "fasal-bima": "pradhan-mantri-fasal-bima-yojana",
    "pmfby": "pradhan-mantri-fasal-bima-yojana",
    "kcc": "kisan-credit-card-kcc",
    "kisan-credit-card": "kisan-credit-card-kcc",
    "atal-pension": "atal-pension-yojana",
    "apy": "atal-pension-yojana",
    "suraksha-bima": "pradhan-mantri-suraksha-bima-yojana",
    "pmsby": "pradhan-mantri-suraksha-bima-yojana",
    "jeevan-jyoti": "pradhan-mantri-jeevan-jyoti-bima-yojana",
    "pmjjby": "pradhan-mantri-jeevan-jyoti-bima-yojana",
    "matru-vandana": "pradhan-mantri-matru-vandana-yojana",
    "pmmvy": "pradhan-mantri-matru-vandana-yojana",
    "ujjwala": "pradhan-mantri-ujjwala-yojana",
    "pm-ujjwala": "pradhan-mantri-ujjwala-yojana",
    "mgnrega": "mahatma-gandhi-nrega-mgnrega",
    "nrega": "mahatma-gandhi-nrega-mgnrega",
    "stand-up-india": "stand-up-india-scheme",
}


class AssistantChatView(APIView):
    """
    POST /api/assistant/chat/
    Body: { "message": "<user text>", "history": [...], "profile": {...} }
    Returns: { "answer": str, "referencedSchemes": Scheme[], "profileUpdated": bool }
    """

    def post(self, request):
        # Allow guest chat without blocking on session token
        try:
            _require_session(request)
        except Exception:
            pass

        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"error": "message is required"}, status=400)

        history = request.data.get("history", [])
        profile = request.data.get("profile", None)
        language = request.data.get("language", "en-IN")

        agent = AssistantAgent()
        result = agent.chat(
            history=history,
            message=message,
            current_profile=profile,
            language=language,
        )

        answer = result["answer"]
        referenced_ids = result.get("referenced_scheme_ids", [])
        updated_profile = result.get("updated_profile")

        # Hydrate referenced scheme objects using exact match, alias mapping, or fuzzy search
        referenced_schemes = []
        if referenced_ids:
            from django.db.models import Q
            matched_objs = []
            seen_ids = set()

            for raw_slug in referenced_ids:
                s_clean = raw_slug.strip().lower()
                target_slug = SLUG_ALIASES.get(s_clean, s_clean)

                # 1. Exact match
                scheme_obj = Scheme.objects.filter(slug=target_slug).first()

                # 2. Substring or short name match if not found
                if not scheme_obj:
                    scheme_obj = Scheme.objects.filter(
                        Q(slug__icontains=s_clean)
                        | Q(short_name__iexact=s_clean)
                        | Q(name__icontains=s_clean)
                    ).first()

                if scheme_obj and scheme_obj.id not in seen_ids:
                    matched_objs.append(scheme_obj)
                    seen_ids.add(scheme_obj.id)

            if matched_objs:
                referenced_schemes = SchemeSerializer(matched_objs, many=True).data

        return Response(
            {
                "answer": answer,
                "referencedSchemes": referenced_schemes,
                "profileUpdated": bool(updated_profile),
                "updatedProfile": updated_profile,
            }
        )


class TTSView(APIView):
    """
    GET  /api/assistant/tts/?text=<text>&lang=<lang>&rate=<rate>
    POST /api/assistant/tts/
    Body: { "text": "<text>", "lang": "<lang>", "rate": 1.0 }

    Returns MP3 audio stream of high-fidelity neural speech.
    Zero credits used, disk-cached for instant sub-millisecond response.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        text = (request.query_params.get("text") or "").strip()
        lang = (request.query_params.get("lang") or "or-IN").strip()
        try:
            rate = float(request.query_params.get("rate") or 1.0)
        except (ValueError, TypeError):
            rate = 1.0

        if not text:
            return Response({"error": "text parameter is required"}, status=400)

        return self._synthesize(text, lang, rate)

    def post(self, request):
        text = (request.data.get("text") or "").strip()
        lang = (request.data.get("lang") or "or-IN").strip()
        try:
            rate = float(request.data.get("rate") or 1.0)
        except (ValueError, TypeError):
            rate = 1.0

        if not text:
            return Response({"error": "text field is required"}, status=400)

        return self._synthesize(text, lang, rate)

    def _synthesize(self, text: str, lang: str, rate: float):
        from django.http import HttpResponse
        from asgiref.sync import async_to_sync
        from .tts_service import synthesize_neural_speech

        try:
            audio_bytes = async_to_sync(synthesize_neural_speech)(text, lang, rate)
            if not audio_bytes:
                return Response({"error": "Failed to generate audio"}, status=500)

            response = HttpResponse(audio_bytes, content_type="audio/mpeg")
            response["Content-Length"] = str(len(audio_bytes))
            response["Cache-Control"] = "public, max-age=86400"
            return response
        except Exception as e:
            logger.error(f"TTSView synthesis error: {e}", exc_info=True)
            return Response({"error": f"Speech synthesis failed: {str(e)}"}, status=500)


