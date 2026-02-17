'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Shield,
  Search,
  Users,
  GraduationCap,
  UserCog,
} from 'lucide-react';

import {
  adminApi,
  type AdminUserDto,
  type PagedResult,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
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
// Role description card
// ---------------------------------------------------------------------------

function RoleCard({
  role,
  label,
  description,
  icon,
  color,
}: {
  role: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className={cn('rounded-xl p-3 flex-shrink-0', color)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminRolesPage() {
  const queryClient = useQueryClient();

  // --- State ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

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

  // --- Query ---
  const {
    data: usersResult,
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ['admin', 'roles-users', { page, pageSize, search: debouncedSearch }],
    queryFn: () =>
      adminApi.getUsers({
        page,
        pageSize,
        search: debouncedSearch || undefined,
      }),
    enabled: debouncedSearch.length > 0,
  });

  const users = usersResult?.items ?? [];
  const totalCount = usersResult?.totalCount ?? 0;
  const totalPages = usersResult?.totalPages ?? 0;

  // --- Mutation ---
  const roleChangeMutation = useMutation({
    mutationFn: (params: { userId: string; role: string; action: 'add' | 'remove' }) =>
      adminApi.changeUserRole(params.userId, params.role, params.action),
    onSuccess: () => {
      toast.success('Kullanici rolu guncellendi');
      setRoleChangeModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => {
      toast.error('Rol guncelleme basarisiz oldu');
    },
  });

  // --- Columns ---
  const columns: Column<AdminUserDto>[] = [
    {
      key: 'displayName',
      label: 'Kullanici',
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
      label: 'Mevcut Roller',
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
      key: 'actions',
      label: 'Islemler',
      render: (item) => (
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin role toggle */}
          {item.roles.includes('Admin') ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRoleChangeModal({
                  userId: item.id,
                  userName: item.displayName,
                  role: 'Admin',
                  action: 'remove',
                });
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              Admin Kaldir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRoleChangeModal({
                  userId: item.id,
                  userName: item.displayName,
                  role: 'Admin',
                  action: 'add',
                });
              }}
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              Admin Ekle
            </Button>
          )}

          {/* Mentor role toggle */}
          {item.roles.includes('Mentor') ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRoleChangeModal({
                  userId: item.id,
                  userName: item.displayName,
                  role: 'Mentor',
                  action: 'remove',
                });
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <GraduationCap className="h-3.5 w-3.5 mr-1" />
              Mentor Kaldir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRoleChangeModal({
                  userId: item.id,
                  userName: item.displayName,
                  role: 'Mentor',
                  action: 'add',
                });
              }}
            >
              <GraduationCap className="h-3.5 w-3.5 mr-1" />
              Mentor Ekle
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
          <UserCog className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Roller & Izinler</h1>
        </div>
        <p className="text-sm text-gray-500">Kullanici rollerini yonetin</p>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <RoleCard
          role="Student"
          label="Ogrenci"
          description="Ders arayabilir, ders alabilir, siparis olusturabilir ve degerlendirme yapabilir."
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <RoleCard
          role="Mentor"
          label="Mentor"
          description="Ders verebilir, muesaitlik ayarlayabilir, grup sinifi olusturabilir ve kazanc elde edebilir."
          icon={<GraduationCap className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
        <RoleCard
          role="Admin"
          label="Admin"
          description="Tum sistemi yonetebilir, kullanicilari duzenleyebilir, iade ve onay islemlerini yapabilir."
          icon={<Shield className="h-5 w-5 text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Kullanici adi veya e-posta ile ara..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {!debouncedSearch && (
          <p className="text-xs text-gray-400 mt-2">
            Rol degisikligi yapmak icin kullanici arayin.
          </p>
        )}
      </div>

      {/* Users table (only shown when searching) */}
      {debouncedSearch && (
        <DataTable
          columns={columns}
          data={users}
          isLoading={usersLoading}
          getRowId={(item) => item.id}
          emptyMessage="Kullanici bulunamadi."
          emptyIcon={<Users className="h-12 w-12" />}
          pagination={
            totalPages > 1
              ? {
                  page,
                  pageSize,
                  totalCount,
                  totalPages,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      )}

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
