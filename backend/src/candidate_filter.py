"""
Domain classification and candidate URL filtering.

Classifies reverse-search results by social/web platform and
filters out non-content URLs (e.g. channel root pages).
"""
from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

from .models import Candidate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Supported platform domains
# ---------------------------------------------------------------------------

SOCIAL_DOMAINS = {
    "instagram.com": "Instagram",
    "linkedin.com": "LinkedIn",
    "youtube.com": "YouTube",
    "youtu.be": "YouTube",
    "facebook.com": "Facebook",
    "fb.com": "Facebook",
    "x.com": "X (Twitter)",
    "twitter.com": "X (Twitter)",
    "tiktok.com": "TikTok",
    "reddit.com": "Reddit",
    "threads.net": "Threads",
    "pinterest.com": "Pinterest",
}

# YouTube paths that are content (not just a channel/profile root)
YOUTUBE_CONTENT_PATTERNS = [
    r"/watch\?v=",
    r"/shorts/",
    r"/post/",
    r"/live/",
    r"/clip/",
    r"/embed/",
    r"/v/",
]

# YouTube paths that are profile-only and may not contain usable media
YOUTUBE_PROFILE_ONLY_PATTERNS = [
    r"^/channel/[^/]+/?$",
    r"^/@[^/]+/?$",
    r"^/user/[^/]+/?$",
    r"^/c/[^/]+/?$",
]


def classify_domain(url: str) -> str:
    """
    Return a human-readable platform name for the URL domain.
    Falls back to the domain itself or 'Web'.
    """
    if not url:
        return "Web"
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        # Strip www.
        hostname = re.sub(r"^www\.", "", hostname)
        for domain, name in SOCIAL_DOMAINS.items():
            if hostname == domain or hostname.endswith(f".{domain}"):
                return name
        return hostname or "Web"
    except Exception:
        return "Web"


def is_youtube_content_url(url: str) -> bool:
    """Return True if the YouTube URL points to actual content."""
    parsed = urlparse(url)
    path = parsed.path + ("?" + parsed.query if parsed.query else "")
    full = path + "?" + parsed.query if parsed.query else path
    for pattern in YOUTUBE_CONTENT_PATTERNS:
        if re.search(pattern, full):
            return True
    return False


def is_youtube_profile_only(url: str) -> bool:
    """Return True if the URL is a YouTube channel/profile root with no content."""
    parsed = urlparse(url)
    path = parsed.path
    for pattern in YOUTUBE_PROFILE_ONLY_PATTERNS:
        if re.match(pattern, path):
            return True
    return False


def is_usable_candidate(candidate: Candidate) -> bool:
    """
    Determine if a candidate has a usable image URL.

    Rules:
    - Must have a non-empty image_url or thumbnail.
    - YouTube URLs that are profile-only are skipped unless they have a thumbnail.
    """
    url = candidate.url
    image_url = candidate.image_url or candidate.thumbnail

    if not image_url:
        return False

    # YouTube profile-only check
    platform = classify_domain(url)
    if platform == "YouTube":
        if is_youtube_profile_only(url) and not candidate.thumbnail:
            return False

    return True


def filter_candidates(
    candidates: list[Candidate],
    max_candidates: int = 20,
) -> list[Candidate]:
    """
    Filter and deduplicate reverse-search candidates.

    Steps:
    1. Remove entries with no image URL or thumbnail.
    2. Deduplicate by image URL.
    3. Cap at max_candidates.
    4. Attach platform classification to the source field.

    Returns filtered + annotated list.
    """
    seen_image_urls: set[str] = set()
    filtered: list[Candidate] = []

    for c in candidates:
        img_url = c.image_url or c.thumbnail
        if not img_url:
            continue
        if img_url in seen_image_urls:
            continue

        # Skip YouTube profile-only pages with no thumbnail
        if not is_usable_candidate(c):
            logger.debug(f"Skipping non-content URL: {c.url}")
            continue

        seen_image_urls.add(img_url)

        # Annotate source with platform name
        platform = classify_domain(c.url)
        c.source = platform if platform != "Web" else (c.source or "Web")

        filtered.append(c)

        if len(filtered) >= max_candidates:
            break

    logger.info(
        f"Filtered {len(candidates)} → {len(filtered)} usable candidates "
        f"(max={max_candidates})"
    )
    return filtered
