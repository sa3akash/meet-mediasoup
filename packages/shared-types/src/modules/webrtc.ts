export type MediaKind = "audio" | "video";
export type MediaSourceType = "mic" | "webcam" | "screen-video" | "screen-audio";

export interface RtpCapabilities {
  codecs?: any[];
  headerExtensions?: any[];
}

export interface RtpParameters {
  mid?: string;
  codecs: any[];
  headerExtensions?: any[];
  encodings?: any[];
  rtcp?: any;
}

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}

export interface SignalingRequest<T = any> {
  id: string;
  method: string;
  data: T;
}

export interface SignalingResponse<T = any> {
  id: string;
  ok: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface SignalingNotification<T = any> {
  event: string;
  data: T;
}

export interface JoinMeetingPayload {
  meetingId: string;
  displayName: string;
  avatarUrl?: string;
  rtpCapabilities: RtpCapabilities;
  passcode?: string;
}

export interface CreateTransportPayload {
  direction: "send" | "recv";
  sctpCapabilities?: any;
}

export interface ConnectTransportPayload {
  transportId: string;
  dtlsParameters: any;
}

export interface ProducePayload {
  transportId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  appData: {
    source: MediaSourceType;
    [key: string]: any;
  };
}

export interface ConsumePayload {
  producerId: string;
  rtpCapabilities: RtpCapabilities;
}

export interface ActiveSpeakerEvent {
  participantId: string;
  volume: number;
}
