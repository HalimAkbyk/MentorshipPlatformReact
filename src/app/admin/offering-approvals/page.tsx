'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Inbox,
  User,
  Tag,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface PendingOfferingApprovalDto {
  id: string;
  title: string;
  mentorName: string;
  price: number;
  currency: string;
  submittedAt: string;
}

function useOfferingApprovals() {
  return useQuery({
    queryKey: ['offering-approvals'],
    queryFn: () =>
      apiClient.get<PendingOfferingApprovalDto[]>('/admin/offering-approvals'),
  });
}

function useApproveOfferingPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      adminPrice,
      note,
    }: {
      id: string;
      adminPrice?: number;
      note?: string;
    }) =>
      apiClient.post(`/admin/offerings/${id}/approve-price`, {
        adminPrice: adminPrice ?? null,
        note: note ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering-approvals'] });
    },
  });
}

function useRejectOfferingPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post(`/admin/offerings/${id}/reject-price`, {
        reason: reason ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering-approvals'] });
    },
  });
}

export default function AdminOfferingApprovalsPage() {
  const { data: offerings, isLoading, isError } = useOfferingApprovals();
  const approveMutation = useApproveOfferingPrice();
  const rejectMutation = useRejectOfferingPrice();

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState<PendingOfferingApprovalDto | null>(null);
  const [adminPrice, setAdminPrice] = useState('');
  const [approveNote, setApproveNote] = useState('');

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<PendingOfferingApprovalDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await approveMutation.mutateAsync({
        id: approveTarget.id,
        adminPrice: adminPrice ? parseFloat(adminPrice) : undefined,
        note: approveNote.trim() || undefined,
      });
      toast.success(`"${approveTarget.title}" fiyat onaylandi.`);
      setApproveTarget(null);
      setAdminPrice('');
      setApproveNote('');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.[0] || 'Onaylama islemi basarisiz oldu.'
      );
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({
        id: rejectTarget.id,
        reason: rejectReason.trim() || undefined,
      });
      toast.success(`"${rejectTarget.title}" reddedildi.`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.[0] || 'Reddetme islemi basarisiz oldu.'
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Fiyat Onaylari</h1>
          <p className="text-xs text-gray-500">Egitmenlerin fiyat onay taleplerini yonetin</p>
        </div>
        {offerings && offerings.length > 0 && (
          <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 ml-2">
            {offerings.length} bekleyen
          </Badge>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-red-600">Veriler yuklenirken bir hata olustu.</p>
          </CardContent>
        </Card>
      ) : offerings && offerings.length > 0 ? (
        <div className="space-y-3">
          {offerings.map((offering) => (
            <Card key={offering.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">
                        {offering.title}
                      </span>
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                        Onay Bekliyor
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {offering.mentorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(offering.submittedAt, 'dd MMM yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatCurrency(offering.price, offering.currency)}
                    </div>
                    <div className="text-[10px] text-gray-400">talep edilen fiyat</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setApproveTarget(offering);
                      setAdminPrice('');
                      setApproveNote('');
                    }}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Onayla
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setRejectTarget(offering);
                      setRejectReason('');
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reddet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-amber-200 bg-amber-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Bekleyen fiyat onayi yok
            </h3>
            <p className="text-xs text-gray-500">
              Egitmenler yeni fiyat talebi gonderdiginde burada gorunecektir.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Approve Modal */}
      <Modal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Fiyat Onayla"
        description={approveTarget ? `"${approveTarget.title}" icin fiyat onaylama` : undefined}
      >
        {approveTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Egitmen:</span>
                <span className="font-medium">{approveTarget.mentorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Talep edilen fiyat:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(approveTarget.price, approveTarget.currency)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Admin Fiyat Degisikligi (istege bagli)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={`Bos birakirsaniz ${formatCurrency(approveTarget.price, approveTarget.currency)} onaylanir`}
                value={adminPrice}
                onChange={(e) => setAdminPrice(e.target.value)}
                className="text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Farkli bir fiyat belirlemek isterseniz girin.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Not (istege bagli)
              </label>
              <Textarea
                placeholder="Fiyat onayiyla ilgili not..."
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                className="text-sm min-h-[60px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setApproveTarget(null)}
              >
                Vazgec
              </Button>
              <Button
                size="sm"
                className="text-xs bg-green-600 hover:bg-green-700"
                disabled={approveMutation.isPending}
                onClick={handleApprove}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                )}
                Onayla
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Fiyat Reddet"
        description={rejectTarget ? `"${rejectTarget.title}" icin fiyat reddetme` : undefined}
      >
        {rejectTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Egitmen:</span>
                <span className="font-medium">{rejectTarget.mentorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Talep edilen fiyat:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(rejectTarget.price, rejectTarget.currency)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Ret Sebebi
              </label>
              <Textarea
                placeholder="Neden reddedildigini aciklayin..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setRejectTarget(null)}
              >
                Vazgec
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs"
                disabled={rejectMutation.isPending}
                onClick={handleReject}
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                )}
                Reddet
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
