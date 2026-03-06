import { apiClient } from './client';

export interface FeatureFlags {
  // Existing flags
  registration_enabled: boolean;
  course_sales_enabled: boolean;
  group_classes_enabled: boolean;
  chat_enabled: boolean;
  video_enabled: boolean;
  maintenance_mode: boolean;
  // Pivot flags
  MARKETPLACE_MODE: boolean;
  EXTERNAL_MENTOR_REGISTRATION: boolean;
  MENTOR_SELF_COURSE_CREATION: boolean;
  MULTI_CATEGORY_MODE: boolean;
  COMMISSION_PAYMENT_MODEL: boolean;
  PACKAGE_SYSTEM_ENABLED: boolean;
  PRIVATE_LESSON_ENABLED: boolean;
  INSTRUCTOR_SELF_SCHEDULING: boolean;
  INSTRUCTOR_PERFORMANCE_TRACKING: boolean;
  INSTRUCTOR_PERFORMANCE_SELF_VIEW: boolean;
  INSTRUCTOR_ACCRUAL_SELF_VIEW: boolean;
  INSTRUCTOR_COMPARISON_REPORT: boolean;
  [key: string]: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  registration_enabled: true,
  course_sales_enabled: true,
  group_classes_enabled: true,
  chat_enabled: true,
  video_enabled: true,
  maintenance_mode: false,
  // Pivot defaults — dikey egitim modu
  MARKETPLACE_MODE: false,
  EXTERNAL_MENTOR_REGISTRATION: false,
  MENTOR_SELF_COURSE_CREATION: false,
  MULTI_CATEGORY_MODE: false,
  COMMISSION_PAYMENT_MODEL: false,
  PACKAGE_SYSTEM_ENABLED: true,
  PRIVATE_LESSON_ENABLED: true,
  INSTRUCTOR_SELF_SCHEDULING: true,
  INSTRUCTOR_PERFORMANCE_TRACKING: true,
  INSTRUCTOR_PERFORMANCE_SELF_VIEW: false,
  INSTRUCTOR_ACCRUAL_SELF_VIEW: false,
  INSTRUCTOR_COMPARISON_REPORT: true,
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
