"""
Top-level API URL router.
All app-level URL patterns are included here.
"""
from django.urls import path, include

urlpatterns = [
    path("health/", include("config.health_urls")),
    path("sessions/", include("sessions_app.urls")),
    path("profile/", include("sessions_app.profile_urls")),
    path("survey/", include("sessions_app.survey_urls")),
    path("schemes/", include("schemes.urls")),
    path("recommendations/", include("schemes.recommendation_urls")),
    path("saved-schemes/", include("tracker.saved_urls")),
    path("tracker/", include("tracker.urls")),
    path("assistant/", include("assistant.urls")),
]
