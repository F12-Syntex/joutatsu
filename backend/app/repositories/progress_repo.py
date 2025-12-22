"""Progress repository for vocabulary score data access."""

from datetime import datetime
from typing import Optional, Sequence

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.progress import VocabularyScore
from app.models.vocabulary import Vocabulary
from app.repositories.base import BaseRepository


class ProgressRepository(BaseRepository[VocabularyScore]):
    """Repository for vocabulary score data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(VocabularyScore, session)

    async def get_by_vocabulary_id(
        self, vocabulary_id: int
    ) -> Optional[VocabularyScore]:
        """Get score by vocabulary ID."""
        statement = select(VocabularyScore).where(
            VocabularyScore.vocabulary_id == vocabulary_id
        )
        result = await self.session.exec(statement)
        return result.first()

    async def get_or_create(self, vocabulary_id: int) -> VocabularyScore:
        """Get existing score or create new one."""
        score = await self.get_by_vocabulary_id(vocabulary_id)
        if not score:
            score = VocabularyScore(vocabulary_id=vocabulary_id)
            self.session.add(score)
            await self.session.commit()
            await self.session.refresh(score)
        return score

    async def increment_seen(self, vocabulary_id: int) -> VocabularyScore:
        """Increment times seen for a vocabulary item."""
        score = await self.get_or_create(vocabulary_id)
        score.times_seen += 1
        score.last_seen = datetime.utcnow()
        self.session.add(score)
        await self.session.commit()
        await self.session.refresh(score)
        return score

    async def increment_lookup(self, vocabulary_id: int) -> VocabularyScore:
        """Increment times looked up for a vocabulary item."""
        score = await self.get_or_create(vocabulary_id)
        score.times_looked_up += 1
        score.times_seen += 1
        score.last_seen = datetime.utcnow()
        # Reset consecutive correct on lookup
        score.consecutive_correct = 0
        self.session.add(score)
        await self.session.commit()
        await self.session.refresh(score)
        return score

    async def increment_correct(self, vocabulary_id: int) -> VocabularyScore:
        """Increment consecutive correct (read without lookup)."""
        score = await self.get_or_create(vocabulary_id)
        score.times_seen += 1
        score.consecutive_correct += 1
        score.last_seen = datetime.utcnow()
        self.session.add(score)
        await self.session.commit()
        await self.session.refresh(score)
        return score

    async def update_score(
        self, vocabulary_id: int, new_score: float
    ) -> VocabularyScore:
        """Update the score for a vocabulary item."""
        score_obj = await self.get_or_create(vocabulary_id)
        score_obj.score = max(0.0, min(1.0, new_score))  # Clamp to 0-1
        self.session.add(score_obj)
        await self.session.commit()
        await self.session.refresh(score_obj)
        return score_obj

    async def get_lowest_scores(
        self, limit: int = 20
    ) -> Sequence[tuple[VocabularyScore, Vocabulary]]:
        """Get vocabulary items with lowest scores."""
        statement = (
            select(VocabularyScore, Vocabulary)
            .join(Vocabulary, Vocabulary.id == VocabularyScore.vocabulary_id)
            .where(VocabularyScore.times_seen > 0)
            .order_by(VocabularyScore.score.asc())
            .limit(limit)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_scores_by_vocabulary_ids(
        self, vocabulary_ids: list[int]
    ) -> dict[int, VocabularyScore]:
        """Get scores for multiple vocabulary IDs."""
        if not vocabulary_ids:
            return {}
        statement = select(VocabularyScore).where(
            VocabularyScore.vocabulary_id.in_(vocabulary_ids)
        )
        result = await self.session.exec(statement)
        return {s.vocabulary_id: s for s in result.all()}

    async def get_aggregate_stats(self) -> dict:
        """Get aggregate progress statistics."""
        # Total tracked
        total_stmt = select(func.count(VocabularyScore.id))
        total_result = await self.session.exec(total_stmt)
        total_tracked = total_result.one()

        # Average score
        avg_stmt = select(func.avg(VocabularyScore.score)).where(
            VocabularyScore.times_seen > 0
        )
        avg_result = await self.session.exec(avg_stmt)
        avg_score = avg_result.one() or 0.0

        # Known (score >= 0.7)
        known_stmt = select(func.count(VocabularyScore.id)).where(
            VocabularyScore.score >= 0.7
        )
        known_result = await self.session.exec(known_stmt)
        known_count = known_result.one()

        # Learning (0 < score < 0.7)
        learning_stmt = select(func.count(VocabularyScore.id)).where(
            VocabularyScore.score > 0, VocabularyScore.score < 0.7
        )
        learning_result = await self.session.exec(learning_stmt)
        learning_count = learning_result.one()

        # Total lookups
        lookups_stmt = select(func.sum(VocabularyScore.times_looked_up))
        lookups_result = await self.session.exec(lookups_stmt)
        total_lookups = lookups_result.one() or 0

        # Total words seen
        seen_stmt = select(func.sum(VocabularyScore.times_seen))
        seen_result = await self.session.exec(seen_stmt)
        total_seen = seen_result.one() or 0

        return {
            "total_tracked": total_tracked,
            "average_score": round(float(avg_score), 3),
            "known_count": known_count,
            "learning_count": learning_count,
            "total_lookups": total_lookups,
            "total_words_seen": total_seen,
        }
