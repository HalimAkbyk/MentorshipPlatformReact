'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

const SKIP_SECONDS = 5;

export default function VideoPlayer({
  src,
  poster,
  startTime = 0,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSeekedRef = useRef(false);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);

  // Overlay feedback state
  const [skipOverlay, setSkipOverlay] = useState<{ direction: 'left' | 'right'; seconds: number } | null>(null);
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Only handle if focus is within our container (not in an input elsewhere)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault();
          e.stopPropagation();
          video.currentTime = Math.max(0, video.currentTime - SKIP_SECONDS);
          showOverlay('left', SKIP_SECONDS);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          e.stopPropagation();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + SKIP_SECONDS);
          showOverlay('right', SKIP_SECONDS);
          break;
        }
        case ' ':
        case 'k': {
          e.preventDefault();
          e.stopPropagation();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        }
        case 'f': {
          e.preventDefault();
          e.stopPropagation();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            container.requestFullscreen?.();
          }
          break;
        }
        case 'm': {
          e.preventDefault();
          e.stopPropagation();
          video.muted = !video.muted;
          break;
        }
      }
    };

    // Capture phase so we handle the event BEFORE the native <video> controls do
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const showOverlay = useCallback((direction: 'left' | 'right', seconds: number) => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    setSkipOverlay({ direction, seconds });
    overlayTimeoutRef.current = setTimeout(() => {
      setSkipOverlay(null);
    }, 600);
  }, []);

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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Double-click left/right side to skip
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const containerWidth = rect.width;

    if (clickX < containerWidth * 0.35) {
      // Left third — rewind
      video.currentTime = Math.max(0, video.currentTime - SKIP_SECONDS);
      showOverlay('left', SKIP_SECONDS);
    } else if (clickX > containerWidth * 0.65) {
      // Right third — forward
      video.currentTime = Math.min(video.duration || 0, video.currentTime + SKIP_SECONDS);
      showOverlay('right', SKIP_SECONDS);
    }
  }, [showOverlay]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black group"
      style={{ aspectRatio: '16 / 9', maxHeight: '70vh' }}
      tabIndex={0}
      onDoubleClick={handleDoubleClick}
    >
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

      {/* Skip overlay feedback */}
      {skipOverlay && (
        <div
          className={`absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-10 ${
            skipOverlay.direction === 'left' ? 'left-0 w-2/5' : 'right-0 w-2/5'
          }`}
        >
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-2 animate-fade-in">
            {skipOverlay.direction === 'left' ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            )}
            <span className="text-white font-semibold text-sm">{skipOverlay.seconds}s</span>
          </div>
        </div>
      )}
    </div>
  );
}
