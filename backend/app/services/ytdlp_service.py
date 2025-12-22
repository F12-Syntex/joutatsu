"""Service for interacting with yt-dlp to search and download videos."""

import hashlib
import json
from pathlib import Path
from typing import Callable, Optional

import yt_dlp


class YtDlpService:
    """Service for searching and downloading videos with yt-dlp."""

    def __init__(self, video_dir: Optional[Path] = None):
        """Initialize the yt-dlp service.

        Args:
            video_dir: Directory to store downloaded videos. Defaults to data/videos/
        """
        self.video_dir = video_dir or Path("data/videos")
        self.video_dir.mkdir(parents=True, exist_ok=True)
        self.subs_dir = self.video_dir / "subs"
        self.subs_dir.mkdir(exist_ok=True)
        self.thumbnails_dir = self.video_dir / "thumbnails"
        self.thumbnails_dir.mkdir(exist_ok=True)

    def _has_japanese_subtitles(self, info: dict) -> bool:
        """Check if video has Japanese subtitles.

        Args:
            info: Video info dict from yt-dlp

        Returns:
            True if Japanese subtitles are available
        """
        subtitles = info.get("subtitles", {})
        auto_captions = info.get("automatic_captions", {})

        # Check for manual Japanese subtitles
        if "ja" in subtitles or "ja-JP" in subtitles:
            return True

        # Check for automatic Japanese captions
        if "ja" in auto_captions or "ja-JP" in auto_captions:
            return True

        return False

    def _has_subtitle_language(self, info: dict, langs: list[str]) -> bool:
        """Check if video has subtitles in any of the specified languages.

        Args:
            info: Video info dict from yt-dlp
            langs: List of language codes to check for

        Returns:
            True if any of the specified language subtitles are available
        """
        subtitles = info.get("subtitles", {})
        auto_captions = info.get("automatic_captions", {})

        for lang in langs:
            # Check manual subtitles
            if lang in subtitles:
                return True
            # Check auto-generated captions
            if lang in auto_captions:
                return True

        return False

    def search_videos(
        self, query: str, max_results: int = 20, lang: str | list[str] = "ja"
    ) -> list[dict]:
        """Search for videos with subtitles in specified languages.

        Args:
            query: Search query
            max_results: Maximum number of results
            lang: Required subtitle language(s) - string or list of strings (default: ja)

        Returns:
            List of video metadata dicts
        """
        # Normalize lang to list
        if isinstance(lang, str):
            lang_list = [lang]
        else:
            lang_list = lang
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,
            "skip_download": True,
        }

        results = []
        search_url = f"ytsearch{max_results}:{query}"

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                search_results = ydl.extract_info(search_url, download=False)

                if not search_results or "entries" not in search_results:
                    return []

                for entry in search_results["entries"]:
                    if not entry:
                        continue

                    # Get full video info to check subtitles
                    try:
                        video_info = ydl.extract_info(
                            entry["url"], download=False
                        )

                        # Only include videos with specified language subtitles
                        if not self._has_subtitle_language(video_info, lang_list):
                            continue

                        results.append(
                            {
                                "video_id": entry.get("id"),
                                "title": entry.get("title"),
                                "channel": entry.get("channel"),
                                "duration": entry.get("duration"),
                                "thumbnail": entry.get("thumbnail"),
                                "url": entry.get("url"),
                                "subtitles": list(
                                    video_info.get("subtitles", {}).keys()
                                ),
                                "automatic_captions": list(
                                    video_info.get("automatic_captions", {}).keys()
                                ),
                            }
                        )
                    except Exception:
                        # Skip videos that fail to fetch
                        continue

        except Exception:
            return []

        return results

    def get_video_info(self, video_url: str) -> Optional[dict]:
        """Get detailed information about a video.

        Args:
            video_url: YouTube video URL or ID

        Returns:
            Video metadata dict or None if not found
        """
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)

                return {
                    "video_id": info.get("id"),
                    "title": info.get("title"),
                    "channel": info.get("channel"),
                    "duration": info.get("duration"),
                    "thumbnail": info.get("thumbnail"),
                    "description": info.get("description"),
                    "url": info.get("webpage_url"),
                    "subtitles": list(info.get("subtitles", {}).keys()),
                    "automatic_captions": list(
                        info.get("automatic_captions", {}).keys()
                    ),
                    "has_japanese_subs": self._has_japanese_subtitles(info),
                }
        except Exception:
            return None

    def download_video(
        self,
        video_url: str,
        quality: str = "720",
        progress_callback: Optional[Callable[[dict], None]] = None,
    ) -> Optional[dict]:
        """Download a video with Japanese subtitles.

        Args:
            video_url: YouTube video URL or ID
            quality: Video quality (default: 720p)
            progress_callback: Optional callback for progress updates

        Returns:
            Dict with file paths or None if download failed
        """
        video_id = self._get_video_id(video_url)

        def progress_hook(d):
            if progress_callback:
                progress_callback(d)

        ydl_opts = {
            "format": f"best[height<={quality}]",
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": ["ja", "ja-JP"],
            "subtitlesformat": "srt",
            "outtmpl": str(self.video_dir / f"{video_id}.%(ext)s"),
            "progress_hooks": [progress_hook],
            "quiet": True,
            "no_warnings": True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=True)

                # Find the downloaded files
                video_file = None
                subtitle_file = None

                # Video file
                if info.get("ext"):
                    video_file = self.video_dir / f"{video_id}.{info['ext']}"

                # Subtitle file
                for ext in ["ja.srt", "ja-JP.srt"]:
                    sub_path = self.video_dir / f"{video_id}.{ext}"
                    if sub_path.exists():
                        subtitle_file = sub_path
                        break

                return {
                    "video_id": video_id,
                    "title": info.get("title"),
                    "video_file": str(video_file) if video_file else None,
                    "subtitle_file": str(subtitle_file) if subtitle_file else None,
                    "thumbnail": info.get("thumbnail"),
                }
        except Exception as e:
            return None

    def _get_video_id(self, video_url: str) -> str:
        """Extract video ID from URL or generate hash.

        Args:
            video_url: YouTube URL or video ID

        Returns:
            Video ID string
        """
        # If it's just an ID, return it
        if not ("http://" in video_url or "https://" in video_url):
            return video_url

        # Extract ID from URL
        try:
            with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
                info = ydl.extract_info(video_url, download=False)
                return info.get("id", hashlib.md5(video_url.encode()).hexdigest())
        except Exception:
            # Fallback to hash
            return hashlib.md5(video_url.encode()).hexdigest()
