"""
Face detection and embedding service using InsightFace + ONNX Runtime.

Provides:
    detect_face(image_path)         -> FaceDetectionResult
    generate_embedding(image_path)  -> FaceDetectionResult
    compare_embeddings(e1, e2)      -> float (cosine similarity)
"""
from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from .models import FaceDetectionResult

logger = logging.getLogger(__name__)

# Lazy-load InsightFace app to avoid slow startup unless needed
_app = None
_model_name = os.environ.get("INSIGHTFACE_MODEL", "buffalo_l")


def _get_app():
    """Lazy-initialize the InsightFace FaceAnalysis app."""
    global _app
    if _app is None:
        try:
            import insightface
            from insightface.app import FaceAnalysis

            # Models auto-download to ~/.insightface/models/
            _app = FaceAnalysis(name=_model_name, providers=["CPUExecutionProvider"])
            _app.prepare(ctx_id=0, det_size=(640, 640))
            logger.info(f"InsightFace model '{_model_name}' loaded successfully.")
        except Exception as exc:
            raise RuntimeError(
                f"Failed to initialize InsightFace: {exc}\n"
                "Ensure insightface and onnxruntime are installed in this virtualenv."
            ) from exc
    return _app


def _load_image(image_path: str) -> Optional[np.ndarray]:
    """Load an image from disk and return as a BGR numpy array."""
    path = Path(image_path)
    if not path.exists():
        return None
    img = cv2.imread(str(path))
    return img  # may be None if cv2 can't decode


def detect_face(image_path: str) -> FaceDetectionResult:
    """
    Detect faces in an image.

    Returns FaceDetectionResult with face count and optional embedding
    for the primary (largest) face.
    """
    img = _load_image(image_path)
    if img is None:
        return FaceDetectionResult(
            detected=False,
            face_count=0,
            error=f"Could not load image: {image_path}",
        )

    try:
        app = _get_app()
    except RuntimeError as exc:
        return FaceDetectionResult(detected=False, face_count=0, error=str(exc))

    try:
        faces = app.get(img)
    except Exception as exc:
        return FaceDetectionResult(
            detected=False,
            face_count=0,
            error=f"InsightFace detection error: {exc}",
        )

    if not faces:
        return FaceDetectionResult(
            detected=False,
            face_count=0,
            error="No face detected in image.",
        )

    # Select the face with the largest bounding box area
    def bbox_area(face):
        x1, y1, x2, y2 = face.bbox
        return abs((x2 - x1) * (y2 - y1))

    primary = max(faces, key=bbox_area)
    embedding = primary.normed_embedding.tolist()

    return FaceDetectionResult(
        detected=True,
        face_count=len(faces),
        embedding=embedding,
    )


def generate_embedding(image_path: str) -> FaceDetectionResult:
    """
    Generate a normalized face embedding for the primary face in the image.

    This is a convenience wrapper around detect_face() for clarity.
    """
    return detect_face(image_path)


def generate_embedding_from_array(img: np.ndarray) -> FaceDetectionResult:
    """
    Generate a face embedding from an already-loaded BGR numpy array.
    Used for candidate images downloaded as bytes.
    """
    if img is None or img.size == 0:
        return FaceDetectionResult(
            detected=False,
            face_count=0,
            error="Empty or invalid image array.",
        )

    try:
        app = _get_app()
    except RuntimeError as exc:
        return FaceDetectionResult(detected=False, face_count=0, error=str(exc))

    try:
        faces = app.get(img)
    except Exception as exc:
        return FaceDetectionResult(
            detected=False,
            face_count=0,
            error=f"InsightFace detection error: {exc}",
        )

    if not faces:
        return FaceDetectionResult(detected=False, face_count=0, error="No face detected.")

    def bbox_area(face):
        x1, y1, x2, y2 = face.bbox
        return abs((x2 - x1) * (y2 - y1))

    primary = max(faces, key=bbox_area)
    embedding = primary.normed_embedding.tolist()

    return FaceDetectionResult(
        detected=True,
        face_count=len(faces),
        embedding=embedding,
    )


def compare_embeddings(
    embedding1: list[float],
    embedding2: list[float],
) -> float:
    """
    Compute cosine similarity between two face embeddings.

    Both embeddings are expected to be unit-normalized (InsightFace default).
    Returns a float in [-1, 1]; higher means more similar.
    """
    if not embedding1 or not embedding2:
        return 0.0
    e1 = np.array(embedding1, dtype=np.float32)
    e2 = np.array(embedding2, dtype=np.float32)

    # Normalize just in case
    norm1 = np.linalg.norm(e1)
    norm2 = np.linalg.norm(e2)
    if norm1 == 0 or norm2 == 0:
        return 0.0

    e1 = e1 / norm1
    e2 = e2 / norm2
    return float(np.dot(e1, e2))
