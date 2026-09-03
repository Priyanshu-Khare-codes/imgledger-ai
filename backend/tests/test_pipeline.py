"""
Tests for HH Goa Task 3 pipeline components.

Tests cover:
    - SHA-256 generation
    - Canonical payload determinism
    - Blockchain block validation
    - URL/domain classification
    - Cosine similarity
    - No-face handling (via mock)
"""
from __future__ import annotations

import hashlib
import json
import sys
import os

# Allow importing from parent
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest


# ---------------------------------------------------------------------------
# 1. SHA-256 generation
# ---------------------------------------------------------------------------

class TestSha256:
    def test_basic_hash(self):
        from src.blockchain import sha256_of
        result = sha256_of("hello world")
        expected = hashlib.sha256("hello world".encode()).hexdigest()
        assert result == expected

    def test_empty_string(self):
        from src.blockchain import sha256_of
        result = sha256_of("")
        assert len(result) == 64
        assert result == hashlib.sha256(b"").hexdigest()

    def test_bytes_hash(self):
        from src.blockchain import sha256_bytes
        data = b"\xff\xd8\xff\xe0test"
        result = sha256_bytes(data)
        assert result == hashlib.sha256(data).hexdigest()


# ---------------------------------------------------------------------------
# 2. Canonical payload determinism
# ---------------------------------------------------------------------------

class TestCanonicalPayload:
    def test_sort_keys(self):
        from src.blockchain import canonical_json, compute_payload_hash
        payload1 = {"b": 2, "a": 1, "c": 3}
        payload2 = {"c": 3, "a": 1, "b": 2}
        assert canonical_json(payload1) == canonical_json(payload2)

    def test_hash_determinism(self):
        from src.blockchain import compute_payload_hash
        payload = {"url": "https://example.com", "title": "Test", "source": "web"}
        h1 = compute_payload_hash(payload)
        h2 = compute_payload_hash(payload)
        assert h1 == h2
        assert len(h1) == 64

    def test_different_payloads_different_hashes(self):
        from src.blockchain import compute_payload_hash
        h1 = compute_payload_hash({"url": "https://a.com"})
        h2 = compute_payload_hash({"url": "https://b.com"})
        assert h1 != h2

    def test_canonical_json_format(self):
        from src.blockchain import canonical_json
        result = canonical_json({"b": 2, "a": 1})
        # Must be compact (no spaces) and sorted
        assert result == '{"a":1,"b":2}'


# ---------------------------------------------------------------------------
# 3. Blockchain block validation
# ---------------------------------------------------------------------------

class TestBlockchain:
    def test_store_and_retrieve(self, tmp_path, monkeypatch):
        import src.blockchain as bc
        # Redirect chain to temp dir
        monkeypatch.setattr(bc, "CHAIN_DIR", tmp_path)
        monkeypatch.setattr(bc, "CHAIN_FILE", tmp_path / "chain.json")

        payload = {"url": "https://example.com/post/123", "title": "Test post"}
        record = bc.store_record(payload)

        assert record.record_id
        assert len(record.data_hash) == 64
        assert record.block_index >= 1

        retrieved = bc.get_record(record.record_id)
        assert retrieved is not None
        assert retrieved.data_hash == record.data_hash

    def test_verify_clean_record(self, tmp_path, monkeypatch):
        import src.blockchain as bc
        monkeypatch.setattr(bc, "CHAIN_DIR", tmp_path)
        monkeypatch.setattr(bc, "CHAIN_FILE", tmp_path / "chain.json")

        payload = {"url": "https://example.com", "title": "clean"}
        record = bc.store_record(payload)
        result = bc.verify_record(record.record_id)
        assert result.verified is True
        assert result.stored_hash == result.current_hash

    def test_chain_validation(self, tmp_path, monkeypatch):
        import src.blockchain as bc
        monkeypatch.setattr(bc, "CHAIN_DIR", tmp_path)
        monkeypatch.setattr(bc, "CHAIN_FILE", tmp_path / "chain.json")

        for i in range(3):
            bc.store_record({"n": i})

        valid, msg = bc.validate_chain()
        assert valid is True

    def test_tampered_payload_detected(self, tmp_path, monkeypatch):
        """Modifying the stored payload must produce a different hash."""
        import src.blockchain as bc
        monkeypatch.setattr(bc, "CHAIN_DIR", tmp_path)
        chain_file = tmp_path / "chain.json"
        monkeypatch.setattr(bc, "CHAIN_FILE", chain_file)

        payload = {"url": "https://example.com", "title": "original"}
        record = bc.store_record(payload)

        # Tamper: directly modify the chain file
        with open(chain_file) as f:
            chain = json.load(f)
        for block in chain:
            if block.get("record_id") == record.record_id:
                block["payload"]["title"] = "TAMPERED"
        with open(chain_file, "w") as f:
            json.dump(chain, f)

        result = bc.verify_record(record.record_id)
        assert result.verified is False

    def test_missing_record_raises(self, tmp_path, monkeypatch):
        import src.blockchain as bc
        monkeypatch.setattr(bc, "CHAIN_DIR", tmp_path)
        monkeypatch.setattr(bc, "CHAIN_FILE", tmp_path / "chain.json")

        with pytest.raises(ValueError, match="No blockchain record"):
            bc.verify_record("nonexistent-id")


