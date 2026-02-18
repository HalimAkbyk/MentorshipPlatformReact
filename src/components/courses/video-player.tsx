'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeeked?: (currentTime: number) => void;
  onEnded?: () => void;
}

const SKIP_SECONDS = 5;

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];

export default function VideoPlayer({
  src,
  poster,
  startTime = 0,
  onTimeUpdate,
  onPause,
  onSeeked,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSeekedRef = useRef(false);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPauseRef = useRef(onPause);
  const onSeekedRef = useRef(onSeeked);
  const onEndedRef = useRef(onEnded);

  // Overlay feedback state
  const [skipOverlay, setSkipOverlay] = useState<{ direction: 'left' | 'right'; seconds: number } | null>(null);
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Playback speed state
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  // Volume state
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Keep refs updated
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    onPauseRef.current = onPause;
  }, [onPause]);

  useEffect(() => {
    onSeekedRef.current = onSeeked;
  }, [onSeeked]);

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

  // Sync volume to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync playback rate to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Close speed menu on outside click
  useEffect(() => {
    if (!showSpeedMenu) return;
    const handler = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSpeedMenu]);

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
          setIsMuted(prev => !prev);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          e.stopPropagation();
          setVolume(prev => Math.min(1, prev + 0.1));
          setIsMuted(false);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          e.stopPropagation();
          setVolume(prev => Math.max(0, prev - 0.1));
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
    // Ensure playback rate is applied after loading
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [startTime, playbackRate]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      onTimeUpdateRef.current?.(videoRef.current.currentTime);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      onPauseRef.current?.(videoRef.current.currentTime);
    }
  }, []);

  const handleSeeked = useCallback(() => {
    if (videoRef.current) {
      onSeekedRef.current?.(videoRef.current.currentTime);
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

  const handleChangeRate = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Volume icon based on level
  const VolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      );
    }
    if (volume < 0.5) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    );
  };

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
        controlsList="nodownload"
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onSeeked={handleSeeked}
        onEnded={handleEnded}
        onContextMenu={handleContextMenu}
      />

      {/* Custom controls overlay (top-right) */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Volume Control */}
        <div
          className="relative"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
            title={isMuted ? 'Sesi Aç' : 'Sessize Al'}
          >
            <VolumeIcon />
          </button>
          {showVolumeSlider && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pb-2">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/70 font-medium">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1.5 accent-white cursor-pointer [writing-mode:vertical-lr] rotate-180"
                  style={{ height: '80px', width: '20px' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Playback Speed */}
        <div className="relative" ref={speedMenuRef}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center justify-center min-w-[42px] h-9 rounded-lg bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm px-2"
            title="Oynatma Hızı"
          >
            <span className="text-xs font-bold">{playbackRate === 1 ? '1x' : `${playbackRate}x`}</span>
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg py-1 min-w-[90px] max-h-60 overflow-y-auto">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleChangeRate(rate)}
                  className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                    rate === playbackRate
                      ? 'text-primary-400 bg-white/10 font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {rate === 1 ? 'Normal' : `${rate}x`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* Playback speed indicator (shown briefly when rate != 1) */}
      {playbackRate !== 1 && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md">
            {playbackRate}x
          </span>
        </div>
      )}
    </div>
  );
}
