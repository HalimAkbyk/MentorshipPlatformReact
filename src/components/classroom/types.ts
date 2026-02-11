// Shared types for classroom video conferencing

export type BgMode =
  | { type: 'none' }
  | { type: 'blur' }
  | { type: 'image'; url: string };

export type RemoteTile = {
  identity: string;
  displayName: string;
  isHandRaised: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  cameraVideoEl: HTMLVideoElement | null;
  screenVideoEl: HTMLVideoElement | null;
  audioEls: HTMLMediaElement[];
};

export type ScreenShareState = {
  active: boolean;
  sharerIdentity: string | null; // null = local user sharing
  screenVideoEl: HTMLVideoElement | null; // for remote screen shares
  isLocal: boolean;
};

export type ChatMessage = {
  text: string;
  sender: string;
  time: string;
};

export type DataTrackMessage =
  | { type: 'CHAT_MESSAGE'; text: string; timestamp: number }
  | { type: 'HAND_RAISE'; raised: boolean; timestamp: number }
  | { type: 'SCREEN_SHARE'; sharing: boolean; sharerIdentity: string }
  | { type: 'MUTE_PARTICIPANT'; targetIdentity: string }
  | { type: 'KICK_PARTICIPANT'; targetIdentity: string; reason?: string };

export const VIRTUAL_BACKGROUNDS = [
  { id: 'none', name: 'Yok', image: null as null | string },
  { id: 'blur', name: 'Bulanık', image: 'blur' },
  { id: 'office', name: 'Ofis', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop' },
  { id: 'library', name: 'Kütüphane', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1280&h=720&fit=crop' },
  { id: 'nature', name: 'Doğa', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&h=720&fit=crop' },
];

// Parse Twilio identity format: "userId|displayName"
export const parseIdentity = (identity: string) => {
  const parts = identity.split('|');
  return {
    userId: parts[0],
    displayName: parts.length > 1 ? parts.slice(1).join('|') : parts[0],
  };
};

// Check if a track is a screen share based on its name
export const isScreenShareTrack = (track: any): boolean => {
  return track?.name === 'screen-share' || track?.trackName === 'screen-share';
};
