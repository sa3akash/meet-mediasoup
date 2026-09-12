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

      if (!screen) {
        try {
          screen = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "browser", width: { ideal: 1920 }, height: { ideal: 1080 } } as any,
            audio: true,
          });
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

    if (this.options.recordType === "VIDEO_ONLY" && this.options.localStream?.getVideoTracks().length) {
      const composite = new MediaStream();
      this.options.localStream.getVideoTracks().forEach((t) => composite.addTrack(t));
      mixedAudio.getAudioTracks().forEach((t) => composite.addTrack(t));
      return composite;
    }

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
    if (this.audioContextRef.current) {
      try {
        this.audioContextRef.current.close();
      } catch {}
    }
  }
}
