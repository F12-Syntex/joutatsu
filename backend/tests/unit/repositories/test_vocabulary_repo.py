"""Unit tests for VocabularyRepository."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vocabulary import Vocabulary, VocabularySource
from app.repositories.vocabulary_repo import VocabularyRepository


class TestVocabularyRepository:
    """Tests for VocabularyRepository."""

    @pytest.fixture
    def repo(self, test_session: AsyncSession) -> VocabularyRepository:
        """Create a VocabularyRepository instance."""
        return VocabularyRepository(test_session)

    @pytest.fixture
    async def sample_vocab(
        self, repo: VocabularyRepository
    ) -> Vocabulary:
        """Create a sample vocabulary entry."""
        vocab = Vocabulary(
            surface="食べる",
            reading="タベル",
            dictionary_form="食べる",
            source=VocabularySource.READING,
        )
        return await repo.create(vocab)

    async def test_create_vocabulary(
        self, repo: VocabularyRepository
    ) -> None:
        """Test creating a vocabulary entry."""
        vocab = Vocabulary(
            surface="走る",
            reading="ハシル",
            dictionary_form="走る",
            source=VocabularySource.READING,
        )
        created = await repo.create(vocab)

        assert created.id is not None
        assert created.surface == "走る"
        assert created.dictionary_form == "走る"

    async def test_get_by_id(
        self,
        repo: VocabularyRepository,
        sample_vocab: Vocabulary,
    ) -> None:
        """Test getting vocabulary by ID."""
        found = await repo.get(sample_vocab.id)

        assert found is not None
        assert found.id == sample_vocab.id
        assert found.surface == sample_vocab.surface

    async def test_get_by_dictionary_form(
        self,
        repo: VocabularyRepository,
        sample_vocab: Vocabulary,
    ) -> None:
        """Test getting vocabulary by dictionary form."""
        found = await repo.get_by_dictionary_form("食べる")

        assert found is not None
        assert found.dictionary_form == "食べる"

    async def test_get_by_dictionary_form_not_found(
        self, repo: VocabularyRepository
    ) -> None:
        """Test getting non-existent vocabulary."""
        found = await repo.get_by_dictionary_form("存在しない")
        assert found is None

    async def test_get_by_surface(
        self,
        repo: VocabularyRepository,
        sample_vocab: Vocabulary,
    ) -> None:
        """Test getting vocabulary by surface form."""
        results = await repo.get_by_surface("食べる")

        assert len(results) >= 1
        assert any(v.surface == "食べる" for v in results)

    async def test_get_by_reading(
        self,
        repo: VocabularyRepository,
        sample_vocab: Vocabulary,
    ) -> None:
        """Test getting vocabulary by reading."""
        results = await repo.get_by_reading("タベル")

        assert len(results) >= 1
        assert any(v.reading == "タベル" for v in results)

    async def test_bulk_upsert_new_entries(
        self, repo: VocabularyRepository
    ) -> None:
        """Test bulk upsert with new entries."""
        items = [
            Vocabulary(
                surface="読む",
                reading="ヨム",
                dictionary_form="読む",
                source=VocabularySource.READING,
            ),
            Vocabulary(
                surface="書く",
                reading="カク",
                dictionary_form="書く",
                source=VocabularySource.READING,
            ),
        ]

        new_count = await repo.bulk_upsert(items)
        assert new_count == 2

    async def test_bulk_upsert_updates_existing(
        self,
        repo: VocabularyRepository,
        sample_vocab: Vocabulary,
    ) -> None:
        """Test bulk upsert updates existing entries."""
        items = [
            Vocabulary(
                surface="食べる",
                reading="タベル",
                dictionary_form="食べる",
                pitch_accent="2",
                source=VocabularySource.ANKI,
                anki_note_id=12345,
            ),
        ]

        new_count = await repo.bulk_upsert(items)
        assert new_count == 0

        # Check that existing entry was updated
        updated = await repo.get_by_dictionary_form("食べる")
        assert updated is not None
        assert updated.pitch_accent == "2"
        assert updated.anki_note_id == 12345
        assert updated.source == VocabularySource.ANKI

    async def test_get_by_source(
        self, repo: VocabularyRepository
    ) -> None:
        """Test getting vocabulary by source."""
        # Create entries with different sources
        anki_vocab = Vocabulary(
            surface="学ぶ",
            reading="マナブ",
            dictionary_form="学ぶ",
            source=VocabularySource.ANKI,
            anki_note_id=100,
        )
        await repo.create(anki_vocab)

        results = await repo.get_by_source(VocabularySource.ANKI)
        assert len(results) >= 1
        assert all(v.source == VocabularySource.ANKI for v in results)

    async def test_search(
        self,
        repo: VocabularyRepository,
        sample_vocab: Vocabulary,
    ) -> None:
        """Test searching vocabulary."""
        results = await repo.search("食べ")

        assert len(results) >= 1
        assert any("食べ" in v.surface for v in results)

    async def test_delete(
        self,
        repo: VocabularyRepository,
        sample_vocab: Vocabulary,
    ) -> None:
        """Test deleting vocabulary."""
        deleted = await repo.delete(sample_vocab.id)
        assert deleted is True

        # Verify deletion
        found = await repo.get(sample_vocab.id)
        assert found is None

    async def test_get_all_with_pagination(
        self, repo: VocabularyRepository
    ) -> None:
        """Test getting all vocabulary with pagination."""
        # Create multiple entries
        for i in range(5):
            vocab = Vocabulary(
                surface=f"word{i}",
                reading=f"ワード{i}",
                dictionary_form=f"word{i}",
                source=VocabularySource.READING,
            )
            await repo.create(vocab)

        # Test pagination
        page1 = await repo.get_all(limit=2, offset=0)
        page2 = await repo.get_all(limit=2, offset=2)

        assert len(page1) == 2
        assert len(page2) == 2
        assert page1[0].id != page2[0].id
