import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../../lib/api/availability';
import type { CreateAvailabilitySlotRequest } from '../../lib/types';

export function useMentorAvailability(mentorId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['availability', mentorId, from, to],
    queryFn: () => availabilityApi.getMentorSlots(mentorId, from, to),
    enabled: !!mentorId,
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAvailabilitySlotRequest) => availabilityApi.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useMyAvailability(from?: string, to?: string) {
  return useQuery({
    queryKey: ['my-availability', from, to],
    queryFn: () => availabilityApi.getMySlots(from, to),
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slotId: string) => availabilityApi.deleteSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}
