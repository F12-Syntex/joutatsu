"""Content service for managing reading content."""

import json
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.content import Content, ContentChunk, ContentType
from app.repositories.content_repo import ContentChunkRepository, ContentRepository
from app.services.tokenizer_service import TokenizerService


class ContentService:
    """Service for content management and import."""

    # Default chunk size in characters
    DEFAULT_CHUNK_SIZE = 2000
    # Sentence-ending punctuation for splitting
    SENTENCE_ENDINGS = {"。", "！", "？", "\n"}

    def __init__(self, session: AsyncSession):
        self._session = session
        self._content_repo = ContentRepository(session)
        self._chunk_repo = ContentChunkRepository(session)
        self._tokenizer = TokenizerService()

    async def import_text(
        self,
        title: str,
        text: str,
        source_type: ContentType = ContentType.TEXT,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        pre_tokenize: bool = True,
    ) -> Content:
        """
        Import text content, chunk it, and optionally pre-tokenize.

        Args:
            title: Title of the content
            text: Raw text to import
            source_type: Type of content source
            chunk_size: Maximum characters per chunk
            pre_tokenize: Whether to pre-tokenize chunks

        Returns:
            Created Content object
        """
        # Create content record
        content = Content(
            title=title,
            source_type=source_type,
        )
        content = await self._content_repo.create(content)

        # Chunk the text
        chunks_text = self._chunk_text(text, chunk_size)
        chunks = await self._chunk_repo.create_chunks(content.id, chunks_text)

        # Pre-tokenize and calculate stats
        total_tokens = 0
        unique_vocab: set[str] = set()

        if pre_tokenize:
            for chunk in chunks:
                tokens = self._tokenizer.tokenize(chunk.raw_text)
                tokenized_json = json.dumps(
                    [
                        {
                            "surface": t.surface,
                            "dictionary_form": t.dictionary_form,
                            "reading": t.reading,
                            "pos": t.pos,
                            "pos_short": t.pos_short,
                            "start": t.start,
                            "end": t.end,
                        }
                        for t in tokens
                    ],
                    ensure_ascii=False,
                )
                await self._chunk_repo.update_tokenized_json(chunk.id, tokenized_json)

                # Count tokens and vocabulary
                total_tokens += len(tokens)
                for token in tokens:
                    if self._tokenizer.is_content_word(token):
                        unique_vocab.add(token.dictionary_form)

        # Update content stats
        content.total_tokens = total_tokens
        content.unique_vocabulary = len(unique_vocab)
        content.difficulty_estimate = self._estimate_difficulty(
            total_tokens, unique_vocab
        )
        content = await self._content_repo.update(content)

        return content

    def _chunk_text(self, text: str, max_size: int) -> list[str]:
        """
        Split text into chunks at sentence boundaries.

        Args:
            text: Text to chunk
            max_size: Maximum chunk size in characters

        Returns:
            List of text chunks
        """
        if not text:
            return []

        if len(text) <= max_size:
            return [text]

        chunks = []
        current_chunk = ""

        # Split on sentence endings
        i = 0
        while i < len(text):
            char = text[i]
            current_chunk += char

            # Check if we're at a sentence boundary
            is_sentence_end = char in self.SENTENCE_ENDINGS

            # If chunk is full or at sentence boundary and chunk is reasonably sized
            if len(current_chunk) >= max_size or (
                is_sentence_end and len(current_chunk) >= max_size * 0.5
            ):
                chunks.append(current_chunk.strip())
                current_chunk = ""

            i += 1

        # Add remaining text
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def _estimate_difficulty(
        self, total_tokens: int, unique_vocab: set[str]
    ) -> float:
        """
        Estimate content difficulty based on vocabulary.

        Returns a score from 0.0 (easy) to 1.0 (hard).

        Args:
            total_tokens: Total token count
            unique_vocab: Set of unique dictionary forms

        Returns:
            Difficulty score between 0.0 and 1.0
        """
        if total_tokens == 0:
            return 0.0

        # Simple heuristic: higher vocabulary density = harder
        vocab_density = len(unique_vocab) / total_tokens if total_tokens > 0 else 0

        # Normalize to 0-1 range (typical density is 0.1-0.5)
        difficulty = min(1.0, vocab_density * 2)
        return round(difficulty, 2)

    async def get_content(self, content_id: int) -> Optional[Content]:
        """Get content by ID."""
        return await self._content_repo.get(content_id)

    async def get_content_with_chunks(
        self, content_id: int
    ) -> tuple[Optional[Content], list[ContentChunk]]:
        """Get content with all its chunks."""
        content = await self._content_repo.get(content_id)
        if not content:
            return None, []
        chunks = await self._chunk_repo.get_chunks_for_content(content_id)
        return content, list(chunks)

    async def get_chunk(
        self, content_id: int, chunk_index: int
    ) -> Optional[ContentChunk]:
        """Get a specific chunk."""
        return await self._chunk_repo.get_chunk(content_id, chunk_index)

    async def list_content(
        self,
        source_type: Optional[ContentType] = None,
        min_difficulty: Optional[float] = None,
        max_difficulty: Optional[float] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Content]:
        """List content with optional filters."""
        results = await self._content_repo.list_with_filters(
            source_type=source_type,
            min_difficulty=min_difficulty,
            max_difficulty=max_difficulty,
            limit=limit,
            offset=offset,
        )
        return list(results)

    async def delete_content(self, content_id: int) -> bool:
        """Delete content and all its chunks."""
        content = await self._content_repo.get(content_id)
        if not content:
            return False

        # Delete chunks first
        await self._chunk_repo.delete_chunks_for_content(content_id)
        # Delete content
        return await self._content_repo.delete(content_id)

    async def search_content(self, query: str, limit: int = 20) -> list[Content]:
        """Search content by title."""
        results = await self._content_repo.search(query, limit)
        return list(results)
