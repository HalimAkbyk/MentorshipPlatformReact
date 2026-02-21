'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Pencil,
  Calendar,
  Info,
  Eye,
  X,
  Copy,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Code2,
} from 'lucide-react';
import dynamic from 'next/dynamic';

import {
  adminApi,
  type NotificationTemplateDto,
} from '@/lib/api/admin';
import { DataTable, type Column } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

// Dynamic import for code editor (SSR-incompatible)
const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

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

function parseVariables(variables: string | null): string[] {
  if (!variables) return [];
  try {
    const parsed = JSON.parse(variables);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return variables
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
}

// ---------------------------------------------------------------------------
// Template Editor Modal
// ---------------------------------------------------------------------------

interface EditorState {
  name: string;
  subject: string;
  body: string;
  variables: string;
}

function TemplateEditorModal({
  template,
  onClose,
  onSave,
  isSaving,
}: {
  template: NotificationTemplateDto;
  onClose: () => void;
  onSave: (data: EditorState) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<EditorState>({
    name: template.name,
    subject: template.subject,
    body: template.body,
    variables: template.variables || '',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  const variablesList = parseVariables(template.variables);

  const handleInsertVariable = (varName: string) => {
    const textarea = document.getElementById('body-editor') as HTMLTextAreaElement | null;
    const toInsert = `{{${varName}}}`;
    setForm((prev) => ({ ...prev, body: prev.body + toInsert }));
  };

  const handleInsertVariableToSubject = (varName: string) => {
    setForm((prev) => ({ ...prev, subject: prev.subject + `{{${varName}}}` }));
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const result = await adminApi.previewTemplate(template.id);
      setPreviewSubject(result.subject);
      setPreviewHtml(result.body);
      setShowPreview(true);
    } catch {
      toast.error('Onizleme yuklenemedi');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('Lutfen zorunlu alanlari doldurun.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sablonu Duzenle</h2>
            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
              {template.key}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5 mr-1" />
              )}
              Onizle
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sablon Adi <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Sablon adi"
                disabled={isSaving}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-posta Konusu <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="E-posta konusu"
                disabled={isSaving}
              />
              {variablesList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs text-gray-400">Konu icin:</span>
                  {variablesList.map((v) => (
                    <button
                      key={`sub-${v}`}
                      type="button"
                      onClick={() => handleInsertVariableToSubject(v)}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Variables Reference */}
            {variablesList.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-800">
                    Kullanilabilir Degiskenler
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {variablesList.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-white text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                      title={`Tikla: {{${v}}} ekle`}
                    >
                      <Copy className="h-3 w-3" />
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Body - Code Editor */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Code2 className="h-4 w-4" />
                HTML Icerik <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <CodeEditor
                  id="body-editor"
                  value={form.body}
                  language="html"
                  placeholder="HTML e-posta icerigi..."
                  onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                  disabled={isSaving}
                  padding={16}
                  style={{
                    fontSize: 13,
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    minHeight: 300,
                    maxHeight: 500,
                    overflow: 'auto',
                    backgroundColor: '#f9fafb',
                  }}
                />
              </div>
            </div>

            {/* Variables (editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Degiskenler (JSON)
              </label>
              <Input
                value={form.variables}
                onChange={(e) => setForm((prev) => ({ ...prev, variables: e.target.value }))}
                placeholder='["displayName", "bookingDate"]'
                disabled={isSaving}
                className="font-mono text-xs"
              />
              <p className="text-xs text-gray-400 mt-1">
                JSON dizi formatinda degisken isimleri.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Vazgec
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h3 className="font-semibold text-gray-900">E-posta Onizleme</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <strong>Konu:</strong> {previewSubject}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-1">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full min-h-[400px] border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminNotificationTemplatesPage() {
  const queryClient = useQueryClient();

  // State
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateDto | null>(null);

  // Query: Templates list
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin', 'notification-templates'],
    queryFn: () => adminApi.getNotificationTemplates(),
  });

  // Mutation: Update
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; subject: string; body: string; variables?: string };
    }) => adminApi.updateNotificationTemplate(id, data),
    onSuccess: () => {
      toast.success('Sablon basariyla guncellendi.');
      queryClient.invalidateQueries({
        queryKey: ['admin', 'notification-templates'],
      });
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error('Sablon guncellenirken hata olustu.');
    },
  });

  // Mutation: Toggle Active
  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleTemplateActive(id),
    onSuccess: (data) => {
      const status = data?.isActive ? 'aktif' : 'pasif';
      toast.success(`Sablon ${status} yapildi.`);
      queryClient.invalidateQueries({
        queryKey: ['admin', 'notification-templates'],
      });
    },
    onError: () => {
      toast.error('Durum degistirilemedi.');
    },
  });

  const handleSave = (formData: EditorState) => {
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      data: {
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        variables: formData.variables || undefined,
      },
    });
  };

  const handleToggle = (e: React.MouseEvent, template: NotificationTemplateDto) => {
    e.stopPropagation();
    toggleMutation.mutate(template.id);
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
        <span className="text-sm text-gray-600 truncate max-w-[200px] block">
          {item.subject}
        </span>
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
        <button
          onClick={(e) => handleToggle(e, item)}
          disabled={toggleMutation.isPending}
          className="flex items-center gap-1.5 cursor-pointer"
          title={item.isActive ? 'Pasif yap' : 'Aktif yap'}
        >
          {item.isActive ? (
            <ToggleRight className="h-6 w-6 text-green-600" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-gray-400" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              item.isActive ? 'text-green-700' : 'text-gray-500'
            )}
          >
            {item.isActive ? 'Aktif' : 'Pasif'}
          </span>
        </button>
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
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setEditingTemplate(item);
          }}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Duzenle
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">E-posta Sablonlari</h1>
        </div>
        <p className="text-sm text-gray-500">
          E-posta sablonlarini duzenleyin ve aktif/pasif yapin. Sablonlar silinmez, yalnizca
          devre disi birakilabilir.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Degisken Kullanimi</p>
          <p>
            Sablon icinde <code className="bg-blue-100 px-1 rounded">{'{{degiskenAdi}}'}</code>{' '}
            seklinde degisken kullanabilirsiniz. E-posta gonderilirken bu degiskenler
            gercek degerlerle otomatik olarak degistirilir.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={templates}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        onRowClick={(item) => setEditingTemplate(item)}
        emptyMessage="E-posta sablonu bulunamadi."
        emptyIcon={<FileText className="h-12 w-12" />}
      />

      {/* Editor Modal */}
      {editingTemplate && (
        <TemplateEditorModal
          key={editingTemplate.id}
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  );
}
