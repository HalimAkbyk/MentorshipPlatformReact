import { apiClient } from './client';
import type { VerificationApprovalRequest, RefundApprovalRequest } from '../../lib/types';
import type { PendingRefundDto, PendingVerificationDto, PendingMentorDto } from '../types/admin';

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

  // Users
  suspendUser: async (userId: string, reason: string): Promise<void> => {
    return apiClient.post<void>(`/admin/users/${userId}/suspend`, { reason });
  },

  unsuspendUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/users/${userId}/unsuspend`);
  },
};