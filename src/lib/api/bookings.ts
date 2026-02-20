import { apiClient } from './client';
import type { Booking, BookingDetail } from '@/lib/types/models';
import type { BookingStatus } from '@/lib/types/enums';
import type { PaginatedResponse } from '@/lib/types/api';

export interface QuestionResponseData {
  questionId: string;
  answerText: string;
}

export interface CreateBookingData {
  mentorUserId: string;
  offeringId: string;
  startAt: string;
  durationMin: number;
  notes?: string;
  questionResponses?: QuestionResponseData[];
}

export const bookingsApi = {
  create: async (data: CreateBookingData): Promise<{ bookingId: string }> => {
    return apiClient.post('/bookings', data);
  },

  list: async (status?: BookingStatus, page = 1, pageSize = 15): Promise<PaginatedResponse<Booking>> => {
    return apiClient.get('/bookings/me', { status, page, pageSize });
  },

  getById: async (id: string): Promise<BookingDetail> => {
    return apiClient.get<BookingDetail>(`/bookings/${id}`);
  },

  cancel: async (id: string, reason: string): Promise<void> => {
    return apiClient.post(`/bookings/${id}/cancel`, { reason });
  },

  reschedule: async (id: string, newStartAt: string): Promise<void> => {
    return apiClient.post(`/bookings/${id}/reschedule`, { newStartAt });
  },

  approveReschedule: async (id: string): Promise<void> => {
    return apiClient.post(`/bookings/${id}/reschedule/approve`);
  },

  rejectReschedule: async (id: string): Promise<void> => {
    return apiClient.post(`/bookings/${id}/reschedule/reject`);
  },
};