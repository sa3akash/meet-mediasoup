"use client";

import {
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Download,
  Trash2,
  Eye,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { type FileItem } from "../file-preview-modal";

interface FileListItemProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
}

export function FileListItem({ file: f, onPreview, onDelete }: FileListItemProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    if (mimeType.startsWith("video/")) return <Film className="w-5 h-5 text-purple-400" />;
    if (mimeType.includes("pdf") || mimeType.includes("document")) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between gap-3 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60 flex-shrink-0">
          {getFileIcon(f.mimeType)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate max-w-[190px]">
            {f.fileName}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>{(f.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
            <span>•</span>
            <span>{f.uploaderName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {f.scanStatus === "CLEAN" ? (
          <span
            title="Virus scan passed (Clean)"
            className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </span>
        ) : (
          <span
            title="Virus scan pending"
            className="p-1 rounded text-amber-400 hover:bg-amber-500/10 transition-colors animate-pulse"
          >
            <ShieldAlert className="w-4 h-4" />
          </span>
        )}

        <button
          onClick={() => onPreview(f)}
          title="Preview file"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        <a
          href={f.fileUrl}
          download={f.fileName}
          target="_blank"
          rel="noreferrer"
          title="Download"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => onDelete(f.id)}
          title="Delete"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
