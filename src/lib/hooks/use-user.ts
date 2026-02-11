import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../lib/api/user';
import type { UpdateProfileRequest, ChangePasswordRequest } from '../../lib/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => userApi.getMe(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => userApi.changePassword(data),
  });
}