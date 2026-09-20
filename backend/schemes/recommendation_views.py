"""
Recommendations views — stateless.

Profile data is not stored on the server; recommendations are computed from
the profile supplied in each request body.

GET  /api/recommendations/  — requires a profile in the request body
POST /api/recommendations/  — compute recommendations from a supplied profile
"""
from pydantic import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from sessions_app.profile_views import _require_session
from sessions_app.schemas import UserProfileSchema
from agents.recommendation_agent import RecommendationAgent


class RecommendationsView(APIView):
    """
    GET  /api/recommendations/  — profile is not stored; returns empty list
    POST /api/recommendations/  — compute from a profile supplied in the request body
    """

    def get(self, request):
        _require_session(request)
        # Profile is never stored on the server; clients must POST with a profile.
        return Response({"recommendations": []})

    def post(self, request):
        _require_session(request)
        data = request.data.get("profile", request.data)

        try:
            schema = UserProfileSchema.model_validate(data)
        except ValidationError as exc:
            return Response({"error": "Invalid profile data", "detail": exc.errors()}, status=400)

        profile_dict = schema.to_frontend_dict()
        agent = RecommendationAgent()
        results = agent.recommend(profile_dict)
        return Response({"recommendations": results})
