"""
Local simulated blockchain for tamper-evident record storage.

This is NOT a mere JSON file. It implements an actual linked-block chain:

    Block N:
        index          - sequential block number
        timestamp      - ISO 8601 UTC timestamp
        previous_hash  - SHA-256 hash of the previous block
        data_hash      - SHA-256 of the canonical payload
        payload        - the stored metadata dict
        block_hash     - SHA-256 of (index + timestamp + previous_hash + data_hash)

Chain validation walks every block and verifies:
    - previous_hash matches actual hash of prior block
    - block_hash matches recomputed hash of block fields

The chain is persisted to data/records/chain.json between runs.

Why local chain?
    A public testnet (Ethereum Sepolia, etc.) requires wallet credentials,
    gas, and network availability — introducing unnecessary friction for a demo.
    This local chain demonstrates the same tamper-evidence principles without
    external dependencies.
"""
from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from .models import BlockchainRecord, VerificationResult

logger = logging.getLogger(__name__)

CHAIN_DIR = Path(__file__).parent.parent / "data" / "records"
CHAIN_FILE = CHAIN_DIR / "chain.json"

# ---------------------------------------------------------------------------
# Hashing helpers
# ---------------------------------------------------------------------------

def canonical_json(payload: dict[str, Any]) -> str:
    """
    Deterministically serialize a dict to JSON for SHA-256 hashing.

    Uses sort_keys=True and compact separators to ensure the same bytes
    every time regardless of insertion order.
    """
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_of(text: str) -> str:
    """Return the hex SHA-256 digest of a UTF-8 string."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_bytes(data: bytes) -> str:
    """Return the hex SHA-256 digest of raw bytes."""
    return hashlib.sha256(data).hexdigest()


def compute_block_hash(
    index: int,
    timestamp: str,
    previous_hash: str,
    data_hash: str,
) -> str:
    """Compute the hash of a block's fixed fields."""
    content = f"{index}{timestamp}{previous_hash}{data_hash}"
    return sha256_of(content)


def compute_payload_hash(payload: dict[str, Any]) -> str:
    """
    Compute the canonical SHA-256 of a payload dict.

    The payload should NOT include any timestamps that change on each run,
    otherwise re-verification will always fail.
    """
    return sha256_of(canonical_json(payload))


# ---------------------------------------------------------------------------
# Chain I/O
# ---------------------------------------------------------------------------

def _load_chain() -> list[dict[str, Any]]:
    CHAIN_DIR.mkdir(parents=True, exist_ok=True)
    if not CHAIN_FILE.exists():
        return []
    try:
        with open(CHAIN_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error(f"Failed to load chain: {exc}")
        return []


def _save_chain(chain: list[dict[str, Any]]) -> None:
    CHAIN_DIR.mkdir(parents=True, exist_ok=True)
    with open(CHAIN_FILE, "w", encoding="utf-8") as f:
        json.dump(chain, f, indent=2, ensure_ascii=False)


def _genesis_block() -> dict[str, Any]:
    """Create the genesis (first) block with zeroed hashes."""
    ts = datetime.now(timezone.utc).isoformat()
    b_hash = compute_block_hash(0, ts, "0" * 64, "0" * 64)
    return {
        "record_id": "genesis",
        "index": 0,
        "timestamp": ts,
        "previous_hash": "0" * 64,
        "data_hash": "0" * 64,
        "block_hash": b_hash,
        "payload": {},
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def store_record(
    payload: dict[str, Any],
    image_bytes: Optional[bytes] = None,
) -> BlockchainRecord:
    """
    Create a canonical fingerprint of the payload and store it on the chain.

    Args:
        payload:      dict of discoverable metadata (url, title, source, etc.)
                      Do NOT include timestamps in this dict if you want
                      stable re-verification.
        image_bytes:  optional raw bytes of the downloaded candidate image;
                      if provided, its SHA-256 is included in the payload hash.

    Returns:
        BlockchainRecord with all block fields.
    """
    chain = _load_chain()

    # Ensure genesis block exists
    if not chain:
        chain.append(_genesis_block())

    # Build canonical payload (add image_sha256 if image bytes available)
    canonical_payload = dict(payload)
    if image_bytes:
        canonical_payload["image_sha256"] = sha256_bytes(image_bytes)

    data_hash = compute_payload_hash(canonical_payload)
    previous_block = chain[-1]
    previous_hash = previous_block["block_hash"]
    index = previous_block["index"] + 1
    timestamp = datetime.now(timezone.utc).isoformat()
    block_hash = compute_block_hash(index, timestamp, previous_hash, data_hash)
    record_id = str(uuid.uuid4())

    block = {
        "record_id": record_id,
        "index": index,
        "timestamp": timestamp,
        "previous_hash": previous_hash,
        "data_hash": data_hash,
        "block_hash": block_hash,
        "payload": canonical_payload,
    }

    chain.append(block)
    _save_chain(chain)

    logger.info(f"Blockchain: stored record {record_id} at block #{index}")

    return BlockchainRecord(
        record_id=record_id,
        block_index=index,
        timestamp=timestamp,
        previous_hash=previous_hash,
        data_hash=data_hash,
        block_hash=block_hash,
        payload=canonical_payload,
    )


def get_record(record_id: str) -> Optional[BlockchainRecord]:
    """
    Retrieve a blockchain record by record_id.

    Returns None if the record does not exist.
    """
    chain = _load_chain()
    for block in chain:
        if block.get("record_id") == record_id:
            return BlockchainRecord(
                record_id=block["record_id"],
                block_index=block["index"],
                timestamp=block["timestamp"],
                previous_hash=block["previous_hash"],
                data_hash=block["data_hash"],
                block_hash=block["block_hash"],
                payload=block.get("payload", {}),
            )
    return None


def verify_record(record_id: str) -> VerificationResult:
    """
    Retrieve a blockchain record, recompute the payload hash, and compare.

    The stored hash is the SHA-256 of the canonical payload at the time of
    storage. Recomputing it from the stored payload must yield the same hash
    if the data has not been tampered with.

    Returns VerificationResult with verified=True (VERIFIED) or False (TAMPERED).
    """
    record = get_record(record_id)
    if record is None:
        raise ValueError(f"No blockchain record found with id: {record_id}")

    # Recompute hash from stored payload
    current_hash = compute_payload_hash(record.payload)
    verified = current_hash == record.data_hash

    if not verified:
        logger.warning(
            f"TAMPERED: stored={record.data_hash[:16]}... current={current_hash[:16]}..."
        )

    return VerificationResult(
        record_id=record_id,
        stored_hash=record.data_hash,
        current_hash=current_hash,
        verified=verified,
    )


def validate_chain() -> tuple[bool, str]:
    """
    Walk the entire chain and validate block linkage.

    Returns (is_valid, message).
    """
    chain = _load_chain()
    if not chain:
        return True, "Empty chain."

    for i in range(1, len(chain)):
        prev = chain[i - 1]
        curr = chain[i]

        # Check previous_hash linkage
        if curr["previous_hash"] != prev["block_hash"]:
            return False, (
                f"Block #{i} previous_hash mismatch: "
                f"expected {prev['block_hash'][:16]}... "
                f"got {curr['previous_hash'][:16]}..."
            )

        # Recompute block_hash
        expected_hash = compute_block_hash(
            curr["index"],
            curr["timestamp"],
            curr["previous_hash"],
            curr["data_hash"],
        )
        if expected_hash != curr["block_hash"]:
            return False, f"Block #{i} block_hash tampered."

    return True, f"Chain valid: {len(chain)} blocks."
