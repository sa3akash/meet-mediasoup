import type { RtpEncodingParameters } from "mediasoup-client/lib/types";

export function getSimulcastEncodings(): RtpEncodingParameters[] {
  return [
    {
      rid: "r0",
      maxBitrate: 150000,
      scaleResolutionDownBy: 4,
      maxFramerate: 15,
    },
    {
      rid: "r1",
      maxBitrate: 600000,
      scaleResolutionDownBy: 2,
      maxFramerate: 24,
    },
    {
      rid: "r2",
      maxBitrate: 2500000,
      scaleResolutionDownBy: 1,
      maxFramerate: 30,
    },
  ];
}

export function getSvcEncodings(codec: "VP9" | "AV1" = "VP9"): RtpEncodingParameters[] {
  return [
    {
      maxBitrate: 2500000,
      scalabilityMode: "L3T3",
      maxFramerate: 30,
    },
  ];
}

export function getVideoEncodings(codecMimeType?: string): RtpEncodingParameters[] {
  const mime = codecMimeType?.toLowerCase() || "";
  if (mime.includes("vp9") || mime.includes("av1")) {
    return getSvcEncodings(mime.includes("av1") ? "AV1" : "VP9");
  }
  return getSimulcastEncodings();
}
