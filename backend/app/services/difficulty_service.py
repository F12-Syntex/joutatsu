"""Difficulty analysis service using jReadability and multi-dimensional metrics."""

import re
from dataclasses import dataclass
from typing import Optional

import httpx


@dataclass
class DifficultyMetrics:
    """Multi-dimensional difficulty analysis result."""

    overall_difficulty: float  # 0.0-1.0, primary score from jReadability
    kanji_difficulty: float  # Based on kanji grade levels
    lexical_difficulty: float  # Vocabulary complexity
    grammar_complexity: float  # Grammatical structure complexity
    sentence_complexity: float  # Sentence length and variation
    difficulty_level: str  # Categorical: Beginner/Elementary/Intermediate/Advanced/Expert

    # Raw stats
    total_characters: int
    kanji_count: int
    unique_kanji: int
    avg_sentence_length: float


# Kanji grade level data (approximation for common kanji)
# Grade 1-6: Elementary school, Grade 7-9: Middle school
JLPT_KANJI_APPROX = {
    "N5": 1,  # ~100 kanji, grade 1-2 level
    "N4": 2,  # ~300 kanji, grade 2-3 level
    "N3": 3,  # ~650 kanji, grade 4-5 level
    "N2": 4,  # ~1000 kanji, grade 6+ level
    "N1": 5,  # ~2000 kanji, advanced
}


