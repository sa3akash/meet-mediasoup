import React, { useRef, useEffect } from "react";

export function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((err) => {
        console.warn("[Audio] Autoplay blocked:", err);
      });
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
