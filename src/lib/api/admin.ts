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

// --- Finance: Orders ---
export interface AdminOrderDto {
  id: string;
  buyerName: string;
  buyerEmail: string | null;
  type: string;
  amountTotal: number;
  currency: string;
  status: string;
  refundedAmount: number;
  paymentProvider: string | null;
  createdAt: string;
}

export interface LedgerEntryDto {
  id: string;
  accountType: string;
  direction: string;
  amount: number;
  referenceType: string;
  createdAt: string;
}

export interface RefundRequestDto {
  id: string;
  status: string;
  requestedAmount: number;
  approvedAmount: number | null;
  reason: string | null;
  adminNotes: string | null;
  type: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminOrderDetailDto {
  id: string;
  buyerUserId: string;
  buyerName: string;
  buyerEmail: string | null;
  type: string;
  resourceId: string;
  amountTotal: number;
  currency: string;
  status: string;
  refundedAmount: number;
  paymentProvider: string | null;
  providerPaymentId: string | null;
  createdAt: string;
  ledgerEntries: LedgerEntryDto[];
  refundRequests: RefundRequestDto[];
}

// --- Finance: Mentor Payouts ---
export interface MentorPayoutSummaryDto {
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string | null;
  totalEarned: number;
  totalPaidOut: number;
  availableBalance: number;
  inEscrow: number;
  completedBookings: number;
}

export interface MentorPayoutDetailDto {
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string | null;
  totalEarned: number;
  totalPaidOut: number;
  availableBalance: number;
  inEscrow: number;
  completedBookings: number;
  recentTransactions: LedgerEntryDto[];
}

// --- Finance: Revenue Charts ---
export interface RevenueChartPoint {
  label: string;
  revenue: number;
  platformFee: number;
}

export interface RevenueChartDto {
  points: RevenueChartPoint[];
  totalRevenue: number;
  totalPlatformFee: number;
}

export interface RevenueBreakdownDto {
  bookingRevenue: number;
  groupClassRevenue: number;
  courseRevenue: number;
  totalRevenue: number;
  totalRefunded: number;
  netRevenue: number;
}

// Notification Templates
export interface NotificationTemplateDto {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  variables: string | null;
  channel: string;
  isActive: boolean;
  updatedAt: string;
}

// Bulk Notifications
export interface BulkNotificationDto {
  id: string;
  subject: string;
  body: string;
  targetAudience: string;
  channel: string;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  status: string;
  sentByName: string | null;
  createdAt: string;
}

// Message Reports
export interface MessageReportDto {
  id: string;
  messageId: string;
  reporterUserId: string;
  reporterName: string;
  reportedUserId: string;
  reportedName: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  messageContent: string | null;
}

// Moderation
export interface BlacklistEntryDto {
  id: string;
  type: string;
  value: string;
  reason: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface ContentReviewItemDto {
  id: string;
  entityType: string;
  title: string;
  description: string | null;
  ownerName: string;
  createdAt: string;
}

// Settings
export interface PlatformSettingDto {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  updatedAt: string;
}

// Feature Flags (for later use)
export interface FeatureFlagDto {
  id: string;
  key: string;
  isEnabled: boolean;
  description: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Analytics Types (Phase 9)
// ---------------------------------------------------------------------------

export interface RegistrationTrendPoint {
  week: string;
  count: number;
}

export interface AnalyticsOverviewDto {
  totalUsers: number;
  totalMentors: number;
  totalStudents: number;
  activeUsersLast30Days: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalBookings: number;
  totalCourseEnrollments: number;
  totalGroupClassEnrollments: number;
  weeklyRegistrations: RegistrationTrendPoint[];
}

export interface UserAnalyticsDto {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  roleDistribution: Record<string, number>;
  providerDistribution: Record<string, number>;
  monthlyRegistrations: RegistrationTrendPoint[];
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  refunded: number;
}

export interface FinancialAnalyticsDto {
  totalRevenue: number;
  totalRefunded: number;
  netRevenue: number;
  platformCommission: number;
  mentorPayouts: number;
  averageOrderAmount: number;
  revenueByType: Record<string, number>;
  monthlyRevenue: MonthlyRevenuePoint[];
}

export interface TopMentorDto {
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string | null;
  totalEarned: number;
  completedBookings: number;
  averageRating: number | null;
}

export interface TopCourseDto {
  courseId: string;
  title: string;
  mentorName: string;
  enrollmentCount: number;
  revenue: number;
}

// ---------------------------------------------------------------------------
// System Types (Phase 10)
// ---------------------------------------------------------------------------

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
  performedBy: string;
  performedByName: string | null;
  performedByRole: string | null;
  createdAt: string;
}

export interface SystemHealthInfoDto {
  status: string;
  databaseStatus: string;
  totalUsers: number;
  totalOrders: number;
  serverTime: string;
  environment: string;
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

  // Finance - Orders
  getOrders: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PagedResult<AdminOrderDto>> =>
    apiClient.get('/admin/finance/orders', params),

  getOrderDetail: (id: string): Promise<AdminOrderDetailDto> =>
    apiClient.get(`/admin/finance/orders/${id}`),

