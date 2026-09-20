from django.urls import path
from .survey_views import SurveySubmitView, SurveyDraftView

urlpatterns = [
    path("submit/", SurveySubmitView.as_view(), name="survey-submit"),
    path("draft/", SurveyDraftView.as_view(), name="survey-draft"),
]
