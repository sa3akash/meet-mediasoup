export type LocalRecordingType = "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY";

export interface LocalRecorderOptions {
  recordType: LocalRecordingType;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Map<
    string,
    { audioStream?: MediaStream; videoStream?: MediaStream; screenStream?: MediaStream; stream?: MediaStream } | any
  >;
  meetingTitle?: string;
  onDurationUpdate?: (seconds: number) => void;
  onStop?: (downloadUrl: string, blob: Blob) => void;
}

function getSupportedMimeType(isAudioOnly: boolean): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  const audioTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  const videoTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1,mp4a",
    "video/mp4",
  ];

  const candidates = isAudioOnly ? audioTypes : videoTypes;
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "";
}

export class LocalRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private timerInterval: any = null;
  private animInterval: any = null;
  private secondsRecorded: number = 0;
  private compositeCanvas: HTMLCanvasElement | null = null;
  private canvasAnimId: number | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording: boolean = false;

  constructor(private options: LocalRecorderOptions) {}

  public async start(): Promise<void> {
    this.recordedChunks = [];
    this.secondsRecorded = 0;

    const stream = await this.prepareMediaStream();
    if (!stream || stream.getTracks().length === 0) {
      throw new Error("No media tracks available for recording. Please allow audio/video access.");
    }

    const isAudioOnly = this.options.recordType === "AUDIO_ONLY";
    const mimeType = getSupportedMimeType(isAudioOnly);

    try {
      this.mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
    } catch {
      // Fallback: use default browser settings without explicit mimeType
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.cleanup();
      const finalMime = mimeType || (isAudioOnly ? "audio/webm" : "video/webm");
      const blob = new Blob(this.recordedChunks, {
        type: finalMime.split(";")[0],
      });
      const url = URL.createObjectURL(blob);

      // Auto-download file to user device
      this.triggerDownload(url, blob);

      if (this.options.onStop) {
        this.options.onStop(url, blob);
      }
    };

    this.mediaRecorder.start(1000); // Record in 1s slices
    this.isRecording = true;

    this.timerInterval = setInterval(() => {
      this.secondsRecorded += 1;
      if (this.options.onDurationUpdate) {
        this.options.onDurationUpdate(this.secondsRecorded);
      }
    }, 1000);
  }

  public stop(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      try {
        if (this.mediaRecorder.state !== "inactive") {
          this.mediaRecorder.requestData();
          this.mediaRecorder.stop();
        }
      } catch (err) {
        console.warn("[LocalRecorder] Stop error:", err);
      }
    }
  }

  public getDuration(): number {
    return this.secondsRecorded;
  }

  private async prepareMediaStream(): Promise<MediaStream> {
    const mixedAudio = await this.createMixedAudioStream();

    if (this.options.recordType === "AUDIO_ONLY") {
      return mixedAudio;
    }

    if (this.options.recordType === "SCREEN_ONLY" || this.options.recordType === "COMBINED") {
      let screen = this.options.screenStream;
      if (!screen) {
        for (const rem of this.options.remoteStreams.values()) {
          if (rem.screenStream) {
            screen = rem.screenStream;
            break;
          }
        }
      }

      // Prompt to capture screen or browser tab if no active screen stream or for combined meeting recording
      if (!screen) {
        try {
          screen = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: "browser",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            } as any,
            audio: true,
          });
        } catch (e) {
          console.warn("[LocalRecorder] getDisplayMedia cancelled or unavailable, falling back to canvas:", e);
        }
      }

      if (screen && screen.getVideoTracks().length > 0) {
        const composite = new MediaStream();
        const videoTrack = screen.getVideoTracks()[0];
        composite.addTrack(videoTrack);

        // Mix screen audio if present
        screen.getAudioTracks().forEach((t) => {
          try {
            if (this.audioContext) {
              const src = this.audioContext.createMediaStreamSource(new MediaStream([t]));
              const dest = this.audioContext.createMediaStreamDestination();
              src.connect(dest);
            }
          } catch {}
        });

        // Automatically stop recording if the user ends screen sharing
        videoTrack.addEventListener("ended", () => {
          this.stop();
        });

        mixedAudio.getAudioTracks().forEach((t) => composite.addTrack(t));
        return composite;
      }
    }

    if (this.options.recordType === "VIDEO_ONLY") {
      if (this.options.localStream && this.options.localStream.getVideoTracks().length > 0) {
        const composite = new MediaStream();
        this.options.localStream.getVideoTracks().forEach((t) => composite.addTrack(t));
        mixedAudio.getAudioTracks().forEach((t) => composite.addTrack(t));
        return composite;
      }
    }

    // Fallback: Canvas composite with active video tiles & mixed audio
    return this.createCanvasCompositeStream(mixedAudio);
  }

  private async createMixedAudioStream(): Promise<MediaStream> {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume().catch(() => {});
      }

      const dest = this.audioContext.createMediaStreamDestination();

      // Ensure audio track always has data by adding silent carrier oscillator
      const silentOsc = this.audioContext.createOscillator();
      const silentGain = this.audioContext.createGain();
      silentGain.gain.value = 0.0001; // silent signal to keep WebRTC / MediaRecorder encoder active
      silentOsc.connect(silentGain);
      silentGain.connect(dest);
      silentOsc.start();

      // Mix local microphone audio
      if (this.options.localStream) {
        const audioTracks = this.options.localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const src = this.audioContext.createMediaStreamSource(
              new MediaStream([audioTracks[0]])
            );
            src.connect(dest);
          } catch {}
        }
      }

      // Mix all remote attendee audio streams
      this.options.remoteStreams.forEach((peer: any) => {
        const audioStream = peer.audioStream || peer.stream;
        if (audioStream) {
          const audioTracks = audioStream.getAudioTracks();
          if (audioTracks.length > 0 && this.audioContext) {
            try {
              const src = this.audioContext.createMediaStreamSource(
                new MediaStream([audioTracks[0]])
              );
              src.connect(dest);
            } catch {}
          }
        }
      });

      return dest.stream;
    } catch {
      return this.options.localStream || new MediaStream();
    }
  }

  private createCanvasCompositeStream(mixedAudio: MediaStream): MediaStream {
    this.compositeCanvas = document.createElement("canvas");
    this.compositeCanvas.width = 1280;
    this.compositeCanvas.height = 720;
    const ctx = this.compositeCanvas.getContext("2d")!;

    // Initial immediate paint
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(this.options.meetingTitle || "Meet Recording", 30, 45);

    const canvasStream = (this.compositeCanvas as any).captureStream(30);
    mixedAudio.getAudioTracks().forEach((t) => canvasStream.addTrack(t));

    const draw = () => {
      if (!this.isRecording) return;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 1280, 720);

      // Header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(this.options.meetingTitle || "Meeting Recording", 30, 45);

      // Pulsing red REC indicator
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(1240, 35, 9, 0, Math.PI * 2);
      ctx.fill();

      // Find any videos
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
        // Fallback tile
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

      this.canvasAnimId = requestAnimationFrame(draw);
    };

    draw();

    // Fallback timer for background tabs where requestAnimationFrame is paused
    this.animInterval = setInterval(() => {
      if (document.hidden && this.isRecording) {
        draw();
      }
    }, 100);

    return canvasStream;
  }

  private triggerDownload(url: string, blob: Blob): void {
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

  private cleanup(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.animInterval) clearInterval(this.animInterval);
    if (this.canvasAnimId) cancelAnimationFrame(this.canvasAnimId);
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
    }
  }
}
