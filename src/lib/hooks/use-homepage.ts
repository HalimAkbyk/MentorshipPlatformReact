import { useQuery } from '@tanstack/react-query';
import { homepageApi } from '../api/homepage';

export function useTopRatedMentors(limit = 12) {
  return useQuery({
    queryKey: ['homepage', 'mentors', 'top-rated', limit],
    queryFn: () => homepageApi.getTopRatedMentors(limit),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useNewestMentors(limit = 12) {
  return useQuery({
    queryKey: ['homepage', 'mentors', 'newest', limit],
    queryFn: () => homepageApi.getNewestMentors(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedCourses(limit = 8) {
  return useQuery({
    queryKey: ['homepage', 'courses', 'featured', limit],
    queryFn: () => homepageApi.getFeaturedCourses(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlatformStatistics() {
  return useQuery({
    queryKey: ['homepage', 'statistics'],
    queryFn: () => homepageApi.getStatistics(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useTestimonials(limit = 6) {
  return useQuery({
    queryKey: ['homepage', 'testimonials', limit],
    queryFn: () => homepageApi.getTestimonials(limit),
    staleTime: 30 * 60 * 1000, // 30 min
  });
}
