"""
Session views: create a new anonymous session.
"""
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Session


class CreateSessionView(APIView):
    """
    POST /api/sessions/
    Creates a new anonymous session and returns the token.
    No authentication required.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        session = Session.objects.create()
        return Response({"token": str(session.token)}, status=201)
