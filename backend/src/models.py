"""
Shared Pydantic models for the HH Goa Task 3 pipeline.
"""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Face
# ---------------------------------------------------------------------------

class FaceDetectionResult(BaseModel):
    detected: bool
    face_count: int
    embedding: Optional[list[float]] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Candidate (from reverse image search / download)
# ---------------------------------------------------------------------------

class Candidate(BaseModel):
    id: int
    title: str = ""
    source: str = ""          # domain
    url: str = ""             # page URL
    thumbnail: str = ""
    image_url: str = ""       # direct image URL
    description: str = ""
    local_path: Optional[str] = None
    downloaded: bool = False


class VerifiedCandidate(BaseModel):
    candidate: Candidate
    similarity: float
    face_count: int
    status: str                # "MATCH" | "REJECTED" | "NO_FACE"


# ---------------------------------------------------------------------------
# Blockchain
# ---------------------------------------------------------------------------

class BlockchainRecord(BaseModel):
    record_id: str
    block_index: int
    timestamp: str
    previous_hash: str
    data_hash: str            # SHA-256 of canonical payload
    block_hash: str           # hash of entire block
    payload: dict[str, Any]


class VerificationResult(BaseModel):
    record_id: str
    stored_hash: str
    current_hash: str
    verified: bool


# ---------------------------------------------------------------------------
# Pipeline result
# ---------------------------------------------------------------------------

class PipelineResult(BaseModel):
    # Face
    face_detected: bool
    face_count: int

    # Search
    search_results_count: int
    candidates_processed: int

    # Best match
    match_found: bool
    match: Optional[VerifiedCandidate] = None

    # Blockchain
    blockchain_record: Optional[BlockchainRecord] = None
    verification: Optional[VerificationResult] = None

    # Errors / warnings
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# API request/response
# ---------------------------------------------------------------------------

class SearchResponse(BaseModel):
    success: bool
    pipeline: PipelineResult
    message: str = ""


class RecordResponse(BaseModel):
    success: bool
    record: Optional[BlockchainRecord] = None
    message: str = ""


class VerifyResponse(BaseModel):
    success: bool
    verification: Optional[VerificationResult] = None
    message: str = ""
