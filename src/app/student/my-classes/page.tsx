'use client';

import { useState } from 'react';
import { useMyEnrollments, useCancelEnrollment } from '@/lib/hooks/use-classes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    switch (status) {
      case 'PendingPayment':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Ödeme Bekliyor</Badge>;
      case 'Confirmed':
        return <Badge className="bg-green-100 text-green-700 text-xs">Onaylandı</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-700 text-xs">İptal</Badge>;
      case 'Attended':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Katıldı</Badge>;
      case 'Refunded':
        return <Badge className="bg-orange-100 text-orange-700 text-xs">İade Edildi</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Grup Derslerim</h1>
          <p className="text-sm text-gray-500 mt-1">Kayıt olduğunuz grup dersleri</p>
        </div>
        <Link href="/student/explore-classes">
          <Button variant="outline">Yeni Ders Bul</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : enrollments && enrollments.length > 0 ? (
        <>
          <div className="space-y-4">
            {enrollments.map((enrollment) => {
              const refundInfo = getRefundInfo(enrollment.startAt);
              return (
                <Card key={enrollment.enrollmentId}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{enrollment.classTitle}</span>
                          {getStatusBadge(enrollment.enrollmentStatus)}
                          <Badge variant="outline" className="text-xs">{enrollment.category}</Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={enrollment.mentorAvatar ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {enrollment.mentorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">{enrollment.mentorName}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateTime(enrollment.startAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(enrollment.startAt)} - {formatTime(enrollment.endAt)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">
                          {formatCurrency(enrollment.pricePerSeat, enrollment.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Actions for active enrollments */}
                    {(enrollment.enrollmentStatus === 'Confirmed' || enrollment.enrollmentStatus === 'Attended') && enrollment.classStatus !== 'Cancelled' && (
                      <div className="mt-4 pt-3 border-t flex items-center gap-2">
                        {canJoin(enrollment) && (
                          <Link href={`/student/group-classroom/${enrollment.classId}`}>
                            <Button size="sm">
                              <Video className="w-4 h-4 mr-1" />
                              Derse Katıl
                            </Button>
                          </Link>
                        )}
                        {enrollment.enrollmentStatus === 'Confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() =>
                                setCancellingId(
                                  cancellingId === enrollment.enrollmentId ? null : enrollment.enrollmentId
                                )
                              }
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              İptal Et
                            </Button>
                            <span className={`text-xs ${refundInfo.color}`}>{refundInfo.text}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Cancel Form */}
                    {cancellingId === enrollment.enrollmentId && (
                      <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">
                            İptal politikası: {refundInfo.text}
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
                            onClick={() => handleCancel(enrollment.enrollmentId)}
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
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={enrollmentsData?.totalPages ?? 1}
            totalCount={enrollmentsData?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="kayit"
          />
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Henüz kayıtlı grup dersiniz yok</p>
            <Link href="/student/explore-classes">
              <Button className="mt-4">Grup Dersi Keşfet</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
