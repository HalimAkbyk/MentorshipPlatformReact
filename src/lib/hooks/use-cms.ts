import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '../api/cms';

export function useActiveBanners() {
  return useQuery({
    queryKey: ['cms-banners'],
    queryFn: () => cmsApi.getActiveBanners(),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: ['cms-announcements'],
    queryFn: () => cmsApi.getActiveAnnouncements(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaticPage(slug: string) {
  return useQuery({
    queryKey: ['cms-page', slug],
    queryFn: () => cmsApi.getPageBySlug(slug),
    staleTime: 10 * 60 * 1000, // 10 min
    enabled: !!slug,
  });
}
