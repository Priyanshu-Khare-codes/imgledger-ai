"""
Reverse image search using PicImageSearch + Yandex.

YandexItem fields (from source):
    .url          - page URL
    .title        - result title
    .thumbnail    - thumbnail URL (https-prefixed)
    .source       - domain name
    .content      - description text
    .size         - "widthxheight"

Usage:
    results = await search_image("path/to/image.jpg")
    # returns list[dict] normalized candidates
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from .models import Candidate

logger = logging.getLogger(__name__)


async def search_image(image_path: str) -> list[Candidate]:
    """
    Perform a genuine Yandex reverse image search for the given image file.

    The image is uploaded directly to Yandex — no URLs are hardcoded.

    Returns a list of normalized Candidate objects.
    Raises on critical errors; returns empty list on soft failures.
    """
    from PicImageSearch import Network, Yandex

    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Input image not found: {image_path}")

    candidates: list[Candidate] = []

    try:
        async with Network() as client:
            yandex = Yandex(client=client)
            resp = await yandex.search(file=str(path))
    except Exception as exc:
        logger.error(f"Yandex search failed: {exc}")
        raise RuntimeError(f"Yandex reverse image search failed: {exc}") from exc

    raw_results = getattr(resp, "raw", [])
    logger.info(f"Yandex returned {len(raw_results)} raw results.")

    for idx, item in enumerate(raw_results):
        try:
            candidate = Candidate(
                id=idx,
                title=getattr(item, "title", "") or "",
                source=getattr(item, "source", "") or "",
                url=getattr(item, "url", "") or "",
                thumbnail=getattr(item, "thumbnail", "") or "",
                # YandexItem doesn't expose originalImage URL directly,
                # but the thumbnail is a valid image reference we can use.
                image_url=getattr(item, "thumbnail", "") or "",
                description=getattr(item, "content", "") or "",
            )
            candidates.append(candidate)
        except Exception as e:
            logger.warning(f"Skipping malformed result #{idx}: {e}")
            continue

    return candidates
