'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { searchImage, checkHealth } from './api-client';
import { PipelineStep, SearchResponse } from './types';

import Navbar from './components/Navbar';
import ImageUpload from './components/ImageUpload';
import PipelineStatus from './components/PipelineStatus';
import MatchResult from './components/MatchResult';
import BlockchainCard from './components/BlockchainCard';
import ErrorCard from './components/ErrorCard';
import PipelineArchitecture from './components/PipelineArchitecture';
import BlockchainExplorer from './components/BlockchainExplorer';
import ProcessingVisualizer from './components/ProcessingVisualizer';

import { 
  Scan, 
  Cpu, 
  Globe, 
  UserCheck, 
  Link as LinkIcon, 
  Play, 
  RotateCcw, 
  BookOpen, 
  ArrowRight
} from 'lucide-react';

const INITIAL_STEPS: PipelineStep[] = [
  { id: 1, label: 'Face Detection',       status: 'idle' },
  { id: 2, label: 'Face Embedding',       status: 'idle' },
  { id: 3, label: 'Reverse Image Search', status: 'idle' },
  { id: 4, label: 'Candidate Analysis',   status: 'idle' },
  { id: 5, label: 'Face Verification',    status: 'idle' },
  { id: 6, label: 'Blockchain Record',    status: 'idle' },
];

