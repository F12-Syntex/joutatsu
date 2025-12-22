"""Download manager service for queuing and managing video downloads."""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlmodel import Session, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.download import Download
from app.services.ytdlp_service import YtDlpService


class DownloadManager:
    """Manager for video download queue and progress tracking."""

    def __init__(self, session: AsyncSession, video_dir: Optional[Path] = None):
        """Initialize download manager.

        Args:
            session: Database session
            video_dir: Directory for downloaded videos
        """
        self._session = session
        self.ytdlp = YtDlpService(video_dir)
        self._download_tasks: dict[int, asyncio.Task] = {}

    async def queue_download(
        self, video_id: str, title: str, thumbnail_url: str
    ) -> Download:
        """Queue a video download.

        Args:
            video_id: YouTube video ID
            title: Video title
            thumbnail_url: Thumbnail URL

        Returns:
            Download record
        """
        # Check if already downloaded or queued
        statement = select(Download).where(Download.video_id == video_id)
        result = await self._session.exec(statement)
        existing = result.first()

        if existing:
            return existing

        # Create new download record
        download = Download(
            video_id=video_id,
            title=title,
            thumbnail_url=thumbnail_url,
            status="pending",
            progress=0.0,
        )

        self._session.add(download)
        await self._session.commit()
        await self._session.refresh(download)

        # Start download task
        task = asyncio.create_task(self._process_download(download.id))
        self._download_tasks[download.id] = task

        return download

    async def _process_download(self, download_id: int) -> None:
        """Process a download in the background.

        Args:
            download_id: Download record ID
        """
        # Get download record
        download = await self._session.get(Download, download_id)
        if not download:
            return

        # Update status to downloading
        download.status = "downloading"
        download.progress = 0.0
        await self._session.commit()

        def progress_callback(d):
            """Update download progress."""
            if d["status"] == "downloading":
                total = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
                downloaded = d.get("downloaded_bytes", 0)
                if total > 0:
                    download.progress = downloaded / total
                    asyncio.create_task(self._session.commit())

        try:
            # Download the video
            result = await asyncio.to_thread(
                self.ytdlp.download_video,
                download.video_id,
                progress_callback=progress_callback,
            )

            if result:
                # Success
                download.status = "completed"
                download.progress = 1.0
                download.file_path = result.get("video_file")
                download.subtitle_path = result.get("subtitle_file")
                download.completed_at = datetime.utcnow()
                download.error_message = None
            else:
                # Failed
                await self._handle_download_failure(download)

        except Exception as e:
            download.error_message = str(e)
            await self._handle_download_failure(download)

        await self._session.commit()

        # Remove from active tasks
        if download_id in self._download_tasks:
            del self._download_tasks[download_id]

    async def _handle_download_failure(self, download: Download) -> None:
        """Handle download failure with retry logic.

        Args:
            download: Download record
        """
        download.retry_count += 1

        if download.retry_count < 3:
            # Retry
            download.status = "pending"
            download.progress = 0.0
            # Schedule retry
            task = asyncio.create_task(self._process_download(download.id))
            self._download_tasks[download.id] = task
        else:
            # Give up after 3 retries
            download.status = "failed"
            # Clean up partial files
            if download.file_path:
                path = Path(download.file_path)
                if path.exists():
                    path.unlink()

    async def get_download(self, download_id: int) -> Optional[Download]:
        """Get download by ID.

        Args:
            download_id: Download ID

        Returns:
            Download record or None
        """
        return await self._session.get(Download, download_id)

    async def list_downloads(
        self, status: Optional[str] = None
    ) -> list[Download]:
        """List all downloads.

        Args:
            status: Optional status filter

        Returns:
            List of download records
        """
        statement = select(Download).order_by(Download.created_at.desc())

        if status:
            statement = statement.where(Download.status == status)

        result = await self._session.exec(statement)
        return list(result.all())

    async def cancel_download(self, download_id: int) -> bool:
        """Cancel a download.

        Args:
            download_id: Download ID

        Returns:
            True if cancelled
        """
        download = await self._session.get(Download, download_id)
        if not download:
            return False

        # Cancel task if running
        if download_id in self._download_tasks:
            self._download_tasks[download_id].cancel()
            del self._download_tasks[download_id]

        # Update status
        if download.status in ("pending", "downloading"):
            download.status = "failed"
            download.error_message = "Cancelled by user"
            await self._session.commit()

        return True

    async def delete_download(self, download_id: int) -> bool:
        """Delete a download and its files.

        Args:
            download_id: Download ID

        Returns:
            True if deleted
        """
        download = await self._session.get(Download, download_id)
        if not download:
            return False

        # Cancel if in progress
        await self.cancel_download(download_id)

        # Delete files
        if download.file_path:
            path = Path(download.file_path)
            if path.exists():
                path.unlink()

        if download.subtitle_path:
            path = Path(download.subtitle_path)
            if path.exists():
                path.unlink()

        # Delete record
        await self._session.delete(download)
        await self._session.commit()

        return True
