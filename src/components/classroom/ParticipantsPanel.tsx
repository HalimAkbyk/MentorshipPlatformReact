'use client';

import { X, Mic, MicOff, Video, VideoOff, Hand, UserMinus, VolumeX, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';
import { RemoteTile, parseIdentity } from './types';

interface ParticipantsPanelProps {
  remoteTiles: RemoteTile[];
  localDisplayName: string;
  localIsAudioEnabled: boolean;
  localIsVideoEnabled: boolean;
  isMentor: boolean;
  onMuteParticipant?: (identity: string) => void;
  onUnmuteParticipant?: (identity: string) => void;
  onKickParticipant?: (identity: string) => void;
  onClose: () => void;
}

export function ParticipantsPanel({
  remoteTiles,
  localDisplayName,
  localIsAudioEnabled,
  localIsVideoEnabled,
  isMentor,
  onMuteParticipant,
  onUnmuteParticipant,
  onKickParticipant,
  onClose,
}: ParticipantsPanelProps) {
  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-semibold">
          Katılımcılar ({1 + remoteTiles.length})
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Local participant */}
        <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
              {localDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {localDisplayName} (Siz)
              </p>
              <p className="text-gray-400 text-xs">
                {isMentor ? 'Mentor' : 'Öğrenci'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {localIsAudioEnabled ? (
              <Mic className="w-4 h-4 text-green-400" />
            ) : (
              <MicOff className="w-4 h-4 text-red-400" />
            )}
            {localIsVideoEnabled ? (
              <Video className="w-4 h-4 text-green-400" />
            ) : (
              <VideoOff className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>

        {/* Remote participants */}
        {remoteTiles.map((tile) => (
          <div
            key={tile.identity}
            className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                {tile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm font-medium truncate">
                    {tile.displayName}
                  </p>
                  {tile.isHandRaised && (
                    <Hand className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  )}
                </div>
                <p className="text-gray-400 text-xs">
                  {isMentor ? 'Öğrenci' : 'Mentor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {tile.isAudioEnabled ? (
                <Mic className="w-4 h-4 text-green-400" />
              ) : (
                <MicOff className="w-4 h-4 text-red-400" />
              )}

              {/* Mentor-only controls */}
              {isMentor && (
                <>
                  {tile.isAudioEnabled ? (
                    <button
                      onClick={() => onMuteParticipant?.(tile.identity)}
                      className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-yellow-400 transition-colors"
                      title="Sesini kapat"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnmuteParticipant?.(tile.identity)}
                      className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-green-400 transition-colors"
                      title="Sesini aç"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onKickParticipant?.(tile.identity)}
                    className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-red-400 transition-colors"
                    title="Odadan çıkar"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {remoteTiles.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Henüz başka katılımcı yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
