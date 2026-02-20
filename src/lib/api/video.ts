import { apiClient } from './client';

export interface VideoTokenRequest {
  roomName: string;
  isHost?: boolean;
}

export interface VideoTokenResponse {
  token: string;
  roomName: string;
  expiresInSeconds: number;
}

export interface RoomStatusResponse {
  roomName: string;
  isActive: boolean;
  hostConnected: boolean;
  participantCount: number;
}

export const videoApi = {
  getToken: async (data: VideoTokenRequest): Promise<VideoTokenResponse> => {
    return apiClient.post<VideoTokenResponse>('/video/token', data);
  },

  createSession: async (resourceType: string, resourceId: string) => {
    return apiClient.post('/video/session', {
      resourceType,
      resourceId,
    });
  },

  getRoomStatus: async (roomName: string): Promise<RoomStatusResponse> => {
    return apiClient.get<RoomStatusResponse>(`/video/room/${roomName}/status`);
  },
};