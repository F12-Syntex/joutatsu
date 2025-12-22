"""Schemas for text generation API."""

from typing import Optional

from pydantic import BaseModel, Field


class GenerateTextRequest(BaseModel):
    """Request to generate Japanese text at specified difficulty."""

    topic: Optional[str] = Field(None, description="Topic for the generated text")
    genre: str = Field("general", description="Text genre: general, story, dialogue, news, essay")
    length: str = Field("medium", description="Text length: short, medium, long")

    # If provided, use these exact difficulty targets
    kanji_difficulty: Optional[float] = Field(None, ge=0.0, le=1.0)
    lexical_difficulty: Optional[float] = Field(None, ge=0.0, le=1.0)
    grammar_difficulty: Optional[float] = Field(None, ge=0.0, le=1.0)

    # If true, use user's proficiency + challenge_level
    use_user_proficiency: bool = Field(True, description="Match to user's skill level")
    challenge_level: float = Field(0.1, ge=0.0, le=0.5, description="How much harder than user level (0-0.5)")


class GenerateTextResponse(BaseModel):
    """Response containing generated text."""

    text: str
    topic: str
    genre: str
    target_difficulty: float
    difficulty_level: str  # Human-readable level


class ProficiencySettingsRequest(BaseModel):
    """Request to update proficiency-related settings."""

    auto_adjust_furigana: Optional[bool] = None
    auto_adjust_meanings: Optional[bool] = None
    target_kanji_difficulty: Optional[float] = Field(None, ge=0.0, le=1.0)
    target_lexical_difficulty: Optional[float] = Field(None, ge=0.0, le=1.0)
    target_grammar_difficulty: Optional[float] = Field(None, ge=0.0, le=1.0)
    challenge_level: Optional[float] = Field(None, ge=0.0, le=0.5)


class ProficiencySettingsResponse(BaseModel):
    """Current proficiency settings."""

    auto_adjust_furigana: bool
    auto_adjust_meanings: bool
    target_kanji_difficulty: float
    target_lexical_difficulty: float
    target_grammar_difficulty: float
    challenge_level: float

    # Current user proficiency for reference
    kanji_proficiency: float
    lexical_proficiency: float
    grammar_proficiency: float
    reading_proficiency: float
