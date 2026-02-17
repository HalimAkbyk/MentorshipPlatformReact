'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  Search,
  Eye,
  Calendar,
  CreditCard,
  CheckCircle,
  RotateCcw,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

import {
  adminApi,
  type AdminOrderDto,
  type AdminOrderDetailDto,
  type PagedResult,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { StatCard } from '@/components/admin/stat-card';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const typeLabels: Record<string, string> = {
  Booking: '1:1 Ders',
  GroupClass: 'Grup Dersi',
  Course: 'Video Kurs',
};

function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    Booking: 'bg-blue-100 text-blue-700',
    GroupClass: 'bg-purple-100 text-purple-700',
    Course: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', colorMap[type] || 'bg-gray-100 text-gray-700')}>
      {typeLabels[type] || type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter components
// ---------------------------------------------------------------------------

const typeFilters = [
  { label: 'Tumu', value: '' },
  { label: '1:1 Ders', value: 'Booking' },
  { label: 'Grup Dersi', value: 'GroupClass' },
  { label: 'Video Kurs', value: 'Course' },
];

const statusFilters = [
  { label: 'Tumu', value: '' },
  { label: 'Beklemede', value: 'Pending' },
  { label: 'Odendi', value: 'Paid' },
  { label: 'Basarisiz', value: 'Failed' },
  { label: 'Iade', value: 'Refunded' },
  { label: 'Kismi Iade', value: 'PartiallyRefunded' },
  { label: 'Terk Edildi', value: 'Abandoned' },
];

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
// Order Detail Drawer content
// ---------------------------------------------------------------------------

function OrderDetailContent({ detail }: { detail: AdminOrderDetailDto }) {
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Siparis Bilgileri</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Siparis ID</span>
            <p className="font-mono text-gray-900">{detail.id.slice(0, 8)}...</p>
          </div>
          <div>
            <span className="text-gray-500">Tip</span>
            <p><TypeBadge type={detail.type} /></p>
          </div>
          <div>
            <span className="text-gray-500">Alici</span>
            <p className="font-medium text-gray-900">{detail.buyerName}</p>
            {detail.buyerEmail && <p className="text-xs text-gray-500">{detail.buyerEmail}</p>}
          </div>
          <div>
            <span className="text-gray-500">Durum</span>
            <p><StatusBadge status={detail.status} size="sm" /></p>
          </div>
          <div>
            <span className="text-gray-500">Tutar</span>
            <p className="font-bold text-gray-900">{formatCurrency(detail.amountTotal)}</p>
          </div>
          <div>
            <span className="text-gray-500">Iade Edilen</span>
            <p className={cn('font-medium', detail.refundedAmount > 0 ? 'text-red-600' : 'text-gray-500')}>
              {formatCurrency(detail.refundedAmount)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Odeme Saglayici</span>
            <p className="text-gray-900">{detail.paymentProvider || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">Tarih</span>
            <p className="text-gray-900">{formatDate(detail.createdAt)}</p>
          </div>
          {detail.providerPaymentId && (
            <div className="col-span-2">
              <span className="text-gray-500">Saglayici Odeme ID</span>
              <p className="font-mono text-xs text-gray-700 break-all">{detail.providerPaymentId}</p>
            </div>
          )}
          <div className="col-span-2">
            <span className="text-gray-500">Kaynak ID</span>
            <p className="font-mono text-xs text-gray-700 break-all">{detail.resourceId}</p>
          </div>
        </div>
      </section>

      {/* Ledger Entries */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Muhasebe Kayitlari ({detail.ledgerEntries.length})
        </h3>
        {detail.ledgerEntries.length === 0 ? (
          <p className="text-sm text-gray-500">Kayit bulunamadi.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Hesap</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Yon</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Tutar</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.ledgerEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2 text-gray-700">{entry.accountType}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1">
                        {entry.direction === 'Credit' ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className={entry.direction === 'Credit' ? 'text-green-700' : 'text-red-600'}>
                          {entry.direction === 'Credit' ? 'Alacak' : 'Borc'}
                        </span>
                      </span>
                    </td>
                    <td className={cn('px-3 py-2 text-right font-medium', entry.direction === 'Credit' ? 'text-green-700' : 'text-red-600')}>
                      {entry.direction === 'Credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Refund Requests */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Iade Talepleri ({detail.refundRequests.length})
        </h3>
        {detail.refundRequests.length === 0 ? (
          <p className="text-sm text-gray-500">Iade talebi bulunamadi.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Durum</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Tutar</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Tip</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.refundRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-3 py-2">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(req.requestedAmount)}</span>
                      {req.approvedAmount != null && (
                        <span className="text-xs text-gray-500 ml-1">
                          (onay: {formatCurrency(req.approvedAmount)})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{req.type || '-'}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminOrdersPage() {
  // --- State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  // --- Query: Orders list ---
  const { data: ordersResult, isLoading: ordersLoading } = useQuery({
    queryKey: [
      'admin', 'orders',
      { page, pageSize, search: debouncedSearch, type: typeFilter, status: statusFilter, dateFrom, dateTo },
    ],
    queryFn: () =>
      adminApi.getOrders({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const orders = ordersResult?.items ?? [];
  const totalCount = ordersResult?.totalCount ?? 0;
  const totalPages = ordersResult?.totalPages ?? 0;

  // --- Computed stats from current page data ---
  const paidCount = orders.filter((o) => o.status === 'Paid').length;
  const refundedCount = orders.filter((o) => o.status === 'Refunded' || o.status === 'PartiallyRefunded').length;
  const totalRevenue = orders
    .filter((o) => o.status === 'Paid' || o.status === 'PartiallyRefunded')
    .reduce((sum, o) => sum + o.amountTotal, 0);

  // --- Query: Order detail ---
  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'orders', 'detail', selectedOrderId],
    queryFn: () => adminApi.getOrderDetail(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const handleOpenDetail = (order: AdminOrderDto) => {
    setSelectedOrderId(order.id);
    setDrawerOpen(true);
  };

  // --- Columns ---
  const columns: Column<AdminOrderDto>[] = [
    {
      key: 'id',
      label: 'Siparis ID',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="font-mono text-xs text-gray-700">{item.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'buyerName',
      label: 'Alici',
      render: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.buyerName}</p>
          {item.buyerEmail && (
            <p className="text-xs text-gray-500 truncate">{item.buyerEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tip',
      render: (item) => <TypeBadge type={item.type} />,
    },
    {
      key: 'amountTotal',
      label: 'Tutar',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amountTotal)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
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
          <ShoppingCart className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Siparis Yonetimi</h1>
        </div>
        <p className="text-sm text-gray-500">
          Tum siparisleri goruntule ve yonet
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Siparis"
          value={totalCount}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Odenen"
          value={paidCount}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Iade Edilen"
          value={refundedCount}
          icon={<RotateCcw className="h-5 w-5" />}
          variant="danger"
        />
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Alici adi veya e-posta ile ara..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="text-sm border rounded-lg px-3 py-2 bg-white border-gray-200"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="text-sm border rounded-lg px-3 py-2 bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Type filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium mr-1">Tip:</span>
            {typeFilters.map((tf) => (
              <FilterButton
                key={tf.value}
                label={tf.label}
                active={typeFilter === tf.value}
                onClick={() => { setTypeFilter(tf.value); setPage(1); }}
              />
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium mr-1">Durum:</span>
            {statusFilters.map((sf) => (
              <FilterButton
                key={sf.value}
                label={sf.label}
                active={statusFilter === sf.value}
                onClick={() => { setStatusFilter(sf.value); setPage(1); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={ordersLoading}
        getRowId={(item) => item.id}
        onRowClick={handleOpenDetail}
        emptyMessage="Siparis bulunamadi."
        emptyIcon={<ShoppingCart className="h-12 w-12" />}
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
        onClose={() => { setDrawerOpen(false); setSelectedOrderId(null); }}
        title="Siparis Detayi"
        width="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : orderDetail ? (
          <OrderDetailContent detail={orderDetail} />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">Siparis bilgisi bulunamadi.</p>
        )}
      </DetailDrawer>
    </div>
  );
}
