# 🎨 ImgLedger AI — Frontend Application

> **Next.js 16 + Tailwind CSS + Framer Motion Interface**

This directory contains the modern, dark-cybernetic frontend application for the **ImgLedger AI** Biometric Face Identification and Blockchain Verification system.

---

## ⚡ Features

- **Obsidian Dark Aesthetic**: Ultra-dark theme (`#08090c`) with vibrant neon accents (**Neon Cyan**, **Electric Pink**, **Emerald Green**).
- **Holographic HUD Processing Visualizer**: Real-time biometric target scanner HUD, sweeping laser line, and streaming live time-stamped telemetry logs during pipeline execution.
- **Dynamic 6-Stage Telemetry Node Bar**: Visual stage node progress tracker that highlights active stages and updates status in real-time.
- **Interactive Architecture Specs**: Deep-dive technical view outlining all 6 pipeline stages, mathematical formulas (Cosine similarity $e_1 \cdot e_2$), Python code snippets, and system decoupling specs.
- **Blockchain Explorer**: Real-time local chain inspector showing genesis block, linked SHA-256 block height, payload hashes, and one-click cryptographic tamper verification.
- **100% Mobile Responsive**: Fully responsive layout optimized for mobile, tablet, and desktop screens with custom dark obsidian scrollbars.

---

## 📁 Directory Structure

```
frontend/
├── app/
│   ├── components/
│   │   ├── Navbar.tsx               # Top header with status pills & navigation
│   │   ├── ImageUpload.tsx          # Drag-and-drop image upload dropzone
│   │   ├── ProcessingVisualizer.tsx # Live HUD target scanner & telemetry logs
│   │   ├── PipelineStatus.tsx       # Compact 6-step progress status list
│   │   ├── MatchResult.tsx          # Verified match result card with confidence bar
│   │   ├── BlockchainCard.tsx       # SHA-256 block record & verification button
│   │   ├── PipelineArchitecture.tsx # Deep-dive technical specifications & diagrams
│   │   ├── BlockchainExplorer.tsx   # Live chain explorer & tamper-evident validator
│   │   └── ErrorCard.tsx            # Styled error & warning notification cards
│   ├── api-client.ts                # Axios/fetch client connecting to FastAPI backend
│   ├── types.ts                     # TypeScript interfaces & data contracts
│   ├── page.tsx                     # Main application entry point & tab manager
│   ├── layout.tsx                   # Root layout, metadata & fonts
│   ├── globals.css                  # Modern CSS design system & scrollbar tokens
│   └── icon.png                     # Custom biometric app icon / favicon
├── public/
│   ├── hero_3d_swirl.png            # 3D Iridescent hero artwork
│   └── icon.png                     # Favicon asset
├── next.config.ts                   # Next.js configuration
├── package.json                     # Node dependencies & scripts
├── .env.example                     # Environment variables template
└── README.md                        # Frontend documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** / **yarn**

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create `.env.local` in the `frontend` root:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the FastAPI Python Backend |

---

## 🛠️ Build & Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🎨 Design Tokens & UI Architecture

- **Primary Background**: Obsidian Black (`#08090c`)
- **Card Container**: Matte Glass Card (`#0f1118`) with `border-white/10`
- **Neon Accents**:
  - **Neon Cyan**: `#00f0ff` (Embeddings & Active Scans)
  - **Electric Pink**: `#ff2a85` (Detection & Hero Accents)
  - **Emerald Green**: `#10b981` (Verified Matches & Blockchain Proofs)
  - **Vivid Purple**: `#9d4edd` (Domain Filtering & Architecture)
- **Typography**: *Plus Jakarta Sans* (UI & Headings) + *JetBrains Mono* (Hashes & Telemetry Logs)
