"""Progress and scoring API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RecordLookupRequest(BaseModel):
    """Request to record a word lookup."""

    dictionary_form: str


class RecordReadRequest(BaseModel):
    """Request to record words read without lookup."""

    dictionary_forms: list[str]
    looked_up_forms: list[str] = []


class ScoreUpdateResponse(BaseModel):
    """Response for a score update."""

    vocabulary_id: int
    old_score: float
    new_score: float
    times_seen: int
    times_looked_up: int
    consecutive_correct: int


class VocabularyScoreResponse(BaseModel):
    """Response for vocabulary score data."""

    vocabulary_id: int
    dictionary_form: str
    surface: str
    reading: str
    score: float
    times_seen: int
    times_looked_up: int
    consecutive_correct: int
    last_seen: datetime


class ProgressSummaryResponse(BaseModel):
    """Response for overall progress summary."""

    total_vocabulary: int
    known_words: int
    learning_words: int
    average_score: float
    mastery_percentage: float
    total_lookups: int
    total_words_seen: int


class WeakVocabularyResponse(BaseModel):
    """Response for weak vocabulary list."""

    items: list[VocabularyScoreResponse]
    total: int
