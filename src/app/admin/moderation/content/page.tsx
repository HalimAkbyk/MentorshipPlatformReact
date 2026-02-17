'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Eye, FileSearch } from 'lucide-react';

import {
  adminApi,
  type ContentReviewItemDto,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { Button } from '@/components/ui/button';
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

const entityTypeLabels: Record<string, string> = {
  MentorProfile: 'Mentor Profili',
  Course: 'Kurs',
  GroupClass: 'Grup Dersi',
};

const entityTypeColors: Record<string, string> = {
  MentorProfile: 'bg-purple-100 text-purple-700',
  Course: 'bg-blue-100 text-blue-700',
  GroupClass: 'bg-green-100 text-green-700',
};

function EntityTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        entityTypeColors[type] || 'bg-gray-100 text-gray-700'
      )}
    >
      {entityTypeLabels[type] || type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminContentReviewPage() {
  // Drawer state
  const [selectedItem, setSelectedItem] = useState<ContentReviewItemDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter tabs
  const [entityFilter, setEntityFilter] = useState<string>('');
  const filterTabs = [
    { label: 'Tumu', value: '' },
    { label: 'Mentor Profili', value: 'MentorProfile' },
    { label: 'Kurs', value: 'Course' },
    { label: 'Grup Dersi', value: 'GroupClass' },
  ];

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'content-review'],
    queryFn: () => adminApi.getContentReview(),
  });

  // Client-side filter by entity type
  const filtered = entityFilter
    ? items.filter((item) => item.entityType === entityFilter)
    : items;

  const handleOpenDetail = (item: ContentReviewItemDto) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  // Columns
  const columns: Column<ContentReviewItemDto>[] = [
    {
      key: 'entityType',
      label: 'Tip',
      render: (item) => <EntityTypeBadge type={item.entityType} />,
    },
    {
      key: 'title',
      label: 'Baslik',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.title}</span>
      ),
    },
    {
      key: 'description',
      label: 'Aciklama',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {item.description
            ? item.description.length > 100
              ? item.description.slice(0, 100) + '...'
              : item.description
            : '-'}
        </span>
      ),
    },
    {
      key: 'ownerName',
      label: 'Sahip',
      render: (item) => (
        <span className="text-sm text-gray-700">{item.ownerName}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Tarih',
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
            handleOpenDetail(item);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Incele
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Search className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Icerik Inceleme</h1>
        </div>
        <p className="text-sm text-gray-500">
          Mentor profilleri, kurslar ve grup derslerini inceleyin.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setEntityFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              entityFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        onRowClick={handleOpenDetail}
        emptyMessage="Incelenecek icerik bulunamadi."
        emptyIcon={<FileSearch className="h-12 w-12" />}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedItem(null); }}
        title="Icerik Detayi"
        width="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Tip</p>
              <EntityTypeBadge type={selectedItem.entityType} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Baslik</p>
              <p className="text-sm font-medium text-gray-900">{selectedItem.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Aciklama</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedItem.description || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Sahip</p>
              <p className="text-sm text-gray-700">{selectedItem.ownerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Olusturulma Tarihi</p>
              <p className="text-sm text-gray-700">{formatDate(selectedItem.createdAt)}</p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
