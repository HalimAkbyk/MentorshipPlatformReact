import { apiClient } from './client';

export interface MentorEarningsSummaryDto {
  totalEarnings: number;
  availableBalance: number;
  escrowBalance: number;
  totalPaidOut: number;
  thisMonthEarnings: number;
  totalTransactions: number;
}

export interface MentorTransactionDto {
  id: string;
  type: string;
  accountType: string;
  direction: string;
  amount: number;
  currency: string;
  referenceId: string;
  createdAt: string;
  description: string | null;
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

export const earningsApi = {
  getSummary: async (): Promise<MentorEarningsSummaryDto> => {
    return apiClient.get<MentorEarningsSummaryDto>('/earnings/summary');
  },

  getTransactions: async (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    from?: string;
    to?: string;
  }): Promise<PaginatedList<MentorTransactionDto>> => {
    return apiClient.get<PaginatedList<MentorTransactionDto>>('/earnings/transactions', params);
  },
};
