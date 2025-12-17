"""PDF parsing service for extracting text from PDF files."""

import io
from dataclasses import dataclass
from typing import Optional


@dataclass
class PDFPage:
    """Represents a single page of PDF content."""

    page_number: int
    text: str


class PDFService:
    """Service for parsing PDF files and extracting text."""

    def __init__(self) -> None:
        self._pdf_reader = None

    def _ensure_pdf_library(self) -> None:
        """Ensure pypdf is available."""
        try:
            import pypdf  # noqa: F401
        except ImportError:
            raise RuntimeError(
                "pypdf is not installed. "
                "Run: uv pip install pypdf"
            )

    def extract_text_from_bytes(self, pdf_bytes: bytes) -> list[PDFPage]:
        """
        Extract text from PDF bytes.

        Args:
            pdf_bytes: Raw PDF file bytes

        Returns:
            List of PDFPage objects with text per page
        """
        self._ensure_pdf_library()
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages = []

        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            # Clean up text
            text = self._clean_text(text)
            if text.strip():
                pages.append(PDFPage(page_number=i + 1, text=text))

        return pages

    def extract_text_from_file(self, file_path: str) -> list[PDFPage]:
        """
        Extract text from a PDF file.

        Args:
            file_path: Path to the PDF file

        Returns:
            List of PDFPage objects with text per page
        """
        with open(file_path, "rb") as f:
            return self.extract_text_from_bytes(f.read())

    def get_full_text(
        self,
        pages: list[PDFPage],
        separator: str = "\n\n",
    ) -> str:
        """
        Combine all pages into a single text string.

        Args:
            pages: List of PDFPage objects
            separator: String to separate pages

        Returns:
            Combined text from all pages
        """
        return separator.join(page.text for page in pages)

    def _clean_text(self, text: str) -> str:
        """
        Clean up extracted PDF text.

        Args:
            text: Raw extracted text

        Returns:
            Cleaned text
        """
        # Remove excessive whitespace
        lines = []
        for line in text.split("\n"):
            line = line.strip()
            if line:
                lines.append(line)

        return "\n".join(lines)

    def get_metadata(
        self, pdf_bytes: bytes
    ) -> dict[str, Optional[str]]:
        """
        Extract metadata from PDF.

        Args:
            pdf_bytes: Raw PDF file bytes

        Returns:
            Dictionary of metadata fields
        """
        self._ensure_pdf_library()
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        metadata = reader.metadata or {}

        return {
            "title": metadata.get("/Title"),
            "author": metadata.get("/Author"),
            "subject": metadata.get("/Subject"),
            "creator": metadata.get("/Creator"),
            "page_count": len(reader.pages),
        }
