"""Proficiency API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProficiencyStatsResponse(BaseModel):
    """Proficiency statistics response."""

    level: str
    total_characters_read: int
    total_tokens_read: int
    total_lookups: int
    total_reading_time_minutes: int
    lookup_rate: float
    reading_speed: float
    easy_ratings: int
    just_right_ratings: int
    hard_ratings: int

    # Multi-dimensional proficiency scores
    kanji_proficiency: float
    lexical_proficiency: float
    grammar_proficiency: float
    reading_proficiency: float

    # Target difficulty levels
    target_kanji_difficulty: float
    target_lexical_difficulty: float
    target_grammar_difficulty: float


class ReaderRecommendationsResponse(BaseModel):
    """Reader settings recommendations based on proficiency."""

    show_furigana: str  # "all", "unknown", "none"
    show_meanings: bool
    furigana_threshold: float
    highlight_unknown: bool
    suggested_level: str


class RecordReadingRequest(BaseModel):
    """Request to record reading session metrics."""

    characters_read: int
    tokens_read: int
    lookups: int
    reading_time_seconds: int


class RecordDifficultyRequest(BaseModel):
    """Request to record difficulty rating."""

    content_id: int
    rating: str  # "easy", "just_right", "hard"
    feedback: Optional[str] = None
    chunk_position: Optional[int] = None


class UpdateThresholdsRequest(BaseModel):
    """Request to update auto-adjustment thresholds."""

    furigana_threshold: Optional[float] = None
    meanings_threshold: Optional[float] = None


class DifficultyRatingResponse(BaseModel):
    """Difficulty rating response."""

    id: int
    content_id: int
    rating: str
    feedback: Optional[str]
    chunk_position: Optional[int]
    rated_at: datetime
