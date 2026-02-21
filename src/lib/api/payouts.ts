import { apiClient } from './client';

export interface PayoutRequestDto {
  id: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  mentorNote: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface PayoutRequestListDto {
  items: PayoutRequestDto[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
}

export interface PayoutSettingsDto {
  minimumPayoutAmount: number;
  availableBalance: number;
  hasPendingRequest: boolean;
  pendingRequestAmount: number | null;
}

export interface AdminPayoutRequestDto {
  id: string;
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string | null;
  amount: number;
  currency: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  mentorNote: string | null;
  adminNote: string | null;
  processedByName: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminPayoutRequestListDto {
  items: AdminPayoutRequestDto[];
  totalCount: number;
  pageNumber: number;
  totalPages: number;
  pendingCount: number;
  pendingTotal: number;
}

export const payoutsApi = {
  // ─── Mentor ───
  getSettings: (): Promise<PayoutSettingsDto> =>
    apiClient.get('/payout-requests/settings'),

  getMyRequests: (params?: { page?: number; pageSize?: number }): Promise<PayoutRequestListDto> =>
    apiClient.get('/payout-requests', params),

  createRequest: (data: { amount: number; note?: string }): Promise<PayoutRequestDto> =>
    apiClient.post('/payout-requests', data),

  // ─── Admin ───
  getAllRequests: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<AdminPayoutRequestListDto> =>
    apiClient.get('/admin/payout-requests', params),

  processRequest: (id: string, data: { action: string; adminNote?: string }): Promise<void> =>
    apiClient.put(`/admin/payout-requests/${id}/process`, data),
};
