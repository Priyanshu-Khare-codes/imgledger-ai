# 🔍 ImgLedger AI — Face Identification & Blockchain Verification

> **Biometric Identification & Cryptographic Blockchain Ledger Engine**

An end-to-end multi-stage pipeline that takes a face image as input and:
1. Detects the face & generates a 512-D biometric embedding (InsightFace ArcFace)
2. Submits it to Yandex reverse image search (PicImageSearch)
3. Downloads & verifies candidate faces via cosine similarity
4. Stores a SHA-256 fingerprint on a tamper-evident local blockchain

---

## 🏗 Pipeline Flow

```
Input Image (face photo)
        ↓
Face Detection + Embedding       ← InsightFace buffalo_l (ArcFace)
        ↓
Reverse Image Search             ← Yandex via PicImageSearch
        ↓
Candidate Filtering              ← domain classification, deduplication
        ↓
Candidate Image Download         ← httpx, local cache
        ↓
Face Similarity Verification     ← cosine similarity (InsightFace)
        ↓
Select Best Match
        ↓
Generate SHA-256 Fingerprint     ← canonical JSON → SHA-256
        ↓
Store on Blockchain              ← linked block chain (local)
        ↓
Verify Record                    ← recompute + compare hashes
```

---

## 📁 Project Structure

```
image-search-web/
│
├── backend/                     # Python / FastAPI
│   ├── src/
│   │   ├── models.py            # Pydantic data models
│   │   ├── face_service.py      # InsightFace — detect + embed + compare
│   │   ├── reverse_search.py    # Yandex reverse image search
│   │   ├── candidate_filter.py  # Domain classification, dedup
│   │   ├── image_downloader.py  # Download + cache candidate images
│   │   ├── matcher.py           # Face similarity verification
│   │   ├── blockchain.py        # Linked blockchain with SHA-256
│   │   └── pipeline.py          # End-to-end orchestrator
│   ├── tests/
│   │   └── test_pipeline.py     # 27 unit tests (all passing)
│   ├── data/
│   │   ├── input/               # Input image test directory
│   │   ├── candidates/          # Downloaded candidate images (gitignored)
│   │   └── records/             # chain.json (blockchain storage)
│   ├── api.py                   # FastAPI server
│   ├── main.py                  # CLI entry point
│   ├── pyproject.toml
│   ├── .env.example
│   └── README.md                # Detailed backend documentation
│
├── frontend/                    # Next.js 16 + Tailwind CSS
│   ├── app/
│   │   ├── components/
│   │   │   ├── ImageUpload.tsx          # Drag-and-drop upload dropzone
│   │   │   ├── ProcessingVisualizer.tsx # Live HUD target scanner & telemetry
│   │   │   ├── PipelineStatus.tsx       # Compact 6-step progress status list
│   │   │   ├── MatchResult.tsx          # Verified match card with confidence bar
│   │   │   ├── BlockchainCard.tsx       # SHA-256 block record & verify button
│   │   │   ├── PipelineArchitecture.tsx # Deep-dive technical specifications
│   │   │   ├── BlockchainExplorer.tsx   # Live chain explorer & tamper-evident validator
│   │   │   └── ErrorCard.tsx
│   │   ├── page.tsx             # Main page entry point
│   │   ├── types.ts             # TypeScript data contracts
│   │   └── api-client.ts        # Backend API client
│   ├── next.config.ts
│   ├── .env.example
│   └── README.md                # Detailed frontend documentation
│
└── start_dev.bat                # One-click script: launches backend + frontend
```

---

## ⚡ Quick Start

### 1. Backend Setup

```powershell
cd backend

# Create virtualenv
uv venv

# Install all packages
uv pip install --python .venv/Scripts/python.exe `
  PicImageSearch onnxruntime opencv-python-headless numpy Pillow `
  aiofiles fastapi uvicorn python-multipart python-dotenv `
  rich httpx pyquery lxml pytest pytest-asyncio
```

**InsightFace (Python 3.13 — prebuilt wheel required):**
```powershell
# Download the wheel
Invoke-WebRequest `
  -Uri "https://github.com/Gourieff/Assets/raw/main/Insightface/insightface-0.7.3-cp313-cp313-win_amd64.whl" `
  -OutFile "insightface-0.7.3-cp313-cp313-win_amd64.whl"

