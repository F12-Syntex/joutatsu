"""Progress and scoring database models."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class VocabularyScore(SQLModel, table=True):
    """Vocabulary score tracking model."""

    __tablename__ = "vocabulary_scores"

    id: Optional[int] = Field(default=None, primary_key=True)
    vocabulary_id: int = Field(foreign_key="vocabulary.id", index=True)
    score: float = Field(default=0.0)  # 0.0 to 1.0
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    times_seen: int = Field(default=0)
    times_looked_up: int = Field(default=0)
    consecutive_correct: int = Field(default=0)


class SessionLookup(SQLModel, table=True):
    """Tracks vocabulary lookups during reading sessions."""

    __tablename__ = "session_lookups"

    id: Optional[int] = Field(default=None, primary_key=True)
    vocabulary_id: int = Field(foreign_key="vocabulary.id", index=True)
    session_id: int = Field(foreign_key="reading_sessions.id", index=True)
    looked_up_at: datetime = Field(default_factory=datetime.utcnow)
    context: Optional[str] = Field(default=None)
