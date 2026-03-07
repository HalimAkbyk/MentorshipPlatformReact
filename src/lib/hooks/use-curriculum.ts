import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { curriculumApi } from '../api/curriculum';
import type {
  CreateCurriculumRequest,
  UpdateCurriculumRequest,
  CreateWeekRequest,
  UpdateWeekRequest,
  CreateTopicRequest,
  UpdateTopicRequest,
  AddTopicMaterialRequest,
  UpdateTopicProgressRequest,
  CreateCurriculumFromTemplateRequest,
} from '../api/curriculum';

// ── Queries ──

export function useCurriculums(params?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['curriculums', params],
    queryFn: () => curriculumApi.list(params),
  });
}

export function useCurriculum(id: string) {
  return useQuery({
    queryKey: ['curriculum', id],
    queryFn: () => curriculumApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentProgress(curriculumId: string, studentId: string) {
  return useQuery({
    queryKey: ['curriculum-progress', curriculumId, studentId],
    queryFn: () => curriculumApi.getStudentProgress(curriculumId, studentId),
    enabled: !!curriculumId && !!studentId,
  });
}

export function useMyEnrollment() {
  return useQuery({
    queryKey: ['my-curriculum-enrollment'],
    queryFn: () => curriculumApi.getMyEnrollment(),
  });
}

export function useMyProgress() {
  return useQuery({
    queryKey: ['my-curriculum-progress'],
    queryFn: () => curriculumApi.getMyProgress(),
  });
}

export function useMyEnrolledCurriculums() {
  return useQuery({
    queryKey: ['my-enrolled-curriculums'],
    queryFn: () => curriculumApi.getMyEnrolledCurriculums(),
  });
}

export function useMentorStudentsProgress(curriculumId?: string) {
  return useQuery({
    queryKey: ['mentor-students-progress', curriculumId],
    queryFn: () => curriculumApi.getMentorStudentsProgress(curriculumId),
  });
}

export function useCurriculumTemplates() {
  return useQuery({
    queryKey: ['curriculum-templates'],
    queryFn: () => curriculumApi.getTemplates(),
  });
}

// ── Mutations ──

export function useCreateCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCurriculumRequest) => curriculumApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

export function useUpdateCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCurriculumRequest }) =>
      curriculumApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum', variables.id] });
    },
  });
}

export function useDeleteCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => curriculumApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

export function usePublishCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => curriculumApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

// Week mutations
export function useAddWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ curriculumId, data }: { curriculumId: string; data: CreateWeekRequest }) =>
      curriculumApi.addWeek(curriculumId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

export function useUpdateWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weekId, data }: { weekId: string; data: UpdateWeekRequest }) =>
      curriculumApi.updateWeek(weekId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

export function useDeleteWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekId: string) => curriculumApi.deleteWeek(weekId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

// Topic mutations
export function useAddTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weekId, data }: { weekId: string; data: CreateTopicRequest }) =>
      curriculumApi.addTopic(weekId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, data }: { topicId: string; data: UpdateTopicRequest }) =>
      curriculumApi.updateTopic(topicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => curriculumApi.deleteTopic(topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

// Material mutations
export function useAddTopicMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, data }: { topicId: string; data: AddTopicMaterialRequest }) =>
      curriculumApi.addTopicMaterial(topicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

export function useRemoveTopicMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, itemId }: { topicId: string; itemId: string }) =>
      curriculumApi.removeTopicMaterial(topicId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
    },
  });
}

// Topic Progress
export function useUpdateTopicProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTopicProgressRequest) => curriculumApi.updateTopicProgress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-progress'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-students-progress'] });
      queryClient.invalidateQueries({ queryKey: ['my-curriculum-progress'] });
    },
  });
}

// Templates
export function useSaveCurriculumAsTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateName }: { id: string; templateName: string }) =>
      curriculumApi.saveAsTemplate(id, templateName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-templates'] });
    },
  });
}

export function useCreateCurriculumFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: CreateCurriculumFromTemplateRequest }) =>
      curriculumApi.createFromTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculums'] });
    },
  });
}

// Assignment
export function useAssignCurriculum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ curriculumId, studentUserId }: { curriculumId: string; studentUserId: string }) =>
      curriculumApi.assignToStudent(curriculumId, studentUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum-progress'] });
    },
  });
}
