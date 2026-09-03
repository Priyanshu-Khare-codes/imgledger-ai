# 🐍 ImgLedger AI — Backend API & Identification Pipeline

> **FastAPI + InsightFace (buffalo_l) + Yandex Reverse Search + SHA-256 Blockchain Ledger**

This directory contains the Python backend service, deep learning biometric pipeline, and tamper-evident local blockchain engine for **ImgLedger AI**.

---

## ⚡ Core Capabilities

1. **Biometric Face Detection**: Locates faces and extracts 512-dimensional normalized embeddings using **InsightFace ArcFace (ResNet-50 backbone)**.
2. **Reverse Web Search Discovery**: Queries global web indices via **PicImageSearch (Yandex Engine)** to discover potential online candidate URLs.
3. **Candidate Filtering & Deduplication**: Classifies root domain platforms (YouTube, Instagram, X) and downloads candidate media into a local cache.
4. **Deterministic Cosine Verification**: Evaluates cosine similarity $e_1 \cdot e_2$ between the target embedding and candidate face chips to confirm identity.
5. **SHA-256 Canonical Fingerprinting**: Deterministically serializes matching post metadata and image bytes into a canonical SHA-256 digest.
6. **Local Linked Blockchain**: Persists cryptographic blocks with `previous_hash` linkage and provides real-time verification and chain validation APIs.

---

## 🏗 Architecture

```
FRONTEND (Next.js)
      ↓ POST /api/search
BACKEND (FastAPI)
      ↓
[1] Face Detection + Embedding       ← InsightFace (buffalo_l model)
      ↓
[2] Reverse Image Search             ← Yandex via PicImageSearch
      ↓
[3] Candidate Filtering              ← domain classification, dedup
      ↓
[4] Candidate Image Download         ← httpx, local cache
      ↓
[5] Face Similarity Verification     ← InsightFace cosine similarity
      ↓
[6] SHA-256 Fingerprint              ← canonical JSON payload
      ↓
[7] Local Blockchain Storage         ← linked block chain
      ↓
[8] Verification                     ← recompute + compare hashes
      ↓
FRONTEND (result display)
```

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── models.py           # Pydantic data models & response schema
│   ├── face_service.py     # InsightFace detection & 512-D embedding generator
│   ├── reverse_search.py   # Yandex visual search via PicImageSearch
│   ├── candidate_filter.py # Domain classification & candidate deduplication
│   ├── image_downloader.py # Candidate media downloader & disk cache manager
│   ├── matcher.py          # ArcFace cosine similarity matrix evaluator
│   ├── blockchain.py       # Local linked block chain engine (SHA-256)
│   └── pipeline.py         # End-to-end multi-stage pipeline orchestrator
├── tests/
│   └── test_pipeline.py    # 27 unit tests (all passing)
├── data/
│   ├── candidates/         # Cached candidate media (gitignored)
│   └── records/            # chain.json persistent ledger
├── api.py                  # FastAPI REST server endpoints
├── main.py                 # CLI entry point for pipeline & chain verification
├── pyproject.toml          # Python project dependencies
├── .env.example            # Environment variables configuration template
└── README.md               # Backend documentation
```

---

## 🚀 Installation

### Prerequisites

- **Python**: 3.13 (or 3.10+)
- **uv** (recommended) or standard `pip`

```powershell
cd backend

# Create virtual environment
uv venv

# Install dependencies
uv pip install --python .venv/Scripts/python.exe PicImageSearch onnxruntime \
  opencv-python-headless numpy Pillow aiofiles fastapi uvicorn \
  python-multipart python-dotenv rich httpx pyquery lxml pytest pytest-asyncio

# Install InsightFace for Python 3.13 (prebuilt wheel)
uv pip install --python .venv/Scripts/python.exe insightface-0.7.3-cp313-cp313-win_amd64.whl
```

---

## 💻 Usage

### CLI Commands

```powershell
# Activate venv
.venv\Scripts\activate

# Run full identification pipeline on an image
python main.py search data/input/person.jpg

# Re-verify a stored blockchain record by ID
python main.py verify <record_id>

# Validate local chain integrity
python main.py chain

# Start API server
python main.py serve
```

### Starting FastAPI Server

```powershell
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation available at: **http://localhost:8000/docs**

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in `backend/`:

| Variable | Default | Description |
|---|---|---|
| `INSIGHTFACE_MODEL` | `buffalo_l` | InsightFace model backbone |
| `FACE_MATCH_THRESHOLD` | `0.50` | Minimum cosine similarity score for verification |
| `HIGH_CONFIDENCE_THRESHOLD` | `0.80` | Similarity threshold to trigger early stop |
| `MAX_CANDIDATES` | `20` | Maximum candidate images to download & verify |

---

## 🧪 Running Unit Tests

```powershell
cd backend
.venv\Scripts\python.exe -m pytest tests/ -v
```

All 27 unit tests pass:
- SHA-256 hashing & canonical JSON sorting
- Blockchain block linkage & tamper detection
- URL domain classification
- ArcFace Cosine similarity matrix evaluation
- No-face error handling
