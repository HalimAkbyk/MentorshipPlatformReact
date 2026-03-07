import { apiClient } from './client';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface QuestionOptionDto {
  key: string;
  text: string;
  isCorrect?: boolean; // only present in mentor detail view
}

export interface ExamListItem {
  id: string;
  title: string;
  description: string | null;
  scopeType: string;
  scopeId: string | null;
  durationMinutes: number;
  passingScore: number;
  isPublished: boolean;
  shuffleQuestions: boolean;
  showResults: boolean;
  maxAttempts: number | null;
  startDate: string | null;
  endDate: string | null;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface ExamDetailQuestion {
  id: string;
  questionText: string;
  questionType: string;
  imageUrl: string | null;
  points: number;
  sortOrder: number;
  optionsJson: string | null;
  correctAnswer: string | null;
  explanation: string | null;
}

export interface ExamDetail {
  id: string;
  title: string;
  description: string | null;
  scopeType: string;
  scopeId: string | null;
  durationMinutes: number;
  passingScore: number;
  isPublished: boolean;
  shuffleQuestions: boolean;
  showResults: boolean;
  maxAttempts: number | null;
  startDate: string | null;
  endDate: string | null;
  questions: ExamDetailQuestion[];
  attemptCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AvailableExamItem {
  id: string;
  title: string;
  description: string | null;
  scopeType: string;
  scopeId: string | null;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number | null;
  startDate: string | null;
  endDate: string | null;
  questionCount: number;
  mentorUserId: string;
  mentorName: string;
  myAttemptCount: number;
  createdAt: string;
}

export interface StudentExamQuestion {
  id: string;
  questionText: string;
  questionType: string;
  imageUrl: string | null;
  points: number;
  sortOrder: number;
  options: { key: string; text: string }[] | null;
}

export interface StudentExamView {
  id: string;
  title: string;
  description: string | null;
  scopeType: string;
  scopeId: string | null;
  durationMinutes: number;
  passingScore: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  maxAttempts: number | null;
  startDate: string | null;
  endDate: string | null;
  mentorUserId: string;
  mentorName: string;
  questionCount: number;
  totalPoints: number;
  questions: StudentExamQuestion[];
  createdAt: string;
}

export interface StartAttemptResponse {
  attemptId: string;
  examId: string;
  examTitle: string;
  durationMinutes: number;
  startedAt: string;
  questions: StudentExamQuestion[];
}

export interface SubmitAnswerInput {
  questionId: string;
  answerText?: string | null;
  selectedOptions?: string[] | null;
}

export interface SubmitAttemptResponse {
  attemptId: string;
  status: string;
  totalPoints: number;
  earnedPoints: number;
  scorePercentage: number;
  passed: boolean;
  completedAt: string;
}

export interface StudentAnswerResult {
  answerText: string | null;
  selectedOptionsJson: string | null;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface CorrectInfo {
  correctAnswer: string | null;
  optionsJson: string | null;
  explanation: string | null;
}

export interface AttemptQuestionResult {
  questionId: string;
  questionText: string;
  questionType: string;
  points: number;
  imageUrl: string | null;
  studentAnswer: StudentAnswerResult | null;
  correctInfo: CorrectInfo | null;
}

export interface AttemptResultResponse {
  attemptId: string;
  examId: string;
  examTitle: string;
  studentUserId: string;
  studentName: string;
  startedAt: string;
  completedAt: string;
  status: string;
  totalPoints: number;
  earnedPoints: number;
  scorePercentage: number;
  passed: boolean;
  showResults: boolean;
  questions: AttemptQuestionResult[];
}

export interface AttemptListItem {
  id: string;
  examId: string;
  examTitle: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  totalPoints: number | null;
  earnedPoints: number | null;
  scorePercentage: number | null;
  passed: boolean | null;
}

export interface ExamResultItem {
  id: string;
  studentUserId: string;
  studentName: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  totalPoints: number | null;
  earnedPoints: number | null;
  scorePercentage: number | null;
  passed: boolean | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Request Types ───────────────────────────────────────────────────────────

export interface CreateExamInput {
  title: string;
  description?: string | null;
  scopeType: string;
  scopeId?: string | null;
  durationMinutes: number;
  passingScore: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  maxAttempts?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateExamInput {
  title: string;
  description?: string | null;
  durationMinutes: number;
  passingScore: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  maxAttempts?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AddQuestionInput {
  questionText: string;
  questionType: string;
  imageUrl?: string | null;
  points: number;
  sortOrder: number;
  options?: QuestionOptionDto[] | null;
  correctAnswer?: string | null;
  explanation?: string | null;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const examsApi = {
  // ── Mentor Endpoints ────────────────────────────────────────────────

  createExam: (data: CreateExamInput): Promise<{ id: string }> =>
    apiClient.post('/exams', data),

  updateExam: (id: string, data: UpdateExamInput): Promise<{ success: boolean }> =>
    apiClient.put(`/exams/${id}`, data),

  deleteExam: (id: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/exams/${id}`),

  publishExam: (id: string): Promise<{ success: boolean }> =>
    apiClient.post(`/exams/${id}/publish`),

  unpublishExam: (id: string): Promise<{ success: boolean }> =>
    apiClient.post(`/exams/${id}/unpublish`),

  getMyExams: (params?: {
    scopeType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<ExamListItem>> =>
    apiClient.get('/exams/my-exams', params),

  getExamDetail: (id: string): Promise<ExamDetail> =>
    apiClient.get(`/exams/${id}/detail`),

  addQuestion: (examId: string, data: AddQuestionInput): Promise<{ id: string }> =>
    apiClient.post(`/exams/${examId}/questions`, data),

  updateQuestion: (examId: string, questionId: string, data: AddQuestionInput): Promise<{ success: boolean }> =>
    apiClient.put(`/exams/${examId}/questions/${questionId}`, data),

  deleteQuestion: (examId: string, questionId: string): Promise<{ success: boolean }> =>
    apiClient.delete(`/exams/${examId}/questions/${questionId}`),

  getExamResults: (examId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<ExamResultItem>> =>
    apiClient.get(`/exams/${examId}/results`, params),

  // ── Student Endpoints ───────────────────────────────────────────────

  getAvailableExams: (params?: {
    scopeType?: string;
    scopeId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<AvailableExamItem>> =>
    apiClient.get('/exams/available', params),

  getExam: (id: string): Promise<StudentExamView> =>
    apiClient.get(`/exams/${id}`),

  startAttempt: (examId: string): Promise<StartAttemptResponse> =>
    apiClient.post(`/exams/${examId}/start`),

  submitAttempt: (attemptId: string, answers: SubmitAnswerInput[]): Promise<SubmitAttemptResponse> =>
    apiClient.post(`/exams/attempts/${attemptId}/submit`, { answers }),

  getAttemptResult: (attemptId: string): Promise<AttemptResultResponse> =>
    apiClient.get(`/exams/attempts/${attemptId}/result`),

  getMyAttempts: (params?: {
    examId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<AttemptListItem>> =>
    apiClient.get('/exams/my-attempts', params),
};
