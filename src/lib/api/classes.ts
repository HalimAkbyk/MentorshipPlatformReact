import { apiClient } from './client';
import type { GroupClass, GroupClassDetail, MyEnrollment } from '../types/models';
import type { CreateGroupClassRequest, PaginatedResponse } from '../types/api';

export const classesApi = {
  create: async (data: CreateGroupClassRequest): Promise<{ id: string }> => {
    return apiClient.post('/classes', data);
  },

  list: async (filters?: {
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<GroupClass>> => {
    return apiClient.get<PaginatedResponse<GroupClass>>('/classes', filters);
  },

  getById: async (classId: string): Promise<GroupClassDetail> => {
    return apiClient.get<GroupClassDetail>(`/classes/${classId}`);
  },

  getMyClasses: async (status?: string): Promise<GroupClass[]> => {
    return apiClient.get<GroupClass[]>('/classes/my', status ? { status } : undefined);
  },

  enroll: async (classId: string): Promise<{ enrollmentId: string }> => {
    return apiClient.post(`/classes/${classId}/enroll`);
  },

  cancel: async (classId: string, reason: string): Promise<void> => {
    return apiClient.post(`/classes/${classId}/cancel`, { reason });
  },

  complete: async (classId: string): Promise<void> => {
    return apiClient.post(`/classes/${classId}/complete`);
  },

  getMyEnrollments: async (): Promise<MyEnrollment[]> => {
    return apiClient.get<MyEnrollment[]>('/classes/enrollments/my');
  },

  cancelEnrollment: async (enrollmentId: string, reason: string): Promise<void> => {
    return apiClient.post(`/classes/enrollments/${enrollmentId}/cancel`, { reason });
  },
};
