"""
Candidate image downloader with local caching.

Downloads candidate images from URLs, storing them in data/candidates/.
Each downloaded image gets a companion JSON metadata file.

Never crashes the pipeline — failed downloads are logged and skipped.
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Optional

import httpx
import numpy as np

from .models import Candidate

logger = logging.getLogger(__name__)

# Default storage directory (relative to backend root)
CANDIDATES_DIR = Path(__file__).parent.parent / "data" / "candidates"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

TIMEOUT = 15.0
MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB


def _url_to_filename_base(url: str, idx: int) -> str:
    """Generate a stable filename prefix from an index and URL hash."""
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
    return f"candidate_{idx:04d}_{url_hash}"


def _save_metadata(base: Path, candidate: Candidate) -> None:
    """Write companion JSON metadata file."""
    meta = {
        "source_url": candidate.url,
        "title": candidate.title,
        "domain": candidate.source,
        "image_url": candidate.image_url or candidate.thumbnail,
    }
    with open(base.with_suffix(".json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)


def _is_valid_image(data: bytes) -> bool:
    """Quick check that bytes look like a JPEG/PNG/WEBP/GIF."""
    if len(data) < 8:
        return False
    # JPEG
    if data[:2] == b"\xff\xd8":
        return True
    # PNG
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return True
    # WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return True
    # GIF
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return True
    # BMP
    if data[:2] == b"BM":
        return True
    return False


def download_candidate(
    candidate: Candidate,
    candidates_dir: Path = CANDIDATES_DIR,
) -> Candidate:
    """
    Download the image for a single candidate and update its local_path.

    Prefers candidate.image_url; falls back to candidate.thumbnail.
    Caches to disk — subsequent calls return the cached path without re-downloading.

    Returns the (possibly updated) candidate. Never raises.
    """
    candidates_dir.mkdir(parents=True, exist_ok=True)

    image_url = candidate.image_url or candidate.thumbnail
    if not image_url:
        logger.warning(f"Candidate #{candidate.id}: no image URL, skipping download.")
        return candidate

    base_name = _url_to_filename_base(image_url, candidate.id)
    # Try all supported extensions
    for ext in (".jpg", ".png", ".webp"):
        cached = candidates_dir / (base_name + ext)
        if cached.exists() and cached.stat().st_size > 100:
            candidate.local_path = str(cached)
            candidate.downloaded = True
            logger.debug(f"Candidate #{candidate.id}: cache hit → {cached}")
            _save_metadata(cached, candidate)
            return candidate

    # Download
    for attempt_url in dict.fromkeys([image_url, candidate.thumbnail]):
        if not attempt_url:
            continue
        try:
            with httpx.Client(
                headers=HEADERS, timeout=TIMEOUT, follow_redirects=True
            ) as client:
                resp = client.get(attempt_url)
                if resp.status_code != 200:
                    logger.warning(
                        f"Candidate #{candidate.id}: HTTP {resp.status_code} for {attempt_url}"
                    )
                    continue

                data = resp.content
                if len(data) > MAX_IMAGE_BYTES:
                    logger.warning(
                        f"Candidate #{candidate.id}: image too large ({len(data)} bytes), skipping."
                    )
                    continue

                if not _is_valid_image(data):
                    logger.warning(
                        f"Candidate #{candidate.id}: response is not a valid image."
                    )
                    continue

                # Detect extension from content-type
                ct = resp.headers.get("content-type", "")
                if "png" in ct:
                    ext = ".png"
                elif "webp" in ct:
                    ext = ".webp"
                else:
                    ext = ".jpg"

                dest = candidates_dir / (base_name + ext)
                dest.write_bytes(data)
                _save_metadata(dest, candidate)

                candidate.local_path = str(dest)
                candidate.downloaded = True
                candidate.image_url = attempt_url
                logger.info(
                    f"Candidate #{candidate.id}: downloaded → {dest.name} ({len(data)} bytes)"
                )
                return candidate

        except Exception as exc:
            logger.warning(f"Candidate #{candidate.id}: download error for {attempt_url}: {exc}")
            continue

    logger.warning(f"Candidate #{candidate.id}: all download attempts failed.")
    return candidate


def load_image_as_array(local_path: str) -> Optional[np.ndarray]:
    """
    Load a downloaded candidate image as a BGR numpy array for InsightFace.
    Returns None on failure.
    """
    import cv2
    img = cv2.imread(local_path)
    return img
