import { apiClient } from './client';

// ── Types ──

export interface CurriculumListDto {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  level?: string;
  totalWeeks: number;
  status: string;
  isDefault: boolean;
  createdAt: string;
}

export interface TopicMaterialDto {
  libraryItemId: string;
  title: string;
  itemType: string;
  fileFormat: string;
  materialRole: string;
  sortOrder: number;
}

export interface CurriculumTopicDto {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
  estimatedMinutes?: number;
  objectiveText?: string;
  linkedExamId?: string;
  linkedAssignmentId?: string;
  materials: TopicMaterialDto[];
}

export interface CurriculumWeekDto {
  id: string;
  weekNumber: number;
  title: string;
  description?: string;
  sortOrder: number;
  topics: CurriculumTopicDto[];
}

export interface CurriculumDetailDto {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  level?: string;
  totalWeeks: number;
  estimatedHoursPerWeek?: number;
  status: string;
  isDefault: boolean;
  createdAt: string;
  weeks: CurriculumWeekDto[];
}

export interface StudentProgressDto {
  enrollmentId: string;
  curriculumId: string;
  studentName: string;
  completionPercentage: number;
  status: string;
  startedAt: string;
  topicProgresses: {
    topicId: string;
    status: string;
    completedAt?: string;
    mentorNote?: string;
  }[];
}

export interface EnrolledCurriculumDto {
  enrollmentId: string;
  curriculumId: string;
  curriculumTitle: string;
  subject?: string;
  level?: string;
  totalWeeks: number;
  completionPercentage: number;
  status: string;
  startedAt: string;
}

export interface UpdateTopicProgressRequest {
  enrollmentId: string;
  topicId: string;
  status: string;
  mentorNote?: string;
  bookingId?: string;
}

export interface CurriculumTemplateDto {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  level?: string;
  totalWeeks: number;
  createdAt: string;
  templateType: string;
}

export interface CreateCurriculumFromTemplateRequest {
  title?: string;
  description?: string;
}

export interface CurriculumListResponse {
  items: CurriculumListDto[];
  totalCount: number;
  totalPages: number;
}

// ── Request Types ──

export interface CreateCurriculumRequest {
  title: string;
  description?: string;
  subject?: string;
  level?: string;
  totalWeeks: number;
  estimatedHoursPerWeek?: number;
}

export interface UpdateCurriculumRequest {
  title?: string;
  description?: string;
  subject?: string;
  level?: string;
  totalWeeks?: number;
  estimatedHoursPerWeek?: number;
}

export interface CreateWeekRequest {
  title: string;
  description?: string;
  weekNumber?: number;
}

export interface UpdateWeekRequest {
  title?: string;
  description?: string;
  weekNumber?: number;
}

export interface CreateTopicRequest {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  objectiveText?: string;
  linkedExamId?: string;
  linkedAssignmentId?: string;
}

export interface UpdateTopicRequest {
  title?: string;
  description?: string;
  estimatedMinutes?: number;
  objectiveText?: string;
  linkedExamId?: string;
  linkedAssignmentId?: string;
}

export interface AddTopicMaterialRequest {
  libraryItemId: string;
  materialRole: string;
}

// ── API ──

export const curriculumApi = {
  // Curriculum CRUD
  list: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<CurriculumListResponse> => {
    return apiClient.get<CurriculumListResponse>('/curriculums', params);
  },

  getById: async (id: string): Promise<CurriculumDetailDto> => {
    return apiClient.get<CurriculumDetailDto>(`/curriculums/${id}`);
  },

  create: async (data: CreateCurriculumRequest): Promise<string> => {
    return apiClient.post<string>('/curriculums', data);
  },

  update: async (id: string, data: UpdateCurriculumRequest): Promise<void> => {
    return apiClient.put(`/curriculums/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/curriculums/${id}`);
  },

  publish: async (id: string): Promise<void> => {
    return apiClient.post(`/curriculums/${id}/publish`);
  },

  // Week operations
  addWeek: async (curriculumId: string, data: CreateWeekRequest): Promise<string> => {
    return apiClient.post<string>(`/curriculums/${curriculumId}/weeks`, data);
  },

  updateWeek: async (weekId: string, data: UpdateWeekRequest): Promise<void> => {
    return apiClient.put(`/curriculum-weeks/${weekId}`, data);
  },

  deleteWeek: async (weekId: string): Promise<void> => {
    return apiClient.delete(`/curriculum-weeks/${weekId}`);
  },

  // Topic operations
  addTopic: async (weekId: string, data: CreateTopicRequest): Promise<string> => {
    return apiClient.post<string>(`/curriculum-weeks/${weekId}/topics`, data);
  },

  updateTopic: async (topicId: string, data: UpdateTopicRequest): Promise<void> => {
    return apiClient.put(`/curriculum-topics/${topicId}`, data);
  },

  deleteTopic: async (topicId: string): Promise<void> => {
    return apiClient.delete(`/curriculum-topics/${topicId}`);
  },

  // Topic material operations
  addTopicMaterial: async (topicId: string, data: AddTopicMaterialRequest): Promise<void> => {
    return apiClient.post(`/curriculum-topics/${topicId}/materials`, data);
  },

  removeTopicMaterial: async (topicId: string, itemId: string): Promise<void> => {
    return apiClient.delete(`/curriculum-topics/${topicId}/materials/${itemId}`);
  },

  // Assignment
  assignToStudent: async (curriculumId: string, studentUserId: string): Promise<void> => {
    return apiClient.post(`/curriculums/${curriculumId}/assign`, { studentUserId });
  },

  // Progress
  getStudentProgress: async (curriculumId: string, studentId: string): Promise<StudentProgressDto> => {
    return apiClient.get<StudentProgressDto>(`/curriculums/${curriculumId}/progress/${studentId}`);
  },

  // Student: get my enrollment
  getMyEnrollment: async (): Promise<CurriculumDetailDto | null> => {
    try {
      return await apiClient.get<CurriculumDetailDto>('/curriculums/my-enrollment');
    } catch {
      return null;
    }
  },

  getMyProgress: async (): Promise<StudentProgressDto | null> => {
    try {
      return await apiClient.get<StudentProgressDto>('/curriculums/my-progress');
    } catch {
      return null;
    }
  },

  // Multiple enrolled curriculums
  getMyEnrolledCurriculums: async (): Promise<EnrolledCurriculumDto[]> => {
    try {
      return await apiClient.get<EnrolledCurriculumDto[]>('/curriculums/my-enrollments');
    } catch {
      return [];
    }
  },

  // Mentor: get all students' progress
  getMentorStudentsProgress: async (curriculumId?: string): Promise<StudentProgressDto[]> => {
    return apiClient.get<StudentProgressDto[]>('/curriculums/students-progress', curriculumId ? { curriculumId } : undefined);
  },

  // Mentor: update topic progress
  updateTopicProgress: async (data: UpdateTopicProgressRequest): Promise<void> => {
    return apiClient.put(`/curriculums/progress/topics/${data.topicId}`, data);
  },

  // Template operations
  saveAsTemplate: async (id: string, templateName: string): Promise<string> => {
    return apiClient.post<string>(`/curriculums/${id}/save-as-template`, { templateName });
  },

  getTemplates: async (): Promise<CurriculumTemplateDto[]> => {
    return apiClient.get<CurriculumTemplateDto[]>('/curriculums/templates');
  },

  createFromTemplate: async (templateId: string, data: CreateCurriculumFromTemplateRequest): Promise<string> => {
    return apiClient.post<string>(`/curriculums/from-template/${templateId}`, data);
  },
};
