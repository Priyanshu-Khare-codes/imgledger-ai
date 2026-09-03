"""
FastAPI backend for HH Goa Task 3: Face Identification & Blockchain Verification.

Endpoints:
    POST /api/search          - Upload image, run full pipeline
    GET  /api/records/{id}    - Retrieve a blockchain record
    POST /api/verify/{id}     - Recompute hash and verify against chain
    GET  /api/health          - Health check
"""
from __future__ import annotations

import logging
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.blockchain import get_record, validate_chain, verify_record
from src.models import PipelineResult, RecordResponse, SearchResponse, VerifyResponse
from src.pipeline import run_pipeline

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="HH Goa Task 3 — Face Identification & Blockchain Verification",
    version="1.0.0",
    description=(
        "End-to-end pipeline: face detection → reverse image search → "
        "candidate face verification → blockchain fingerprint storage."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    """Health check — also validates the local blockchain chain."""
    valid, msg = validate_chain()
    return {"status": "ok", "chain": msg, "valid": valid}


@app.post("/api/search", response_model=SearchResponse)
async def search(file: UploadFile = File(...)):
    """
    Upload a face image and run the complete pipeline.

    Accepts: image/jpeg, image/png, image/webp
    Returns: SearchResponse with full pipeline results.
    """
    # Validate content type
    allowed = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type and file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Upload a JPEG or PNG image.",
        )

    # Save upload to a temp file
    suffix = Path(file.filename or "upload.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    logger.info(f"Received upload: {file.filename} → {tmp_path}")

    try:
        result: PipelineResult = await run_pipeline(tmp_path)
    except Exception as exc:
        logger.exception("Pipeline error")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            Path(tmp_path).unlink(missing_ok=True)
        except Exception:
            pass

    success = result.match_found and result.blockchain_record is not None
    message = "Pipeline completed successfully." if success else (
        result.error or "No verified matching content found."
    )

    return SearchResponse(success=success, pipeline=result, message=message)


@app.get("/api/records/{record_id}", response_model=RecordResponse)
async def get_blockchain_record(record_id: str):
    """Retrieve a stored blockchain record by ID."""
    record = get_record(record_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"No blockchain record found with id: {record_id}",
        )
    return RecordResponse(success=True, record=record)


@app.post("/api/verify/{record_id}", response_model=VerifyResponse)
async def verify_blockchain_record(record_id: str):
    """
    Recompute the SHA-256 fingerprint and compare against the stored hash.

    Returns VERIFIED if hashes match, TAMPERED otherwise.
    """
    try:
        result = verify_record(record_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return VerifyResponse(
        success=result.verified,
        verification=result,
        message="VERIFIED" if result.verified else "TAMPERED",
    )
