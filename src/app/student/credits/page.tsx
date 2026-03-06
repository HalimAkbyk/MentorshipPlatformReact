'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Coins,
  BookOpen,
  Users,
  PlayCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { packagesApi, type StudentCreditDto, type CreditTransactionDto } from '@/lib/api/packages';

const creditTypeLabels: Record<string, string> = {
  PrivateLesson: 'Bire Bir Ders',
  GroupLesson: 'Grup Dersi',
  VideoAccess: 'Video Erişimi',
};

const creditTypeIcons: Record<string, React.ReactNode> = {
  PrivateLesson: <BookOpen className="w-5 h-5 text-teal-600" />,
  GroupLesson: <Users className="w-5 h-5 text-blue-600" />,
  VideoAccess: <PlayCircle className="w-5 h-5 text-purple-600" />,
};

const creditTypeColors: Record<string, string> = {
  PrivateLesson: 'bg-teal-50',
  GroupLesson: 'bg-blue-50',
  VideoAccess: 'bg-purple-50',
};

export default function StudentCreditsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ['student', 'credits'],
    queryFn: () => packagesApi.getMyCredits(),
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['student', 'credit-transactions', page, typeFilter],
    queryFn: () => packagesApi.getMyCreditTransactions({ page, pageSize: 15, creditType: typeFilter }),
  });

  const getTransactionIcon = (type: string) => {
    if (type === 'Purchase' || type === 'Grant') return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  };

  const getTransactionBadge = (type: string) => {
    const cls = 'text-[10px] px-1.5 py-0';
    switch (type) {
      case 'Purchase':
        return <Badge className={`bg-green-100 text-green-700 ${cls}`}>Satin Alma</Badge>;
      case 'Grant':
        return <Badge className={`bg-blue-100 text-blue-700 ${cls}`}>Hediye</Badge>;
      case 'Usage':
        return <Badge className={`bg-amber-100 text-amber-700 ${cls}`}>Kullanim</Badge>;
      case 'Expiry':
        return <Badge className={`bg-red-100 text-red-700 ${cls}`}>Sure Doldu</Badge>;
      case 'Refund':
        return <Badge className={`bg-gray-100 text-gray-600 ${cls}`}>Iade</Badge>;
      default:
        return <Badge variant="outline" className={cls}>{type}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
            <Coins className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Kredilerim</h1>
            <p className="text-xs text-gray-500">Kredi bakiyeniz ve kullanim gecmisiniz</p>
          </div>
        </div>
        <Link href="/public/packages">
          <Button size="sm" className="gap-1.5 text-xs">
            <Package className="w-3.5 h-3.5" />
            Paket Satin Al
          </Button>
        </Link>
      </div>

      {/* Credit Balance Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        {creditsLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-100 rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : credits && credits.length > 0 ? (
          credits.map((credit: StudentCreditDto) => (
            <Card key={credit.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${creditTypeColors[credit.creditType] || 'bg-gray-50'} flex items-center justify-center`}>
                      {creditTypeIcons[credit.creditType] || <Coins className="w-5 h-5 text-gray-600" />}
                    </div>
                    <span className="text-xs text-gray-500">
                      {creditTypeLabels[credit.creditType] || credit.creditType}
                    </span>
                  </div>
                  {credit.packageName && (
                    <Badge variant="outline" className="text-[10px]">{credit.packageName}</Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {credit.remainingCredits}
                  <span className="text-sm font-normal text-gray-400 ml-1">/ {credit.totalCredits}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${credit.totalCredits > 0 ? (credit.remainingCredits / credit.totalCredits) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-400">
                    {credit.usedCredits} kullanildi
                  </span>
                  {credit.expiresAt && (
                    <span className="text-[10px] text-amber-600">
                      Son: {formatDate(credit.expiresAt, 'd MMM yyyy')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-6 h-6 text-teal-300" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Henuz krediniz yok</h3>
                <p className="text-xs text-gray-500 mb-4">Bir paket satin alarak kredi kazanabilirsiniz</p>
                <Link href="/public/packages">
                  <Button size="sm" className="text-xs">Paketleri Incele</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Credit Transactions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Kredi Hareketleri</CardTitle>
              <CardDescription className="text-xs">Tum kredi kullanim ve kazanim islemleri</CardDescription>
            </div>
            <select
              className="text-xs border rounded-lg px-2 py-1.5 bg-white text-gray-600"
              value={typeFilter ?? ''}
              onChange={(e) => {
                setTypeFilter(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">Tumu</option>
              <option value="PrivateLesson">Bire Bir Ders</option>
              <option value="GroupLesson">Grup Dersi</option>
              <option value="VideoAccess">Video Erisimi</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {txLoading ? (
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
          ) : transactions && transactions.items.length > 0 ? (
            <>
              <div className="space-y-2">
                {transactions.items.map((tx: CreditTransactionDto) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getTransactionIcon(tx.transactionType)}
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {tx.description || creditTypeLabels[tx.relatedEntityType || ''] || 'Islem'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getTransactionBadge(tx.transactionType)}
                          {tx.instructorName && (
                            <span className="text-[10px] text-gray-400">Egitmen: {tx.instructorName}</span>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {formatDate(tx.createdAt, 'd MMM yyyy HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      tx.transactionType === 'Purchase' || tx.transactionType === 'Grant' || tx.transactionType === 'Refund'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}>
                      {tx.transactionType === 'Purchase' || tx.transactionType === 'Grant' || tx.transactionType === 'Refund' ? '+' : '-'}
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </div>

              {transactions.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    Toplam {transactions.totalCount} islem
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-gray-600">
                      {page} / {transactions.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= transactions.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6 text-teal-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Henuz kredi hareketi yok</h3>
              <p className="text-xs text-gray-500">Kredi kazandiginizda veya kullandiginizda burada gorunecek</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
