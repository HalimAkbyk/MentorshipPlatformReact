'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Video, Clock, TrendingUp, Eye, CheckCircle, AlertCircle, PlayCircle, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
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

  // Check room status for the next booking
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
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link href="/public/mentors">
              <Button>Mentor Bul</Button>
            </Link>
            <Avatar>
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>{user?.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-heading mb-2">
            Merhaba, {user?.displayName}!
          </h2>
          <p className="text-gray-600">
            Bugün harika bir gün, hedeflerine bir adım daha yaklaşmanın zamanı!
          </p>
        </div>
        {/* Profil karti */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profil</CardTitle>
            <Link href="/auth/onboarding/student">
              <Button variant={profileComplete ? 'outline' : 'default'}>
                {profileComplete ? 'Profili Güncelle' : 'Profili Tamamla'}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-1">
            <div><b>Ad:</b> {user?.displayName || '-'}</div>
            <div><b>Telefon:</b> {user?.phone || '-'}</div>
            <div><b>Doğum yılı:</b> {user?.birthYear || '-'}</div>
            {!profileComplete && (
              <div className="text-xs text-amber-700 mt-2">
                Mentor listesinin görünmesi için profil bilgilerini tamamlaman gerekebilir.
              </div>
            )}
          </CardContent>
        </Card>
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yaklaşan Dersler</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Ders Saati</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-600">saat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Mentorler</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Harcanan</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Yaklaşan Dersler</CardTitle>
                <CardDescription>Planlanmış mentorluk seanslarınız</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={booking.mentorAvatar??undefined} />
                            <AvatarFallback>
                              {booking.mentorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{booking.mentorName}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(booking.startAt, 'PPP')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(booking.startAt, 'HH:mm')} - {booking.durationMin} dakika
                            </div>
                          </div>
                        </div>
                        <Link href={`/student/bookings/${booking.id}`}>
                          <Button size="sm">Detay</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Henüz planlanmış dersiniz yok</p>
                    <Link href="/public/mentors">
                      <Button>Mentor Bul</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Next Session Widget */}
            {nextBooking && (
              <Card className="bg-primary-50 border-primary-200">
                <CardHeader>
                  <CardTitle className="text-primary-900">Sonraki Ders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-semibold">{nextBooking.mentorName}</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(nextBooking.startAt, 'PPP')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(nextBooking.startAt)} - {nextBooking.durationMin} dk
                    </div>

                    {/* Conditional Button: Derse Katil or Incele */}
                    {canJoinNow() ? (
                      <div className="space-y-2 mt-4">
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={handleJoinClass}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Derse Katıl
                        </Button>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="font-medium">Mentor Hazır</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-4">
                        <Link href={`/student/bookings/${nextBooking.id}`} className="block">
                          <Button variant="outline" className="w-full" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            İncele
                          </Button>
                        </Link>
                        {roomStatus !== null && !roomStatus.isActive && (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-yellow-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="font-medium">Mentor Bekleniyor</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Eğitimler CTA */}
            <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-primary-600" />
                  </div>
                  <CardTitle className="text-primary-900 text-base">Video Eğitimler</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Uzman eğitmenlerden video derslerle kendinizi geliştirin.
                </p>
                <Link href="/student/explore-courses">
                  <Button size="sm" className="w-full bg-primary-600 hover:bg-primary-700">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Kursları Keşfet
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Mentor Ol CTA - only for Student-only users */}
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
                  <p className="text-sm text-gray-600 mb-3">
                    Bilgini paylaş, gelir kazan ve diğer öğrencilere yardım et.
                  </p>
                  <Link href="/auth/onboarding/mentor?source=student">
                    <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                      Mentor Olmak İstiyorum
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/student/explore-courses">
                  <Button variant="outline" className="w-full justify-start text-primary-600 border-primary-200 hover:bg-primary-50">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Video Eğitimler
                  </Button>
                </Link>
                <Link href="/student/courses">
                  <Button variant="outline" className="w-full justify-start">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Kurslarım
                  </Button>
                </Link>
                <Link href="/public/mentors">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Yeni Randevu Al
                  </Button>
                </Link>
                <Link href="/student/bookings">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    Tüm Rezervasyonlar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
