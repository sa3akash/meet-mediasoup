"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Download,
  Trash2,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { FilePreviewModal, type FileItem } from "./file-preview-modal";

interface FilesPanelProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (fileName: string, mimeType: string, base64Data: string) => Promise<any>;
  onFetchFiles: () => Promise<any>;
  onDeleteFile: (fileId: string) => Promise<any>;
  remoteFiles?: FileItem[];
}

export const FilesPanel: React.FC<FilesPanelProps> = ({
  meetingId,
  isOpen,
  onClose,
  onUploadFile,
  onFetchFiles,
  onDeleteFile,
  remoteFiles = [],
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load files on open
  useEffect(() => {
    if (!isOpen) return;
    onFetchFiles()
      .then((res) => {
        if (res?.files && Array.isArray(res.files)) {
          setFiles(res.files);
        }
      })
      .catch(() => {});
  }, [isOpen, onFetchFiles]);

  // Sync incoming remote files
  useEffect(() => {
    if (remoteFiles && remoteFiles.length > 0) {
      setFiles((prev) => {
        const map = new Map<string, FileItem>();
        prev.forEach((f) => map.set(f.id, f));
        remoteFiles.forEach((f) => map.set(f.id, f));
        return Array.from(map.values());
      });
    }
  }, [remoteFiles]);

  if (!isOpen) return null;

  const processFileUpload = async (selectedFile: File) => {
    setIsUploading(true);
    try {
      // Direct REST upload to meeting API endpoint
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("displayName", "Me");

      const res = await fetch(`http://localhost:4000/api/files/${meetingId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.file) {
          setFiles((prev) => [data.file, ...prev]);
        }
      } else {
        // Fallback to base64 via WebSocket
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          const uploadRes = await onUploadFile(
            selectedFile.name,
            selectedFile.type || "application/octet-stream",
            base64
          );
          if (uploadRes?.file) {
            setFiles((prev) => [uploadRes.file, ...prev]);
          }
        };
        reader.readAsDataURL(selectedFile);
      }
    } catch (err) {
      console.error("[FilesPanel] Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFileUpload(e.target.files[0]);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (confirm("Delete this shared file from the meeting?")) {
      await onDeleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  const filteredFiles = files.filter((f) =>
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-indigo-400" />;
    if (mimeType.startsWith("video/")) return <Film className="w-5 h-5 text-purple-400" />;
    if (mimeType.includes("pdf") || mimeType.includes("document")) {
      return <FileText className="w-5 h-5 text-blue-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Meeting Files</h3>
              <p className="text-xs text-slate-400">Documents, images, & recordings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div className="p-4 border-b border-slate-800/80">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
              onChange={handleFileInputChange}
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

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shared files..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No files shared in this meeting yet.
            </div>
          ) : (
            filteredFiles.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between gap-3 transition-colors group"
              >
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

                {/* Right badges & actions */}
                <div className="flex items-center gap-1">
                  {/* Virus scan badge */}
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

                  {/* Preview Button */}
                  <button
                    onClick={() => setPreviewFile(f)}
                    title="Preview file"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Download Button */}
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

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(f.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
};
