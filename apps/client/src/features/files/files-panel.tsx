"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, X, Search } from "lucide-react";
import { FilePreviewModal, type FileItem } from "./file-preview-modal";
import { FileDropzone } from "./components/file-dropzone";
import { FileListItem } from "./components/file-list-item";
import { uploadMeetingFile } from "./file-upload-service";

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

  useEffect(() => {
    if (!isOpen) return;
    onFetchFiles().then((res) => {
      if (res?.files && Array.isArray(res.files)) setFiles(res.files);
    }).catch(() => {});
  }, [isOpen, onFetchFiles]);

  const [prevRemoteFiles, setPrevRemoteFiles] = useState<FileItem[]>([]);
  if (remoteFiles && remoteFiles !== prevRemoteFiles) {
    setPrevRemoteFiles(remoteFiles);
    if (remoteFiles.length) {
      setFiles((prev) => {
        const map = new Map<string, FileItem>();
        prev.forEach((f) => map.set(f.id, f));
        remoteFiles.forEach((f) => map.set(f.id, f));
        return Array.from(map.values());
      });
    }
  }

  if (!isOpen) return null;

  const processFileUpload = async (selectedFile: File) => {
    setIsUploading(true);
    try {
      const newFile = await uploadMeetingFile(meetingId, selectedFile, onUploadFile);
      if (newFile) setFiles((prev) => [newFile, ...prev]);
    } catch (err) {
      console.error("[FilesPanel] Upload failed:", err);
    } finally {
      setIsUploading(false);
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

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
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
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <FileDropzone
          fileInputRef={fileInputRef}
          isDragging={isDragging}
          isUploading={isUploading}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) await processFileUpload(e.dataTransfer.files[0]);
          }}
          onFileInputChange={async (e) => {
            if (e.target.files?.[0]) await processFileUpload(e.target.files[0]);
          }}
        />

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

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No files shared in this meeting yet.
            </div>
          ) : (
            filteredFiles.map((f) => (
              <FileListItem
                key={f.id}
                file={f}
                onPreview={setPreviewFile}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
};
