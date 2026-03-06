import { apiClient } from './client';

export interface PerformanceSummaryDto {
  id: string;
  instructorId: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  totalPrivateLessons: number;
  totalGroupLessons: number;
  totalVideoViews: number;
  totalLiveDurationMinutes: number;
  totalVideoWatchMinutes: number;
  totalStudentsServed: number;
  totalCreditsConsumed: number;
  totalDirectRevenue: number;
  totalCreditRevenue: number;
  calculatedAt: string;
}

export interface AccrualDto {
  id: string;
  instructorId: string;
  instructorName?: string;
  periodStart: string;
  periodEnd: string;
  privateLessonCount: number;
  privateLessonUnitPrice: number;
  groupLessonCount: number;
  groupLessonUnitPrice: number;
  videoContentCount: number;
  videoUnitPrice: number;
  bonusAmount: number;
  bonusDescription: string | null;
  totalAccrual: number;
  status: string;
  approvedAt: string | null;
  paidAt: string | null;
  notes: string | null;
}

export interface AccrualParameterDto {
  id: string;
  instructorId: string | null;
  instructorName?: string;
  privateLessonRate: number;
  groupLessonRate: number;
  videoContentRate: number;
  bonusThresholdLessons: number | null;
  bonusPercentage: number | null;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
}

export const instructorPerformanceApi = {
  // Instructor self-view
  getMySummary: (params?: {
    periodType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PerformanceSummaryDto[]> =>
    apiClient.get('/instructor/performance/summary', params),

  getMyAccruals: (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: AccrualDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> =>
    apiClient.get('/instructor/performance/accruals', params),
};
