'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface DeviceTestState {
  videoStream: MediaStream | null;
  audioLevel: number; // 0-100
  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  hasPermission: boolean;
  error: string | null;
}

export function useDeviceTest() {
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
    } catch (e) {
      console.error('Failed to enumerate devices:', e);
    }
  }, []);

  // Start camera + mic preview
  const startPreview = useCallback(async (audioDeviceId?: string, videoDeviceId?: string) => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: videoDeviceId
          ? { deviceId: { exact: videoDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setVideoStream(stream);
      setHasPermission(true);
      setError(null);

      // Set up audio level monitoring
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Enumerate after getting permission
      await enumerateDevices();
    } catch (e: any) {
      setError(e.message || 'Kamera/mikrofon erişimi başarısız');
      setHasPermission(false);
    }
  }, [enumerateDevices]);

  // Change device
  const changeAudioDevice = useCallback(async (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    await startPreview(deviceId, selectedVideoDevice || undefined);
  }, [startPreview, selectedVideoDevice]);

  const changeVideoDevice = useCallback(async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    await startPreview(selectedAudioDevice || undefined, deviceId);
  }, [startPreview, selectedAudioDevice]);

  // Stop everything
  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setVideoStream(null);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  return {
    videoStream,
    audioLevel,
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    hasPermission,
    error,
    startPreview,
    stopPreview,
    changeAudioDevice,
    changeVideoDevice,
  };
}
