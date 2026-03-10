'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, ClipboardList, LogOut, PenTool, Clock, Maximize2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { ClassroomLayout } from './ClassroomLayout';
import { ParticipantsPanel } from './ParticipantsPanel';
import { SessionTimerBanner } from './SessionTimerBanner';
import { ClassroomPlanPanel } from '../features/session-plans/classroom-plan-panel';
import { useAgoraClassroom } from '../../lib/hooks/use-agora-classroom';
import { useClassroomSignaling, type AnnouncedUser } from '../../lib/hooks/use-classroom-signaling';
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
  peerDisplayName?: string;
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
  peerDisplayName,
  bookingTimes,
  sessionTimer,
  onEndSession,
  onLeaveRoom,
}: AgoraClassroomProps) {
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isRoomActivated, setIsRoomActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [roomStatus, setRoomStatus] = useState<{ isActive: boolean; hostConnected: boolean } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(!isHost);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const userId = useAuthStore(s => s.user?.id) || '';
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionStartRef = useRef<number | null>(null);
  const [mentorLeftCountdown, setMentorLeftCountdown] = useState<number | null>(null);
  const mentorLeftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mentorWasConnectedRef = useRef(false);

  // Track mentor's Agora UID (for mentor-leave countdown in group sessions)
  const [mentorAgoraUid, setMentorAgoraUid] = useState<string | null>(null);

  // Spotlight mode: mentor's camera shown full-screen, others in filmstrip
  const [isSpotlightActive, setIsSpotlightActive] = useState(false);

  // Track screen share sharer's Agora UID
  const [remoteScreenShareActive, setRemoteScreenShareActive] = useState(false);
  const [remoteScreenSharerUid, setRemoteScreenSharerUid] = useState<string | null>(null);

  const localLabel = `${displayName} (Siz)`;
  const peerLabel = peerDisplayName
    ? `${peerDisplayName} (${isHost ? 'Katılımcı' : 'Eğitmen'})`
    : (isHost ? 'Katılımcı' : 'Eğitmen');

  const agora = useAgoraClassroom({
    roomName,
    isHost,
    displayName,
    peerDisplayName: peerLabel,
    enabled: true,
  });

  // Classroom signaling
  const signaling = useClassroomSignaling({
    roomName,
    displayName,
    userId,
    localAgoraUid: agora.localAgoraUid,
    isHost,
    enabled: agora.isConnected,
    onMuted: useCallback(() => {
      agora.muteAudio();
      toast.info('Eğitmen mikrofonunuzu kapattı');
    }, [agora.muteAudio]),
    onUnmuted: useCallback(() => {
      agora.unmuteAudio();
      toast.info('Eğitmen mikrofonunuzu açtı');
    }, [agora.unmuteAudio]),
    onKicked: useCallback(() => {
      agora.leave();
      toast.info('Eğitmen sizi seanstan çıkardı');
      onLeaveRoom?.();
    }, [agora.leave, onLeaveRoom]),
    onWhiteboardToggle: useCallback((open: boolean) => {
      if (!isHost) {
        setIsWhiteboardOpen(open);
        agora.replayLocalVideo();
      }
    }, [isHost, agora.replayLocalVideo]),
    onRemoteScreenShare: useCallback((active: boolean, sharerUid?: string) => {
      setRemoteScreenShareActive(active);
      setRemoteScreenSharerUid(active ? (sharerUid || null) : null);
    }, []),
    onUserAnnounce: useCallback((user: AnnouncedUser) => {
      console.log('[Classroom] User announced:', user);
      // Update remote tile display name
      agora.updateRemoteTileDisplayName(user.agoraUid, user.displayName);
      // Track mentor's Agora UID for countdown
      if (user.isHost) {
        setMentorAgoraUid(user.agoraUid);
      }
    }, [agora.updateRemoteTileDisplayName]),
    onSpotlightToggle: useCallback((active: boolean) => {
      setIsSpotlightActive(active);
      // Replay local video after layout change on student side
      agora.replayLocalVideo();
    }, [agora.replayLocalVideo]),
  });

  // Broadcast user-announce when connected AND whenever remote tiles change
  // (new participants may have missed our initial announce)
  const lastAnnouncedTileCountRef = useRef(-1);
  useEffect(() => {
    if (!agora.isConnected || !agora.localAgoraUid) {
      lastAnnouncedTileCountRef.current = -1;
      return;
    }
    const currentCount = agora.remoteTiles.length;
    // Announce on first connect and whenever a new participant joins
    if (currentCount !== lastAnnouncedTileCountRef.current) {
      lastAnnouncedTileCountRef.current = currentCount;
      const delay = currentCount === 0 ? 1000 : 500;
      const timer = setTimeout(() => {
        signaling.signalUserAnnounce(agora.localAgoraUid, displayName, isHost);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [agora.isConnected, agora.localAgoraUid, agora.remoteTiles.length, displayName, isHost, signaling.signalUserAnnounce]);

  // Derive effective screenShareState
  const effectiveScreenShareState = (() => {
    if (agora.screenShareState.active) return agora.screenShareState;
    if (remoteScreenShareActive) {
      // Find the sharer's tile by UID (if known) or use first tile
      const sharerTile = remoteScreenSharerUid
        ? agora.remoteTiles.find(t => t.identity === remoteScreenSharerUid)
        : agora.remoteTiles[0];
      if (sharerTile) {
        return {
          active: true,
          isLocal: false,
          screenVideoEl: sharerTile.cameraVideoEl,
          sharerIdentity: sharerTile.identity,
        };
      }
    }
    return agora.screenShareState;
  })();

  // When remote screen share is active, filter the sharer from filmstrip
  // (the same HTMLVideoElement can't be in two DOM parents)
  const displayRemoteTiles = effectiveScreenShareState.active && !effectiveScreenShareState.isLocal && effectiveScreenShareState.sharerIdentity
    ? agora.remoteTiles.filter(t => t.identity !== effectiveScreenShareState.sharerIdentity)
    : agora.remoteTiles;

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
            setIsRoomActivated(true);
            agora.join();
          }
        }
      } catch {
        if (!cancelled) setIsCheckingStatus(false);
      }
    };
    checkStatus();
    const interval = setInterval(() => {
      if (!isRoomActivated) checkStatus();
    }, 5000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, roomName, isRoomActivated]);

  const activateRoom = async () => {
    setIsActivating(true);
    try {
      await videoApi.createSession(resourceType, resourceId);
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

  // Elapsed session timer
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

  // Student: detect mentor leaving and start 10-min countdown
  useEffect(() => {
    if (isHost || !agora.isConnected) return;

    const isGroupSession = agora.remoteTiles.length > 1 || mentorAgoraUid !== null;

    // Determine if mentor is present
    let hasMentor: boolean;
    if (mentorAgoraUid) {
      // We know mentor's specific UID — check if they're in remote tiles
      hasMentor = agora.remoteTiles.some(t => t.identity === mentorAgoraUid);
    } else if (isGroupSession) {
      // Group session but mentor UID unknown yet — can't determine, skip
      return;
    } else {
      // 1:1 session — any remote tile is the mentor
      hasMentor = agora.remoteTiles.length > 0;
    }

    if (hasMentor) {
      mentorWasConnectedRef.current = true;
      // Mentor came back — cancel countdown
      if (mentorLeftCountdown !== null) {
        if (mentorLeftTimerRef.current) clearInterval(mentorLeftTimerRef.current);
        mentorLeftTimerRef.current = null;
        setMentorLeftCountdown(null);
        toast.success('Eğitmen odaya geri döndü');
      }
    } else if (mentorWasConnectedRef.current && mentorLeftCountdown === null) {
      // Mentor was here but now left — start 10-min (600s) countdown
      toast.warning('Eğitmen odadan ayrıldı. 10 dakika içinde dönmezse oturum sonlandırılacak.');
      let remaining = 600;
      setMentorLeftCountdown(remaining);
      mentorLeftTimerRef.current = setInterval(() => {
        remaining -= 1;
        setMentorLeftCountdown(remaining);
        if (remaining <= 0) {
          if (mentorLeftTimerRef.current) clearInterval(mentorLeftTimerRef.current);
          mentorLeftTimerRef.current = null;
          toast.info('Eğitmen geri dönmedi, oturum sonlandırıldı.');
          agora.leave();
          onLeaveRoom?.();
        }
      }, 1000);
    }

    return () => {
      // Don't clear timer on re-render — only on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, agora.isConnected, agora.remoteTiles, mentorAgoraUid]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (mentorLeftTimerRef.current) clearInterval(mentorLeftTimerRef.current);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [signaling.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    signaling.sendMessage(newMessage.trim());
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

  const handleWhiteboardToggle = () => {
    const newState = !isWhiteboardOpen;
    setIsWhiteboardOpen(newState);
    agora.replayLocalVideo();
    if (isHost) {
      signaling.signalWhiteboard(newState);
    }
  };

  // Mute & kick handlers
  const handleMuteParticipant = (identity: string) => {
    const tile = agora.remoteTiles.find(t => t.identity === identity);
    if (tile?.isAudioEnabled) {
      signaling.signalMuteParticipant(identity);
      agora.updateRemoteTileAudio(identity, false);
      toast.success('Katılımcının mikrofonu kapatıldı');
    } else {
      signaling.signalUnmuteParticipant(identity);
      agora.updateRemoteTileAudio(identity, true);
      toast.success('Katılımcının mikrofonu açıldı');
    }
  };

  const handleKickParticipant = (identity: string) => {
    signaling.signalKickParticipant(identity);
    toast.success('Katılımcı seanstan çıkarıldı');
  };

  const handleMuteAll = () => {
    signaling.signalMuteAll();
    agora.remoteTiles.forEach(t => agora.updateRemoteTileAudio(t.identity, false));
    toast.success('Tüm katılımcıların mikrofonu kapatıldı');
  };

  const handleUnmuteAll = () => {
    signaling.signalUnmuteAll();
    agora.remoteTiles.forEach(t => agora.updateRemoteTileAudio(t.identity, true));
    toast.success('Tüm katılımcıların mikrofonu açıldı');
  };

  // Spotlight toggle (mentor only)
  const handleSpotlightToggle = () => {
    const newState = !isSpotlightActive;
    setIsSpotlightActive(newState);
    signaling.signalSpotlight(newState);
    // Replay local video after layout change
    agora.replayLocalVideo();
  };

  // Replay local video when spotlight state changes (layout switch remounts refs)
  useEffect(() => {
    agora.replayLocalVideo();
  }, [isSpotlightActive, agora.replayLocalVideo]);

  // Not yet activated — show activation screen
  if (!isRoomActivated && !agora.isConnected) {
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
              <Button onClick={activateRoom} disabled={isActivating} size="sm">
                <Video className="w-4 h-4 mr-2" />
                {isActivating ? 'Aktifleştiriliyor...' : 'Odayı Aktifleştir'}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen flex flex-col bg-gray-950 text-white">
        {sessionTimer && (
          <SessionTimerBanner {...sessionTimer} isRoomActive={false} />
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Users className="w-16 h-16 text-gray-600 mx-auto" />
            <h2 className="text-xl font-semibold">Eğitmen Bekleniyor</h2>
            <p className="text-gray-400 text-sm">
              {isCheckingStatus ? 'Oda durumu kontrol ediliyor...' : 'Eğitmen odayı aktifleştirdiğinde otomatik bağlanacaksınız'}
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

      {/* Mentor-left countdown banner (student only) */}
      {mentorLeftCountdown !== null && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium animate-pulse">
          Eğitmen odadan ayrıldı. Geri dönmezse oturum {Math.floor(mentorLeftCountdown / 60)}:{String(mentorLeftCountdown % 60).padStart(2, '0')} sonra sonlandırılacak.
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video / Whiteboard area */}
        <div className="flex-1 p-3">
          {agora.isConnecting ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 text-sm">Bağlanılıyor...</p>
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
                    {localLabel}
                  </div>
                </div>
                {displayRemoteTiles.map(tile => (
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
                        Kamera kapalı
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
              localLabel={localLabel}
              localDisplayName={displayName}
              remoteTiles={displayRemoteTiles}
              screenShareState={effectiveScreenShareState}
              isSpotlightActive={isSpotlightActive}
              spotlightIdentity={mentorAgoraUid}
            />
          )}
        </div>

        {/* Side panels */}
        {signaling.isChatOpen && (
          <div className="w-80 border-l border-gray-800 flex flex-col bg-gray-900">
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-medium">Sohbet</span>
              <button onClick={signaling.closeChat} className="text-gray-500 hover:text-white">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {signaling.messages.map((msg, i) => (
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
              readOnly={!isHost}
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
              onMuteParticipant={handleMuteParticipant}
              onUnmuteParticipant={handleMuteParticipant}
              onKickParticipant={handleKickParticipant}
              onMuteAll={handleMuteAll}
              onUnmuteAll={handleUnmuteAll}
              onClose={() => setIsParticipantsOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="min-h-[4rem] bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-2 px-4 flex-wrap py-2 overflow-x-auto">
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
          <span className="hidden sm:inline">{agora.isAudioEnabled ? 'Mikrofon' : 'Kapalı'}</span>
        </Button>

        <Button
          size="sm"
          variant={agora.isVideoEnabled ? 'secondary' : 'destructive'}
          onClick={agora.toggleVideo}
          className="gap-1.5"
        >
          {agora.isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{agora.isVideoEnabled ? 'Kamera' : 'Kapalı'}</span>
        </Button>

        <Button
          size="sm"
          variant={agora.isScreenSharing ? 'default' : 'secondary'}
          onClick={async () => {
            if (agora.isScreenSharing) {
              await agora.stopScreenShare();
              signaling.signalScreenShare(false);
            } else {
              await agora.startScreenShare();
              signaling.signalScreenShare(true, agora.localAgoraUid);
            }
          }}
          className="gap-1.5"
        >
          {agora.isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span className="hidden sm:inline">Ekran</span>
        </Button>

        <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block" />

        <Button
          size="sm"
          variant={signaling.isChatOpen ? 'default' : 'secondary'}
          onClick={() => { signaling.toggleChat(); setIsPlanOpen(false); setIsParticipantsOpen(false); }}
          className="gap-1.5 relative"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Sohbet</span>
          {signaling.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] flex items-center justify-center px-1">
              {signaling.unreadCount}
            </span>
          )}
        </Button>

        <Button
          size="sm"
          variant={isPlanOpen ? 'default' : 'secondary'}
          onClick={() => { setIsPlanOpen(!isPlanOpen); signaling.closeChat(); setIsParticipantsOpen(false); }}
          className="gap-1.5"
        >
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Plan</span>
        </Button>

        {isHost && (
          <Button
            size="sm"
            variant={isWhiteboardOpen ? 'default' : 'secondary'}
            onClick={handleWhiteboardToggle}
            className="gap-1.5"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Tahta</span>
          </Button>
        )}

        <Button
          size="sm"
          variant={isParticipantsOpen ? 'default' : 'secondary'}
          onClick={() => { setIsParticipantsOpen(!isParticipantsOpen); signaling.closeChat(); setIsPlanOpen(false); }}
          className="gap-1.5"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Katılımcılar</span>
        </Button>

        {/* Spotlight toggle — mentor only, for pinning own camera to center */}
        {isHost && agora.remoteTiles.length > 0 && (
          <Button
            size="sm"
            variant={isSpotlightActive ? 'default' : 'secondary'}
            onClick={handleSpotlightToggle}
            className="gap-1.5"
            title={isSpotlightActive ? 'Spotlight kapat' : 'Kameranızı merkeze alın'}
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isSpotlightActive ? 'Spotlight' : 'Merkez'}</span>
          </Button>
        )}

        <div className="w-px h-8 bg-gray-700 mx-1 hidden sm:block" />

        {isHost ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLeaveRoom}
              className="gap-1.5 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Ayrıl</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndSession}
              className="gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Seansı Bitir</span>
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
            <span className="hidden sm:inline">Ayrıl</span>
          </Button>
        )}
      </div>
    </div>
  );
}
