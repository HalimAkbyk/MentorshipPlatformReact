import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../../lib/api/reviews';
import type { CreateReviewRequest } from '../../lib/types';

export function useMentorReviews(mentorId: string) {
  return useQuery({
    queryKey: ['reviews', 'mentor', mentorId],
    queryFn: () => reviewsApi.getMentorReviews(mentorId),
    enabled: !!mentorId,
  });
}

export function useRatingSummary(mentorId: string) {
  return useQuery({
    queryKey: ['reviews', 'summary', mentorId],
    queryFn: () => reviewsApi.getRatingSummary(mentorId),
    enabled: !!mentorId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}