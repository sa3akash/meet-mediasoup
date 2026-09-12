import type { types } from "mediasoup-client";

export class ConnectionRecoveryManager {
  private sendRequest: (method: string, data?: any) => Promise<any>;

  constructor(sendRequest: (method: string, data?: any) => Promise<any>) {
    this.sendRequest = sendRequest;
  }

  public bindTransportIceRecovery(transport: types.Transport): void {
    transport.on("connectionstatechange", async (state: string) => {
      if (state === "failed" || state === "disconnected") {
        console.warn(`[Recovery] Transport ${transport.id} ${state}, initiating ICE restart...`);
        try {
          const { iceParameters } = await this.sendRequest("webrtc:restartIce", {
            transportId: transport.id,
          });
          await transport.restartIce({ iceParameters });
          console.log(`[Recovery] ICE restart successful for ${transport.id}`);
        } catch (err) {
          console.error(`[Recovery] ICE restart failed for ${transport.id}:`, err);
        }
      }
    });
  }

  public setupNetworkRecovery(onReconnect: () => void): () => void {
    const handleOnline = () => {
      console.log("[Recovery] Network online restored, triggering session reconnect...");
      onReconnect();
    };

    window.addEventListener("online", handleOnline);

    const nav = navigator as any;
    if (nav.connection) {
      nav.connection.addEventListener("change", handleOnline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      if (nav.connection) {
        nav.connection.removeEventListener("change", handleOnline);
      }
    };
  }

  public setupDeviceHotplugRecovery(producers: Map<string, types.Producer>): () => void {
    const handleDeviceChange = async () => {
      console.log("[Recovery] Media device change detected (hotplug/unplug)");
      try {
        const audioProducer = producers.get("audio");
        if (audioProducer && !audioProducer.closed) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const newTrack = stream.getAudioTracks()[0];
          if (newTrack) {
            await audioProducer.replaceTrack({ track: newTrack });
            console.log("[Recovery] Hotplug audio track seamlessly replaced");
          }
        }

        const videoProducer = producers.get("video");
        if (videoProducer && !videoProducer.closed) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newTrack = stream.getVideoTracks()[0];
          if (newTrack) {
            await videoProducer.replaceTrack({ track: newTrack });
            console.log("[Recovery] Hotplug video track seamlessly replaced");
          }
        }
      } catch (err) {
        console.warn("[Recovery] Device recovery track replacement warning:", err);
      }
    };

    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
    };
  }
}
