"""Main API router aggregating all route modules."""

from fastapi import APIRouter

from app.api.routes import content, data, dictionary, tokenize

api_router = APIRouter()

# Data exploration routes (for development)
api_router.include_router(data.router)

# Tokenization routes
api_router.include_router(tokenize.router)

# Dictionary routes
api_router.include_router(dictionary.router)

# Content management routes
api_router.include_router(content.router)

# Route modules will be included here as they are implemented
# from app.api.routes import audio, progress, anki, settings
# api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
# api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
# api_router.include_router(anki.router, prefix="/anki", tags=["anki"])
# api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
