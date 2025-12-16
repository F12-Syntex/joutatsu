"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import settings
from app.core.database import init_db
from app.core.events import on_shutdown, on_startup


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown events."""
    await on_startup()
    await init_db()
    yield
    await on_shutdown()


app = FastAPI(
    title="Joutatsu API",
    description="Japanese reading comprehension learning application",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


# Static file serving for production
static_path = Path(settings.static_dir).resolve()


def setup_static_files() -> None:
    """Configure static file serving for production SPA."""
    if not static_path.exists():
        return

    # Mount static files with html=True for Next.js static export
    # This handles:
    # - /path -> serves /path.html if exists
    # - /path/ -> serves /path/index.html if exists
    app.mount("/_next", StaticFiles(directory=static_path / "_next"), name="next_static")

    # Serve static assets
    if (static_path / "icons").exists():
        app.mount("/icons", StaticFiles(directory=static_path / "icons"), name="icons")
    if (static_path / "fonts").exists():
        app.mount("/fonts", StaticFiles(directory=static_path / "fonts"), name="fonts")

    @app.get("/{path:path}")
    async def serve_spa(request: Request, path: str) -> FileResponse:
        """Serve SPA with fallback to index.html for client-side routing."""
        # Try exact file match
        file_path = static_path / path
        if file_path.is_file():
            return FileResponse(file_path)

        # Try with .html extension (Next.js static export)
        html_path = static_path / f"{path}.html"
        if html_path.is_file():
            return FileResponse(html_path)

        # Try index.html in directory
        index_path = static_path / path / "index.html"
        if index_path.is_file():
            return FileResponse(index_path)

        # Fallback to root index.html for client-side routing
        root_index = static_path / "index.html"
        if root_index.is_file():
            return FileResponse(root_index)

        # 404 if nothing found
        return FileResponse(static_path / "404.html", status_code=404)


setup_static_files()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
