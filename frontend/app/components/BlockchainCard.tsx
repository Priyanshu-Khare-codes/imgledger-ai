'use client';

import { useState } from 'react';
import { BlockchainRecord, VerificationResult } from '../types';
import { verifyRecord } from '../api-client';
import { Shield, ShieldCheck, ShieldAlert, Loader2, Hash, Link2, Clock } from 'lucide-react';

interface BlockchainCardProps {
  record: BlockchainRecord;
  initialVerification?: VerificationResult;
}

function HashDisplay({ label, value, highlight }: { label: string; value: string; highlight?: 'match' | 'mismatch' }) {
  const color =
    highlight === 'match'    ? 'text-[#10b981]' :
    highlight === 'mismatch' ? 'text-[#ff2a85]' :
                               'text-slate-400';

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1 font-bold">{label}</p>
      <p className={`font-mono-hash break-all bg-[#08090c] p-2.5 rounded-lg border border-white/10 ${color}`}>{value}</p>
    </div>
  );
}

export default function BlockchainCard({ record, initialVerification }: BlockchainCardProps) {
  const [verification, setVerification] = useState<VerificationResult | undefined>(initialVerification);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await verifyRecord(record.record_id);
      setVerification(res.verification);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const isVerified = verification?.verified;
  const hasMismatch = verification && !verification.verified;

  return (
    <div className="glass-card p-6 space-y-6 border border-[#00f0ff]/30 bg-[#0f1118]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#00f0ff]">
            Cryptographic Blockchain Record
          </h3>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10 font-bold">
          BLOCK #{record.block_index}
        </span>
      </div>

      {/* Block metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#08090c] rounded-xl p-3.5 border border-white/10">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
            <Link2 className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Block Height</span>
          </div>
          <span className="text-2xl font-black font-mono text-[#00f0ff]">#{record.block_index}</span>
        </div>

        <div className="bg-[#08090c] rounded-xl p-3.5 border border-white/10">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
            <Clock className="w-3.5 h-3.5 text-[#9d4edd]" />
            <span>Timestamp</span>
          </div>
          <span className="text-xs font-mono text-slate-300">
            {new Date(record.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Hashes */}
      <div className="space-y-3">
        <HashDisplay label="Record ID" value={record.record_id} />
        
        <div>
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
            <Hash className="w-3.5 h-3.5 text-[#ff5e00]" />
            <span>SHA-256 Payload Fingerprint</span>
          </div>
          <p className="font-mono-hash text-[#ff5e00] bg-[#08090c] p-2.5 rounded-lg border border-white/10 break-all font-bold">
            {record.data_hash}
          </p>
        </div>

        <HashDisplay label="Previous Hash Link" value={record.previous_hash} />
        <HashDisplay label="Current Block Hash" value={record.block_hash} />
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={loading}
        className="
          w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
          font-bold text-xs font-mono transition-all duration-200
          bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#00f0ff]
          hover:bg-[#00f0ff] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Hash Linkage...</>
          : <><Shield className="w-4 h-4" /> Re-Verify Chain Record</>
        }
      </button>

      {error && (
        <p className="text-xs font-mono text-[#ff2a85] text-center">{error}</p>
      )}

      {/* Verification result */}
      {verification && (
        <div
          className={`
            rounded-xl p-4 border space-y-3
            ${isVerified
              ? 'bg-[#10b981]/10 border-[#10b981]/50 text-white'
              : 'bg-[#ff2a85]/10 border-[#ff2a85]/50 text-white'
            }
          `}
        >
          <div className="flex items-center gap-2">
            {isVerified
              ? <ShieldCheck className="w-5 h-5 text-[#10b981]" />
              : <ShieldAlert className="w-5 h-5 text-[#ff2a85]" />
            }
            <span className={`font-mono font-bold text-sm ${isVerified ? 'text-[#10b981]' : 'text-[#ff2a85]'}`}>
              {isVerified ? 'VERIFIED & UNTAMPERED' : 'TAMPER MISMATCH DETECTED'}
            </span>
          </div>

          <div className="space-y-2">
            <HashDisplay
              label="Stored Block Hash"
              value={verification.stored_hash}
              highlight={isVerified ? 'match' : 'mismatch'}
            />
            <HashDisplay
              label="Recomputed Payload SHA-256"
              value={verification.current_hash}
              highlight={isVerified ? 'match' : 'mismatch'}
            />
          </div>

          {hasMismatch && (
            <p className="text-xs font-mono text-[#ff2a85] font-bold">
              ⚠ Hash mismatch detected! Stored block payload does not match canonical recomputation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
