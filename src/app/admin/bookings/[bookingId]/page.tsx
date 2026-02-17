'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, BookOpen, User, Clock, Calendar, DollarSign,
  Video, MessageSquare, AlertTriangle, RefreshCw,
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

export default function AdminBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['admin-booking-detail', bookingId],
    queryFn: () => adminApi.getEducationBookingDetail(bookingId),
    enabled: !!bookingId,
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

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl text-center py-20">
        <p className="text-slate-500">Ders bulunamadi.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Geri Don
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Derslere Don
        </button>
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-indigo-500" />
          <h1 className="text-2xl font-bold text-slate-800">{booking.offeringTitle}</h1>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Booking ID: <span className="font-mono text-xs">{booking.id?.slice(0, 8)}...</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Clock className="h-4 w-4" /> Sure
          </div>
          <p className="text-2xl font-bold text-slate-800">{booking.durationMin} dk</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign className="h-4 w-4" /> Ucret
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(booking.offeringPrice, booking.offeringCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <MessageSquare className="h-4 w-4" /> Mesajlar
          </div>
          <p className="text-2xl font-bold text-slate-800">{booking.messageCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <RefreshCw className="h-4 w-4" /> Erteleme
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {(booking.rescheduleCountStudent || 0) + (booking.rescheduleCountMentor || 0)}
          </p>
        </div>
      </div>

      {/* Main info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mentor & Student */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-slate-400" /> Katilimcilar
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">M</div>
              <div>
                <p className="font-medium text-slate-800">{booking.mentorName}</p>
                <p className="text-sm text-slate-500">{booking.mentorEmail}</p>
                <p className="text-xs text-slate-400 mt-1">Mentor</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">O</div>
              <div>
                <p className="font-medium text-slate-800">{booking.studentName}</p>
                <p className="text-sm text-slate-500">{booking.studentEmail}</p>
                <p className="text-xs text-slate-400 mt-1">Ogrenci</p>
              </div>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-400" /> Ders Bilgileri
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Baslangic</span>
              <p className="font-medium text-slate-800">{formatDate(booking.startAt)}</p>
            </div>
            <div>
              <span className="text-slate-500">Bitis</span>
              <p className="font-medium text-slate-800">{formatDate(booking.endAt)}</p>
            </div>
            <div>
              <span className="text-slate-500">Paket</span>
              <p className="font-medium text-slate-800">{booking.offeringTitle}</p>
            </div>
            <div>
              <span className="text-slate-500">Durum</span>
              <p><StatusBadge status={booking.status} /></p>
            </div>
            <div>
              <span className="text-slate-500">Olusturulma</span>
              <p className="font-medium text-slate-800">{formatDate(booking.createdAt)}</p>
            </div>
            {booking.rescheduleCountStudent > 0 && (
              <div>
                <span className="text-slate-500">Ogrenci Erteleme</span>
                <p className="font-medium text-slate-800">{booking.rescheduleCountStudent}</p>
              </div>
            )}
            {booking.rescheduleCountMentor > 0 && (
              <div>
                <span className="text-slate-500">Mentor Erteleme</span>
                <p className="font-medium text-slate-800">{booking.rescheduleCountMentor}</p>
              </div>
            )}
          </div>
          {booking.cancellationReason && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
                <AlertTriangle className="h-4 w-4" /> Iptal Sebebi
              </div>
              <p className="text-sm text-red-700">{booking.cancellationReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order / Payment */}
      {booking.order && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-slate-400" /> Odeme Bilgisi
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Toplam Tutar</span>
              <p className="font-medium text-slate-800">{formatCurrency(booking.order.amountTotal, booking.offeringCurrency)}</p>
            </div>
            <div>
              <span className="text-slate-500">Odeme Durumu</span>
              <p><StatusBadge status={booking.order.status} /></p>
            </div>
            <div>
              <span className="text-slate-500">Siparis Tarihi</span>
              <p className="font-medium text-slate-800">{formatDate(booking.order.createdAt)}</p>
            </div>
            <div>
              <span className="text-slate-500">Siparis ID</span>
              <p className="font-mono text-xs text-slate-600">{booking.order.id?.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Session */}
      {booking.session && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Video className="h-5 w-5 text-slate-400" /> Video Oturum
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Oda Adi</span>
              <p className="font-mono text-xs text-slate-700">{booking.session.roomName}</p>
            </div>
            <div>
              <span className="text-slate-500">Durum</span>
              <p><StatusBadge status={booking.session.status} /></p>
            </div>
            <div>
              <span className="text-slate-500">Olusturulma</span>
              <p className="font-medium text-slate-800">{formatDate(booking.session.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
