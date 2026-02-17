'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  X,
  Loader2,
} from 'lucide-react';

import { adminApi, type AuditLogDto, type PagedResult } from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const truncate = (text: string | null, len: number) => {
  if (!text) return '-';
  return text.length > len ? text.slice(0, len) + '...' : text;
};

// ---------------------------------------------------------------------------
// Detail Drawer
// ---------------------------------------------------------------------------

function AuditDetailDrawer({
  entry,
  onClose,
}: {
  entry: AuditLogDto | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Islem Detayi</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Tarih</p>
              <p className="text-sm text-gray-900 mt-1">{formatDate(entry.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Islem</p>
              <p className="text-sm text-gray-900 mt-1 font-mono">{entry.action}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Entity Tipi</p>
              <p className="text-sm text-gray-900 mt-1">{entry.entityType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Entity ID</p>
              <p className="text-sm text-gray-900 mt-1 font-mono break-all">{entry.entityId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Yapan</p>
              <p className="text-sm text-gray-900 mt-1">{entry.performedByName ?? entry.performedBy}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Rol</p>
              <p className="text-sm text-gray-900 mt-1">{entry.performedByRole ?? '-'}</p>
            </div>
          </div>

          {/* Description */}
          {entry.description && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Aciklama</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {entry.description}
              </p>
            </div>
          )}

          {/* Old Value */}
          {entry.oldValue && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Eski Deger</p>
              <pre className="text-xs text-red-700 bg-red-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {entry.oldValue}
              </pre>
            </div>
          )}

          {/* New Value */}
          {entry.newValue && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Yeni Deger</p>
              <pre className="text-xs text-green-700 bg-green-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {entry.newValue}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Applied filters (only update on Ara click)
  const [appliedFilters, setAppliedFilters] = useState({
    entityType: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });

  // Detail drawer
  const [selectedEntry, setSelectedEntry] = useState<AuditLogDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', page, appliedFilters],
    queryFn: () =>
      adminApi.getAuditLog({
        page,
        pageSize,
        entityType: appliedFilters.entityType || undefined,
        action: appliedFilters.action || undefined,
        dateFrom: appliedFilters.dateFrom || undefined,
        dateTo: appliedFilters.dateTo || undefined,
      }),
  });

  const pagedData = data as PagedResult<AuditLogDto> | undefined;

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ entityType, action, dateFrom, dateTo });
  };

  const handleClearFilters = () => {
    setEntityType('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setAppliedFilters({ entityType: '', action: '', dateFrom: '', dateTo: '' });
  };

  const columns: Column<AuditLogDto>[] = [
    {
      key: 'createdAt',
      label: 'Tarih',
      render: (e) => (
        <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(e.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      label: 'Islem',
      render: (e) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{e.action}</span>
      ),
    },
    { key: 'entityType', label: 'Entity Tipi' },
    {
      key: 'entityId',
      label: 'Entity ID',
      render: (e) => (
        <span className="font-mono text-xs">{e.entityId.slice(0, 8)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Aciklama',
      render: (e) => (
        <span className="text-sm text-gray-600">{truncate(e.description, 40)}</span>
      ),
    },
    {
      key: 'performedByName',
      label: 'Yapan',
      render: (e) => e.performedByName ?? <span className="text-gray-400">-</span>,
    },
    {
      key: 'performedByRole',
      label: 'Rol',
      render: (e) =>
        e.performedByRole ? (
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
            {e.performedByRole}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Islem Gecmisi</h1>
        </div>
        <p className="text-sm text-gray-500">
          Sistem genelindeki tum islem kayitlari
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Tipi</label>
            <Input
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="ornegin: User"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Islem</label>
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="ornegin: Update"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Baslangic Tarihi</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Bitis Tarihi</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSearch} size="sm" className="h-9">
              <Search className="h-4 w-4 mr-1" />
              Ara
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm" className="h-9">
              Temizle
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={pagedData?.items ?? []}
        isLoading={isLoading}
        getRowId={(e) => e.id}
        onRowClick={(e) => setSelectedEntry(e)}
        pagination={
          pagedData
            ? {
                page: pagedData.page,
                pageSize,
                totalCount: pagedData.totalCount,
                totalPages: pagedData.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
        emptyMessage="Islem kaydi bulunamadi."
      />

      {/* Detail Drawer */}
      <AuditDetailDrawer
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}
