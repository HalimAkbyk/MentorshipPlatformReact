'use client';

import { useState } from 'react';
import { useMyEnrollments, useCancelEnrollment } from '@/lib/hooks/use-classes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  Clock,
  XCircle,
  AlertCircle,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/pagination';

export default function MyClassesPage() {
  const [page, setPage] = useState(1);
  const { data: enrollmentsData, isLoading } = useMyEnrollments(page);
  const enrollments = enrollmentsData?.items;
  const cancelMutation = useCancelEnrollment();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async (enrollmentId: string) => {
    if (!cancelReason.trim()) {
      toast.error('İptal sebebi giriniz');
      return;
    }
    try {
      await cancelMutation.mutateAsync({ enrollmentId, reason: cancelReason });
      toast.success('Kayıt iptal edildi');
      setCancellingId(null);
      setCancelReason('');
    } catch (err: any) {
      toast.error(err?.response?.data?.errors?.[0] || 'İptal işlemi başarısız');
    }
  };

  const getStatusBadge = (status: string) => {
    const cls = "text-[10px] px-1.5 py-0";
    switch (status) {
      case 'PendingPayment':
        return <Badge className={`bg-yellow-100 text-yellow-700 ${cls}`}>Ödeme Bekliyor</Badge>;
      case 'Confirmed':
        return <Badge className={`bg-green-100 text-green-700 ${cls}`}>Onaylandı</Badge>;
      case 'Cancelled':
        return <Badge className={`bg-red-100 text-red-700 ${cls}`}>İptal</Badge>;
      case 'Attended':
        return <Badge className={`bg-blue-100 text-blue-700 ${cls}`}>Katıldı</Badge>;
      case 'Refunded':
        return <Badge className={`bg-orange-100 text-orange-700 ${cls}`}>İade Edildi</Badge>;
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

  const getRefundInfo = (startAt: string) => {
    const hoursUntil = (new Date(startAt).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil >= 24) return { text: '%100 iade', color: 'text-green-600' };
    if (hoursUntil >= 2) return { text: '%50 iade', color: 'text-yellow-600' };
    return { text: 'İade yok', color: 'text-red-600' };
  };

  const canJoin = (enrollment: typeof enrollments extends (infer T)[] | undefined ? T : never) => {
    const isActiveEnrollment = enrollment.enrollmentStatus === 'Confirmed' || enrollment.enrollmentStatus === 'Attended';
    const isClassActive = enrollment.classStatus === 'Published';
    const isNotExpired = new Date(enrollment.endAt) > new Date();
    return isActiveEnrollment && isClassActive && isNotExpired;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Grup Derslerim</h1>
            <p className="text-xs text-gray-500">Kayıt olduğunuz grup dersleri</p>
          </div>
        </div>
        <Link href="/student/explore-classes">
          <Button size="sm" variant="outline" className="text-xs">Yeni Ders Bul</Button>
        </Link>
      </div>

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
      ) : enrollments && enrollments.length > 0 ? (
        <>
          <div className="space-y-3">
            {enrollments.map((enrollment) => {
              const refundInfo = getRefundInfo(enrollment.startAt);
              return (
                <Card key={enrollment.enrollmentId} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900">{enrollment.classTitle}</span>
                          {getStatusBadge(enrollment.enrollmentStatus)}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{enrollment.category}</Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5 rounded-lg">
                            <AvatarImage src={enrollment.mentorAvatar ?? undefined} />
                            <AvatarFallback className="rounded-lg text-[8px] bg-gradient-to-br from-teal-400 to-green-500 text-white">
                              {enrollment.mentorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-500">{enrollment.mentorName}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(enrollment.startAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(enrollment.startAt)} - {formatTime(enrollment.endAt)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(enrollment.pricePerSeat, enrollment.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Actions for active enrollments */}
                    {(enrollment.enrollmentStatus === 'Confirmed' || enrollment.enrollmentStatus === 'Attended') && enrollment.classStatus !== 'Cancelled' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                        {canJoin(enrollment) && (
                          <Link href={`/student/group-classroom/${enrollment.classId}`}>
                            <Button size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                              <Video className="w-3.5 h-3.5 mr-1" />
                              Derse Katıl
                            </Button>
                          </Link>
                        )}
                        {enrollment.enrollmentStatus === 'Confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() =>
                                setCancellingId(
                                  cancellingId === enrollment.enrollmentId ? null : enrollment.enrollmentId
                                )
                              }
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              İptal Et
                            </Button>
                            <span className={`text-[10px] ${refundInfo.color}`}>{refundInfo.text}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Cancel Form */}
                    {cancellingId === enrollment.enrollmentId && (
                      <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-red-700">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            İptal politikası: {refundInfo.text}
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
                            onClick={() => handleCancel(enrollment.enrollmentId)}
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
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={enrollmentsData?.totalPages ?? 1}
            totalCount={enrollmentsData?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="kayıt"
          />
        </>
      ) : (
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Henüz kayıtlı grup dersiniz yok</h3>
            <p className="text-xs text-gray-500 mb-4">Grup derslerini keşfedip kayıt olun</p>
            <Link href="/student/explore-classes">
              <Button size="sm" className="text-xs">Grup Dersi Keşfet</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
