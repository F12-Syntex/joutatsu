"""Scoring service for vocabulary score calculations."""

from dataclasses import dataclass
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.progress import VocabularyScore
from app.models.vocabulary import Vocabulary
from app.repositories.progress_repo import ProgressRepository
from app.repositories.vocabulary_repo import VocabularyRepository


@dataclass
class ScoreUpdate:
    """Result of a score update operation."""

    vocabulary_id: int
    old_score: float
    new_score: float
    times_seen: int
    times_looked_up: int
    consecutive_correct: int


class ScoringService:
    """Service for vocabulary score calculations and updates."""

    # Scoring parameters
    BASE_SCORE_INCREMENT = 0.05  # Base score increase per correct read
    LOOKUP_PENALTY = 0.15  # Score decrease when word is looked up
    CONSECUTIVE_BONUS = 0.02  # Bonus per consecutive correct
    MAX_CONSECUTIVE_BONUS = 0.10  # Cap on consecutive bonus
    DECAY_RATE = 0.01  # Score decay per day since last seen (not implemented yet)

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self._session = session
        self._progress_repo = ProgressRepository(session)
        self._vocab_repo = VocabularyRepository(session)

    def calculate_score(self, score_obj: VocabularyScore) -> float:
        """Calculate score based on current stats."""
        if score_obj.times_seen == 0:
            return 0.0

        # Base score from ratio of correct reads to total seen
        lookup_ratio = score_obj.times_looked_up / score_obj.times_seen
        base_score = 1.0 - lookup_ratio

        # Consecutive correct bonus
        consecutive_bonus = min(
            score_obj.consecutive_correct * self.CONSECUTIVE_BONUS,
            self.MAX_CONSECUTIVE_BONUS,
        )

        # Combine factors
        score = base_score * 0.7 + (base_score + consecutive_bonus) * 0.3

        return max(0.0, min(1.0, score))

    async def record_lookup(
        self, dictionary_form: str
    ) -> Optional[ScoreUpdate]:
        """Record that a word was looked up (decreases score)."""
        # Find or create vocabulary entry
        vocab = await self._vocab_repo.get_by_dictionary_form(dictionary_form)
        if not vocab:
            # Create new vocabulary entry
            vocab = Vocabulary(
                dictionary_form=dictionary_form,
                surface=dictionary_form,
                reading="",
            )
            vocab = await self._vocab_repo.create(vocab)

        # Get current score
        score_obj = await self._progress_repo.get_or_create(vocab.id)
        old_score = score_obj.score

        # Update stats
        score_obj = await self._progress_repo.increment_lookup(vocab.id)

        # Recalculate score
        new_score = self.calculate_score(score_obj)
        score_obj = await self._progress_repo.update_score(vocab.id, new_score)

        return ScoreUpdate(
            vocabulary_id=vocab.id,
            old_score=old_score,
            new_score=score_obj.score,
            times_seen=score_obj.times_seen,
            times_looked_up=score_obj.times_looked_up,
            consecutive_correct=score_obj.consecutive_correct,
        )

    async def record_read_without_lookup(
        self, dictionary_form: str
    ) -> Optional[ScoreUpdate]:
        """Record that a word was read without lookup (increases score)."""
        # Find or create vocabulary entry
        vocab = await self._vocab_repo.get_by_dictionary_form(dictionary_form)
        if not vocab:
            # Create new vocabulary entry
            vocab = Vocabulary(
                dictionary_form=dictionary_form,
                surface=dictionary_form,
                reading="",
            )
            vocab = await self._vocab_repo.create(vocab)

        # Get current score
        score_obj = await self._progress_repo.get_or_create(vocab.id)
        old_score = score_obj.score

        # Update stats
        score_obj = await self._progress_repo.increment_correct(vocab.id)

        # Recalculate score
        new_score = self.calculate_score(score_obj)
        score_obj = await self._progress_repo.update_score(vocab.id, new_score)

        return ScoreUpdate(
            vocabulary_id=vocab.id,
            old_score=old_score,
            new_score=score_obj.score,
            times_seen=score_obj.times_seen,
            times_looked_up=score_obj.times_looked_up,
            consecutive_correct=score_obj.consecutive_correct,
        )

    async def record_batch_read(
        self,
        dictionary_forms: list[str],
        looked_up_forms: set[str],
    ) -> list[ScoreUpdate]:
        """Record a batch of words read, some looked up."""
        updates = []

        for form in dictionary_forms:
            if form in looked_up_forms:
                update = await self.record_lookup(form)
            else:
                update = await self.record_read_without_lookup(form)

            if update:
                updates.append(update)

        return updates

    async def get_weakest_vocabulary(
        self, limit: int = 20
    ) -> list[tuple[VocabularyScore, Vocabulary]]:
        """Get vocabulary items with lowest scores."""
        return list(await self._progress_repo.get_lowest_scores(limit))

    async def get_overall_score(self) -> float:
        """Get overall mastery score (average of all tracked vocabulary)."""
        stats = await self._progress_repo.get_aggregate_stats()
        return stats["average_score"]

    async def get_progress_summary(self) -> dict:
        """Get comprehensive progress summary."""
        stats = await self._progress_repo.get_aggregate_stats()

        # Calculate mastery percentage
        total = stats["known_count"] + stats["learning_count"]
        mastery_pct = (
            (stats["known_count"] / total * 100) if total > 0 else 0
        )

        return {
            "total_vocabulary": stats["total_tracked"],
            "known_words": stats["known_count"],
            "learning_words": stats["learning_count"],
            "average_score": stats["average_score"],
            "mastery_percentage": round(mastery_pct, 1),
            "total_lookups": stats["total_lookups"],
            "total_words_seen": stats["total_words_seen"],
        }
