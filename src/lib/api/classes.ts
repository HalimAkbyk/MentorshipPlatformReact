import { apiClient } from './client';
import type { GroupClass, CreateGroupClassRequest } from '../../lib/types';

export const classesApi = {
  create: async (data: CreateGroupClassRequest): Promise<{ id: string }> => {
    return apiClient.post('/classes', data);
  },

  list: async (filters?: {
    mentorId?: string;
    status?: string;
    startAfter?: string;
  }): Promise<GroupClass[]> => {
    return apiClient.get<GroupClass[]>('/classes', filters);
  },

  getById: async (classId: string): Promise<GroupClass> => {
    return apiClient.get<GroupClass>(`/classes/${classId}`);
  },

  enroll: async (classId: string): Promise<{ enrollmentId: string }> => {
    return apiClient.post(`/classes/${classId}/enroll`);
  },

  cancel: async (classId: string, reason: string): Promise<void> => {
    return apiClient.post(`/classes/${classId}/cancel`, { reason });
  },
};
