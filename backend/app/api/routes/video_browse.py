"""API routes for video browsing and downloading."""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.schemas.video_browse import (
    DownloadQueueRequest,
    DownloadResponse,
    VideoInfoResponse,
    VideoSearchResult,
)
from app.services.download_manager import DownloadManager
from app.services.ytdlp_service import YtDlpService

router = APIRouter(prefix="/videos", tags=["video_browse"])


@router.get("/search")
async def search_videos(
    q: str = Query(..., description="Search query"),
    lang: str = Query("ja", description="Required subtitle language"),
    max_results: int = Query(20, ge=1, le=50),
) -> list[VideoSearchResult]:
    """Search for videos with Japanese subtitles."""
    ytdlp = YtDlpService()

    try:
        results = await asyncio.to_thread(
            ytdlp.search_videos, q, max_results, lang
        )

        return [
            VideoSearchResult(
                video_id=r["video_id"],
                title=r["title"],
                channel=r.get("channel"),
                duration=r.get("duration"),
                thumbnail=r.get("thumbnail"),
                url=r["url"],
                subtitles=r.get("subtitles", []),
                automatic_captions=r.get("automatic_captions", []),
                has_japanese_subs="ja" in r.get("subtitles", [])
                or "ja" in r.get("automatic_captions", []),
            )
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{video_id}")
async def get_video_info(video_id: str) -> VideoInfoResponse:
    """Get detailed information about a video."""
    ytdlp = YtDlpService()

    try:
        import asyncio

        info = await asyncio.to_thread(ytdlp.get_video_info, video_id)

        if not info:
            raise HTTPException(status_code=404, detail="Video not found")

        return VideoInfoResponse(**info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/download")
async def queue_download(
    request: DownloadQueueRequest,
    session: AsyncSession = Depends(get_session),
) -> DownloadResponse:
    """Queue a video download."""
    manager = DownloadManager(session)

    try:
        download = await manager.queue_download(
            video_id=request.video_id,
            title=request.title,
            thumbnail_url=request.thumbnail_url,
        )

        return DownloadResponse.model_validate(download)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/downloads")
async def list_downloads(
    status: str | None = Query(None, description="Filter by status"),
    session: AsyncSession = Depends(get_session),
) -> list[DownloadResponse]:
    """List all downloads."""
    manager = DownloadManager(session)

    try:
        downloads = await manager.list_downloads(status=status)
        return [DownloadResponse.model_validate(d) for d in downloads]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/downloads/{download_id}")
async def get_download_progress(
    download_id: int,
    session: AsyncSession = Depends(get_session),
) -> DownloadResponse:
    """Get download progress."""
    manager = DownloadManager(session)

    try:
        download = await manager.get_download(download_id)

        if not download:
            raise HTTPException(status_code=404, detail="Download not found")

        return DownloadResponse.model_validate(download)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/downloads/{download_id}")
async def delete_download(
    download_id: int,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Cancel and delete a download."""
    manager = DownloadManager(session)

    try:
        success = await manager.delete_download(download_id)

        if not success:
            raise HTTPException(status_code=404, detail="Download not found")

        return {"message": "Download deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
