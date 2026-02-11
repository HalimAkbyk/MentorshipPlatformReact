'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type PendingRefund = {
  id: string;
  bookingId?: string;
  requesterUserId?: string;
  amount?: number;
  currency?: string;
  status: string;
  createdAt?: string;
};

export default function AdminRefundsPage() {
  const qc = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'refunds', 'pending'],
    queryFn: async () => {
      const res = await adminApi.getPendingRefunds();
      return res;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) =>
      adminApi.approveRefund({ refundId: id, isApproved: true, reason: reason[id] }),
    onSuccess: async () => {
      toast.success('İade onaylandı');
      await qc.invalidateQueries({ queryKey: ['admin', 'refunds', 'pending'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'Hata oluştu'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) =>
      adminApi.rejectRefund({ refundId: id, isApproved: false, reason: reason[id] }),
    onSuccess: async () => {
      toast.success('İade reddedildi');
      await qc.invalidateQueries({ queryKey: ['admin', 'refunds', 'pending'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.errors?.[0] || 'Hata oluştu'),
  });

  const list = useMemo(() => data ?? [], [data]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bekleyen İadeler</h1>
        <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      {isLoading && (
        <div className="py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-6">
            <p className="text-red-600">Veriler alınamadı. Endpoint/Yetki kontrol edin.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-gray-600">
            Bekleyen iade yok.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {list.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Refund #{r.id.slice(0, 8)}
                </span>
                <span className="text-sm text-gray-500">{r.status}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-sm text-gray-700">
                {r.bookingId && <div>Booking: <b>{r.bookingId}</b></div>}
                {r.requesterUserId && <div>Talep Eden: <b>{r.requesterUserId}</b></div>}
                {(r.amount !== undefined) && (
                  <div>Tutar: <b>{r.amount} {r.currency ?? 'TRY'}</b></div>
                )}
                {r.createdAt && <div>Talep: {new Date(r.createdAt).toLocaleString()}</div>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sebep/Not (opsiyonel)</label>
                <Input
                  placeholder="Onay/ret notu..."
                  value={reason[r.id] ?? ''}
                  onChange={(e) => setReason((prev) => ({ ...prev, [r.id]: e.target.value }))}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => approveMutation.mutate(r.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Onayla
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => rejectMutation.mutate(r.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reddet
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
