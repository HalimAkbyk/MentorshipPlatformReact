import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionRequestsApi, CreateSessionRequestInput } from '../api/session-requests';

export function useMySessionRequests() {
  return useQuery({
    queryKey: ['session-requests', 'me'],
    queryFn: () => sessionRequestsApi.getMyRequests(),
  });
}

export function useMentorSessionRequests() {
  return useQuery({
    queryKey: ['session-requests', 'mentor'],
    queryFn: () => sessionRequestsApi.getMentorRequests(),
  });
}

export function useAdminSessionRequests() {
  return useQuery({
    queryKey: ['session-requests', 'admin'],
    queryFn: () => sessionRequestsApi.getAdminRequests(),
  });
}

export function useCreateSessionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionRequestInput) => sessionRequestsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-requests'] });
    },
  });
}

export function useApproveSessionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionRequestsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-requests'] });
    },
  });
}

export function useRejectSessionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      sessionRequestsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-requests'] });
    },
  });
}
