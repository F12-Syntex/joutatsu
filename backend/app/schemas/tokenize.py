"""Schemas for tokenization API."""

from pydantic import BaseModel, Field


class TokenSchema(BaseModel):
    """Token response schema."""

    surface: str = Field(..., description="Surface form as it appears in text")
    dictionary_form: str = Field(..., description="Dictionary form of the word")
    reading: str = Field(..., description="Reading in katakana")
    pos: list[str] = Field(..., description="Full part of speech tags")
    pos_short: str = Field(..., description="Short part of speech label")
    start: int = Field(..., description="Start position in text")
    end: int = Field(..., description="End position in text")
    is_known: bool = Field(False, description="Whether word is in user's vocabulary")


class TokenizeRequest(BaseModel):
    """Request body for tokenization."""

    text: str = Field(..., min_length=1, max_length=10000, description="Japanese text")
    mode: str = Field("C", pattern="^[ABC]$", description="Split mode: A/B/C")


class TokenizeResponse(BaseModel):
    """Response for tokenization."""

    text: str = Field(..., description="Original input text")
    mode: str = Field(..., description="Split mode used")
    token_count: int = Field(..., description="Number of tokens")
    tokens: list[TokenSchema] = Field(..., description="Tokenized words")


class BatchTokenizeRequest(BaseModel):
    """Request body for batch tokenization."""

    texts: list[str] = Field(
        ..., min_length=1, max_length=100, description="List of texts"
    )
    mode: str = Field("C", pattern="^[ABC]$", description="Split mode: A/B/C")


class BatchTokenizeResponse(BaseModel):
    """Response for batch tokenization."""

    mode: str = Field(..., description="Split mode used")
    count: int = Field(..., description="Number of texts processed")
    results: list[TokenizeResponse] = Field(..., description="Results per text")
