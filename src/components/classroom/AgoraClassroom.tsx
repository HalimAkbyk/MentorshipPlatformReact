'use client';
import { useEffect, useState, useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, ClipboardList,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { ClassroomLayout } from './ClassroomLayout';
import { ParticipantsPanel } from './ParticipantsPanel';
import { SessionTimerBanner } from './SessionTimerBanner';
import { ClassroomPlanPanel } from '../features/session-plans/classroom-plan-panel';
import { useAgoraClassroom } from '../../lib/hooks/use-agora-classroom';
import { videoApi } from '../../lib/api/video';

interface AgoraClassroomProps {
  roomName: string;
  resourceType: string;
  resourceId: string;
  isHost: boolean;
  displayName: string;
  bookingTimes?: { startAt: string; endAt: string } | null;
  sessionTimer?: any;
  onEndSession?: () => void;
  onLeaveRoom?: () => void;
}

export function AgoraClassroom({
  roomName,
  resourceType,
  resourceId,
  isHost,
  displayName,
  bookingTimes,
  sessionTimer,
  onEndSession,
  onLeaveRoom,
}: AgoraClassroomProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const agora = useAgoraClassroom({
    roomName,
    isHost,
    displayName,
    enabled: true,
  });

  // Auto-join on mount
  useEffect(() => {
    agora.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agora.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    agora.sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleEndSession = async () => {
    try {
      await agora.leave();
      await videoApi.endSession(roomName);
      onEndSession?.();
    } catch {
      toast.error('Seans sonlandirilamadi');
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await agora.leave();
      await videoApi.leaveRoom(roomName);
      onLeaveRoom?.();
    } catch {
      toast.error('Odadan cikilamadi');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Top bar */}
      {sessionTimer && bookingTimes && (
        <SessionTimerBanner
          sessionTimer={sessionTimer}
          bookingTimes={bookingTimes}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 p-3">
          {agora.isConnecting ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 text-sm">Agora&apos;ya baglaniliyor...</p>
              </div>
            </div>
          ) : (
            <ClassroomLayout
              localVideoRef={agora.localVideoRef as any}
              localScreenPreviewRef={agora.localScreenPreviewRef as any}
              isVideoEnabled={agora.isVideoEnabled}
              isRoomActive={agora.isConnected}
              isMentor={isHost}
              localLabel={isHost ? 'Siz (Egitmen)' : 'Siz'}
              localDisplayName={displayName}
              remoteTiles={agora.remoteTiles}
              screenShareState={agora.screenShareState}
            />
          )}
        </div>

        {/* Side panels */}
        {isChatOpen && (
          <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium">Sohbet</span>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-white">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {agora.messages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-teal-400 font-medium">{msg.sender}: </span>
                  <span className="text-gray-300">{msg.text}</span>
                  <span className="text-gray-600 text-xs ml-1">{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mesaj yaz..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <Button size="sm" onClick={handleSendMessage} className="bg-teal-600 hover:bg-teal-700">
                  Gonder
                </Button>
              </div>
            </div>
          </div>
        )}

        {isPlanOpen && (
          <div className="w-80 border-l border-gray-800 bg-gray-900">
            <ClassroomPlanPanel
              bookingId={resourceType === 'Booking' ? resourceId : undefined}
              groupClassId={resourceType === 'GroupClass' ? resourceId : undefined}
              onClose={() => setIsPlanOpen(false)}
            />
          </div>
        )}

        {isParticipantsOpen && (
          <div className="w-72 border-l border-gray-800 bg-gray-900">
            <ParticipantsPanel
              remoteTiles={agora.remoteTiles}
              localLabel={displayName}
              isHost={isHost}
              onClose={() => setIsParticipantsOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-2 px-4">
        <Button
          size="sm"
          variant={agora.isAudioEnabled ? 'secondary' : 'destructive'}
          onClick={agora.toggleAudio}
          className="gap-1.5"
        >
          {agora.isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{agora.isAudioEnabled ? 'Mikrofon' : 'Kapali'}</span>
        </Button>

        <Button
          size="sm"
          variant={agora.isVideoEnabled ? 'secondary' : 'destructive'}
          onClick={agora.toggleVideo}
          className="gap-1.5"
        >
          {agora.isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{agora.isVideoEnabled ? 'Kamera' : 'Kapali'}</span>
        </Button>

        <Button
          size="sm"
          variant={agora.isScreenSharing ? 'default' : 'secondary'}
          onClick={agora.isScreenSharing ? agora.stopScreenShare : agora.startScreenShare}
          className="gap-1.5"
        >
          {agora.isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span className="hidden sm:inline">Ekran</span>
        </Button>

        <div className="w-px h-8 bg-gray-700 mx-1" />

        <Button
          size="sm"
          variant={isChatOpen ? 'default' : 'secondary'}
          onClick={() => { setIsChatOpen(!isChatOpen); setIsPlanOpen(false); setIsParticipantsOpen(false); }}
          className="gap-1.5 relative"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Sohbet</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>

        <Button
          size="sm"
          variant={isPlanOpen ? 'default' : 'secondary'}
          onClick={() => { setIsPlanOpen(!isPlanOpen); setIsChatOpen(false); setIsParticipantsOpen(false); }}
          className="gap-1.5"
        >
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Plan</span>
        </Button>

        <Button
          size="sm"
          variant={isParticipantsOpen ? 'default' : 'secondary'}
          onClick={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsChatOpen(false); setIsPlanOpen(false); }}
          className="gap-1.5"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Katilimcilar</span>
        </Button>

        <div className="w-px h-8 bg-gray-700 mx-1" />

        {isHost ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleEndSession}
            className="gap-1.5"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Seansi Bitir</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleLeaveRoom}
            className="gap-1.5"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">Ayril</span>
          </Button>
        )}
      </div>
    </div>
  );
}
