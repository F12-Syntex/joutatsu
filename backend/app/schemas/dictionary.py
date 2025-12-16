"""Schemas for dictionary API responses."""

from pydantic import BaseModel, Field


class Sense(BaseModel):
    """Word sense/meaning."""

    glosses: list[str] = Field(default_factory=list)
    pos: list[str] = Field(default_factory=list)
    misc: list[str] = Field(default_factory=list)


class PitchPattern(BaseModel):
    """Pitch accent pattern."""

    kanji: str = ""
    pattern: str = ""


class DictionaryEntry(BaseModel):
    """Single dictionary entry."""

    id: int
    kanji: list[str] = Field(default_factory=list)
    readings: list[str] = Field(default_factory=list)
    senses: list[Sense] = Field(default_factory=list)
    pitch_accent: list[PitchPattern] = Field(default_factory=list)


class LookupResponse(BaseModel):
    """Response for dictionary lookup."""

    query: str
    count: int
    entries: list[DictionaryEntry]


class PitchLookupResponse(BaseModel):
    """Response for pitch accent lookup."""

    reading: str
    count: int
    patterns: list[PitchPattern]
