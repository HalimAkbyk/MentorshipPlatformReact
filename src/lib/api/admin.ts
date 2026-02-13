import { apiClient } from './client';
import type { VerificationApprovalRequest, RefundApprovalRequest } from '../../lib/types';
import type { PendingRefundDto, PendingVerificationDto, PendingMentorDto } from '../types/admin';

export interface AdminBookingDto {
  id: string;
  studentUserId: string;
  studentName: string | null;
  mentorUserId: string;
  mentorName: string | null;
  startAt: string;
  endAt: string;
  durationMin: number;
  status: string;
  price: number;
  currency: string;
  offeringTitle: string | null;
}

export interface SystemHealthDto {
  pendingOrdersCount: number;
  stuckBookingsCount: number;
  activeSessionsCount: number;
  noShowBookingsLast24h: number;
  disputedBookingsCount: number;
  failedPaymentsLast24h: number;
  expiredBookingsLast24h: number;
  cancelledBookingsLast24h: number;
  completedBookingsLast24h: number;
}

export const adminApi = {
  // Verifications
  getPendingVerifications: async (): Promise<PendingVerificationDto[]> => {
    return apiClient.get<PendingVerificationDto[]>('/admin/verifications', { status: 'Pending' });
  },

  approveVerification: async (data: VerificationApprovalRequest): Promise<void> => {
    const { verificationId, ...rest } = data;
    return apiClient.post<void>(`/admin/verifications/${verificationId}/approve`, rest);
  },

  rejectVerification: async (data: VerificationApprovalRequest): Promise<void> => {
    const { verificationId, ...rest } = data;
    return apiClient.post<void>(`/admin/verifications/${verificationId}/reject`, rest);
  },

  // Pending Mentors
  getPendingMentors: async (): Promise<PendingMentorDto[]> => {
    return apiClient.get<PendingMentorDto[]>('/admin/pending-mentors');
  },

  publishMentor: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/mentors/${userId}/publish`);
  },

  unpublishMentor: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/mentors/${userId}/unpublish`);
  },

  // Refunds
  getPendingRefunds: async (): Promise<PendingRefundDto[]> => {
    return apiClient.get<PendingRefundDto[]>('/admin/refunds', { status: 'Pending' });
  },

  approveRefund: async (data: RefundApprovalRequest): Promise<void> => {
    const { refundId, ...rest } = data;
    return apiClient.post<void>(`/admin/refunds/${refundId}/approve`, rest);
  },

  rejectRefund: async (data: RefundApprovalRequest): Promise<void> => {
    const { refundId, ...rest } = data;
    return apiClient.post<void>(`/admin/refunds/${refundId}/reject`, rest);
  },

  // Admin Calendar - All Bookings
  getAllBookings: async (params?: {
    from?: string;
    to?: string;
    status?: string;
    mentorUserId?: string;
  }): Promise<AdminBookingDto[]> => {
    return apiClient.get<AdminBookingDto[]>('/admin/bookings', params);
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealthDto> => {
    return apiClient.get<SystemHealthDto>('/admin/system-health');
  },

  // Users
  suspendUser: async (userId: string, reason: string): Promise<void> => {
    return apiClient.post<void>(`/admin/users/${userId}/suspend`, { reason });
  },

  unsuspendUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/users/${userId}/unsuspend`);
  },
};