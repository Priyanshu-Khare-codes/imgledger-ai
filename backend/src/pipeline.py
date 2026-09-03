"""
Complete end-to-end pipeline orchestrator.

Ties together:
    1. Face detection + embedding (InsightFace)
    2. Reverse image search (Yandex via PicImageSearch)
    3. Candidate filtering + download
    4. Face similarity verification
    5. SHA-256 fingerprinting + blockchain storage

Returns a PipelineResult suitable for both CLI and API use.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

from .blockchain import compute_payload_hash, store_record, verify_record
from .candidate_filter import filter_candidates
from .face_service import generate_embedding
from .image_downloader import CANDIDATES_DIR, download_candidate, load_image_as_array
from .matcher import FACE_MATCH_THRESHOLD, find_best_match
from .models import PipelineResult, VerifiedCandidate
from .reverse_search import search_image

logger = logging.getLogger(__name__)

MAX_CANDIDATES: int = int(os.environ.get("MAX_CANDIDATES", "20"))


async def run_pipeline(image_path: str) -> PipelineResult:
    """
    Execute the full identification pipeline for a given input image.

    Flow:
        Face detection → embedding → Yandex search → filter candidates
        → download images → face verification → blockchain fingerprint/store

    Returns PipelineResult (never raises — errors are captured in result.error).
    """

    # ------------------------------------------------------------------
    # Step 1: Face detection + embedding
    # ------------------------------------------------------------------
    logger.info(f"[1/6] Loading face image: {image_path}")
    face_result = generate_embedding(image_path)

    if not face_result.detected or not face_result.embedding:
        return PipelineResult(
            face_detected=False,
            face_count=face_result.face_count,
            search_results_count=0,
            candidates_processed=0,
            match_found=False,
            error=face_result.error or "No face detected.",
        )

    logger.info(
        f"[1/6] Face detected ✅  (count={face_result.face_count}, "
        f"embedding_dim={len(face_result.embedding)})"
    )

    # ------------------------------------------------------------------
    # Step 2: Reverse image search
    # ------------------------------------------------------------------
    logger.info("[2/6] Submitting image to Yandex reverse image search...")
    try:
        raw_candidates = await search_image(image_path)
    except Exception as exc:
        logger.error(f"Reverse search failed: {exc}")
        return PipelineResult(
            face_detected=True,
            face_count=face_result.face_count,
            search_results_count=0,
            candidates_processed=0,
            match_found=False,
            error=str(exc),
        )

    logger.info(f"[2/6] {len(raw_candidates)} candidates from Yandex ✅")

    # ------------------------------------------------------------------
    # Step 3: Filter + deduplicate candidates
    # ------------------------------------------------------------------
    logger.info(f"[3/6] Filtering candidates (max={MAX_CANDIDATES})...")
    filtered = filter_candidates(raw_candidates, max_candidates=MAX_CANDIDATES)
    logger.info(f"[3/6] {len(filtered)} usable candidates after filtering ✅")

    if not filtered:
        return PipelineResult(
            face_detected=True,
            face_count=face_result.face_count,
            search_results_count=len(raw_candidates),
            candidates_processed=0,
            match_found=False,
            error="No usable candidate images found after filtering.",
        )

    # ------------------------------------------------------------------
    # Step 4 + 5: Download images and verify faces
    # ------------------------------------------------------------------
    logger.info("[4/6] Downloading and verifying candidate faces...")

    best_match, all_verified = find_best_match(
        candidates=filtered,
        input_embedding=face_result.embedding,
        max_candidates=MAX_CANDIDATES,
        stop_early=True,
    )

    candidates_processed = len(all_verified)
    logger.info(f"[4/6] {candidates_processed} candidates verified ✅")

    if best_match:
        logger.info(
            f"[4/6] Best match: similarity={best_match.similarity:.4f} "
            f"source={best_match.candidate.source}"
        )
    else:
        logger.info("[4/6] No match found above threshold.")

    # ------------------------------------------------------------------
    # Step 6: Blockchain fingerprint
    # ------------------------------------------------------------------
    blockchain_record = None
    verification = None

    if best_match:
        logger.info("[5/6] Creating blockchain record...")

        # Build canonical payload — no changing timestamps
        candidate = best_match.candidate
        payload = {
            "url": candidate.url,
            "title": candidate.title,
            "source": candidate.source,
            "image_url": candidate.image_url or candidate.thumbnail,
        }

        # Load image bytes for image_sha256 if available
        image_bytes: Optional[bytes] = None
        if candidate.local_path:
            try:
                image_bytes = Path(candidate.local_path).read_bytes()
            except Exception:
                pass

        try:
            blockchain_record = store_record(payload, image_bytes=image_bytes)
            # Immediately verify to confirm storage
            verification = verify_record(blockchain_record.record_id)
            logger.info(
                f"[5/6] Blockchain record stored ✅  "
                f"id={blockchain_record.record_id[:8]}... "
                f"sha256={blockchain_record.data_hash[:16]}..."
            )
        except Exception as exc:
            logger.error(f"Blockchain store failed: {exc}")

    return PipelineResult(
        face_detected=True,
        face_count=face_result.face_count,
        search_results_count=len(raw_candidates),
        candidates_processed=candidates_processed,
        match_found=best_match is not None,
        match=best_match,
        blockchain_record=blockchain_record,
        verification=verification,
    )
