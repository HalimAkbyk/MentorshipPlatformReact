'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGroupClass, useCompleteGroupClass } from '@/lib/hooks/use-classes';
import { videoApi } from '@/lib/api/video';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Monitor,
} from 'lucide-react';

export default function MentorGroupClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const { data: groupClass } = useGroupClass(classId);
  const completeMutation = useCompleteGroupClass();

  const [token, setToken] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideosRef = useRef<HTMLDivElement>(null);

  const roomName = `group-class-${classId}`;

  // Get token and connect
  useEffect(() => {
    const connect = async () => {
      try {
        setLoading(true);

        // Create session first
        await videoApi.createSession('GroupClass', classId);

        // Get token
        const tokenResult = await videoApi.getToken({
          roomName,
          isHost: true,
        });
        setToken(tokenResult.token);

        // Dynamic import Twilio Video
        const TwilioVideo = await import('twilio-video');

        const twilioRoom = await TwilioVideo.connect(tokenResult.token, {
          name: roomName,
          audio: true,
          video: { width: 640, height: 480 },
          dominantSpeaker: true,
        });

        setRoom(twilioRoom);

        // Attach local video
        twilioRoom.localParticipant.videoTracks.forEach((pub: any) => {
          if (pub.track && localVideoRef.current) {
            localVideoRef.current.innerHTML = '';
            const el = pub.track.attach();
            el.style.width = '100%';
            el.style.height = '100%';
            el.style.objectFit = 'cover';
            el.style.borderRadius = '8px';
            localVideoRef.current.appendChild(el);
          }
        });

        // Handle existing participants
        twilioRoom.participants.forEach((p: any) => handleParticipantConnected(p));

        // Handle new participants
        twilioRoom.on('participantConnected', handleParticipantConnected);
        twilioRoom.on('participantDisconnected', handleParticipantDisconnected);

        setLoading(false);
      } catch (err: any) {
        console.error('Video connection error:', err);
        toast.error('Video bağlantısı kurulamadı');
        setLoading(false);
      }
    };

    connect();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [classId]);

  const handleParticipantConnected = useCallback((participant: any) => {
    setParticipants(prev => [...prev, participant]);

    participant.on('trackSubscribed', (track: any) => {
      if (track.kind === 'video' || track.kind === 'audio') {
        attachRemoteTrack(track, participant);
      }
    });

    participant.tracks.forEach((pub: any) => {
      if (pub.isSubscribed && pub.track) {
        attachRemoteTrack(pub.track, participant);
      }
    });
  }, []);

  const handleParticipantDisconnected = useCallback((participant: any) => {
    setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
    // Remove video element
    const el = document.getElementById(`participant-${participant.sid}`);
    if (el) el.remove();
  }, []);

  const attachRemoteTrack = (track: any, participant: any) => {
    if (!remoteVideosRef.current) return;
    if (track.kind === 'video') {
      let container = document.getElementById(`participant-${participant.sid}`);
      if (!container) {
        container = document.createElement('div');
        container.id = `participant-${participant.sid}`;
        container.className = 'relative aspect-video bg-gray-900 rounded-lg overflow-hidden';
        const nameLabel = document.createElement('div');
        nameLabel.className = 'absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded';
        nameLabel.textContent = participant.identity?.split('|')[1] || 'Katılımcı';
        container.appendChild(nameLabel);
        remoteVideosRef.current!.appendChild(container);
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
    if (!room) return;
    room.localParticipant.videoTracks.forEach((pub: any) => {
      if (isVideoEnabled) pub.track.disable();
      else pub.track.enable();
    });
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub: any) => {
      if (isAudioEnabled) pub.track.disable();
      else pub.track.enable();
    });
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleEndClass = async () => {
    if (room) room.disconnect();
    try {
      await completeMutation.mutateAsync(classId);
      toast.success('Ders tamamlandı');
    } catch {
      // ignore
    }
    router.push('/mentor/group-classes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Ders odası hazırlanıyor...</p>
        </div>
      </div>
    );
  }

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
          <span>{participants.length} katılımcı</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-160px)] overflow-y-auto">
          {/* Local Video */}
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <div ref={localVideoRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
              Sen (Mentor)
            </div>
          </div>

          {/* Remote Videos */}
          <div ref={remoteVideosRef} className="contents" />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-4 flex items-center justify-center gap-4">
        <Button
          variant={isAudioEnabled ? 'secondary' : 'destructive'}
          size="lg"
          className="rounded-full w-12 h-12 p-0"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        <Button
          variant={isVideoEnabled ? 'secondary' : 'destructive'}
          size="lg"
          className="rounded-full w-12 h-12 p-0"
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full px-6"
          onClick={handleEndClass}
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          Dersi Bitir
        </Button>
      </div>
    </div>
  );
}
