import { apiClient } from './client';
import type { Booking, BookingDetail } from '@/lib/types/models';
import type { BookingStatus } from '@/lib/types/enums';

export interface CreateBookingData {
  mentorUserId: string;
  offeringId: string;
  startAt: string;
  durationMin: number;
  notes?: string;
}

export const bookingsApi = {
  create: async (data: CreateBookingData): Promise<{ bookingId: string }> => {
    return apiClient.post('/bookings', data);
  },

  list: async (status?: BookingStatus): Promise<Booking[]> => {
    return apiClient.get<Booking[]>('/bookings/me', { status });
  },

  getById: async (id: string): Promise<BookingDetail> => {
    return apiClient.get<BookingDetail>(`/bookings/${id}`);
  },

  cancel: async (id: string, reason: string): Promise<void> => {
    return apiClient.post(`/bookings/${id}/cancel`, { reason });
  },
};