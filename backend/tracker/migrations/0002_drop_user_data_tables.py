"""
Drop SavedScheme and TrackerItem tables.

User data (saved schemes, application tracker) is no longer stored in the
database.  All such data lives only in the browser's sessionStorage.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tracker", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(
            name="SavedScheme",
        ),
        migrations.DeleteModel(
            name="TrackerItem",
        ),
    ]
