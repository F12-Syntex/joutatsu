"""Reading session API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    """Request to start a reading session."""

    content_id: int
    chunk_position: int = 0


class EndSessionRequest(BaseModel):
    """Request to end a reading session."""

    tokens_read: int = 0
    lookups_count: int = 0
    chunk_position: int = 0


class UpdateProgressRequest(BaseModel):
    """Request to update session progress."""

    tokens_read: int
    lookups_count: int
    chunk_position: int


class SessionResponse(BaseModel):
    """Response for a reading session."""

    id: int
    content_id: int
    started_at: datetime
    ended_at: Optional[datetime]
    tokens_read: int
    lookups_count: int
    chunk_position: int


class SessionWithContentResponse(BaseModel):
    """Response for session with content info."""

    id: int
    content_id: int
    content_title: str
    started_at: datetime
    ended_at: Optional[datetime]
    tokens_read: int
    lookups_count: int
    chunk_position: int


class SessionStatsResponse(BaseModel):
    """Response for session statistics."""

    total_sessions: int
    completed_sessions: int
    total_tokens_read: int
    total_lookups: int


class SessionHistoryResponse(BaseModel):
    """Response for session history."""

    sessions: list[SessionWithContentResponse]
    total: int
