import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '../../lib/api/classes';
import type { CreateGroupClassRequest } from '../../lib/types';

export function useGroupClasses(filters?: {
  mentorId?: string;
  status?: string;
  startAfter?: string;
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

export function useCreateGroupClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupClassRequest) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useEnrollInClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classId: string) => classesApi.enroll(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}