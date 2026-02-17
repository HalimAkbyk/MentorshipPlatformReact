import { apiClient } from './client';
import type { VerificationApprovalRequest, RefundApprovalRequest } from '../../lib/types';
import type { PendingRefundDto, PendingVerificationDto, PendingMentorDto } from '../types/admin';

export interface AdminBookingDto {
  id: string;
  studentUserId: string;
  studentName: string | null;
  mentorUserId: string;
  mentorName: string | null;
  startAt: string;
  endAt: string;
  durationMin: number;
  status: string;
  price: number;
  currency: string;
  offeringTitle: string | null;
}

export interface SystemHealthDto {
  pendingOrdersCount: number;
  stuckBookingsCount: number;
  activeSessionsCount: number;
  noShowBookingsLast24h: number;
  disputedBookingsCount: number;
  failedPaymentsLast24h: number;
  expiredBookingsLast24h: number;
  cancelledBookingsLast24h: number;
  completedBookingsLast24h: number;
}

// --- Revenue ---
export interface PlatformRevenueSummaryDto {
  totalRevenue: number;
  totalRefundsIssued: number;
  netRevenue: number;
  totalMentorEarnings: number;
  totalGrossVolume: number;
  totalOrders: number;
  totalRefunds: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
}

export interface PlatformTransactionDto {
  id: string;
  accountType: string;
  direction: string;
  amount: number;
  currency: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  accountOwnerUserId: string | null;
  accountOwnerName: string | null;
}

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// --- Refund Requests ---
export interface AdminRefundRequestDto {
  id: string;
  orderId: string;
  orderType: string;
  requestedByUserId: string;
  requesterName: string | null;
  reason: string;
  requestedAmount: number;
  orderTotal: number;
  alreadyRefunded: number;
  status: string;
  refundType: string;
  createdAt: string;
  processedAt: string | null;
  mentorName: string | null;
  resourceTitle: string | null;
  adminNotes: string | null;
}

// --- Dashboard ---
export interface DailyStatDto {
  date: string;
  value: number;
}

export interface RecentActivityDto {
  action: string;
  entityType: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface AdminDashboardDto {
  totalUsers: number;
  totalMentors: number;
  totalStudents: number;
  activeUsersLast30Days: number;
  newUsersThisWeek: number;
  newUsersLastWeek: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueChangePercent: number;
  pendingVerifications: number;
  pendingRefunds: number;
  activeDisputes: number;
  pendingOrders: number;
  weeklyRegistrations: DailyStatDto[];
  dailyRevenue: DailyStatDto[];
  recentActivities: RecentActivityDto[];
}

// --- User Management ---
export interface AdminUserDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  birthYear: number | null;
  status: string;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
  bookingCount: number;
  orderCount: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserDetailDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  birthYear: number | null;
  status: string;
  roles: string[];
  externalProvider: string | null;
  createdAt: string;
  updatedAt: string;
  bookingCount: number;
  completedBookingCount: number;
  orderCount: number;
  totalSpent: number;
  courseEnrollmentCount: number;
  classEnrollmentCount: number;
  reviewCount: number;
  averageRating: number | null;
  mentorProfile: MentorProfileSummaryDto | null;
}

export interface MentorProfileSummaryDto {
  university: string;
  department: string;
  graduationYear: number | null;
  isListed: boolean;
  isApprovedForBookings: boolean;
  offeringCount: number;
  completedSessionCount: number;
  totalEarned: number;
}