# ---------------------------------------------------------------------------
# 4. URL / domain filtering
# ---------------------------------------------------------------------------

class TestCandidateFilter:
    def test_classify_instagram(self):
        from src.candidate_filter import classify_domain
        assert classify_domain("https://www.instagram.com/p/abc123") == "Instagram"

    def test_classify_youtube(self):
        from src.candidate_filter import classify_domain
        assert classify_domain("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "YouTube"

    def test_classify_youtu_be(self):
        from src.candidate_filter import classify_domain
        assert classify_domain("https://youtu.be/dQw4w9WgXcQ") == "YouTube"

    def test_classify_x(self):
        from src.candidate_filter import classify_domain
        assert classify_domain("https://x.com/elonmusk/status/1234") == "X (Twitter)"

    def test_classify_linkedin(self):
        from src.candidate_filter import classify_domain
        assert classify_domain("https://www.linkedin.com/in/someone") == "LinkedIn"

    def test_classify_unknown(self):
        from src.candidate_filter import classify_domain
        result = classify_domain("https://randomsite.example.org/page")
        assert "randomsite.example.org" in result or result == "Web"

    def test_youtube_content_url(self):
        from src.candidate_filter import is_youtube_content_url
        assert is_youtube_content_url("https://www.youtube.com/watch?v=abc") is True
        assert is_youtube_content_url("https://www.youtube.com/shorts/xyz") is True

    def test_youtube_profile_only(self):
        from src.candidate_filter import is_youtube_profile_only
        assert is_youtube_profile_only("https://www.youtube.com/@username") is True
        assert is_youtube_profile_only("https://www.youtube.com/channel/UCxxx") is True
        # Content URL is NOT profile-only
        assert is_youtube_profile_only("https://www.youtube.com/watch?v=abc") is False

    def test_deduplication(self):
        from src.candidate_filter import filter_candidates
        from src.models import Candidate

        c1 = Candidate(id=0, image_url="https://img.example.com/a.jpg", url="https://a.com")
        c2 = Candidate(id=1, image_url="https://img.example.com/a.jpg", url="https://b.com")  # dup
        c3 = Candidate(id=2, image_url="https://img.example.com/b.jpg", url="https://c.com")

        result = filter_candidates([c1, c2, c3], max_candidates=10)
        image_urls = [c.image_url for c in result]
        assert len(image_urls) == len(set(image_urls)), "Duplicates not removed"


# ---------------------------------------------------------------------------
# 5. Cosine similarity
# ---------------------------------------------------------------------------

class TestCosineSimilarity:
    def test_identical_embeddings(self):
        from src.face_service import compare_embeddings
        e = [0.1, 0.2, 0.3, 0.4]
        sim = compare_embeddings(e, e)
        assert abs(sim - 1.0) < 1e-5

    def test_opposite_embeddings(self):
        from src.face_service import compare_embeddings
        e1 = [1.0, 0.0]
        e2 = [-1.0, 0.0]
        sim = compare_embeddings(e1, e2)
        assert abs(sim - (-1.0)) < 1e-5

    def test_orthogonal_embeddings(self):
        from src.face_service import compare_embeddings
        sim = compare_embeddings([1.0, 0.0], [0.0, 1.0])
        assert abs(sim) < 1e-5

    def test_empty_embeddings(self):
        from src.face_service import compare_embeddings
        assert compare_embeddings([], []) == 0.0
        assert compare_embeddings([1.0], []) == 0.0


# ---------------------------------------------------------------------------
# 6. No-face handling (via mock/invalid image)
# ---------------------------------------------------------------------------

class TestNoFaceHandling:
    def test_nonexistent_image(self):
        from src.face_service import detect_face
        result = detect_face("/nonexistent/path/to/image.jpg")
        assert result.detected is False
        assert result.face_count == 0
        assert "not found" in (result.error or "").lower() or result.error is not None

    def test_empty_embedding_returns_zero_similarity(self):
        from src.face_service import compare_embeddings
        assert compare_embeddings([], [1.0, 0.0, 0.0]) == 0.0
