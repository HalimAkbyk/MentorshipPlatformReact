'use client';
import { useEffect, useRef, useState } from 'react';
import { videoApi } from '../../lib/api/video';

interface AgoraWhiteboardProps {
  roomName: string;
  userId: string;
  isWriter: boolean;
}

export function AgoraWhiteboard({ roomName, userId, isWriter }: AgoraWhiteboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fastboardApp, setFastboardApp] = useState<any>(null);
  const [FastboardComponent, setFastboardComponent] = useState<any>(null);
  const mountedRef = useRef(true);
  const appRef = useRef<any>(null);

  useEffect(() => {
    mountedRef.current = true;

    const initWhiteboard = async () => {
      try {
        // 1. Create/get whiteboard room (backend caches roomUuid per roomName)
        const { roomUuid } = await videoApi.createWhiteboardRoom(roomName);
        console.log('[Whiteboard] roomName:', roomName, 'roomUuid:', roomUuid, 'isWriter:', isWriter);

        // 2. Get room token (always request writer token so WindowManager works)
        const { token } = await videoApi.getWhiteboardToken(roomUuid, userId, true);

        // 3. Dynamic import fastboard
        const fastboardModule = await import('@netless/fastboard-react');
        const { createFastboard, Fastboard } = fastboardModule;

        // Always join as writable so WindowManager initializes properly.
        // For non-writers (students), we disable device inputs after joining.
        const app = await createFastboard({
          sdkConfig: {
            appIdentifier: process.env.NEXT_PUBLIC_AGORA_WHITEBOARD_APP_ID || 'ow10IBqAEfGq3-09281LNg/eakbV1sklxJczw',
            region: 'eu',
          },
          joinRoom: {
            uid: userId,
            uuid: roomUuid,
            roomToken: token,
            isWritable: true,
          },
          managerConfig: {
            cursor: true,
          },
        });

        // Disable drawing for non-writers (students) after WindowManager loads
        if (!isWriter && app.room) {
          app.room.disableDeviceInputs = true;
        }

        if (mountedRef.current) {
          appRef.current = app;
          setFastboardApp(app);
          setFastboardComponent(() => Fastboard);
          setIsLoading(false);
        } else {
          // Component unmounted during init — destroy immediately
          app.destroy?.();
        }
      } catch (err: any) {
        console.error('Whiteboard init error:', err);
        if (mountedRef.current) {
          setError(err.message || 'Whiteboard yuklenemedi');
          setIsLoading(false);
        }
      }
    };

    initWhiteboard();

    return () => {
      mountedRef.current = false;
      if (appRef.current) {
        appRef.current.destroy?.();
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, userId, isWriter]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Whiteboard yukleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white">
      {fastboardApp && FastboardComponent && <FastboardComponent app={fastboardApp} theme="light" />}
    </div>
  );
}