class DifficultyAnalysisService:
    """Service for analyzing text difficulty."""

    # KanjiAPI base URL
    KANJI_API_URL = "https://kanjiapi.dev/v1/kanji"

    # Difficulty level thresholds
    LEVEL_THRESHOLDS = [
        (0.2, "Beginner"),
        (0.4, "Elementary"),
        (0.6, "Intermediate"),
        (0.8, "Advanced"),
        (1.0, "Expert"),
    ]

    def __init__(self):
        """Initialize the service."""
        self._kanji_cache: dict[str, int] = {}
        self._jreadability_available: Optional[bool] = None
        self._wordfreq_available: Optional[bool] = None

    async def analyze_text(self, text: str) -> DifficultyMetrics:
        """Analyze text difficulty across multiple dimensions."""
        if not text.strip():
            return self._empty_metrics()

        # Get individual metrics
        overall = await self._compute_overall_difficulty(text)
        kanji = await self._compute_kanji_difficulty(text)
        lexical = self._compute_lexical_difficulty(text)
        grammar = self._compute_grammar_complexity(text)
        sentence = self._compute_sentence_complexity(text)

        # Calculate difficulty level
        avg_difficulty = (overall + kanji + lexical + grammar + sentence) / 5
        level = self._get_difficulty_level(avg_difficulty)

        # Raw stats
        kanji_chars = self._extract_kanji(text)

        return DifficultyMetrics(
            overall_difficulty=round(overall, 3),
            kanji_difficulty=round(kanji, 3),
            lexical_difficulty=round(lexical, 3),
            grammar_complexity=round(grammar, 3),
            sentence_complexity=round(sentence, 3),
            difficulty_level=level,
            total_characters=len(text),
            kanji_count=len(kanji_chars),
            unique_kanji=len(set(kanji_chars)),
            avg_sentence_length=self._avg_sentence_length(text),
        )

    async def _compute_overall_difficulty(self, text: str) -> float:
        """Compute overall difficulty using jReadability."""
        if self._jreadability_available is None:
            try:
                from jreadability import compute_readability

                self._jreadability_available = True
            except ImportError:
                self._jreadability_available = False

        if self._jreadability_available:
            from jreadability import compute_readability

            try:
                score = compute_readability(text)
                # jReadability returns higher = easier, invert for our scale
                return 1.0 - min(1.0, max(0.0, score))
            except Exception:
                pass

        # Fallback: estimate from character composition
        return self._estimate_difficulty_from_chars(text)

    async def _compute_kanji_difficulty(self, text: str) -> float:
        """Compute kanji difficulty based on grade levels."""
        kanji_chars = self._extract_kanji(text)
        if not kanji_chars:
            return 0.0

        total_grade = 0
        for kanji in set(kanji_chars):
            grade = await self._get_kanji_grade(kanji)
            total_grade += grade

        # Average grade normalized to 0-1 (grades 1-10 scale)
        avg_grade = total_grade / len(set(kanji_chars))
        return min(1.0, avg_grade / 10)

    async def _get_kanji_grade(self, kanji: str) -> int:
        """Get grade level for a kanji character."""
        if kanji in self._kanji_cache:
            return self._kanji_cache[kanji]

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.KANJI_API_URL}/{kanji}")
                if response.status_code == 200:
                    data = response.json()
                    # Grade is 1-6 for elementary, we use higher for secondary
                    grade = data.get("grade", 9)
                    if grade is None:
                        grade = 9  # Uncommon kanji
                    self._kanji_cache[kanji] = grade
                    return grade
        except Exception:
            pass

        # Default to middle difficulty
        self._kanji_cache[kanji] = 5
        return 5

    def _compute_lexical_difficulty(self, text: str) -> float:
        """Compute lexical difficulty using word frequency."""
        if self._wordfreq_available is None:
            try:
                from wordfreq import word_frequency

                self._wordfreq_available = True
            except ImportError:
                self._wordfreq_available = False

        if not self._wordfreq_available:
            return 0.5  # Default mid-level

        from wordfreq import word_frequency

        # Simple word extraction (would be better with tokenizer)
        words = re.findall(r"[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]+", text)
        if not words:
            return 0.0

        total_freq = 0.0
        for word in words:
            freq = word_frequency(word, "ja")
            # Convert frequency to difficulty (rare = harder)
            if freq > 0:
                # Log scale, common words have freq ~0.01, rare ~0.000001
                difficulty = 1.0 - min(1.0, (freq + 0.0001) * 100)
            else:
                difficulty = 0.9  # Unknown word is hard
            total_freq += difficulty

        return total_freq / len(words)

    def _compute_grammar_complexity(self, text: str) -> float:
        """Estimate grammar complexity from patterns."""
        complexity = 0.0
        total_patterns = 0

        # Advanced grammar patterns (higher score = more complex)
        patterns = [
            (r"ている|ていた|ていない", 0.2),  # Progressive/resultative
            (r"てしまう|ちゃう|てしまった", 0.3),  # Completion
            (r"ようにする|ことにする", 0.4),  # Decision patterns
            (r"かもしれない|に違いない", 0.4),  # Probability
            (r"ばかり|ところ|ばかりだ", 0.5),  # Time expressions
            (r"させる|させられる", 0.6),  # Causative/passive
            (r"べき|はず|わけ", 0.5),  # Expectation
            (r"によって|において|に対して", 0.6),  # Formal expressions
            (r"にもかかわらず|ものの", 0.7),  # Concession
            (r"つつある|ざるを得ない", 0.8),  # Literary forms
        ]

        for pattern, score in patterns:
            matches = len(re.findall(pattern, text))
            if matches > 0:
                complexity += score * matches
                total_patterns += matches

        if total_patterns == 0:
            return 0.3  # Basic text

        return min(1.0, complexity / (total_patterns * 0.5))

    def _compute_sentence_complexity(self, text: str) -> float:
        """Compute sentence complexity from length and structure."""
        sentences = self._split_sentences(text)
        if not sentences:
            return 0.0

        lengths = [len(s) for s in sentences]
        avg_length = sum(lengths) / len(lengths)

        # Variance in length (higher = more complex structure)
        variance = sum((l - avg_length) ** 2 for l in lengths) / len(lengths)
        std_dev = variance**0.5

        # Normalize: avg length 20-80 chars mapped to 0-1
        length_score = min(1.0, max(0.0, (avg_length - 10) / 70))

        # Variance adds complexity
        variance_score = min(0.3, std_dev / 50)

        return min(1.0, length_score + variance_score)

    def _extract_kanji(self, text: str) -> list[str]:
        """Extract kanji characters from text."""
        return [c for c in text if "\u4e00" <= c <= "\u9faf"]

    def _split_sentences(self, text: str) -> list[str]:
        """Split text into sentences."""
        # Japanese sentence endings
        sentences = re.split(r"[。！？\n]+", text)
        return [s.strip() for s in sentences if s.strip()]

    def _avg_sentence_length(self, text: str) -> float:
        """Calculate average sentence length."""
        sentences = self._split_sentences(text)
        if not sentences:
            return 0.0
        return sum(len(s) for s in sentences) / len(sentences)

    def _estimate_difficulty_from_chars(self, text: str) -> float:
        """Fallback difficulty estimation from character types."""
        total = len(text)
        if total == 0:
            return 0.0

        kanji = len(self._extract_kanji(text))
        katakana = len(re.findall(r"[\u30a0-\u30ff]", text))

        # More kanji = harder, more katakana = often loanwords (easier)
        kanji_ratio = kanji / total
        return min(1.0, kanji_ratio * 2)

    def _get_difficulty_level(self, score: float) -> str:
        """Convert numeric score to categorical level."""
        for threshold, level in self.LEVEL_THRESHOLDS:
            if score <= threshold:
                return level
        return "Expert"

    def _empty_metrics(self) -> DifficultyMetrics:
        """Return empty metrics for empty text."""
        return DifficultyMetrics(
            overall_difficulty=0.0,
            kanji_difficulty=0.0,
            lexical_difficulty=0.0,
            grammar_complexity=0.0,
            sentence_complexity=0.0,
            difficulty_level="Beginner",
            total_characters=0,
            kanji_count=0,
            unique_kanji=0,
            avg_sentence_length=0.0,
        )
