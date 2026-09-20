"""
Profile views — stateless.

User profile data is never stored on the server.  The frontend keeps all
profile data in sessionStorage and discards it when the tab closes.

GET  /api/profile/  — always returns {"profile": null}
PUT  /api/profile/  — validates the payload shape and echoes it back;
                      nothing is written to the database.
"""
from pydantic import ValidationError
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView

from .schemas import UserProfileSchema


def _require_session(request):
    """
    Returns the session if authenticated, raises AuthenticationFailed otherwise.
    """
    session = getattr(request, "user", None)
    from sessions_app.models import Session
    if not isinstance(session, Session):
        raise AuthenticationFailed("A valid X-Session-Token header is required.")
    return session


class ProfileView(APIView):
    """
    GET /api/profile/   — user profile is not stored; always returns null
    PUT /api/profile/   — validates payload and echoes it back (no DB write)
    """

    def get(self, request):
        _require_session(request)
        return Response({"profile": None}, status=200)

    def put(self, request):
        _require_session(request)
        data = request.data

        try:
            schema = UserProfileSchema.model_validate(data)
        except ValidationError as exc:
            return Response({"error": "Invalid profile data", "detail": exc.errors()}, status=400)

        # Return the validated profile echoed back — nothing is saved to DB.
        return Response({"profile": schema.to_frontend_dict()})
