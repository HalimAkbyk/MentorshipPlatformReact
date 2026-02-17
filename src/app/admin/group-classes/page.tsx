'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Calendar,
  Eye,
} from 'lucide-react';

import {
  adminApi,
  type AdminGroupClassDto,
  type PagedResult,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { useCategoryNames } from '@/lib/hooks/use-categories';

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
// Category filters
// ---------------------------------------------------------------------------

// categoryFilters are now dynamically computed inside the component via useCategoryNames

// ---------------------------------------------------------------------------
// Category badge color mapping
// ---------------------------------------------------------------------------

function categoryBadgeVariant(category: string) {
  switch (category) {
    case 'Matematik':
      return 'default' as const;
    case 'Yazılım':
      return 'secondary' as const;
    case 'Müzik':
      return 'outline' as const;
    case 'Dil':
      return 'default' as const;
    case 'Sanat':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminGroupClassesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const categoryNames = useCategoryNames('GroupClass');
  const categoryFilters = [
    { label: 'Tumu', value: '' },
    ...categoryNames.map((name) => ({ label: name, value: name })),
  ];

  // --- State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
    data: classesResult,
    isLoading: classesLoading,
  } = useQuery({
    queryKey: [
      'admin',
      'education',
      'group-classes',
      { page, pageSize, search: debouncedSearch, category: categoryFilter },
    ],
    queryFn: () =>
      adminApi.getEducationGroupClasses({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
      }),
  });

  const classes = classesResult?.items ?? [];
  const totalCount = classesResult?.totalCount ?? 0;
  const totalPages = classesResult?.totalPages ?? 0;

  // --- Columns ---
  const columns: Column<AdminGroupClassDto>[] = [
    {
      key: 'title',
      label: 'Baslik',
      render: (item) => (
        <div className="min-w-0 max-w-[200px]">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.title}
          </p>
        </div>
      ),
    },
    {
      key: 'mentorName',
      label: 'Mentor',
      render: (item) => (
        <span className="text-sm text-gray-900">{item.mentorName}</span>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (item) => (
        <Badge variant={categoryBadgeVariant(item.category)} className="text-xs">
          {item.category}
        </Badge>
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
      key: 'capacity',
      label: 'Kapasite',
      className: 'whitespace-nowrap',
      render: (item) => {
        const percentage = item.capacity > 0 ? (item.enrolledCount / item.capacity) * 100 : 0;
        return (
          <div className="min-w-[100px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700 font-medium">
                {item.enrolledCount}/{item.capacity}
              </span>
              <span className="text-[10px] text-gray-400">
                %{Math.round(percentage)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  percentage >= 90
                    ? 'bg-red-500'
                    : percentage >= 50
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'pricePerSeat',
      label: 'Fiyat',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(item.pricePerSeat, item.currency)}
        </span>
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
            router.push(`/admin/group-classes/${item.id}`);
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
          <Users className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Grup Dersleri</h1>
        </div>
        <p className="text-sm text-gray-500">
          Tum grup derslerini goruntule
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Baslik veya mentor adi ile ara..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium mr-1">Kategori:</span>
          {categoryFilters.map((cf) => (
            <FilterButton
              key={cf.value}
              label={cf.label}
              active={categoryFilter === cf.value}
              onClick={() => {
                setCategoryFilter(cf.value);
                setPage(1);
              }}
            />
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={classes}
        isLoading={classesLoading}
        getRowId={(item) => item.id}
        emptyMessage="Grup dersi bulunamadi."
        emptyIcon={<Users className="h-12 w-12" />}
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
