import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Session",
            fields=[
                ("token", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_active", models.DateTimeField(auto_now=True)),
                ("profile", models.JSONField(blank=True, null=True)),
                ("survey_draft", models.JSONField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Session",
                "verbose_name_plural": "Sessions",
                "ordering": ["-last_active"],
            },
        ),
    ]