  // Finance - Payouts
  getMentorPayouts: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PagedResult<MentorPayoutSummaryDto>> =>
    apiClient.get('/admin/finance/payouts/mentors', params),

  getMentorPayoutDetail: (mentorUserId: string): Promise<MentorPayoutDetailDto> =>
    apiClient.get(`/admin/finance/payouts/mentors/${mentorUserId}`),

  // Finance - Revenue
  getRevenueChart: (params?: {
    period?: string;
    days?: number;
  }): Promise<RevenueChartDto> =>
    apiClient.get('/admin/finance/revenue/chart', params),

  getRevenueBreakdown: (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<RevenueBreakdownDto> =>
    apiClient.get('/admin/finance/revenue/breakdown', params),

  // Notification Templates
  getNotificationTemplates: (): Promise<NotificationTemplateDto[]> =>
    apiClient.get('/admin/notifications/templates'),

  createNotificationTemplate: (data: {
    key: string;
    name: string;
    subject: string;
    body: string;
    variables?: string;
    channel?: string;
  }): Promise<{ id: string }> =>
    apiClient.post('/admin/notifications/templates', data),

  updateNotificationTemplate: (
    id: string,
    data: {
      name: string;
      subject: string;
      body: string;
      variables?: string;
    }
  ): Promise<void> =>
    apiClient.put(`/admin/notifications/templates/${id}`, data),

  deleteNotificationTemplate: (id: string): Promise<void> =>
    apiClient.delete(`/admin/notifications/templates/${id}`),

  // Bulk Notifications
  getNotificationHistory: (params: {
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<BulkNotificationDto>> =>
    apiClient.get('/admin/notifications/history', params),

  sendBulkNotification: (data: {
    subject: string;
    body: string;
    targetAudience: string;
    channel: string;
    scheduledAt?: string;
  }): Promise<{ id: string }> =>
    apiClient.post('/admin/notifications/send', data),

  // Message Reports
  getMessageReports: (params: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResult<MessageReportDto>> =>
    apiClient.get('/admin/message-reports', params),

  reviewMessageReport: (
    reportId: string,
    data: { status: string; adminNotes?: string }
  ): Promise<void> =>
    apiClient.post(`/admin/message-reports/${reportId}/review`, data),

  // Moderation - Blacklist
  getBlacklist: (type?: string): Promise<BlacklistEntryDto[]> =>
    apiClient.get('/admin/moderation/blacklist', type ? { type } : undefined),

  createBlacklistEntry: (data: {
    type: string;
    value: string;
    reason?: string;
  }): Promise<{ id: string }> =>
    apiClient.post('/admin/moderation/blacklist', data),

  deleteBlacklistEntry: (id: string): Promise<void> =>
    apiClient.delete(`/admin/moderation/blacklist/${id}`),

  // Moderation - Content Review
  getContentReview: (): Promise<ContentReviewItemDto[]> =>
    apiClient.get('/admin/moderation/content'),

  // Settings
  getSettings: (): Promise<PlatformSettingDto[]> =>
    apiClient.get('/admin/settings'),

  updateSetting: (key: string, value: string): Promise<void> =>
    apiClient.put(`/admin/settings/${key}`, { value }),

  seedSettings: (): Promise<void> =>
    apiClient.post('/admin/settings/seed'),

  // ---------------------------------------------------------------------------
  // Analytics (Phase 9)
  // ---------------------------------------------------------------------------

  getAnalyticsOverview: (): Promise<AnalyticsOverviewDto> =>
    apiClient.get('/admin/analytics/overview'),

  getUserAnalytics: (): Promise<UserAnalyticsDto> =>
    apiClient.get('/admin/analytics/users'),

  getFinancialAnalytics: (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<FinancialAnalyticsDto> =>
    apiClient.get('/admin/analytics/financial', params),

  getTopMentors: (): Promise<TopMentorDto[]> =>
    apiClient.get('/admin/analytics/top-mentors'),

  getTopCourses: (): Promise<TopCourseDto[]> =>
    apiClient.get('/admin/analytics/top-courses'),

  exportData: async (type: string): Promise<Blob> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const res = await fetch(`${API_URL}/admin/analytics/export/${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },

  // ---------------------------------------------------------------------------
  // System (Phase 10)
  // ---------------------------------------------------------------------------

  getAuditLog: (params: {
    page?: number;
    pageSize?: number;
    entityType?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PagedResult<AuditLogDto>> =>
    apiClient.get('/admin/system/audit-log', params),

  getSystemHealthInfo: (): Promise<SystemHealthInfoDto> =>
    apiClient.get('/admin/system/health'),

  getFeatureFlags: (): Promise<FeatureFlagDto[]> =>
    apiClient.get('/admin/system/feature-flags'),

  updateFeatureFlag: (key: string, isEnabled: boolean): Promise<FeatureFlagDto> =>
    apiClient.put(`/admin/system/feature-flags/${key}`, { isEnabled }),

  seedFeatureFlags: (): Promise<FeatureFlagDto[]> =>
    apiClient.post('/admin/system/feature-flags/seed'),
};
