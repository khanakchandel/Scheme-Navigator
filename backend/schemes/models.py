"""
Scheme model — mirrors the TypeScript Scheme interface exactly.

Nested structures (eligibility, benefits, documents, applicationSteps,
verification) are stored as PostgreSQL JSONB fields for schema flexibility
and to allow future migrations without table rebuilds.
"""
from django.db import models


class Scheme(models.Model):
    CATEGORY_CHOICES = [
        ("Education", "Education"),
        ("Agriculture", "Agriculture"),
        ("Employment", "Employment"),
        ("Business", "Business"),
        ("Women & Child", "Women & Child"),
        ("Housing", "Housing"),
        ("Healthcare", "Healthcare"),
        ("Social Security", "Social Security"),
        ("Financial Assistance", "Financial Assistance"),
        ("Skill Development", "Skill Development"),
    ]

    LEVEL_CHOICES = [
        ("Central", "Central"),
        ("State", "State"),
    ]

    # ── Core identity ───────────────────────────────────────────────────────
    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=300)
    short_name = models.CharField(max_length=100, blank=True)
    tagline = models.CharField(max_length=300)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default="Central")

    # covered_states: list of state names, ['All India'] means nationwide
    covered_states = models.JSONField(default=list)

    # ── Descriptions ────────────────────────────────────────────────────────
    short_description = models.TextField()
    detailed_description = models.TextField()

    # ── Eligibility (JSONB) ─────────────────────────────────────────────────
    # Shape mirrors EligibilityCriteria TS interface:
    # {
    #   minAge?, maxAge?, allowedGenders?, allowedStates?,
    #   allowedCategories?, allowedOccupations?, maxAnnualIncome?,
    #   incomeRangesAllowed?, requiresDisability?, requiresMinority?,
    #   requiresBPL?, areaEligibility?, customConditions?
    # }
    eligibility = models.JSONField(default=dict)

    # ── Benefits / Documents / Steps (JSONB arrays) ─────────────────────────
    benefits = models.JSONField(default=list)          # Benefit[]
    documents = models.JSONField(default=list)         # DocumentRequirement[]
    application_steps = models.JSONField(default=list) # ApplicationStep[]

    # ── Verification ────────────────────────────────────────────────────────
    # {
    #   sourceDepartment, ministryOrAuthority, lastUpdated,
    #   officialPortalUrl, helpline?, isOfficialVerified, demoDataNotice?
    # }
    verification = models.JSONField(default=dict)

    # ── Scoring & Discovery ─────────────────────────────────────────────────
    popular_score = models.FloatField(default=0.0)
    tags = models.JSONField(default=list)  # list[str]

    # ── Timestamps ──────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-popular_score", "name"]
        verbose_name = "Scheme"
        verbose_name_plural = "Schemes"
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["level"]),
            models.Index(fields=["popular_score"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.slug})"
