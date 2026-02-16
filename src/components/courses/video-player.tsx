'use client';

import { useEffect, useRef, useCallback } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSeekedRef = useRef(false);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);

  // Keep refs updated
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Reset seek flag and load new source
  useEffect(() => {
    hasSeekedRef.current = false;
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  const handleCanPlay = useCallback(() => {
    if (!hasSeekedRef.current && startTime > 0 && videoRef.current) {
      videoRef.current.currentTime = startTime;
      hasSeekedRef.current = true;
    }
  }, [startTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      onTimeUpdateRef.current?.(videoRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    onEndedRef.current?.();
  }, []);

  // Disable right-click on video (prevent save-as)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9', maxHeight: '70vh' }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        playsInline
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
