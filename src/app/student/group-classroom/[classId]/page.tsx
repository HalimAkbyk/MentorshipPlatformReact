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

  const [room, setRoom] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [waitingForHost, setWaitingForHost] = useState(false);
  const [checkingRoom, setCheckingRoom] = useState(false);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const roomRef = useRef<any>(null);

  const roomName = `group-class-${classId}`;

  // Calculate grid columns based on total participants
  const getGridClass = useCallback((total: number) => {
    if (total <= 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (total === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (total <= 4) return 'grid-cols-2 max-w-5xl mx-auto';
    if (total <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (total <= 9) return 'grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  }, []);

  // Check if mentor has started the room
  const checkRoomStatus = useCallback(async () => {
    try {
      setCheckingRoom(true);
      const status = await videoApi.getRoomStatus(roomName);
      if (status.isActive && status.hostConnected) {
        setWaitingForHost(false);
        connectToRoom();
      } else {
        setWaitingForHost(true);
        setLoading(false);
      }
    } catch {
      setWaitingForHost(true);
      setLoading(false);
    } finally {
      setCheckingRoom(false);
    }
  }, [roomName]);

  const connectToRoom = async () => {
    try {
      setLoading(true);
      setWaitingForHost(false);

      const tokenResult = await videoApi.getToken({
        roomName,
        isHost: false,
      });

      const TwilioVideo = await import('twilio-video');

      const twilioRoom = await TwilioVideo.connect(tokenResult.token, {
        name: roomName,
        audio: true,
        video: { width: 640, height: 480 },
      });

      roomRef.current = twilioRoom;
      setRoom(twilioRoom);

      // Attach local video
      twilioRoom.localParticipant.videoTracks.forEach((pub: any) => {
        if (pub.track && localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          const el = pub.track.attach();
          el.style.width = '100%';
          el.style.height = '100%';
          el.style.objectFit = 'cover';
          localVideoRef.current.appendChild(el);
        }
      });

      // Also handle local audio tracks being published after connect
      twilioRoom.localParticipant.on('trackPublished', (pub: any) => {
        if (pub.track?.kind === 'video' && localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          const el = pub.track.attach();
          el.style.width = '100%';
          el.style.height = '100%';
          el.style.objectFit = 'cover';
          localVideoRef.current.appendChild(el);
        }
      });

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

      updateCount();
      setLoading(false);
    } catch (err: any) {
      console.error('Video connection error:', err);
      toast.error('Video bağlantısı kurulamadı');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkRoomStatus();

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [classId]);

  // Auto-retry check every 5s while waiting
  useEffect(() => {
    if (!waitingForHost) return;
    const interval = setInterval(() => {
      checkRoomStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [waitingForHost, checkRoomStatus]);

  const handleParticipantConnected = useCallback((participant: any) => {
    participant.on('trackSubscribed', (track: any) => {
      attachRemoteTrack(track, participant);
    });

    participant.tracks.forEach((pub: any) => {
      if (pub.isSubscribed && pub.track) {
        attachRemoteTrack(pub.track, participant);
      }
    });
  }, []);

  const handleParticipantDisconnected = useCallback((participant: any) => {
    const container = participantsRef.current.get(participant.sid);
    if (container) {
      container.remove();
      participantsRef.current.delete(participant.sid);
    }
  }, []);

  const attachRemoteTrack = (track: any, participant: any) => {
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
      const el = track.attach();
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.objectFit = 'cover';
      container.insertBefore(el, container.firstChild);
    } else if (track.kind === 'audio') {
      const el = track.attach();
      document.body.appendChild(el);
    }
  };

  const toggleVideo = () => {
    if (!roomRef.current) return;
    roomRef.current.localParticipant.videoTracks.forEach((pub: any) => {
      if (isVideoEnabled) pub.track.disable();
      else pub.track.enable();
    });
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (!roomRef.current) return;
    roomRef.current.localParticipant.audioTracks.forEach((pub: any) => {
      if (isAudioEnabled) pub.track.disable();
      else pub.track.enable();
    });
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleLeave = () => {
    if (roomRef.current) roomRef.current.disconnect();
    router.push('/student/my-classes');
  };

  // Waiting for host screen
  if (waitingForHost) {
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

  if (loading) {
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
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Users className="w-4 h-4" />
          <span>{totalParticipants} katılımcı</span>
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
