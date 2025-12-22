"""User proficiency database models."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class ProficiencyLevel(str, Enum):
    """User proficiency levels matching JLPT-style categories."""

    BEGINNER = "beginner"  # N5 equivalent
    ELEMENTARY = "elementary"  # N4 equivalent
    INTERMEDIATE = "intermediate"  # N3 equivalent
    UPPER_INTERMEDIATE = "upper_intermediate"  # N2 equivalent
    ADVANCED = "advanced"  # N1 equivalent


class UserProficiency(SQLModel, table=True):
    """User proficiency tracking model."""

    __tablename__ = "user_proficiency"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Calculated proficiency level
    level: ProficiencyLevel = Field(default=ProficiencyLevel.BEGINNER)

    # Reading behavior metrics
    total_characters_read: int = Field(default=0)
    total_tokens_read: int = Field(default=0)
    total_lookups: int = Field(default=0)
    total_reading_time_seconds: int = Field(default=0)

    # Rolling averages (last 7 days)
    avg_lookup_rate: float = Field(default=1.0)  # lookups per 100 tokens
    avg_reading_speed: float = Field(default=0.0)  # chars per minute

    # Difficulty rating history
    easy_ratings: int = Field(default=0)
    just_right_ratings: int = Field(default=0)
    hard_ratings: int = Field(default=0)

    # Multi-dimensional proficiency scores (0.0-1.0, higher = more proficient)
    kanji_proficiency: float = Field(default=0.0)  # Kanji recognition ability
    lexical_proficiency: float = Field(default=0.0)  # Vocabulary knowledge
    grammar_proficiency: float = Field(default=0.0)  # Grammar comprehension
    reading_proficiency: float = Field(default=0.0)  # Overall reading fluency

    # Target difficulty levels for each dimension (for content matching)
    target_kanji_difficulty: float = Field(default=0.3)
    target_lexical_difficulty: float = Field(default=0.3)
    target_grammar_difficulty: float = Field(default=0.3)

    # Auto-adjusted reader settings based on proficiency
    auto_furigana_threshold: float = Field(default=0.0)  # Show for words below this score
    auto_meanings_threshold: float = Field(default=0.0)  # Show meanings for words below this

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DifficultyRating(SQLModel, table=True):
    """Tracks user difficulty ratings per content."""

    __tablename__ = "difficulty_ratings"

    id: Optional[int] = Field(default=None, primary_key=True)
    content_id: int = Field(foreign_key="content.id", index=True)
    rating: str = Field(default="just_right")  # easy, just_right, hard
    feedback: Optional[str] = Field(default=None)
    chunk_position: Optional[int] = Field(default=None)
    rated_at: datetime = Field(default_factory=datetime.utcnow)
