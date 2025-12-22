"""Schemas for video browse API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class VideoSearchResult(BaseModel):
    """Video search result."""

    video_id: str
    title: str
    channel: Optional[str] = None
    duration: Optional[int] = None
    thumbnail: Optional[str] = None
    url: str
    subtitles: list[str]
    automatic_captions: list[str]
    has_japanese_subs: bool


class VideoInfoResponse(BaseModel):
    """Detailed video information."""

    video_id: str
    title: str
    channel: Optional[str] = None
    duration: Optional[int] = None
    thumbnail: Optional[str] = None
    description: Optional[str] = None
    url: str
    subtitles: list[str]
    automatic_captions: list[str]
    has_japanese_subs: bool


class DownloadQueueRequest(BaseModel):
    """Request to queue a video download."""

    video_id: str
    title: str
    thumbnail_url: str


class DownloadResponse(BaseModel):
    """Download status response."""

    id: int
    video_id: str
    title: str
    thumbnail_url: str
    status: str
    progress: float
    file_path: Optional[str] = None
    subtitle_path: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
