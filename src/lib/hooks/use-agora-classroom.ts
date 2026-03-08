'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { videoApi } from '../api/video';
import { ChatMessage, RemoteTile, ScreenShareState } from '../../components/classroom/types';
import { toast } from 'sonner';

// Agora must be imported dynamically (SSR-safe)
let AgoraRTC: any = null;

interface UseAgoraClassroomOptions {
  roomName: string;
  isHost: boolean;
  displayName: string;
  enabled: boolean;
}

export function useAgoraClassroom({ roomName, isHost, displayName, enabled }: UseAgoraClassroomOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteTiles, setRemoteTiles] = useState<RemoteTile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [screenShareState, setScreenShareState] = useState<ScreenShareState>({
    active: false, sharerIdentity: null, screenVideoEl: null, isLocal: false,
  });

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const localVideoContainerRef = useRef<HTMLDivElement | null>(null);
  const localScreenContainerRef = useRef<HTMLDivElement | null>(null);

  const stopScreenShareRef = useRef<() => Promise<void>>();

  const join = useCallback(async () => {
    if (!enabled || !roomName || isConnecting || isConnected) return;
    setIsConnecting(true);

    try {
      // Dynamic import for SSR safety
      if (!AgoraRTC) {
        const mod = await import('agora-rtc-sdk-ng');
        AgoraRTC = mod.default || mod;
      }

      // Get token from backend (007 AccessToken2 format)
      const { token } = await videoApi.getToken({ roomName, isHost });

      // Create client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '4f16b462827d4dcfafa8038eb06b6743';

      console.log('[Agora] Joining channel:', roomName, 'appId:', appId, 'token prefix:', token?.substring(0, 40));

      await client.join(appId, roomName, token, 0);

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: 'speech_low_quality' },
        { encoderConfig: '720p_2' }
      );

      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      // Play local video — delay slightly to ensure DOM container is ready after state change
      setIsConnected(true);
      setIsConnecting(false);

      // Use requestAnimationFrame to wait for React to render the connected state
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (localVideoContainerRef.current && videoTrack) {
            localVideoContainerRef.current.innerHTML = '';
            videoTrack.play(localVideoContainerRef.current, { fit: 'cover', mirror: true });
          }
        });
      });

      // Listen for remote users
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType);

        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          if (!remoteVideoTrack) return;

          setRemoteTiles(prev => {
            const existing = prev.find(t => t.identity === String(user.uid));
            if (existing) {
              return prev.map(t => {
                if (t.identity !== String(user.uid)) return t;
                const el = document.createElement('video');
                el.autoplay = true; el.playsInline = true;
                remoteVideoTrack.play(el);
                return { ...t, cameraVideoEl: el, isVideoEnabled: true };
              });
            }
            const el = document.createElement('video');
            el.autoplay = true; el.playsInline = true;
            remoteVideoTrack.play(el);
            return [...prev, {
              identity: String(user.uid),
              displayName: `Katilimci ${user.uid}`,
              isHandRaised: false,
              isAudioEnabled: true,
              isVideoEnabled: true,
              cameraVideoEl: el,
              screenVideoEl: null,
              audioEls: [],
            }];
          });
        }

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          setRemoteTiles(prev => prev.map(t =>
            t.identity === String(user.uid)
              ? { ...t, cameraVideoEl: null, isVideoEnabled: false }
              : t
          ));
        }
      });

      client.on('user-left', (user: IAgoraRTCRemoteUser) => {
        setRemoteTiles(prev => prev.filter(t => t.identity !== String(user.uid)));
      });
    } catch (err: any) {
      console.error('Agora join error:', err);
      toast.error('Video baglantisi kurulamadi: ' + (err.message || 'Bilinmeyen hata'));
      setIsConnecting(false);
    }
  }, [enabled, roomName, isHost, isConnecting, isConnected]);

  const leave = useCallback(async () => {
    try {
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.close();
      screenTrackRef.current?.close();
      await clientRef.current?.leave();
      clientRef.current = null;
      localVideoTrackRef.current = null;
      localAudioTrackRef.current = null;
      screenTrackRef.current = null;
      setRemoteTiles([]);
      setIsConnected(false);
      setIsScreenSharing(false);
      setScreenShareState({ active: false, sharerIdentity: null, screenVideoEl: null, isLocal: false });
    } catch (err) {
      console.error('Agora leave error:', err);
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    const track = localVideoTrackRef.current;
    if (!track) return;
    if (isVideoEnabled) {
      await track.setEnabled(false);
      setIsVideoEnabled(false);
    } else {
      await track.setEnabled(true);
      setIsVideoEnabled(true);
      if (localVideoContainerRef.current) {
        localVideoContainerRef.current.innerHTML = '';
        track.play(localVideoContainerRef.current, { fit: 'cover', mirror: true });
      }
    }
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(async () => {
    const track = localAudioTrackRef.current;
    if (!track) return;
    if (isAudioEnabled) {
      await track.setEnabled(false);
      setIsAudioEnabled(false);
    } else {
      await track.setEnabled(true);
      setIsAudioEnabled(true);
    }
  }, [isAudioEnabled]);

  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current && clientRef.current) {
      await clientRef.current.unpublish(screenTrackRef.current);
      screenTrackRef.current.close();
      screenTrackRef.current = null;
    }
    // Re-publish camera track
    if (localVideoTrackRef.current && clientRef.current) {
      try {
        await clientRef.current.publish(localVideoTrackRef.current);
      } catch (e) {
        console.warn('[Agora] Failed to re-publish camera after screen share:', e);
      }
    }
    setIsScreenSharing(false);
    setScreenShareState({ active: false, sharerIdentity: null, screenVideoEl: null, isLocal: false });
    if (localScreenContainerRef.current) {
      localScreenContainerRef.current.innerHTML = '';
    }
    // Wait for React to render NormalLayout (which remounts localVideoContainerRef)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (localVideoContainerRef.current && localVideoTrackRef.current && isVideoEnabled) {
          localVideoContainerRef.current.innerHTML = '';
          localVideoTrackRef.current.play(localVideoContainerRef.current, { fit: 'cover', mirror: true });
        }
      });
    });
  }, [isVideoEnabled]);

  // Keep ref in sync for use inside track-ended callback
  stopScreenShareRef.current = stopScreenShare;

  const startScreenShare = useCallback(async () => {
    if (!AgoraRTC || !clientRef.current) return;
    try {
      // createScreenVideoTrack returns a single track when audio is 'disable'
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: '1080p_1',
      }, 'disable');

      // Handle both single track and [video, audio] return
      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
      screenTrackRef.current = videoTrack;

      // Agora doesn't allow multiple video tracks — unpublish camera first
      if (localVideoTrackRef.current) {
        await clientRef.current.unpublish(localVideoTrackRef.current);
      }

      await clientRef.current.publish(videoTrack);
      setIsScreenSharing(true);

      // For local screen share, ScreenShareLayout uses localScreenPreviewRef (not screenVideoEl)
      // So we set screenVideoEl: null and only play into the ref container after React renders
      setScreenShareState({
        active: true,
        sharerIdentity: null,
        screenVideoEl: null,
        isLocal: true,
      });

      // Wait for React to render ScreenShareLayout (which mounts localScreenContainerRef)
      // Use setTimeout to ensure layout is fully painted (rAF alone can be too early)
      setTimeout(() => {
        if (localScreenContainerRef.current && videoTrack) {
          localScreenContainerRef.current.innerHTML = '';
          videoTrack.play(localScreenContainerRef.current);
          console.log('[Agora] Screen track playing into localScreenContainer');
        } else {
          console.warn('[Agora] localScreenContainer not ready, retrying...');
          // Retry once more after another frame
          setTimeout(() => {
            if (localScreenContainerRef.current && videoTrack) {
              localScreenContainerRef.current.innerHTML = '';
              videoTrack.play(localScreenContainerRef.current);
              console.log('[Agora] Screen track playing into localScreenContainer (retry)');
            }
          }, 200);
        }
        // Re-play camera into filmstrip thumbnail
        if (localVideoContainerRef.current && localVideoTrackRef.current && isVideoEnabled) {
          localVideoContainerRef.current.innerHTML = '';
          localVideoTrackRef.current.play(localVideoContainerRef.current, { fit: 'cover', mirror: true });
        }
      }, 100);

      // Listen for track ended (user clicks "Stop sharing" in browser)
      videoTrack.on('track-ended', () => {
        stopScreenShareRef.current?.();
      });
    } catch (err: any) {
      console.error('[Agora] Screen share error:', err);
      if (err.message?.includes('Permission denied') || err.code === 'PERMISSION_DENIED' ||
          err.message?.includes('NotAllowedError') || err.code === 'NOT_READABLE') {
        return; // User cancelled or denied
      }
      toast.error('Ekran paylasimi baslatilamadi: ' + (err.message || ''));
    }
  }, [isVideoEnabled]);

  // Re-play local video into the current container ref (call after layout changes)
  const replayLocalVideo = useCallback(() => {
    setTimeout(() => {
      if (localVideoContainerRef.current && localVideoTrackRef.current && isVideoEnabled) {
        localVideoContainerRef.current.innerHTML = '';
        localVideoTrackRef.current.play(localVideoContainerRef.current, { fit: 'cover', mirror: true });
      }
    }, 100);
  }, [isVideoEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.close();
      screenTrackRef.current?.close();
      clientRef.current?.leave().catch(() => {});
    };
  }, []);

  return {
    // State
    isConnected,
    isConnecting,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    remoteTiles,
    messages,
    screenShareState,
    // Refs for layout
    localVideoRef: localVideoContainerRef,
    localScreenPreviewRef: localScreenContainerRef,
    // Actions
    join,
    leave,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    replayLocalVideo,
    sendMessage: (text: string) => {
      // For now, messages go through existing SignalR chat
      // Agora RTM can be added later
      setMessages(prev => [...prev, { text, sender: displayName, time: new Date().toLocaleTimeString('tr-TR') }]);
    },
  };
}
