'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Video, Clock, TrendingUp, Eye, CheckCircle, AlertCircle, PlayCircle, GraduationCap, ArrowRight, Sparkles, CreditCard, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/lib/hooks/use-bookings';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatDate, formatTime } from '@/lib/utils/format';
import { BookingStatus, UserRole } from '@/lib/types/enums';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface RoomStatus {
  isActive: boolean;
  hostConnected: boolean;
  participantCount: number;
}

export default function StudentDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { data: upcomingBookings } = useBookings(BookingStatus.Confirmed);

  const nextBooking = upcomingBookings?.[0];
  const profileComplete = Boolean(user?.displayName && user?.birthYear && user?.phone);
  const isMentor = user?.roles?.includes(UserRole.Mentor);
  const isStudent = user?.roles?.includes(UserRole.Student);

  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  const checkRoomStatus = useCallback(async () => {
    if (!nextBooking || nextBooking.status !== BookingStatus.Confirmed) return;
    try {
      setCheckingRoom(true);
      const response = await apiClient.get<RoomStatus>(`/video/room/${nextBooking.id}/status`);
      setRoomStatus(response);
    } catch {
      setRoomStatus({ isActive: false, hostConnected: false, participantCount: 0 });
    } finally {
      setCheckingRoom(false);
    }
  }, [nextBooking]);

  useEffect(() => {
    if (!nextBooking) return;
    checkRoomStatus();
    const interval = setInterval(checkRoomStatus, 15000);
    return () => clearInterval(interval);
  }, [nextBooking, checkRoomStatus]);

  const canJoinNow = (): boolean => {
    if (!nextBooking || nextBooking.status !== BookingStatus.Confirmed) return false;
    return roomStatus?.isActive === true;
  };

  const handleJoinClass = () => {
    if (!canJoinNow()) {
      toast.error('Mentor henüz odayı aktifleştirmedi. Lütfen bekleyin.');
      return;
    }
    router.push(`/student/classroom/${nextBooking!.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Gradient Welcome Bar */}
        <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">
                Merhaba, {user?.displayName}!
              </h2>
              <p className="text-teal-100">
                Bugün harika bir gün, hedeflerine bir adım daha yaklaşmanın zamanı!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/public/mentors">
                <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg">
                  Mentor Bul
                </Button>
              </Link>
              <Link href="/auth/onboarding/student">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  {profileComplete ? 'Profili Güncelle' : 'Profili Tamamla'}
                </Button>
              </Link>
            </div>
          </div>
          {!profileComplete && (
            <div className="mt-3 bg-white/10 rounded-lg p-3 text-sm text-teal-100">
              Mentor listesinin görünmesi için profil bilgilerini tamamlaman gerekebilir.
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings?.length || 0}</p>
                  <p className="text-xs text-gray-500">Yaklaşan Dersler</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Toplam Ders Saati</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Aktif Mentorler</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Bu Ay Harcanan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Yaklaşan Dersler</CardTitle>
                <CardDescription>Planlanmış mentorluk seanslarınız</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-teal-200 hover:shadow-sm transition-all">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12 rounded-xl">
                            <AvatarImage src={booking.mentorAvatar ?? undefined} />
                            <AvatarFallback className="rounded-xl bg-gradient-to-br from-teal-400 to-green-500 text-white">
                              {booking.mentorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">{booking.mentorName}</div>
                            <div className="text-sm text-gray-500">{formatDate(booking.startAt, 'PPP')}</div>
                            <div className="text-xs text-gray-400">{formatDate(booking.startAt, 'HH:mm')} - {booking.durationMin} dakika</div>
                          </div>
                        </div>
                        <Link href={`/student/bookings/${booking.id}`}>
                          <Button size="sm" variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">Detay</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-teal-400" />
                    </div>
                    <p className="text-gray-600 mb-4">Henüz planlanmış dersiniz yok</p>
                    <Link href="/public/mentors">
                      <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white">Mentor Bul</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {nextBooking && (
              <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-teal-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-teal-900 text-base">Sonraki Ders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900">{nextBooking.mentorName}</div>
                    <div className="text-sm text-gray-600">{formatDate(nextBooking.startAt, 'PPP')}</div>
                    <div className="text-sm text-gray-500">{formatTime(nextBooking.startAt)} - {nextBooking.durationMin} dk</div>
                    {canJoinNow() ? (
                      <div className="space-y-2 mt-4">
                        <Button className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white" size="sm" onClick={handleJoinClass}>
                          <Video className="w-4 h-4 mr-2" />Derse Katıl
                        </Button>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" /><span className="font-medium">Mentor Hazır</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-4">
                        <Link href={`/student/bookings/${nextBooking.id}`} className="block">
                          <Button variant="outline" className="w-full border-teal-300 text-teal-700 hover:bg-teal-50" size="sm">
                            <Eye className="w-4 h-4 mr-2" />İncele
                          </Button>
                        </Link>
                        {roomStatus !== null && !roomStatus.isActive && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-yellow-600">
                            <AlertCircle className="w-3.5 h-3.5" /><span className="font-medium">Mentor Bekleniyor</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <CardTitle className="text-teal-900 text-base">Video Eğitimler</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Uzman eğitmenlerden video derslerle kendinizi geliştirin.</p>
                <Link href="/student/explore-courses">
                  <Button size="sm" className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white">
                    <GraduationCap className="w-4 h-4 mr-2" />Kursları Keşfet<ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {isStudent && !isMentor && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <CardTitle className="text-amber-900 text-base">Mentor Ol</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Bilgini paylaş, gelir kazan ve diğer öğrencilere yardım et.</p>
                  <Link href="/auth/onboarding/mentor?source=student">
                    <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                      Mentor Olmak İstiyorum<ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-indigo-900 text-base">Grup Dersleri</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">Uzman mentorların canlı grup derslerine katılın.</p>
                <Link href="/student/explore-classes">
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Users className="w-4 h-4 mr-2" />Grup Derslerini Keşfet<ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Hızlı İşlemler</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Link href="/student/explore-courses"><Button variant="outline" className="w-full justify-start text-teal-600 border-teal-200 hover:bg-teal-50"><PlayCircle className="w-4 h-4 mr-2" />Video Eğitimler</Button></Link>
                <Link href="/student/explore-classes"><Button variant="outline" className="w-full justify-start text-indigo-600 border-indigo-200 hover:bg-indigo-50"><Users className="w-4 h-4 mr-2" />Grup Dersleri</Button></Link>
                <Link href="/student/my-classes"><Button variant="outline" className="w-full justify-start text-indigo-600 border-indigo-200 hover:bg-indigo-50"><Calendar className="w-4 h-4 mr-2" />Kayıtlarım</Button></Link>
                <Link href="/student/courses"><Button variant="outline" className="w-full justify-start text-teal-600 border-teal-200 hover:bg-teal-50"><GraduationCap className="w-4 h-4 mr-2" />Kurslarım</Button></Link>
                <Link href="/public/mentors"><Button variant="outline" className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"><Calendar className="w-4 h-4 mr-2" />Yeni Randevu Al</Button></Link>
                <Link href="/student/payments"><Button variant="outline" className="w-full justify-start text-gray-600 border-gray-200 hover:bg-gray-50"><CreditCard className="w-4 h-4 mr-2" />Ödeme Geçmişim</Button></Link>
                <Link href="/student/bookings"><Button variant="outline" className="w-full justify-start text-gray-600 border-gray-200 hover:bg-gray-50"><Clock className="w-4 h-4 mr-2" />Tüm Rezervasyonlar</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