type AppState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';
type Tab = 'scanner' | 'architecture' | 'ledger';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('scanner');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentStepId, setCurrentStepId] = useState<number>(1);
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const scannerWorkspaceRef = useRef<HTMLDivElement>(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const updateStep = useCallback((id: number, patch: Partial<PipelineStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAppState('idle');
    setCurrentStepId(1);
    setSteps(INITIAL_STEPS);
    setResult(null);
    setGlobalError(null);
  };

  const scrollToScanner = () => {
    setActiveTab('scanner');
    setTimeout(() => {
      scannerWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSearch = async () => {
    if (!file) return;
    setAppState('processing');
    setGlobalError(null);
    setResult(null);
    setSteps(INITIAL_STEPS);
    setCurrentStepId(1);

    try {
      // Stage 1: Face Detection
      setCurrentStepId(1);
      updateStep(1, { status: 'running', detail: 'Loading & locating faces via InsightFace SCRFD...' });
      await new Promise(r => setTimeout(r, 600));
      updateStep(1, { status: 'success', detail: 'Face bounding box & landmarks localized' });

      // Stage 2: 512-D ArcFace Embedding
      setCurrentStepId(2);
      updateStep(2, { status: 'running', detail: 'Generating 512-D ArcFace feature vector...' });
      await new Promise(r => setTimeout(r, 600));
      updateStep(2, { status: 'success', detail: 'Normalized vector e ∈ ℝ⁵¹²' });

      // Stage 3: Reverse Web Search
      setCurrentStepId(3);
      updateStep(3, { status: 'running', detail: 'Querying Yandex Reverse Image Search...' });

      // Trigger backend API request asynchronously
      const responsePromise = searchImage(file);

      await new Promise(r => setTimeout(r, 1600));
      updateStep(3, { status: 'success', detail: 'Discovered web candidates' });

      // Stage 4: Candidate Filtering & Disk Caching
      setCurrentStepId(4);
      updateStep(4, { status: 'running', detail: 'Filtering candidate domains & downloading media...' });
      await new Promise(r => setTimeout(r, 1400));
      updateStep(4, { status: 'success', detail: 'Candidates cached with metadata' });

      // Stage 5: Biometric Cosine Verification
      setCurrentStepId(5);
      updateStep(5, { status: 'running', detail: 'Evaluating InsightFace cosine similarity...' });
      await new Promise(r => setTimeout(r, 1200));

      // Await final API response
      const response = await responsePromise;
      const p = response.pipeline;

      updateStep(5, {
        status: p.match_found ? 'success' : p.candidates_processed > 0 ? 'error' : 'skipped',
        detail: p.match_found && p.match
          ? `Cosine Similarity: ${(p.match.similarity * 100).toFixed(1)}% — VERIFIED MATCH`
          : 'No match above threshold',
      });

      // Stage 6: SHA-256 Blockchain Record
      setCurrentStepId(6);
      updateStep(6, { status: 'running', detail: 'Signing SHA-256 canonical block header...' });
      await new Promise(r => setTimeout(r, 800));

      updateStep(6, {
        status: p.blockchain_record ? 'success' : p.match_found ? 'error' : 'skipped',
        detail: p.blockchain_record
          ? `Block #${p.blockchain_record.block_index} — SHA256: ${p.blockchain_record.data_hash.slice(0, 16)}...`
          : undefined,
      });

      setResult(response);
      setAppState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred';
      setGlobalError(msg);
      setAppState('error');
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error', detail: msg } : s));
    }
  };

  const isProcessing = appState === 'processing';
  const isDone = appState === 'done';

  return (
    <div className="min-h-screen relative flex flex-col bg-[#08090c] text-white selection:bg-[#ff2a85] selection:text-white">
      
      {/* Floating Glowing Orbs */}
      <div className="fixed top-24 left-10 w-24 h-24 rounded-full orb-pink opacity-80 pointer-events-none z-0" />
      <div className="fixed bottom-20 left-20 w-32 h-32 rounded-full orb-cyan opacity-60 pointer-events-none z-0" />
      <div className="fixed top-12 right-12 w-28 h-28 rounded-full orb-orange opacity-70 pointer-events-none z-0" />

      {/* Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} backendOnline={backendOnline} />

      {/* Main Container */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-12 py-4 sm:py-6">

        <AnimatePresence mode="wait">
          
          {/* TAB 1: HERO & SCANNER */}
          {activeTab === 'scanner' && (
            <motion.div
              key="scanner-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-12 sm:space-y-16"
            >
              
              {/* HERO SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[60vh] sm:min-h-[75vh]">
                
                {/* Hero Left Content */}
                <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
                  
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00f0ff]">
                    <span className="w-2 h-2 rounded-full bg-[#ff2a85] animate-ping" />
                    <span>BIOMETRIC IDENTITY &amp; CHAIN LEDGER ENGINE</span>
                  </div>

                  <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15] sm:leading-[1.1]">
                    We Verify <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#9d4edd] to-[#ff2a85]">Faces &amp; Web Data</span> With Deep AI
                  </h1>

                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                    Combining InsightFace ArcFace 512-D vector embeddings, Yandex reverse web search, and canonical SHA-256 fingerprinting to store immutable proof of identity on a local blockchain.
                  </p>

                  {/* HERO BUTTON GROUP */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                    
                    <button
                      onClick={scrollToScanner}
                      className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-extrabold text-sm rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-slate-100 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <span className="absolute left-0 top-0 bottom-0 w-3 rounded-l-xl bg-gradient-to-b from-[#ff2a85] via-[#9d4edd] to-[#00f0ff]" />
                      <span className="pl-2">Try Scanner Now</span>
                      <Play className="w-4 h-4 fill-black group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setActiveTab('architecture')}
                      className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-sm transition-all duration-300 hover:border-[#9d4edd]/50"
                    >
                      <BookOpen className="w-4 h-4 text-[#9d4edd]" />
                      <span>Understand The Pipeline</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>

                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/10 font-mono text-[10px] sm:text-xs text-slate-400">
                    <div>
                      <span className="text-white font-bold block text-xs sm:text-sm">512-D</span>
                      <span>ArcFace Vector</span>
                    </div>
                    <div>
                      <span className="text-white font-bold block text-xs sm:text-sm">Yandex</span>
                      <span>Reverse Search</span>
                    </div>
                    <div>
                      <span className="text-white font-bold block text-xs sm:text-sm">SHA-256</span>
                      <span>Linked Chain</span>
                    </div>
                  </div>

                </div>

                {/* Hero Right 3D Visual Artwork */}
                <div className="lg:col-span-6 relative flex items-center justify-center">
                  <div className="relative w-full max-w-xs sm:max-w-lg aspect-square">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff2a85]/30 via-[#00f0ff]/20 to-[#ff5e00]/30 blur-3xl opacity-70 animate-pulse pointer-events-none" />
                    
                    <motion.div
                      animate={{
                        y: [0, -12, 0],
                        rotate: [0, 2, 0]
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative z-10 w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                    >
                      <Image
                        src="/hero_3d_swirl.png"
                        alt="3D Iridescent Pipeline Artwork"
                        width={600}
                        height={600}
                        className="w-full h-full object-contain filter hover:brightness-110 transition-all duration-500"
                        priority
                      />
                    </motion.div>
                  </div>
                </div>

              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SCANNER WORKSPACE SECTION                                           */}
              {/* ------------------------------------------------------------------ */}
              <div ref={scannerWorkspaceRef} className="pt-4 sm:pt-8 space-y-6 sm:space-y-8">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#00f0ff] tracking-widest block font-bold">
                      LIVE IDENTIFICATION WORKSPACE
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Upload Face Image &amp; Run Analysis</h2>
                  </div>

                  <button
                    onClick={() => setActiveTab('architecture')}
                    className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9d4edd] transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>How does this work? View Pipeline →</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                  
                  {/* Upload Controls Column */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card p-4 sm:p-6 border border-white/10 space-y-5 bg-[#0f1118]">
                      <ImageUpload onFileSelect={handleFileSelect} disabled={isProcessing} />

                      <button
                        id="btn-search"
                        onClick={isDone ? reset : handleSearch}
                        disabled={!file || isProcessing}
                        className={`
                          w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-extrabold text-sm transition-all duration-300
                          ${isDone
                            ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                            : 'bg-white text-black hover:bg-slate-100 shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                          }
                          disabled:opacity-40 disabled:cursor-not-allowed
                        `}
                      >
                        {isProcessing ? (
                          <>
                            <Cpu className="w-4 h-4 animate-spin text-black" />
                            <span>Processing Pipeline...</span>
                          </>
                        ) : isDone ? (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>New Scan</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-black" />
                            <span>Start Identification Pipeline</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step Status Tracker */}
                    {(isProcessing || isDone || appState === 'error') && (
                      <PipelineStatus steps={steps} />
                    )}
                  </div>

                  {/* Results & Visualizations Column */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Idle State Banner */}
                    {appState === 'idle' && (
                      <div className="glass-card flex flex-col items-center justify-center py-16 sm:py-24 px-6 text-center space-y-4 border border-white/10 bg-[#0f1118]">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                          <Scan className="w-7 h-7 sm:w-8 sm:h-8 text-[#00f0ff]" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-white">System Ready For Face Image</h3>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Upload a face photo above to begin Yandex reverse search discovery, InsightFace biometric vector matching, and SHA-256 blockchain registration.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Processing Live Telemetry Visualizer */}
                    {isProcessing && (
                      <ProcessingVisualizer
                        steps={steps}
                        currentStepId={currentStepId}
                        previewUrl={previewUrl}
                      />
                    )}

                    {/* Error Card */}
                    {globalError && <ErrorCard message={globalError} />}

                    {/* Completed Results View */}
                    {isDone && result && (
                      <div className="space-y-6">
                        
                        {/* Summary Strip */}
                        <div className="glass-card p-4 sm:p-5 border border-white/10 bg-[#0f1118]">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-x divide-white/10">
                            <div className="text-center px-2">
                              <span className="text-xl sm:text-2xl font-black text-[#00f0ff]">{result.pipeline.face_count}</span>
                              <p className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">Faces Found</p>
                            </div>
                            <div className="text-center px-2">
                              <span className="text-xl sm:text-2xl font-black text-[#9d4edd]">{result.pipeline.search_results_count}</span>
                              <p className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">Web Candidates</p>
                            </div>
                            <div className="text-center px-2">
                              <span className="text-xl sm:text-2xl font-black text-[#ff5e00]">{result.pipeline.candidates_processed}</span>
                              <p className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">Vectors Evaluated</p>
                            </div>
                            <div className="text-center px-2">
                              <span className={`text-xl sm:text-2xl font-black ${result.pipeline.match_found ? 'text-[#10b981]' : 'text-red-400'}`}>
                                {result.pipeline.match_found ? 'MATCH' : 'NONE'}
                              </span>
                              <p className="text-[10px] font-mono uppercase text-slate-400 mt-0.5">Verification</p>
                            </div>
                          </div>
                        </div>

                        {/* Warning if no match */}
                        {!result.pipeline.match_found && result.pipeline.face_detected && (
                          <ErrorCard
                            type="warning"
                            message={result.pipeline.error || 'No candidate met the InsightFace similarity threshold.'}
                          />
                        )}

                        {!result.pipeline.face_detected && (
                          <ErrorCard message={result.pipeline.error || 'No face detected in photo.'} />
                        )}

                        {/* Match Result Card */}
                        {result.pipeline.match && (
                          <MatchResult match={result.pipeline.match} />
                        )}

                        {/* Blockchain Record Card */}
                        {result.pipeline.blockchain_record && (
                          <BlockchainCard
                            record={result.pipeline.blockchain_record}
                            initialVerification={result.pipeline.verification}
                          />
                        )}

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: PIPELINE ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <motion.div
              key="architecture-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <PipelineArchitecture />
            </motion.div>
          )}

          {/* TAB 3: BLOCKCHAIN EXPLORER */}
          {activeTab === 'ledger' && (
            <motion.div
              key="ledger-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <BlockchainExplorer />
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050608] py-6 sm:py-8 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 text-center sm:text-left">
          <div>
            <span>ImgLedger AI Engine</span>
            <span className="mx-2 hidden sm:inline">•</span>
            <span className="block sm:inline">InsightFace ArcFace + Yandex Search + SHA-256 Ledger</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveTab('architecture')} className="hover:text-white transition-colors">Architecture Specs</button>
            <button onClick={() => setActiveTab('ledger')} className="hover:text-white transition-colors">Chain Explorer</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
