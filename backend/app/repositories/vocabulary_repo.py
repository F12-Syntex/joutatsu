"""Vocabulary repository for data access."""

from typing import Optional, Sequence

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.vocabulary import Vocabulary, VocabularySource
from app.repositories.base import BaseRepository


class VocabularyRepository(BaseRepository[Vocabulary]):
    """Repository for vocabulary data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(Vocabulary, session)

    async def get_by_dictionary_form(
        self, dictionary_form: str
    ) -> Optional[Vocabulary]:
        """Get vocabulary by dictionary form."""
        statement = select(Vocabulary).where(
            Vocabulary.dictionary_form == dictionary_form
        )
        result = await self.session.exec(statement)
        return result.first()

    async def get_by_surface(self, surface: str) -> Sequence[Vocabulary]:
        """Get all vocabulary entries matching a surface form."""
        statement = select(Vocabulary).where(Vocabulary.surface == surface)
        result = await self.session.exec(statement)
        return result.all()

    async def get_by_reading(self, reading: str) -> Sequence[Vocabulary]:
        """Get all vocabulary entries matching a reading."""
        statement = select(Vocabulary).where(Vocabulary.reading == reading)
        result = await self.session.exec(statement)
        return result.all()

    async def is_known(
        self, dictionary_form: str, score_threshold: float = 0.7
    ) -> bool:
        """Check if a word is considered known based on score threshold."""
        from app.models.progress import VocabularyScore

        statement = (
            select(VocabularyScore.score)
            .join(Vocabulary, Vocabulary.id == VocabularyScore.vocabulary_id)
            .where(Vocabulary.dictionary_form == dictionary_form)
        )
        result = await self.session.exec(statement)
        score = result.first()
        return score is not None and score >= score_threshold

    async def get_known_dictionary_forms(
        self, score_threshold: float = 0.7
    ) -> set[str]:
        """Get all dictionary forms that are considered known."""
        from app.models.progress import VocabularyScore

        statement = (
            select(Vocabulary.dictionary_form)
            .join(VocabularyScore, VocabularyScore.vocabulary_id == Vocabulary.id)
            .where(VocabularyScore.score >= score_threshold)
        )
        result = await self.session.exec(statement)
        return set(result.all())

    async def bulk_upsert(self, items: list[Vocabulary]) -> int:
        """Bulk upsert vocabulary entries. Returns count of new entries."""
        new_count = 0
        for item in items:
            existing = await self.get_by_dictionary_form(item.dictionary_form)
            if existing:
                # Update existing entry
                existing.reading = item.reading
                existing.surface = item.surface
                existing.pitch_accent = item.pitch_accent
                if item.anki_note_id:
                    existing.anki_note_id = item.anki_note_id
                    existing.source = VocabularySource.ANKI
                self.session.add(existing)
            else:
                # Create new entry
                self.session.add(item)
                new_count += 1

        await self.session.commit()
        return new_count

    async def get_by_source(
        self,
        source: VocabularySource,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Vocabulary]:
        """Get vocabulary entries by source."""
        statement = (
            select(Vocabulary)
            .where(Vocabulary.source == source)
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_anki_synced(self) -> Sequence[Vocabulary]:
        """Get all vocabulary entries synced from Anki."""
        statement = select(Vocabulary).where(Vocabulary.anki_note_id.isnot(None))
        result = await self.session.exec(statement)
        return result.all()

    async def search(
        self,
        query: str,
        limit: int = 20,
    ) -> Sequence[Vocabulary]:
        """Search vocabulary by surface, reading, or dictionary form."""
        statement = (
            select(Vocabulary)
            .where(
                (Vocabulary.surface.contains(query))
                | (Vocabulary.reading.contains(query))
                | (Vocabulary.dictionary_form.contains(query))
            )
            .limit(limit)
        )
        result = await self.session.exec(statement)
        return result.all()
