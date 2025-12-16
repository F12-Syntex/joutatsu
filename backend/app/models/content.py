"""Content database models."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class ContentType(str, Enum):
    """Type of content source."""

    TEXT = "text"
    PDF = "pdf"
    EPUB = "epub"
    URL = "url"


class Content(SQLModel, table=True):
    """Content entry model."""

    __tablename__ = "content"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    source_type: ContentType
    file_path: Optional[str] = Field(default=None)
    original_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    difficulty_estimate: Optional[float] = Field(default=None)
    total_tokens: int = Field(default=0)
    unique_vocabulary: int = Field(default=0)


class ContentChunk(SQLModel, table=True):
    """Content chunk for paginated reading."""

    __tablename__ = "content_chunks"

    id: Optional[int] = Field(default=None, primary_key=True)
    content_id: int = Field(foreign_key="content.id", index=True)
    chunk_index: int = Field(index=True)
    raw_text: str
    tokenized_json: Optional[str] = Field(default=None)
    page_number: Optional[int] = Field(default=None)
