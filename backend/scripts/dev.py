"""Development server launcher."""

import uvicorn


def main() -> None:
    """Run development server with auto-reload."""
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"],
    )


if __name__ == "__main__":
    main()
