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
  const remoteColsClass = useMemo(() => {
    const n = remoteTiles.length;
    if (n <= 1) return 'grid-cols-1';
    if (n === 2) return 'grid-cols-2';
    return 'grid-cols-2 md:grid-cols-3';
  }, [remoteTiles.length]);

  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      {/* Local Video */}
      <Card className="bg-gray-800 border-gray-700 relative overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="relative w-full h-full bg-gray-900">
            <div ref={localVideoRef} className="absolute inset-0" />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded text-sm">
              {localLabel}
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-10">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-gray-700 text-white text-3xl">
                    {localDisplayName ? getInitials(localDisplayName) : (isMentor ? 'M' : 'S')}
                  </AvatarFallback>
                </Avatar>
                {localDisplayName && (
                  <span className="text-gray-300 text-sm mt-2">{localDisplayName}</span>
                )}
              </div>
            )}
            {isMentor && !isRoomActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90 z-20">
                <div className="text-center text-white">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Oda Aktif Değil</p>
                  <p className="text-sm text-gray-400">Odayı aktifleştirin</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Remote Tiles */}
      <Card className="bg-gray-800 border-gray-700 relative overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="relative w-full h-full bg-gray-900 p-3">
            {remoteTiles.length === 0 && isRoomActive && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <p>{isMentor ? 'Öğrenci bekleniyor...' : 'Mentör bekleniyor...'}</p>
                  {isMentor && <p className="text-sm mt-2">Oda aktif, öğrenci katılabilir</p>}
                </div>
              </div>
            )}

            {!isMentor && remoteTiles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <p>Mentör bekleniyor...</p>
                </div>
              </div>
            )}

            {isMentor && !isRoomActive && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Öğrenci katılamaz</p>
                  <p className="text-sm mt-2">Önce odayı aktifleştirin</p>
                </div>
              </div>
            )}

            {remoteTiles.length > 0 && (
              <div className={`grid ${remoteColsClass} gap-3 h-full`}>
                {remoteTiles.map(tile => (
                  <div
                    key={tile.identity}
                    className="relative bg-gray-950 rounded-lg overflow-hidden border border-gray-700 h-full"
                  >
                    <div className="relative w-full h-full bg-black">
                      <div className="absolute inset-0">
                        <RemoteVideoMount videoEl={tile.cameraVideoEl} objectFit="cover" />
                      </div>
                      {/* Name + muted indicator */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {tile.displayName}
                        </div>
                        {!tile.isAudioEnabled && (
                          <div className="bg-red-600/80 rounded p-1" title="Mikrofon kapalı">
                            <MicOff className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      {tile.isHandRaised && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center gap-1 animate-bounce z-20">
                          <span className="text-xs">✋</span>
                        </div>
                      )}
                      {(!tile.cameraVideoEl || !tile.isVideoEnabled) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-[5]">
                          <Avatar className="w-20 h-20 mb-2">
                            <AvatarFallback className="bg-gray-700 text-white text-2xl">
                              {getInitials(tile.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-300 text-sm">{tile.displayName}</span>
                          <div className="flex items-center gap-1 mt-1 text-gray-500">
                            <VideoOff className="w-3.5 h-3.5" />
                            <span className="text-xs">Kamera kapalı</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
