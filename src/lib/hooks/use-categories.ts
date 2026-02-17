import { useQuery } from '@tanstack/react-query';
import { categoriesApi, type CategoryDto } from '../api/categories';

export function useCategories() {
  return useQuery<CategoryDto[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCategoryNames(entityType?: string) {
  const { data: categories = [] } = useCategories();
  const filtered = entityType
    ? categories.filter((c) => c.entityType === entityType || c.entityType === 'General')
    : categories;
  return filtered.map((c) => c.name);
}
