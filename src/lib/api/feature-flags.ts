import { apiClient } from './client';

export interface FeatureFlags {
  registration_enabled: boolean;
  course_sales_enabled: boolean;
  group_classes_enabled: boolean;
  chat_enabled: boolean;
  video_enabled: boolean;
  maintenance_mode: boolean;
  [key: string]: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  registration_enabled: true,
  course_sales_enabled: true,
  group_classes_enabled: true,
  chat_enabled: true,
  video_enabled: true,
  maintenance_mode: false,
};

export const featureFlagsApi = {
  /** Get all feature flags (public endpoint, no auth required) */
  getAll: async (): Promise<FeatureFlags> => {
    try {
      const data = await apiClient.get<Record<string, boolean>>('/feature-flags');
      return { ...DEFAULT_FLAGS, ...data };
    } catch {
      // If the API is down or unreachable, return defaults (all enabled, no maintenance)
      return DEFAULT_FLAGS;
    }
  },
};
