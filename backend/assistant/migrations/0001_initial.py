from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("sessions_app", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConversationMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("user", "User"), ("assistant", "Assistant")], max_length=10)),
                ("content", models.TextField()),
                ("referenced_scheme_ids", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="sessions_app.session")),
            ],
            options={
                "verbose_name": "Conversation Message",
                "verbose_name_plural": "Conversation Messages",
                "ordering": ["created_at"],
            },
        ),
    ]
