import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionPlansApi } from '../api/session-plans';
import type {
  CreateSessionPlanRequest,
  UpdateSessionPlanRequest,
  AddMaterialRequest,
} from '../api/session-plans';

export function useSessionPlans(params?: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['session-plans', params],
    queryFn: () => sessionPlansApi.list(params),
  });
}

export function useSessionPlan(id: string) {
  return useQuery({
    queryKey: ['session-plan', id],
    queryFn: () => sessionPlansApi.getById(id),
    enabled: !!id,
  });
}

export function useSessionPlanByBooking(bookingId: string) {
  return useQuery({
    queryKey: ['session-plan-booking', bookingId],
    queryFn: () => sessionPlansApi.getByBooking(bookingId),
    enabled: !!bookingId,
  });
}

export function useSessionPlanByGroupClass(classId: string) {
  return useQuery({
    queryKey: ['session-plan-class', classId],
    queryFn: () => sessionPlansApi.getByGroupClass(classId),
    enabled: !!classId,
  });
}

export function useCreateSessionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionPlanRequest) => sessionPlansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plans'] });
    },
  });
}

export function useUpdateSessionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionPlanRequest }) =>
      sessionPlansApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-plans'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan', variables.id] });
    },
  });
}

export function useDeleteSessionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plans'] });
    },
  });
}

export function useShareSessionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionPlansApi.share(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plans'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan'] });
    },
  });
}

export function useCompleteSessionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionPlansApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plans'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan'] });
    },
  });
}

export function useAddSessionPlanMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: AddMaterialRequest }) =>
      sessionPlansApi.addMaterial(planId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-plan', variables.planId] });
    },
  });
}

export function useRemoveSessionPlanMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, materialId }: { planId: string; materialId: string }) =>
      sessionPlansApi.removeMaterial(planId, materialId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-plan', variables.planId] });
    },
  });
}

export function useUpdateSessionNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, sessionNotes }: { planId: string; sessionNotes: string }) =>
      sessionPlansApi.updateSessionNotes(planId, sessionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plan'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan-booking'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan-class'] });
    },
  });
}

export function useUpdateStudentNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, studentNotes }: { planId: string; studentNotes: string }) =>
      sessionPlansApi.updateStudentNotes(planId, studentNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plan'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan-booking'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan-class'] });
    },
  });
}

export function useUpdateAgendaItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, agendaItems }: { planId: string; agendaItems: { text: string; completed: boolean }[] }) =>
      sessionPlansApi.updateAgendaItems(planId, agendaItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plan'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan-booking'] });
      queryClient.invalidateQueries({ queryKey: ['session-plan-class'] });
    },
  });
}

// Template hooks
export function useSessionPlanTemplates() {
  return useQuery({
    queryKey: ['session-plan-templates'],
    queryFn: () => sessionPlansApi.getTemplates(),
  });
}

export function useSaveSessionPlanAsTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateName }: { id: string; templateName: string }) =>
      sessionPlansApi.saveAsTemplate(id, templateName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plan-templates'] });
    },
  });
}

export function useCreateSessionPlanFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: { title?: string; bookingId?: string; groupClassId?: string } }) =>
      sessionPlansApi.createFromTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-plans'] });
    },
  });
}
