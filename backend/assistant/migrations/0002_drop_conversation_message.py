"""
Drop ConversationMessage table.

Conversation history is no longer stored in the database.
All chat state lives only in the frontend's component state.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("assistant", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="ConversationMessage",
        ),
    ]
