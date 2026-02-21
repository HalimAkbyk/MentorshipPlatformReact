'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Users,
  Clock,
  Activity,
  Calendar,
  User,
  X,
  Loader2,
  Eye,
} from 'lucide-react';

import {
  adminApi,
  type AuditLogDto,
  type PagedResult,
  type AuditSessionSummaryDto,
  type AuditSessionDetailDto,
  type AuditUserSummaryDto,
  type AuditUserDetailDto,
} from '@/lib/api/admin';
import { localizeEntityType, localizeAction, localizeRole } from '@/lib/utils/audit-labels';
import { DataTable, type Column } from '@/components/admin/data-table';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (totalSec: number): string => {
  if (totalSec <= 0) return '-';
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}sa ${mins}dk`;
  if (mins > 0) return `${mins}dk ${secs}sn`;
  return `${secs}sn`;
};

const truncate = (text: string | null, len: number) => {
  if (!text) return '-';
  return text.length > len ? text.slice(0, len) + '...' : text;
};

// ---------------------------------------------------------------------------
// Tab Button
// ---------------------------------------------------------------------------

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Filter Button
// ---------------------------------------------------------------------------

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
// Tab 1: Ders Bazli (Session-based)
// ---------------------------------------------------------------------------

function SessionsTab() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('Booking');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimer(timer);
  };

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin', 'audit-sessions', page, typeFilter, debouncedSearch],
    queryFn: () =>
      adminApi.getAuditSessions({
        page,
        pageSize,
        type: typeFilter || undefined,
        search: debouncedSearch || undefined,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'audit-session-detail', selectedId, selectedType],
    queryFn: () => adminApi.getAuditSessionDetail(selectedId!, selectedType),
    enabled: !!selectedId && drawerOpen,
  });

  const items = result?.items ?? [];

  const columns: Column<AuditSessionSummaryDto>[] = [
    {
      key: 'entityType',
      label: 'Tur',
      render: (item) => (
        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            item.entityType === 'Booking'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
          )}
        >
          {item.entityType === 'Booking' ? '1:1' : 'Grup'}
        </Badge>
      ),
    },
    {
      key: 'title',
      label: 'Baslik',
      render: (item) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
            {item.title || 'Isimsiz'}
          </p>
          <p className="text-xs text-gray-500">{item.mentorName}</p>
        </div>
      ),
    },
    {
      key: 'studentName',
      label: 'Ogrenci',
      render: (item) => (
        <span className="text-sm text-gray-600">{item.studentName || '-'}</span>
      ),
    },
    {
      key: 'scheduledDate',
      label: 'Tarih',
      render: (item) => (
        <span className="text-sm text-gray-600">{formatDate(item.scheduledDate)}</span>
      ),
    },
    {
      key: 'totalEvents',
      label: 'Islem',
      render: (item) => (
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{item.totalEvents}</span>
      ),
    },
    {
      key: 'participantCount',
      label: 'Katilimci',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium">{item.participantCount}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
  ];

  return (
    <div>
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
          {[
            { label: 'Tumu', value: '' },
            { label: '1:1 Ders', value: 'Booking' },
            { label: 'Grup Dersi', value: 'GroupClass' },
          ].map((f) => (
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
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(item) => item.entityId}
        onRowClick={(item) => {
          setSelectedId(item.entityId);
          setSelectedType(item.entityType);
          setDrawerOpen(true);
        }}
        emptyMessage="Ders kaydi bulunamadi."
        pagination={
          result
            ? {
                page: result.page,
                pageSize,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      {/* Session Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedId(null);
        }}
        title="Ders Islem Gecmisi"
        width="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{detail.title || 'Isimsiz'}</h3>
                <StatusBadge status={detail.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Tur:</span>{' '}
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs ml-1',
                      detail.entityType === 'Booking'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    )}
                  >
                    {detail.entityType === 'Booking' ? '1:1 Ders' : 'Grup Dersi'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Mentor:</span>{' '}
                  <span className="font-medium">{detail.mentorName}</span>
                </div>
                {detail.studentName && (
                  <div>
                    <span className="text-gray-500">Ogrenci:</span>{' '}
                    <span className="font-medium">{detail.studentName}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Tarih:</span>{' '}
                  <span>{formatDate(detail.scheduledDate)}</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            {detail.participants.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Katilimcilar ({detail.participants.length})
                </h4>
                <div className="space-y-3">
                  {detail.participants.map((p) => {
                    const segments = p.segments ?? [];
                    const hasMultiple = segments.length > 1;
                    return (
                      <div key={p.userId} className="bg-white border border-gray-200 rounded-lg p-4">
                        {/* User header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                                p.role === 'Mentor' ? 'bg-blue-600' : 'bg-purple-600'
                              )}
                            >
                              {p.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{p.displayName}</p>
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-[10px]',
                                    p.role === 'Mentor'
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-purple-50 text-purple-600'
                                  )}
                                >
                                  {localizeRole(p.role)}
                                </Badge>
                                {hasMultiple && (
                                  <span className="text-[10px] text-gray-400">{segments.length} giris</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDuration(p.totalDurationSec)}
                            </p>
                            <p className="text-xs text-gray-500">toplam sure</p>
                          </div>
                        </div>
                        {/* Segments */}
                        {segments.length > 0 ? (
                          <div className="space-y-1.5">
                            {segments.map((seg, idx) => (
                              <div
                                key={seg.segmentId}
                                className={cn(
                                  'rounded-md p-2',
                                  hasMultiple ? 'bg-gray-50 border border-gray-100' : ''
                                )}
                              >
                                {hasMultiple && (
                                  <p className="text-[10px] font-medium text-gray-400 mb-1">{idx + 1}. Giris</p>
                                )}
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    <span className="truncate">Giris: {formatDate(seg.joinedAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-red-500 flex-shrink-0" />
                                    <span className="truncate">Cikis: {seg.leftAt ? formatDate(seg.leftAt) : 'Aktif'}</span>
                                  </div>
                                  <div className="text-right font-medium">
                                    {formatDuration(seg.durationSec)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-green-500" />
                              <span>Giris: {formatDate(p.joinedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-red-500" />
                              <span>Cikis: {p.leftAt ? formatDate(p.leftAt) : 'Aktif'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event Timeline */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Islem Zaman Cizelgesi ({detail.events.length})
              </h4>
              <div className="space-y-2">
                {detail.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                  >
                    <div className="text-xs text-gray-500 whitespace-nowrap pt-0.5 min-w-[110px]">
                      {formatDate(evt.createdAt)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-white border px-2 py-0.5 rounded">
                          {localizeAction(evt.action)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {localizeEntityType(evt.entityType)}
                        </span>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-gray-600 mt-1">{evt.description}</p>
                      )}
                      {evt.performedByName && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {evt.performedByName}
                          {evt.performedByRole && ` (${localizeRole(evt.performedByRole)})`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Kullanici Bazli (User-based)
// ---------------------------------------------------------------------------

function UsersTab() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimer(timer);
  };

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin', 'audit-users', page, debouncedSearch],
    queryFn: () =>
      adminApi.getAuditUsers({
        page,
        pageSize,
        search: debouncedSearch || undefined,
      }),
  });

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'audit-user-detail', selectedUserId],
    queryFn: () => adminApi.getAuditUserDetail(selectedUserId!),
    enabled: !!selectedUserId && drawerOpen,
  });

  const items = result?.items ?? [];

  const columns: Column<AuditUserSummaryDto>[] = [
    {
      key: 'displayName',
      label: 'Kullanici',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
            {item.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900">{item.displayName}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      render: (item) => (
        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
          {localizeRole(item.role)}
        </span>
      ),
    },
    {
      key: 'totalActions',
      label: 'Toplam Islem',
      render: (item) => (
        <span className="text-sm font-medium">{item.totalActions}</span>
      ),
    },
    {
      key: 'sessionCount',
      label: 'Oturum',
      render: (item) => (
        <span className="text-sm">{item.sessionCount}</span>
      ),
    },
    {
      key: 'totalSessionDurationSec',
      label: 'Toplam Sure',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {formatDuration(item.totalSessionDurationSec)}
        </span>
      ),
    },
    {
      key: 'lastActionAt',
      label: 'Son Islem',
      render: (item) => (
        <span className="text-xs text-gray-600">{formatDate(item.lastActionAt)}</span>
      ),
    },
  ];

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Kullanici ara..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(item) => item.userId}
        onRowClick={(item) => {
          setSelectedUserId(item.userId);
          setDrawerOpen(true);
        }}
        emptyMessage="Kullanici bulunamadi."
        pagination={
          result
            ? {
                page: result.page,
                pageSize,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      {/* User Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUserId(null);
        }}
        title="Kullanici Islem Gecmisi"
        width="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : userDetail ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-lg font-bold">
                  {userDetail.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{userDetail.displayName}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                      {localizeRole(userDetail.role)}
                    </span>
                    <span>{userDetail.totalActions} islem</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions */}
            {userDetail.sessions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Katildigi Oturumlar ({userDetail.sessions.length})
                </h4>
                <div className="space-y-2">
                  {userDetail.sessions.map((s, idx) => {
                    const segments = s.segments ?? [];
                    const hasMultiple = segments.length > 1;
                    return (
                      <div key={`${s.entityId}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px]',
                                s.entityType === 'Booking'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              )}
                            >
                              {s.entityType === 'Booking' ? '1:1' : 'Grup'}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">{s.title || 'Isimsiz'}</span>
                            {hasMultiple && (
                              <span className="text-[10px] text-gray-400">{segments.length} giris</span>
                            )}
                          </div>
                          <span className="text-sm font-semibold">{formatDuration(s.durationSec)}</span>
                        </div>
                        {segments.length > 0 ? (
                          <div className="space-y-1.5">
                            {segments.map((seg, segIdx) => (
                              <div
                                key={seg.segmentId}
                                className={cn(
                                  'rounded-md p-1.5',
                                  hasMultiple ? 'bg-gray-50 border border-gray-100' : ''
                                )}
                              >
                                {hasMultiple && (
                                  <p className="text-[10px] font-medium text-gray-400 mb-0.5">{segIdx + 1}. Giris</p>
                                )}
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    <span className="truncate">Giris: {formatDate(seg.joinedAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-red-500 flex-shrink-0" />
                                    <span className="truncate">Cikis: {seg.leftAt ? formatDate(seg.leftAt) : 'Aktif'}</span>
                                  </div>
                                  <div className="text-right font-medium">
                                    {formatDuration(seg.durationSec)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-green-500" />
                              Giris: {formatDate(s.joinedAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-red-500" />
                              Cikis: {s.leftAt ? formatDate(s.leftAt) : 'Aktif'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Son Islemler
              </h4>
              <div className="space-y-2">
                {userDetail.recentActions.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                  >
                    <div className="text-xs text-gray-500 whitespace-nowrap pt-0.5 min-w-[110px]">
                      {formatDate(evt.createdAt)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-white border px-2 py-0.5 rounded">
                          {localizeAction(evt.action)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {localizeEntityType(evt.entityType)}
                        </span>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-gray-600 mt-1">{evt.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Tum Islemler (All Events) - migrated from old audit-log
// ---------------------------------------------------------------------------

function AllEventsTab() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    entityType: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditLogDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', page, appliedFilters],
    queryFn: () =>
      adminApi.getAuditLog({
        page,
        pageSize,
        entityType: appliedFilters.entityType || undefined,
        action: appliedFilters.action || undefined,
        dateFrom: appliedFilters.dateFrom || undefined,
        dateTo: appliedFilters.dateTo || undefined,
      }),
  });

  const pagedData = data as PagedResult<AuditLogDto> | undefined;

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ entityType, action, dateFrom, dateTo });
  };

  const handleClearFilters = () => {
    setEntityType('');
    setAction('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setAppliedFilters({ entityType: '', action: '', dateFrom: '', dateTo: '' });
  };

  const columns: Column<AuditLogDto>[] = [
    {
      key: 'createdAt',
      label: 'Tarih',
      render: (e) => (
        <span className="text-xs text-gray-600 whitespace-nowrap">{formatDate(e.createdAt)}</span>
      ),
    },
    {
      key: 'action',
      label: 'Islem',
      render: (e) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
          {localizeAction(e.action)}
        </span>
      ),
    },
    {
      key: 'entityType',
      label: 'Kaynak Tipi',
      render: (e) => (
        <span className="text-sm">{localizeEntityType(e.entityType)}</span>
      ),
    },
    {
      key: 'entityId',
      label: 'Kaynak ID',
      render: (e) => (
        <span className="font-mono text-xs">{e.entityId.slice(0, 8)}</span>
      ),
    },
    {
      key: 'description',
      label: 'Aciklama',
      render: (e) => (
        <span className="text-sm text-gray-600">{truncate(e.description, 40)}</span>
      ),
    },
    {
      key: 'performedByName',
      label: 'Yapan',
      render: (e) => e.performedByName ?? <span className="text-gray-400">-</span>,
    },
    {
      key: 'performedByRole',
      label: 'Rol',
      render: (e) =>
        e.performedByRole ? (
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
            {localizeRole(e.performedByRole)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kaynak Tipi</label>
            <Input
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="ornegin: Booking"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Islem</label>
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="ornegin: StatusChanged"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Baslangic Tarihi</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Bitis Tarihi</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSearch} size="sm" className="h-9">
              <Search className="h-4 w-4 mr-1" />
              Ara
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm" className="h-9">
              Temizle
            </Button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pagedData?.items ?? []}
        isLoading={isLoading}
        getRowId={(e) => e.id}
        onRowClick={(e) => setSelectedEntry(e)}
        pagination={
          pagedData
            ? {
                page: pagedData.page,
                pageSize,
                totalCount: pagedData.totalCount,
                totalPages: pagedData.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
        emptyMessage="Islem kaydi bulunamadi."
      />

      {/* Detail Drawer */}
      <DetailDrawer
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Islem Detayi"
        width="lg"
      >
        {selectedEntry && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Tarih</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(selectedEntry.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Islem</p>
                <p className="text-sm text-gray-900 mt-1 font-mono">{localizeAction(selectedEntry.action)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Kaynak Tipi</p>
                <p className="text-sm text-gray-900 mt-1">{localizeEntityType(selectedEntry.entityType)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Kaynak ID</p>
                <p className="text-sm text-gray-900 mt-1 font-mono break-all">{selectedEntry.entityId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Yapan</p>
                <p className="text-sm text-gray-900 mt-1">{selectedEntry.performedByName ?? selectedEntry.performedBy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Rol</p>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedEntry.performedByRole ? localizeRole(selectedEntry.performedByRole) : '-'}
                </p>
              </div>
            </div>
            {selectedEntry.description && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Aciklama</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedEntry.description}</p>
              </div>
            )}
            {selectedEntry.oldValue && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Eski Deger</p>
                <pre className="text-xs text-red-700 bg-red-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                  {selectedEntry.oldValue}
                </pre>
              </div>
            )}
            {selectedEntry.newValue && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Yeni Deger</p>
                <pre className="text-xs text-green-700 bg-green-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                  {selectedEntry.newValue}
                </pre>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type TabId = 'sessions' | 'users' | 'all';

export default function AuditLogReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('sessions');

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Islem Gecmisi</h1>
        </div>
        <p className="text-sm text-gray-500">
          Ders bazli, kullanici bazli ve detayli islem kayitlari
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0 -mb-px">
          <TabButton
            label="Ders Bazli"
            active={activeTab === 'sessions'}
            onClick={() => setActiveTab('sessions')}
          />
          <TabButton
            label="Kullanici Bazli"
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          />
          <TabButton
            label="Tum Islemler"
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'sessions' && <SessionsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'all' && <AllEventsTab />}
    </div>
  );
}
