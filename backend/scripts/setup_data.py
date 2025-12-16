"""Setup script for downloading and preparing reference data."""

import shutil
import urllib.request
import zipfile
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent.parent / "data"
JMDICT_DIR = DATA_DIR / "jmdict"
PITCH_DIR = DATA_DIR / "pitch"
SUDACHI_DIR = DATA_DIR / "sudachi"

# Kanjium pitch accent data URL
KANJIUM_URL = "https://raw.githubusercontent.com/mifunetoshiro/kanjium/master/data/source_files/raw/accents.txt"
KANJIUM_FILE = PITCH_DIR / "kanjium.tsv"


def ensure_directories() -> None:
    """Create data directories if they don't exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    JMDICT_DIR.mkdir(parents=True, exist_ok=True)
    PITCH_DIR.mkdir(parents=True, exist_ok=True)
    SUDACHI_DIR.mkdir(parents=True, exist_ok=True)
    print("Created data directories")


def download_kanjium_pitch() -> None:
    """Download Kanjium pitch accent data."""
    if KANJIUM_FILE.exists():
        print(f"Kanjium pitch data already exists at {KANJIUM_FILE}")
        return

    print("Downloading Kanjium pitch accent data...")
    try:
        urllib.request.urlretrieve(KANJIUM_URL, KANJIUM_FILE)
        print(f"Downloaded Kanjium pitch data to {KANJIUM_FILE}")
    except Exception as e:
        print(f"Failed to download Kanjium data: {e}")
        print("You can manually download from: https://github.com/mifunetoshiro/kanjium")


def setup_jamdict() -> None:
    """Setup JMdict database using jamdict."""
    jmdict_db = JMDICT_DIR / "jamdict.db"
    if jmdict_db.exists():
        print(f"JMdict database already exists at {jmdict_db}")
        return

    print("Setting up JMdict database...")
    print("This requires the 'nlp' optional dependencies.")
    print("Run: uv sync --extra nlp")
    print("")
    print("Then run the following to setup jamdict:")
    print("  python -m jamdict.tools setup")
    print("")
    print("After setup, copy the database to:")
    print(f"  {jmdict_db}")


def setup_sudachi() -> None:
    """Provide instructions for Sudachi dictionary setup."""
    print("Sudachi dictionary setup:")
    print("The sudachidict-core package includes the small dictionary.")
    print("For full dictionary, install sudachidict-full:")
    print("  uv pip install sudachidict-full")


def main() -> None:
    """Run all setup steps."""
    print("=" * 60)
    print("Joutatsu Reference Data Setup")
    print("=" * 60)
    print()

    ensure_directories()
    print()

    download_kanjium_pitch()
    print()

    setup_jamdict()
    print()

    setup_sudachi()
    print()

    print("=" * 60)
    print("Setup complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
