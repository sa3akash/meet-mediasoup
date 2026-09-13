export function createCanvasCompositeStream(
  mixedAudio: MediaStream,
  meetingTitle: string,
  isRecordingFn: () => boolean,
  onAnimId: (id: number) => void
): { canvasStream: MediaStream; cleanup: () => void } {
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, 1920, 1080);

  const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();
  mixedAudio.getAudioTracks().forEach((t) => canvasStream.addTrack(t));

  let animId: number | null = null;
  let animInterval: any = null;
  const startTime = Date.now();

  const draw = () => {
    if (!isRecordingFn()) return;
    const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsedSecs / 60)).padStart(2, "0");
    const secs = String(elapsedSecs % 60).padStart(2, "0");

    // Dark background
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, 1920, 1080);

    // Header bar
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, 1920, 70);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(meetingTitle || "Google Meet Session", 40, 44);

    // Red Recording badge & live timer
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(1780, 35, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f87171";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`REC ${mins}:${secs}`, 1800, 42);

    // Collect all active video elements on page
    const videos = Array.from(document.querySelectorAll("video")).filter(
      (v) => v.readyState >= 2 && v.videoWidth > 0
    );

    const stageX = 30;
    const stageY = 90;
    const stageW = 1860;
    const stageH = 960;

    if (videos.length === 1) {
      const vid = videos[0];
      const aspect = (vid.videoWidth || 16) / (vid.videoHeight || 9);
      let drawW = stageW;
      let drawH = drawW / aspect;
      if (drawH > stageH) {
        drawH = stageH;
        drawW = drawH * aspect;
      }
      const offsetX = stageX + (stageW - drawW) / 2;
      const offsetY = stageY + (stageH - drawH) / 2;

      try {
        ctx.save();
        ctx.drawImage(vid, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      } catch {}
    } else if (videos.length > 1) {
      const cols = videos.length <= 2 ? 2 : videos.length <= 4 ? 2 : videos.length <= 6 ? 3 : 4;
      const rows = Math.ceil(videos.length / cols);
      const gap = 16;
      const tileW = (stageW - gap * (cols - 1)) / cols;
      const tileH = (stageH - gap * (rows - 1)) / rows;

      videos.forEach((vid, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        const x = stageX + c * (tileW + gap);
        const y = stageY + r * (tileH + gap);

        ctx.fillStyle = "#1e1e24";
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(x, y, tileW, tileH, 12);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, tileW, tileH);
        }

        try {
          ctx.save();
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, tileW, tileH, 12);
          else ctx.rect(x, y, tileW, tileH);
          ctx.clip();
          ctx.drawImage(vid, x, y, tileW, tileH);
          ctx.restore();
        } catch {}
      });
    } else {
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") ctx.roundRect(stageX, stageY, stageW, stageH, 16);
      else ctx.fillRect(stageX, stageY, stageW, stageH);
      ctx.fill();

      ctx.fillStyle = "#71717a";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Active Meeting Session — Audio & Participants Recording", 1920 / 2, 1080 / 2);
      ctx.textAlign = "left";
    }

    animId = requestAnimationFrame(draw);
    onAnimId(animId);
  };

  draw();

  animInterval = setInterval(() => {
    if (document.hidden && isRecordingFn()) {
      draw();
    }
  }, 100);

  return {
    canvasStream,
    cleanup: () => {
      if (animId) cancelAnimationFrame(animId);
      if (animInterval) clearInterval(animInterval);
    },
  };
}

export function triggerDownload(url: string, blob: Blob): void {
  const ext = blob.type.includes("mp4") ? "mp4" : "webm";
  const filename = `google-meet-recording-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.${ext}`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {}
  }, 1000);
}
