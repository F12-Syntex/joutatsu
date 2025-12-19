"""PDF parsing service for extracting text and images from PDF files."""

import io
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PDFImage:
    """Represents an image extracted from a PDF."""

    page_number: int
    image_index: int
    data: bytes
    extension: str  # e.g., "png", "jpg"
    width: int
    height: int


@dataclass
class PDFPage:
    """Represents a single page of PDF content."""

    page_number: int
    text: str
    images: list[PDFImage] = field(default_factory=list)


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

    def extract_text_from_bytes(
        self, pdf_bytes: bytes, extract_images: bool = True
    ) -> list[PDFPage]:
        """
        Extract text and images from PDF bytes.

        Args:
            pdf_bytes: Raw PDF file bytes
            extract_images: Whether to extract images

        Returns:
            List of PDFPage objects with text and images per page
        """
        self._ensure_pdf_library()
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages = []

        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            text = self._clean_text(text)

            images = []
            if extract_images:
                images = self._extract_page_images(page, i + 1)

            if text.strip() or images:
                pages.append(PDFPage(
                    page_number=i + 1,
                    text=text,
                    images=images,
                ))

        return pages

    def _extract_page_images(self, page, page_number: int) -> list[PDFImage]:
        """Extract images from a single PDF page."""
        images = []
        try:
            for idx, image in enumerate(page.images):
                ext = self._get_image_extension(image.name)
                if ext:
                    images.append(PDFImage(
                        page_number=page_number,
                        image_index=idx,
                        data=image.data,
                        extension=ext,
                        width=getattr(image, 'width', 0) or 0,
                        height=getattr(image, 'height', 0) or 0,
                    ))
        except Exception:
            pass  # Some PDFs have malformed images
        return images

    def _get_image_extension(self, name: str) -> Optional[str]:
        """Get image extension from filename or detect from data."""
        name_lower = name.lower()
        if name_lower.endswith('.png'):
            return 'png'
        elif name_lower.endswith(('.jpg', '.jpeg')):
            return 'jpg'
        elif name_lower.endswith('.gif'):
            return 'gif'
        elif name_lower.endswith('.webp'):
            return 'webp'
        # Default to jpg for unknown
        return 'jpg'

    def get_first_image(self, pdf_bytes: bytes) -> Optional[PDFImage]:
        """Get the first image from the PDF for use as cover."""
        pages = self.extract_text_from_bytes(pdf_bytes, extract_images=True)
        for page in pages:
            if page.images:
                return page.images[0]
        return None

    def get_all_images(self, pdf_bytes: bytes) -> list[PDFImage]:
        """Get all images from the PDF."""
        pages = self.extract_text_from_bytes(pdf_bytes, extract_images=True)
        all_images = []
        for page in pages:
            all_images.extend(page.images)
        return all_images

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
