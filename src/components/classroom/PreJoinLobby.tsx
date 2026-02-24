'use client';

import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { useDeviceTest } from '../../lib/hooks/use-device-test';
import { SessionPhase } from '../../lib/hooks/use-session-timer';

interface PreJoinLobbyProps {
  title: string;
  subtitle?: string;
  isMentor: boolean;
  sessionPhase: SessionPhase;
  formattedRemaining: string;
  onJoin: () => void;
  onBack: () => void;
  isRoomLive?: boolean; // For students: is the mentor's room already active?
}

export function PreJoinLobby({
  title,
  subtitle,
  isMentor,
  sessionPhase,
  formattedRemaining,
  onJoin,
  onBack,
  isRoomLive = false,
}: PreJoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const {
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
  } = useDeviceTest();

  // Start preview on mount
  useEffect(() => {
    startPreview();
  }, [startPreview]);

  // Attach video stream to video element
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Toggle video
  const toggleVideo = () => {
    if (videoStream) {
      videoStream.getVideoTracks().forEach(t => (t.enabled = !isVideoEnabled));
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  // Toggle audio
  const toggleAudio = () => {
    if (videoStream) {
      videoStream.getAudioTracks().forEach(t => (t.enabled = !isAudioEnabled));
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleJoin = () => {
    stopPreview();
    onJoin();
  };

  // Phase-based join button state
  const canJoin = isMentor
    ? sessionPhase !== 'not-started'
    : (isRoomLive && sessionPhase !== 'not-started');

  const getJoinButtonText = () => {
    if (isMentor) {
      if (sessionPhase === 'not-started') return 'Henüz çok erken';
      return 'Odayı Aktifleştir';
    }
    if (!isRoomLive) return 'Mentor Bekleniyor...';
    if (sessionPhase === 'not-started') return 'Henüz çok erken';
    return 'Derse Katıl';
  };

  const getTimerMessage = () => {
    switch (sessionPhase) {
      case 'not-started':
        return `Ders başlangıcına ${formattedRemaining} kaldı`;
      case 'early-join':
        return `Ders ${formattedRemaining} sonra başlayacak`;
      case 'active':
      case 'ending-soon':
        return 'Ders devam ediyor';
      case 'grace-period':
        return 'Uzatma süresi devam ediyor';
      case 'ended':
        return 'Ders süresi doldu';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
          <p className="text-gray-500 text-sm mt-2">{getTimerMessage()}</p>
        </div>

        {/* Video Preview */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
          {isVideoEnabled && videoStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                <VideoOff className="w-10 h-10 text-gray-500" />
              </div>
            </div>
          )}

          {/* Audio Level Indicator */}
          {isAudioEnabled && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1">
              <Mic className="w-4 h-4 text-green-400" />
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Permission Error */}
          {error && (
            <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center p-4">
              <p className="text-red-400 text-center text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        </div>

        {/* Device Selection */}
        {hasPermission && (audioDevices.length > 1 || videoDevices.length > 1) && (
          <div className="space-y-3">
            {audioDevices.length > 1 && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mikrofon</label>
                <select
                  value={selectedAudioDevice}
                  onChange={e => changeAudioDevice(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
                >
                  {audioDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || 'Mikrofon'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {videoDevices.length > 1 && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Kamera</label>
                <select
                  value={selectedVideoDevice}
                  onChange={e => changeVideoDevice(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
                >
                  {videoDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || 'Kamera'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 text-gray-300 border-gray-600">
            Geri Dön
          </Button>
          <Button
            onClick={handleJoin}
            disabled={!canJoin || !hasPermission}
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white"
          >
            {getJoinButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
}
