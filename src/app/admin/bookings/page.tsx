'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Search,
  Calendar,
  Clock,
  Eye,
} from 'lucide-react';

import {
  adminApi,
  type AdminBookingListDto,
  type PagedResult,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Filter Button
// ---------------------------------------------------------------------------

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Status filter options
// ---------------------------------------------------------------------------

const statusFilters = [
  { label: 'Tumu', value: '' },
  { label: 'Onaylanmis', value: 'Confirmed' },
  { label: 'Tamamlanmis', value: 'Completed' },
  { label: 'Iptal', value: 'Cancelled' },
  { label: 'Ihtilafli', value: 'Disputed' },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // --- State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // --- Debounce search ---
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimer(timer);
  };

  // --- Query ---
  const {
    data: bookingsResult,
    isLoading: bookingsLoading,
  } = useQuery({
    queryKey: [
      'admin',
      'education',
      'bookings',
      { page, pageSize, search: debouncedSearch, status: statusFilter },
    ],
    queryFn: () =>
      adminApi.getEducationBookings({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      }),
  });

  const bookings = bookingsResult?.items ?? [];
  const totalCount = bookingsResult?.totalCount ?? 0;
  const totalPages = bookingsResult?.totalPages ?? 0;

  // --- Columns ---
  const columns: Column<AdminBookingListDto>[] = [
    {
      key: 'mentorName',
      label: 'Mentor',
      render: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.mentorName}
          </p>
          {item.offeringTitle && (
            <p className="text-xs text-gray-500 truncate">{item.offeringTitle}</p>
          )}
        </div>
      ),
    },
    {
      key: 'studentName',
      label: 'Ogrenci',
      render: (item) => (
        <span className="text-sm text-gray-900">{item.studentName}</span>
      ),
    },
    {
      key: 'startAt',
      label: 'Tarih',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{formatDateTime(item.startAt)}</span>
        </div>
      ),
    },
    {
      key: 'durationMinutes',
      label: 'Sure (dk)',
      className: 'text-center whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-700">{item.durationMinutes}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'actions',
      label: 'Islemler',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/bookings/${item.id}`);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Detay
        </Button>
      ),
    },
  ];

  // --- Render ---
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Ders Yonetimi</h1>
        </div>
        <p className="text-sm text-gray-500">
          Tum 1:1 dersleri goruntule ve yonet
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Mentor veya ogrenci adi ile ara..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium mr-1">Durum:</span>
            {statusFilters.map((sf) => (
              <FilterButton
                key={sf.value}
                label={sf.label}
                active={statusFilter === sf.value}
                onClick={() => {
                  setStatusFilter(sf.value);
                  setPage(1);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={bookings}
        isLoading={bookingsLoading}
        getRowId={(item) => item.id}
        emptyMessage="Ders bulunamadi."
        emptyIcon={<BookOpen className="h-12 w-12" />}
        pagination={{
          page,
          pageSize,
          totalCount,
          totalPages,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
