from django.urls import path
from .recommendation_views import RecommendationsView

urlpatterns = [
    path("", RecommendationsView.as_view(), name="recommendations"),
]
