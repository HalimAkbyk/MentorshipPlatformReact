'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  selectedRows?: string[];
  onSelectRows?: (ids: string[]) => void;
  getRowId?: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  pagination,
  onRowClick,
  selectedRows,
  onSelectRows,
  getRowId,
  emptyMessage = 'Kayit bulunamadi.',
  emptyIcon,
}: DataTableProps<T>) {
  const hasSelection = !!onSelectRows && !!getRowId;

  const allSelected =
    hasSelection &&
    data.length > 0 &&
    data.every((item) => selectedRows?.includes(getRowId!(item)));

  const handleSelectAll = () => {
    if (!hasSelection) return;
    if (allSelected) {
      onSelectRows!([]);
    } else {
      onSelectRows!(data.map((item) => getRowId!(item)));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!hasSelection) return;
    const current = selectedRows || [];
    if (current.includes(id)) {
      onSelectRows!(current.filter((r) => r !== id));
    } else {
      onSelectRows!([...current, id]);
    }
  };

  const colCount = columns.length + (hasSelection ? 1 : 0);

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {hasSelection && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} colCount={colCount} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-gray-300">
                      {emptyIcon || <Inbox className="h-12 w-12" />}
                    </div>
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const rowId = getRowId?.(item);
                const isSelected = rowId
                  ? selectedRows?.includes(rowId)
                  : false;

                return (
                  <tr
                    key={rowId || idx}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      'transition-colors duration-150',
                      onRowClick && 'cursor-pointer',
                      isSelected
                        ? 'bg-primary-50'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    {hasSelection && (
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(rowId!);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-sm text-gray-700',
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(item)
                          : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm text-gray-500">
            Toplam <span className="font-medium">{pagination.totalCount}</span>{' '}
            kayit &middot; Sayfa{' '}
            <span className="font-medium">{pagination.page}</span> /{' '}
            <span className="font-medium">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Onceki</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <span className="mr-1">Sonraki</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
