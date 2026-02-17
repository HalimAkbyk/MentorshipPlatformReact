'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CreditCard,
  Star,
  GraduationCap,
  Settings,
} from 'lucide-react';

import {
  adminApi,
  type AdminUserDto,
  type UserDetailDto,
  type PagedResult,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

function formatCurrency(value: number): string {
  return `₺${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function roleBadgeVariant(role: string) {
  switch (role) {
    case 'Admin':
      return 'destructive' as const;
    case 'Mentor':
      return 'success' as const;
    case 'Student':
      return 'default' as const;
    default:
      return 'secondary' as const;
  }
}

function roleLabel(role: string): string {
  switch (role) {
    case 'Admin':
      return 'Admin';
    case 'Mentor':
      return 'Mentor';
    case 'Student':
      return 'Ogrenci';
    default:
      return role;
  }
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
// Detail Section
// ---------------------------------------------------------------------------

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value || '-'}</p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  // --- State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [roleChangeModal, setRoleChangeModal] = useState<{
    userId: string;
    userName: string;
    role: string;
    action: 'add' | 'remove';
  } | null>(null);

  // --- Debounce search ---
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

  // --- Queries ---
  const {
    data: usersResult,
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ['admin', 'users', { page, pageSize, search: debouncedSearch, role: roleFilter, status: statusFilter }],
    queryFn: () =>
      adminApi.getUsers({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const users = usersResult?.items ?? [];
  const totalCount = usersResult?.totalCount ?? 0;
  const totalPages = usersResult?.totalPages ?? 0;

  const {
    data: userDetail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['admin', 'user-detail', selectedUserId],
    queryFn: () => adminApi.getUserDetail(selectedUserId!),
    enabled: !!selectedUserId,
  });

  // --- Mutations ---
  const suspendMutation = useMutation({
    mutationFn: (params: { userId: string; reason: string }) =>
      adminApi.suspendUser(params.userId, params.reason),
    onSuccess: () => {
      toast.success('Kullanici askiya alindi');
      setSuspendUserId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail'] });
    },
    onError: () => {
      toast.error('Askiya alma islemi basarisiz oldu');
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unsuspendUser(userId),
    onSuccess: () => {
      toast.success('Kullanici aktif edildi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail'] });
    },
    onError: () => {
      toast.error('Aktif etme islemi basarisiz oldu');
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: (params: { userId: string; role: string; action: 'add' | 'remove' }) =>
      adminApi.changeUserRole(params.userId, params.role, params.action),
    onSuccess: () => {
      toast.success('Kullanici rolu guncellendi');
      setRoleChangeModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail'] });
    },
    onError: () => {
      toast.error('Rol guncelleme basarisiz oldu');
    },
  });

  // --- Selected user for suspend modal ---
  const suspendUser = useMemo(
    () => users.find((u) => u.id === suspendUserId),
    [users, suspendUserId]
  );

  // --- Columns ---
  const columns: Column<AdminUserDto>[] = [
    {
      key: 'displayName',
      label: 'Kullanici',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.displayName} />}
            <AvatarFallback className="text-xs">
              {getInitials(item.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Roller',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.roles.map((role) => (
            <Badge key={role} variant={roleBadgeVariant(role)} className="text-[10px]">
              {roleLabel(role)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'createdAt',
      label: 'Kayit Tarihi',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (item) => (
        <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'bookingCount',
      label: 'Dersler',
      className: 'text-center',
      render: (item) => (
        <span className="text-sm text-gray-700">{item.bookingCount}</span>
      ),
    },
    {
      key: 'orderCount',
      label: 'Siparisler',
      className: 'text-center',
      render: (item) => (
        <span className="text-sm text-gray-700">{item.orderCount}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Islemler',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUserId(item.id);
            }}
          >
            Detay
          </Button>
          {item.status === 'Suspended' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                unsuspendMutation.mutate(item.id);
              }}
              disabled={unsuspendMutation.isPending}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <UserCheck className="h-3.5 w-3.5 mr-1" />
              Aktifle
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSuspendUserId(item.id);
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <UserX className="h-3.5 w-3.5 mr-1" />
              Askiya Al
            </Button>
          )}
        </div>
      ),
    },
  ];

  // --- Render ---
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Kullanici Yonetimi</h1>
        </div>
        <p className="text-sm text-gray-500">Tum kullanicilari goruntule ve yonet</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search + Role + Status in a row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ad veya e-posta ile ara..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium mr-1">Rol:</span>
            <FilterButton
              label="Tumu"
              active={roleFilter === ''}
              onClick={() => { setRoleFilter(''); setPage(1); }}
            />
            <FilterButton
              label="Ogrenci"
              active={roleFilter === 'Student'}
              onClick={() => { setRoleFilter('Student'); setPage(1); }}
            />
            <FilterButton
              label="Mentor"
              active={roleFilter === 'Mentor'}
              onClick={() => { setRoleFilter('Mentor'); setPage(1); }}
            />
            <FilterButton
              label="Admin"
              active={roleFilter === 'Admin'}
              onClick={() => { setRoleFilter('Admin'); setPage(1); }}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium mr-1">Durum:</span>
            <FilterButton
              label="Tumu"
              active={statusFilter === ''}
              onClick={() => { setStatusFilter(''); setPage(1); }}
            />
            <FilterButton
              label="Aktif"
              active={statusFilter === 'Active'}
              onClick={() => { setStatusFilter('Active'); setPage(1); }}
            />
            <FilterButton
              label="Askida"
              active={statusFilter === 'Suspended'}
              onClick={() => { setStatusFilter('Suspended'); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={usersLoading}
        getRowId={(item) => item.id}
        onRowClick={(item) => setSelectedUserId(item.id)}
        emptyMessage="Kullanici bulunamadi."
        emptyIcon={<Users className="h-12 w-12" />}
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
        open={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        title={userDetail?.displayName ?? 'Kullanici Detayi'}
        width="lg"
        footer={
          userDetail ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Aksiyonlar
              </p>

              {/* Role management */}
              <div className="flex flex-wrap gap-2">
                {userDetail.roles.includes('Admin') ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRoleChangeModal({
                        userId: userDetail.id,
                        userName: userDetail.displayName,
                        role: 'Admin',
                        action: 'remove',
                      })
                    }
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Admin Rolunu Kaldir
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRoleChangeModal({
                        userId: userDetail.id,
                        userName: userDetail.displayName,
                        role: 'Admin',
                        action: 'add',
                      })
                    }
                  >
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Admin Rolu Ekle
                  </Button>
                )}

                {userDetail.roles.includes('Mentor') ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRoleChangeModal({
                        userId: userDetail.id,
                        userName: userDetail.displayName,
                        role: 'Mentor',
                        action: 'remove',
                      })
                    }
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <GraduationCap className="h-3.5 w-3.5 mr-1" />
                    Mentor Rolunu Kaldir
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRoleChangeModal({
                        userId: userDetail.id,
                        userName: userDetail.displayName,
                        role: 'Mentor',
                        action: 'add',
                      })
                    }
                  >
                    <GraduationCap className="h-3.5 w-3.5 mr-1" />
                    Mentor Rolu Ekle
                  </Button>
                )}
              </div>

              {/* Suspend / Unsuspend */}
              <div>
                {userDetail.status === 'Suspended' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unsuspendMutation.mutate(userDetail.id)}
                    disabled={unsuspendMutation.isPending}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                    Kullaniciyi Aktiflestir
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSuspendUserId(userDetail.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <UserX className="h-3.5 w-3.5 mr-1" />
                    Kullaniciyi Askiya Al
                  </Button>
                )}
              </div>
            </div>
          ) : undefined
        }
      >
        {detailLoading || !userDetail ? (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-56 bg-gray-100 rounded" />
              </div>
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-3/4" />
            ))}
          </div>
        ) : (
          <>
            {/* Genel Bilgiler */}
            <DetailSection title="Genel Bilgiler">
              {/* Avatar + Name header */}
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  {userDetail.avatarUrl && (
                    <AvatarImage src={userDetail.avatarUrl} alt={userDetail.displayName} />
                  )}
                  <AvatarFallback className="text-lg">
                    {getInitials(userDetail.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {userDetail.displayName}
                  </p>
                  <p className="text-sm text-gray-500">{userDetail.email}</p>
                  <div className="flex gap-1 mt-1">
                    {userDetail.roles.map((role) => (
                      <Badge key={role} variant={roleBadgeVariant(role)} className="text-[10px]">
                        {roleLabel(role)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4">
                <DetailRow
                  label="E-posta"
                  value={userDetail.email}
                  icon={<Mail className="h-4 w-4" />}
                />
                <DetailRow
                  label="Telefon"
                  value={userDetail.phone || '-'}
                  icon={<Phone className="h-4 w-4" />}
                />
                <DetailRow
                  label="Dogum Yili"
                  value={userDetail.birthYear ?? '-'}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DetailRow
                  label="Saglayici"
                  value={userDetail.externalProvider || 'E-posta'}
                  icon={<Settings className="h-4 w-4" />}
                />
                <DetailRow
                  label="Durum"
                  value={<StatusBadge status={userDetail.status} size="sm" />}
                />
                <DetailRow
                  label="Kayit Tarihi"
                  value={formatDateTime(userDetail.createdAt)}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <DetailRow
                  label="Son Guncelleme"
                  value={formatDateTime(userDetail.updatedAt)}
                />
              </div>
            </DetailSection>

            {/* Istatistikler */}
            <DetailSection title="Istatistikler">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniStat label="Dersler" value={userDetail.bookingCount} />
                <MiniStat label="Tamamlanan" value={userDetail.completedBookingCount} />
                <MiniStat label="Siparisler" value={userDetail.orderCount} />
                <MiniStat label="Toplam Harcama" value={formatCurrency(userDetail.totalSpent)} />
                <MiniStat label="Kurs Kaydi" value={userDetail.courseEnrollmentCount} />
                <MiniStat label="Sinif Kaydi" value={userDetail.classEnrollmentCount} />
                <MiniStat label="Degerl." value={userDetail.reviewCount} />
                <MiniStat
                  label="Ort. Puan"
                  value={
                    userDetail.averageRating != null
                      ? userDetail.averageRating.toFixed(1)
                      : '-'
                  }
                />
              </div>
            </DetailSection>

            {/* Mentor Profili */}
            {userDetail.mentorProfile && (
              <DetailSection title="Mentor Profili">
                <div className="grid grid-cols-2 gap-x-4">
                  <DetailRow
                    label="Universite"
                    value={userDetail.mentorProfile.university}
                    icon={<GraduationCap className="h-4 w-4" />}
                  />
                  <DetailRow
                    label="Bolum"
                    value={userDetail.mentorProfile.department}
                  />
                  <DetailRow
                    label="Mezuniyet Yili"
                    value={userDetail.mentorProfile.graduationYear ?? '-'}
                  />
                  <DetailRow
                    label="Yayinda"
                    value={
                      <StatusBadge
                        status={userDetail.mentorProfile.isListed ? 'Active' : 'Inactive'}
                        size="sm"
                      />
                    }
                  />
                  <DetailRow
                    label="Ders Onaylanmis"
                    value={
                      <StatusBadge
                        status={userDetail.mentorProfile.isApprovedForBookings ? 'Approved' : 'Pending'}
                        size="sm"
                      />
                    }
                  />
                  <DetailRow
                    label="Teklifler"
                    value={userDetail.mentorProfile.offeringCount}
                  />
                  <DetailRow
                    label="Tamamlanan Ders"
                    value={userDetail.mentorProfile.completedSessionCount}
                  />
                  <DetailRow
                    label="Toplam Kazanc"
                    value={formatCurrency(userDetail.mentorProfile.totalEarned)}
                    icon={<CreditCard className="h-4 w-4" />}
                  />
                </div>
              </DetailSection>
            )}
          </>
        )}
      </DetailDrawer>

      {/* Suspend Confirmation Modal */}
      <ConfirmActionModal
        open={!!suspendUserId}
        onClose={() => setSuspendUserId(null)}
        onConfirm={(reason) => {
          if (suspendUserId && reason) {
            suspendMutation.mutate({ userId: suspendUserId, reason });
          }
        }}
        title="Kullaniciyi Askiya Al"
        description={
          suspendUser
            ? `"${suspendUser.displayName}" adli kullaniciyi askiya almak istediginize emin misiniz? Askiya alinan kullanici sisteme giris yapamaz.`
            : 'Bu kullaniciyi askiya almak istediginize emin misiniz?'
        }
        confirmLabel="Askiya Al"
        variant="danger"
        showReasonField
        reasonRequired
        isLoading={suspendMutation.isPending}
      />

      {/* Role Change Confirmation Modal */}
      <ConfirmActionModal
        open={!!roleChangeModal}
        onClose={() => setRoleChangeModal(null)}
        onConfirm={() => {
          if (roleChangeModal) {
            roleChangeMutation.mutate({
              userId: roleChangeModal.userId,
              role: roleChangeModal.role,
              action: roleChangeModal.action,
            });
          }
        }}
        title={
          roleChangeModal
            ? roleChangeModal.action === 'add'
              ? `${roleChangeModal.role} Rolu Ekle`
              : `${roleChangeModal.role} Rolunu Kaldir`
            : 'Rol Degistir'
        }
        description={
          roleChangeModal
            ? roleChangeModal.action === 'add'
              ? `"${roleChangeModal.userName}" adli kullaniciya ${roleChangeModal.role} rolu eklenecektir. Devam etmek istiyor musunuz?`
              : `"${roleChangeModal.userName}" adli kullanicidan ${roleChangeModal.role} rolu kaldirilacaktir. Devam etmek istiyor musunuz?`
            : ''
        }
        confirmLabel={
          roleChangeModal?.action === 'add' ? 'Rolu Ekle' : 'Rolu Kaldir'
        }
        variant={roleChangeModal?.action === 'remove' ? 'warning' : 'info'}
        isLoading={roleChangeMutation.isPending}
      />
    </div>
  );
}
