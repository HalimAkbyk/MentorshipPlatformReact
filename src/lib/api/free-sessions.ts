import { apiClient } from './client';

export interface FreeSessionDto {
  id: string;
  mentorUserId: string;
  mentorName: string;
  studentUserId: string;
  studentName: string;
  roomName: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  note: string | null;
  createdAt: string;
}

export interface EligibleStudentDto {
  studentId: string;
  displayName: string;
  avatarUrl: string | null;
  remainingCredits: number;
}

export interface CreateFreeSessionResult {
  freeSessionId: string;
  roomName: string;
}

export const freeSessionsApi = {
  create: (studentUserId: string, note?: string) =>
    apiClient.post<CreateFreeSessionResult>('/free-sessions', { studentUserId, note }),

  getEligibleStudents: () =>
    apiClient.get<EligibleStudentDto[]>('/free-sessions/eligible-students'),

  getMyFreeSessions: () =>
    apiClient.get<FreeSessionDto[]>('/free-sessions/me'),

  end: (id: string) =>
    apiClient.post(`/free-sessions/${id}/end`),
};
