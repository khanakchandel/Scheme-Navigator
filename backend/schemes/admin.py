from django.contrib import admin
from .models import Scheme


@admin.register(Scheme)
class SchemeAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "level", "popular_score", "updated_at")
    list_filter = ("category", "level")
    search_fields = ("name", "slug", "short_description", "tags")
    ordering = ("-popular_score",)
    readonly_fields = ("created_at", "updated_at")