# Install
uv pip install --python .venv/Scripts/python.exe insightface-0.7.3-cp313-cp313-win_amd64.whl
```

```powershell
# Copy env file
Copy-Item .env.example .env
```

### 2. Frontend Setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
```

### 3. Start Everything

```powershell
# From root — opens both servers in separate windows
.\start_dev.bat

# OR manually:
# Terminal 1
cd backend && .venv\Scripts\python.exe -m uvicorn api:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:8000         |
| API Docs | http://localhost:8000/docs    |

---

## 💻 CLI Usage

```powershell
cd backend
.venv\Scripts\activate

# Run full pipeline on an image
python main.py search data/input/your_photo.jpg

# Verify a stored blockchain record
python main.py verify <record-id>

# Check blockchain chain integrity
python main.py chain

# Start API server
python main.py serve
```

### Example CLI Output

```
┌──────────────────────────────────────────────┐
│  IMGLEDGER AI IDENTIFICATION PIPELINE        │
│  Face Identification & Blockchain Verification│
└──────────────────────────────────────────────┘

[[1/6]] Loading face image...
      Face detected OK  (count=1)

[[2/6]] Generating face embedding...
      Embedding generated OK

[[3/6]] Searching web using Yandex...
      142 candidates found OK

[[4/6]] Filtering / downloading candidates...
      20 candidates processed

[[5/6]] Verifying candidate faces...
      Best match: YouTube
      Similarity: 0.8934
      Face match: YES

[[6/6]] Creating blockchain record...
      SHA-256: 3f4a2b1c8e9d...
      Blockchain record created OK

┌──────────────────────────────────────────┐
│  MATCHING CONTENT FOUND                  │
│  Platform  : YouTube                     │
│  Similarity: 0.8934                      │
│  Face Match: YES                         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  BLOCKCHAIN RECORD                       │
│  Block #   : 3                           │
│  SHA-256   : 3f4a2b1c8e9d...            │
│  Verified  : VERIFIED                    │
└──────────────────────────────────────────┘
```

---

## 📡 API Reference

| Method | Endpoint                    | Description                              |
|--------|-----------------------------|------------------------------------------|
| `POST` | `/api/search`               | Upload face image → run full pipeline    |
| `GET`  | `/api/records/{id}`         | Retrieve a stored blockchain record      |
| `POST` | `/api/verify/{id}`          | Recompute hash → verify against chain    |
| `GET`  | `/api/health`               | Health check + chain integrity status    |

Interactive docs at **http://localhost:8000/docs**

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable                    | Default      | Description                                      |
|-----------------------------|--------------|--------------------------------------------------|
| `INSIGHTFACE_MODEL`         | `buffalo_l`  | InsightFace model name                           |
| `FACE_MATCH_THRESHOLD`      | `0.50`       | Minimum cosine similarity to count as a match    |
| `HIGH_CONFIDENCE_THRESHOLD` | `0.80`       | Similarity to trigger early stop                 |
| `MAX_CANDIDATES`            | `20`         | Max candidates to process from search results    |

### Frontend (`frontend/.env.local`)

| Variable               | Default                 | Description        |
|------------------------|-------------------------|--------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8000` | Backend base URL   |

---

## 🧪 Running Tests

```powershell
cd backend
.venv\Scripts\python.exe -m pytest tests/ -v
```

**27 tests — all passing:**

| Category              | Tests |
|-----------------------|-------|
| SHA-256 hashing       | 3     |
| Canonical payload     | 4     |
| Blockchain            | 5     |
| URL classification    | 8     |
| Cosine similarity     | 4     |
| No-face handling      | 2     |
| **Total**             | **27**|

---

## 🛠 Tech Stack

| Component         | Technology                                |
|-------------------|-------------------------------------------|
| Face Detection    | InsightFace 0.7.3 + ONNX Runtime         |
| Face Model        | buffalo_l (ArcFace ResNet-50)             |
| Reverse Search    | PicImageSearch + Yandex                   |
| Candidate Fetch   | httpx (async-capable)                     |
| Backend API       | FastAPI + Uvicorn                         |
| Blockchain        | Local SHA-256 linked chain (chain.json)   |
| Frontend          | Next.js 16 + Tailwind CSS                 |
| Package Manager   | uv (backend) + npm (frontend)             |
| Python Version    | 3.13                                      |
