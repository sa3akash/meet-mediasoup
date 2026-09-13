"use client";

import { RefObject } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

interface FileDropzoneProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  isUploading: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileDropzone({
  fileInputRef,
  isDragging,
  isUploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInputChange,
}: FileDropzoneProps) {
  return (
    <div className="p-4 border-b border-slate-800/80">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          isDragging
            ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
            : "border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
          className="hidden"
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-xs text-slate-300 font-medium">
              Uploading to S3 storage...
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-400 mb-1">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Click or drag files here to share
            </p>
            <p className="text-[11px] text-slate-400">
              Documents, images, and videos up to 100MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
