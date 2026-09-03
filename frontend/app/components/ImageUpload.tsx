'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onFileSelect, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  }, [onFileSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${dragOver
          ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_30px_rgba(0,240,255,0.2)] scale-[1.01]'
          : preview
            ? 'border-white/20 bg-[#0f1118]'
            : 'border-white/10 bg-[#0f1118] hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/5'
        }
      `}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={disabled ? undefined : onDrop}
      style={{ minHeight: 220 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {preview ? (
        <div className="relative w-full h-full" style={{ minHeight: 220 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full object-contain rounded-2xl"
            style={{ maxHeight: 360, minHeight: 220 }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl pointer-events-none" />

          {/* Clear button */}
          {!disabled && (
            <button
              onClick={clear}
              className="
                absolute top-3 right-3 w-8 h-8 rounded-full
                bg-black/80 backdrop-blur border border-white/20
                flex items-center justify-center
                text-white hover:bg-red-500 transition-colors z-10
              "
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Label */}
          <div className="absolute bottom-3 left-4 text-xs font-mono text-white/90 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>Target face image ready</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10
            transition-all duration-300
            ${dragOver ? 'bg-[#00f0ff] scale-110' : 'bg-[#08090c]'}
          `}>
            {dragOver
              ? <ImageIcon className="w-8 h-8 text-black" />
              : <Upload className="w-8 h-8 text-[#00f0ff]" />
            }
          </div>

          <div>
            <p className="text-white font-bold text-base mb-1">
              {dragOver ? 'Drop face photo here' : 'Upload Face Image'}
            </p>
            <p className="text-slate-400 text-xs font-mono">
              Drag &amp; drop or click to browse
            </p>
            <p className="text-slate-500 text-[10px] font-mono mt-2">
              JPEG · PNG · WEBP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
