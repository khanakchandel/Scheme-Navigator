from django.urls import path
from .views import CreateSessionView

urlpatterns = [
    path("", CreateSessionView.as_view(), name="session-create"),
]
