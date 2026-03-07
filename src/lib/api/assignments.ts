import { apiClient } from './client';

// ── Types ──

export interface AssignmentListDto {
  id: string;
  title: string;
  assignmentType: string;
  difficultyLevel?: string;
  dueDate?: string;
  maxScore?: number;
  status: string;
  submissionCount: number;
  reviewedCount: number;
  createdAt: string;
}

export interface AssignmentMaterialDto {
  libraryItemId: string;
  title: string;
  itemType: string;
  fileFormat: string;
  fileUrl?: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface ReviewDto {
  score?: number;
  feedback?: string;
  status: string;
  reviewedAt: string;
}

export interface SubmissionDto {
  id: string;
  studentUserId: string;
  studentName: string;
  submissionText?: string;
  fileUrl?: string;
  originalFileName?: string;
  submittedAt: string;
  isLate: boolean;
  status: string;
  review?: ReviewDto;
}

export interface AssignmentDetailDto {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  assignmentType: string;
  difficultyLevel?: string;
  estimatedMinutes?: number;
  dueDate?: string;
  maxScore?: number;
  allowLateSubmission: boolean;
  latePenaltyPercent?: number;
  bookingId?: string;
  groupClassId?: string;
  curriculumTopicId?: string;
  status: string;
  createdAt: string;
  materials: AssignmentMaterialDto[];
  submissions: SubmissionDto[];
}

export interface StudentAssignmentDto {
  id: string;
  title: string;
  mentorName: string;
  assignmentType: string;
  dueDate?: string;
  maxScore?: number;
  status: string;
  mySubmissionStatus?: string;
  myScore?: number;
}

export interface AssignmentListResponse {
  items: AssignmentListDto[];
  totalCount: number;
  totalPages: number;
}

export interface StudentAssignmentListResponse {
  items: StudentAssignmentDto[];
  totalCount: number;
  totalPages: number;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  instructions?: string;
  assignmentType: string;
  difficultyLevel?: string;
  estimatedMinutes?: number;
  dueDate?: string;
  maxScore?: number;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  bookingId?: string;
  groupClassId?: string;
  curriculumTopicId?: string;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  instructions?: string;
  assignmentType?: string;
  difficultyLevel?: string;
  estimatedMinutes?: number;
  dueDate?: string;
  maxScore?: number;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
}

export interface SubmitAssignmentRequest {
  submissionText?: string;
  fileUrl?: string;
  originalFileName?: string;
}

export interface ReviewSubmissionRequest {
  score?: number;
  feedback: string;
  status: string; // Approved, RevisionRequired, Rejected
}

export interface AssignmentTemplateDto {
  id: string;
  title: string;
  assignmentType: string;
  difficultyLevel?: string;
  maxScore?: number;
  createdAt: string;
  templateType: string;
}

export interface CreateAssignmentFromTemplateRequest {
  title?: string;
  dueDate?: string;
  bookingId?: string;
  groupClassId?: string;
}

// ── API ──

export const assignmentsApi = {
  // Mentor: list assignments
  list: async (params?: {
    status?: string;
    assignmentType?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AssignmentListResponse> => {
    return apiClient.get<AssignmentListResponse>('/assignments', params);
  },

  // Get assignment detail
  getById: async (id: string): Promise<AssignmentDetailDto> => {
    return apiClient.get<AssignmentDetailDto>(`/assignments/${id}`);
  },

  // Create assignment
  create: async (data: CreateAssignmentRequest): Promise<string> => {
    const res = await apiClient.post<{ id: string }>('/assignments', data);
    return res.id;
  },

  // Update assignment
  update: async (id: string, data: UpdateAssignmentRequest): Promise<void> => {
    return apiClient.put(`/assignments/${id}`, data);
  },

  // Delete assignment
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/assignments/${id}`);
  },

  // Publish assignment
  publish: async (id: string): Promise<void> => {
    return apiClient.post(`/assignments/${id}/publish`);
  },

  // Close assignment
  close: async (id: string): Promise<void> => {
    return apiClient.post(`/assignments/${id}/close`);
  },

  // Add material to assignment
  addMaterial: async (
    assignmentId: string,
    data: { libraryItemId: string; isRequired: boolean }
  ): Promise<void> => {
    return apiClient.post(`/assignments/${assignmentId}/materials`, data);
  },

  // Remove material from assignment
  removeMaterial: async (assignmentId: string, itemId: string): Promise<void> => {
    return apiClient.delete(`/assignments/${assignmentId}/materials/${itemId}`);
  },

  // Student: submit assignment
  submit: async (assignmentId: string, data: SubmitAssignmentRequest): Promise<void> => {
    return apiClient.post(`/assignments/${assignmentId}/submit`, data);
  },

  // Get submissions for an assignment
  getSubmissions: async (assignmentId: string): Promise<SubmissionDto[]> => {
    return apiClient.get<SubmissionDto[]>(`/assignments/${assignmentId}/submissions`);
  },

  // Review a submission
  reviewSubmission: async (submissionId: string, data: ReviewSubmissionRequest): Promise<void> => {
    return apiClient.post(`/assignments/submissions/${submissionId}/review`, data);
  },

  // Student: list my assignments
  getStudentAssignments: async (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<StudentAssignmentListResponse> => {
    return apiClient.get<StudentAssignmentListResponse>('/assignments/student', params);
  },

  // Template operations
  saveAsTemplate: async (id: string, templateName: string): Promise<string> => {
    const res = await apiClient.post<{ id: string }>(`/assignments/${id}/save-as-template`, { templateName });
    return res.id;
  },

  getTemplates: async (): Promise<AssignmentTemplateDto[]> => {
    const res = await apiClient.get<{ items: AssignmentTemplateDto[] }>('/assignments/templates');
    return res.items ?? [];
  },

  createFromTemplate: async (templateId: string, data: CreateAssignmentFromTemplateRequest): Promise<string> => {
    const res = await apiClient.post<{ id: string }>(`/assignments/from-template/${templateId}`, data);
    return res.id;
  },
};
