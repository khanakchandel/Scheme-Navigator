from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("sessions_app", "0001_initial"),
        ("schemes", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SavedScheme",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("saved_at", models.DateTimeField(auto_now_add=True)),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saved_schemes", to="sessions_app.session")),
                ("scheme", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="saved_by", to="schemes.scheme")),
            ],
            options={
                "verbose_name": "Saved Scheme",
                "verbose_name_plural": "Saved Schemes",
                "ordering": ["-saved_at"],
            },
        ),
        migrations.CreateModel(
            name="TrackerItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(
                    choices=[
                        ("Exploring", "Exploring"),
                        ("Documents Needed", "Documents Needed"),
                        ("Ready to Apply", "Ready to Apply"),
                        ("Applied Externally", "Applied Externally"),
                        ("Completed", "Completed"),
                    ],
                    default="Exploring",
                    max_length=30,
                )),
                ("notes", models.TextField(blank=True)),
                ("prepared_documents", models.JSONField(default=list)),
                ("external_application_date", models.DateField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tracker_items", to="sessions_app.session")),
                ("scheme", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tracker_entries", to="schemes.scheme")),
            ],
            options={
                "verbose_name": "Tracker Item",
                "verbose_name_plural": "Tracker Items",
                "ordering": ["-updated_at"],
            },
        ),
        migrations.AlterUniqueTogether(
            name="savedscheme",
            unique_together={("session", "scheme")},
        ),
        migrations.AlterUniqueTogether(
            name="trackeritem",
            unique_together={("session", "scheme")},
        ),
    ]
