'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Check, X, Loader2, Search, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface AccrualDto {
  id: string;
  instructorUserId: string;
  instructorName: string;
  period: string;
  totalSessions: number;
  totalMinutes: number;
  grossAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

interface PerformanceSummaryDto {
  instructorUserId: string;
  instructorName: string;
  totalSessions: number;
  totalMinutes: number;
  averageRating: number;
  completionRate: number;
}

const ACCRUAL_STATUS: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700' },
  Approved: { label: 'Onaylandi', color: 'bg-green-100 text-green-700' },
  Paid: { label: 'Odendi', color: 'bg-blue-100 text-blue-700' },
  Cancelled: { label: 'Iptal', color: 'bg-red-100 text-red-700' },
};

export default function AdminInstructorPerformancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'accruals' | 'summary'>('accruals');
  const [statusFilter, setStatusFilter] = useState('Pending');

  const { data: accruals, isLoading: accrualsLoading } = useQuery({
    queryKey: ['admin', 'accruals', statusFilter],
    queryFn: () => apiClient.get<{ items: AccrualDto[] }>(`/admin/instructor-performance/accruals?status=${statusFilter}`),
    enabled: activeTab === 'accruals',
  });

  const { data: summaries, isLoading: summariesLoading } = useQuery({
    queryKey: ['admin', 'performance-summary'],
    queryFn: () => apiClient.get<PerformanceSummaryDto[]>('/admin/instructor-performance/summary'),
    enabled: activeTab === 'summary',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/instructor-performance/accruals/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accruals'] });
      toast.success('Hakedis onaylandi');
    },
    onError: () => toast.error('Onaylama basarisiz'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/instructor-performance/accruals/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accruals'] });
      toast.success('Hakedis iptal edildi');
    },
    onError: () => toast.error('Iptal basarisiz'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Egitmen Performans & Hakedis</h1>
        <p className="text-sm text-gray-500 mt-1">Egitmen performanslarini ve hakedislerini yonetin</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('accruals')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'accruals' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <DollarSign className="w-4 h-4 inline mr-1" /> Hakedisler
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'summary' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" /> Performans Ozeti
        </button>
      </div>

      {/* Accruals Tab */}
      {activeTab === 'accruals' && (
        <>
          <div className="flex gap-2">
            {['Pending', 'Approved', 'Paid', 'Cancelled'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  statusFilter === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {ACCRUAL_STATUS[s]?.label || s}
              </button>
            ))}
          </div>

          {accrualsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {(accruals?.items || []).length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Hakedis bulunamadi</p>
                </div>
              ) : (
                (accruals?.items || []).map((accrual: AccrualDto) => {
                  const statusInfo = ACCRUAL_STATUS[accrual.status] || { label: accrual.status, color: 'bg-gray-100 text-gray-500' };
                  return (
                    <Card key={accrual.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{accrual.instructorName}</h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span>{accrual.period}</span>
                              <span>{accrual.totalSessions} seans</span>
                              <span>{accrual.totalMinutes} dk</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-lg font-bold text-teal-600">{accrual.netAmount.toFixed(2)} TRY</p>
                              <p className="text-[10px] text-gray-400">Brut: {accrual.grossAmount.toFixed(2)}</p>
                            </div>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            {accrual.status === 'Pending' && (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => approveMutation.mutate(accrual.id)} disabled={approveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-xs">
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(accrual.id)} disabled={cancelMutation.isPending} className="text-red-600 border-red-200 text-xs">
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        summariesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(summaries || []).map((s: PerformanceSummaryDto) => (
              <Card key={s.instructorUserId}>
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-gray-900 mb-3">{s.instructorName}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-teal-600">{s.totalSessions}</p>
                      <p className="text-[10px] text-gray-500">Toplam Seans</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{Math.round(s.totalMinutes / 60)}s</p>
                      <p className="text-[10px] text-gray-500">Toplam Sure</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-600">{s.averageRating?.toFixed(1) || '-'}</p>
                      <p className="text-[10px] text-gray-500">Ort. Puan</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{(s.completionRate * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-gray-500">Tamamlanma</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(summaries || []).length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Performans verisi bulunamadi</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
