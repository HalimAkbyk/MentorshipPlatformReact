'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import {
  adminApi,
  type MentorPayoutSummaryDto,
  type MentorPayoutDetailDto,
  type PagedResult,
} from '@/lib/api/admin';
import { payoutsApi, type AdminPayoutRequestDto } from '@/lib/api/payouts';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatCard } from '@/components/admin/stat-card';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

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
// Payout Detail Drawer content (existing mentor detail)
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
// Payout Request Process Drawer
// ---------------------------------------------------------------------------

function RequestProcessDrawer({
  request,
  onClose,
}: {
  request: AdminPayoutRequestDto;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [adminNote, setAdminNote] = useState('');

  const processMutation = useMutation({
    mutationFn: (action: string) =>
      payoutsApi.processRequest(request.id, { action, adminNote: adminNote || undefined }),
    onSuccess: (_, action) => {
      toast.success(action === 'approve' ? 'Odeme talebi onaylandi.' : 'Odeme talebi reddedildi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-requests'] });
      onClose();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.errors?.[0] || error?.message || 'Bir hata olustu';
      toast.error(msg);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Bekliyor</Badge>;
      case 'Approved':
      case 'Completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Onaylandi</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Request Info */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Talep Bilgileri</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Mentor</p>
            <p className="text-sm font-bold text-gray-900">{request.mentorName}</p>
            {request.mentorEmail && (
              <p className="text-xs text-gray-500 mt-0.5">{request.mentorEmail}</p>
            )}
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-600">Talep Tutari</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(request.amount)}</p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Durum:</span>
            {getStatusBadge(request.status)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Talep Tarihi:</span>
            <span className="text-sm text-gray-700">{formatDate(request.createdAt)}</span>
          </div>
          {request.processedAt && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Islem Tarihi:</span>
              <span className="text-sm text-gray-700">{formatDate(request.processedAt)}</span>
            </div>
          )}
          {request.processedByName && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Islemi Yapan:</span>
              <span className="text-sm text-gray-700">{request.processedByName}</span>
            </div>
          )}
        </div>

        {request.mentorNote && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border">
            <p className="text-xs font-medium text-gray-500 mb-1">Mentor Notu</p>
            <p className="text-sm text-gray-700">{request.mentorNote}</p>
          </div>
        )}

        {request.adminNote && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-medium text-blue-600 mb-1">Admin Notu</p>
            <p className="text-sm text-blue-700">{request.adminNote}</p>
          </div>
        )}
      </section>

      {/* Process Actions - Only show for Pending */}
      {request.status === 'Pending' && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Islemi Yap</h3>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Admin Notu (Opsiyonel)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Islem ile ilgili not ekleyin..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => processMutation.mutate('reject')}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              Reddet
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => processMutation.mutate('approve')}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              Onayla
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Onay isleminden sonra {formatCurrency(request.amount)} tutarindaki odeme mentor bakiyesinden dusulecektir.
          </p>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests'>('requests');

  // --- Overview tab state ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  // --- Requests tab state ---
  const [reqSearch, setReqSearch] = useState('');
  const [debouncedReqSearch, setDebouncedReqSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState<string | undefined>(undefined);
  const [reqPage, setReqPage] = useState(1);

  // Request drawer
  const [reqDrawerOpen, setReqDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminPayoutRequestDto | null>(null);

  // --- Debounce ---
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [reqSearchTimer, setReqSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimer(timer);
  };

  const handleReqSearchChange = (value: string) => {
    setReqSearch(value);
    if (reqSearchTimer) clearTimeout(reqSearchTimer);
    const timer = setTimeout(() => {
      setDebouncedReqSearch(value);
      setReqPage(1);
    }, 400);
    setReqSearchTimer(timer);
  };

  // --- Query: Payouts list (overview) ---
  const { data: payoutsResult, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin', 'payouts', { page, pageSize, search: debouncedSearch }],
    queryFn: () =>
      adminApi.getMentorPayouts({
        page,
        pageSize,
        search: debouncedSearch || undefined,
      }),
    enabled: activeTab === 'overview',
  });

  const payouts = payoutsResult?.items ?? [];
  const totalCount = payoutsResult?.totalCount ?? 0;
  const totalPages = payoutsResult?.totalPages ?? 0;

  const totalEarned = payouts.reduce((sum, p) => sum + p.totalEarned, 0);
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.totalPaidOut, 0);
  const totalAvailable = payouts.reduce((sum, p) => sum + p.availableBalance, 0);

  // --- Query: Payout detail ---
  const { data: payoutDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'payouts', 'detail', selectedMentorId],
    queryFn: () => adminApi.getMentorPayoutDetail(selectedMentorId!),
    enabled: !!selectedMentorId,
  });

  // --- Query: Payout requests ---
  const { data: requestsResult, isLoading: requestsLoading } = useQuery({
    queryKey: ['admin', 'payout-requests', { page: reqPage, pageSize, status: reqStatusFilter, search: debouncedReqSearch }],
    queryFn: () =>
      payoutsApi.getAllRequests({
        page: reqPage,
        pageSize,
        status: reqStatusFilter,
        search: debouncedReqSearch || undefined,
      }),
    enabled: activeTab === 'requests',
  });

  const requests = requestsResult?.items ?? [];

  const handleOpenDetail = (payout: MentorPayoutSummaryDto) => {
    setSelectedMentorId(payout.mentorUserId);
    setDrawerOpen(true);
  };

  const handleOpenRequest = (request: AdminPayoutRequestDto) => {
    setSelectedRequest(request);
    setReqDrawerOpen(true);
  };

  // --- Overview columns ---
  const overviewColumns: Column<MentorPayoutSummaryDto>[] = [
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

  // --- Request columns ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-700 text-xs"><Clock className="w-3 h-3 mr-1" />Bekliyor</Badge>;
      case 'Approved':
      case 'Completed':
        return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Onaylandi</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="w-3 h-3 mr-1" />Reddedildi</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const requestColumns: Column<AdminPayoutRequestDto>[] = [
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
      key: 'amount',
      label: 'Tutar',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm font-bold text-blue-700">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'createdAt',
      label: 'Talep Tarihi',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm text-gray-600">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'processedAt',
      label: 'Islem Tarihi',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-sm text-gray-500">
          {item.processedAt ? formatDate(item.processedAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Islem',
      render: (item) => (
        <Button
          variant={item.status === 'Pending' ? 'default' : 'outline'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenRequest(item);
          }}
        >
          {item.status === 'Pending' ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Incele
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 mr-1" />
              Detay
            </>
          )}
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
          Mentor kazanc, odeme durumlarini ve odeme taleplerini yonetin
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'requests'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Odeme Talepleri
            {requestsResult && requestsResult.pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {requestsResult.pendingCount}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Mentor Bakiyeleri
          </div>
        </button>
      </div>

      {/* ═══════════════════ REQUESTS TAB ═══════════════════ */}
      {activeTab === 'requests' && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Bekleyen Talep"
              value={String(requestsResult?.pendingCount ?? 0)}
              icon={<Clock className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              title="Bekleyen Toplam"
              value={formatCurrency(requestsResult?.pendingTotal ?? 0)}
              icon={<DollarSign className="h-5 w-5" />}
              variant="default"
            />
            <StatCard
              title="Toplam Talep"
              value={String(requestsResult?.totalCount ?? 0)}
              icon={<Send className="h-5 w-5" />}
              variant="success"
            />
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Mentor adi veya e-posta ile ara..."
                value={reqSearch}
                onChange={(e) => handleReqSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="text-sm border rounded-md px-3 py-2 bg-white"
              value={reqStatusFilter ?? ''}
              onChange={(e) => {
                setReqStatusFilter(e.target.value || undefined);
                setReqPage(1);
              }}
            >
              <option value="">Tum Durumlar</option>
              <option value="Pending">Bekliyor</option>
              <option value="Completed">Onaylandi</option>
              <option value="Rejected">Reddedildi</option>
            </select>
          </div>

          {/* Requests Table */}
          <DataTable
            columns={requestColumns}
            data={requests}
            isLoading={requestsLoading}
            getRowId={(item) => item.id}
            onRowClick={handleOpenRequest}
            emptyMessage="Odeme talebi bulunamadi."
            emptyIcon={<Send className="h-12 w-12" />}
            pagination={{
              page: reqPage,
              pageSize,
              totalCount: requestsResult?.totalCount ?? 0,
              totalPages: requestsResult?.totalPages ?? 0,
              onPageChange: setReqPage,
            }}
          />
        </>
      )}

      {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
      {activeTab === 'overview' && (
        <>
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
            columns={overviewColumns}
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
        </>
      )}

      {/* Detail Drawer (overview) */}
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

      {/* Request Process Drawer */}
      <DetailDrawer
        open={reqDrawerOpen}
        onClose={() => { setReqDrawerOpen(false); setSelectedRequest(null); }}
        title="Odeme Talebi Detayi"
        width="lg"
      >
        {selectedRequest ? (
          <RequestProcessDrawer
            request={selectedRequest}
            onClose={() => { setReqDrawerOpen(false); setSelectedRequest(null); }}
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">Talep bilgisi bulunamadi.</p>
        )}
      </DetailDrawer>
    </div>
  );
}
