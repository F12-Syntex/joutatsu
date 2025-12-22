"""Download model for tracking video download status."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Download(SQLModel, table=True):
    """Model for tracking video downloads."""

    __tablename__ = "downloads"

    id: Optional[int] = Field(default=None, primary_key=True)
    video_id: str = Field(index=True, unique=True)
    title: str
    thumbnail_url: str
    status: str = Field(default="pending")  # pending, downloading, completed, failed
    progress: float = Field(default=0.0)  # 0.0-1.0
    file_path: Optional[str] = None
    subtitle_path: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
