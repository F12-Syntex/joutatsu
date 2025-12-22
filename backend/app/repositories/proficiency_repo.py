"""Proficiency repository for user proficiency data access."""

from datetime import datetime
from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.proficiency import DifficultyRating, UserProficiency
from app.repositories.base import BaseRepository


class ProficiencyRepository(BaseRepository[UserProficiency]):
    """Repository for user proficiency data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(UserProficiency, session)

    async def get_or_create(self) -> UserProficiency:
        """Get existing proficiency or create new one (single user)."""
        statement = select(UserProficiency).limit(1)
        result = await self.session.exec(statement)
        proficiency = result.first()

        if not proficiency:
            proficiency = UserProficiency()
            self.session.add(proficiency)
            await self.session.commit()
            await self.session.refresh(proficiency)

        return proficiency

    async def update_metrics(
        self,
        characters_read: int = 0,
        tokens_read: int = 0,
        lookups: int = 0,
        reading_time_seconds: int = 0,
    ) -> UserProficiency:
        """Update reading metrics."""
        proficiency = await self.get_or_create()

        proficiency.total_characters_read += characters_read
        proficiency.total_tokens_read += tokens_read
        proficiency.total_lookups += lookups
        proficiency.total_reading_time_seconds += reading_time_seconds
        proficiency.updated_at = datetime.utcnow()

        # Recalculate rolling lookup rate
        if proficiency.total_tokens_read > 0:
            proficiency.avg_lookup_rate = (
                proficiency.total_lookups / proficiency.total_tokens_read * 100
            )

        # Recalculate reading speed (chars per minute)
        if proficiency.total_reading_time_seconds > 0:
            proficiency.avg_reading_speed = (
                proficiency.total_characters_read
                / proficiency.total_reading_time_seconds
                * 60
            )

        self.session.add(proficiency)
        await self.session.commit()
        await self.session.refresh(proficiency)
        return proficiency

    async def update_level(self, level: str) -> UserProficiency:
        """Update proficiency level."""
        proficiency = await self.get_or_create()
        proficiency.level = level
        proficiency.updated_at = datetime.utcnow()
        self.session.add(proficiency)
        await self.session.commit()
        await self.session.refresh(proficiency)
        return proficiency

    async def update_thresholds(
        self,
        furigana_threshold: Optional[float] = None,
        meanings_threshold: Optional[float] = None,
    ) -> UserProficiency:
        """Update auto-adjustment thresholds."""
        proficiency = await self.get_or_create()

        if furigana_threshold is not None:
            proficiency.auto_furigana_threshold = furigana_threshold
        if meanings_threshold is not None:
            proficiency.auto_meanings_threshold = meanings_threshold

        proficiency.updated_at = datetime.utcnow()
        self.session.add(proficiency)
        await self.session.commit()
        await self.session.refresh(proficiency)
        return proficiency

    async def add_difficulty_rating(
        self,
        content_id: int,
        rating: str,
        feedback: Optional[str] = None,
        chunk_position: Optional[int] = None,
    ) -> DifficultyRating:
        """Add a difficulty rating for content."""
        difficulty_rating = DifficultyRating(
            content_id=content_id,
            rating=rating,
            feedback=feedback,
            chunk_position=chunk_position,
        )
        self.session.add(difficulty_rating)

        # Update proficiency rating counts
        proficiency = await self.get_or_create()
        if rating == "easy":
            proficiency.easy_ratings += 1
        elif rating == "just_right":
            proficiency.just_right_ratings += 1
        elif rating == "hard":
            proficiency.hard_ratings += 1

        proficiency.updated_at = datetime.utcnow()
        self.session.add(proficiency)

        await self.session.commit()
        await self.session.refresh(difficulty_rating)
        return difficulty_rating

    async def get_difficulty_ratings(
        self, content_id: Optional[int] = None, limit: int = 50
    ) -> list[DifficultyRating]:
        """Get difficulty ratings, optionally filtered by content."""
        statement = select(DifficultyRating).order_by(
            DifficultyRating.rated_at.desc()
        )

        if content_id is not None:
            statement = statement.where(DifficultyRating.content_id == content_id)

        statement = statement.limit(limit)
        result = await self.session.exec(statement)
        return list(result.all())
