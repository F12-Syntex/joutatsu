"""Vocabulary database models."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class VocabularySource(str, Enum):
    """Source of vocabulary entry."""

    ANKI = "anki"
    READING = "reading"
    MANUAL = "manual"


class Vocabulary(SQLModel, table=True):
    """Vocabulary entry model."""

    __tablename__ = "vocabulary"

    id: Optional[int] = Field(default=None, primary_key=True)
    surface: str = Field(index=True)
    reading: str = Field(index=True)
    dictionary_form: str = Field(index=True)
    jmdict_id: Optional[int] = Field(default=None)
    pitch_accent: Optional[str] = Field(default=None)
    source: VocabularySource = Field(default=VocabularySource.READING)
    anki_note_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
