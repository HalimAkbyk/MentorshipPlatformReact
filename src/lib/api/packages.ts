import { apiClient } from './client';

export interface PackageDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  privateLessonCredits: number;
  groupLessonCredits: number;
  videoAccessCredits: number;
  isActive: boolean;
  validityDays: number | null;
  sortOrder: number;
}

export interface StudentCreditDto {
  id: string;
  creditType: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  expiresAt: string | null;
  packageName: string | null;
}

export interface CreditTransactionDto {
  id: string;
  transactionType: string;
  amount: number;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  instructorName: string | null;
  description: string | null;
  createdAt: string;
}

export const packagesApi = {
  getAll: (): Promise<PackageDto[]> =>
    apiClient.get('/packages'),

  getMyCredits: (): Promise<StudentCreditDto[]> =>
    apiClient.get('/credits'),

  getMyCreditTransactions: (params?: {
    page?: number;
    pageSize?: number;
    creditType?: string;
  }): Promise<{
    items: CreditTransactionDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> =>
    apiClient.get('/credits/transactions', params),
};
