'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Database,
  Users,
  ShoppingCart,
  Clock,
  Server,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { adminApi, type SystemHealthInfoDto } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const envColors: Record<string, string> = {
  Development: 'bg-amber-100 text-amber-800',
  Staging: 'bg-blue-100 text-blue-800',
  Production: 'bg-green-100 text-green-800',
};

// ---------------------------------------------------------------------------
// Status Indicator
// ---------------------------------------------------------------------------

function StatusIndicator({ status }: { status: string }) {
  const isHealthy = status.toLowerCase() === 'healthy';

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            'h-5 w-5 rounded-full',
            isHealthy ? 'bg-green-500' : 'bg-red-500'
          )}
        />
        {isHealthy && (
          <div className="absolute inset-0 h-5 w-5 rounded-full bg-green-400 animate-ping opacity-50" />
        )}
      </div>
      <span className={cn('font-semibold text-lg', isHealthy ? 'text-green-700' : 'text-red-700')}>
        {status}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Health Card
// ---------------------------------------------------------------------------

function HealthCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-gray-100 p-3 text-gray-600">{icon}</div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SystemHealthPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => adminApi.getSystemHealthInfo(),
    refetchInterval: 30000,
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Sistem Sagligi</h1>
          </div>
          <p className="text-sm text-gray-500">
            Her 30 saniyede otomatik guncellenir
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn('h-4 w-4 mr-1.5', isFetching && 'animate-spin')} />
          Yenile
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : data ? (
        <>
          {/* Status cards - 2x2 grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <HealthCard title="Genel Durum" icon={<Activity className="h-5 w-5" />}>
              <StatusIndicator status={data.status} />
            </HealthCard>

            <HealthCard title="Veritabani" icon={<Database className="h-5 w-5" />}>
              <StatusIndicator status={data.databaseStatus} />
            </HealthCard>

            <HealthCard title="Toplam Kullanici" icon={<Users className="h-5 w-5" />}>
              <p className="text-3xl font-bold text-gray-900">
                {data.totalUsers.toLocaleString('tr-TR')}
              </p>
            </HealthCard>

            <HealthCard title="Toplam Siparis" icon={<ShoppingCart className="h-5 w-5" />}>
              <p className="text-3xl font-bold text-gray-900">
                {data.totalOrders.toLocaleString('tr-TR')}
              </p>
            </HealthCard>
          </div>

          {/* Server info row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Server Time */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Sunucu Zamani</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatDateTime(data.serverTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environment */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Ortam</p>
                    <span
                      className={cn(
                        'inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold',
                        envColors[data.environment] || 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {data.environment}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Sistem bilgisi alinamadi</p>
        </div>
      )}
    </div>
  );
}
