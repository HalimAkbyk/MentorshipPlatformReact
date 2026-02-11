import { apiClient } from './client';
import type { AvailabilitySlot, CreateAvailabilitySlotRequest } from '@/lib/types';

export const availabilityApi = {
  getMentorSlots: async (mentorId: string, from?: string, to?: string): Promise<AvailabilitySlot[]> => {
    return apiClient.get<AvailabilitySlot[]>(`/mentors/${mentorId}/availability`, { from, to });
  },

  // ✅ yeni: mentor kendi slotları
  getMySlots: async (from?: string, to?: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/mentors/me/availability`, { from, to });
  },

  createSlot: async (data: CreateAvailabilitySlotRequest): Promise<{ id: string }> => {
    return apiClient.post('/mentors/me/availability', data);
  },

  deleteSlot: async (slotId: string): Promise<void> => {
    return apiClient.delete(`/mentors/me/availability/${slotId}`);
  },
};
