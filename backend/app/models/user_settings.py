"""User settings database models."""

from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class FuriganaMode(str, Enum):
    """Furigana display mode."""

    ALWAYS = "always"
    NEVER = "never"
    HOVER = "hover"
    UNKNOWN_ONLY = "unknown_only"


class UserSettings(SQLModel, table=True):
    """User settings model."""

    __tablename__ = "user_settings"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Canvas settings
    canvas_font_family: str = Field(default="Noto Sans JP")
    canvas_font_size: int = Field(default=20)
    canvas_line_height: float = Field(default=1.8)
    canvas_max_width: int = Field(default=800)

    # Tooltip settings
    tooltip_delay_ms: int = Field(default=300)
    tooltip_show_pitch: bool = Field(default=True)
    tooltip_show_examples: bool = Field(default=True)
    tooltip_ai_context: bool = Field(default=False)

    # Reading settings
    furigana_mode: FuriganaMode = Field(default=FuriganaMode.UNKNOWN_ONLY)
    highlight_unknown: bool = Field(default=True)

    # Audio settings
    tts_voice: str = Field(default="ja-JP-NanamiNeural")
    tts_speed: float = Field(default=1.0)

    # Anki settings
    anki_enabled: bool = Field(default=False)
    anki_deck_name: Optional[str] = Field(default=None)
    anki_field_expression: str = Field(default="Expression")
    anki_field_reading: str = Field(default="Reading")
