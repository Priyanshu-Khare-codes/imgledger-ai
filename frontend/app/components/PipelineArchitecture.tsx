'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  Cpu, 
  Globe, 
  Filter, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Lock,
  Code2
} from 'lucide-react';

interface StageDetail {
  id: number;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badge: string;
  description: string;
  inputs: string[];
  outputs: string[];
  techStack: string[];
  codeSnippet: string;
  mathFormula?: string;
  whyImportant: string;
}

const STAGES: StageDetail[] = [
  {
    id: 1,
    title: 'Face Detection & Alignment',
    subtitle: 'InsightFace SCRFD / RetinaFace',
    icon: Scan,
    color: '#ff2a85', // Electric Pink
    badge: 'STAGE 01',
    description: 'The uploaded image is preprocessed and fed into InsightFace (buffalo_l model). The SCRFD/RetinaFace detector locates facial bounding boxes and 5 key facial landmarks (eyes, nose tip, mouth corners) to rectify head rotation.',
    inputs: ['Raw Uploaded Image (JPEG / PNG / WEBP)'],
    outputs: ['Cropped Face Chip', 'Bounding Box Coordinates', '5 Facial Landmarks'],
    techStack: ['OpenCV (cv2)', 'InsightFace FaceAnalysis', 'ONNX Runtime CPU'],
    whyImportant: 'Proper face alignment ensures rotational invariance and significantly boosts embedding precision during vector matching.',
    codeSnippet: `from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
app.prepare(ctx_id=0, det_size=(640, 640))
faces = app.get(img)  # Detects faces & aligns landmarks`
  },
  {
    id: 2,
    title: '512-D Vector Embedding',
    subtitle: 'Deep ArcFace Metric Learning',
    icon: Cpu,
    color: '#00f0ff', // Neon Cyan
    badge: 'STAGE 02',
    description: 'The primary (largest) face chip passes through the ArcFace (ResNet-50) deep neural network, outputting a 512-dimensional normalized floating-point feature vector representing biometric facial geometry.',
    inputs: ['Aligned Face Chip'],
    outputs: ['512-Dimensional Unit Vector e ∈ ℝ⁵¹²'],
    techStack: ['ArcFace (w600k_r50 ONNX)', 'NumPy Vector Normalization'],
    mathFormula: '||e||₂ = 1.0  (L2 Normalized Euclidean Norm)',
    whyImportant: 'Converts unstructured facial pixels into a compact mathematical representation where identity similarity maps directly to spatial angle.',
    codeSnippet: `primary_face = max(faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
embedding = primary_face.normed_embedding.tolist()  # 512 float values`
  },
  {
    id: 3,
    title: 'Web Reverse Image Search',
    subtitle: 'Yandex Visual Engine Discovery',
    icon: Globe,
    color: '#ff5e00', // Warm Orange
    badge: 'STAGE 03',
    description: 'The input image is submitted directly to Yandex Reverse Image Search via PicImageSearch. Yandex indexes public web pages, social profiles, and media channels to discover potential image candidates.',
    inputs: ['Input Image File Path'],
    outputs: ['Raw List of Yandex Search Result Items (URLs, Thumbnails, Titles)'],
    techStack: ['PicImageSearch Network/Yandex', 'Async httpx client'],
    whyImportant: 'Reverse image search acts strictly as a discovery mechanism to find candidate web pages across Instagram, YouTube, LinkedIn, X, and personal sites.',
    codeSnippet: `async with Network() as client:
    yandex = Yandex(client=client)
    resp = await yandex.search(file=image_path)
    raw_results = resp.raw  # List of web candidates`
  },
  {
    id: 4,
    title: 'Domain Filtering & Caching',
    subtitle: 'Platform Classification & Dedup',
    icon: Filter,
    color: '#9d4edd', // Vivid Purple
    badge: 'STAGE 04',
    description: 'Discovered candidate URLs are parsed, classified by platform (Instagram, YouTube, LinkedIn, X, etc.), deduplicated, filtered to reject root channel profiles without media, and downloaded locally with JSON metadata.',
    inputs: ['Raw Search Candidate List'],
    outputs: ['Filtered Candidate List', 'Local Image Files in data/candidates/'],
    techStack: ['urllib.parse', 'httpx download stream', 'SHA-256 URL hashing'],
    whyImportant: 'Prevents redundant downloads, filters non-content URLs, and establishes a local disk cache with companion JSON metadata for offline resilience.',
    codeSnippet: `candidates = filter_candidates(raw_results, max_candidates=20)
for c in candidates:
    download_candidate(c)  # Saved to data/candidates/ with companion JSON`
  },
  {
    id: 5,
    title: 'Biometric Face Verification',
    subtitle: 'InsightFace Cosine Similarity',
    icon: UserCheck,
    color: '#10b981', // Emerald Green
    badge: 'STAGE 05',
    description: 'Each downloaded candidate image is loaded and passed through InsightFace to detect faces and extract candidate embeddings. Cosine similarity is computed between the target embedding and each candidate.',
    inputs: ['Input Embedding e₁', 'Candidate Image Embedding e₂'],
    outputs: ['Cosine Similarity Score [-1.0, 1.0]', 'Match Verification Status (MATCH / REJECTED)'],
    techStack: ['NumPy Dot Product', 'InsightFace Cosine Metric'],
    mathFormula: 'Similarity(e₁, e₂) = (e₁ · e₂) / (||e₁|| ||e₂||)',
    whyImportant: 'Decouples discovery from identity: Yandex only finds visual similarities, but InsightFace guarantees biometric identity match against candidate photos.',
    codeSnippet: `sim = np.dot(e1, e2) / (np.linalg.norm(e1) * np.linalg.norm(e2))
status = "MATCH" if sim >= FACE_MATCH_THRESHOLD else "REJECTED"`
  },
  {
    id: 6,
    title: 'Blockchain Fingerprinting',
    subtitle: 'SHA-256 Canonical JSON Chain',
    icon: ShieldCheck,
    color: '#f43f5e', // Rose
    badge: 'STAGE 06',
    description: 'When a match is confirmed, a canonical JSON payload (URL, title, platform, image_sha256) is deterministically hashed with SHA-256 and appended to a local linked-block chain with cryptographic prev_hash pointer.',
    inputs: ['Matched Candidate Payload', 'Downloaded Image Bytes'],
    outputs: ['Immutable Block Record', 'SHA-256 Payload Fingerprint', 'Prev Block Hash Link'],
    techStack: ['hashlib SHA-256', 'Canonical JSON Serialization', 'Linked-Block Engine'],
    mathFormula: 'Block_Hash = SHA256( Index || Timestamp || Prev_Hash || Data_Hash )',
    whyImportant: 'Creates an immutable, tamper-evident record of identity verification. Any attempt to modify stored data results in an instant SHA-256 verification failure.',
    codeSnippet: `payload_hash = sha256(json.dumps(payload, sort_keys=True))
block_hash = sha256(f"{index}{timestamp}{prev_hash}{payload_hash}")
chain.append(Block(index, timestamp, prev_hash, payload_hash, block_hash))`
  }
];

