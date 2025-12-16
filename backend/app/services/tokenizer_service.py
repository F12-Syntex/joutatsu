"""Tokenizer service for Japanese text analysis using SudachiPy."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession


class SplitMode(str, Enum):
    """Sudachi split modes for tokenization granularity."""

    A = "A"  # Short units (morphemes)
    B = "B"  # Medium units
    C = "C"  # Long units (named entities, compounds)


@dataclass
class Token:
    """Represents a tokenized word with linguistic information."""

    surface: str
    dictionary_form: str
    reading: str
    pos: list[str]
    pos_short: str
    start: int
    end: int
    is_known: bool = False


class TokenizerService:
    """Service for tokenizing Japanese text using SudachiPy."""

    def __init__(self, session: Optional[AsyncSession] = None):
        """Initialize with optional database session for vocabulary lookups."""
        self._session = session
        self._tokenizer = None
        self._initialize_tokenizer()

    def _initialize_tokenizer(self) -> None:
        """Lazily initialize the Sudachi tokenizer."""
        if self._tokenizer is None:
            try:
                from sudachipy import Dictionary

                self._tokenizer = Dictionary().create()
            except ImportError:
                raise RuntimeError(
                    "SudachiPy is not installed. "
                    "Run: uv sync --extra nlp"
                )

    def tokenize(
        self,
        text: str,
        mode: SplitMode = SplitMode.C,
        merge_conjugations: bool = True,
    ) -> list[Token]:
        """
        Tokenize Japanese text into morphological units.

        Args:
            text: Japanese text to tokenize
            mode: Split mode (A=short, B=medium, C=long)
            merge_conjugations: Merge verb/adj stems with conjugation suffixes

        Returns:
            List of Token objects with linguistic information
        """
        from sudachipy import Tokenizer as SudachiTokenizer

        modes = {
            SplitMode.A: SudachiTokenizer.SplitMode.A,
            SplitMode.B: SudachiTokenizer.SplitMode.B,
            SplitMode.C: SudachiTokenizer.SplitMode.C,
        }
        split_mode = modes.get(mode, SudachiTokenizer.SplitMode.C)

        morphemes = self._tokenizer.tokenize(text, split_mode)

        tokens = []
        for m in morphemes:
            pos = list(m.part_of_speech())
            tokens.append(
                Token(
                    surface=m.surface(),
                    dictionary_form=m.dictionary_form(),
                    reading=m.reading_form(),
                    pos=pos,
                    pos_short=pos[0] if pos else "",
                    start=m.begin(),
                    end=m.end(),
                    is_known=False,
                )
            )

        if merge_conjugations:
            tokens = self._merge_conjugations(tokens)

        return tokens

    def _merge_conjugations(self, tokens: list[Token]) -> list[Token]:
        """
        Merge verb/adjective stems with their conjugation suffixes.

        This makes output more learner-friendly by keeping conjugated forms together.
        E.g., あり + ます -> あります
        """
        if not tokens:
            return tokens

        # POS tags that should be merged with preceding verb/adjective
        # 助動詞 = auxiliary verb (ます, た, ない, etc.)
        # 助詞-接続助詞 = conjunctive particle (て, で)
        mergeable_pos = {"助動詞"}

        result = []
        i = 0

        while i < len(tokens):
            current = tokens[i]

            # Check if this is a verb or adjective that might have conjugations
            if current.pos_short in {"動詞", "形容詞", "助動詞"}:
                # Collect all following mergeable tokens
                merged_surface = current.surface
                merged_reading = current.reading
                merged_end = current.end
                j = i + 1

                while j < len(tokens):
                    next_token = tokens[j]
                    # Merge auxiliary verbs and some particles
                    if next_token.pos_short in mergeable_pos:
                        merged_surface += next_token.surface
                        merged_reading += next_token.reading
                        merged_end = next_token.end
                        j += 1
                    # Also merge て/で forms with following auxiliaries
                    elif (
                        next_token.surface in {"て", "で"}
                        and next_token.pos_short == "助詞"
                    ):
                        merged_surface += next_token.surface
                        merged_reading += next_token.reading
                        merged_end = next_token.end
                        j += 1
                    else:
                        break

                # Create merged token if we merged anything
                if j > i + 1:
                    result.append(
                        Token(
                            surface=merged_surface,
                            dictionary_form=current.dictionary_form,
                            reading=merged_reading,
                            pos=current.pos,
                            pos_short=current.pos_short,
                            start=current.start,
                            end=merged_end,
                            is_known=current.is_known,
                        )
                    )
                    i = j
                else:
                    result.append(current)
                    i += 1
            else:
                result.append(current)
                i += 1

        return result

    def tokenize_batch(
        self,
        texts: list[str],
        mode: SplitMode = SplitMode.C,
    ) -> list[list[Token]]:
        """
        Tokenize multiple texts.

        Args:
            texts: List of Japanese texts to tokenize
            mode: Split mode for all texts

        Returns:
            List of token lists, one per input text
        """
        return [self.tokenize(text, mode) for text in texts]

    async def tokenize_with_known_vocab(
        self,
        text: str,
        mode: SplitMode = SplitMode.C,
    ) -> list[Token]:
        """
        Tokenize and mark known vocabulary from database.

        Args:
            text: Japanese text to tokenize
            mode: Split mode

        Returns:
            List of Token objects with is_known flag set
        """
        tokens = self.tokenize(text, mode)

        if self._session is None:
            return tokens

        # Query known vocabulary (gracefully handle missing table)
        try:
            from sqlmodel import select

            from app.models.vocabulary import Vocabulary

            # Get all dictionary forms for batch lookup
            dict_forms = {t.dictionary_form for t in tokens}

            statement = select(Vocabulary.dictionary_form).where(
                Vocabulary.dictionary_form.in_(dict_forms)
            )
            result = await self._session.exec(statement)
            known_forms = set(result.all())

            # Mark known tokens
            for token in tokens:
                if token.dictionary_form in known_forms:
                    token.is_known = True
        except Exception:
            # Vocabulary table may not exist yet, return tokens without is_known
            pass

        return tokens

    def is_content_word(self, token: Token) -> bool:
        """Check if token is a content word (noun, verb, adjective, adverb)."""
        content_pos = {"名詞", "動詞", "形容詞", "副詞"}
        return token.pos_short in content_pos

    def is_punctuation(self, token: Token) -> bool:
        """Check if token is punctuation."""
        return token.pos_short == "補助記号"

    def extract_sentences(self, text: str) -> list[str]:
        """
        Split text into sentences based on Japanese punctuation.

        Args:
            text: Japanese text to split

        Returns:
            List of sentences
        """
        import re

        # Split on Japanese sentence-ending punctuation
        sentences = re.split(r"(?<=[。！？\n])", text)
        return [s.strip() for s in sentences if s.strip()]
