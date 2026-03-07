import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsApi } from '../api/assignments';
import type {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAssignmentRequest,
  ReviewSubmissionRequest,
} from '../api/assignments';

// ── Queries ──

export function useAssignments(params?: {
  status?: string;
  assignmentType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => assignmentsApi.list(params),
  });
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: ['assignment', id],
    queryFn: () => assignmentsApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentAssignments(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['student-assignments', params],
    queryFn: () => assignmentsApi.getStudentAssignments(params),
  });
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: () => assignmentsApi.getSubmissions(assignmentId),
    enabled: !!assignmentId,
  });
}

// ── Mutations ──

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssignmentRequest) => assignmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssignmentRequest }) =>
      assignmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function usePublishAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
    },
  });
}

export function useCloseAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
    },
  });
}

export function useAddAssignmentMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: { libraryItemId: string; isRequired: boolean };
    }) => assignmentsApi.addMaterial(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
    },
  });
}

export function useRemoveAssignmentMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, itemId }: { assignmentId: string; itemId: string }) =>
      assignmentsApi.removeMaterial(assignmentId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
    },
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string;
      data: SubmitAssignmentRequest;
    }) => assignmentsApi.submit(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
    },
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: ReviewSubmissionRequest;
    }) => assignmentsApi.reviewSubmission(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
    },
  });
}
