"""Download pitch accent dictionary from GitHub release.

Downloads the pre-built pitch.db from mierutone-dictionary releases.

Usage:
    python scripts/download_dictionary.py [--force]
"""

import argparse
import hashlib
import urllib.request
import urllib.error
import time
from pathlib import Path

# GitHub release URL
REPO = "danielnichiata96/mierutone-dictionary"
VERSION = "v1.0.0"
ASSET_NAME = "pitch.db"
DOWNLOAD_URL = f"https://github.com/{REPO}/releases/download/{VERSION}/{ASSET_NAME}"

# SHA256 checksum for integrity verification (v1.0.0)
EXPECTED_SHA256 = "1cc86429e3bc825e4a273fd40be5a612ab3d995cbb44f03a5e29d0110e04e04b"

DB_PATH = Path(__file__).parent.parent / "data" / "pitch.db"

# Network settings
REQUEST_TIMEOUT = 60  # seconds (larger file)
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def verify_checksum(content: bytes, expected: str) -> bool:
    """Verify SHA256 checksum of downloaded content."""
    actual = hashlib.sha256(content).hexdigest()
    return actual == expected


def download_database() -> bytes:
    """Download pitch.db from GitHub release with retry logic."""
    print(f"Downloading {ASSET_NAME} from {REPO} ({VERSION})...")
    print(f"URL: {DOWNLOAD_URL}\n")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(DOWNLOAD_URL, timeout=REQUEST_TIMEOUT) as response:
                total_size = int(response.headers.get("Content-Length", 0))
                downloaded = 0
                chunks = []

                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    chunks.append(chunk)
                    downloaded += len(chunk)
                    if total_size:
                        pct = (downloaded / total_size) * 100
                        print(f"\rDownloading: {downloaded:,} / {total_size:,} bytes ({pct:.1f}%)", end="")

                print()  # newline after progress
                content = b"".join(chunks)
                print(f"Downloaded {len(content):,} bytes")
                return content

        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < MAX_RETRIES:
                print(f"\nAttempt {attempt} failed: {e}. Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
            else:
                raise RuntimeError(f"Failed to download after {MAX_RETRIES} attempts: {e}")


def main():
    parser = argparse.ArgumentParser(description="Download Mierutone pitch dictionary")
    parser.add_argument("--force", action="store_true", help="Overwrite existing database")
    args = parser.parse_args()

    print("=== Mierutone Dictionary Downloader ===\n")
    print(f"Version: {VERSION}")
    print(f"Expected SHA256: {EXPECTED_SHA256[:16]}...\n")

    if DB_PATH.exists() and not args.force:
        print(f"Database already exists at {DB_PATH}")
        print("Use --force to overwrite.")
        return

    # Download
    content = download_database()

    # Verify checksum
    print("\nVerifying checksum...")
    if not verify_checksum(content, EXPECTED_SHA256):
        raise RuntimeError(
            f"Checksum mismatch! Expected {EXPECTED_SHA256[:16]}..., "
            f"got {hashlib.sha256(content).hexdigest()[:16]}..."
        )
    print("Checksum OK")

    # Save
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    DB_PATH.write_bytes(content)

    print(f"\nSaved to {DB_PATH}")
    print(f"Size: {DB_PATH.stat().st_size:,} bytes")
    print("\nAttribution (CC BY-SA 4.0):")
    print("  Pitch accent data from Kanjium by mifunetoshiro")
    print("  https://github.com/mifunetoshiro/kanjium")


if __name__ == "__main__":
    main()
