'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  Cpu, 
  Globe, 
  Filter, 
  UserCheck, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Clock, 
  Zap
} from 'lucide-react';
import { PipelineStep } from '../types';

interface ProcessingVisualizerProps {
  steps: PipelineStep[];
  currentStepId: number;
  previewUrl?: string | null;
}

const STAGES = [
  { id: 1, label: 'Face Detection',       icon: Scan,        color: '#ff2a85', subtitle: 'InsightFace SCRFD / RetinaFace' },
  { id: 2, label: '512-D Embedding',       icon: Cpu,         color: '#00f0ff', subtitle: 'ArcFace Metric Matrix' },
  { id: 3, label: 'Reverse Web Search',   icon: Globe,       color: '#ff5e00', subtitle: 'Yandex Visual Engine' },
  { id: 4, label: 'Domain Filtering',     icon: Filter,      color: '#9d4edd', subtitle: 'Platform Dedup & Caching' },
  { id: 5, label: 'Face Verification',    icon: UserCheck,   color: '#10b981', subtitle: 'Cosine Similarity Match' },
  { id: 6, label: 'Blockchain Ledger',    icon: ShieldCheck, color: '#f43f5e', subtitle: 'SHA-256 Canonical Sign' },
];

export default function ProcessingVisualizer({ steps, currentStepId, previewUrl }: ProcessingVisualizerProps) {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const consoleBoxRef = useRef<HTMLDivElement>(null);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll inside console box ONLY — without jumping the main page screen!
  useEffect(() => {
    if (consoleBoxRef.current) {
      consoleBoxRef.current.scrollTop = consoleBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // Dynamic live telemetry logs
  useEffect(() => {
    const timeStr = elapsedTime.toFixed(1) + 's';

    const logTemplates: Record<number, string[]> = {
      1: [
        `[${timeStr}] INSIGHTFACE: Initializing buffalo_l ONNX runtime context...`,
        `[${timeStr}] SCRFD_DETECTOR: Scanning input pixels for facial landmarks...`,
        `[${timeStr}] ALIGNMENT: 5 facial keypoints localized (eyes, nose, mouth).`,
      ],
      2: [
        `[${timeStr}] ARCFACE_R50: Passing cropped face chip into ResNet-50 backbone...`,
        `[${timeStr}] VECTOR_SPACE: Extracting 512 floating-point facial feature vector...`,
        `[${timeStr}] L2_NORMALIZATION: ||e||₂ normalized to 1.0 Euclidean unit sphere.`,
      ],
      3: [
        `[${timeStr}] YANDEX_NETWORK: Submitting image buffer to Yandex Visual Engine...`,
        `[${timeStr}] REVERSE_SEARCH: Querying global public web index...`,
        `[${timeStr}] DISCOVERY: Discovered candidate image URLs & web page titles.`,
      ],
      4: [
        `[${timeStr}] DOMAIN_FILTER: Classifying candidate domains (Instagram, YouTube, X)...`,
        `[${timeStr}] DEDUP_STREAM: Filtering root channel profiles & caching images...`,
        `[${timeStr}] DISK_CACHE: Saved candidates to data/candidates/ with companion JSON.`,
      ],
      5: [
        `[${timeStr}] INSIGHTFACE_MATCH: Loading candidate chips into FaceAnalysis engine...`,
        `[${timeStr}] COSINE_METRIC: Computing e₁ · e₂ dot product matrix...`,
        `[${timeStr}] SIMILARITY_EVAL: Comparing similarity scores against threshold...`,
      ],
      6: [
        `[${timeStr}] CANONICAL_SERIALIZER: Sorting JSON payload keys deterministically...`,
        `[${timeStr}] SHA256_ENGINE: Hashing canonical payload + downloaded image bytes...`,
        `[${timeStr}] CHAIN_LEDGER: Appending Block with prev_hash pointer link.`,
      ]
    };

    const currentLogs = logTemplates[currentStepId] || [];
    if (currentLogs.length > 0) {
      setLogs(prev => {
        const next = [...prev, currentLogs[Math.floor(Math.random() * currentLogs.length)]];
        return next.slice(-10);
      });
    }
  }, [currentStepId, Math.floor(elapsedTime)]);

  const activeStage = STAGES.find(s => s.id === currentStepId) || STAGES[0];
  const progressPercentage = Math.min(100, Math.round((currentStepId / 6) * 100));

  return (
    <div className="glass-card p-4 sm:p-8 border border-[#00f0ff]/30 bg-[#0f1118] space-y-6 sm:space-y-8 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative overflow-hidden">
      
      {/* Background Ambient Pulse */}
      <div 
        className="absolute -top-32 -right-32 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ background: activeStage.color }}
      />

      {/* Header Telemetry Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border animate-pulse flex-shrink-0"
            style={{ 
              backgroundColor: `${activeStage.color}20`,
              borderColor: `${activeStage.color}60`
            }}
          >
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: activeStage.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">PIPELINE EXECUTION LIVE</span>
              <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
            </div>
            <p className="text-xs font-mono" style={{ color: activeStage.color }}>
              Stage {currentStepId} of 6 — {activeStage.label}
            </p>
          </div>
        </div>

        {/* Live Timer & Progress Badge */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono self-end sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>{elapsedTime.toFixed(1)}s</span>
          </div>
          <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-xs font-bold text-[#00f0ff]">
            {progressPercentage}%
          </div>
        </div>
      </div>

      {/* Central Visual Holographic Scanner & Radar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Target Preview HUD */}
        <div className="md:col-span-5 relative flex items-center justify-center">
          <div 
            className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 bg-black flex items-center justify-center shadow-2xl transition-colors duration-500"
            style={{ borderColor: activeStage.color }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Scanning target"
                className="w-full h-full object-cover filter brightness-90 contrast-110"
              />
            ) : (
              <Scan className="w-12 h-12 opacity-40" style={{ color: activeStage.color }} />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#00f0ff]" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#00f0ff]" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#00f0ff]" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#00f0ff]" />

            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_20px_#00f0ff]"
              animate={{
                top: ['0%', '100%', '0%']
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                className="w-24 h-24 sm:w-28 sm:h-28 border border-dashed rounded-full"
                style={{ borderColor: `${activeStage.color}80` }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="absolute bottom-2.5 left-2.5 right-2.5 px-2 py-1 rounded bg-black/80 backdrop-blur border border-white/10 text-[9px] sm:text-[10px] font-mono text-white flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#00f0ff]" />
                <span>SCANNING</span>
              </span>
              <span className="text-[#00f0ff] font-bold">512D ONNX</span>
            </div>
          </div>
        </div>

        {/* Live Terminal Telemetry Console */}
        <div className="md:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Terminal className="w-4 h-4 text-[#10b981]" />
              <span>Real-Time Execution Logs</span>
            </span>
            <span className="text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30 font-bold">
              STREAMING
            </span>
          </div>

          {/* Console Box with inner scroll ONLY */}
          <div 
            ref={consoleBoxRef}
            className="bg-[#050608] rounded-xl p-3.5 border border-white/10 font-mono text-[10px] sm:text-[11px] leading-relaxed space-y-2 h-40 sm:h-48 overflow-y-auto shadow-inner text-slate-300"
          >
            <AnimatePresence>
              {logs.map((log, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-1.5 break-all"
                >
                  <span className="text-[#00f0ff] select-none flex-shrink-0">&gt;</span>
                  <span className={log.includes('INSIGHTFACE') || log.includes('ARCFACE') ? 'text-[#00f0ff]' : log.includes('YANDEX') ? 'text-[#ff5e00]' : log.includes('CHAIN') ? 'text-[#10b981]' : 'text-slate-300'}>
                    {log}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* 6-Stage Progress Nodes Bar */}
      <div className="space-y-3">
        <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/10 relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ff2a85] via-[#00f0ff] to-[#10b981]"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isCompleted = s.id < currentStepId;
            const isCurrent = s.id === currentStepId;

            return (
              <div
                key={s.id}
                className={`
                  p-2 sm:p-2.5 rounded-xl border text-center transition-all duration-300 flex flex-col items-center gap-1
                  ${isCurrent
                    ? 'bg-[#161924] border-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] scale-105'
                    : isCompleted
                      ? 'bg-[#10b981]/10 border-[#10b981]/40 text-slate-300'
                      : 'bg-[#08090c] border-white/5 opacity-50'
                  }
                `}
                style={{
                  borderColor: isCurrent ? s.color : undefined
                }}
              >
                <Icon 
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isCurrent ? 'animate-bounce' : ''}`} 
                  style={{ color: isCurrent ? s.color : isCompleted ? '#10b981' : '#64748b' }} 
                />
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white line-clamp-1">
                  {s.label}
                </span>
                <span className="text-[8px] font-mono text-slate-400 uppercase">
                  {isCompleted ? '✓ Done' : isCurrent ? '● Active' : 'Waiting'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
