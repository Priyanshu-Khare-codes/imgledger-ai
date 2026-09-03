"""
Face similarity matching engine.

Matches candidate images against the input face embedding using
InsightFace cosine similarity. Configurable threshold.

FACE_MATCH_THRESHOLD:
    Default is 0.50. This must be calibrated against the specific
    InsightFace model and your test data. A threshold of 0.50 is a
    reasonable starting point for buffalo_l, but should not be treated
    as universally correct.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from .face_service import compare_embeddings, generate_embedding_from_array
from .image_downloader import download_candidate, load_image_as_array
from .models import Candidate, VerifiedCandidate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

FACE_MATCH_THRESHOLD: float = float(os.environ.get("FACE_MATCH_THRESHOLD", "0.50"))
HIGH_CONFIDENCE_THRESHOLD: float = float(
    os.environ.get("HIGH_CONFIDENCE_THRESHOLD", "0.80")
)


def verify_candidate(
    candidate: Candidate,
    input_embedding: list[float],
) -> VerifiedCandidate:
    """
    Download (if needed) and verify a single candidate against the input face.

    Returns a VerifiedCandidate with similarity, face_count, and status.
    """
    # Ensure image is downloaded
    if not candidate.downloaded or not candidate.local_path:
        candidate = download_candidate(candidate)

    if not candidate.downloaded or not candidate.local_path:
        return VerifiedCandidate(
            candidate=candidate,
            similarity=0.0,
            face_count=0,
            status="NO_IMAGE",
        )

    img = load_image_as_array(candidate.local_path)
    if img is None:
        return VerifiedCandidate(
            candidate=candidate,
            similarity=0.0,
            face_count=0,
            status="LOAD_ERROR",
        )

    result = generate_embedding_from_array(img)

    if not result.detected or not result.embedding:
        return VerifiedCandidate(
            candidate=candidate,
            similarity=0.0,
            face_count=result.face_count,
            status="NO_FACE",
        )

    sim = compare_embeddings(input_embedding, result.embedding)
    status = "MATCH" if sim >= FACE_MATCH_THRESHOLD else "REJECTED"

    logger.info(
        f"Candidate #{candidate.id} ({candidate.source}): "
        f"similarity={sim:.4f} status={status}"
    )

    return VerifiedCandidate(
        candidate=candidate,
        similarity=round(sim, 4),
        face_count=result.face_count,
        status=status,
    )


def find_best_match(
    candidates: list[Candidate],
    input_embedding: list[float],
    max_candidates: int = 20,
    stop_early: bool = True,
) -> tuple[Optional[VerifiedCandidate], list[VerifiedCandidate]]:
    """
    Process up to max_candidates and return the best matching one.

    Args:
        candidates:       filtered list from candidate_filter
        input_embedding:  face embedding from the input image
        max_candidates:   max candidates to process
        stop_early:       if True, stop as soon as a HIGH_CONFIDENCE match is found

    Returns:
        (best_match, all_verified) where best_match is None if nothing crosses threshold.
    """
    verified: list[VerifiedCandidate] = []

    for candidate in candidates[:max_candidates]:
        vc = verify_candidate(candidate, input_embedding)
        verified.append(vc)

        # Early stop on very high confidence
        if stop_early and vc.similarity >= HIGH_CONFIDENCE_THRESHOLD:
            logger.info(
                f"High-confidence match found early (similarity={vc.similarity:.4f}), stopping."
            )
            break

    if not verified:
        return None, []

    # Sort by similarity descending
    verified.sort(key=lambda v: v.similarity, reverse=True)

    best = verified[0]
    if best.similarity >= FACE_MATCH_THRESHOLD:
        return best, verified
    return None, verified
