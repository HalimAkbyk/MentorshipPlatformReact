'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Info,
} from 'lucide-react';

import {
  adminApi,
  type NotificationTemplateDto,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
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

const channelLabels: Record<string, string> = {
  Email: 'E-posta',
  InApp: 'Uygulama Ici',
  SMS: 'SMS',
};

function ChannelBadge({ channel }: { channel: string }) {
  const colorMap: Record<string, string> = {
    Email: 'bg-blue-100 text-blue-700',
    InApp: 'bg-purple-100 text-purple-700',
    SMS: 'bg-teal-100 text-teal-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        colorMap[channel] || 'bg-gray-100 text-gray-700'
      )}
    >
      {channelLabels[channel] || channel}
    </span>
  );
}

const KNOWN_TEMPLATES = [
  'welcome',
  'booking_confirmation',
  'booking_reminder',
  'booking_cancelled',
  'verification_approved',
  'unread_message',
];

// ---------------------------------------------------------------------------
// Template Form in Drawer
// ---------------------------------------------------------------------------

interface TemplateFormState {
  key: string;
  name: string;
  subject: string;
  body: string;
  variables: string;
  channel: string;
}

const emptyForm: TemplateFormState = {
  key: '',
  name: '',
  subject: '',
  body: '',
  variables: '',
  channel: 'Email',
};

