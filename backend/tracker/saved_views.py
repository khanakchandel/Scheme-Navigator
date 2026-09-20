"""
Saved Schemes views — stateless.

Saved-scheme data is no longer stored on the server.  The frontend keeps
all bookmark state in sessionStorage and discards it when the tab closes.

GET    /api/saved-schemes/             — always returns an empty list
POST   /api/saved-schemes/<scheme_id>/ — echoes success (no DB write)
DELETE /api/saved-schemes/<scheme_id>/ — echoes success (no DB write)
"""
from rest_framework.response import Response
from rest_framework.views import APIView

from sessions_app.profile_views import _require_session


class SavedSchemeListView(APIView):
    """
    GET /api/saved-schemes/  — saved schemes are not stored server-side
    """

    def get(self, request):
        _require_session(request)
        return Response({"savedSchemes": []})


class SavedSchemeDetailView(APIView):
    """
    POST   /api/saved-schemes/<scheme_id>/  — acknowledged, nothing persisted
    DELETE /api/saved-schemes/<scheme_id>/  — acknowledged, nothing persisted
    """

    def post(self, request, scheme_id):
        _require_session(request)
        return Response({"saved": True, "schemeId": scheme_id}, status=200)

    def delete(self, request, scheme_id):
        _require_session(request)
        return Response({"saved": False, "schemeId": scheme_id, "deleted": True})
