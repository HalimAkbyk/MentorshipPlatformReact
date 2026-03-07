import { apiClient } from './client';

// ── Types ──

export interface SessionPlanMaterialDto {
  id: string;
  libraryItemId: string;
  libraryItemTitle: string;
  itemType: string;
  fileFormat: string;
  fileUrl?: string;
  phase: string;
  sortOrder: number;
  note?: string;
}

export interface SessionPlanListDto {
  id: string;
  title?: string;
  bookingId?: string;
  groupClassId?: string;
  status: string;
  sharedAt?: string;
  createdAt: string;
  materialCount: number;
}

export interface SessionPlanDetailDto {
  id: string;
  title?: string;
  bookingId?: string;
  groupClassId?: string;
  curriculumTopicId?: string;
  preSessionNote?: string;
  sessionObjective?: string;
  sessionNotes?: string;
  agendaItems?: { text: string; completed: boolean }[];
  postSessionSummary?: string;
  linkedAssignmentId?: string;
  status: string;
  sharedAt?: string;
  createdAt: string;
  preMaterials: SessionPlanMaterialDto[];
  duringMaterials: SessionPlanMaterialDto[];
  postMaterials: SessionPlanMaterialDto[];
}

export interface SessionPlanListResponse {
  items: SessionPlanListDto[];
  totalCount: number;
  totalPages: number;
}

export interface CreateSessionPlanRequest {
  title?: string;
  bookingId?: string;
  groupClassId?: string;
  curriculumTopicId?: string;
  preSessionNote?: string;
  sessionObjective?: string;
}

export interface UpdateSessionPlanRequest {
  title?: string;
  preSessionNote?: string;
  sessionObjective?: string;
  sessionNotes?: string;
  agendaItems?: { text: string; completed: boolean }[];
  postSessionSummary?: string;
  linkedAssignmentId?: string;
}

export interface AddMaterialRequest {
  libraryItemId: string;
  phase: string;
  note?: string;
}

export interface SessionPlanTemplateDto {
  id: string;
  title: string;
  sessionObjective?: string;
  materialCount: number;
  createdAt: string;
  templateType: string;
}

export interface CreateSessionPlanFromTemplateRequest {
  title?: string;
  bookingId?: string;
  groupClassId?: string;
}

// ── API ──

export const sessionPlansApi = {
  list: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<SessionPlanListResponse> => {
    return apiClient.get<SessionPlanListResponse>('/session-plans', params);
  },

  getById: async (id: string): Promise<SessionPlanDetailDto> => {
    return apiClient.get<SessionPlanDetailDto>(`/session-plans/${id}`);
  },

  create: async (data: CreateSessionPlanRequest): Promise<string> => {
    const res = await apiClient.post<{ id: string }>('/session-plans', data);
    return res.id;
  },

  update: async (id: string, data: UpdateSessionPlanRequest): Promise<void> => {
    return apiClient.put(`/session-plans/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/session-plans/${id}`);
  },

  share: async (id: string): Promise<void> => {
    return apiClient.post(`/session-plans/${id}/share`);
  },

  complete: async (id: string): Promise<void> => {
    return apiClient.post(`/session-plans/${id}/complete`);
  },

  addMaterial: async (planId: string, data: AddMaterialRequest): Promise<string> => {
    const res = await apiClient.post<{ id: string }>(`/session-plans/${planId}/materials`, data);
    return res.id;
  },

  removeMaterial: async (planId: string, materialId: string): Promise<void> => {
    return apiClient.delete(`/session-plans/${planId}/materials/${materialId}`);
  },

  getByBooking: async (bookingId: string): Promise<SessionPlanDetailDto | null> => {
    try {
      return await apiClient.get<SessionPlanDetailDto>(`/session-plans/by-booking/${bookingId}`);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  getByGroupClass: async (classId: string): Promise<SessionPlanDetailDto | null> => {
    try {
      return await apiClient.get<SessionPlanDetailDto>(`/session-plans/by-group-class/${classId}`);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  updateSessionNotes: async (planId: string, sessionNotes: string): Promise<void> => {
    return apiClient.put(`/session-plans/${planId}`, { sessionNotes });
  },

  updateAgendaItems: async (planId: string, agendaItems: { text: string; completed: boolean }[]): Promise<void> => {
    return apiClient.put(`/session-plans/${planId}`, { agendaItems });
  },

  // Template operations
  saveAsTemplate: async (id: string, templateName: string): Promise<string> => {
    const res = await apiClient.post<{ id: string }>(`/session-plans/${id}/save-as-template`, { templateName });
    return res.id;
  },

  getTemplates: async (): Promise<SessionPlanTemplateDto[]> => {
    const res = await apiClient.get<{ items: SessionPlanTemplateDto[] }>('/session-plans/templates');
    return res.items ?? [];
  },

  createFromTemplate: async (templateId: string, data: CreateSessionPlanFromTemplateRequest): Promise<string> => {
    const res = await apiClient.post<{ id: string }>(`/session-plans/from-template/${templateId}`, data);
    return res.id;
  },
};