function TemplateForm({
  initialValues,
  isEdit,
  onSave,
  isSaving,
}: {
  initialValues: TemplateFormState;
  isEdit: boolean;
  onSave: (data: TemplateFormState) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<TemplateFormState>(initialValues);

  const handleChange = (field: keyof TemplateFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key.trim() || !form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('Lutfen zorunlu alanlari doldurun.');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anahtar (Key) <span className="text-red-500">*</span>
        </label>
        <Input
          value={form.key}
          onChange={(e) => handleChange('key', e.target.value)}
          placeholder="ornek: booking_confirmation"
          disabled={isEdit || isSaving}
          className={isEdit ? 'bg-gray-100' : ''}
        />
        {isEdit && (
          <p className="text-xs text-gray-400 mt-1">Anahtar duzenlenemez.</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ad <span className="text-red-500">*</span>
        </label>
        <Input
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Sablon adi"
          disabled={isSaving}
        />
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Konu <span className="text-red-500">*</span>
        </label>
        <Input
          value={form.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="E-posta konusu"
          disabled={isSaving}
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Icerik <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.body}
          onChange={(e) => handleChange('body', e.target.value)}
          placeholder="Sablon icerigi..."
          rows={8}
          disabled={isSaving}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700',
            'placeholder:text-gray-400 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:opacity-50 disabled:bg-gray-50',
            'min-h-[200px]'
          )}
        />
      </div>

      {/* Variables */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Degiskenler
        </label>
        <Input
          value={form.variables}
          onChange={(e) => handleChange('variables', e.target.value)}
          placeholder="ornek: userName, bookingDate, mentorName"
          disabled={isSaving}
        />
        <p className="text-xs text-gray-400 mt-1">
          Virgul ile ayrilmis degisken isimleri. Icerik icinde {'{'}{'{'} degiskenAdi {'}'}{'}'}
          seklinde kullanilir.
        </p>
      </div>

      {/* Channel */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
        <select
          value={form.channel}
          onChange={(e) => handleChange('channel', e.target.value)}
          disabled={isSaving}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="Email">E-posta</option>
          <option value="InApp">Uygulama Ici</option>
          <option value="SMS">SMS</option>
        </select>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? 'Kaydediliyor...' : isEdit ? 'Guncelle' : 'Olustur'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminNotificationTemplatesPage() {
  const queryClient = useQueryClient();

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateDto | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<NotificationTemplateDto | null>(null);

  // Query: Templates list
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin', 'notification-templates'],
    queryFn: () => adminApi.getNotificationTemplates(),
  });

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: (data: { key: string; name: string; subject: string; body: string; variables?: string; channel?: string }) =>
      adminApi.createNotificationTemplate(data),
    onSuccess: () => {
      toast.success('Sablon basariyla olusturuldu.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'notification-templates'] });
      setDrawerOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error('Sablon olusturulurken hata olustu.');
    },
  });

  // Mutation: Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; subject: string; body: string; variables?: string } }) =>
      adminApi.updateNotificationTemplate(id, data),
    onSuccess: () => {
      toast.success('Sablon basariyla guncellendi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'notification-templates'] });
      setDrawerOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error('Sablon guncellenirken hata olustu.');
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotificationTemplate(id),
    onSuccess: () => {
      toast.success('Sablon basariyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'notification-templates'] });
      setDeleteModalOpen(false);
      setDeletingTemplate(null);
    },
    onError: () => {
      toast.error('Sablon silinirken hata olustu.');
    },
  });

  const handleSave = (formData: TemplateFormState) => {
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: {
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          variables: formData.variables || undefined,
        },
      });
    } else {
      createMutation.mutate({
        key: formData.key,
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        variables: formData.variables || undefined,
        channel: formData.channel || undefined,
      });
    }
  };

  const handleOpenNew = () => {
    setEditingTemplate(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (template: NotificationTemplateDto) => {
    setEditingTemplate(template);
    setDrawerOpen(true);
  };

  const handleOpenDelete = (template: NotificationTemplateDto) => {
    setDeletingTemplate(template);
    setDeleteModalOpen(true);
  };

  // Columns
  const columns: Column<NotificationTemplateDto>[] = [
    {
      key: 'key',
      label: 'Anahtar',
      render: (item) => (
        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {item.key}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Ad',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Konu',
      render: (item) => (
        <span className="text-sm text-gray-600">{item.subject}</span>
      ),
    },
    {
      key: 'channel',
      label: 'Kanal',
      render: (item) => <ChannelBadge channel={item.channel} />,
    },
    {
      key: 'isActive',
      label: 'Durum',
      render: (item) => (
        <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} size="sm" />
      ),
    },
    {
      key: 'updatedAt',
      label: 'Son Guncelleme',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{formatDate(item.updatedAt)}</span>
        </div>
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
              handleOpenEdit(item);
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Duzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDelete(item);
            }}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const drawerInitialValues: TemplateFormState = editingTemplate
    ? {
        key: editingTemplate.key,
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        variables: editingTemplate.variables || '',
        channel: editingTemplate.channel,
      }
    : emptyForm;

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Bildirim Sablonlari</h1>
          </div>
          <p className="text-sm text-gray-500">
            E-posta ve bildirim sablonlarini yonetin
          </p>
        </div>
        <Button onClick={handleOpenNew} className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4 mr-1.5" />
          Yeni Sablon
        </Button>
      </div>

      {/* Known Templates Info */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Bilinen Sablonlar</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {KNOWN_TEMPLATES.map((key) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-700"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={templates}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        onRowClick={handleOpenEdit}
        emptyMessage="Bildirim sablonu bulunamadi."
        emptyIcon={<FileText className="h-12 w-12" />}
      />

      {/* Add/Edit Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingTemplate(null); }}
        title={editingTemplate ? 'Sablonu Duzenle' : 'Yeni Sablon Olustur'}
        width="lg"
      >
        <TemplateForm
          key={editingTemplate?.id || 'new'}
          initialValues={drawerInitialValues}
          isEdit={!!editingTemplate}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      </DetailDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmActionModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletingTemplate(null); }}
        onConfirm={() => {
          if (deletingTemplate) {
            deleteMutation.mutate(deletingTemplate.id);
          }
        }}
        title="Sablonu Sil"
        description={`"${deletingTemplate?.name}" sablonunu silmek istediginize emin misiniz? Bu islem geri alinamaz.`}
        confirmLabel="Sil"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
