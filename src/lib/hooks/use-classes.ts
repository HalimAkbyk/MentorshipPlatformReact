import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '../api/classes';
import type { CreateGroupClassRequest } from '../types/api';

export function useGroupClasses(filters?: {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: () => classesApi.list(filters),
  });
}

export function useGroupClass(classId: string) {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: () => classesApi.getById(classId),
    enabled: !!classId,
  });
}

export function useMyGroupClasses(status?: string) {
  return useQuery({
    queryKey: ['my-classes', status],
    queryFn: () => classesApi.getMyClasses(status),
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => classesApi.getMyEnrollments(),
  });
}

export function useCreateGroupClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupClassRequest) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });
}

export function useEnrollInClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => classesApi.enroll(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });
}

export function useCancelGroupClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, reason }: { classId: string; reason: string }) =>
      classesApi.cancel(classId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });
}

export function useCompleteGroupClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => classesApi.complete(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, reason }: { enrollmentId: string; reason: string }) =>
      classesApi.cancelEnrollment(enrollmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}
