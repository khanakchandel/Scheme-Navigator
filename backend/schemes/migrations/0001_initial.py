from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Scheme",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(max_length=120, unique=True)),
                ("name", models.CharField(max_length=300)),
                ("short_name", models.CharField(blank=True, max_length=100)),
                ("tagline", models.CharField(max_length=300)),
                ("category", models.CharField(
                    choices=[
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
                    ],
                    max_length=50,
                )),
                ("level", models.CharField(
                    choices=[("Central", "Central"), ("State", "State")],
                    default="Central",
                    max_length=10,
                )),
                ("covered_states", models.JSONField(default=list)),
                ("short_description", models.TextField()),
                ("detailed_description", models.TextField()),
                ("eligibility", models.JSONField(default=dict)),
                ("benefits", models.JSONField(default=list)),
                ("documents", models.JSONField(default=list)),
                ("application_steps", models.JSONField(default=list)),
                ("verification", models.JSONField(default=dict)),
                ("popular_score", models.FloatField(default=0.0)),
                ("tags", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Scheme",
                "verbose_name_plural": "Schemes",
                "ordering": ["-popular_score", "name"],
            },
        ),
        migrations.AddIndex(
            model_name="scheme",
            index=models.Index(fields=["category"], name="schemes_sch_categor_idx"),
        ),
        migrations.AddIndex(
            model_name="scheme",
            index=models.Index(fields=["level"], name="schemes_sch_level_idx"),
        ),
        migrations.AddIndex(
            model_name="scheme",
            index=models.Index(fields=["popular_score"], name="schemes_sch_popular_idx"),
        ),
    ]
