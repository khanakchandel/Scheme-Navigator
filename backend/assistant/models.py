"""
Assistant models — conversation history is no longer stored in the database.

ConversationMessage was previously persisted per-session.
It has been removed: chat history lives only in the frontend's component state
and is discarded when the component unmounts / tab closes.
"""
