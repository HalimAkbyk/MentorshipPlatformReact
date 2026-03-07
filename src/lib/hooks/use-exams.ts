import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsApi } from '../api/exams';
import type {
  CreateExamInput,
  UpdateExamInput,
  AddQuestionInput,
  SubmitAnswerInput,
} from '../api/exams';

// ─── Mentor Hooks ────────────────────────────────────────────────────────────

export function useMyExams(params?: {
  scopeType?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['exams', 'my-exams', params],
    queryFn: () => examsApi.getMyExams(params),
  });
}

export function useExamDetail(examId: string) {
  return useQuery({
    queryKey: ['exams', 'detail', examId],
    queryFn: () => examsApi.getExamDetail(examId),
    enabled: !!examId,
  });
}

export function useExamResults(examId: string, params?: {
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['exams', 'results', examId, params],
    queryFn: () => examsApi.getExamResults(examId, params),
    enabled: !!examId,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExamInput) => examsApi.createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-exams'] });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExamInput }) =>
      examsApi.updateExam(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'detail', variables.id] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => examsApi.deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-exams'] });
    },
  });
}

export function usePublishExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => examsApi.publishExam(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'available'] });
    },
  });
}

export function useUnpublishExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => examsApi.unpublishExam(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'available'] });
    },
  });
}

// ─── Question Hooks ──────────────────────────────────────────────────────────

export function useAddQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, data }: { examId: string; data: AddQuestionInput }) =>
      examsApi.addQuestion(examId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'detail', variables.examId] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-exams'] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, questionId, data }: { examId: string; questionId: string; data: AddQuestionInput }) =>
      examsApi.updateQuestion(examId, questionId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'detail', variables.examId] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, questionId }: { examId: string; questionId: string }) =>
      examsApi.deleteQuestion(examId, questionId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'detail', variables.examId] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-exams'] });
    },
  });
}

// ─── Student Hooks ───────────────────────────────────────────────────────────

export function useAvailableExams(params?: {
  scopeType?: string;
  scopeId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['exams', 'available', params],
    queryFn: () => examsApi.getAvailableExams(params),
  });
}

export function useExam(examId: string) {
  return useQuery({
    queryKey: ['exams', examId],
    queryFn: () => examsApi.getExam(examId),
    enabled: !!examId,
  });
}

export function useStartAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: string) => examsApi.startAttempt(examId),
    onSuccess: (_result, examId) => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['exams', examId] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-attempts'] });
    },
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: SubmitAnswerInput[] }) =>
      examsApi.submitAttempt(attemptId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', 'my-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'available'] });
    },
  });
}

export function useAttemptResult(attemptId: string) {
  return useQuery({
    queryKey: ['exams', 'attempt-result', attemptId],
    queryFn: () => examsApi.getAttemptResult(attemptId),
    enabled: !!attemptId,
  });
}

export function useMyAttempts(params?: {
  examId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['exams', 'my-attempts', params],
    queryFn: () => examsApi.getMyAttempts(params),
  });
}
