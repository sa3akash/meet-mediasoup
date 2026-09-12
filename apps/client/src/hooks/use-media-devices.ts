"use client";

import { useState, useEffect, useCallback } from "react";

export interface MediaDeviceItem {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

export interface UseMediaDevicesResult {
  audioInputs: MediaDeviceItem[];
  audioOutputs: MediaDeviceItem[];
  videoInputs: MediaDeviceItem[];
  selectedAudioInputId: string;
  selectedAudioOutputId: string;
  selectedVideoInputId: string;
  setSelectedAudioInputId: (id: string) => void;
  setSelectedAudioOutputId: (id: string) => void;
  setSelectedVideoInputId: (id: string) => void;
  refreshDevices: () => Promise<void>;
  hasPermissions: boolean;
}

export function useMediaDevices(): UseMediaDevicesResult {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceItem[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceItem[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceItem[]>([]);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState("");
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState("");
  const [selectedVideoInputId, setSelectedVideoInputId] = useState("");
  const [hasPermissions, setHasPermissions] = useState(false);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const aIns: MediaDeviceItem[] = [];
      const aOuts: MediaDeviceItem[] = [];
      const vIns: MediaDeviceItem[] = [];

      let hasLabels = false;
      devices.forEach((d) => {
        if (d.label) hasLabels = true;
        const item: MediaDeviceItem = {
          deviceId: d.deviceId,
          label: d.label || `${d.kind} (${d.deviceId.slice(0, 5)}...)`,
          kind: d.kind,
          groupId: d.groupId,
        };
        if (d.kind === "audioinput") aIns.push(item);
        else if (d.kind === "audiooutput") aOuts.push(item);
        else if (d.kind === "videoinput") vIns.push(item);
      });

      setHasPermissions(hasLabels);
      setAudioInputs(aIns);
      setAudioOutputs(aOuts);
      setVideoInputs(vIns);

      if (!selectedAudioInputId && aIns.length > 0) setSelectedAudioInputId(aIns[0].deviceId);
      if (!selectedAudioOutputId && aOuts.length > 0) setSelectedAudioOutputId(aOuts[0].deviceId);
      if (!selectedVideoInputId && vIns.length > 0) setSelectedVideoInputId(vIns[0].deviceId);
    } catch (err) {
      console.warn("[useMediaDevices] Failed to enumerate devices:", err);
    }
  }, [selectedAudioInputId, selectedAudioOutputId, selectedVideoInputId]);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  return {
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInputId,
    selectedAudioOutputId,
    selectedVideoInputId,
    setSelectedAudioInputId,
    setSelectedAudioOutputId,
    setSelectedVideoInputId,
    refreshDevices,
    hasPermissions,
  };
}
