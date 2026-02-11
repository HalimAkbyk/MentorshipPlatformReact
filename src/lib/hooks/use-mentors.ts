import { useQuery } from '@tanstack/react-query';
import { mentorsApi, type MentorFilters } from '../../lib/api/mentors';

export function useMentors(filters: MentorFilters = {}) {
  return useQuery({
    queryKey: ['mentors', filters],
    queryFn: () => mentorsApi.list(filters),
  });
}

export function useMentor(id: string) {
  return useQuery({
    queryKey: ['mentor', id],
    queryFn: () => mentorsApi.getById(id),
    enabled: !!id,
  });
}