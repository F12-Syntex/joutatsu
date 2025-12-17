"""Pydantic schemas for content API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.content import ContentType


class ContentImportRequest(BaseModel):
    """Request schema for importing text content."""

    title: str = Field(..., min_length=1, max_length=500)
    text: str = Field(..., min_length=1)
    source_type: ContentType = ContentType.TEXT
    chunk_size: int = Field(default=2000, ge=100, le=10000)
    pre_tokenize: bool = True


class ContentResponse(BaseModel):
    """Response schema for content."""

    id: int
    title: str
    source_type: ContentType
    file_path: Optional[str]
    original_url: Optional[str]
    created_at: datetime
    difficulty_estimate: Optional[float]
    total_tokens: int
    unique_vocabulary: int
    chunk_count: int = 0


class ContentListResponse(BaseModel):
    """Response schema for content list."""

    items: list[ContentResponse]
    total: int
    limit: int
    offset: int


class ContentChunkResponse(BaseModel):
    """Response schema for a content chunk."""

    id: int
    content_id: int
    chunk_index: int
    raw_text: str
    tokenized_json: Optional[str]
    page_number: Optional[int]


class ContentDetailResponse(BaseModel):
    """Response schema for content with chunks."""

    content: ContentResponse
    chunks: list[ContentChunkResponse]


class ContentFilterParams(BaseModel):
    """Query parameters for content filtering."""

    source_type: Optional[ContentType] = None
    min_difficulty: Optional[float] = Field(default=None, ge=0, le=1)
    max_difficulty: Optional[float] = Field(default=None, ge=0, le=1)
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
