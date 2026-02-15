'use client';

import { useEffect, useRef } from 'react';
import {
  MediaPlayer,
  MediaOutlet,
  MediaCommunitySkin,
  MediaPoster,
  useMediaPlayer,
  useMediaStore,
} from '@vidstack/react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  startTime = 0,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const hasSeekedRef = useRef(false);
  const timeUpdateRef = useRef(onTimeUpdate);
  const endedRef = useRef(onEnded);

  useEffect(() => {
    timeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  // Reset seek flag when src changes
  useEffect(() => {
    hasSeekedRef.current = false;
  }, [src]);

  return (
    <MediaPlayer
      src={src}
      crossorigin=""
      playsinline
      className="w-full aspect-video bg-black rounded-lg overflow-hidden"
      onCanPlay={(event: any) => {
        if (!hasSeekedRef.current && startTime > 0) {
          const player = event.target;
          if (player && typeof player.currentTime === 'number') {
            player.currentTime = startTime;
          }
          hasSeekedRef.current = true;
        }
      }}
      onTimeUpdate={(event: any) => {
        const player = event.target;
        if (player && typeof player.currentTime === 'number') {
          timeUpdateRef.current?.(player.currentTime);
        }
      }}
      onEnded={() => {
        endedRef.current?.();
      }}
    >
      <MediaOutlet>
        {poster && <MediaPoster src={poster} alt="" />}
      </MediaOutlet>
      <MediaCommunitySkin />
    </MediaPlayer>
  );
}
