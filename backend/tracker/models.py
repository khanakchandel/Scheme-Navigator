"""
Tracker models — user data is no longer stored in the database.

SavedScheme and TrackerItem were previously persisted per-session.
They have been removed: all saved-scheme and tracker data now lives
exclusively in the browser's sessionStorage and is discarded when the
tab closes.
"""
