import { apiClient } from './client';

// Types
export interface OfferingQuestion {
  id: string;
  questionText: string;
  isRequired: boolean;
  sortOrder: number;
}

export interface OfferingDto {
  id: string;
  type: string;
  title: string;
  description?: string;
  durationMin: number;
  price: number;
  currency: string;
  isActive: boolean;
  category?: string;
  subtitle?: string;
  detailedDescription?: string;
  sessionType?: string;
  maxBookingDaysAhead: number;
  minNoticeHours: number;
  sortOrder: number;
  coverImageUrl?: string;
  availabilityTemplateId?: string;
  questionCount: number;
  questions: OfferingQuestion[];
}

export interface CreateOfferingData {
  title: string;
  description?: string;
  durationMin: number;
  price: number;
  category?: string;
  subtitle?: string;
  detailedDescription?: string;
  sessionType?: string;
  maxBookingDaysAhead?: number;
  minNoticeHours?: number;
}

export interface UpdateOfferingData {
  title: string;
  description?: string;
  durationMin: number;
  price: number;
  category?: string;
  subtitle?: string;
  detailedDescription?: string;
  sessionType?: string;
  maxBookingDaysAhead: number;
  minNoticeHours: number;
  coverImageUrl?: string;
}

export interface QuestionData {
  questionText: string;
  isRequired: boolean;
}

export const offeringsApi = {
  // Mentor's own offerings
  getMyOfferings: async (): Promise<OfferingDto[]> => {
    return apiClient.get<OfferingDto[]>('/offerings/me');
  },

  // Public: offering detail
  getById: async (id: string): Promise<OfferingDto> => {
    return apiClient.get<OfferingDto>(`/offerings/${id}`);
  },

  // Public: mentor's active offerings
  getMentorOfferings: async (mentorId: string): Promise<OfferingDto[]> => {
    return apiClient.get<OfferingDto[]>(`/offerings/mentor/${mentorId}`);
  },

  // Create offering
  create: async (data: CreateOfferingData): Promise<{ id: string }> => {
    return apiClient.post('/offerings', data);
  },

  // Update offering
  update: async (id: string, data: UpdateOfferingData): Promise<void> => {
    return apiClient.put(`/offerings/${id}`, data);
  },

  // Delete offering
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/offerings/${id}`);
  },

  // Toggle active/inactive
  toggle: async (id: string): Promise<{ isActive: boolean }> => {
    return apiClient.patch(`/offerings/${id}/toggle`);
  },

  // Reorder offerings
  reorder: async (offeringIds: string[]): Promise<void> => {
    return apiClient.put('/offerings/reorder', { offeringIds });
  },

  // Upsert booking questions
  upsertQuestions: async (id: string, questions: QuestionData[]): Promise<void> => {
    return apiClient.put(`/offerings/${id}/questions`, { questions });
  },
};
