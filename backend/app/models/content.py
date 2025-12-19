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
    cover_image_id: Optional[int] = Field(default=None)
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


class ContentImage(SQLModel, table=True):
    """Image extracted from content (PDF, EPUB, etc.)."""

    __tablename__ = "content_images"

    id: Optional[int] = Field(default=None, primary_key=True)
    content_id: int = Field(foreign_key="content.id", index=True)
    chunk_index: Optional[int] = Field(default=None, index=True)
    image_index: int = Field(default=0)
    page_number: Optional[int] = Field(default=None)
    extension: str = Field(default="jpg")
    width: int = Field(default=0)
    height: int = Field(default=0)
    data: bytes = Field(default=b"")
