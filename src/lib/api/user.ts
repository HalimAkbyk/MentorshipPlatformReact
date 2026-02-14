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

  getPresetAvatars: async (): Promise<PresetAvatar[]> => {
    return apiClient.get<PresetAvatar[]>('/me/preset-avatars');
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    return apiClient.post('/auth/change-password', data);
  },
};

export interface PresetAvatar {
  id: string;
  url: string;
  label: string;
  sortOrder: number;
}

export interface AdminPresetAvatar extends PresetAvatar {
  isActive: boolean;
}

export const adminAvatarApi = {
  getAll: async (): Promise<AdminPresetAvatar[]> => {
    return apiClient.get<AdminPresetAvatar[]>('/admin/preset-avatars');
  },

  create: async (file: File, label: string, sortOrder: number): Promise<AdminPresetAvatar> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);
    formData.append('sortOrder', sortOrder.toString());
    return apiClient.postForm<AdminPresetAvatar>('/admin/preset-avatars', formData);
  },

  update: async (id: string, data: { label: string; sortOrder: number; isActive: boolean }): Promise<AdminPresetAvatar> => {
    return apiClient.put<AdminPresetAvatar>(`/admin/preset-avatars/${id}`, data);
  },

  updateImage: async (id: string, file: File): Promise<AdminPresetAvatar> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.putForm<AdminPresetAvatar>(`/admin/preset-avatars/${id}/image`, formData);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/admin/preset-avatars/${id}`);
  },
};