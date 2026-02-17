import { apiClient } from './client';

// ── Public CMS Types ──

export interface ActiveBanner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  position: string; // "Top" | "Middle" | "Bottom"
}

export interface ActiveAnnouncement {
  id: string;
  title: string;
  content: string;
  type: string; // "Info" | "Warning" | "Maintenance"
  targetAudience: string; // "All" | "Students" | "Mentors"
  isDismissible: boolean;
}

export interface StaticPageContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

// ── Public CMS API ──

export const cmsApi = {
  getActiveBanners: async (): Promise<ActiveBanner[]> => {
    try {
      return await apiClient.get<ActiveBanner[]>('/cms/banners/active');
    } catch {
      return [];
    }
  },

  getActiveAnnouncements: async (): Promise<ActiveAnnouncement[]> => {
    try {
      return await apiClient.get<ActiveAnnouncement[]>('/cms/announcements/active');
    } catch {
      return [];
    }
  },

  getPageBySlug: async (slug: string): Promise<StaticPageContent | null> => {
    try {
      return await apiClient.get<StaticPageContent>(`/cms/pages/${slug}`);
    } catch {
      return null;
    }
  },
};
