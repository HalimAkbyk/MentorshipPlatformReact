'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  RotateCcw,
  TrendingUp,
  ShoppingCart,
  Percent,
  Wallet,
  BarChart3,
  Loader2,
} from 'lucide-react';

import { adminApi, type FinancialAnalyticsDto } from '@/lib/api/admin';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

const typeLabels: Record<string, string> = {
  Booking: '1:1 Ders',
  Course: 'Video Kurs',
  GroupClass: 'Grup Dersi',
};

const typeColors: Record<string, { bar: string; bg: string }> = {
  Booking: { bar: 'bg-blue-500', bg: 'bg-blue-100' },
  Course: { bar: 'bg-teal-500', bg: 'bg-teal-100' },
  GroupClass: { bar: 'bg-purple-500', bg: 'bg-purple-100' },
};

// ---------------------------------------------------------------------------
// Revenue By Type section
// ---------------------------------------------------------------------------

function RevenueByTypeSection({ data }: { data: FinancialAnalyticsDto }) {
  const entries = Object.entries(data.revenueByType);
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kaynak Bazli Gelir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {entries.map(([key, value]) => {
            const pct = (value / total) * 100;
            const label = typeLabels[key] || key;
            const color = typeColors[key] || { bar: 'bg-gray-500', bg: 'bg-gray-100' };

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">%{pct.toFixed(1)}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(value)}</span>
                  </div>
                </div>
                <div className={cn('h-2.5 rounded-full w-full', color.bg)}>
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', color.bar)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Veri bulunamadi</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Monthly Revenue/Refund Chart (CSS bars, dual color)
// ---------------------------------------------------------------------------

function MonthlyRevenueChart({ data }: { data: FinancialAnalyticsDto }) {
  const points = data.monthlyRevenue ?? [];
  if (points.length === 0) return null;
  const maxValue = Math.max(...points.map((p) => Math.max(p.revenue, p.refunded)), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Aylik Gelir ve Iade</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-gray-600">Gelir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-400" />
              <span className="text-gray-600">Iade</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-48 w-full overflow-x-auto pb-8 relative">
          {points.map((point, idx) => {
            const revenueHeight = (point.revenue / maxValue) * 100;
            const refundHeight = (point.refunded / maxValue) * 100;

            return (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 min-w-[40px] group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-medium">{point.month}</p>
                    <p>Gelir: {formatCurrency(point.revenue)}</p>
                    <p>Iade: {formatCurrency(point.refunded)}</p>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                </div>
                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-[2px]" style={{ height: '192px' }}>
                  <div
                    className="w-1/2 max-w-[14px] bg-green-400 rounded-t-sm transition-all duration-300 hover:bg-green-500"
                    style={{ height: `${Math.max(revenueHeight * 1.92, 2)}px` }}
                  />
                  <div
                    className="w-1/2 max-w-[14px] bg-red-300 rounded-t-sm transition-all duration-300 hover:bg-red-400"
                    style={{ height: `${Math.max(refundHeight * 1.92, 2)}px` }}
                  />
                </div>
                {/* Label */}
                <span className="text-[10px] text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap absolute -bottom-6 left-1/2">
                  {point.month}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function FinancialAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'financial'],
    queryFn: () => adminApi.getFinancialAnalytics(),
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Finansal Raporlar</h1>
        </div>
        <p className="text-sm text-gray-500">
          Gelir, iade ve komisyon analizleri
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : data ? (
        <>
          {/* Top row - 4 StatCards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Toplam Gelir"
              value={formatCurrency(data.totalRevenue)}
              icon={<DollarSign className="h-5 w-5" />}
              variant="default"
            />
            <StatCard
              title="Toplam Iade"
              value={formatCurrency(data.totalRefunded)}
              icon={<RotateCcw className="h-5 w-5" />}
              variant="danger"
            />
            <StatCard
              title="Net Gelir"
              value={formatCurrency(data.netRevenue)}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              title="Ortalama Siparis"
              value={formatCurrency(data.averageOrderAmount)}
              icon={<ShoppingCart className="h-5 w-5" />}
              variant="default"
            />
          </div>

          {/* Middle row - 2 StatCards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              title="Platform Komisyonu"
              value={formatCurrency(data.platformCommission)}
              icon={<Percent className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              title="Mentor Odemeleri"
              value={formatCurrency(data.mentorPayouts)}
              icon={<Wallet className="h-5 w-5" />}
              variant="success"
            />
          </div>

          {/* Revenue by Type + Monthly Chart */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <RevenueByTypeSection data={data} />
            <div className="lg:col-span-2">
              <MonthlyRevenueChart data={data} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Veri bulunamadi</p>
        </div>
      )}
    </div>
  );
}
