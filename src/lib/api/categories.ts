import { apiClient } from './client';

export interface CategoryDto {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  entityType: string;
  createdAt: string;
}

export const categoriesApi = {
  getCategories: (): Promise<CategoryDto[]> =>
    apiClient.get('/categories'),
};
