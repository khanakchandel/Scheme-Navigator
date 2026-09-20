"""
Session model for anonymous (sessionless) user identification.
Each browser gets a UUID token stored in sessionStorage — it is never
persisted on the server beyond tracking that a session exists so the
X-Session-Token header can be validated within the same browser session.

No user data (profile, survey answers, saved schemes, tracker items) is
stored permanently.  All such data lives only in the browser's sessionStorage
and is discarded when the tab closes.
"""
import uuid
from django.db import models


class Session(models.Model):
    token = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Session"
        verbose_name_plural = "Sessions"

    def __str__(self) -> str:
        return f"Session {self.token}"

    @property
    def token_str(self) -> str:
        return str(self.token)
