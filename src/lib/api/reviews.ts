import { apiClient } from './client';
import type { Review, RatingSummary, CreateReviewRequest } from '../types';

export const reviewsApi = {
  create: async (data: CreateReviewRequest): Promise<{ id: string }> => {
    return apiClient.post('/reviews', data);
  },

  getMentorReviews: async (mentorId: string): Promise<Review[]> => {
    return apiClient.get<Review[]>(`/reviews/mentors/${mentorId}`);
  },

  getRatingSummary: async (mentorId: string): Promise<RatingSummary> => {
    return apiClient.get<RatingSummary>(`/reviews/mentors/${mentorId}/summary`);
  },
};