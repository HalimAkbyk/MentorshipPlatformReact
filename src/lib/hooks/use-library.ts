import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '../api/library';
import type { CreateLibraryItemRequest, UpdateLibraryItemRequest } from '../api/library';

export function useLibraryItems(params?: {
  itemType?: string;
  fileFormat?: string;
  category?: string;
  subject?: string;
  search?: string;
  isTemplate?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['library-items', params],
    queryFn: () => libraryApi.list(params),
  });
}

export function useLibraryItem(id: string) {
  return useQuery({
    queryKey: ['library-item', id],
    queryFn: () => libraryApi.getById(id),
    enabled: !!id,
  });
}

export function useLibraryStats() {
  return useQuery({
    queryKey: ['library-stats'],
    queryFn: () => libraryApi.getStats(),
  });
}

export function useCreateLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLibraryItemRequest) => libraryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
    },
  });
}

export function useUpdateLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLibraryItemRequest }) =>
      libraryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
      queryClient.invalidateQueries({ queryKey: ['library-item'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
    },
  });
}

export function useDeleteLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => libraryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
    },
  });
}

export function useUploadLibraryFile() {
  return useMutation({
    mutationFn: (file: File) => libraryApi.upload(file),
  });
}
