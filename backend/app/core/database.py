"""Database connection and session management."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Convert sqlite URL to async version
database_url = settings.database_url
if database_url.startswith("sqlite:///"):
    database_url = database_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

engine = create_async_engine(
    database_url,
    echo=settings.debug,
    future=True,
)

async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def run_migrations(conn) -> None:
    """Run database migrations for schema updates."""
    try:
        # Check if content table exists and if cover_image_id column exists
        result = await conn.execute(text("PRAGMA table_info(content)"))
        columns = [row[1] for row in result.fetchall()]

        # Only run migration if content table exists but column doesn't
        if columns and "cover_image_id" not in columns:
            await conn.execute(
                text("ALTER TABLE content ADD COLUMN cover_image_id INTEGER")
            )

        # Create content_images table if it doesn't exist
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS content_images (
                id INTEGER PRIMARY KEY,
                content_id INTEGER NOT NULL,
                chunk_index INTEGER,
                image_index INTEGER DEFAULT 0,
                page_number INTEGER,
                extension TEXT DEFAULT 'jpg',
                width INTEGER DEFAULT 0,
                height INTEGER DEFAULT 0,
                data BLOB DEFAULT '',
                FOREIGN KEY (content_id) REFERENCES content(id)
            )
        """))

        # Create indexes if they don't exist
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_content_images_content_id "
            "ON content_images(content_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_content_images_chunk_index "
            "ON content_images(chunk_index)"
        ))

        # Migrate user_proficiency table - add new proficiency columns
        result = await conn.execute(text("PRAGMA table_info(user_proficiency)"))
        prof_columns = [row[1] for row in result.fetchall()]

        if prof_columns:
            new_columns = [
                ("kanji_proficiency", "REAL DEFAULT 0.0"),
                ("lexical_proficiency", "REAL DEFAULT 0.0"),
                ("grammar_proficiency", "REAL DEFAULT 0.0"),
                ("reading_proficiency", "REAL DEFAULT 0.0"),
                ("target_kanji_difficulty", "REAL DEFAULT 0.3"),
                ("target_lexical_difficulty", "REAL DEFAULT 0.3"),
                ("target_grammar_difficulty", "REAL DEFAULT 0.3"),
                ("auto_furigana_threshold", "REAL DEFAULT 0.0"),
                ("auto_meanings_threshold", "REAL DEFAULT 0.0"),
            ]
            for col_name, col_def in new_columns:
                if col_name not in prof_columns:
                    await conn.execute(
                        text(f"ALTER TABLE user_proficiency ADD COLUMN {col_name} {col_def}")
                    )
    except Exception:
        pass  # Migrations may fail on fresh DB, tables will be created by create_all


async def init_db() -> None:
    """Initialize database and create tables."""
    async with engine.begin() as conn:
        # Run migrations first for existing databases
        await run_migrations(conn)
        # Then create any new tables
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Close database connection."""
    await engine.dispose()


async def get_session() -> AsyncSession:
    """Dependency to get database session."""
    async with async_session_maker() as session:
        yield session
