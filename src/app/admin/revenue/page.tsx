'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { adminApi, type PlatformTransactionDto } from '@/lib/api/admin';

export default function AdminRevenuePage() {
  const [page, setPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState<string | undefined>(undefined);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin', 'revenue', 'summary'],
    queryFn: () => adminApi.getRevenueSummary(),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['admin', 'revenue', 'transactions', page, accountFilter],
    queryFn: () => adminApi.getRevenueTransactions({ page, pageSize: 20, accountType: accountFilter }),
  });

  const getAccountBadge = (type: string) => {
    switch (type) {
      case 'Platform':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Platform</Badge>;
      case 'MentorEscrow':
        return <Badge variant="secondary" className="text-xs">Mentor Emanet</Badge>;
      case 'MentorAvailable':
        return <Badge className="bg-green-100 text-green-700 text-xs">Mentor Bakiye</Badge>;
      case 'MentorPayout':
        return <Badge className="bg-purple-100 text-purple-700 text-xs">Mentor Ödeme</Badge>;
      case 'StudentRefund':
        return <Badge className="bg-red-100 text-red-700 text-xs">Öğrenci İade</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading">Gelir Raporu</h1>
        <p className="text-sm text-gray-500 mt-1">Platform gelir, gider ve finansal özet</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {summaryLoading ? '...' : formatCurrency(summary?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-gray-600">Platform komisyonu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {summaryLoading ? '...' : formatCurrency(summary?.netRevenue ?? 0)}
            </div>
            <p className="text-xs text-gray-600">İadeler düşüldükten sonra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : formatCurrency(summary?.thisMonthRevenue ?? 0)}
            </div>
            <p className="text-xs text-gray-600">
              Geçen ay: {summaryLoading ? '...' : formatCurrency(summary?.lastMonthRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İade</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryLoading ? '...' : formatCurrency(summary?.totalRefundsIssued ?? 0)}
            </div>
            <p className="text-xs text-gray-600">{summary?.totalRefunds ?? 0} iade işlemi</p>
          </CardContent>
        </Card>
      </div>

      {/* Volume stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Brüt İşlem Hacmi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {summaryLoading ? '...' : formatCurrency(summary?.totalGrossVolume ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Toplam Siparis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{summaryLoading ? '...' : summary?.totalOrders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mentor Kazançları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {summaryLoading ? '...' : formatCurrency(summary?.totalMentorEarnings ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Muhasebe Kayıtları</CardTitle>
              <CardDescription>Tüm ledger hareketleri</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="text-sm border rounded-md px-2 py-1 bg-white"
                value={accountFilter ?? ''}
                onChange={(e) => {
                  setAccountFilter(e.target.value || undefined);
                  setPage(1);
                }}
              >
                <option value="">Tümü</option>
                <option value="Platform">Platform</option>
                <option value="MentorEscrow">Mentor Emanet</option>
                <option value="MentorAvailable">Mentor Bakiye</option>
                <option value="MentorPayout">Mentor Ödeme</option>
                <option value="StudentRefund">Öğrenci İade</option>
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
              <div className="space-y-2">
                {transactions.items.map((tx: PlatformTransactionDto) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {tx.direction === 'Credit' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {getAccountBadge(tx.accountType)}
                          <span className="text-xs text-gray-500">{tx.referenceType}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {tx.accountOwnerName && <span>{tx.accountOwnerName} - </span>}
                          {new Date(tx.createdAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        tx.direction === 'Credit' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {tx.direction === 'Credit' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>

              {transactions.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    Toplam {transactions.totalCount} kayit
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
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Henüz muhasebe kaydı bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
