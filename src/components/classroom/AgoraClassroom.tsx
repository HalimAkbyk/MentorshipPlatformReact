'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, ClipboardList, LogOut, PenTool, Clock,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { ClassroomLayout } from './ClassroomLayout';
import { ParticipantsPanel } from './ParticipantsPanel';
import { SessionTimerBanner } from './SessionTimerBanner';
import { ClassroomPlanPanel } from '../features/session-plans/classroom-plan-panel';
import { useAgoraClassroom } from '../../lib/hooks/use-agora-classroom';
import { useAuthStore } from '../../lib/stores/auth-store';
import { videoApi } from '../../lib/api/video';

// Dynamic import — fastboard has native deps that can fail in SSR/serverless build
const AgoraWhiteboard = dynamic(
  () => import('./AgoraWhiteboard').then(m => m.AgoraWhiteboard),
  { ssr: false, loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )}
);

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRoomActivated, setIsRoomActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [roomStatus, setRoomStatus] = useState<{ isActive: boolean; hostConnected: boolean } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(!isHost);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const userId = useAuthStore(s => s.user?.id) || '';
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionStartRef = useRef<number | null>(null);

  const agora = useAgoraClassroom({
    roomName,
    isHost,
    displayName,
    enabled: true,
  });

  // For students: check room status (is mentor active?)
  useEffect(() => {
    if (isHost) return;
    let cancelled = false;
    const checkStatus = async () => {
      try {
        const status = await videoApi.getRoomStatus(roomName);
        if (!cancelled) {
          setRoomStatus(status);
          setIsCheckingStatus(false);
          if (status.isActive) {
            // Room is active, auto-join
            setIsRoomActivated(true);
            agora.join();
          }
        }
      } catch {
        if (!cancelled) setIsCheckingStatus(false);
      }
    };
    checkStatus();
    // Poll every 5s until room is active
    const interval = setInterval(() => {
      if (!isRoomActivated) checkStatus();
    }, 5000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, roomName, isRoomActivated]);

  const activateRoom = async () => {
    setIsActivating(true);
    try {
      // Create session on backend first (like Twilio flow)
      await videoApi.createSession(resourceType, resourceId);
      // Then join Agora
      await agora.join();
      setIsRoomActivated(true);
      toast.success('Oda aktif! Öğrenci artık katılabilir.');
    } catch (err: any) {
      console.error('Room activation error:', err);
      toast.error('Oda aktifleştirilemedi: ' + (err?.message ?? ''));
    } finally {
      setIsActivating(false);
    }
  };

  // Elapsed session timer — starts when connected
  useEffect(() => {
    if (agora.isConnected && !sessionStartRef.current) {
      sessionStartRef.current = Date.now();
    }
    if (!agora.isConnected) {
      sessionStartRef.current = null;
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      if (sessionStartRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [agora.isConnected]);

  const formatElapsed = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
      setIsRoomActivated(false);
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

  // Not yet activated — show activation screen
  if (!isRoomActivated && !agora.isConnected) {
    // Host: show "Activate Room" button
    if (isHost) {
      return (
        <div className="h-screen flex flex-col bg-gray-950 text-white">
          {sessionTimer && (
            <SessionTimerBanner {...sessionTimer} isRoomActive={false} />
          )}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Video className="w-16 h-16 text-gray-600 mx-auto" />
              <h2 className="text-xl font-semibold">Oda Aktif Değil</h2>
              <p className="text-gray-400 text-sm">Odayı aktifleştirin</p>
              <Button
                onClick={activateRoom}
                disabled={isActivating}
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                {isActivating ? 'Aktifleştiriliyor...' : 'Odayı Aktifleştir'}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Student: waiting for mentor
    return (
      <div className="h-screen flex flex-col bg-gray-950 text-white">
        {sessionTimer && (
          <SessionTimerBanner {...sessionTimer} isRoomActive={false} />
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Users className="w-16 h-16 text-gray-600 mx-auto" />
            <h2 className="text-xl font-semibold">Öğrenci katılamaz</h2>
            <p className="text-gray-400 text-sm">
              {isCheckingStatus ? 'Oda durumu kontrol ediliyor...' : 'Önce odayı aktifleştirin'}
            </p>
            {isCheckingStatus && (
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white">
      {/* Top bar */}
      {sessionTimer && (
        <SessionTimerBanner {...sessionTimer} isRoomActive={agora.isConnected} />
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video / Whiteboard area */}
        <div className="flex-1 p-3">
          {agora.isConnecting ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 text-sm">Agora&apos;ya baglaniliyor...</p>
              </div>
            </div>
          ) : isWhiteboardOpen ? (
            <div className="h-full flex flex-col gap-2">
              {/* Whiteboard takes most space */}
              <div className="flex-1 rounded-lg overflow-hidden border border-gray-700">
                <AgoraWhiteboard
                  roomName={roomName}
                  userId={userId}
                  isWriter={isHost}
                />
              </div>
              {/* Small video filmstrip at bottom */}
              <div className="h-[100px] shrink-0 flex gap-2 overflow-x-auto">
                <div className="relative w-[160px] shrink-0 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <div ref={agora.localVideoRef as any} className="w-full h-full" />
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {isHost ? 'Siz (Egitmen)' : 'Siz'}
                  </div>
                </div>
                {agora.remoteTiles.map(tile => (
                  <div key={tile.identity} className="relative w-[160px] shrink-0 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    {tile.cameraVideoEl ? (
                      <div className="w-full h-full" ref={el => {
                        if (el && tile.cameraVideoEl && !el.contains(tile.cameraVideoEl)) {
                          el.innerHTML = '';
                          el.appendChild(tile.cameraVideoEl);
                          tile.cameraVideoEl.style.width = '100%';
                          tile.cameraVideoEl.style.height = '100%';
                          tile.cameraVideoEl.style.objectFit = 'cover';
                        }
                      }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        Kamera kapali
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {tile.displayName}
                    </div>
                  </div>
                ))}
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
              isOpen={isPlanOpen}
              onClose={() => setIsPlanOpen(false)}
            />
          </div>
        )}

        {isParticipantsOpen && (
          <div className="w-72 border-l border-gray-800 bg-gray-900">
            <ParticipantsPanel
              remoteTiles={agora.remoteTiles}
              localDisplayName={displayName}
              localIsAudioEnabled={agora.isAudioEnabled}
              localIsVideoEnabled={agora.isVideoEnabled}
              isMentor={isHost}
              onClose={() => setIsParticipantsOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-2 px-4">
        {/* Elapsed timer */}
        {agora.isConnected && (
          <div className="flex items-center gap-1.5 text-gray-400 text-sm font-mono mr-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
        )}

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
          variant={isWhiteboardOpen ? 'default' : 'secondary'}
          onClick={() => {
            setIsWhiteboardOpen(!isWhiteboardOpen);
            // Re-play local video after layout change (whiteboard ↔ normal)
            agora.replayLocalVideo();
          }}
          className="gap-1.5"
        >
          <PenTool className="w-4 h-4" />
          <span className="hidden sm:inline">Tahta</span>
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
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLeaveRoom}
              className="gap-1.5 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Ayril</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndSession}
              className="gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Seansi Bitir</span>
            </Button>
          </>
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
