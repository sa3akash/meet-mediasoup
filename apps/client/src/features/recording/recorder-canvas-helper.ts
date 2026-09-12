export function createCanvasCompositeStream(
  mixedAudio: MediaStream,
  meetingTitle: string,
  isRecordingFn: () => boolean,
  onAnimId: (id: number) => void
): { canvasStream: MediaStream; cleanup: () => void } {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(meetingTitle || "Meet Recording", 30, 45);

  const canvasStream = (canvas as any).captureStream(30);
  mixedAudio.getAudioTracks().forEach((t) => canvasStream.addTrack(t));

  let animId: number | null = null;
  let animInterval: any = null;

  const draw = () => {
    if (!isRecordingFn()) return;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(meetingTitle || "Meeting Recording", 30, 45);

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(1240, 35, 9, 0, Math.PI * 2);
    ctx.fill();

    const videos = Array.from(document.querySelectorAll("video")).filter(
      (v) => v.readyState >= 2 && v.videoWidth > 0
    );

    if (videos.length === 1) {
      ctx.drawImage(videos[0], 0, 60, 1280, 660);
    } else if (videos.length > 1) {
      const cols = videos.length <= 4 ? 2 : 3;
      const rows = Math.ceil(videos.length / cols);
      const w = 1280 / cols;
      const h = 660 / rows;
      videos.forEach((vid, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        ctx.drawImage(vid, c * w, 60 + r * h, w, h);
      });
    } else {
      ctx.fillStyle = "#1e293b";
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(40, 70, 1200, 610, 16);
        ctx.fill();
      } else {
        ctx.fillRect(40, 70, 1200, 610);
      }
      ctx.fillStyle = "#94a3b8";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Active Meeting Session - Recording Audio & Layout", 640, 375);
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
  const filename = `meeting-record-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.${ext}`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}
