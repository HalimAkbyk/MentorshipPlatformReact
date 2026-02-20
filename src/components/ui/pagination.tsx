'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({ page, totalPages, totalCount, onPageChange, itemLabel = 'kayit' }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500">
        Toplam {totalCount} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Onceki
        </Button>
        <span className="text-sm text-gray-500 px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="gap-1"
        >
          Sonraki
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
