'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  DollarSign,
  AlertCircle,
  Shield,
  ArrowRight,
  BadgeCheck,
  RotateCcw,
  AlertTriangle,
  UserCog,
  ShoppingCart,
  Settings,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { adminApi, type RecentActivityDto } from '@/lib/api/admin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function StatCardSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-20 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-xl" />
      </div>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-48 animate-pulse">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-100 rounded-t"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStatusSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-10 w-12 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bar chart component (pure CSS + divs, no external library)
// ---------------------------------------------------------------------------

interface BarChartProps {
  data: { date: string; value: number }[];
  color: 'green' | 'blue';
  formatValue?: (v: number) => string;
}

function SimpleBarChart({ data, color, formatValue }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barColor = color === 'green' ? 'bg-green-500' : 'bg-blue-500';
  const barHoverColor = color === 'green' ? 'hover:bg-green-600' : 'hover:bg-blue-600';

  return (
    <div className="flex flex-col gap-2">
      {/* Chart area */}
      <div className="flex items-end gap-1.5 h-48">
        {data.map((item, idx) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {formatValue ? formatValue(item.value) : item.value}
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-300 ${barColor} ${barHoverColor}`}
                style={{
                  height: `${Math.max(heightPercent, 2)}%`,
                  minHeight: item.value > 0 ? '4px' : '2px',
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex gap-1.5">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="flex-1 text-center text-[10px] text-gray-400 truncate"
          >
            {formatShortDate(item.date)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick status card
// ---------------------------------------------------------------------------

interface QuickStatusCardProps {
  title: string;
  count: number;
  href: string;
  icon: React.ReactNode;
  color: string;
}

function QuickStatusCard({ title, count, href, icon, color }: QuickStatusCardProps) {
  return (
    <Card className="p-6 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className="text-4xl font-bold text-gray-900 mb-4">{count}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        Goruntule <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quick action button
// ---------------------------------------------------------------------------

interface QuickActionProps {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function QuickAction({ label, href, icon }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all cursor-pointer group">
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-primary-100 transition-colors text-gray-500 group-hover:text-primary-600">
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-600 group-hover:text-primary-700 text-center">
          {label}
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Activity table columns
// ---------------------------------------------------------------------------

const activityColumns: Column<RecentActivityDto>[] = [
  {
    key: 'createdAt',
    label: 'Tarih',
    className: 'whitespace-nowrap',
    render: (item) => (
      <span className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</span>
    ),
  },
  {
    key: 'action',
    label: 'Islem',
    render: (item) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {item.action}
      </span>
    ),
  },
  {
    key: 'description',
    label: 'Aciklama',
    render: (item) => (
      <span className="text-sm text-gray-700 line-clamp-1">{item.description}</span>
    ),
  },
  {
    key: 'performedBy',
    label: 'Kullanici',
    render: (item) => (
      <span className="text-sm text-gray-600">{item.performedBy}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
    refetchInterval: 60_000, // auto-refresh every 60 seconds
  });

  // ------ Error state ------
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400" />
            <h2 className="text-lg font-semibold text-gray-800">
              Dashboard verileri yuklenirken hata olustu
            </h2>
            <p className="text-sm text-gray-500 max-w-md">
              {(error as Error)?.message || 'Bilinmeyen bir hata olustu. Lutfen daha sonra tekrar deneyin.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // ------ Loading state ------
  if (isLoading || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <Link href="/public">
            <Button variant="ghost">Siteye Don</Button>
          </Link>
        </div>

        {/* KPI row skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts row skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>

        {/* Quick status skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <QuickStatusSkeleton key={i} />
          ))}
        </div>

        {/* Bottom row skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <DataTable columns={activityColumns} data={[]} isLoading />
              </CardContent>
            </Card>
          </div>
          <Card className="p-6 animate-pulse">
            <div className="h-5 w-24 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ------ Data loaded ------
  const pendingTotal =
    dashboard.pendingVerifications +
    dashboard.pendingRefunds +
    dashboard.activeDisputes;

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <Link href="/public">
          <Button variant="ghost">Siteye Don</Button>
        </Link>
      </div>

      {/* ====== KPI Row ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Toplam Kullanici"
          value={dashboard.totalUsers.toLocaleString('tr-TR')}
          icon={<Users className="h-6 w-6" />}
          variant="default"
          description={`Bu hafta +${dashboard.newUsersThisWeek}`}
        />
        <StatCard
          title="Aktif Mentor"
          value={dashboard.totalMentors.toLocaleString('tr-TR')}
          icon={<GraduationCap className="h-6 w-6" />}
          variant="success"
          description={`${dashboard.totalStudents} ogrenci`}
        />
        <StatCard
          title="Bu Ay Gelir"
          value={formatCurrency(dashboard.thisMonthRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          variant="success"
          trend={{
            value: dashboard.revenueChangePercent,
            isPositive: dashboard.revenueChangePercent >= 0,
          }}
          description={`Gecen ay: ${formatCurrency(dashboard.lastMonthRevenue)}`}
        />
        <StatCard
          title="Bekleyen Islem"
          value={pendingTotal}
          icon={<AlertCircle className="h-6 w-6" />}
          variant="warning"
          description={`${dashboard.pendingVerifications} onay, ${dashboard.pendingRefunds} iade, ${dashboard.activeDisputes} ihtilaf`}
        />
      </div>

      {/* ====== Charts Row ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Haftalik Kayit Trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.weeklyRegistrations.length > 0 ? (
              <SimpleBarChart
                data={dashboard.weeklyRegistrations}
                color="green"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                Veri bulunamadi
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Gunluk Gelir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.dailyRevenue.length > 0 ? (
              <SimpleBarChart
                data={dashboard.dailyRevenue}
                color="blue"
                formatValue={(v) => formatCurrency(v)}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                Veri bulunamadi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ====== Quick Status Row ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <QuickStatusCard
          title="Bekleyen Onaylar"
          count={dashboard.pendingVerifications}
          href="/admin/verifications"
          icon={<BadgeCheck className="h-5 w-5 text-amber-600" />}
          color="bg-amber-50"
        />
        <QuickStatusCard
          title="Bekleyen Iadeler"
          count={dashboard.pendingRefunds}
          href="/admin/refunds"
          icon={<RotateCcw className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <QuickStatusCard
          title="Aktif Ihtilaflar"
          count={dashboard.activeDisputes}
          href="/admin/disputes"
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* ====== Bottom Row ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activities table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                Son Islemler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={activityColumns}
                data={dashboard.recentActivities}
                emptyMessage="Henuz islem bulunmuyor."
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick access grid */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Hizli Erisim</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              label="Kullanicilar"
              href="/admin/users"
              icon={<UserCog className="h-5 w-5" />}
            />
            <QuickAction
              label="Iadeler"
              href="/admin/refunds"
              icon={<RotateCcw className="h-5 w-5" />}
            />
            <QuickAction
              label="Siparisler"
              href="/admin/orders"
              icon={<ShoppingCart className="h-5 w-5" />}
            />
            <QuickAction
              label="Ayarlar"
              href="/admin/settings/general"
              icon={<Settings className="h-5 w-5" />}
            />
            <QuickAction
              label="Analitik"
              href="/admin/analytics/overview"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <QuickAction
              label="Sistem"
              href="/admin/system/health"
              icon={<Activity className="h-5 w-5" />}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