// CMS Types
export interface HomepageModuleDto {
  id: string;
  moduleType: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerDto {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  position: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  type: string;
  targetAudience: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  isDismissible: boolean;
  createdAt: string;
}

export interface StaticPageDto {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Education Types
export interface AdminBookingListDto {
  id: string;
  studentUserId: string;
  studentName: string;
  mentorUserId: string;
  mentorName: string;
  startAt: string;
  durationMinutes: number;
  status: string;
  offeringTitle: string | null;
  createdAt: string;
}

export interface AdminGroupClassDto {
  id: string;
  title: string;
  category: string;
  mentorUserId: string;
  mentorName: string;
  startAt: string;
  endAt: string;
  capacity: number;
  enrolledCount: number;
  pricePerSeat: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface AdminCourseDto {
  id: string;
  title: string;
  instructorUserId: string;
  instructorName: string;
  price: number;
  currency: string;
  status: string;
  level: string;
  category: string;
  enrollmentCount: number;
  createdAt: string;
}

export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<AdminDashboardDto> => {
    return apiClient.get<AdminDashboardDto>('/admin/dashboard');
  },

  // Verifications
  getPendingVerifications: async (): Promise<PendingVerificationDto[]> => {
    return apiClient.get<PendingVerificationDto[]>('/admin/verifications', { status: 'Pending' });
  },

  approveVerification: async (data: VerificationApprovalRequest): Promise<void> => {
    const { verificationId, ...rest } = data;
    return apiClient.post<void>(`/admin/verifications/${verificationId}/approve`, rest);
  },

  rejectVerification: async (data: VerificationApprovalRequest): Promise<void> => {
    const { verificationId, ...rest } = data;
    return apiClient.post<void>(`/admin/verifications/${verificationId}/reject`, rest);
  },

  // Pending Mentors
  getPendingMentors: async (): Promise<PendingMentorDto[]> => {
    return apiClient.get<PendingMentorDto[]>('/admin/pending-mentors');
  },

  publishMentor: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/mentors/${userId}/publish`);
  },

  unpublishMentor: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/mentors/${userId}/unpublish`);
  },

  // Legacy Refunds (old system — kept for backward compat)
  getPendingRefunds: async (): Promise<PendingRefundDto[]> => {
    return apiClient.get<PendingRefundDto[]>('/admin/refunds', { status: 'Pending' });
  },

  approveRefund: async (data: RefundApprovalRequest): Promise<void> => {
    const { refundId, ...rest } = data;
    return apiClient.post<void>(`/admin/refunds/${refundId}/approve`, rest);
  },

  rejectRefund: async (data: RefundApprovalRequest): Promise<void> => {
    const { refundId, ...rest } = data;
    return apiClient.post<void>(`/admin/refunds/${refundId}/reject`, rest);
  },

