"""Main API router aggregating all route modules."""

from fastapi import APIRouter

api_router = APIRouter()

# Route modules will be included here as they are implemented
# from app.api.routes import tokenize, dictionary, audio, content, progress, anki, settings
# api_router.include_router(tokenize.router, prefix="/tokenize", tags=["tokenize"])
# api_router.include_router(dictionary.router, prefix="/dictionary", tags=["dictionary"])
# api_router.include_router(audio.router, prefix="/audio", tags=["audio"])
# api_router.include_router(content.router, prefix="/content", tags=["content"])
# api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
# api_router.include_router(anki.router, prefix="/anki", tags=["anki"])
# api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
