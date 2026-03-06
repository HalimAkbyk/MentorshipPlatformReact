'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  Users,
  PlayCircle,
  Clock,
  UserCheck,
  Coins,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { instructorPerformanceApi, type PerformanceSummaryDto, type AccrualDto } from '@/lib/api/instructor-performance';
import { FeatureGate } from '@/components/feature-gate';
import { useFeatureFlag } from '@/lib/hooks/use-feature-flags';

function PerformanceContent() {
  const [accrualPage, setAccrualPage] = useState(1);
  const showAccruals = useFeatureFlag('INSTRUCTOR_ACCRUAL_SELF_VIEW');

  const { data: summaries, isLoading: summaryLoading } = useQuery({
    queryKey: ['instructor', 'performance', 'summary'],
    queryFn: () => instructorPerformanceApi.getMySummary(),
  });

  const { data: accruals, isLoading: accrualsLoading } = useQuery({
    queryKey: ['instructor', 'performance', 'accruals', accrualPage],
    queryFn: () => instructorPerformanceApi.getMyAccruals({ page: accrualPage, pageSize: 10 }),
    enabled: showAccruals,
  });

  // Use the latest summary for cards
  const latest = summaries && summaries.length > 0 ? summaries[0] : null;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} dk`;
    if (mins === 0) return `${hours} saat`;
    return `${hours} saat ${mins} dk`;
  };

  const getAccrualStatusBadge = (status: string) => {
    const cls = 'text-[10px] px-1.5 py-0';
    switch (status) {
      case 'Pending':
        return <Badge className={`bg-amber-100 text-amber-700 ${cls}`}><AlertCircle className="w-3 h-3 mr-0.5" />Beklemede</Badge>;
      case 'Approved':
        return <Badge className={`bg-green-100 text-green-700 ${cls}`}><CheckCircle2 className="w-3 h-3 mr-0.5" />Onaylandi</Badge>;
      case 'Paid':
        return <Badge className={`bg-blue-100 text-blue-700 ${cls}`}><Coins className="w-3 h-3 mr-0.5" />Odendi</Badge>;
      case 'Cancelled':
        return <Badge className={`bg-red-100 text-red-700 ${cls}`}><XCircle className="w-3 h-3 mr-0.5" />Iptal</Badge>;
      default:
        return <Badge variant="outline" className={cls}>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Performansim</h1>
          <p className="text-xs text-gray-500">Ders ve icerik performans ozetiniz</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-teal-50 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <span className="text-xs text-gray-500">Bire Bir Dersler</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {summaryLoading ? '...' : latest?.totalPrivateLessons ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Grup Dersleri</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {summaryLoading ? '...' : latest?.totalGroupLessons ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center">
                <PlayCircle className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">Video Izlenmeleri</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {summaryLoading ? '...' : latest?.totalVideoViews ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">Canli Ders Suresi</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {summaryLoading ? '...' : formatDuration(latest?.totalLiveDurationMinutes ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-green-50 flex items-center justify-center">
                <UserCheck className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Ogrenci Sayisi</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {summaryLoading ? '...' : latest?.totalStudentsServed ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-xs text-gray-500">Kredi Tuketen</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {summaryLoading ? '...' : latest?.totalCreditsConsumed ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accrual History */}
      {showAccruals && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Hakedis Gecmisi</CardTitle>
            <CardDescription className="text-xs">Aylik hakedis hesaplamalari</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {accrualsLoading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
              </div>
            ) : accruals && accruals.items.length > 0 ? (
              <>
                <div className="space-y-2">
                  {accruals.items.map((accrual: AccrualDto) => (
                    <div
                      key={accrual.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium">
                            {formatDate(accrual.periodStart, 'MMM yyyy')}
                          </span>
                          {getAccrualStatusBadge(accrual.status)}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span>{accrual.privateLessonCount} bire bir</span>
                          <span>{accrual.groupLessonCount} grup</span>
                          <span>{accrual.videoContentCount} video</span>
                          {accrual.bonusAmount > 0 && (
                            <span className="text-green-600">+{formatCurrency(accrual.bonusAmount)} bonus</span>
                          )}
                        </div>
                        {accrual.notes && (
                          <div className="text-[10px] text-gray-400 mt-0.5">{accrual.notes}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(accrual.totalAccrual)}
                        </div>
                        {accrual.paidAt && (
                          <div className="text-[10px] text-green-600">
                            Odeme: {formatDate(accrual.paidAt, 'd MMM yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {accruals.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Toplam {accruals.totalCount} kayit
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={accrualPage <= 1}
                        onClick={() => setAccrualPage((p) => p - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-gray-600">
                        {accrualPage} / {accruals.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={accrualPage >= accruals.totalPages}
                        onClick={() => setAccrualPage((p) => p + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">Henuz hakedis kaydi bulunmuyor</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function InstructorPerformancePage() {
  return (
    <FeatureGate flag="INSTRUCTOR_PERFORMANCE_SELF_VIEW" fallbackMessage="Performans goruntulemesi gecici olarak devre disi birakilmistir.">
      <PerformanceContent />
    </FeatureGate>
  );
}
