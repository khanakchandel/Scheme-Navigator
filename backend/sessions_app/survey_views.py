"""
Survey views — stateless.

Survey profile and draft data are never stored on the server.
All survey state lives in the browser's sessionStorage.

POST /api/survey/submit/ — validates profile, computes recommendations, returns both.
                           Nothing is written to the database.
GET  /api/survey/draft/  — always returns {"draft": null}
PUT  /api/survey/draft/  — accepts draft payload, echoes it back (no DB write).
"""
from pydantic import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .schemas import UserProfileSchema
from .profile_views import _require_session


class SurveySubmitView(APIView):
    """
    POST /api/survey/submit/
    Validates the completed profile and returns recommendations.
    Nothing is written to the database.
    """

    def post(self, request):
        _require_session(request)
        data = request.data.get("profile", request.data)

        try:
            schema = UserProfileSchema.model_validate(data)
        except ValidationError as exc:
            return Response({"error": "Invalid profile data", "detail": exc.errors()}, status=400)

        profile_dict = schema.to_frontend_dict()

        # Compute recommendations synchronously (fast enough for survey flow)
        from agents.recommendation_agent import RecommendationAgent
        agent = RecommendationAgent()
        recommendations = agent.recommend(profile_dict)

        return Response(
            {
                "profile": profile_dict,
                "recommendations": recommendations,
            },
            status=200,
        )


class SurveyDraftView(APIView):
    """
    GET  /api/survey/draft/  — draft data is not stored; always returns null
    PUT  /api/survey/draft/  — accepts draft payload, echoes it back (no DB write)
    """

    def get(self, request):
        _require_session(request)
        return Response({"draft": None})

    def put(self, request):
        _require_session(request)
        # Echo back without persisting — the frontend keeps draft state itself.
        return Response({"draft": request.data})