  // New Refund System
  getRefundRequests: async (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedList<AdminRefundRequestDto>> => {
    return apiClient.get('/refunds/admin/list', params);
  },

  processRefund: async (id: string, data: {
    isApproved: boolean;
    overrideAmount?: number;
    adminNotes?: string;
  }): Promise<void> => {
    return apiClient.post(`/refunds/admin/${id}/process`, data);
  },

  initiateRefund: async (data: {
    orderId: string;
    amount: number;
    reason: string;
    isGoodwill: boolean;
  }): Promise<void> => {
    return apiClient.post('/refunds/admin/initiate', data);
  },

  // Revenue
  getRevenueSummary: async (params?: {
    from?: string;
    to?: string;
  }): Promise<PlatformRevenueSummaryDto> => {
    return apiClient.get('/admin/revenue/summary', params);
  },

  getRevenueTransactions: async (params?: {
    accountType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedList<PlatformTransactionDto>> => {
    return apiClient.get('/admin/revenue/transactions', params);
  },

  // Admin Calendar - All Bookings
  getAllBookings: async (params?: {
    from?: string;
    to?: string;
    status?: string;
    mentorUserId?: string;
  }): Promise<AdminBookingDto[]> => {
    return apiClient.get<AdminBookingDto[]>('/admin/bookings', params);
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealthDto> => {
    return apiClient.get<SystemHealthDto>('/admin/system-health');
  },

  // Users
  getUsers: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortDesc?: boolean;
  }): Promise<PagedResult<AdminUserDto>> => {
    return apiClient.get<PagedResult<AdminUserDto>>('/admin/users', params);
  },

  getUserDetail: async (userId: string): Promise<UserDetailDto> => {
    return apiClient.get<UserDetailDto>(`/admin/users/${userId}/detail`);
  },

  changeUserRole: async (
    userId: string,
    role: string,
    action: 'add' | 'remove'
  ): Promise<void> => {
    return apiClient.post<void>(`/admin/users/${userId}/role`, { role, action });
  },

  suspendUser: async (userId: string, reason: string): Promise<void> => {
    return apiClient.post<void>(`/admin/users/${userId}/suspend`, { reason });
  },

  unsuspendUser: async (userId: string): Promise<void> => {
    return apiClient.post<void>(`/admin/users/${userId}/unsuspend`);
  },

  // CMS - Modules
  getModules: (): Promise<HomepageModuleDto[]> =>
    apiClient.get('/admin/cms/modules'),

  createModule: (data: {
    moduleType: string;
    title: string;
    subtitle?: string;
    content?: string;
    sortOrder: number;
  }): Promise<{ id: string }> =>
    apiClient.post('/admin/cms/modules', data),

  updateModule: (
    id: string,
    data: {
      title: string;
      subtitle?: string;
      content?: string;
      sortOrder: number;
      isActive: boolean;
    }
  ): Promise<void> =>
    apiClient.put(`/admin/cms/modules/${id}`, data),

  deleteModule: (id: string): Promise<void> =>
    apiClient.delete(`/admin/cms/modules/${id}`),

  reorderModules: (items: { id: string; sortOrder: number }[]): Promise<void> =>
    apiClient.put('/admin/cms/modules/reorder', items),

  // CMS - Banners
  getBanners: (): Promise<BannerDto[]> =>
    apiClient.get('/admin/cms/banners'),

  createBanner: (data: any): Promise<{ id: string }> =>
    apiClient.post('/admin/cms/banners', data),

  updateBanner: (id: string, data: any): Promise<void> =>
    apiClient.put(`/admin/cms/banners/${id}`, data),

  deleteBanner: (id: string): Promise<void> =>
    apiClient.delete(`/admin/cms/banners/${id}`),

  // CMS - Announcements
  getAnnouncements: (): Promise<AnnouncementDto[]> =>
    apiClient.get('/admin/cms/announcements'),

  createAnnouncement: (data: any): Promise<{ id: string }> =>
    apiClient.post('/admin/cms/announcements', data),

  updateAnnouncement: (id: string, data: any): Promise<void> =>
    apiClient.put(`/admin/cms/announcements/${id}`, data),

  deleteAnnouncement: (id: string): Promise<void> =>
    apiClient.delete(`/admin/cms/announcements/${id}`),

  // CMS - Pages
  getPages: (): Promise<StaticPageDto[]> =>
    apiClient.get('/admin/cms/pages'),

  getPage: (id: string): Promise<StaticPageDto> =>
    apiClient.get(`/admin/cms/pages/${id}`),

  createPage: (data: {
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
  }): Promise<{ id: string }> =>
    apiClient.post('/admin/cms/pages', data),

  updatePage: (
    id: string,
    data: {
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      isPublished: boolean;
    }
  ): Promise<void> =>
    apiClient.put(`/admin/cms/pages/${id}`, data),

  deletePage: (id: string): Promise<void> =>
    apiClient.delete(`/admin/cms/pages/${id}`),

  // Education - Bookings
  getEducationBookings: (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    from?: string;
    to?: string;
  }): Promise<PagedResult<AdminBookingListDto>> =>
    apiClient.get('/admin/education/bookings', params),

  // Education - Group Classes
  getEducationGroupClasses: (params: {
    page?: number;
    pageSize?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<PagedResult<AdminGroupClassDto>> =>
    apiClient.get('/admin/education/group-classes', params),

  // Education - Courses
  getEducationCourses: (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<PagedResult<AdminCourseDto>> =>
    apiClient.get('/admin/education/courses', params),
};
