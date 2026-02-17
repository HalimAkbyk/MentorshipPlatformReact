'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Video,
  Search,
  Calendar,
  Eye,
} from 'lucide-react';

import {
  adminApi,
  type AdminCourseDto,
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: number, currency?: string): string {
  const symbol = currency === 'USD' ? '$' : '₺';
  return `${symbol}${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
  { label: 'Taslak', value: 'Draft' },
  { label: 'Yayinda', value: 'Published' },
  { label: 'Arsivlenmis', value: 'Archived' },
];

// ---------------------------------------------------------------------------
// Level badge
// ---------------------------------------------------------------------------

function levelBadgeVariant(level: string) {
  switch (level) {
    case 'Beginner':
      return 'default' as const;
    case 'Intermediate':
      return 'secondary' as const;
    case 'Advanced':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

function levelLabel(level: string): string {
  switch (level) {
    case 'Beginner':
      return 'Baslangic';
    case 'Intermediate':
      return 'Orta';
    case 'Advanced':
      return 'Ileri';
    default:
      return level;
  }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminCoursesPage() {
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
    data: coursesResult,
    isLoading: coursesLoading,
  } = useQuery({
    queryKey: [
      'admin',
      'education',
      'courses',
      { page, pageSize, search: debouncedSearch, status: statusFilter },
    ],
    queryFn: () =>
      adminApi.getEducationCourses({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      }),
  });

  const courses = coursesResult?.items ?? [];
  const totalCount = coursesResult?.totalCount ?? 0;
  const totalPages = coursesResult?.totalPages ?? 0;

  // --- Columns ---
  const columns: Column<AdminCourseDto>[] = [
    {
      key: 'title',
      label: 'Kurs Adi',
      render: (item) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.title}
          </p>
          {item.category && (
            <p className="text-xs text-gray-500 truncate">{item.category}</p>
          )}
        </div>
      ),
    },
    {
      key: 'instructorName',
      label: 'Egitmen',
      render: (item) => (
        <span className="text-sm text-gray-900">{item.instructorName}</span>
      ),
    },
    {
      key: 'price',
      label: 'Fiyat',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(item.price, item.currency)}
        </span>
      ),
    },
    {
      key: 'level',
      label: 'Seviye',
      render: (item) => (
        <Badge variant={levelBadgeVariant(item.level)} className="text-xs">
          {levelLabel(item.level)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'enrollmentCount',
      label: 'Kayit Sayisi',
      className: 'text-center',
      render: (item) => (
        <span className="text-sm font-medium text-gray-700">
          {item.enrollmentCount}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Tarih',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{formatDate(item.createdAt)}</span>
        </div>
      ),
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
            router.push(`/admin/courses/${item.id}`);
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
          <Video className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Video Kurslar</h1>
        </div>
        <p className="text-sm text-gray-500">
          Tum video kurslari goruntule
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Kurs adi veya egitmen ile ara..."
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
        data={courses}
        isLoading={coursesLoading}
        getRowId={(item) => item.id}
        emptyMessage="Kurs bulunamadi."
        emptyIcon={<Video className="h-12 w-12" />}
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