export default function PipelineArchitecture() {
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const current = STAGES.find(s => s.id === selectedStage) || STAGES[0];

  return (
    <div className="space-y-12 py-4">

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00f0ff]">
          <Zap className="w-3.5 h-3.5 text-[#ff2a85]" />
          <span>TECHNICAL SPECIFICATIONS & WORKFLOW</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          End-to-End <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#9d4edd] to-[#ff2a85]">Pipeline Architecture</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
          The system strictly decouples <strong className="text-white">Discovery (Yandex Reverse Search)</strong> from <strong className="text-white">Identity Verification (InsightFace ArcFace)</strong> and enforces <strong className="text-white">Integrity (SHA-256 Blockchain)</strong>.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Interactive Workflow Graph                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden border border-white/10 bg-[#0f1118]">
        
        {/* Background Ambient Glow */}
        <div 
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ background: current.color }}
        />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00f0ff]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-400">
              Interactive 6-Stage Workflow Graph
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Click any stage node to inspect parameters &amp; implementation
          </span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isSelected = s.id === selectedStage;

            return (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedStage(s.id)}
                className={`
                  relative flex flex-col items-center p-4 rounded-xl text-center transition-all duration-300 border
                  ${isSelected
                    ? 'bg-[#161924] border-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] z-20'
                    : 'bg-[#0b0d14] border-white/10 hover:border-white/20 opacity-75 hover:opacity-100'
                  }
                `}
                style={{
                  borderColor: isSelected ? s.color : undefined,
                  boxShadow: isSelected ? `0 0 25px ${s.color}35` : undefined
                }}
              >
                {/* Stage Badge */}
                <span 
                  className="text-[9px] font-mono font-extrabold tracking-widest px-2 py-0.5 rounded-full mb-3"
                  style={{ 
                    backgroundColor: `${s.color}20`,
                    color: s.color,
                    border: `1px solid ${s.color}50`
                  }}
                >
                  {s.badge}
                </span>

                {/* Node Icon */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300"
                  style={{
                    backgroundColor: isSelected ? `${s.color}25` : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isSelected ? s.color : 'rgba(255, 255, 255, 0.1)'}`
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: s.color }} />
                </div>

                {/* Node Title */}
                <span className="text-xs font-bold text-white line-clamp-1 mb-1">
                  {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1 font-mono">
                  {s.subtitle.split(' ')[0]}
                </span>

                {/* Selected indicator arrow */}
                {isSelected && (
                  <motion.div 
                    layoutId="activeStageArrow"
                    className="absolute -bottom-2 w-3 h-3 rotate-45"
                    style={{ backgroundColor: s.color }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Connecting Pulse Line */}
        <div className="hidden lg:block relative my-6">
          <div className="w-full h-[2px] bg-gradient-to-r from-[#ff2a85] via-[#00f0ff] to-[#10b981] opacity-30" />
          <motion.div 
            className="absolute top-0 h-[2px] w-24 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_#fff]"
            animate={{
              left: ['0%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Detailed Stage Deep Dive Card                                      */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >

          {/* Left Column: Description & Specifications */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 sm:p-8 space-y-6 border border-white/10 bg-[#0f1118]">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${current.color}20`, border: `1px solid ${current.color}50` }}
                  >
                    <current.icon className="w-6 h-6" style={{ color: current.color }} />
                  </div>
                  <div>
                    <span className="text-xs font-mono tracking-widest font-bold text-slate-400">{current.badge}</span>
                    <h2 className="text-xl font-bold text-white">{current.title}</h2>
                    <p className="text-xs font-mono" style={{ color: current.color }}>{current.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 leading-relaxed bg-[#08090c] p-4 rounded-xl border border-white/10">
                {current.description}
              </p>

              {/* Mathematical Formulation (if applicable) */}
              {current.mathFormula && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00f0ff]">
                    <Code2 className="w-4 h-4" />
                    <span className="font-bold">Mathematical Formulation:</span>
                  </div>
                  <p className="text-sm font-mono text-white bg-black/60 px-3 py-2 rounded-lg border border-white/10">
                    {current.mathFormula}
                  </p>
                </div>
              )}

              {/* Inputs & Outputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Inputs */}
                <div className="bg-[#08090c] rounded-xl p-4 space-y-2 border border-white/10">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-bold">
                    <ArrowRight className="w-3 h-3 text-[#00f0ff]" /> Data Inputs
                  </span>
                  <ul className="space-y-1.5">
                    {current.inputs.map((inp, i) => (
                      <li key={i} className="text-xs text-slate-200 font-medium flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] mt-1.5 flex-shrink-0" />
                        <span>{inp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Outputs */}
                <div className="bg-[#08090c] rounded-xl p-4 space-y-2 border border-white/10">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-[#10b981]" /> Data Outputs
                  </span>
                  <ul className="space-y-1.5">
                    {current.outputs.map((out, i) => (
                      <li key={i} className="text-xs text-slate-200 font-medium flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1.5 flex-shrink-0" />
                        <span>{out}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Why Important Callout */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#00f0ff] tracking-wider block">
                  Architectural Rationale
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {current.whyImportant}
                </p>
              </div>

            </div>
          </div>

          {/* Right Column: Code Snippet & Tech Stack */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Tech Stack Pills */}
            <div className="glass-card p-6 space-y-3 border border-white/10 bg-[#0f1118]">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 font-bold">
                <Zap className="w-4 h-4 text-[#9d4edd]" />
                Underlying Libraries &amp; Models
              </h4>
              <div className="flex flex-wrap gap-2">
                {current.techStack.map((tech, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs font-mono font-medium text-white shadow-inner"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Code Implementation Box */}
            <div className="glass-card p-6 space-y-3 relative overflow-hidden border border-white/10 bg-[#0f1118]">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 font-bold">
                  <Terminal className="w-4 h-4 text-[#10b981]" />
                  <span>Python Source Implementation</span>
                </div>
                <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/20 px-2 py-0.5 rounded border border-[#10b981]/40">
                  backend/src/
                </span>
              </div>

              <pre className="text-xs font-mono bg-[#050608] p-4 rounded-xl border border-white/10 text-emerald-400 overflow-x-auto leading-relaxed shadow-2xl">
                <code>{current.codeSnippet}</code>
              </pre>
            </div>

            {/* Security Principle */}
            <div className="glass-card p-6 space-y-3 border-l-4 border-l-[#9d4edd] border border-white/10 bg-[#0f1118]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Lock className="w-4 h-4 text-[#9d4edd]" />
                <span>Deterministic Verification Principle</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reverse image search is inherently probabilistic. To guarantee authenticity, our pipeline hashes canonical JSON payload keys with exact SHA-256 byte representations before recording to the chain.
              </p>
            </div>

          </div>

        </motion.div>
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Technical Comparison Table                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="glass-card p-6 sm:p-8 space-y-6 border border-white/10 bg-[#0f1118]">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00f0ff]" />
            Clear System Separation Matrix
          </h3>
          <p className="text-xs text-slate-400">
            Understanding why Discovery (Yandex), Verification (InsightFace), and Integrity (Blockchain) are decoupled.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-3 px-4 font-bold">PIPELINE PHASE</th>
                <th className="py-3 px-4 font-bold">PRIMARY ENGINE</th>
                <th className="py-3 px-4 font-bold">CORE METHOD</th>
                <th className="py-3 px-4 font-bold">ROLE &amp; PURPOSE</th>
                <th className="py-3 px-4 font-bold">OUTPUT TYPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#00f0ff]">1. Discovery</td>
                <td className="py-3.5 px-4">Yandex Reverse Search</td>
                <td className="py-3.5 px-4">Global Visual Indexing</td>
                <td className="py-3.5 px-4 text-slate-400">Find candidate web pages &amp; images across public internet</td>
                <td className="py-3.5 px-4">Candidate Web URLs</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#10b981]">2. Identity Verification</td>
                <td className="py-3.5 px-4">InsightFace ArcFace</td>
                <td className="py-3.5 px-4">512-D Cosine Similarity</td>
                <td className="py-3.5 px-4 text-slate-400">Biometric 1:1 match confirmation against candidate photos</td>
                <td className="py-3.5 px-4">Similarity Score %</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#9d4edd]">3. Integrity Proof</td>
                <td className="py-3.5 px-4">Local Linked Ledger</td>
                <td className="py-3.5 px-4">Canonical SHA-256 Hashing</td>
                <td className="py-3.5 px-4 text-slate-400">Immutably log metadata &amp; image fingerprint with prev_hash link</td>
                <td className="py-3.5 px-4">Linked Block Header</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
