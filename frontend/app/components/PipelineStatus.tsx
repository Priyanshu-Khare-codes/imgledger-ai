'use client';

import { PipelineStep, StepStatus } from '../types';
import { CheckCircle2, XCircle, Loader2, Circle, SkipForward } from 'lucide-react';

const icons: Record<StepStatus, React.ReactNode> = {
  idle:    <Circle className="w-4 h-4 text-slate-600" />,
  running: <Loader2 className="w-4 h-4 text-[#00f0ff] animate-spin" />,
  success: <CheckCircle2 className="w-4 h-4 text-[#10b981]" />,
  error:   <XCircle className="w-4 h-4 text-[#ff2a85]" />,
  skipped: <SkipForward className="w-4 h-4 text-slate-600" />,
};

const labelColors: Record<StepStatus, string> = {
  idle:    'text-slate-400',
  running: 'text-[#00f0ff] font-bold',
  success: 'text-white font-semibold',
  error:   'text-[#ff2a85] font-bold',
  skipped: 'text-slate-500',
};

const glowColors: Record<StepStatus, string> = {
  idle:    '',
  running: 'border-[#00f0ff]/50 bg-[#00f0ff]/10 shadow-[0_0_15px_rgba(0,240,255,0.25)]',
  success: 'border-[#10b981]/30 bg-[#10b981]/10',
  error:   'border-[#ff2a85]/30 bg-[#ff2a85]/10',
  skipped: '',
};

interface PipelineStatusProps {
  steps: PipelineStep[];
}

export default function PipelineStatus({ steps }: PipelineStatusProps) {
  return (
    <div className="glass-card p-6 space-y-1 border border-white/10 bg-[#0f1118]">
      <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
        Pipeline Execution Progress
      </h3>

      {steps.map((step, i) => (
        <div key={step.id}>
          {/* Row */}
          <div
            className={`
              flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300
              border border-transparent
              ${glowColors[step.status]}
            `}
          >
            {/* Step number */}
            <span className="text-[10px] font-mono text-slate-500 w-4 text-center select-none">
              {step.id}
            </span>

            {/* Status icon */}
            <span className="flex-shrink-0">{icons[step.status]}</span>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${labelColors[step.status]}`}>
                {step.label}
              </p>
              {step.detail && (
                <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                  {step.detail}
                </p>
              )}
            </div>

            {/* Running bar */}
            {step.status === 'running' && (
              <div className="w-12 h-1 rounded-full overflow-hidden bg-white/10">
                <div className="h-full bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent animate-pulse" />
              </div>
            )}
          </div>

          {/* Connector */}
          {i < steps.length - 1 && (
            <div className="w-[1px] h-3 bg-white/10 ml-7 my-0.5" />
          )}
        </div>
      ))}
    </div>
  );
}
