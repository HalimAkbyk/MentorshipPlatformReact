'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Users, DollarSign, Calendar, Clock,
  BookOpen, User, Image as ImageIcon,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(value: number, currency?: string): string {
  const symbol = currency === 'USD' ? '$' : '\u20BA';
  return `${symbol}${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

export default function AdminGroupClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const { data: gc, isLoading, error } = useQuery({
    queryKey: ['admin-group-class-detail', classId],
    queryFn: () => adminApi.getEducationGroupClassDetail(classId),
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !gc) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl text-center py-20">
        <p className="text-slate-500">Grup dersi bulunamadi.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Geri Don
        </Button>
      </div>
    );
  }

  const fillRate = gc.capacity > 0 ? Math.round((gc.enrolledCount / gc.capacity) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Grup Derslerine Don
        </button>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-slate-800">{gc.title}</h1>
          <StatusBadge status={gc.status} />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Mentor: <span className="font-medium text-slate-700">{gc.mentorName}</span>
          {gc.mentorEmail && <span className="text-slate-400 ml-1">({gc.mentorEmail})</span>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Users className="h-4 w-4" /> Kayitli / Kapasite
          </div>
          <p className="text-2xl font-bold text-slate-800">{gc.enrolledCount} / {gc.capacity}</p>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(fillRate, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign className="h-4 w-4" /> Toplam Gelir
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(gc.totalRevenue, gc.currency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign className="h-4 w-4" /> Kisi Basi Ucret
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(gc.pricePerSeat, gc.currency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Clock className="h-4 w-4" /> Doluluk
          </div>
          <p className="text-2xl font-bold text-slate-800">{fillRate}%</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-400" /> Ders Bilgileri
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Kategori</span>
              <p className="font-medium text-slate-800">{gc.category || '-'}</p>
            </div>
            <div>
              <span className="text-slate-500">Durum</span>
              <p><StatusBadge status={gc.status} /></p>
            </div>
            <div>
              <span className="text-slate-500">Baslangic</span>
              <p className="font-medium text-slate-800">{formatDate(gc.startAt)}</p>
            </div>
            <div>
              <span className="text-slate-500">Bitis</span>
              <p className="font-medium text-slate-800">{formatDate(gc.endAt)}</p>
            </div>
            <div>
              <span className="text-slate-500">Olusturulma</span>
              <p className="font-medium text-slate-800">{formatDate(gc.createdAt)}</p>
            </div>
            <div>
              <span className="text-slate-500">Para Birimi</span>
              <p className="font-medium text-slate-800">{gc.currency}</p>
            </div>
          </div>
          {gc.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Aciklama</span>
              <p className="text-sm text-slate-700 mt-1">{gc.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {gc.coverImageUrl ? (
            <img src={gc.coverImageUrl} alt={gc.title} className="w-full h-48 object-cover rounded-lg mb-3" />
          ) : (
            <div className="w-full h-48 bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">{formatCurrency(gc.pricePerSeat, gc.currency)} / kisi</p>
            <p className="text-xs text-slate-500 mt-1">ID: {gc.id?.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Kayitli Ogrenciler ({gc.enrollments?.length || 0})
        </h2>
        {gc.enrollments && gc.enrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Ogrenci</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">E-posta</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Durum</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Kayit Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {gc.enrollments.map((e: any) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-2 font-medium text-slate-700">{e.studentName}</td>
                    <td className="py-2.5 px-2 text-slate-500">{e.studentEmail}</td>
                    <td className="py-2.5 px-2"><StatusBadge status={e.status} /></td>
                    <td className="py-2.5 px-2 text-slate-500">{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Henuz kayitli ogrenci yok.</p>
        )}
      </div>
    </div>
  );
}
