'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Loader2,
} from 'lucide-react';
import { adminApi, type AdminRefundRequestDto, type AdminOrderDto } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default function AdminRefundsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [overrideAmounts, setOverrideAmounts] = useState<Record<string, string>>({});

  // Initiate refund modal state
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [initiateForm, setInitiateForm] = useState({
    orderId: '',
    amount: '',
    reason: '',
    isGoodwill: false,
  });

  // Order search for initiate refund
  const [orderSearch, setOrderSearch] = useState('');
  const [orderResults, setOrderResults] = useState<AdminOrderDto[]>([]);
  const [orderSearching, setOrderSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDto | null>(null);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const orderSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowOrderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced order search
  const handleOrderSearch = (value: string) => {
    setOrderSearch(value);
    setSelectedOrder(null);
    setInitiateForm((f) => ({ ...f, orderId: '' }));
    if (orderSearchTimer.current) clearTimeout(orderSearchTimer.current);
    if (!value.trim() || value.length < 2) {
      setOrderResults([]);
      setShowOrderDropdown(false);
      return;
    }
    orderSearchTimer.current = setTimeout(async () => {
      setOrderSearching(true);
      try {
        const result = await adminApi.getOrders({ search: value, pageSize: 8, status: 'Paid' });
        setOrderResults(result.items ?? []);
        setShowOrderDropdown(true);
      } catch {
        setOrderResults([]);
      } finally {
        setOrderSearching(false);
      }
    }, 400);
  };

  const selectOrder = (order: AdminOrderDto) => {
    setSelectedOrder(order);
    setInitiateForm((f) => ({
      ...f,
      orderId: order.id,
      amount: (order.amountTotal - order.refundedAmount).toFixed(2),
    }));
    setOrderSearch(`${order.buyerName} — ${order.id.slice(0, 8)}...`);
    setShowOrderDropdown(false);
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'refund-requests', statusFilter, page],
    queryFn: () => adminApi.getRefundRequests({
      status: statusFilter || undefined,
      page,
      pageSize: 15,
    }),
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const override = overrideAmounts[id] ? parseFloat(overrideAmounts[id]) : undefined;
      await adminApi.processRefund(id, {
        isApproved,
        overrideAmount: override,
        adminNotes: adminNotes[id],
      });
    },
    onSuccess: async (_, { isApproved }) => {
      toast.success(isApproved ? 'İade onaylandı' : 'İade reddedildi');
      setProcessingId(null);
      await qc.invalidateQueries({ queryKey: ['admin', 'refund-requests'] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.errors?.[0] || 'Hata oluştu');
      setProcessingId(null);
    },
  });

  const initiateMutation = useMutation({
    mutationFn: async () => {
      await adminApi.initiateRefund({
        orderId: initiateForm.orderId,
        amount: parseFloat(initiateForm.amount),
        reason: initiateForm.reason,
        isGoodwill: initiateForm.isGoodwill,
      });
    },
    onSuccess: async () => {
      toast.success('İade başlatıldı');
      setShowInitiateModal(false);
      setInitiateForm({ orderId: '', amount: '', reason: '', isGoodwill: false });
      setOrderSearch('');
      setSelectedOrder(null);
      setOrderResults([]);
      await qc.invalidateQueries({ queryKey: ['admin', 'refund-requests'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'Hata oluştu'),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Beklemede</Badge>;
      case 'Approved':
        return <Badge className="bg-green-100 text-green-700 text-xs">Onaylandı</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-700 text-xs">Reddedildi</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'StudentRequest':
        return <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Öğrenci</Badge>;
      case 'AdminInitiated':
        return <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">Admin</Badge>;
      case 'GoodwillCredit':
        return <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Goodwill</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const tabs = [
    { label: 'Bekleyen', value: 'Pending' },
    { label: 'Onaylanan', value: 'Approved' },
    { label: 'Reddedilen', value: 'Rejected' },
    { label: 'Tümü', value: '' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">İade Yönetimi</h1>
          <p className="text-sm text-gray-500">İade taleplerini incele ve yönet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInitiateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni İade Başlat
          </Button>
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Initiate Refund Modal */}
      {showInitiateModal && (
        <Card className="mb-6 border-primary-200 bg-primary-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Yeni İade Başlat</CardTitle>
            <CardDescription>Admin tarafından doğrudan iade işlemini başlatır</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div ref={dropdownRef} className="relative">
              <label className="text-sm font-medium">Sipariş Ara</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Müşteri adı, e-posta veya sipariş ID..."
                  className="pl-10"
                  value={orderSearch}
                  onChange={(e) => handleOrderSearch(e.target.value)}
                  onFocus={() => orderResults.length > 0 && setShowOrderDropdown(true)}
                />
                {orderSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {showOrderDropdown && orderResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {orderResults.map((order) => (
                    <button
                      key={order.id}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                      onClick={() => selectOrder(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{order.buyerName}</span>
                          <span className="text-xs text-gray-500 ml-2">{order.buyerEmail}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {order.type === 'Booking' ? 'Ders' : order.type === 'Course' ? 'Kurs' : order.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-gray-400">{order.id.slice(0, 8)}...</span>
                        <span className="text-xs font-semibold text-primary-600">
                          {formatCurrency(order.amountTotal, order.currency)}
                        </span>
                        {order.refundedAmount > 0 && (
                          <span className="text-xs text-red-500">
                            (iade: {formatCurrency(order.refundedAmount, order.currency)})
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(order.createdAt, 'd MMM yyyy')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showOrderDropdown && orderResults.length === 0 && !orderSearching && orderSearch.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg px-3 py-4 text-center text-sm text-gray-500">
                  Sipariş bulunamadı
                </div>
              )}
              {selectedOrder && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center justify-between">
                  <div>
                    <span className="font-medium">{selectedOrder.buyerName}</span>
                    <span className="text-xs text-gray-500 ml-2 font-mono">{selectedOrder.id.slice(0, 8)}...</span>
                  </div>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(selectedOrder.amountTotal, selectedOrder.currency)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">İade Tutarı (TRY)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="100.00"
                value={initiateForm.amount}
                onChange={(e) => setInitiateForm({ ...initiateForm, amount: e.target.value })}
              />
              {selectedOrder && (
                <p className="text-xs text-gray-500 mt-1">
                  Maks iade: {formatCurrency(selectedOrder.amountTotal - selectedOrder.refundedAmount, selectedOrder.currency)}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Sebep</label>
              <Input
                placeholder="İade sebebi..."
                value={initiateForm.reason}
                onChange={(e) => setInitiateForm({ ...initiateForm, reason: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isGoodwill"
                checked={initiateForm.isGoodwill}
                onChange={(e) => setInitiateForm({ ...initiateForm, isGoodwill: e.target.checked })}
              />
              <label htmlFor="isGoodwill" className="text-sm">
                Goodwill iade (sadece platformdan düşülür, mentor kazancına dokunulmaz)
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => initiateMutation.mutate()}
                disabled={initiateMutation.isPending || !initiateForm.orderId || !initiateForm.amount || !initiateForm.reason}
              >
                İadeyi Başlat
              </Button>
              <Button variant="outline" onClick={() => {
                setShowInitiateModal(false);
                setOrderSearch('');
                setSelectedOrder(null);
                setOrderResults([]);
                setInitiateForm({ orderId: '', amount: '', reason: '', isGoodwill: false });
              }}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="space-y-4">
            {data.items.map((r: AdminRefundRequestDto) => (
              <Card key={r.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <RotateCcw className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm">{r.resourceTitle ?? 'Siparis'}</span>
                        {getStatusBadge(r.status)}
                        {getTypeBadge(r.refundType)}
                        <Badge variant="outline" className="text-xs">
                          {r.orderType === 'Booking' ? 'Ders' : r.orderType === 'Course' ? 'Kurs' : r.orderType}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 space-y-0.5">
                        <div>Talep Eden: <b>{r.requesterName ?? r.requestedByUserId.slice(0, 8)}</b></div>
                        {r.mentorName && <div>Mentor: <b>{r.mentorName}</b></div>}
                        <div>Sebep: {r.reason}</div>
                        <div>Tarih: {formatDate(r.createdAt, 'd MMM yyyy HH:mm')}</div>
                        {r.adminNotes && <div className="text-xs text-gray-500">Admin notu: {r.adminNotes}</div>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold">{formatCurrency(r.requestedAmount)}</div>
                      <div className="text-xs text-gray-500">
                        Siparis: {formatCurrency(r.orderTotal)}
                      </div>
                      {r.alreadyRefunded > 0 && (
                        <div className="text-xs text-red-500">
                          Önceki iade: {formatCurrency(r.alreadyRefunded)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin actions for pending requests */}
                  {r.status === 'Pending' && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Tutar değiştir (opsiyonel)</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={r.requestedAmount.toFixed(2)}
                            value={overrideAmounts[r.id] ?? ''}
                            onChange={(e) =>
                              setOverrideAmounts((p) => ({ ...p, [r.id]: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Admin notu</label>
                          <Input
                            placeholder="Not ekle..."
                            value={adminNotes[r.id] ?? ''}
                            onChange={(e) =>
                              setAdminNotes((p) => ({ ...p, [r.id]: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setProcessingId(r.id);
                            processMutation.mutate({ id: r.id, isApproved: true });
                          }}
                          disabled={processingId === r.id}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Onayla
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setProcessingId(r.id);
                            processMutation.mutate({ id: r.id, isApproved: false });
                          }}
                          disabled={processingId === r.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reddet
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-gray-500">Toplam {data.totalCount} talep</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {data.pageNumber} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Bu kategoride iade talebi bulunmuyor</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
