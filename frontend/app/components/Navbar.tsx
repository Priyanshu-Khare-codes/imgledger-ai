'use client';

import { Cpu } from 'lucide-react';

interface NavbarProps {
  activeTab: 'scanner' | 'architecture' | 'ledger';
  setActiveTab: (tab: 'scanner' | 'architecture' | 'ledger') => void;
  backendOnline?: boolean;
}

export default function Navbar({ activeTab, setActiveTab, backendOnline = true }: NavbarProps) {
  return (
    <header className="relative z-50 py-4 sm:py-6 px-4 sm:px-12 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
      
      {/* Brand / Logo */}
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div 
          onClick={() => setActiveTab('scanner')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff2a85] via-[#00f0ff] to-[#ff5e00] p-[2px] shadow-[0_0_20px_rgba(255,42,133,0.4)] transition-transform group-hover:scale-110">
            <div className="w-full h-full bg-[#08090c] rounded-full flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[#00f0ff]" />
            </div>
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">ImgLedger <span className="text-[#00f0ff]">AI</span></span>
            <span className="text-[10px] text-slate-400 font-mono block">BIOMETRIC LEDGER ENGINE</span>
          </div>
        </div>

        {/* Mobile Status Indicator */}
        <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-[#10b981]' : 'bg-red-500'}`} />
          <span className="text-slate-300">{backendOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium whitespace-nowrap">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`transition-colors duration-200 ${
              activeTab === 'scanner' ? 'text-white font-bold border-b-2 border-[#00f0ff] pb-0.5' : 'text-slate-400 hover:text-white'
            }`}
          >
            Scanner
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`transition-colors duration-200 flex items-center gap-1.5 ${
              activeTab === 'architecture' ? 'text-white font-bold border-b-2 border-[#9d4edd] pb-0.5' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Architecture</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#9d4edd]/20 text-[#9d4edd] font-mono uppercase">Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`transition-colors duration-200 ${
              activeTab === 'ledger' ? 'text-white font-bold border-b-2 border-[#10b981] pb-0.5' : 'text-slate-400 hover:text-white'
            }`}
          >
            Chain Ledger
          </button>
        </nav>

        {/* Desktop Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-[#10b981] shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`} />
          <span className="text-slate-300 text-[11px] font-mono">
            {backendOnline ? 'API READY' : 'OFFLINE'}
          </span>
        </div>

      </div>

    </header>
  );
}
