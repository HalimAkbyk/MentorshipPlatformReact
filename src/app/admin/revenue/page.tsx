'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  RotateCcw,
  BarChart3,
  Percent,
} from 'lucide-react';

import {
  adminApi,
  type RevenueChartDto,
  type RevenueBreakdownDto,
} from '@/lib/api/admin';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

// ---------------------------------------------------------------------------
// Period Tabs
// ---------------------------------------------------------------------------

type Period = 'daily' | 'weekly' | 'monthly';

const periodOptions: { label: string; value: Period; days: number }[] = [
  { label: 'Gunluk', value: 'daily', days: 30 },
  { label: 'Haftalik', value: 'weekly', days: 90 },
  { label: 'Aylik', value: 'monthly', days: 365 },
];

// ---------------------------------------------------------------------------
// Bar chart (CSS-based, no external library)
// ---------------------------------------------------------------------------

function RevenueBarChart({ data }: { data: RevenueChartDto }) {
  const points = data.points.slice(-30); // Show max 30 points
  const maxValue = Math.max(...points.map((p) => p.revenue), 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary-500" />
          <span className="text-gray-600">Gelir</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-400" />
          <span className="text-gray-600">Platform Komisyonu</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1 h-48 w-full overflow-x-auto pb-8 relative">
        {points.map((point, idx) => {
          const revenueHeight = (point.revenue / maxValue) * 100;
          const feeHeight = (point.platformFee / maxValue) * 100;

          return (
            <div
              key={idx}
              className="flex flex-col items-center flex-1 min-w-[24px] group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <p className="font-medium">{point.label}</p>
                  <p>Gelir: {formatCurrency(point.revenue)}</p>
                  <p>Komisyon: {formatCurrency(point.platformFee)}</p>
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
              </div>

              {/* Revenue bar */}
              <div className="w-full flex flex-col items-center gap-0 relative" style={{ height: '100%' }}>
                <div className="w-full flex items-end justify-center" style={{ height: '192px' }}>
                  <div className="relative w-full max-w-[20px]">
                    {/* Revenue */}
                    <div
                      className="w-full bg-primary-400 rounded-t-sm transition-all duration-300 hover:bg-primary-500"
                      style={{ height: `${Math.max(revenueHeight * 1.92, 2)}px` }}
                    />
                    {/* Fee overlay */}
                    <div
                      className="absolute bottom-0 w-full bg-amber-400 rounded-t-sm"
                      style={{ height: `${Math.max(feeHeight * 1.92, 0)}px` }}
                    />
                  </div>
                </div>
              </div>

              {/* Label */}
              <span className="text-[10px] text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap absolute -bottom-6 left-1/2">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary below chart */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Toplam Gelir: <span className="font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</span>
        </div>
        <div className="text-sm text-gray-600">
          Platform Komisyonu: <span className="font-bold text-amber-700">{formatCurrency(data.totalPlatformFee)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Breakdown
// ---------------------------------------------------------------------------

function RevenueBreakdownSection({ data }: { data: RevenueBreakdownDto }) {
  const total = data.totalRevenue || 1; // avoid division by zero
  const items = [
    {
      label: '1:1 Ders Geliri',
      value: data.bookingRevenue,
      pct: (data.bookingRevenue / total) * 100,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100',
    },
    {
      label: 'Grup Dersi Geliri',
      value: data.groupClassRevenue,
      pct: (data.groupClassRevenue / total) * 100,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100',
    },
    {
      label: 'Video Kurs Geliri',
      value: data.courseRevenue,
      pct: (data.courseRevenue / total) * 100,
      color: 'bg-teal-500',
      lightColor: 'bg-teal-100',
    },
  ];

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">{item.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">%{item.pct.toFixed(1)}</span>
              <span className="font-bold text-gray-900">{formatCurrency(item.value)}</span>
            </div>
          </div>
          <div className={cn('h-2.5 rounded-full w-full', item.lightColor)}>
            <div
              className={cn('h-full rounded-full transition-all duration-500', item.color)}
              style={{ width: `${Math.min(item.pct, 100)}%` }}
            />
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Toplam Gelir</span>
          <span className="font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-red-600">Toplam Iade</span>
          <span className="font-bold text-red-600">-{formatCurrency(data.totalRefunded)}</span>
        </div>
        <div className="flex items-center justify-between text-sm border-t pt-2">
          <span className="text-gray-900 font-semibold">Net Gelir</span>
          <span className="font-bold text-green-700 text-lg">{formatCurrency(data.netRevenue)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminRevenuePage() {
  const [period, setPeriod] = useState<Period>('daily');

  const currentPeriodOption = periodOptions.find((p) => p.value === period)!;

  // --- Query: Chart data ---
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['admin', 'revenue', 'chart', period],
    queryFn: () => adminApi.getRevenueChart({ period, days: currentPeriodOption.days }),
  });

  // --- Query: Breakdown data ---
  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ['admin', 'revenue', 'breakdown'],
    queryFn: () => adminApi.getRevenueBreakdown(),
  });

  // --- Render ---
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gelir Raporu</h1>
        </div>
        <p className="text-sm text-gray-500">
          Platform gelir, komisyon ve kaynak bazli dagilim
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Toplam Gelir"
          value={breakdownLoading ? '...' : formatCurrency(breakdownData?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Platform Komisyonu"
          value={chartLoading ? '...' : formatCurrency(chartData?.totalPlatformFee ?? 0)}
          icon={<Percent className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Toplam Iade"
          value={breakdownLoading ? '...' : formatCurrency(breakdownData?.totalRefunded ?? 0)}
          icon={<RotateCcw className="h-5 w-5" />}
          variant="danger"
        />
        <StatCard
          title="Net Gelir"
          value={breakdownLoading ? '...' : formatCurrency(breakdownData?.netRevenue ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart section - takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Gelir Trendi</CardTitle>
              {/* Period selector */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                      period === opt.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : chartData && chartData.points.length > 0 ? (
              <RevenueBarChart data={chartData} />
            ) : (
              <div className="text-center py-16 text-gray-500">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Henuz gelir verisi bulunamadi</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gelir Dagilimi</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : breakdownData ? (
              <RevenueBreakdownSection data={breakdownData} />
            ) : (
              <div className="text-center py-16 text-gray-500">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Veri bulunamadi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
