import { apiClient } from './client';
import type { AvailabilitySlot, CreateAvailabilitySlotRequest } from '@/lib/types';

// ---- Template Types ----
export interface AvailabilityRuleDto {
  id?: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string | null;
  endTime: string | null;
  slotIndex: number;
}

export interface AvailabilityOverrideDto {
  id?: string;
  date: string;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface AvailabilitySettingsDto {
  minNoticeHours: number;
  maxBookingDaysAhead: number;
  bufferAfterMin: number;
  slotGranularityMin: number;
  maxBookingsPerDay: number;
}

export interface AvailabilityTemplateDto {
  id: string;
  name: string;
  timezone: string;
  isDefault: boolean;
  settings: AvailabilitySettingsDto;
  rules: AvailabilityRuleDto[];
  overrides: AvailabilityOverrideDto[];
}

export interface SaveTemplateRequest {
  name?: string;
  timezone?: string;
  rules: {
    dayOfWeek: number;
    isActive: boolean;
    startTime: string | null;
    endTime: string | null;
    slotIndex?: number;
  }[];
  settings?: Partial<AvailabilitySettingsDto>;
}

export interface AddOverrideRequest {
  date: string;
  isBlocked: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export const availabilityApi = {
  // ---- Existing Slot APIs ----
  getMentorSlots: async (mentorId: string, from?: string, to?: string): Promise<AvailabilitySlot[]> => {
    return apiClient.get<AvailabilitySlot[]>(`/mentors/${mentorId}/availability`, { from, to });
  },

  getMySlots: async (from?: string, to?: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/mentors/me/availability`, { from, to });
  },

  createSlot: async (data: CreateAvailabilitySlotRequest): Promise<{ id: string }> => {
    return apiClient.post('/mentors/me/availability', data);
  },

  deleteSlot: async (slotId: string): Promise<void> => {
    return apiClient.delete(`/mentors/me/availability/${slotId}`);
  },

  // ---- Template APIs (NEW) ----
  getTemplate: async (): Promise<AvailabilityTemplateDto | null> => {
    return apiClient.get<AvailabilityTemplateDto | null>('/mentors/me/availability/template');
  },

  saveTemplate: async (data: SaveTemplateRequest): Promise<{ templateId: string }> => {
    return apiClient.put('/mentors/me/availability/template', data);
  },

  addOverride: async (data: AddOverrideRequest): Promise<{ overrideId: string }> => {
    return apiClient.post('/mentors/me/availability/override', data);
  },

  deleteOverride: async (overrideId: string): Promise<void> => {
    return apiClient.delete(`/mentors/me/availability/override/${overrideId}`);
  },
};
