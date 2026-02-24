'use client';

import { useState } from 'react';
import { useMyGroupClasses, useCancelGroupClass, useCompleteGroupClass } from '@/lib/hooks/use-classes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreateClassDialog } from '@/components/features/group-classes/create-class-dialog';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import {
  Plus,
  Users,
  Calendar,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { FeatureGate } from '@/components/feature-gate';
import { Pagination } from '@/components/ui/pagination';

const STATUS_TABS = [
  { label: 'Aktif', value: 'Published' },
  { label: 'Tamamlanan', value: 'Completed' },
  { label: 'İptal', value: 'Cancelled' },
  { label: 'Tümü', value: 'all' },
];

function isClassExpired(gc: { status: string; endAt: string }): boolean {
  return gc.status === 'Expired' || (gc.status === 'Published' && new Date(gc.endAt) < new Date());
}

function MentorGroupClassesContent() {
  const [statusFilter, setStatusFilter] = useState('Published');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: classesData, isLoading } = useMyGroupClasses(statusFilter === 'all' ? undefined : (statusFilter || undefined), page);
  const classes = classesData?.items;
  const cancelMutation = useCancelGroupClass();
  const completeMutation = useCompleteGroupClass();

  const handleCancel = async (classId: string) => {
    if (!cancelReason.trim()) {
      toast.error('İptal sebebi giriniz');
      return;
    }
    try {
      await cancelMutation.mutateAsync({ classId, reason: cancelReason });
      toast.success('Grup dersi iptal edildi');
      setCancellingId(null);
      setCancelReason('');
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] || 'İptal işlemi başarısız');
    }
  };

  const handleComplete = async (classId: string) => {
    try {
      await completeMutation.mutateAsync(classId);
      toast.success('Ders tamamlandı olarak işaretlendi');
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] || 'İşlem başarısız');
    }
  };

  const getStatusBadge = (status: string, gc?: { endAt: string }) => {
    const cls = "text-[10px] px-1.5 py-0";
    // Check for expired class (client-side fallback)
    if (status === 'Expired' || (status === 'Published' && gc && isClassExpired({ status, endAt: gc.endAt }))) {
      return <Badge className={`bg-orange-100 text-orange-700 ${cls}`}>Süresi Doldu</Badge>;
    }
    switch (status) {
      case 'Published':
        return <Badge className={`bg-green-100 text-green-700 ${cls}`}>Aktif</Badge>;
      case 'Completed':
        return <Badge className={`bg-blue-100 text-blue-700 ${cls}`}>Tamamlandı</Badge>;
      case 'Cancelled':
        return <Badge className={`bg-red-100 text-red-700 ${cls}`}>İptal</Badge>;
      case 'Draft':
        return <Badge variant="outline" className={cls}>Taslak</Badge>;
      default:
        return <Badge variant="outline" className={cls}>{status}</Badge>;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Grup Dersleri</h1>
            <p className="text-xs text-gray-500">Tek seferlik grup derslerinizi yönetin</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Yeni Grup Dersi
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Class List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : classes && classes.length > 0 ? (
        <>
        <div className="space-y-3">
          {classes.map((gc) => (
            <Card key={gc.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{gc.title}</span>
                      {getStatusBadge(gc.status, gc)}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {gc.category}
                      </Badge>
                    </div>

                    {gc.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{gc.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(gc.startAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(gc.startAt)} - {formatTime(gc.endAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {gc.enrolledCount}/{gc.capacity}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(gc.pricePerSeat, gc.currency)}
                    </div>
                    <div className="text-[10px] text-gray-400">kişi başı</div>
                    {gc.enrolledCount > 0 && (
                      <div className="text-[10px] text-green-600 font-medium mt-0.5">
                        Toplam: {formatCurrency(gc.pricePerSeat * gc.enrolledCount, gc.currency)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {gc.status === 'Published' && !isClassExpired(gc) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <Link href={`/mentor/group-classroom/${gc.id}`}>
                      <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                        Derse Başla
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleComplete(gc.id)}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Tamamlandı
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setCancellingId(cancellingId === gc.id ? null : gc.id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      İptal Et
                    </Button>
                  </div>
                )}

                {/* Cancel Form */}
                {cancellingId === gc.id && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        İptal edildiğinde tüm kayıtlı öğrencilere otomatik iade yapılır
                      </span>
                    </div>
                    <Input
                      placeholder="İptal sebebi..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="text-sm h-8"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        disabled={!cancelReason.trim() || cancelMutation.isPending}
                        onClick={() => handleCancel(gc.id)}
                      >
                        İptal Et
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          setCancellingId(null);
                          setCancelReason('');
                        }}
                      >
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <Pagination
          page={page}
          totalPages={classesData?.totalPages ?? 1}
          totalCount={classesData?.totalCount ?? 0}
          onPageChange={setPage}
          itemLabel="ders"
        />
        </>
      ) : (
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Bu kategoride grup dersiniz bulunmuyor</h3>
            <p className="text-xs text-gray-500 mb-4">Yeni bir grup dersi oluşturun</p>
            <Button size="sm" className="text-xs" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              İlk Grup Dersini Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateClassDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export default function MentorGroupClassesPage() {
  return (
    <FeatureGate flag="group_classes_enabled">
      <MentorGroupClassesContent />
    </FeatureGate>
  );
}
