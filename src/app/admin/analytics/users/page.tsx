'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserX,
  BarChart3,
  Loader2,
} from 'lucide-react';

import { adminApi, type UserAnalyticsDto } from '@/lib/api/admin';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const roleLabels: Record<string, string> = {
  Mentor: 'Mentor',
  Student: 'Ogrenci',
  Admin: 'Admin',
};

const roleColors: Record<string, { bar: string; bg: string }> = {
  Mentor: { bar: 'bg-blue-500', bg: 'bg-blue-100' },
  Student: { bar: 'bg-purple-500', bg: 'bg-purple-100' },
  Admin: { bar: 'bg-amber-500', bg: 'bg-amber-100' },
};

const providerLabels: Record<string, string> = {
  Email: 'E-posta',
  Google: 'Google',
  GitHub: 'GitHub',
  email: 'E-posta',
  google: 'Google',
  github: 'GitHub',
};

const providerColors: Record<string, { bar: string; bg: string }> = {
  Email: { bar: 'bg-gray-600', bg: 'bg-gray-100' },
  email: { bar: 'bg-gray-600', bg: 'bg-gray-100' },
  Google: { bar: 'bg-red-500', bg: 'bg-red-100' },
  google: { bar: 'bg-red-500', bg: 'bg-red-100' },
  GitHub: { bar: 'bg-gray-900', bg: 'bg-gray-200' },
  github: { bar: 'bg-gray-900', bg: 'bg-gray-200' },
};

// ---------------------------------------------------------------------------
// Distribution Section
// ---------------------------------------------------------------------------

function DistributionSection({
  title,
  distribution,
  labels,
  colors,
}: {
  title: string;
  distribution: Record<string, number>;
  labels: Record<string, string>;
  colors: Record<string, { bar: string; bg: string }>;
}) {
  const entries = Object.entries(distribution);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {entries.map(([key, count]) => {
            const pct = (count / total) * 100;
            const label = labels[key] || key;
            const color = colors[key] || { bar: 'bg-gray-500', bg: 'bg-gray-100' };

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">%{pct.toFixed(1)}</span>
                    <span className="font-bold text-gray-900">{count.toLocaleString('tr-TR')}</span>
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
// Monthly Registrations Chart (CSS bars)
// ---------------------------------------------------------------------------

function MonthlyRegistrationsChart({ data }: { data: UserAnalyticsDto }) {
  const points = data.monthlyRegistrations ?? [];
  if (points.length === 0) return null;
  const maxValue = Math.max(...points.map((p) => p.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aylik Kayit Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-48 w-full overflow-x-auto pb-8 relative">
          {points.map((point, idx) => {
            const height = (point.count / maxValue) * 100;
            return (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 min-w-[32px] group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-medium">{point.week}</p>
                    <p>{point.count} kayit</p>
                  </div>
                  <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                </div>
                {/* Bar */}
                <div className="w-full flex items-end justify-center" style={{ height: '192px' }}>
                  <div
                    className="w-full max-w-[24px] bg-purple-400 rounded-t-sm transition-all duration-300 hover:bg-purple-500"
                    style={{ height: `${Math.max(height * 1.92, 2)}px` }}
                  />
                </div>
                {/* Label */}
                <span className="text-[10px] text-gray-400 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap absolute -bottom-6 left-1/2">
                  {point.week}
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

export default function UserAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'users'],
    queryFn: () => adminApi.getUserAnalytics(),
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Kullanici Analitik</h1>
        </div>
        <p className="text-sm text-gray-500">
          Kullanici kayit, rol ve saglayici dagilimi
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : data ? (
        <>
          {/* Top row - 3 StatCards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Toplam Kullanici"
              value={data.totalUsers.toLocaleString('tr-TR')}
              icon={<Users className="h-5 w-5" />}
              variant="default"
            />
            <StatCard
              title="Aktif"
              value={data.activeUsers.toLocaleString('tr-TR')}
              icon={<UserCheck className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              title="Askiya Alinan"
              value={data.suspendedUsers.toLocaleString('tr-TR')}
              icon={<UserX className="h-5 w-5" />}
              variant="danger"
            />
          </div>

          {/* Distributions side by side */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <DistributionSection
              title="Rol Dagilimi"
              distribution={data.roleDistribution}
              labels={roleLabels}
              colors={roleColors}
            />
            <DistributionSection
              title="Saglayici Dagilimi"
              distribution={data.providerDistribution}
              labels={providerLabels}
              colors={providerColors}
            />
          </div>

          {/* Monthly Chart */}
          <MonthlyRegistrationsChart data={data} />
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
