'use client';

import { RefObject, useMemo } from 'react';
import { Users, Video, VideoOff, MicOff, Monitor } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { RemoteVideoMount } from './RemoteVideoMount';
import { RemoteTile, ScreenShareState } from './types';

interface GroupClassroomLayoutProps {
  localVideoRef: RefObject<HTMLDivElement>;
  isVideoEnabled: boolean;
  isRoomActive: boolean;
  isMentor: boolean;
  localLabel: string;
  remoteTiles: RemoteTile[];
  screenShareState?: ScreenShareState;
  localScreenPreviewRef?: RefObject<HTMLDivElement>;
}

export function GroupClassroomLayout({
  localVideoRef,
  isVideoEnabled,
  isRoomActive,
  isMentor,
  localLabel,
  remoteTiles,
  screenShareState,
  localScreenPreviewRef,
}: GroupClassroomLayoutProps) {
  const totalParticipants = 1 + remoteTiles.length; // local + remotes
  const isScreenShareActive = screenShareState?.active ?? false;

  const gridClass = useMemo(() => {
    if (totalParticipants <= 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto';
    if (totalParticipants <= 4) return 'grid-cols-2 max-w-5xl mx-auto';
    if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  }, [totalParticipants]);

  // ─── Screen Share Layout (Presenter + sidebar) ───
  if (isScreenShareActive) {
    return (
      <div className="flex gap-3 w-full h-full">
        {/* Main area: Screen share */}
        <div className="flex-1 min-w-0">
          <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full h-full">
            {screenShareState?.isLocal ? (
              // Local screen share preview
              <div ref={localScreenPreviewRef} className="w-full h-full" />
            ) : screenShareState?.screenVideoEl ? (
              // Remote screen share
              <RemoteVideoMount videoEl={screenShareState.screenVideoEl} objectFit="contain" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Monitor className="w-12 h-12" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1.5 z-10">
              <Monitor className="w-3 h-3" />
              {screenShareState?.isLocal
                ? 'Ekranınız paylaşılıyor'
                : screenShareState?.sharerIdentity
                  ? `${remoteTiles.find(t => t.identity === screenShareState.sharerIdentity)?.displayName ?? 'Katılımcı'} ekranını paylaşıyor`
                  : 'Ekran paylaşımı'}
            </div>
          </div>
        </div>

        {/* Sidebar: participant thumbnails */}
        <div className="w-48 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {/* Local */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shrink-0">
            <div className="absolute inset-0">
              <div ref={localVideoRef} className="w-full h-full" />
            </div>
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
              {localLabel}
            </div>
            {!isVideoEnabled && isRoomActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-[5]">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gray-700 text-white text-lg">
                    {isMentor ? 'M' : 'S'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Remote participants */}
          {remoteTiles.map(tile => (
            <div key={tile.identity} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shrink-0">
              <div className="absolute inset-0">
                <RemoteVideoMount videoEl={tile.cameraVideoEl} objectFit="cover" />
              </div>
              <div className="absolute bottom-1 left-1 flex items-center gap-1 z-10">
                <div className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {tile.displayName}
                </div>
                {!tile.isAudioEnabled && (
                  <div className="bg-red-600/80 rounded p-0.5">
                    <MicOff className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              {tile.isHandRaised && (
                <div className="absolute top-1 right-1 text-xs">✋</div>
              )}
              {(!tile.cameraVideoEl || !tile.isVideoEnabled) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-[5]">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-700 text-white text-sm">
                      {tile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-500 text-[10px] mt-1">{tile.displayName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Standard Grid Layout (no screen share) ───
  return (
    <div className={`grid ${gridClass} gap-3 w-full h-full auto-rows-fr`}>
      {/* Local Video */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
        <div className="absolute inset-0">
          <div ref={localVideoRef} className="w-full h-full" />
        </div>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
          {localLabel}
        </div>
        {!isVideoEnabled && isRoomActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gray-700 text-white text-2xl">
                {isMentor ? 'M' : 'S'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        {isMentor && !isRoomActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-90 z-20">
            <div className="text-center text-white">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">Oda Aktif Değil</p>
              <p className="text-xs text-gray-400">Odayı aktifleştirin</p>
            </div>
          </div>
        )}
      </div>

      {/* Remote Tiles */}
      {remoteTiles.map(tile => (
        <div
          key={tile.identity}
          className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video"
        >
          <div className="absolute inset-0">
            <RemoteVideoMount videoEl={tile.cameraVideoEl} objectFit="cover" />
          </div>
          {/* Name + indicators */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
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
              <Avatar className="w-16 h-16 mb-2">
                <AvatarFallback className="bg-gray-700 text-white text-2xl">
                  {tile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-400 text-sm">{tile.displayName}</span>
              <div className="flex items-center gap-1 mt-1 text-gray-500">
                <VideoOff className="w-3.5 h-3.5" />
                <span className="text-xs">Kamera kapalı</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Empty state when room active but no participants */}
      {remoteTiles.length === 0 && isRoomActive && (
        <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm">{isMentor ? 'Öğrenci bekleniyor...' : 'Katılımcı bekleniyor...'}</p>
            {isMentor && <p className="text-xs mt-1 text-gray-500">Oda aktif, öğrenciler katılabilir</p>}
          </div>
        </div>
      )}
    </div>
  );
}
