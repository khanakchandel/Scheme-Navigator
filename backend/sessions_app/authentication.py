"""
Custom DRF authentication using the X-Session-Token header.
This replaces Django's session/cookie auth for anonymous browser sessions.

Sessions carry NO user data on the server — they are purely a lightweight
token so the frontend can authenticate requests within a browser tab.
All user data lives in sessionStorage and is discarded when the tab closes.
"""
import uuid

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Session


class SessionTokenAuthentication(BaseAuthentication):
    """
    Reads the 'X-Session-Token' header and resolves it to a Session object.

    Returns:
        (session, None) — if the token is valid.
        None            — if the header is absent (allows unauthenticated access).

    Raises:
        AuthenticationFailed — if the token is malformed or unknown.
    """

    HEADER_NAME = "HTTP_X_SESSION_TOKEN"

    def authenticate(self, request):
        token_str = request.META.get(self.HEADER_NAME)
        if not token_str:
            return None  # No token → anonymous; let permission classes decide

        # Validate UUID format
        try:
            token_uuid = uuid.UUID(str(token_str).strip())
        except ValueError:
            raise AuthenticationFailed("Invalid session token format.")

        try:
            session = Session.objects.get(token=token_uuid)
        except Session.DoesNotExist:
            raise AuthenticationFailed("Session token not found.")

        return (session, None)

    def authenticate_header(self, request):
        return "SessionToken"
