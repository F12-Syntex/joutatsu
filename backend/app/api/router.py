"""Main API router aggregating all route modules."""

from fastapi import APIRouter

from app.api.routes import (
    aozora,
    content,
    data,
    dictionary,
    difficulty,
    generation,
    proficiency,
    progress,
    sessions,
    tokenize,
    video_browse,
)

api_router = APIRouter()

# Data exploration routes (for development)
api_router.include_router(data.router)

# Tokenization routes
api_router.include_router(tokenize.router)

# Dictionary routes
api_router.include_router(dictionary.router)

# Content management routes
api_router.include_router(content.router)

# Progress and scoring routes
api_router.include_router(progress.router)

# Session tracking routes
api_router.include_router(sessions.router)

# Aozora Bunko routes
api_router.include_router(aozora.router)

# Proficiency tracking routes
api_router.include_router(proficiency.router)

# Difficulty analysis routes
api_router.include_router(difficulty.router)

# Text generation routes
api_router.include_router(generation.router)

# Video browse and download routes
api_router.include_router(video_browse.router)

# Route modules will be included here as they are implemented
# from app.api.routes import audio, anki, settings
# api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
# api_router.include_router(anki.router, prefix="/anki", tags=["anki"])
# api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
