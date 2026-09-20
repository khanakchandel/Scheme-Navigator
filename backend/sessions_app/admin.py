from django.contrib import admin
from .models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("token", "created_at")
    search_fields = ("token",)
    readonly_fields = ("token", "created_at")
