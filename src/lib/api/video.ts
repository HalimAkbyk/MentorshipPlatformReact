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

export interface LeaveRoomResponse {
  isRoomEmpty: boolean;
  sessionEnded: boolean;
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

  leaveRoom: async (roomName: string): Promise<LeaveRoomResponse> => {
    return apiClient.post<LeaveRoomResponse>(`/video/room/${roomName}/leave`);
  },

  endSession: async (roomName: string): Promise<void> => {
    return apiClient.post(`/video/room/${roomName}/end`);
  },

  getProvider: async (): Promise<{ provider: string; whiteboardEnabled: boolean }> => {
    return apiClient.get('/video/provider');
  },

  createWhiteboardRoom: async (roomName: string): Promise<{ roomUuid: string }> => {
    return apiClient.post('/video/whiteboard/room', { roomName });
  },

  getWhiteboardToken: async (roomUuid: string, userId: string, isWriter: boolean): Promise<{ token: string }> => {
    return apiClient.post('/video/whiteboard/token', { roomUuid, userId, isWriter });
  },
};