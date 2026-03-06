import { apiClient } from './client';

export interface SessionRequestDto {
  id: string;
  studentUserId: string;
  studentName: string;
  studentAvatar?: string;
  mentorUserId: string;
  mentorName: string;
  mentorAvatar?: string;
  offeringId: string;
  offeringTitle: string;
  requestedStartAt: string;
  durationMin: number;
  studentNote?: string;
  status: string;
  rejectionReason?: string;
  bookingId?: string;
  createdAt: string;
}

export interface CreateSessionRequestInput {
  mentorUserId: string;
  offeringId: string;
  requestedStartAt: string;
  durationMin: number;
  studentNote?: string;
}

export const sessionRequestsApi = {
  create: (input: CreateSessionRequestInput): Promise<{ id: string }> =>
    apiClient.post('/session-requests', input),

  getMyRequests: (): Promise<SessionRequestDto[]> =>
    apiClient.get('/session-requests/me'),

  getMentorRequests: (): Promise<SessionRequestDto[]> =>
    apiClient.get('/session-requests/mentor'),

  getAdminRequests: (): Promise<SessionRequestDto[]> =>
    apiClient.get('/session-requests/admin'),

  approve: (id: string): Promise<{ bookingId: string }> =>
    apiClient.post(`/session-requests/${id}/approve`),

  reject: (id: string, reason?: string): Promise<void> =>
    apiClient.post(`/session-requests/${id}/reject`, { reason }),
};
