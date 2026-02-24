'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  CreditCard,
  ExternalLink,
  Receipt,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { paymentsApi, type StudentPaymentDto, type StudentRefundRequestDto } from '@/lib/api/payments';
import { Pagination } from '@/components/ui/pagination';

export default function StudentPaymentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['student', 'payments', page, statusFilter],
    queryFn: () =>
      paymentsApi.getMyOrders({ page, pageSize: 15, status: statusFilter }),
  });

  const { data: refundRequests } = useQuery({
    queryKey: ['student', 'refund-requests'],
    queryFn: () => paymentsApi.getMyRefundRequests(),
  });

  const refundMutation = useMutation({
    mutationFn: async (data: { orderId: string; reason: string }) => {
      return paymentsApi.requestRefund(data);
    },
    onSuccess: () => {
      toast.success('İade talebi oluşturuldu');
      setRefundOrderId(null);
      setRefundReason('');
      qc.invalidateQueries({ queryKey: ['student', 'refund-requests'] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.errors?.[0] || 'İade talebi oluşturulamadı');
    },
  });

  const getStatusBadge = (status: string) => {
    const cls = "text-[10px] px-1.5 py-0";
    switch (status) {
      case 'Paid':
        return <Badge className={`bg-green-100 text-green-700 ${cls}`}>Ödendi</Badge>;
      case 'Refunded':
        return <Badge className={`bg-red-100 text-red-700 ${cls}`}>İade Edildi</Badge>;
      case 'PartiallyRefunded':
        return <Badge className={`bg-orange-100 text-orange-700 ${cls}`}>Kısmi İade</Badge>;
      case 'Failed':
        return <Badge className={`bg-gray-100 text-gray-600 ${cls}`}>Başarısız</Badge>;
      default:
        return <Badge variant="outline" className={cls}>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const cls = "text-[10px] px-1.5 py-0";
    switch (type) {
      case 'Booking':
        return <Badge variant="outline" className={`border-teal-300 text-teal-700 ${cls}`}>Ders</Badge>;
      case 'Course':
        return <Badge variant="outline" className={`border-purple-300 text-purple-700 ${cls}`}>Kurs</Badge>;
      case 'GroupClass':
        return <Badge variant="outline" className={`border-blue-300 text-blue-700 ${cls}`}>Grup Dersi</Badge>;
      default:
        return <Badge variant="outline" className={cls}>{type}</Badge>;
    }
  };

  const getDetailLink = (order: StudentPaymentDto): string | null => {
    if (order.type === 'Booking') return `/student/bookings/${order.resourceId}`;
    if (order.type === 'Course') return `/student/courses/${order.resourceId}`;
    return null;
  };

  const canRequestRefund = (order: StudentPaymentDto): boolean => {
    return order.refundPercentage > 0 && !order.refundIneligibleReason;
  };

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-medium">Beklemede</span>
          </div>
        );
      case 'Approved':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span className="text-[10px] font-medium">Onaylandı</span>
          </div>
        );
      case 'Rejected':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="w-3 h-3" />
            <span className="text-[10px] font-medium">Reddedildi</span>
          </div>
        );
      default:
        return null;
    }
  };

  const totalSpent = orders?.items
    .filter((o) => o.status === 'Paid' || o.status === 'PartiallyRefunded')
    .reduce((sum, o) => sum + o.amount, 0) ?? 0;

  const totalRefunded = orders?.items
    .filter((o) => o.refundedAmount)
    .reduce((sum, o) => sum + (o.refundedAmount ?? 0), 0) ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Ödeme Geçmişim</h1>
            <p className="text-xs text-gray-500">Tüm satın alım ve ödeme işlemleriniz</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Toplam Harcama</p>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading ? '...' : formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Toplam Sipariş</p>
                <p className="text-xl font-bold text-gray-900">{isLoading ? '...' : orders?.totalCount ?? 0}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">İade Edilen</p>
                <p className="text-xl font-bold text-red-600">
                  {isLoading ? '...' : formatCurrency(totalRefunded)}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refund Requests Tracking */}
      {refundRequests && refundRequests.length > 0 && (
        <Card className="border-0 shadow-sm mb-5">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              İade Taleplerim
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {refundRequests.map((r: StudentRefundRequestDto) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">
                        {r.orderType === 'Booking' ? 'Ders' : r.orderType === 'Course' ? 'Kurs' : r.orderType}
                      </span>
                      {getRefundStatusBadge(r.status)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {r.reason} - {formatDate(r.createdAt, 'd MMM yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">{formatCurrency(r.requestedAmount)}</div>
                    {r.approvedAmount != null && (
                      <div className="text-[10px] text-green-600">
                        Onaylanan: {formatCurrency(r.approvedAmount)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Siparişlerim</CardTitle>
              <CardDescription className="text-xs">Tüm ödeme işlemleriniz</CardDescription>
            </div>
            <select
              className="text-xs border rounded-lg px-2 py-1.5 bg-white text-gray-600"
              value={statusFilter ?? ''}
              onChange={(e) => {
                setStatusFilter(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">Tümü</option>
              <option value="Paid">Ödendi</option>
              <option value="Refunded">İade Edildi</option>
              <option value="PartiallyRefunded">Kısmi İade</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          ) : orders && orders.items.length > 0 ? (
            <>
              <div className="space-y-2">
                {orders.items.map((order) => {
                  const detailLink = getDetailLink(order);
                  const showRefund = canRequestRefund(order);
                  return (
                    <div key={order.orderId}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium truncate">
                              {order.resourceTitle ?? 'Sipariş'}
                            </span>
                            {getTypeBadge(order.type)}
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500">
                            {order.mentorName && <span>Mentor: {order.mentorName}</span>}
                            <span>{formatDate(order.createdAt, 'd MMM yyyy HH:mm')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-3">
                          <div className="text-right">
                            <div className="text-xs font-semibold">
                              {formatCurrency(order.amount, order.currency)}
                            </div>
                            {order.refundedAmount != null && order.refundedAmount > 0 && (
                              <div className="text-[10px] text-red-500">
                                -{formatCurrency(order.refundedAmount, order.currency)}
                              </div>
                            )}
                          </div>
                          {showRefund && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] px-2 py-1 h-auto border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => setRefundOrderId(order.orderId)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              İade
                            </Button>
                          )}
                          {detailLink && (
                            <Link href={detailLink}>
                              <Button variant="ghost" size="sm" className="px-2 py-1 h-auto">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Refund ineligibility info */}
                      {!showRefund && order.refundIneligibleReason && (
                        <div className="mx-3 px-3 py-2 border border-t-0 rounded-b-lg bg-amber-50/70 flex items-center gap-2">
                          <Info className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          <span className="text-[10px] text-amber-700">{order.refundIneligibleReason}</span>
                        </div>
                      )}

                      {/* Refund note */}
                      {showRefund && order.refundNote && refundOrderId !== order.orderId && (
                        <div className="mx-3 px-3 py-2 border border-t-0 rounded-b-lg bg-green-50/70 flex items-center gap-2">
                          <Info className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="text-[10px] text-green-700">{order.refundNote}</span>
                        </div>
                      )}

                      {/* Refund Request Form */}
                      {refundOrderId === order.orderId && (
                        <div className="mx-3 p-3 border border-t-0 rounded-b-lg bg-red-50/50 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-red-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="font-medium">İade talebi oluştur</span>
                          </div>
                          {order.refundNote && (
                            <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 px-2 py-1.5 rounded">
                              <Info className="w-3 h-3 flex-shrink-0" />
                              <span>{order.refundNote}</span>
                            </div>
                          )}
                          {!order.refundNote && order.refundPercentage < 1 && order.refundPercentage > 0 && (
                            <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
                              <Info className="w-3 h-3 flex-shrink-0" />
                              <span>Bu sipariş için %{Math.round(order.refundPercentage * 100)} oranında iade uygulanacaktır.</span>
                            </div>
                          )}
                          <Input
                            placeholder="İade sebebinizi yazın..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="text-sm h-8"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs"
                              disabled={!refundReason.trim() || refundMutation.isPending}
                              onClick={() =>
                                refundMutation.mutate({
                                  orderId: order.orderId,
                                  reason: refundReason,
                                })
                              }
                            >
                              İade Talep Et
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setRefundOrderId(null);
                                setRefundReason('');
                              }}
                            >
                              Vazgeç
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Pagination
                page={page}
                totalPages={orders.totalPages}
                totalCount={orders.totalCount}
                onPageChange={setPage}
                itemLabel="sipariş"
              />
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Henüz ödeme geçmişiniz yok</h3>
              <p className="text-xs text-gray-500 mb-4">Ders veya kurs satın aldığınızda burada görünecek</p>
              <Link href="/public/mentors">
                <Button size="sm" className="text-xs">Mentor Bul</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
