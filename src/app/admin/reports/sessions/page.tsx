'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Video,
  Users,
  Clock,
  Eye,
  Radio,
  MonitorPlay,
  UserCheck,
  Timer,
  Calendar,
} from 'lucide-react';

import {
  adminApi,
  type SessionReportDto,
  type SessionParticipantDto,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { StatCard } from '@/components/admin/stat-card';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return '-';
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}sa ${mins}dk`;
  if (mins > 0) return `${mins}dk ${secs}sn`;
  return `${secs}sn`;
}

function formatTimeDiff(joinedAt: string, leftAt: string | null): string {
  if (!leftAt) return 'Hala aktif';
  const join = new Date(joinedAt).getTime();
  const leave = new Date(leftAt).getTime();
  const diffSec = Math.floor((leave - join) / 1000);
  return formatDuration(diffSec);
}

// ---------------------------------------------------------------------------
// Filter Button
// ---------------------------------------------------------------------------

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const typeFilters = [
  { label: 'Tumu', value: '' },
  { label: '1:1 Ders', value: 'booking' },
  { label: 'Grup Dersi', value: 'group-class' },
];

const statusFilters = [
  { label: 'Tumu', value: '' },
  { label: 'Canli', value: 'Live' },
  { label: 'Tamamlandi', value: 'Ended' },
  { label: 'Planli', value: 'Scheduled' },
];

export default function AdminSessionReportsPage() {
  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Drawer
  const [selectedSession, setSelectedSession] = useState<SessionReportDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Debounce
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimer(timer);
  };

  // Query
  const { data: result, isLoading } = useQuery({
    queryKey: [
      'admin',
      'session-reports',
      { page, pageSize, type: typeFilter, status: statusFilter, search: debouncedSearch },
    ],
    queryFn: () =>
      adminApi.getSessionReports({
        page,
        pageSize,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const items = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;
  const totalPages = result?.totalPages ?? 0;

  // Stats
  const liveCount = items.filter((s) => s.sessionStatus === 'Live').length;
  const totalParticipants = items.reduce((sum, s) => sum + s.participantCount, 0);
  const avgDuration =
    items.length > 0
      ? Math.round(items.reduce((sum, s) => sum + s.totalDurationSec, 0) / items.length)
      : 0;

  // Columns
  const columns: Column<SessionReportDto>[] = [
    {
      key: 'type',
      label: 'Tur',
      render: (item) => (
        <Badge
          variant={item.resourceType === 'Booking' ? 'default' : 'secondary'}
          className={cn(
            'text-xs',
            item.resourceType === 'Booking'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
          )}
        >
          {item.resourceType === 'Booking' ? '1:1' : 'Grup'}
        </Badge>
      ),
    },
    {
      key: 'title',
      label: 'Baslik',
      render: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
            {item.title}
          </p>
          <p className="text-xs text-gray-500">{item.roomName}</p>
        </div>
      ),
    },
    {
      key: 'mentor',
      label: 'Mentor',
      render: (item) => <span className="text-sm text-gray-700">{item.mentorName}</span>,
    },
    {
      key: 'date',
      label: 'Planlanan Tarih',
      render: (item) => (
        <span className="text-sm text-gray-600">{formatDateTime(item.scheduledStart)}</span>
      ),
    },
    {
      key: 'participants',
      label: 'Katilimci',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium">{item.participantCount}</span>
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Toplam Sure',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {formatDuration(item.totalDurationSec)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.sessionStatus} size="sm" />,
    },
    {
      key: 'actions',
      label: '',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSession(item);
            setDrawerOpen(true);
          }}
          className="text-gray-400 hover:text-primary-600 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Oturum Raporlari</h1>
        <p className="text-gray-500 mt-1">
          1:1 ve grup derslerindeki video oturumlarini ve katilimci detaylarini goruntuleyin.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Toplam Oturum"
          value={totalCount.toString()}
          icon={<MonitorPlay className="w-5 h-5" />}
        />
        <StatCard
          title="Canli Oturum"
          value={liveCount.toString()}
          icon={<Radio className="w-5 h-5" />}
          variant={liveCount > 0 ? 'success' : 'default'}
        />
        <StatCard
          title="Ort. Sure"
          value={formatDuration(avgDuration)}
          icon={<Timer className="w-5 h-5" />}
        />
        <StatCard
          title="Toplam Katilimci"
          value={totalParticipants.toString()}
          icon={<UserCheck className="w-5 h-5" />}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Mentor veya ogrenci ara..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-500 self-center mr-2">Tur:</span>
          {typeFilters.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={typeFilter === f.value}
              onClick={() => {
                setTypeFilter(f.value);
                setPage(1);
              }}
            />
          ))}

          <span className="text-sm font-medium text-gray-500 self-center ml-4 mr-2">
            Durum:
          </span>
          {statusFilters.map((f) => (
            <FilterButton
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(item) => item.sessionId}
        onRowClick={(item) => {
          setSelectedSession(item);
          setDrawerOpen(true);
        }}
        emptyMessage="Oturum bulunamadi."
        emptyIcon={<Video className="w-12 h-12 text-gray-300" />}
        pagination={{
          page,
          pageSize,
          totalCount,
          totalPages,
          onPageChange: setPage,
        }}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSession(null);
        }}
        title="Oturum Detayi"
        width="lg"
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{selectedSession.title}</h3>
                <StatusBadge status={selectedSession.sessionStatus} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Tur:</span>{' '}
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs ml-1',
                      selectedSession.resourceType === 'Booking'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    )}
                  >
                    {selectedSession.resourceType === 'Booking' ? '1:1 Ders' : 'Grup Dersi'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Mentor:</span>{' '}
                  <span className="font-medium">{selectedSession.mentorName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Planlanan Baslangic:</span>{' '}
                  <span>{formatDateTime(selectedSession.scheduledStart)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Planlanan Bitis:</span>{' '}
                  <span>{formatDateTime(selectedSession.scheduledEnd)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Oda Adi:</span>{' '}
                  <span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                    {selectedSession.roomName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Olusturulma:</span>{' '}
                  <span>{formatDateTime(selectedSession.sessionCreatedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    <strong>{selectedSession.participantCount}</strong> katilimci
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    Toplam: <strong>{formatDuration(selectedSession.totalDurationSec)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Katilimcilar ({selectedSession.participants.length})
              </h4>

              {selectedSession.participants.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Katilimci kaydedilmemis</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSession.participants.map((p, idx) => (
                    <ParticipantCard
                      key={`${p.userId}-${idx}`}
                      participant={p}
                      sessionStart={selectedSession.scheduledStart}
                      sessionEnd={selectedSession.scheduledEnd}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Participant Card (segment-based)
// ---------------------------------------------------------------------------

function calcSegmentBar(
  segJoinedAt: string,
  segLeftAt: string | null,
  sessionStart: string | null,
  sessionEnd: string | null
) {
  let barLeft = 0;
  let barWidth = 100;

  if (sessionStart && sessionEnd) {
    const sStart = new Date(sessionStart).getTime();
    const sEnd = new Date(sessionEnd).getTime();
    const totalSpan = sEnd - sStart;

    if (totalSpan > 0) {
      const joinTime = new Date(segJoinedAt).getTime();
      const leaveTime = segLeftAt ? new Date(segLeftAt).getTime() : Date.now();

      barLeft = Math.max(0, Math.min(100, ((joinTime - sStart) / totalSpan) * 100));
      barWidth = Math.max(
        2,
        Math.min(100 - barLeft, ((leaveTime - joinTime) / totalSpan) * 100)
      );
    }
  }
  return { barLeft, barWidth };
}

function ParticipantCard({
  participant,
  sessionStart,
  sessionEnd,
}: {
  participant: SessionParticipantDto;
  sessionStart: string | null;
  sessionEnd: string | null;
}) {
  const segments = participant.segments ?? [];
  const hasMultipleSegments = segments.length > 1;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header: user info + total duration */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
              participant.role === 'Mentor' ? 'bg-blue-600' : 'bg-purple-600'
            )}
          >
            {participant.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{participant.displayName}</p>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px]',
                  participant.role === 'Mentor'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-purple-50 text-purple-600'
                )}
              >
                {participant.role === 'Mentor' ? 'Mentor' : 'Ogrenci'}
              </Badge>
              {hasMultipleSegments && (
                <span className="text-[10px] text-gray-400">
                  {segments.length} giris
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatDuration(participant.durationSec)}
          </p>
          <p className="text-xs text-gray-500">toplam sure</p>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-2">
        {segments.length > 0 ? (
          segments.map((seg, idx) => {
            const { barLeft, barWidth } = calcSegmentBar(
              seg.joinedAt,
              seg.leftAt,
              sessionStart,
              sessionEnd
            );
            return (
              <div key={seg.segmentId} className={cn(
                'rounded-md p-2',
                hasMultipleSegments ? 'bg-gray-50 border border-gray-100' : ''
              )}>
                {hasMultipleSegments && (
                  <p className="text-[10px] font-medium text-gray-400 mb-1">
                    {idx + 1}. Giris
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="truncate">Giris: {formatDateTime(seg.joinedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <span className="truncate">
                      Cikis: {seg.leftAt ? formatDateTime(seg.leftAt) : 'Aktif'}
                    </span>
                  </div>
                  <div className="text-right font-medium">
                    {formatDuration(seg.durationSec)}
                  </div>
                </div>
                {/* Timeline bar */}
                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'absolute h-full rounded-full',
                      participant.role === 'Mentor' ? 'bg-blue-400' : 'bg-purple-400',
                      !seg.leftAt && 'animate-pulse'
                    )}
                    style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          /* Fallback for old data without segments */
          <div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-green-500" />
                <span>Giris: {formatDateTime(participant.joinedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-red-500" />
                <span>
                  Cikis: {participant.leftAt ? formatDateTime(participant.leftAt) : 'Aktif'}
                </span>
              </div>
            </div>
            <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'absolute h-full rounded-full',
                  participant.role === 'Mentor' ? 'bg-blue-400' : 'bg-purple-400'
                )}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom timeline labels */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>Baslangic</span>
        <span>Bitis</span>
      </div>
    </div>
  );
}
