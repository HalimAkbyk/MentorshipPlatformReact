'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calendar, Eye, Info } from 'lucide-react';

import {
  adminApi,
  type AdminBookingListDto,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { Button } from '@/components/ui/button';

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

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminDisputesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Drawer state
  const [selectedBooking, setSelectedBooking] = useState<AdminBookingListDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tab filter for status
  const [statusFilter, setStatusFilter] = useState<string>('Disputed');
  const statusTabs = [
    { label: 'Itiraz Edilen', value: 'Disputed' },
    { label: 'Iptal Edilen', value: 'Cancelled' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'disputes', statusFilter, page, pageSize],
    queryFn: () =>
      adminApi.getEducationBookings({
        status: statusFilter,
        page,
        pageSize,
      }),
  });

  const bookings = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const handleOpenDetail = (booking: AdminBookingListDto) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  // Columns
  const columns: Column<AdminBookingListDto>[] = [
    {
      key: 'id',
      label: 'Ders ID',
      render: (item) => (
        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {item.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'mentorName',
      label: 'Mentor',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">
          {item.mentorName || '-'}
        </span>
      ),
    },
    {
      key: 'studentName',
      label: 'Ogrenci',
      render: (item) => (
        <span className="text-sm text-gray-700">
          {item.studentName || '-'}
        </span>
      ),
    },
    {
      key: 'startAt',
      label: 'Tarih',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{formatDate(item.startAt)}</span>
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
            handleOpenDetail(item);
          }}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Detay
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Ihtilafli Dersler</h1>
        </div>
        <p className="text-sm text-gray-500">
          Ogrenci ve mentor arasinda anlasmazlik yasanan dersler burada listelenir.
        </p>
      </div>

      {/* Info box */}
      <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
        <p className="text-sm text-orange-800">
          Itiraz edilen veya iptal edilen dersleri inceleyerek gerekli aksiyonlari alabilirsiniz.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-orange-600 text-white'
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
        data={bookings}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        onRowClick={handleOpenDetail}
        emptyMessage="Ihtilafli ders bulunamadi."
        emptyIcon={<AlertTriangle className="h-12 w-12" />}
        pagination={{
          page,
          pageSize,
          totalCount,
          totalPages,
          onPageChange: setPage,
        }}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedBooking(null); }}
        title="Ders Detayi"
        width="lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Ders ID</p>
              <p className="font-mono text-sm text-gray-700">{selectedBooking.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Mentor</p>
                <p className="text-sm text-gray-900">{selectedBooking.mentorName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Ogrenci</p>
                <p className="text-sm text-gray-900">{selectedBooking.studentName || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Baslangic Tarihi</p>
                <p className="text-sm text-gray-700">{formatDate(selectedBooking.startAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Sure (dk)</p>
                <p className="text-sm text-gray-700">{selectedBooking.durationMinutes}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Ders Basligi</p>
              <p className="text-sm text-gray-700">{selectedBooking.offeringTitle || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Durum</p>
              <StatusBadge status={selectedBooking.status} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Olusturulma Tarihi</p>
              <p className="text-sm text-gray-700">{formatDate(selectedBooking.createdAt)}</p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
