import {
  LocalRecorderOptions,
  getSupportedMimeType,
  createMixedAudioStream,
} from "./recorder-audio-helper";
import {
  createCanvasCompositeStream,
  triggerDownload,
} from "./recorder-canvas-helper";

export type { LocalRecordingType, LocalRecorderOptions } from "./recorder-audio-helper";

export class LocalRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private timerInterval: any = null;
  private canvasCleanup: (() => void) | null = null;
  private secondsRecorded: number = 0;
  private audioContextRef: { current: AudioContext | null } = { current: null };
  private isRecording: boolean = false;
  private capturedScreenTracks: MediaStreamTrack[] = [];

  constructor(private options: LocalRecorderOptions) {}

  public async start(): Promise<void> {
    this.recordedChunks = [];
    this.secondsRecorded = 0;

    try {
      const stream = await this.prepareMediaStream();
      if (!stream || stream.getTracks().length === 0) {
        throw new Error("No media tracks available for recording. Please allow audio/video access.");
      }

      const isAudioOnly = this.options.recordType === "AUDIO_ONLY";
      const mimeType = getSupportedMimeType(isAudioOnly);

      try {
        this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      } catch {
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
        const blob = new Blob(this.recordedChunks, { type: finalMime.split(";")[0] });
        const url = URL.createObjectURL(blob);

        triggerDownload(url, blob);
        if (this.options.onStop) this.options.onStop(url, blob);
      };

      this.mediaRecorder.start(1000);
      this.isRecording = true;

      this.timerInterval = setInterval(() => {
        this.secondsRecorded += 1;
        if (this.options.onDurationUpdate) {
          this.options.onDurationUpdate(this.secondsRecorded);
        }
      }, 1000);
    } catch (err) {
      this.cleanup();
      throw err;
    }
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
    const mixedAudio = await createMixedAudioStream(
      this.options.localStream,
      this.options.remoteStreams,
      this.audioContextRef
    );

    if (this.options.recordType === "AUDIO_ONLY") return mixedAudio;

    // COMBINED: Record actual meeting screen / browser tab with full HD video and mixed audio
    if (this.options.recordType === "COMBINED") {
      try {
        const displayMediaOptions: any = {
          video: {
            displaySurface: "browser",
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          preferCurrentTab: true,
          selfBrowserSurface: "include",
          systemAudio: "include",
        };

        const screen = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        if (screen && screen.getVideoTracks().length > 0) {
          this.capturedScreenTracks.push(...screen.getTracks());
          const composite = new MediaStream();
          const videoTrack = screen.getVideoTracks()[0];
          composite.addTrack(videoTrack);
          videoTrack.addEventListener("ended", () => this.stop());

          if (screen.getAudioTracks().length > 0 && this.audioContextRef.current) {
            try {
              const ctx = this.audioContextRef.current;
              const dest = ctx.createMediaStreamDestination();
              const screenSrc = ctx.createMediaStreamSource(new MediaStream([screen.getAudioTracks()[0]]));
              screenSrc.connect(dest);
              mixedAudio.getAudioTracks().forEach((t) => {
                try {
                  const micSrc = ctx.createMediaStreamSource(new MediaStream([t]));
                  micSrc.connect(dest);
                } catch {}
              });
              dest.stream.getAudioTracks().forEach((t) => composite.addTrack(t));
              return composite;
            } catch {}
          }

          mixedAudio.getAudioTracks().forEach((t) => composite.addTrack(t));
          return composite;
        }
      } catch (err: any) {
        console.warn("[LocalRecorder] Screen capture prompt dismissed, falling back to layout canvas:", err);
      }
    }

    // SCREEN_ONLY: Record active screen presentation if ongoing, else prompt display media
    if (this.options.recordType === "SCREEN_ONLY") {
      let screen = this.options.screenStream;
      if (!screen) {
        for (const rem of this.options.remoteStreams.values()) {
          if (rem.screenStream) {
            screen = rem.screenStream;
            break;
          }
        }
      }

      if (!screen) {
        try {
          screen = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true,
          });
          if (screen) {
            this.capturedScreenTracks.push(...screen.getTracks());
          }
        } catch {}
      }

      if (screen && screen.getVideoTracks().length > 0) {
        const composite = new MediaStream();
        const videoTrack = screen.getVideoTracks()[0];
        composite.addTrack(videoTrack);
        videoTrack.addEventListener("ended", () => this.stop());
        mixedAudio.getAudioTracks().forEach((t) => composite.addTrack(t));
        return composite;
      }
    }

    // VIDEO_ONLY or fallback: composite layout canvas
    const { canvasStream, cleanup } = createCanvasCompositeStream(
      mixedAudio,
      this.options.meetingTitle || "Meet Recording",
      () => this.isRecording,
      () => {}
    );
    this.canvasCleanup = cleanup;
    return canvasStream;
  }

  private cleanup(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.canvasCleanup) this.canvasCleanup();
    this.capturedScreenTracks.forEach((t) => {
      try {
        t.stop();
      } catch {}
    });
    this.capturedScreenTracks = [];
    if (this.audioContextRef.current) {
      try {
        this.audioContextRef.current.close();
      } catch {}
    }
  }
}
