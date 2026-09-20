from django.urls import path
from .saved_views import SavedSchemeListView, SavedSchemeDetailView

urlpatterns = [
    path("", SavedSchemeListView.as_view(), name="saved-scheme-list"),
    path("<str:scheme_id>/", SavedSchemeDetailView.as_view(), name="saved-scheme-detail"),
]
