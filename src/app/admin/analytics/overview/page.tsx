'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  TrendingUp,
  CalendarCheck,
  UserPlus,
  BookOpen,
  GraduationCap,
  BarChart3,
  Star,
} from 'lucide-react';

import {
  adminApi,
  type AnalyticsOverviewDto,
  type TopMentorDto,
  type TopCourseDto,
} from '@/lib/api/admin';
import { StatCard } from '@/components/admin/stat-card';
import { DataTable, type Column } from '@/components/admin/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

// ---------------------------------------------------------------------------
// Weekly Registrations Bar Chart (CSS)
// ---------------------------------------------------------------------------

function WeeklyRegistrationsChart({ data }: { data: AnalyticsOverviewDto }) {
  const points = data.weeklyRegistrations ?? [];
  if (points.length === 0) return null;
  const maxValue = Math.max(...points.map((p) => p.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Haftalik Kayit Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-48 w-full overflow-x-auto pb-8 relative">
          {points.map((point, idx) => {
            const height = (point.count / maxValue) * 100;
            return (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 min-w-[24px] group relative"
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
                    className="w-full max-w-[20px] bg-primary-400 rounded-t-sm transition-all duration-300 hover:bg-primary-500"
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

export default function AnalyticsOverviewPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: () => adminApi.getAnalyticsOverview(),
  });

  const { data: topMentors = [], isLoading: mentorsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'top-mentors'],
    queryFn: () => adminApi.getTopMentors(),
  });

  const { data: topCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'top-courses'],
    queryFn: () => adminApi.getTopCourses(),
  });

  // Percent change for new registrations
  const thisMonth = overview?.newUsersThisMonth ?? 0;
  const lastMonth = overview?.newUsersLastMonth ?? 0;
  const regChangePercent =
    lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;

  // Top Mentors columns
  const mentorColumns: Column<TopMentorDto & { rank: number }>[] = [
    { key: 'rank', label: 'Sira', render: (m) => <span className="font-medium text-gray-500">#{m.rank}</span> },
    { key: 'mentorName', label: 'Isim', render: (m) => <span className="font-semibold text-gray-900">{m.mentorName}</span> },
    { key: 'totalEarned', label: 'Kazanc', render: (m) => formatCurrency(m.totalEarned) },
    { key: 'completedBookings', label: 'Ders', render: (m) => m.completedBookings },
    {
      key: 'averageRating',
      label: 'Puan',
      render: (m) =>
        m.averageRating != null ? (
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            {m.averageRating.toFixed(1)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  // Top Courses columns
  const courseColumns: Column<TopCourseDto & { rank: number }>[] = [
    { key: 'rank', label: 'Sira', render: (c) => <span className="font-medium text-gray-500">#{c.rank}</span> },
    { key: 'title', label: 'Kurs Adi', render: (c) => <span className="font-semibold text-gray-900">{c.title}</span> },
    { key: 'mentorName', label: 'Mentor' },
    { key: 'enrollmentCount', label: 'Kayit', render: (c) => c.enrollmentCount },
    { key: 'revenue', label: 'Gelir', render: (c) => formatCurrency(c.revenue) },
  ];

  const rankedMentors = topMentors.slice(0, 10).map((m, i) => ({ ...m, rank: i + 1 }));
  const rankedCourses = topCourses.slice(0, 10).map((c, i) => ({ ...c, rank: i + 1 }));

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Analitik — Genel Bakis</h1>
        </div>
        <p className="text-sm text-gray-500">
          Platform genelindeki istatistik ve trendler
        </p>
      </div>

      {/* Top row - 4 StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Toplam Kullanici"
          value={overviewLoading ? '...' : (overview?.totalUsers ?? 0).toLocaleString('tr-TR')}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Aktif Mentor"
          value={overviewLoading ? '...' : (overview?.totalMentors ?? 0).toLocaleString('tr-TR')}
          icon={<UserCheck className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Bu Ay Gelir"
          value={overviewLoading ? '...' : formatCurrency(overview?.thisMonthRevenue ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Toplam Rezervasyon"
          value={overviewLoading ? '...' : (overview?.totalBookings ?? 0).toLocaleString('tr-TR')}
          icon={<CalendarCheck className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Second row - 3 StatCards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Bu Ay Yeni Kayit"
          value={overviewLoading ? '...' : thisMonth.toLocaleString('tr-TR')}
          icon={<UserPlus className="h-5 w-5" />}
          trend={
            !overviewLoading && overview
              ? { value: regChangePercent, isPositive: regChangePercent >= 0 }
              : undefined
          }
          description={!overviewLoading ? `Gecen ay: ${lastMonth}` : undefined}
          variant="default"
        />
        <StatCard
          title="Kurs Kayitlari"
          value={overviewLoading ? '...' : (overview?.totalCourseEnrollments ?? 0).toLocaleString('tr-TR')}
          icon={<BookOpen className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Grup Dersi Kayitlari"
          value={overviewLoading ? '...' : (overview?.totalGroupClassEnrollments ?? 0).toLocaleString('tr-TR')}
          icon={<GraduationCap className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Weekly Registrations Chart */}
      {!overviewLoading && overview && (
        <div className="mb-6">
          <WeeklyRegistrationsChart data={overview} />
        </div>
      )}

      {/* Top 10 Mentors & Top 10 Courses side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Top 10 Mentorlar</h2>
          <DataTable
            columns={mentorColumns}
            data={rankedMentors}
            isLoading={mentorsLoading}
            getRowId={(m) => m.mentorUserId}
            emptyMessage="Henuz mentor verisi bulunamadi."
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Top 10 Kurslar</h2>
          <DataTable
            columns={courseColumns}
            data={rankedCourses}
            isLoading={coursesLoading}
            getRowId={(c) => c.courseId}
            emptyMessage="Henuz kurs verisi bulunamadi."
          />
        </div>
      </div>
    </div>
  );
}
