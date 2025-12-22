"""Text generation service using OpenRouter API for difficulty-matched content."""

import os
from dataclasses import dataclass
from typing import Optional

import httpx


@dataclass
class GenerationParams:
    """Parameters for text generation."""

    topic: Optional[str] = None
    genre: str = "general"  # general, story, dialogue, news, essay
    length: str = "medium"  # short (~50 chars), medium (~150), long (~300)

    # Difficulty targets (0.0-1.0)
    kanji_difficulty: float = 0.3
    lexical_difficulty: float = 0.3
    grammar_difficulty: float = 0.3


@dataclass
class GeneratedText:
    """Result of text generation."""

    text: str
    topic: str
    genre: str
    target_difficulty: float


DIFFICULTY_DESCRIPTIONS = {
    (0.0, 0.2): "beginner (N5 level, basic hiragana/katakana, simple kanji like 一二三日月火水)",
    (0.2, 0.4): "elementary (N4 level, common kanji, basic grammar patterns)",
    (0.4, 0.6): "intermediate (N3 level, varied vocabulary, compound sentences)",
    (0.6, 0.8): "upper-intermediate (N2 level, complex grammar, literary expressions)",
    (0.8, 1.0): "advanced (N1 level, rare kanji, formal/literary language)",
}

LENGTH_TARGETS = {
    "short": "2-3 sentences (approximately 50 characters)",
    "medium": "4-6 sentences (approximately 150 characters)",
    "long": "8-12 sentences (approximately 300 characters)",
}

GENRE_PROMPTS = {
    "general": "everyday topics like weather, food, hobbies, or daily life",
    "story": "a short narrative or story with characters and events",
    "dialogue": "a natural conversation between two people",
    "news": "news article style about current events or topics",
    "essay": "an opinion piece or reflective writing",
}


class TextGenerationService:
    """Service for generating Japanese text at specified difficulty levels."""

    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self):
        """Initialize with OpenRouter API key."""
        self.api_key = os.getenv("OPENROUTER_API_KEY")

    def _get_difficulty_description(self, avg_difficulty: float) -> str:
        """Get human-readable difficulty description."""
        for (low, high), desc in DIFFICULTY_DESCRIPTIONS.items():
            if low <= avg_difficulty < high:
                return desc
        return DIFFICULTY_DESCRIPTIONS[(0.8, 1.0)]

    async def generate_text(self, params: GenerationParams) -> GeneratedText:
        """Generate Japanese text at the specified difficulty level."""
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not configured")

        # Calculate average difficulty for description
        avg_difficulty = (
            params.kanji_difficulty +
            params.lexical_difficulty +
            params.grammar_difficulty
        ) / 3

        difficulty_desc = self._get_difficulty_description(avg_difficulty)
        length_desc = LENGTH_TARGETS.get(params.length, LENGTH_TARGETS["medium"])
        genre_desc = GENRE_PROMPTS.get(params.genre, GENRE_PROMPTS["general"])

        # Build the prompt
        topic_instruction = ""
        if params.topic:
            topic_instruction = f"The topic should be about: {params.topic}\n"

        prompt = f"""Generate Japanese text for a language learner.

Requirements:
- Difficulty level: {difficulty_desc}
- Kanji complexity: {"minimal kanji" if params.kanji_difficulty < 0.3 else "moderate kanji" if params.kanji_difficulty < 0.6 else "complex kanji"}
- Grammar complexity: {"simple patterns like です/ます" if params.grammar_difficulty < 0.3 else "intermediate patterns" if params.grammar_difficulty < 0.6 else "complex/literary patterns"}
- Length: {length_desc}
- Genre/style: {genre_desc}
{topic_instruction}
Important guidelines:
- Use vocabulary appropriate for the difficulty level
- For beginner levels, prefer hiragana over kanji for common words
- For intermediate+, use appropriate kanji with natural Japanese writing
- Make the content interesting and engaging
- Do NOT include furigana, translations, or explanations
- Output ONLY the Japanese text, nothing else

Generate the Japanese text now:"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "anthropic/claude-3-haiku",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.8,
                },
            )

            if response.status_code != 200:
                raise ValueError(f"OpenRouter API error: {response.status_code}")

            data = response.json()
            generated_text = data["choices"][0]["message"]["content"].strip()

            # Clean up any accidental explanations or translations
            lines = generated_text.split("\n")
            japanese_lines = []
            for line in lines:
                line = line.strip()
                # Skip lines that look like English explanations
                if line and not line.startswith(("Translation:", "Note:", "(")):
                    # Check if line contains mostly Japanese characters
                    japanese_chars = sum(
                        1 for c in line
                        if "\u3040" <= c <= "\u309f"  # hiragana
                        or "\u30a0" <= c <= "\u30ff"  # katakana
                        or "\u4e00" <= c <= "\u9faf"  # kanji
                        or c in "。、！？「」『』"
                    )
                    if japanese_chars > len(line) * 0.5:
                        japanese_lines.append(line)

            final_text = "\n".join(japanese_lines) if japanese_lines else generated_text

            return GeneratedText(
                text=final_text,
                topic=params.topic or "general",
                genre=params.genre,
                target_difficulty=avg_difficulty,
            )

    async def generate_at_user_level(
        self,
        kanji_proficiency: float,
        lexical_proficiency: float,
        grammar_proficiency: float,
        topic: Optional[str] = None,
        genre: str = "general",
        length: str = "medium",
        challenge_level: float = 0.1,
    ) -> GeneratedText:
        """Generate text slightly above user's current proficiency (i+1 approach).

        Args:
            kanji_proficiency: User's kanji skill (0-1)
            lexical_proficiency: User's vocabulary skill (0-1)
            grammar_proficiency: User's grammar skill (0-1)
            topic: Optional topic for the text
            genre: Text genre (general, story, dialogue, news, essay)
            length: Text length (short, medium, long)
            challenge_level: How much harder than current level (default 0.1 = 10%)
        """
        # Apply i+1 principle - slightly harder than current level
        params = GenerationParams(
            topic=topic,
            genre=genre,
            length=length,
            kanji_difficulty=min(1.0, kanji_proficiency + challenge_level),
            lexical_difficulty=min(1.0, lexical_proficiency + challenge_level),
            grammar_difficulty=min(1.0, grammar_proficiency + challenge_level),
        )

        return await self.generate_text(params)
