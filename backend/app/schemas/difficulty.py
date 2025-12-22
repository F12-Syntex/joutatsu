"""Difficulty analysis schemas."""

from pydantic import BaseModel


class DifficultyAnalysisRequest(BaseModel):
    """Request to analyze text difficulty."""

    text: str


class DifficultyMetricsResponse(BaseModel):
    """Multi-dimensional difficulty analysis response."""

    overall_difficulty: float
    kanji_difficulty: float
    lexical_difficulty: float
    grammar_complexity: float
    sentence_complexity: float
    difficulty_level: str
    total_characters: int
    kanji_count: int
    unique_kanji: int
    avg_sentence_length: float


class ContentDifficultyRequest(BaseModel):
    """Request to analyze content difficulty by ID."""

    content_id: int
    chunk_index: int | None = None  # Optional specific chunk
