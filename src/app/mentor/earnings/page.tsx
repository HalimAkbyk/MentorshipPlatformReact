'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format';
import { earningsApi, type MentorTransactionDto } from '@/lib/api/earnings';

export default function EarningsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: () => earningsApi.getSummary(),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['earnings', 'transactions', page, typeFilter],
    queryFn: () => earningsApi.getTransactions({ page, pageSize: 15, type: typeFilter }),
  });

  const getDirectionIcon = (direction: string) => {
    if (direction === 'Credit') return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  };

  const getAccountBadge = (accountType: string) => {
    switch (accountType) {
      case 'MentorEscrow':
        return <Badge variant="secondary" className="text-xs">Emanet</Badge>;
      case 'MentorAvailable':
        return <Badge className="bg-green-100 text-green-700 text-xs">Kullanılabilir</Badge>;
      case 'MentorPayout':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Ödeme</Badge>;
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
        return <Badge variant="outline" className="text-xs border-red-300 text-red-700">İade</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Kazançlarım</h1>
          {summary && (
            <p className="text-sm text-gray-500 mt-1">
              Bu ay: <span className="font-semibold text-green-600">{formatCurrency(summary.thisMonthEarnings)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kazanç</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : formatCurrency(summary?.totalEarnings ?? 0)}
            </div>
            <p className="text-xs text-gray-600">Tüm zamanlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kullanılabilir Bakiye</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {summaryLoading ? '...' : formatCurrency(summary?.availableBalance ?? 0)}
            </div>
            <p className="text-xs text-gray-600">Çekilebilir</p>
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
            <p className="text-xs text-gray-600">Ders tamamlanınca aktifleşir</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İşlem Geçmişi</CardTitle>
              <CardDescription>Tüm kazanç ve ödeme hareketleri</CardDescription>
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
                <option value="">Tümü</option>
                <option value="Booking">Ders</option>
                <option value="Course">Kurs</option>
                <option value="Refund">İade</option>
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
                        <div className="text-sm font-medium">{tx.description ?? 'İşlem'}</div>
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
                    Toplam {transactions.totalCount} işlem
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
              <p>Henüz işlem geçmişiniz bulunmuyor</p>
              <p className="text-sm mt-1">Ders veya kurs satışları burada görünecek</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
