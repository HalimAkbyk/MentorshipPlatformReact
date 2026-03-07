'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Filter, Clock, User, Loader2 } from 'lucide-react';
import { adminApi, type EducationChangeLogDto } from '@/lib/api/admin';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ENTITY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  Booking: { label: '1:1 Seans', color: 'bg-indigo-100 text-indigo-700' },
  GroupClass: { label: 'Grup Dersi', color: 'bg-purple-100 text-purple-700' },
  Course: { label: 'Video Kursu', color: 'bg-blue-100 text-blue-700' },
  Offering: { label: '1:1 Paket', color: 'bg-teal-100 text-teal-700' },
};

const ACTION_LABELS: Record<string, string> = {
  AdminUpdate: 'Admin Guncelleme',
  AdminCreate: 'Admin Olusturma',
  StatusChange: 'Durum Degisikligi',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminChangeLogPage() {
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'change-log', entityType, page],
    queryFn: () => adminApi.getEducationChangeLog({
      entityType: entityType || undefined,
      page,
      pageSize: 30,
    }),
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Degisiklik Gecmisi</h1>
        <p className="text-sm text-gray-500 mt-1">Egitim kayitlari uzerinde yapilan admin degisikliklerinin kaydi</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => { setEntityType(''); setPage(1); }}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !entityType ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Tumu
        </button>
        {Object.entries(ENTITY_TYPE_LABELS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => { setEntityType(key); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              entityType === key ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Henuz degisiklik kaydi yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((log: EducationChangeLogDto) => {
            const typeInfo = ENTITY_TYPE_LABELS[log.entityType] || { label: log.entityType, color: 'bg-gray-100 text-gray-600' };
            return (
              <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                      <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.entityId?.slice(0, 8)}...
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{log.description}</p>
                    {log.metadata && (
                      <p className="text-xs text-slate-500 mt-1 italic">Sebep: {log.metadata}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-medium">{log.performedByName || 'Sistem'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(log.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Onceki
          </Button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
