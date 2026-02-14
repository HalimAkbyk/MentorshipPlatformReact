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