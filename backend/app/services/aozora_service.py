"""Aozora Bunko service for fetching Japanese literature."""

import csv
import io
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx

# Catalog URL (UTF-8 version)
CATALOG_URL = "https://www.aozora.gr.jp/index_pages/list_person_all_extended_utf8.zip"
CATALOG_CSV_NAME = "list_person_all_extended_utf8.csv"


@dataclass
class AozoraWork:
    """Represents a work from Aozora Bunko."""

    work_id: str
    title: str
    author_name: str
    author_id: str
    text_url: Optional[str]
    html_url: Optional[str]
    first_published: Optional[str]
    character_type: Optional[str]  # 新字新仮名, 旧字旧仮名, etc.


class AozoraService:
    """Service for fetching and parsing Aozora Bunko content."""

    def __init__(self, cache_dir: Optional[Path] = None):
        """Initialize with optional cache directory."""
        self._cache_dir = cache_dir or Path("data/aozora")
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._catalog: list[AozoraWork] = []
        self._client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()

    async def load_catalog(self, force_refresh: bool = False) -> list[AozoraWork]:
        """Load the Aozora catalog, downloading if needed."""
        cache_file = self._cache_dir / "catalog.csv"

        # Use cache if available and not forcing refresh
        if cache_file.exists() and not force_refresh:
            return self._parse_catalog_file(cache_file)

        # Download catalog
        response = await self._client.get(CATALOG_URL)
        response.raise_for_status()

        # Extract CSV from zip
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            csv_content = zf.read(CATALOG_CSV_NAME).decode("utf-8")

        # Cache it
        cache_file.write_text(csv_content, encoding="utf-8")

        return self._parse_catalog_csv(csv_content)

    def _parse_catalog_file(self, path: Path) -> list[AozoraWork]:
        """Parse catalog from cached file."""
        # Use utf-8-sig to handle BOM (Byte Order Mark) in CSV
        content = path.read_text(encoding="utf-8-sig")
        return self._parse_catalog_csv(content)

    def _parse_catalog_csv(self, content: str) -> list[AozoraWork]:
        """Parse catalog CSV content."""
        self._catalog = []
        reader = csv.DictReader(io.StringIO(content))

        for row in reader:
            # Only include works with text files
            text_url = row.get("テキストファイルURL", "").strip()
            html_url = row.get("XHTML/HTMLファイルURL", "").strip()

            if not text_url and not html_url:
                continue

            work = AozoraWork(
                work_id=row.get("作品ID", ""),
                title=row.get("作品名", ""),
                author_name=f"{row.get('姓', '')} {row.get('名', '')}".strip(),
                author_id=row.get("人物ID", ""),
                text_url=text_url if text_url else None,
                html_url=html_url if html_url else None,
                first_published=row.get("初出", ""),
                character_type=row.get("文字遣い種別", ""),
            )
            self._catalog.append(work)

        return self._catalog

    def search(
        self,
        query: str = "",
        author: str = "",
        author_id: str = "",
        limit: int = 50,
        modern_only: bool = True,
    ) -> list[AozoraWork]:
        """Search the catalog by title or author."""
        results = []
        query_lower = query.lower()
        author_lower = author.lower()

        for work in self._catalog:
            # Filter by modern Japanese if requested
            if modern_only and work.character_type != "新字新仮名":
                continue

            # Match query against title
            if query and query_lower not in work.title.lower():
                continue

            # Match by author_id (exact match) or author name (substring)
            if author_id and work.author_id != author_id:
                continue
            if author and not author_id and author_lower not in work.author_name.lower():
                continue

            results.append(work)

            if len(results) >= limit:
                break

        return results

    def get_popular_authors(self) -> list[tuple[str, str, int]]:
        """Get list of popular authors with work counts."""
        author_counts: dict[str, tuple[str, int]] = {}

        for work in self._catalog:
            if work.author_id not in author_counts:
                author_counts[work.author_id] = (work.author_name, 0)
            name, count = author_counts[work.author_id]
            author_counts[work.author_id] = (name, count + 1)

        # Sort by count and return top authors
        sorted_authors = sorted(
            [(aid, name, count) for aid, (name, count) in author_counts.items()],
            key=lambda x: x[2],
            reverse=True,
        )

        return sorted_authors[:50]

    async def fetch_work_text(self, work: AozoraWork) -> str:
        """Fetch and clean the text of a work."""
        if work.text_url:
            return await self._fetch_text_file(work.text_url)
        elif work.html_url:
            return await self._fetch_html_file(work.html_url)
        else:
            raise ValueError("Work has no text or HTML URL")

    async def _fetch_text_file(self, url: str) -> str:
        """Fetch and decode a text file (handles .zip archives)."""
        response = await self._client.get(url)
        response.raise_for_status()

        content = response.content

        # Extract from zip if needed
        if url.endswith(".zip"):
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                # Find the text file in the archive
                text_files = [n for n in zf.namelist() if n.endswith(".txt")]
                if not text_files:
                    raise ValueError("No text file found in archive")
                content = zf.read(text_files[0])

        # Aozora text files are typically Shift-JIS encoded
        # Try Shift-JIS first (more common), then UTF-8
        try:
            text = content.decode("shift_jis")
        except UnicodeDecodeError:
            try:
                text = content.decode("utf-8")
            except UnicodeDecodeError:
                text = content.decode("shift_jis", errors="replace")

        return self._clean_text(text)

    async def _fetch_html_file(self, url: str) -> str:
        """Fetch and extract text from HTML file."""
        response = await self._client.get(url)
        response.raise_for_status()

        # Try UTF-8 first, fall back to Shift-JIS
        try:
            html = response.content.decode("utf-8")
        except UnicodeDecodeError:
            html = response.content.decode("shift_jis", errors="replace")

        return self._extract_text_from_html(html)

    def _clean_text(self, text: str) -> str:
        """Clean Aozora text format."""
        lines = text.split("\n")
        clean_lines = []
        in_body = False
        separator_count = 0

        for line in lines:
            line = line.strip()

            # Skip empty lines at start
            if not in_body and not line:
                continue

            # Detect body start (after header separator)
            if line.startswith("-" * 10):
                separator_count += 1
                if separator_count == 1:
                    in_body = True
                continue

            # Stop at footer (usually starts with 底本：)
            if in_body and (line.startswith("底本：") or line.startswith("底本:")):
                break

            if in_body:
                # Convert ruby annotations: 漢字《かんじ》 -> 漢字
                # Keep the base text, remove the ruby
                line = re.sub(r"《[^》]+》", "", line)

                # Remove other Aozora markup
                line = re.sub(r"［＃[^］]+］", "", line)  # Editorial notes
                line = re.sub(r"\|", "", line)  # Ruby markers

                if line:
                    clean_lines.append(line)

        return "\n".join(clean_lines)

    def _extract_text_from_html(self, html: str) -> str:
        """Extract clean text from Aozora HTML."""
        # Remove HTML tags but keep ruby text
        # First, handle ruby: <ruby>漢字<rp>(</rp><rt>かんじ</rt><rp>)</rp></ruby>
        # We want to keep just the base text

        # Remove ruby readings
        text = re.sub(r"<rt[^>]*>.*?</rt>", "", html, flags=re.DOTALL)
        text = re.sub(r"<rp[^>]*>.*?</rp>", "", text, flags=re.DOTALL)
        text = re.sub(r"<ruby[^>]*>", "", text)
        text = re.sub(r"</ruby>", "", text)

        # Remove all other HTML tags
        text = re.sub(r"<[^>]+>", "", text)

        # Decode HTML entities
        text = text.replace("&nbsp;", " ")
        text = text.replace("&lt;", "<")
        text = text.replace("&gt;", ">")
        text = text.replace("&amp;", "&")
        text = text.replace("&quot;", '"')

        # Clean up whitespace
        lines = [line.strip() for line in text.split("\n")]
        lines = [line for line in lines if line]

        # Find the main content (skip header/footer)
        # Look for the title separator
        clean_lines = []
        in_body = False

        for i, line in enumerate(lines):
            # Skip metadata at start
            if not in_body:
                # Body usually starts after author name
                if i > 2:
                    in_body = True
            else:
                # Stop at footer
                if line.startswith("底本：") or line.startswith("底本:"):
                    break
                clean_lines.append(line)

        return "\n".join(clean_lines)
