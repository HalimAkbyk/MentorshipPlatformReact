'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldBan, Plus, Trash2, Calendar } from 'lucide-react';

import {
  adminApi,
  type BlacklistEntryDto,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { DetailDrawer } from '@/components/admin/detail-drawer';
import { ConfirmActionModal } from '@/components/admin/confirm-action-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const typeLabels: Record<string, string> = {
  Word: 'Kelime',
  IP: 'IP',
  Email: 'E-posta',
};

const typeColors: Record<string, string> = {
  Word: 'bg-red-100 text-red-700',
  IP: 'bg-amber-100 text-amber-700',
  Email: 'bg-purple-100 text-purple-700',
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        typeColors[type] || 'bg-gray-100 text-gray-700'
      )}
    >
      {typeLabels[type] || type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Create Form
// ---------------------------------------------------------------------------

function CreateBlacklistForm({
  onSave,
  isSaving,
}: {
  onSave: (data: { type: string; value: string; reason?: string }) => void;
  isSaving: boolean;
}) {
  const [type, setType] = useState('Word');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.error('Deger alani zorunludur.');
      return;
    }
    onSave({
      type,
      value: value.trim(),
      reason: reason.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tip <span className="text-red-500">*</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={isSaving}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="Word">Kelime</option>
          <option value="IP">IP</option>
          <option value="Email">E-posta</option>
        </select>
      </div>

      {/* Value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deger <span className="text-red-500">*</span>
        </label>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Engellenecek deger"
          disabled={isSaving}
        />
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sebep
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Engelleme sebebi (istege bagli)"
          rows={3}
          disabled={isSaving}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700',
            'placeholder:text-gray-400 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:opacity-50 disabled:bg-gray-50'
          )}
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button type="submit" disabled={isSaving} className="w-full bg-red-600 hover:bg-red-700 text-white">
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminBlacklistPage() {
  const queryClient = useQueryClient();

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<BlacklistEntryDto | null>(null);

  // Filter tabs
  const [typeFilter, setTypeFilter] = useState<string>('');
  const filterTabs = [
    { label: 'Tumu', value: '' },
    { label: 'Kelime', value: 'Word' },
    { label: 'IP', value: 'IP' },
    { label: 'E-posta', value: 'Email' },
  ];

  // Query
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin', 'blacklist', typeFilter],
    queryFn: () => adminApi.getBlacklist(typeFilter || undefined),
  });

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: (data: { type: string; value: string; reason?: string }) =>
      adminApi.createBlacklistEntry(data),
    onSuccess: () => {
      toast.success('Kara liste kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'blacklist'] });
      setDrawerOpen(false);
    },
    onError: () => {
      toast.error('Kayit olusturulurken hata olustu.');
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBlacklistEntry(id),
    onSuccess: () => {
      toast.success('Kayit basariyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'blacklist'] });
      setDeleteModalOpen(false);
      setDeletingEntry(null);
    },
    onError: () => {
      toast.error('Kayit silinirken hata olustu.');
    },
  });

  const handleOpenDelete = (entry: BlacklistEntryDto) => {
    setDeletingEntry(entry);
    setDeleteModalOpen(true);
  };

  // Columns
  const columns: Column<BlacklistEntryDto>[] = [
    {
      key: 'type',
      label: 'Tip',
      render: (item) => <TypeBadge type={item.type} />,
    },
    {
      key: 'value',
      label: 'Deger',
      render: (item) => (
        <span className="font-mono text-sm text-gray-800 bg-gray-50 px-2 py-0.5 rounded">
          {item.value}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Sebep',
      render: (item) => (
        <span className="text-sm text-gray-600">{item.reason || '-'}</span>
      ),
    },
    {
      key: 'createdByName',
      label: 'Ekleyen',
      render: (item) => (
        <span className="text-sm text-gray-700">{item.createdByName || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Tarih',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{formatDate(item.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Islemler',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDelete(item);
          }}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Sil
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldBan className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Kara Liste</h1>
          </div>
          <p className="text-sm text-gray-500">
            Engellenen kelime, IP adresi ve e-posta adreslerini yonetin.
          </p>
        </div>
        <Button
          onClick={() => setDrawerOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Ekle
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTypeFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === tab.value
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        emptyMessage="Kara liste kaydi bulunamadi."
        emptyIcon={<ShieldBan className="h-12 w-12" />}
      />

      {/* Create Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Yeni Kara Liste Kaydi"
        width="md"
      >
        <CreateBlacklistForm
          onSave={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
        />
      </DetailDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmActionModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletingEntry(null); }}
        onConfirm={() => {
          if (deletingEntry) {
            deleteMutation.mutate(deletingEntry.id);
          }
        }}
        title="Kaydi Sil"
        description={`"${deletingEntry?.value}" degerini kara listeden kaldirmak istediginize emin misiniz?`}
        confirmLabel="Sil"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
