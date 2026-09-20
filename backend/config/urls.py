"""
URL configuration for SchemeNavigator backend.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse


def root_view(request):
    html = """
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #0F766E;">SchemeNavigator API Backend is Running! 🚀</h1>
      <p style="font-size: 18px; color: #4B5563;">
        This port (8000) provides the backend REST APIs.
      </p>
      <div style="margin-top: 30px; padding: 20px; background: #F3F4F6; display: inline-block; border-radius: 8px;">
        <p style="margin: 0; font-size: 16px;">To open the actual website & user interface:</p>
        <p style="margin: 10px 0 0 0;">
          👉 <a href="http://localhost:5173" style="font-size: 20px; font-weight: bold; color: #0284C7; text-decoration: none;">http://localhost:5173</a>
        </p>
      </div>
    </div>
    """
    return HttpResponse(html)


urlpatterns = [
    path("", root_view),
    path("admin/", admin.site.urls),
    path("api/", include("config.api_urls")),
]
