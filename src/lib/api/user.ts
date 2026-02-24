import { apiClient } from './client';
import type { User, UpdateProfileRequest, ChangePasswordRequest } from '../../lib/types';

export const userApi = {
  getMe: async (): Promise<User> => {
    return apiClient.get<User>('/me');
  },

   updateProfile: async (data: { displayName: string; phone?: string; birthYear?: number }): Promise<User> => {
    return apiClient.patch<User>('/me', data);
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.postForm('/me/avatar', formData);
  },

  setAvatarUrl: async (avatarUrl: string): Promise<{ avatarUrl: string }> => {
    return apiClient.put<{ avatarUrl: string }>('/me/avatar-url', { avatarUrl });
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    return apiClient.post('/auth/change-password', data);
  },
};

// ===== Admin Avatar Moderation =====
export interface UserAvatarInfo {
  userId: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roles: string[];
  isFlagged: boolean;
}

export const adminAvatarApi = {
  getUserAvatars: async (flaggedOnly?: boolean, withAvatarOnly?: boolean): Promise<UserAvatarInfo[]> => {
    const params: Record<string, string> = {};
    if (flaggedOnly) params.flaggedOnly = 'true';
    if (withAvatarOnly) params.withAvatarOnly = 'true';
    return apiClient.get<UserAvatarInfo[]>('/admin/user-avatars', params);
  },

  flagAvatar: async (userId: string): Promise<void> => {
    return apiClient.post(`/admin/user-avatars/${userId}/flag`);
  },

  resetAvatar: async (userId: string): Promise<void> => {
    return apiClient.post(`/admin/user-avatars/${userId}/reset`);
  },

  unflagAvatar: async (userId: string): Promise<void> => {
    return apiClient.post(`/admin/user-avatars/${userId}/unflag`);
  },
};
