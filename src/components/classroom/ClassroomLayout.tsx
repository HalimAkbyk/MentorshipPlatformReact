'use client';

import { RefObject, useMemo } from 'react';
import { Users, Monitor, Video, VideoOff, MicOff } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { RemoteVideoMount } from './RemoteVideoMount';
import { RemoteTile, ScreenShareState } from './types';

// Helper: get initials from display name (first letter of first + last word)
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface ClassroomLayoutProps {
  // Local video
  localVideoRef: RefObject<HTMLDivElement>;
  localScreenPreviewRef: RefObject<HTMLDivElement>;
  isVideoEnabled: boolean;
  isRoomActive: boolean;
  isMentor: boolean;
  localLabel: string;
  localDisplayName?: string;

  // Remote participants
  remoteTiles: RemoteTile[];

  // Screen share state
  screenShareState: ScreenShareState;
}

export function ClassroomLayout({
  localVideoRef,
  localScreenPreviewRef,
  isVideoEnabled,
  isRoomActive,
  isMentor,
  localLabel,
  localDisplayName,
  remoteTiles,
  screenShareState,
}: ClassroomLayoutProps) {
  const isScreenSharing = screenShareState.active;

  if (isScreenSharing) {
    return <ScreenShareLayout
      localVideoRef={localVideoRef}
      localScreenPreviewRef={localScreenPreviewRef}
      isVideoEnabled={isVideoEnabled}
      localLabel={localLabel}
      localDisplayName={localDisplayName}
      remoteTiles={remoteTiles}
      screenShareState={screenShareState}
      isMentor={isMentor}
    />;
  }

  return <NormalLayout
    localVideoRef={localVideoRef}
    isVideoEnabled={isVideoEnabled}
    isRoomActive={isRoomActive}
    isMentor={isMentor}
    localLabel={localLabel}
    localDisplayName={localDisplayName}
    remoteTiles={remoteTiles}
  />;
}

// ═══════════════════════════════════════════════════════════════
// Normal Layout - Grid of equal tiles
// ═══════════════════════════════════════════════════════════════
function NormalLayout({
  localVideoRef,
  isVideoEnabled,
  isRoomActive,
  isMentor,
  localLabel,
  localDisplayName,
  remoteTiles,
}: {
  localVideoRef: RefObject<HTMLDivElement>;
  isVideoEnabled: boolean;
  isRoomActive: boolean;
  isMentor: boolean;
  localLabel: string;
  localDisplayName?: string;
  remoteTiles: RemoteTile[];
}) {
  // 1:1 layout: remote full-screen center, local PiP bottom-left
  const tile = remoteTiles[0];

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Remote video — full area */}
      {tile && (
        <div className="absolute inset-0">
          <RemoteVideoMount videoEl={tile.cameraVideoEl} objectFit="cover" />
          {/* Remote name badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 z-10">
            <div className="bg-black/60 text-white text-sm px-3 py-1.5 rounded">
              {tile.displayName}
            </div>
            {!tile.isAudioEnabled && (
              <div className="bg-red-600/80 rounded p-1" title="Mikrofon kapalı">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          {tile.isHandRaised && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center gap-1 animate-bounce z-20">
              <span className="text-xs">✋</span>
            </div>
          )}
          {(!tile.cameraVideoEl || !tile.isVideoEnabled) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-[5]">
              <Avatar className="w-28 h-28 mb-3">
                <AvatarFallback className="bg-gray-700 text-white text-4xl">
                  {getInitials(tile.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-300 text-lg">{tile.displayName}</span>
              <div className="flex items-center gap-1 mt-2 text-gray-500">
                <VideoOff className="w-4 h-4" />
                <span className="text-sm">Kamera kapalı</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Waiting states (no remote participant) */}
      {!tile && isRoomActive && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <p>{isMentor ? 'Öğrenci bekleniyor...' : 'Eğitmen bekleniyor...'}</p>
            {isMentor && <p className="text-sm mt-2">Oda aktif, öğrenci katılabilir</p>}
          </div>
        </div>
      )}

      {isMentor && !isRoomActive && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Oda Aktif Değil</p>
            <p className="text-sm text-gray-400">Odayı aktifleştirin</p>
          </div>
        </div>
      )}

      {/* Local video — PiP overlay bottom-left */}
      <div className="absolute bottom-4 left-4 w-[200px] h-[140px] rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl z-20 bg-gray-800">
        <div ref={localVideoRef} className="w-full h-full" />
        <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
          {localLabel}
        </div>
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gray-700 text-white text-sm">
                {localDisplayName ? getInitials(localDisplayName) : (isMentor ? 'M' : 'S')}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Screen Share Layout - Teams-like: big screen + small filmstrip
// ═══════════════════════════════════════════════════════════════
function ScreenShareLayout({
  localVideoRef,
  localScreenPreviewRef,
  isVideoEnabled,
  localLabel,
  localDisplayName,
  remoteTiles,
  screenShareState,
  isMentor,
}: {
  localVideoRef: RefObject<HTMLDivElement>;
  localScreenPreviewRef: RefObject<HTMLDivElement>;
  isVideoEnabled: boolean;
  localLabel: string;
  localDisplayName?: string;
  remoteTiles: RemoteTile[];
  screenShareState: ScreenShareState;
  isMentor: boolean;
}) {
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Main area - screen share content */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden min-h-0">
        {screenShareState.isLocal ? (
          // We are sharing - show our screen preview
          <div className="w-full h-full flex items-center justify-center">
            <div ref={localScreenPreviewRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Ekranınızı paylaşıyorsunuz
            </div>
          </div>
        ) : (
          // Someone else is sharing - show their screen
          <div className="w-full h-full flex items-center justify-center">
            <RemoteVideoMount
              videoEl={screenShareState.screenVideoEl}
              objectFit="contain"
            />
            {!screenShareState.screenVideoEl && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Monitor className="w-16 h-16" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filmstrip - small camera thumbnails */}
      <div className="h-[140px] shrink-0">
        <div className="flex gap-2 h-full overflow-x-auto pb-1">
          {/* Local camera thumbnail */}
          <div className="relative w-[200px] shrink-0 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            {/*
              When screen sharing locally, localVideoRef is used in the main area for screen preview.
              So for the filmstrip, we DON'T use localVideoRef here during local screen share.
              Instead, we only mount localVideoRef here when someone ELSE is sharing.
            */}
            {!screenShareState.isLocal && (
              <div ref={localVideoRef} className="w-full h-full" />
            )}
            {screenShareState.isLocal && (
              <div ref={localVideoRef} className="w-full h-full" />
            )}
            <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
              {localLabel}
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gray-700 text-white text-sm">
                    {localDisplayName ? getInitials(localDisplayName) : (isMentor ? 'M' : 'S')}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Remote camera thumbnails */}
          {remoteTiles.map(tile => (
            <div
              key={tile.identity}
              className="relative w-[200px] shrink-0 bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
            >
              <div className="w-full h-full">
                <RemoteVideoMount videoEl={tile.cameraVideoEl} objectFit="cover" />
              </div>
              {/* Name + muted indicator */}
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                <div className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {tile.displayName}
                </div>
                {!tile.isAudioEnabled && (
                  <div className="bg-red-600/80 rounded p-0.5" title="Mikrofon kapalı">
                    <MicOff className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              {tile.isHandRaised && (
                <div className="absolute top-1 right-1 text-yellow-400 text-xs">✋</div>
              )}
              {(!tile.cameraVideoEl || !tile.isVideoEnabled) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-[5]">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-700 text-white text-xs">
                      {getInitials(tile.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-500 text-[10px] mt-0.5">{tile.displayName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
