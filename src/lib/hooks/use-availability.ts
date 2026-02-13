import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../api/availability';
import type { CreateAvailabilitySlotRequest } from '../types';
import type { SaveTemplateRequest, AddOverrideRequest } from '../api/availability';

export function useMentorAvailability(mentorId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['availability', mentorId, from, to],
    queryFn: () => availabilityApi.getMentorSlots(mentorId, from, to),
    enabled: !!mentorId,
  });
}

export function useMyAvailability(from?: string, to?: string) {
  return useQuery({
    queryKey: ['my-availability', from, to],
    queryFn: () => availabilityApi.getMySlots(from, to),
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAvailabilitySlotRequest) => availabilityApi.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => availabilityApi.deleteSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
    },
  });
}

// ---- Template Hooks (NEW) ----
export function useAvailabilityTemplate() {
  return useQuery({
    queryKey: ['availability-template'],
    queryFn: () => availabilityApi.getTemplate(),
  });
}

export function useSaveTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveTemplateRequest) => availabilityApi.saveTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-template'] });
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useAddOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddOverrideRequest) => availabilityApi.addOverride(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-template'] });
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
    },
  });
}

export function useDeleteOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (overrideId: string) => availabilityApi.deleteOverride(overrideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-template'] });
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
    },
  });
}
