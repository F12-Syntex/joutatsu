"""Proficiency service for calculating and managing user proficiency."""

from dataclasses import dataclass
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.proficiency import ProficiencyLevel, UserProficiency
from app.repositories.proficiency_repo import ProficiencyRepository
from app.repositories.progress_repo import ProgressRepository


@dataclass
class ReaderRecommendations:
    """Recommended reader settings based on proficiency."""

    show_furigana: str  # "all", "unknown", "none"
    show_meanings: bool
    furigana_threshold: float  # Words below this score get furigana
    highlight_unknown: bool
    suggested_level: str  # For content selection


@dataclass
class ProficiencyStats:
    """Current proficiency statistics."""

    level: str
    total_characters_read: int
    total_tokens_read: int
    total_lookups: int
    total_reading_time_minutes: int
    lookup_rate: float  # per 100 tokens
    reading_speed: float  # chars per minute
    easy_ratings: int
    just_right_ratings: int
    hard_ratings: int


class ProficiencyService:
    """Service for user proficiency calculations."""

    # Lookup rate thresholds for level determination
    LOOKUP_THRESHOLDS = {
        ProficiencyLevel.ADVANCED: 2.0,  # < 2 lookups per 100 tokens
        ProficiencyLevel.UPPER_INTERMEDIATE: 5.0,
        ProficiencyLevel.INTERMEDIATE: 10.0,
        ProficiencyLevel.ELEMENTARY: 20.0,
        ProficiencyLevel.BEGINNER: 100.0,  # catch-all
    }

    # Minimum tokens read before level can increase
    MIN_TOKENS_FOR_LEVEL_UP = 1000

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self._session = session
        self._proficiency_repo = ProficiencyRepository(session)
        self._progress_repo = ProgressRepository(session)

    async def get_proficiency(self) -> UserProficiency:
        """Get current user proficiency."""
        return await self._proficiency_repo.get_or_create()

    async def get_stats(self) -> ProficiencyStats:
        """Get detailed proficiency statistics."""
        proficiency = await self._proficiency_repo.get_or_create()

        return ProficiencyStats(
            level=proficiency.level.value,
            total_characters_read=proficiency.total_characters_read,
            total_tokens_read=proficiency.total_tokens_read,
            total_lookups=proficiency.total_lookups,
            total_reading_time_minutes=proficiency.total_reading_time_seconds // 60,
            lookup_rate=round(proficiency.avg_lookup_rate, 2),
            reading_speed=round(proficiency.avg_reading_speed, 1),
            easy_ratings=proficiency.easy_ratings,
            just_right_ratings=proficiency.just_right_ratings,
            hard_ratings=proficiency.hard_ratings,
        )

    async def record_reading_session(
        self,
        characters_read: int,
        tokens_read: int,
        lookups: int,
        reading_time_seconds: int,
    ) -> UserProficiency:
        """Record metrics from a reading session and recalculate level."""
        proficiency = await self._proficiency_repo.update_metrics(
            characters_read=characters_read,
            tokens_read=tokens_read,
            lookups=lookups,
            reading_time_seconds=reading_time_seconds,
        )

        # Recalculate level if enough data
        if proficiency.total_tokens_read >= self.MIN_TOKENS_FOR_LEVEL_UP:
            new_level = self._calculate_level(proficiency.avg_lookup_rate)
            if new_level != proficiency.level:
                proficiency = await self._proficiency_repo.update_level(new_level)

        return proficiency

    def _calculate_level(self, lookup_rate: float) -> ProficiencyLevel:
        """Determine proficiency level based on lookup rate."""
        for level, threshold in self.LOOKUP_THRESHOLDS.items():
            if lookup_rate < threshold:
                return level
        return ProficiencyLevel.BEGINNER

    async def record_difficulty_rating(
        self,
        content_id: int,
        rating: str,
        feedback: Optional[str] = None,
        chunk_position: Optional[int] = None,
    ) -> None:
        """Record user's difficulty rating for content."""
        await self._proficiency_repo.add_difficulty_rating(
            content_id=content_id,
            rating=rating,
            feedback=feedback,
            chunk_position=chunk_position,
        )

    async def get_reader_recommendations(self) -> ReaderRecommendations:
        """Get recommended reader settings based on proficiency."""
        proficiency = await self._proficiency_repo.get_or_create()
        level = proficiency.level

        # Determine furigana setting based on level
        if level in (ProficiencyLevel.BEGINNER, ProficiencyLevel.ELEMENTARY):
            show_furigana = "all"
            furigana_threshold = 0.9  # Show for most words
        elif level == ProficiencyLevel.INTERMEDIATE:
            show_furigana = "unknown"
            furigana_threshold = 0.5  # Show for words with < 50% mastery
        elif level == ProficiencyLevel.UPPER_INTERMEDIATE:
            show_furigana = "unknown"
            furigana_threshold = 0.3  # Only for really unknown words
        else:  # Advanced
            show_furigana = "none"
            furigana_threshold = 0.1

        # Determine if meanings should show on hover
        show_meanings = level != ProficiencyLevel.ADVANCED

        # Map level to content difficulty suggestion
        level_to_suggestion = {
            ProficiencyLevel.BEGINNER: "beginner",
            ProficiencyLevel.ELEMENTARY: "elementary",
            ProficiencyLevel.INTERMEDIATE: "intermediate",
            ProficiencyLevel.UPPER_INTERMEDIATE: "advanced",
            ProficiencyLevel.ADVANCED: "advanced",
        }

        return ReaderRecommendations(
            show_furigana=show_furigana,
            show_meanings=show_meanings,
            furigana_threshold=furigana_threshold,
            highlight_unknown=level != ProficiencyLevel.ADVANCED,
            suggested_level=level_to_suggestion[level],
        )

    async def update_thresholds(
        self,
        furigana_threshold: Optional[float] = None,
        meanings_threshold: Optional[float] = None,
    ) -> UserProficiency:
        """Manually update auto-adjustment thresholds."""
        return await self._proficiency_repo.update_thresholds(
            furigana_threshold=furigana_threshold,
            meanings_threshold=meanings_threshold,
        )
