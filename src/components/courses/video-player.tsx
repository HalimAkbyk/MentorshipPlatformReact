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

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
  const progressRef = useRef<HTMLDivElement>(null);
  const hasSeekedRef = useRef(false);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPauseRef = useRef(onPause);
  const onSeekedRef = useRef(onSeeked);
  const onEndedRef = useRef(onEnded);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Overlay feedback state
  const [skipOverlay, setSkipOverlay] = useState<{ direction: 'left' | 'right'; seconds: number } | null>(null);
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  // Keep refs updated
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { onSeekedRef.current = onSeeked; }, [onSeeked]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  // Reset on source change
  useEffect(() => {
    hasSeekedRef.current = false;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);

  // Sync volume/mute to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Sync playback rate
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

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    setShowControls(true);
    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !showSpeedMenu && !showVolumeSlider) {
        setShowControls(false);
      }
    }, 3000);
  }, [showSpeedMenu, showVolumeSlider]);

  // Fullscreen change detection
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
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
          togglePlay();
          break;
        }
        case 'f': {
          e.preventDefault();
          e.stopPropagation();
          toggleFullscreen();
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
          setVolume(prev => Math.min(1, +(prev + 0.1).toFixed(2)));
          setIsMuted(false);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          e.stopPropagation();
          setVolume(prev => Math.max(0, +(prev - 0.1).toFixed(2)));
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const showOverlay = useCallback((direction: 'left' | 'right', seconds: number) => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    setSkipOverlay({ direction, seconds });
    overlayTimeoutRef.current = setTimeout(() => setSkipOverlay(null), 600);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen?.();
    }
  }, []);

  // Video event handlers
  const handleCanPlay = useCallback(() => {
    if (!hasSeekedRef.current && startTime > 0 && videoRef.current) {
      videoRef.current.currentTime = startTime;
      hasSeekedRef.current = true;
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      setDuration(videoRef.current.duration || 0);
    }
  }, [startTime, playbackRate]);

  const handleTimeUpdateInternal = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdateRef.current?.(videoRef.current.currentTime);
      // Update buffered
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
    }
  }, []);

  const handlePauseInternal = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
    if (videoRef.current) {
      onPauseRef.current?.(videoRef.current.currentTime);
    }
  }, []);

  const handlePlayInternal = useCallback(() => {
    setIsPlaying(true);
    resetHideTimer();
  }, [resetHideTimer]);

  const handleSeekedInternal = useCallback(() => {
    if (videoRef.current) {
      onSeekedRef.current?.(videoRef.current.currentTime);
    }
  }, []);

  const handleEndedInternal = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
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
      video.currentTime = Math.max(0, video.currentTime - SKIP_SECONDS);
      showOverlay('left', SKIP_SECONDS);
    } else if (clickX > containerWidth * 0.65) {
      video.currentTime = Math.min(video.duration || 0, video.currentTime + SKIP_SECONDS);
      showOverlay('right', SKIP_SECONDS);
    } else {
      // Center: toggle fullscreen
      toggleFullscreen();
    }
  }, [showOverlay, toggleFullscreen]);

  // Single click to play/pause
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    // Don't toggle if clicking on controls area
    if ((e.target as HTMLElement).closest('.custom-controls')) return;
    togglePlay();
    resetHideTimer();
  }, [togglePlay, resetHideTimer]);

  // Progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * (video.duration || 0);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleChangeRate = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none"
      style={{ aspectRatio: '16 / 9', maxHeight: '70vh' }}
      tabIndex={0}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
    >
      {/* Video Element - NO native controls */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
        onClick={handleVideoClick}
        onDoubleClick={handleDoubleClick}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdateInternal}
        onPause={handlePauseInternal}
        onPlay={handlePlayInternal}
        onSeeked={handleSeekedInternal}
        onEnded={handleEndedInternal}
        onContextMenu={handleContextMenu}
      />

      {/* Big center play button when paused */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Skip overlay feedback */}
      {skipOverlay && (
        <div
          className={`absolute top-0 bottom-0 flex items-center justify-center pointer-events-none z-20 ${
            skipOverlay.direction === 'left' ? 'left-0 w-2/5' : 'right-0 w-2/5'
          }`}
        >
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-5 py-3 flex items-center gap-2">
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

      {/* Playback speed indicator (always visible at top-left when rate != 1) */}
      {playbackRate !== 1 && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md">
            {playbackRate}x
          </span>
        </div>
      )}

      {/* Custom Controls Bar */}
      <div
        className={`custom-controls absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        <div className="relative px-3 pb-3 pt-8">
          {/* Progress Bar */}
          <div
            ref={progressRef}
            className="group/progress w-full h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer mb-3 transition-all relative"
            onClick={handleProgressClick}
          >
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-teal-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
              style={{ left: `calc(${progressPercent}% - 7px)` }}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Play, Skip, Volume, Time */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-teal-400 transition-colors p-1"
                title={isPlaying ? 'Duraklat (K)' : 'Oynat (K)'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - SKIP_SECONDS);
                    showOverlay('left', SKIP_SECONDS);
                  }
                }}
                className="text-white/70 hover:text-white transition-colors p-1"
                title={`${SKIP_SECONDS}s Geri`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + SKIP_SECONDS);
                    showOverlay('right', SKIP_SECONDS);
                  }
                }}
                className="text-white/70 hover:text-white transition-colors p-1"
                title={`${SKIP_SECONDS}s İleri`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>

              {/* Volume */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className="text-white/70 hover:text-white transition-colors p-1"
                  title={isMuted ? 'Sesi Aç (M)' : 'Sessize Al (M)'}
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                {/* Horizontal volume slider */}
                <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20 ml-1 opacity-100' : 'w-0 opacity-0'}`}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 accent-white cursor-pointer"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-white/80 text-xs font-medium tabular-nums ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right: Speed, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <div className="relative" ref={speedMenuRef}>
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                    playbackRate !== 1
                      ? 'text-teal-400 bg-white/10'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title="Oynatma Hızı"
                >
                  {playbackRate === 1 ? '1x' : `${playbackRate}x`}
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm rounded-lg py-1 min-w-[100px] max-h-60 overflow-y-auto border border-white/10 shadow-xl">
                    {PLAYBACK_RATES.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleChangeRate(rate)}
                        className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${
                          rate === playbackRate
                            ? 'text-teal-400 bg-white/10 font-bold'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white/70 hover:text-white transition-colors p-1"
                title="Tam Ekran (F)"
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
