"""Import Kanjium accents.txt into SQLite database.

Downloads and imports pitch accent data from the Kanjium project.
License: CC BY-SA 4.0 - https://github.com/mifunetoshiro/kanjium

Usage:
    python scripts/import_kanjium.py
"""

import sqlite3
import urllib.request
from pathlib import Path

KANJIUM_URL = "https://raw.githubusercontent.com/mifunetoshiro/kanjium/master/data/source_files/raw/accents.txt"
DB_PATH = Path(__file__).parent.parent / "data" / "pitch.db"


def download_kanjium() -> str:
    """Download accents.txt from Kanjium repository."""
    print(f"Downloading from {KANJIUM_URL}...")
    with urllib.request.urlopen(KANJIUM_URL) as response:
        content = response.read().decode("utf-8")
    print(f"Downloaded {len(content):,} bytes")
    return content


def create_database(db_path: Path) -> sqlite3.Connection:
    """Create SQLite database with pitch_accents table."""
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS pitch_accents")
    cursor.execute("""
        CREATE TABLE pitch_accents (
            id INTEGER PRIMARY KEY,
            surface TEXT NOT NULL,
            reading TEXT NOT NULL,
            accent_pattern TEXT NOT NULL,
            goshu TEXT,
            goshu_jp TEXT
        )
    """)
    cursor.execute("CREATE INDEX idx_surface ON pitch_accents(surface)")
    cursor.execute("CREATE INDEX idx_reading ON pitch_accents(reading)")
    cursor.execute("CREATE INDEX idx_surface_reading ON pitch_accents(surface, reading)")

    conn.commit()
    return conn


def import_accents(conn: sqlite3.Connection, content: str) -> int:
    """Import accent data into database."""
    cursor = conn.cursor()
    count = 0

    for line in content.strip().split("\n"):
        if not line or line.startswith("#"):
            continue

        parts = line.split("\t")
        if len(parts) >= 3:
            surface, reading, pattern = parts[0], parts[1], parts[2]
            cursor.execute(
                "INSERT INTO pitch_accents (surface, reading, accent_pattern) VALUES (?, ?, ?)",
                (surface, reading, pattern)
            )
            count += 1

    conn.commit()
    return count


def main():
    print("=== Kanjium Pitch Accent Importer ===\n")

    content = download_kanjium()
    conn = create_database(DB_PATH)
    count = import_accents(conn, content)

    conn.close()

    print(f"\nImported {count:,} entries to {DB_PATH}")
    print("\nAttribution (CC BY-SA 4.0):")
    print("  Pitch accent data from Kanjium by mifunetoshiro")
    print("  https://github.com/mifunetoshiro/kanjium")


if __name__ == "__main__":
    main()
