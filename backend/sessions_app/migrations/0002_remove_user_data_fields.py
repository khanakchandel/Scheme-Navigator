"""
Remove all user-data fields from Session:
  - profile       (UserProfile JSON)
  - survey_draft  (in-progress survey answers)
  - last_active   (no longer tracked — sessions carry no user data)

User data is never stored permanently on the server.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("sessions_app", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="session",
            name="profile",
        ),
        migrations.RemoveField(
            model_name="session",
            name="survey_draft",
        ),
        migrations.RemoveField(
            model_name="session",
            name="last_active",
        ),
    ]
