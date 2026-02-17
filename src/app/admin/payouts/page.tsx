'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Search,
  Eye,
  DollarSign,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
} from 'lucide-react';

import {
  adminApi,
  type MentorPayoutSummaryDto,
  type MentorPayoutDetailDto,
  type PagedResult,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatCard } from '@/components/admin/stat-card';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { Button } from '@/components/ui/button';
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

// ---------------------------------------------------------------------------
// Payout Detail Drawer content
// ---------------------------------------------------------------------------

function PayoutDetailContent({ detail }: { detail: MentorPayoutDetailDto }) {
  return (
    <div className="space-y-6">
      {/* Mentor Summary */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Mentor Bilgileri</h3>
        <div className="space-y-1 text-sm mb-4">
          <p className="font-medium text-gray-900">{detail.mentorName}</p>
          {detail.mentorEmail && (
            <p className="text-gray-500">{detail.mentorEmail}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Toplam Kazanc</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(detail.totalEarned)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Odenen</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(detail.totalPaidOut)}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-xs text-green-600">Bekleyen Bakiye</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(detail.availableBalance)}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-600">Escroda</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(detail.inEscrow)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <BookOpen className="h-4 w-4 text-gray-400" />
          <span>{detail.completedBookings} tamamlanmis ders</span>
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Son Islemler ({detail.recentTransactions.length})
        </h3>
        {detail.recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-500">Islem bulunamadi.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Hesap</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Yon</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Tutar</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Referans</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-3 py-2 text-gray-700">{tx.accountType}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1">
                        {tx.direction === 'Credit' ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className={tx.direction === 'Credit' ? 'text-green-700' : 'text-red-600'}>
                          {tx.direction === 'Credit' ? 'Alacak' : 'Borc'}
                        </span>
                      </span>
                    </td>
                    <td className={cn('px-3 py-2 text-right font-medium', tx.direction === 'Credit' ? 'text-green-700' : 'text-red-600')}>
                      {tx.direction === 'Credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{tx.referenceType}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{formatDate(tx.createdAt)}</td>
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

export default function AdminPayoutsPage() {
  // --- State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

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

  // --- Query: Payouts list ---
  const { data: payoutsResult, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin', 'payouts', { page, pageSize, search: debouncedSearch }],
    queryFn: () =>
      adminApi.getMentorPayouts({
        page,
        pageSize,
        search: debouncedSearch || undefined,
      }),
  });

  const payouts = payoutsResult?.items ?? [];
  const totalCount = payoutsResult?.totalCount ?? 0;
  const totalPages = payoutsResult?.totalPages ?? 0;

  // --- Computed stats from current page data ---
  const totalEarned = payouts.reduce((sum, p) => sum + p.totalEarned, 0);
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.totalPaidOut, 0);
  const totalAvailable = payouts.reduce((sum, p) => sum + p.availableBalance, 0);

  // --- Query: Payout detail ---
  const { data: payoutDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'payouts', 'detail', selectedMentorId],
    queryFn: () => adminApi.getMentorPayoutDetail(selectedMentorId!),
    enabled: !!selectedMentorId,
  });

  const handleOpenDetail = (payout: MentorPayoutSummaryDto) => {
    setSelectedMentorId(payout.mentorUserId);
    setDrawerOpen(true);
  };

  // --- Columns ---
  const columns: Column<MentorPayoutSummaryDto>[] = [
    {
      key: 'mentorName',
      label: 'Mentor',
      render: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.mentorName}</p>
          {item.mentorEmail && (
            <p className="text-xs text-gray-500 truncate">{item.mentorEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: 'totalEarned',
      label: 'Toplam Kazanc',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{formatCurrency(item.totalEarned)}</span>
      ),
    },
    {
      key: 'totalPaidOut',
      label: 'Odenen',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm font-medium text-blue-700">{formatCurrency(item.totalPaidOut)}</span>
      ),
    },
    {
      key: 'availableBalance',
      label: 'Bekleyen',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className={cn('text-sm font-medium', item.availableBalance > 0 ? 'text-green-700' : 'text-gray-500')}>
          {formatCurrency(item.availableBalance)}
        </span>
      ),
    },
    {
      key: 'inEscrow',
      label: 'Escroda',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm text-amber-700">{formatCurrency(item.inEscrow)}</span>
      ),
    },
    {
      key: 'completedBookings',
      label: 'Tamamlanan Ders',
      className: 'text-center whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <BookOpen className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-700">{item.completedBookings}</span>
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
          <Wallet className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Mentor Odemeleri</h1>
        </div>
        <p className="text-sm text-gray-500">
          Mentor kazanc ve odeme durumlarini goruntule
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Toplam Kazanc"
          value={formatCurrency(totalEarned)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Odenen"
          value={formatCurrency(totalPaidOut)}
          icon={<CreditCard className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Bekleyen Bakiye"
          value={formatCurrency(totalAvailable)}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Mentor adi veya e-posta ile ara..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payouts}
        isLoading={payoutsLoading}
        getRowId={(item) => item.mentorUserId}
        onRowClick={handleOpenDetail}
        emptyMessage="Mentor odeme bilgisi bulunamadi."
        emptyIcon={<Wallet className="h-12 w-12" />}
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
        onClose={() => { setDrawerOpen(false); setSelectedMentorId(null); }}
        title="Mentor Odeme Detayi"
        width="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : payoutDetail ? (
          <PayoutDetailContent detail={payoutDetail} />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">Mentor bilgisi bulunamadi.</p>
        )}
      </DetailDrawer>
    </div>
  );
}
