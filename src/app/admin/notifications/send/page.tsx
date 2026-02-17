'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Calendar,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import {
  adminApi,
  type BulkNotificationDto,
} from '@/lib/api/admin';
import { StatusBadge } from '@/components/admin/status-badge';
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

const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max) + '...' : text;

const audienceLabels: Record<string, string> = {
  All: 'Tum Kullanicilar',
  Students: 'Ogrenciler',
  Mentors: 'Mentorlar',
};

function AudienceBadge({ audience }: { audience: string }) {
  const colorMap: Record<string, string> = {
    All: 'bg-purple-100 text-purple-700',
    Students: 'bg-blue-100 text-blue-700',
    Mentors: 'bg-teal-100 text-teal-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        colorMap[audience] || 'bg-gray-100 text-gray-700'
      )}
    >
      {audienceLabels[audience] || audience}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compose Form
// ---------------------------------------------------------------------------

function ComposeForm({ onSent }: { onSent: () => void }) {
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('All');
  const [channel] = useState('Email');
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sendMutation = useMutation({
    mutationFn: () =>
      adminApi.sendBulkNotification({
        subject,
        body,
        targetAudience,
        channel,
        scheduledAt: scheduleType === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success('Bildirim basariyla gonderildi.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'notification-history'] });
      setSubject('');
      setBody('');
      setTargetAudience('All');
      setScheduleType('now');
      setScheduledAt('');
      setConfirmOpen(false);
      onSent();
    },
    onError: () => {
      toast.error('Bildirim gonderilirken hata olustu.');
      setConfirmOpen(false);
    },
  });

  const handleSendClick = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Konu ve icerik alanlarini doldurun.');
      return;
    }
    if (scheduleType === 'scheduled' && !scheduledAt) {
      toast.error('Zamanlama icin bir tarih secin.');
      return;
    }
    setConfirmOpen(true);
  };

  const audienceDisplayLabel = audienceLabels[targetAudience] || targetAudience;

  return (
    <>
      <div className="space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Konu <span className="text-red-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Bildirim konusu"
            disabled={sendMutation.isPending}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icerik <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Bildirim icerigi..."
            rows={8}
            disabled={sendMutation.isPending}
            className={cn(
              'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700',
              'placeholder:text-gray-400 resize-y',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:opacity-50 disabled:bg-gray-50',
              'min-h-[200px]'
            )}
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hedef Kitle
          </label>
          <div className="space-y-2">
            {[
              { value: 'All', label: 'Tum Kullanicilar' },
              { value: 'Students', label: 'Sadece Ogrenciler' },
              { value: 'Mentors', label: 'Sadece Mentorlar' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  targetAudience === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <input
                  type="radio"
                  name="targetAudience"
                  value={opt.value}
                  checked={targetAudience === opt.value}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={sendMutation.isPending}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Channel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
          <select
            value={channel}
            disabled
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-gray-100"
          >
            <option value="Email">E-posta</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">Su an sadece e-posta desteklenmektedir.</p>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zamanlama</label>
          <div className="space-y-2">
            <label
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                scheduleType === 'now'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <input
                type="radio"
                name="scheduleType"
                value="now"
                checked={scheduleType === 'now'}
                onChange={() => setScheduleType('now')}
                disabled={sendMutation.isPending}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Hemen Gonder</span>
              </div>
            </label>
            <label
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                scheduleType === 'scheduled'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <input
                type="radio"
                name="scheduleType"
                value="scheduled"
                checked={scheduleType === 'scheduled'}
                onChange={() => setScheduleType('scheduled')}
                disabled={sendMutation.isPending}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Zamanlanmis</span>
              </div>
            </label>
          </div>
          {scheduleType === 'scheduled' && (
            <div className="mt-3">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                disabled={sendMutation.isPending}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="pt-2">
          <Button
            onClick={handleSendClick}
            disabled={sendMutation.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            {sendMutation.isPending ? 'Gonderiliyor...' : 'Gonder'}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmActionModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => sendMutation.mutate()}
        title="Bildirim Gonder"
        description={`Bu bildirim "${audienceDisplayLabel}" kitlesine ${scheduleType === 'now' ? 'hemen' : 'zamanlanmis olarak'} gonderilecek. Devam etmek istiyor musunuz?`}
        confirmLabel="Gonder"
        variant="info"
        isLoading={sendMutation.isPending}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// History Table
// ---------------------------------------------------------------------------

function HistoryTable() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: historyResult, isLoading } = useQuery({
    queryKey: ['admin', 'notification-history', page],
    queryFn: () => adminApi.getNotificationHistory({ page, pageSize }),
  });

  const items = historyResult?.items ?? [];
  const totalCount = historyResult?.totalCount ?? 0;
  const totalPages = historyResult?.totalPages ?? 0;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        Gonderim Gecmisi
      </h2>

      <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Konu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hedef</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Alici</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-gray-500">Henuz bildirim gonderilmemis.</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {truncate(item.subject, 40)}
                    </td>
                    <td className="px-4 py-3">
                      <AudienceBadge audience={item.targetAudience} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        {item.recipientCount}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-500">
              Toplam <span className="font-medium">{totalCount}</span> kayit
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
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

export default function AdminBulkNotificationPage() {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Send className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Toplu Bildirim Gonder</h1>
        </div>
        <p className="text-sm text-gray-500">
          Kullanicilara toplu e-posta bildirimleri gonderin
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Compose Form */}
        <div>
          <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-gray-500" />
              Bildirim Olustur
            </h2>
            <ComposeForm
              key={historyKey}
              onSent={() => setHistoryKey((k) => k + 1)}
            />
          </div>
        </div>

        {/* RIGHT: History */}
        <div>
          <HistoryTable key={historyKey} />
        </div>
      </div>
    </div>
  );
}
