import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { freeSessionsApi } from '../api/free-sessions';

export function useEligibleStudents() {
  return useQuery({
    queryKey: ['eligible-students'],
    queryFn: () => freeSessionsApi.getEligibleStudents(),
  });
}

export function useMyFreeSessions() {
  return useQuery({
    queryKey: ['my-free-sessions'],
    queryFn: () => freeSessionsApi.getMyFreeSessions(),
  });
}

export function useCreateFreeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentUserId, note }: { studentUserId: string; note?: string }) =>
      freeSessionsApi.create(studentUserId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligible-students'] });
      queryClient.invalidateQueries({ queryKey: ['my-free-sessions'] });
    },
  });
}

export function useEndFreeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freeSessionsApi.end(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-free-sessions'] });
    },
  });
}
