'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
  Receipt,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { paymentsApi, type StudentPaymentDto, type StudentRefundRequestDto } from '@/lib/api/payments';

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
      toast.success('Iade talebi olusturuldu');
      setRefundOrderId(null);
      setRefundReason('');
      qc.invalidateQueries({ queryKey: ['student', 'refund-requests'] });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.errors?.[0] || 'Iade talebi olusturulamadi');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-100 text-green-700 text-xs">Odendi</Badge>;
      case 'Refunded':
        return <Badge className="bg-red-100 text-red-700 text-xs">Iade Edildi</Badge>;
      case 'PartiallyRefunded':
        return <Badge className="bg-orange-100 text-orange-700 text-xs">Kismi Iade</Badge>;
      case 'Failed':
        return <Badge className="bg-gray-100 text-gray-600 text-xs">Basarisiz</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Booking':
        return <Badge variant="outline" className="text-xs border-primary-300 text-primary-700">Ders</Badge>;
      case 'Course':
        return <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">Kurs</Badge>;
      case 'GroupClass':
        return <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Grup Dersi</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const getDetailLink = (order: StudentPaymentDto): string | null => {
    if (order.type === 'Booking') return `/student/bookings/${order.resourceId}`;
    if (order.type === 'Course') return `/student/courses/${order.resourceId}`;
    return null;
  };

  const canRequestRefund = (order: StudentPaymentDto): boolean => {
    if (order.status !== 'Paid' && order.status !== 'PartiallyRefunded') return false;
    // Check if there's already a pending refund request
    const hasPending = refundRequests?.some(
      (r) => r.orderId === order.orderId && r.status === 'Pending'
    );
    return !hasPending;
  };

  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Beklemede</span>
          </div>
        );
      case 'Approved':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Onaylandi</span>
          </div>
        );
      case 'Rejected':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Reddedildi</span>
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Odeme Gecmisim</h1>
          <p className="text-sm text-gray-500 mt-1">Tum satin alim ve odeme islemleriniz</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Harcama</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(totalSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Siparis</CardTitle>
            <Receipt className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : orders?.totalCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Iade Edilen</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? '...' : formatCurrency(totalRefunded)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refund Requests Tracking */}
      {refundRequests && refundRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Iade Taleplerim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {refundRequests.map((r: StudentRefundRequestDto) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium">
                        {r.orderType === 'Booking' ? 'Ders' : r.orderType === 'Course' ? 'Kurs' : r.orderType}
                      </span>
                      {getRefundStatusBadge(r.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.reason} - {formatDate(r.createdAt, 'd MMM yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(r.requestedAmount)}</div>
                    {r.approvedAmount != null && (
                      <div className="text-xs text-green-600">
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Siparislerim</CardTitle>
              <CardDescription>Tum odeme islemleriniz</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="text-sm border rounded-md px-2 py-1 bg-white"
                value={statusFilter ?? ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value || undefined);
                  setPage(1);
                }}
              >
                <option value="">Tumu</option>
                <option value="Paid">Odendi</option>
                <option value="Refunded">Iade Edildi</option>
                <option value="PartiallyRefunded">Kismi Iade</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : orders && orders.items.length > 0 ? (
            <>
              <div className="space-y-3">
                {orders.items.map((order) => {
                  const detailLink = getDetailLink(order);
                  const showRefund = canRequestRefund(order);
                  return (
                    <div key={order.orderId}>
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">
                              {order.resourceTitle ?? 'Siparis'}
                            </span>
                            {getTypeBadge(order.type)}
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {order.mentorName && <span>Mentor: {order.mentorName}</span>}
                            <span>{formatDate(order.createdAt, 'd MMM yyyy HH:mm')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {formatCurrency(order.amount, order.currency)}
                            </div>
                            {order.refundedAmount != null && order.refundedAmount > 0 && (
                              <div className="text-xs text-red-500">
                                -{formatCurrency(order.refundedAmount, order.currency)} iade
                              </div>
                            )}
                          </div>
                          {showRefund && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => setRefundOrderId(order.orderId)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Iade
                            </Button>
                          )}
                          {detailLink && (
                            <Link href={detailLink}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Refund Request Form */}
                      {refundOrderId === order.orderId && (
                        <div className="ml-4 mr-4 p-3 border border-t-0 rounded-b-lg bg-red-50/50 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Iade talebi olustur</span>
                          </div>
                          <Input
                            placeholder="Iade sebebinizi yazin..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!refundReason.trim() || refundMutation.isPending}
                              onClick={() =>
                                refundMutation.mutate({
                                  orderId: order.orderId,
                                  reason: refundReason,
                                })
                              }
                            >
                              Iade Talep Et
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRefundOrderId(null);
                                setRefundReason('');
                              }}
                            >
                              Vazgec
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {orders.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    Toplam {orders.totalCount} siparis
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!orders.hasPreviousPage}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {orders.pageNumber} / {orders.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!orders.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Henuz odeme gecmisiniz bulunmuyor</p>
              <p className="text-sm mt-1">Ders veya kurs satin aldiginizda burada gorunecek</p>
              <Link href="/public/mentors" className="mt-4 inline-block">
                <Button>Mentor Bul</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
