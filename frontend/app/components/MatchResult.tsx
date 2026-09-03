'use client';

import { VerifiedCandidate } from '../types';
import { ExternalLink, UserCheck, ImageIcon } from 'lucide-react';

interface MatchResultProps {
  match: VerifiedCandidate;
}

export default function MatchResult({ match }: MatchResultProps) {
  const c = match.candidate;
  const simPct = Math.round(match.similarity * 100);

  return (
    <div className="glass-card p-6 space-y-6 border border-[#10b981]/40 bg-[#0f1118] shadow-[0_0_30px_rgba(16,185,129,0.15)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_10px_#10b981] animate-pulse" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#10b981]">
            Verified Biometric Match Found
          </h3>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 font-bold">
          {simPct}% CONFIDENCE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thumbnail */}
        <div 
          className="relative rounded-xl overflow-hidden bg-[#08090c] border border-white/10 flex items-center justify-center"
          style={{ minHeight: 200 }}
        >
          {c.image_url || c.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image_url || c.thumbnail}
              alt={c.title || 'Match'}
              className="w-full h-full object-cover"
              style={{ maxHeight: 240 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500 p-8">
              <ImageIcon className="w-10 h-10" />
              <span className="text-xs font-mono">No preview available</span>
            </div>
          )}

          {/* Platform badge */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur text-xs font-mono font-bold text-[#00f0ff] border border-white/15">
            {c.source || 'Web'}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          
          {/* Title */}
          {c.title && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1 font-bold">Content Title</p>
              <p className="text-white font-bold text-sm leading-snug line-clamp-2">
                {c.title}
              </p>
            </div>
          )}

          {/* Platform */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1 font-bold">Discovered Platform</p>
            <p className="text-[#00f0ff] font-mono font-bold">{c.source || 'Web'}</p>
          </div>

          {/* Face similarity bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
              <p className="uppercase tracking-widest text-slate-400 font-bold">ArcFace Cosine Similarity</p>
              <span className="font-bold text-[#10b981]">{simPct}% Match</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#08090c] overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#10b981] via-[#00f0ff] to-[#ff2a85] transition-all duration-700"
                style={{ width: `${simPct}%` }}
              />
            </div>
          </div>

          {/* Face match status */}
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#10b981]" />
            <span className="text-xs font-mono font-bold text-[#10b981]">
              Identity Verified: YES
            </span>
          </div>

          {/* Open post button */}
          {c.url && (
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold
                bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981]
                hover:bg-[#10b981] hover:text-black transition-all duration-200 shadow-md
              "
            >
              <ExternalLink className="w-4 h-4" />
              Open Discovered Source Post
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
