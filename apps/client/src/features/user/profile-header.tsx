"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { PresenceSelector } from "./presence-selector";

interface ProfileHeaderProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    presenceStatus?: string;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [avatar, setAvatar] = useState(user.avatarUrl);
  const [cover, setCover] = useState(user.coverUrl);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    try {
      const res = await fetch(`${apiBase}/api/users/me/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        if (type === "avatar") setAvatar(data.avatarUrl);
        else setCover(data.coverUrl);
      }
    } catch (err) {
      console.warn(`Failed to upload ${type}:`, err);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-xl">
      {/* Cover Banner */}
      <div className="relative w-full h-44 bg-gradient-to-r from-indigo-900 via-neutral-900 to-indigo-950 flex items-center justify-center">
        {cover && <img src={cover} alt="Cover" className="w-full h-full object-cover" />}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs border border-white/10 flex items-center gap-1.5 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" /> Edit Cover
        </button>
        <input type="file" ref={coverInputRef} onChange={(e) => handleUpload(e, "cover")} accept="image/*" className="hidden" />
      </div>

      {/* Avatar & Profile Info */}
      <div className="px-8 pb-6 pt-0 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12">
        <div className="flex items-end gap-4">
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 border-4 border-neutral-900 flex items-center justify-center text-white text-3xl font-bold shadow-2xl overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <input type="file" ref={avatarInputRef} onChange={(e) => handleUpload(e, "avatar")} accept="image/*" className="hidden" />
          </div>

          <div className="mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{user.name}</h2>
            <p className="text-xs text-neutral-400">{user.email}</p>
          </div>
        </div>

        <div className="mb-2">
          <PresenceSelector initialStatus={(user.presenceStatus as any) || "ONLINE"} />
        </div>
      </div>
    </div>
  );
}
