'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  getConnection,
  joinClassroom,
  leaveClassroom,
  sendClassroomMessage,
  sendClassroomSignal,
  onClassroomMessage,
  onClassroomSignal,
  type ClassroomMessagePayload,
  type ClassroomSignalPayload,
} from '../signalr/chat-connection';
import type { ChatMessage } from '../../components/classroom/types';

interface UseClassroomSignalingOptions {
  roomName: string;
  displayName: string;
  userId: string;
  isHost: boolean;
  enabled: boolean;
  onMuted?: () => void;
  onKicked?: () => void;
  onWhiteboardToggle?: (open: boolean) => void;
  onRemoteScreenShare?: (active: boolean) => void;
}

export function useClassroomSignaling({
  roomName,
  displayName,
  userId,
  isHost,
  enabled,
  onMuted,
  onKicked,
  onWhiteboardToggle,
  onRemoteScreenShare,
}: UseClassroomSignalingOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const joinedRef = useRef(false);
  const chatOpenRef = useRef(false);

  // Keep ref in sync
  chatOpenRef.current = isChatOpen;

  // Join/leave classroom group
  useEffect(() => {
    if (!enabled || !roomName) return;

    const tryJoin = async () => {
      const conn = getConnection();
      if (conn?.state === 'Connected' && !joinedRef.current) {
        await joinClassroom(roomName);
        joinedRef.current = true;
        console.log('[ClassroomSignaling] Joined classroom:', roomName);
      }
    };

    // Try immediately and retry after a short delay (connection might not be ready yet)
    tryJoin();
    const retryTimer = setTimeout(tryJoin, 2000);

    return () => {
      clearTimeout(retryTimer);
      if (joinedRef.current) {
        leaveClassroom(roomName).catch(() => {});
        joinedRef.current = false;
      }
    };
  }, [enabled, roomName]);

  // Listen for classroom messages
  useEffect(() => {
    if (!enabled) return;

    const handleMessage = (payload: ClassroomMessagePayload) => {
      const msg: ChatMessage = {
        text: payload.text,
        sender: payload.senderName,
        time: payload.time,
      };
      setMessages(prev => [...prev, msg]);

      // Increment unread if chat is closed and message is from someone else
      if (!chatOpenRef.current && payload.senderId !== userId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleSignal = (payload: ClassroomSignalPayload) => {
      switch (payload.signalType) {
        case 'whiteboard-open':
          onWhiteboardToggle?.(true);
          break;
        case 'whiteboard-close':
          onWhiteboardToggle?.(false);
          break;
        case 'screen-share-start':
          onRemoteScreenShare?.(true);
          break;
        case 'screen-share-stop':
          onRemoteScreenShare?.(false);
          break;
        case 'mute-participant':
          if (!isHost) {
            onMuted?.();
          }
          break;
        case 'kick-participant':
          if (!isHost) {
            onKicked?.();
          }
          break;
      }
    };

    onClassroomMessage(handleMessage);
    onClassroomSignal(handleSignal);

    return () => {
      const conn = getConnection();
      conn?.off('ClassroomMessage', handleMessage);
      conn?.off('ClassroomSignal', handleSignal);
    };
  }, [enabled, userId, isHost, onMuted, onKicked, onWhiteboardToggle, onRemoteScreenShare]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await sendClassroomMessage(roomName, displayName, text.trim());
    },
    [roomName, displayName]
  );

  const signalWhiteboard = useCallback(
    async (open: boolean) => {
      await sendClassroomSignal(roomName, open ? 'whiteboard-open' : 'whiteboard-close');
    },
    [roomName]
  );

  const signalScreenShare = useCallback(
    async (active: boolean) => {
      await sendClassroomSignal(roomName, active ? 'screen-share-start' : 'screen-share-stop');
    },
    [roomName]
  );

  const signalMuteParticipant = useCallback(
    async (targetIdentity: string) => {
      await sendClassroomSignal(roomName, 'mute-participant', targetIdentity);
    },
    [roomName]
  );

  const signalKickParticipant = useCallback(
    async (targetIdentity: string) => {
      await sendClassroomSignal(roomName, 'kick-participant', targetIdentity);
    },
    [roomName]
  );

  const openChat = useCallback(() => {
    setIsChatOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  return {
    messages,
    unreadCount,
    isChatOpen,
    sendMessage,
    signalWhiteboard,
    signalScreenShare,
    signalMuteParticipant,
    signalKickParticipant,
    openChat,
    closeChat,
    toggleChat,
  };
}
