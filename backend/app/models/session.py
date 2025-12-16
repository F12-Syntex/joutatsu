"""Reading session database models."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class ReadingSession(SQLModel, table=True):
    """Reading session tracking model."""

    __tablename__ = "reading_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    content_id: int = Field(foreign_key="content.id", index=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = Field(default=None)
    tokens_read: int = Field(default=0)
    lookups_count: int = Field(default=0)
    chunk_position: int = Field(default=0)  # Resume position
