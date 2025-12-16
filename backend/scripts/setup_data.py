"""Setup script for downloading and preparing reference data."""

import gzip
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent.parent / "data"
JMDICT_DIR = DATA_DIR / "jmdict"
PITCH_DIR = DATA_DIR / "pitch"
SUDACHI_DIR = DATA_DIR / "sudachi"

# Kanjium pitch accent data URL
KANJIUM_URL = "https://raw.githubusercontent.com/mifunetoshiro/kanjium/master/data/source_files/raw/accents.txt"
KANJIUM_FILE = PITCH_DIR / "kanjium.tsv"

# JMdict URLs
JMDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz"
KANJIDIC_URL = "http://ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz"
JMNEDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMnedict.xml.gz"

# Jamdict default paths
JAMDICT_HOME = Path.home() / ".jamdict"
JAMDICT_DATA = JAMDICT_HOME / "data"


def ensure_directories() -> None:
    """Create data directories if they don't exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    JMDICT_DIR.mkdir(parents=True, exist_ok=True)
    PITCH_DIR.mkdir(parents=True, exist_ok=True)
    SUDACHI_DIR.mkdir(parents=True, exist_ok=True)
    JAMDICT_DATA.mkdir(parents=True, exist_ok=True)
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


def download_file(url: str, dest: Path) -> bool:
    """Download a file with progress indication."""
    if dest.exists():
        print(f"  Already exists: {dest.name}")
        return True

    print(f"  Downloading {dest.name}...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"  Downloaded: {dest.name}")
        return True
    except Exception as e:
        print(f"  Failed to download {dest.name}: {e}")
        return False


def setup_jamdict() -> None:
    """Setup JMdict database using jamdict."""
    jamdict_db = JAMDICT_DATA / "jamdict.db"

    if jamdict_db.exists():
        print(f"JMdict database already exists at {jamdict_db}")
        return

    print("Setting up JMdict database...")

    # Check if jamdict is available
    try:
        import jamdict
    except ImportError:
        print("jamdict not installed. Run: python -m uv sync --extra nlp --extra dev")
        return

    # Download XML files
    print("Downloading dictionary files (this may take a few minutes)...")
    jmdict_gz = JAMDICT_DATA / "JMdict_e.gz"
    kanjidic_gz = JAMDICT_DATA / "kanjidic2.xml.gz"
    jmnedict_gz = JAMDICT_DATA / "JMnedict.xml.gz"

    if not download_file(JMDICT_URL, jmdict_gz):
        return
    if not download_file(KANJIDIC_URL, kanjidic_gz):
        return
    if not download_file(JMNEDICT_URL, jmnedict_gz):
        return

    # Import into database
    print("Importing dictionaries into database (this may take several minutes)...")
    try:
        # Use stdin to auto-confirm if database exists
        result = subprocess.run(
            [sys.executable, "-m", "jamdict.tools", "import"],
            input="yes\n",
            capture_output=True,
            text=True,
            timeout=600,  # 10 minute timeout
        )
        if result.returncode == 0:
            print("JMdict database created successfully!")
        else:
            # Check if it actually succeeded despite warnings
            if jamdict_db.exists():
                print("JMdict database created (with warnings)")
            else:
                print(f"Import may have failed: {result.stderr}")
                print("Run manually: python -m jamdict.tools import")
    except subprocess.TimeoutExpired:
        print("Import timed out. Run manually: python -m jamdict.tools import")
    except Exception as e:
        print(f"Import failed: {e}")
        print("Run manually: python -m jamdict.tools import")


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
