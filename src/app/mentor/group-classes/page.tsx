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

const STATUS_TABS = [
  { label: 'Aktif', value: 'Published' },
  { label: 'Tamamlanan', value: 'Completed' },
  { label: 'İptal', value: 'Cancelled' },
  { label: 'Tümü', value: '' },
];

export default function MentorGroupClassesPage() {
  const [statusFilter, setStatusFilter] = useState('Published');
  const [showCreate, setShowCreate] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: classes, isLoading } = useMyGroupClasses(statusFilter || undefined);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return <Badge className="bg-green-100 text-green-700">Aktif</Badge>;
      case 'Completed':
        return <Badge className="bg-blue-100 text-blue-700">Tamamlandı</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-700">İptal</Badge>;
      case 'Draft':
        return <Badge variant="outline">Taslak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Grup Dersleri</h1>
          <p className="text-sm text-gray-500 mt-1">Tek seferlik grup derslerinizi yönetin</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Grup Dersi
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Class List */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="space-y-4">
          {classes.map((gc) => (
            <Card key={gc.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">{gc.title}</span>
                      {getStatusBadge(gc.status)}
                      <Badge variant="outline" className="text-xs">
                        {gc.category}
                      </Badge>
                    </div>

                    {gc.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{gc.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(gc.startAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(gc.startAt)} - {formatTime(gc.endAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {gc.enrolledCount}/{gc.capacity} katılımcı
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold">
                      {formatCurrency(gc.pricePerSeat, gc.currency)}
                    </div>
                    <div className="text-xs text-gray-500">kişi başı</div>
                    {gc.enrolledCount > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        Toplam: {formatCurrency(gc.pricePerSeat * gc.enrolledCount, gc.currency)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {gc.status === 'Published' && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-2">
                    <Link href={`/mentor/group-classroom/${gc.id}`}>
                      <Button size="sm" variant="default">
                        Derse Başla
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComplete(gc.id)}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Tamamlandı
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setCancellingId(cancellingId === gc.id ? null : gc.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      İptal Et
                    </Button>
                  </div>
                )}

                {/* Cancel Form */}
                {cancellingId === gc.id && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">
                        İptal edildiğinde tüm kayıtlı öğrencilere otomatik iade yapılır
                      </span>
                    </div>
                    <Input
                      placeholder="İptal sebebi..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!cancelReason.trim() || cancelMutation.isPending}
                        onClick={() => handleCancel(gc.id)}
                      >
                        İptal Et
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
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
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Bu kategoride grup dersiniz bulunmuyor</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Grup Dersini Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateClassDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
