'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Send,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils/format';
import { earningsApi, type MentorTransactionDto } from '@/lib/api/earnings';
import { payoutsApi, type PayoutRequestDto } from '@/lib/api/payouts';
import { toast } from 'sonner';

export default function EarningsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  // Payout dialog
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');

  // Payout requests page
  const [payoutPage, setPayoutPage] = useState(1);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: () => earningsApi.getSummary(),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['earnings', 'transactions', page, typeFilter],
    queryFn: () => earningsApi.getTransactions({ page, pageSize: 15, type: typeFilter }),
  });

  const { data: payoutSettings } = useQuery({
    queryKey: ['payout', 'settings'],
    queryFn: () => payoutsApi.getSettings(),
  });

  const { data: payoutRequests } = useQuery({
    queryKey: ['payout', 'requests', payoutPage],
    queryFn: () => payoutsApi.getMyRequests({ page: payoutPage, pageSize: 10 }),
  });

  const createPayoutMutation = useMutation({
    mutationFn: (data: { amount: number; note?: string }) => payoutsApi.createRequest(data),
    onSuccess: () => {
      toast.success('Odeme talebiniz basariyla olusturuldu.');
      queryClient.invalidateQueries({ queryKey: ['payout'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
      setPayoutDialogOpen(false);
      setPayoutAmount('');
      setPayoutNote('');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.errors?.[0] || error?.message || 'Bir hata olustu';
      toast.error(msg);
    },
  });

  const handleSubmitPayout = () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Gecerli bir tutar giriniz.');
      return;
    }
    if (payoutSettings && amount < payoutSettings.minimumPayoutAmount) {
      toast.error(`Minimum odeme tutari ${formatCurrency(payoutSettings.minimumPayoutAmount)} olarak belirlenmistir.`);
      return;
    }
    if (payoutSettings && amount > payoutSettings.availableBalance) {
      toast.error('Talep edilen tutar, kullanilabilir bakiyenizden fazla olamaz.');
      return;
    }
    createPayoutMutation.mutate({
      amount,
      note: payoutNote || undefined,
    });
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'Credit') return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  };

  const getAccountBadge = (accountType: string) => {
    switch (accountType) {
      case 'MentorEscrow':
        return <Badge variant="secondary" className="text-xs">Emanet</Badge>;
      case 'MentorAvailable':
        return <Badge className="bg-green-100 text-green-700 text-xs">Kullanilabilir</Badge>;
      case 'MentorPayout':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Odeme</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{accountType}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Booking':
        return <Badge variant="outline" className="text-xs border-primary-300 text-primary-700">Ders</Badge>;
      case 'Course':
        return <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">Kurs</Badge>;
      case 'Refund':
        return <Badge variant="outline" className="text-xs border-red-300 text-red-700">Iade</Badge>;
      case 'Payout':
        return <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Odeme</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  const getPayoutStatusBadge = (status: string) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Kazanclarim</h1>
          {summary && (
            <p className="text-sm text-gray-500 mt-1">
              Bu ay: <span className="font-semibold text-green-600">{formatCurrency(summary.thisMonthEarnings)}</span>
            </p>
          )}
        </div>
        <Button
          onClick={() => setPayoutDialogOpen(true)}
          disabled={!payoutSettings || payoutSettings.availableBalance < payoutSettings.minimumPayoutAmount || payoutSettings.hasPendingRequest}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Odeme Talep Et
        </Button>
      </div>

      {/* Pending payout request warning */}
      {payoutSettings?.hasPendingRequest && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Bekleyen odeme talebiniz var</p>
            <p className="text-sm text-amber-600 mt-0.5">
              {formatCurrency(payoutSettings.pendingRequestAmount ?? 0)} tutarindaki talebiniz incelenmektedir.
              Yeni talep icin mevcut talebin sonuclanmasi beklenmektedir.
            </p>
          </div>
        </div>
      )}

      {/* Min payout info */}
      {payoutSettings && !payoutSettings.hasPendingRequest && payoutSettings.availableBalance < payoutSettings.minimumPayoutAmount && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Minimum odeme tutarina ulasilmadi</p>
            <p className="text-sm text-blue-600 mt-0.5">
              Odeme talep edebilmek icin kullanilabilir bakiyenizin en az{' '}
              <span className="font-semibold">{formatCurrency(payoutSettings.minimumPayoutAmount)}</span> olmasi gerekmektedir.
              Mevcut bakiyeniz: <span className="font-semibold">{formatCurrency(payoutSettings.availableBalance)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kazanc</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : formatCurrency(summary?.totalEarnings ?? 0)}
            </div>
            <p className="text-xs text-gray-600">Tum zamanlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kullanilabilir Bakiye</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {summaryLoading ? '...' : formatCurrency(summary?.availableBalance ?? 0)}
            </div>
            <p className="text-xs text-gray-600">Cekilebilir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen (Emanet)</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {summaryLoading ? '...' : formatCurrency(summary?.escrowBalance ?? 0)}
            </div>
            <p className="text-xs text-gray-600">Ders tamamlaninca aktiflesir</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests Section */}
      {payoutRequests && payoutRequests.items.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Odeme Taleplerim</CardTitle>
            <CardDescription>Gecmis ve mevcut odeme talepleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payoutRequests.items.map((req: PayoutRequestDto) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Send className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        Odeme Talebi - {formatCurrency(req.amount)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getPayoutStatusBadge(req.status)}
                        <span className="text-xs text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {req.mentorNote && (
                        <p className="text-xs text-gray-500 mt-1">Not: {req.mentorNote}</p>
                      )}
                      {req.adminNote && (
                        <p className="text-xs text-gray-500 mt-1">
                          Admin notu: <span className="text-gray-700">{req.adminNote}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {formatCurrency(req.amount)}
                  </div>
                </div>
              ))}
            </div>

            {payoutRequests.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-sm text-gray-500">
                  Toplam {payoutRequests.totalCount} talep
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={payoutPage <= 1}
                    onClick={() => setPayoutPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {payoutPage} / {payoutRequests.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={payoutPage >= payoutRequests.totalPages}
                    onClick={() => setPayoutPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Islem Gecmisi</CardTitle>
              <CardDescription>Tum kazanc ve odeme hareketleri</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="text-sm border rounded-md px-2 py-1 bg-white"
                value={typeFilter ?? ''}
                onChange={(e) => {
                  setTypeFilter(e.target.value || undefined);
                  setPage(1);
                }}
              >
                <option value="">Tumu</option>
                <option value="Booking">Ders</option>
                <option value="Course">Kurs</option>
                <option value="Refund">Iade</option>
                <option value="Payout">Odeme</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : transactions && transactions.items.length > 0 ? (
            <>
              <div className="space-y-3">
                {transactions.items.map((tx: MentorTransactionDto) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getDirectionIcon(tx.direction)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{tx.description ?? 'Islem'}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getTypeBadge(tx.type)}
                          {getAccountBadge(tx.accountType)}
                          <span className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      tx.direction === 'Credit' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {tx.direction === 'Credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {transactions.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    Toplam {transactions.totalCount} islem
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!transactions.hasPreviousPage}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {transactions.pageNumber} / {transactions.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!transactions.hasNextPage}
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
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Henuz islem gecmisiniz bulunmuyor</p>
              <p className="text-sm mt-1">Ders veya kurs satislari burada gorunecek</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      {payoutDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Odeme Talep Et</h2>
            <p className="text-sm text-gray-500 mb-6">
              Kullanilabilir bakiyenizden odeme talebinde bulunun.
            </p>

            {/* Balance info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs text-green-600">Kullanilabilir Bakiye</p>
                <p className="text-lg font-bold text-green-700">
                  {formatCurrency(payoutSettings?.availableBalance ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Min. Odeme Tutari</p>
                <p className="text-lg font-bold text-gray-700">
                  {formatCurrency(payoutSettings?.minimumPayoutAmount ?? 0)}
                </p>
              </div>
            </div>

            {/* Amount input */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Talep Tutari (TRY)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min={payoutSettings?.minimumPayoutAmount ?? 0}
                  max={payoutSettings?.availableBalance ?? 0}
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayoutAmount(String(payoutSettings?.availableBalance ?? 0))}
                  className="shrink-0 text-xs"
                >
                  Tumu
                </Button>
              </div>
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Not (Opsiyonel)
              </label>
              <textarea
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
                placeholder="Odeme ile ilgili not ekleyin..."
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setPayoutDialogOpen(false);
                  setPayoutAmount('');
                  setPayoutNote('');
                }}
                className="flex-1"
                disabled={createPayoutMutation.isPending}
              >
                Iptal
              </Button>
              <Button
                onClick={handleSubmitPayout}
                disabled={createPayoutMutation.isPending || !payoutAmount}
                className="flex-1 gap-2"
              >
                {createPayoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Talep Olustur
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
