"""
Tracker (application status) views — stateless.

Tracker data is no longer stored on the server.  The frontend keeps all
application-status state in sessionStorage and discards it when the tab closes.

GET /api/tracker/              — always returns an empty list
PUT /api/tracker/<item_id>/    — acknowledged, nothing persisted
"""
from rest_framework.response import Response
from rest_framework.views import APIView

from sessions_app.profile_views import _require_session


class TrackerListView(APIView):
    """
    GET /api/tracker/  — tracker data is not stored server-side
    """

    def get(self, request):
        _require_session(request)
        return Response({"applications": []})


class TrackerDetailView(APIView):
    """
    PUT /api/tracker/<item_id>/  — acknowledged, nothing persisted
    """

    def put(self, request, item_id):
        _require_session(request)
        return Response({"id": item_id, **request.data})
