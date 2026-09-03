'use client';

import { AlertTriangle, XCircle, Info } from 'lucide-react';

interface ErrorCardProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

const configs = {
  error:   { icon: XCircle,        color: 'text-[#ff2a85]', bg: 'bg-[#ff2a85]/10', border: 'border-[#ff2a85]/40' },
  warning: { icon: AlertTriangle,  color: 'text-[#ff5e00]', bg: 'bg-[#ff5e00]/10', border: 'border-[#ff5e00]/40' },
  info:    { icon: Info,            color: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/40' },
};

export default function ErrorCard({ message, type = 'error' }: ErrorCardProps) {
  const { icon: Icon, color, bg, border } = configs[type];
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 border ${bg} ${border}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
      <p className={`text-xs font-mono font-medium leading-relaxed ${color}`}>{message}</p>
    </div>
  );
}
