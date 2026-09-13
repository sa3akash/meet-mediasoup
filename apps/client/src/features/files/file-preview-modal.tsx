"use client";

import React from "react";
import { X, Download, FileText, Film, Image as ImageIcon } from "lucide-react";

export interface FileItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  fileUrl: string;
  uploaderName: string;
  scanStatus: "PENDING" | "CLEAN" | "INFECTED";
  createdAt: string;
}

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              {isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : isVideo ? (
                <Film className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white truncate max-w-md">
                {file.fileName}
              </h3>
              <p className="text-xs text-slate-400">
                Uploaded by {file.uploaderName} • {(file.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={file.fileUrl}
              download={file.fileName}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-[400px]">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-md"
            />
          ) : isVideo ? (
            <video
              src={file.fileUrl}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-lg shadow-md"
            />
          ) : isPdf ? (
            <iframe
              src={file.fileUrl}
              title={file.fileName}
              className="w-full h-[70vh] rounded-lg border border-slate-800"
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 text-sm font-medium">No inline preview available</p>
              <p className="text-slate-500 text-xs mt-1 mb-4">
                This document format cannot be rendered directly inside the browser.
              </p>
              <a
                href={file.fileUrl}
                download={file.fileName}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                <Download className="w-4 h-4" /> Download file to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
