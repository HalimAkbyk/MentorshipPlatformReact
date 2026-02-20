'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroupClass } from '@/lib/hooks/use-classes';
import { videoApi } from '@/lib/api/video';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function StudentGroupClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const { data: groupClass } = useGroupClass(classId);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingForHost, setWaitingForHost] = useState(true);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const roomRef = useRef<any>(null);
  const rawVideoTrackRef = useRef<any>(null);
  const rawAudioTrackRef = useRef<any>(null);
  const joinAttemptRef = useRef(0);

  const roomName = `group-class-${classId}`;

  // Duration timer (only when connected)
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => setDuration(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Calculate grid columns based on total participants
  const getGridClass = useCallback((total: number) => {
    if (total <= 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (total === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (total <= 4) return 'grid-cols-2 max-w-5xl mx-auto';
    if (total <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (total <= 9) return 'grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  }, []);

  // ─── Local preview helpers ───
  const clearLocalContainerVideos = () => {
    if (!localVideoRef.current) return;
    localVideoRef.current.querySelectorAll('video').forEach(v => v.remove());
  };

  const attachLocalPreview = useCallback((videoTrack: any) => {
    if (!localVideoRef.current || !videoTrack) return;
    clearLocalContainerVideos();
    const el = videoTrack.attach() as HTMLVideoElement;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.objectFit = 'cover';
    el.muted = true;
    el.playsInline = true;
    el.autoplay = true;
    localVideoRef.current.appendChild(el);
  }, []);

  // ─── Full disconnect ───
  const fullDisconnect = useCallback(() => {
    try { roomRef.current?.disconnect(); } catch {}
    roomRef.current = null;
    setIsConnected(false);
    try { rawVideoTrackRef.current?.stop?.(); } catch {}
    try { rawAudioTrackRef.current?.stop?.(); } catch {}
    rawVideoTrackRef.current = null;
    rawAudioTrackRef.current = null;
    clearLocalContainerVideos();
    // Clean up remote participant containers
    participantsRef.current.forEach((container) => {
      try { container.remove(); } catch {}
    });
    participantsRef.current.clear();
  }, []);

  // ─── Remote track attachment ───
  const attachRemoteTrack = useCallback((track: any, participant: any) => {
    if (!gridRef.current) return;
    if (track.kind === 'video') {
      let container = participantsRef.current.get(participant.sid);
      if (!container) {
        container = document.createElement('div');
        container.className = 'relative aspect-video bg-gray-800 rounded-lg overflow-hidden';
        const nameLabel = document.createElement('div');
        nameLabel.className = 'absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded z-10';
        nameLabel.textContent = participant.identity?.split('|')[1] || 'Katılımcı';
        container.appendChild(nameLabel);
        gridRef.current!.appendChild(container);
        participantsRef.current.set(participant.sid, container);
      }
      const el = track.attach() as HTMLVideoElement;
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.objectFit = 'cover';
      el.playsInline = true;
      el.autoplay = true;
      container.insertBefore(el, container.firstChild);
    } else if (track.kind === 'audio') {
      const el = track.attach() as HTMLMediaElement;
      el.style.display = 'none';
      document.body.appendChild(el);
    }
  }, []);

  // ─── Participant handlers ───
  const handleParticipantConnected = useCallback((participant: any) => {
    const displayName = participant.identity?.split('|')[1] || 'Katılımcı';
    toast.success(`${displayName} derse katıldı`);

    participant.tracks.forEach((pub: any) => {
      if (pub.isSubscribed && pub.track) {
        attachRemoteTrack(pub.track, participant);
      }
    });
    participant.on('trackSubscribed', (track: any) => {
      attachRemoteTrack(track, participant);
    });
    participant.on('trackUnsubscribed', (track: any) => {
      try {
        const els = track.detach?.() ?? [];
        els.forEach((el: any) => { try { el.remove(); } catch {} });
      } catch {}
    });
  }, [attachRemoteTrack]);

  const handleParticipantDisconnected = useCallback((participant: any) => {
    const displayName = participant.identity?.split('|')[1] || 'Katılımcı';
    toast.info(`${displayName} dersten ayrıldı`);
    const container = participantsRef.current.get(participant.sid);
    if (container) {
      container.remove();
      participantsRef.current.delete(participant.sid);
    }
  }, []);

  // ─── Connect to Room ───
  const connectToRoom = useCallback(async () => {
    const attemptId = ++joinAttemptRef.current;
    if (isConnecting) return;
    try {
      setIsConnecting(true);
      setWaitingForHost(false);
      console.log('🎬 Student joining group class room:', classId);

      // Get token (isHost=false for student)
      const tokenResult = await videoApi.getToken({
        roomName,
        isHost: false,
      });

      // Dynamic import Twilio Video
      const TwilioVideo = (await import('twilio-video')).default;
      const { createLocalTracks } = await import('twilio-video');

      // Create local tracks properly (like 1-1 classroom)
      const localTracks = await createLocalTracks({
        audio: true,
        video: { width: 640, height: 480 },
      });

      const audioTrack = localTracks.find((t: any) => t.kind === 'audio');
      const videoTrack = localTracks.find((t: any) => t.kind === 'video');

      if (joinAttemptRef.current !== attemptId) {
        localTracks.forEach((t: any) => { try { t.stop?.(); } catch {} });
        return;
      }

      // Connect to Twilio room with pre-created tracks
      const twilioRoom = await TwilioVideo.connect(tokenResult.token, {
        name: roomName,
        tracks: localTracks,
      });

      if (joinAttemptRef.current !== attemptId) {
        try { twilioRoom.disconnect(); } catch {}
        localTracks.forEach((t: any) => { try { t.stop?.(); } catch {} });
        return;
      }

      roomRef.current = twilioRoom;
      rawAudioTrackRef.current = audioTrack;
      rawVideoTrackRef.current = videoTrack;
      setIsConnected(true);

      // Attach local video preview
      attachLocalPreview(videoTrack);

      // Handle existing and new participants
      const updateCount = () => {
        setParticipantCount(twilioRoom.participants.size + 1);
      };

      twilioRoom.participants.forEach((p: any) => handleParticipantConnected(p));
      twilioRoom.on('participantConnected', (p: any) => {
        handleParticipantConnected(p);
        updateCount();
      });
      twilioRoom.on('participantDisconnected', (p: any) => {
        handleParticipantDisconnected(p);
        updateCount();
      });

      // If mentor disconnects / room ends
      twilioRoom.on('disconnected', () => {
        toast.info('Ders sonlandırıldı');
        fullDisconnect();
      });

      updateCount();
      toast.success('Derse katıldınız!');
    } catch (e: any) {
      console.error('❌ Room join error:', e);
      toast.error('Bağlantı hatası: ' + (e?.message ?? ''));
      // If connection fails, go back to waiting
      setWaitingForHost(true);
    } finally {
      setIsConnecting(false);
    }
  }, [classId, roomName, isConnecting, attachLocalPreview, handleParticipantConnected, handleParticipantDisconnected, fullDisconnect]);

  // ─── Check Room Status ───
  const checkRoomStatus = useCallback(async () => {
    try {
      setCheckingRoom(true);
      const status = await videoApi.getRoomStatus(roomName);
      console.log('📡 Room status:', status);
      if (status.isActive && status.hostConnected) {
        // Room is live, connect!
        connectToRoom();
      } else {
        setWaitingForHost(true);
      }
    } catch {
      setWaitingForHost(true);
    } finally {
      setCheckingRoom(false);
    }
  }, [roomName, connectToRoom]);

  // Initial room status check
  useEffect(() => {
    checkRoomStatus();

    return () => {
      fullDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Auto-retry check every 5s while waiting
  useEffect(() => {
    if (!waitingForHost || isConnected || isConnecting) return;
    const interval = setInterval(() => {
      checkRoomStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [waitingForHost, isConnected, isConnecting, checkRoomStatus]);

  // ─── Toggle Functions ───
  const toggleVideo = () => {
    const r = roomRef.current;
    if (!r) return;
    r.localParticipant.videoTracks.forEach((pub: any) => {
      if (isVideoEnabled) pub.track.disable();
      else pub.track.enable();
    });
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    const r = roomRef.current;
    if (!r) return;
    r.localParticipant.audioTracks.forEach((pub: any) => {
      if (isAudioEnabled) pub.track.disable();
      else pub.track.enable();
    });
    setIsAudioEnabled(!isAudioEnabled);
  };

  // ─── Leave Room ───
  const handleLeave = () => {
    fullDisconnect();
    router.push('/student/my-classes');
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── Waiting for host screen ───
  if (waitingForHost && !isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Mentor Bekleniyor</h2>
          <p className="text-gray-400 mb-2">
            {groupClass?.title || 'Grup Dersi'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Mentor ders odasını henüz açmadı. Oda açıldığında otomatik olarak bağlanacaksınız.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <RefreshCw className={`w-4 h-4 ${checkingRoom ? 'animate-spin' : ''}`} />
            <span>Kontrol ediliyor...</span>
          </div>
          <Button variant="outline" onClick={() => router.push('/student/my-classes')}>
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  // ─── Connecting screen ───
  if (isConnecting && !isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Derse bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  const totalParticipants = participantCount;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold">{groupClass?.title || 'Grup Dersi'}</h1>
          <Badge className="bg-green-600 text-white text-xs">Canlı</Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white font-mono text-sm">{formatDuration(duration)}</div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>{totalParticipants} katılımcı</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 flex items-center">
        <div className={`grid ${getGridClass(totalParticipants)} gap-3 w-full`}>
          {/* Local Video */}
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <div ref={localVideoRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded z-10">
              Sen
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-10 h-10 text-gray-500" />
              </div>
            )}
          </div>

          {/* Remote Videos - appended dynamically */}
          <div ref={gridRef} className="contents" />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-4 flex items-center justify-center gap-4">
        <Button
          variant={isAudioEnabled ? 'secondary' : 'destructive'}
          size="lg"
          className="rounded-full w-12 h-12 p-0"
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        <Button
          variant={isVideoEnabled ? 'secondary' : 'destructive'}
          size="lg"
          className="rounded-full w-12 h-12 p-0"
          onClick={toggleVideo}
          title={isVideoEnabled ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full px-6"
          onClick={handleLeave}
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          Ayrıl
        </Button>
      </div>
    </div>
  );
}
