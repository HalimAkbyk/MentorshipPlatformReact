'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Video, Clock, TrendingUp, Eye, CheckCircle, AlertCircle,
  PlayCircle, GraduationCap, ArrowRight, Sparkles, CreditCard, Users,
  MessageSquare, Settings, Search, BookOpen, ChevronRight, Star,
  UserCircle, Target, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBookings } from '@/lib/hooks/use-bookings';
import { useConversations, useUnreadCount } from '@/lib/hooks/use-messages';
import { useEnrolledCourses } from '@/lib/hooks/use-courses';
import { useMyEnrollments } from '@/lib/hooks/use-classes';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatDate, formatTime, formatRelativeTime } from '@/lib/utils/format';
import { BookingStatus, UserRole } from '@/lib/types/enums';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

/* ──────────────────────────────── Types ──────────────────────────────── */
interface RoomStatus {
  isActive: boolean;
  hostConnected: boolean;
  participantCount: number;
}

/* ──────────────────────────────── Page ───────────────────────────────── */
export default function StudentDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  /* ── Data hooks ── */
  const { data: upcomingBookings } = useBookings(BookingStatus.Confirmed);
  const { data: conversations } = useConversations();
  const { data: unreadData } = useUnreadCount();
  const { data: enrolledCourses } = useEnrolledCourses(1, 3);
  const { data: enrollments } = useMyEnrollments(1, 3);

  /* ── Derived state ── */
  const nextBooking = upcomingBookings?.[0];
  const profileComplete = Boolean(user?.displayName && user?.birthYear && user?.phone);
  const isMentor = user?.roles?.includes(UserRole.Mentor);
  const isStudent = user?.roles?.includes(UserRole.Student);
  const hasBookings = upcomingBookings && upcomingBookings.length > 0;
  const totalUnread = unreadData?.totalUnread ?? 0;
  const activeCourses = enrolledCourses?.items ?? [];
  const activeEnrollments = enrollments?.items ?? [];
  const recentConversations = (conversations ?? []).slice(0, 3);

  /* ── Room status polling ── */
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);

  const checkRoomStatus = useCallback(async () => {
    if (!nextBooking || nextBooking.status !== BookingStatus.Confirmed) return;
    try {
      const response = await apiClient.get<RoomStatus>(`/video/room/${nextBooking.id}/status`);
      setRoomStatus(response);
    } catch {
      setRoomStatus({ isActive: false, hostConnected: false, participantCount: 0 });
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
      toast.error('Mentor henuz odayi aktifleshtirmedi. Lutfen bekleyin.');
      return;
    }
    router.push(`/student/classroom/${nextBooking!.id}`);
  };

  /* ── Profile completion ── */
  const profileSteps = [
    { done: Boolean(user?.displayName), label: 'Isim' },
    { done: Boolean(user?.birthYear), label: 'Dogum Yili' },
    { done: Boolean(user?.phone), label: 'Telefon' },
    { done: Boolean(user?.avatarUrl), label: 'Fotograf' },
  ];
  const completedSteps = profileSteps.filter((s) => s.done).length;
  const profilePercent = Math.round((completedSteps / profileSteps.length) * 100);

  /* ── Context text ── */
  const getContextText = () => {
    if (hasBookings) {
      const count = upcomingBookings!.length;
      return `${count} yaklasan dersin var. Hazir misin?`;
    }
    return 'Hadi ilk dersini planla!';
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ═══════════════════ COMPACT HERO BAR ═══════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl px-6 py-4 mb-6 text-white"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-10 h-10 border-2 border-white/30 flex-shrink-0">
                <AvatarImage src={user?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                  {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">Merhaba, {user?.displayName}!</h1>
                <p className="text-teal-100 text-sm truncate">{getContextText()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canJoinNow() ? (
                <Button
                  onClick={handleJoinClass}
                  className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg animate-pulse"
                  size="sm"
                >
                  <Video className="w-4 h-4 mr-1.5" />
                  Derse Katil
                </Button>
              ) : (
                <Link href="/public/mentors">
                  <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg" size="sm">
                    <Search className="w-4 h-4 mr-1.5" />
                    Mentor Bul
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════ 3-COLUMN LAYOUT ═══════════════════ */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ─────────── LEFT PANEL ─────────── */}
          <aside className="w-full lg:w-60 xl:w-64 flex-shrink-0 space-y-4">

            {/* Profile Mini Card */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-teal-50 to-green-50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-green-500 text-white font-semibold">
                        {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Profile ring */}
                    <svg className="absolute -inset-0.5 w-[52px] h-[52px]" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="24" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                      <circle
                        cx="26" cy="26" r="24" fill="none" stroke="#14b8a6" strokeWidth="2"
                        strokeDasharray={`${(profilePercent / 100) * 150.8} 150.8`}
                        strokeLinecap="round"
                        transform="rotate(-90 26 26)"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">%{profilePercent} tamamlandi</p>
                  </div>
                </div>
                {!profileComplete && (
                  <Link href="/auth/onboarding/student">
                    <Button variant="outline" size="sm" className="w-full text-xs border-teal-200 text-teal-700 hover:bg-teal-50">
                      <UserCircle className="w-3.5 h-3.5 mr-1" />
                      Profili Tamamla
                    </Button>
                  </Link>
                )}
              </div>
            </Card>

            {/* Quick Navigation */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-2">
                <nav className="space-y-0.5">
                  {[
                    { href: '/public/mentors', icon: Search, label: 'Yeni Randevu Al', color: 'text-teal-600', primary: true },
                    { href: '/student/courses', icon: BookOpen, label: 'Kurslarim', color: 'text-green-600' },
                    { href: '/student/my-classes', icon: Users, label: 'Grup Derslerim', color: 'text-indigo-600' },
                    { href: '/student/bookings', icon: Calendar, label: 'Rezervasyonlarim', color: 'text-blue-600' },
                    { href: '/student/payments', icon: CreditCard, label: 'Odemelerim', color: 'text-purple-600' },
                    { href: '/student/settings', icon: Settings, label: 'Ayarlar', color: 'text-gray-500' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        item.primary
                          ? 'bg-teal-50 text-teal-700 font-medium hover:bg-teal-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="truncate">{item.label}</span>
                      {item.primary && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-400" />}
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Compact Stats */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Calendar, value: upcomingBookings?.length ?? 0, label: 'Yaklasan', color: 'text-teal-600 bg-teal-50' },
                    { icon: MessageSquare, value: totalUnread, label: 'Mesaj', color: 'text-blue-600 bg-blue-50' },
                    { icon: BookOpen, value: activeCourses.length, label: 'Kurs', color: 'text-green-600 bg-green-50' },
                    { icon: Users, value: activeEnrollments.length, label: 'Grup', color: 'text-indigo-600 bg-indigo-50' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 leading-none">{stat.value}</p>
                        <p className="text-[10px] text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* ─────────── CENTER PANEL (Main Content) ─────────── */}
          <main className="flex-1 min-w-0 space-y-6">
            {hasBookings ? (
              /* ── Upcoming Sessions ── */
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Yaklasan Dersler</h2>
                  <Link href="/student/bookings" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    Tumunu Gor
                  </Link>
                </div>
                <div className="space-y-3">
                  {upcomingBookings!.map((booking) => {
                    const isNext = booking.id === nextBooking?.id;
                    const roomReady = isNext && roomStatus?.isActive;
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className={`border shadow-sm transition-all hover:shadow-md ${
                          roomReady ? 'border-green-300 bg-green-50/30' : 'border-gray-100 hover:border-teal-200'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                                <AvatarImage src={booking.mentorAvatar ?? undefined} />
                                <AvatarFallback className="rounded-xl bg-gradient-to-br from-teal-400 to-green-500 text-white">
                                  {booking.mentorName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 truncate">{booking.mentorName}</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-200 text-teal-700 flex-shrink-0">
                                    Birebir
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(booking.startAt, 'dd MMM')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDate(booking.startAt, 'HH:mm')} - {booking.durationMin} dk
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {roomReady ? (
                                  <Button
                                    size="sm"
                                    onClick={handleJoinClass}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm"
                                  >
                                    <Video className="w-4 h-4 mr-1" />Katil
                                  </Button>
                                ) : (
                                  <Link href={`/student/bookings/${booking.id}`}>
                                    <Button size="sm" variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
                                      Detay
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                            {isNext && roomStatus !== null && !roomStatus.isActive && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Mentor henuz baglanmadi</span>
                              </div>
                            )}
                            {isNext && roomReady && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="font-medium">Mentor hazir — Derse katilabilirsin</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ) : (
              /* ── Empty State: Onboarding Steps ── */
              <section>
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-teal-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Baslamaya Hazir misin?</h2>
                      <p className="text-gray-500 text-sm">Ilk dersini almak icin bu adimlari takip et</p>
                    </div>

                    <div className="space-y-3">
                      {/* Step 1: Profile */}
                      <Link href="/auth/onboarding/student" className="block">
                        <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          profileComplete
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-teal-200 bg-teal-50/30 hover:border-teal-300 hover:shadow-sm'
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            profileComplete ? 'bg-green-100' : 'bg-teal-100'
                          }`}>
                            {profileComplete ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <UserCircle className="w-5 h-5 text-teal-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">Profilini Tamamla</p>
                            <p className="text-xs text-gray-500">Isim, telefon ve fotograf bilgilerini ekle</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Link>

                      {/* Step 2: Find Mentor */}
                      <Link href="/public/mentors" className="block">
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-teal-200 bg-teal-50/30 hover:border-teal-300 hover:shadow-sm transition-all">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                            <Search className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">Bir Mentor Bul</p>
                            <p className="text-xs text-gray-500">Ilgi alanina uygun mentoru keshet</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Link>

                      {/* Step 3: Book */}
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 opacity-60">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-500 text-sm">Ilk Dersini Al</p>
                          <p className="text-xs text-gray-400">Mentor bulduktan sonra ders planla</p>
                        </div>
                      </div>
                    </div>

                    {/* Primary CTA */}
                    <div className="mt-6 text-center">
                      <Link href="/public/mentors">
                        <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white px-8 shadow-lg shadow-teal-200">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Mentorleri Keshet
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Explore section for new users */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <Link href="/student/explore-courses">
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <PlayCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Video Kurslar</p>
                          <p className="text-xs text-gray-500">Kendi hizinda ogren</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/student/explore-classes">
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">Grup Dersleri</p>
                          <p className="text-xs text-gray-500">Canli derslere katil</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </section>
            )}

            {/* ── Continue Learning (only if has courses) ── */}
            {activeCourses.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Ogrenmeye Devam Et</h2>
                  <Link href="/student/courses" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    Tumunu Gor
                  </Link>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeCourses.slice(0, 3).map((course) => (
                    <Link key={course.courseId} href={`/student/courses/${course.courseId}/learn`}>
                      <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer">
                        <div className="relative h-28 bg-gradient-to-br from-teal-100 to-green-100 overflow-hidden">
                          {course.coverImageUrl ? (
                            <img
                              src={course.coverImageUrl}
                              alt={course.courseTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <GraduationCap className="w-10 h-10 text-teal-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="w-5 h-5 text-teal-600" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">{course.courseTitle}</p>
                          <p className="text-xs text-gray-500 mb-2">{course.mentorName}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={course.completionPercentage} className="h-1.5 flex-1" />
                            <span className="text-xs text-gray-500 flex-shrink-0">{Math.round(course.completionPercentage)}%</span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                            <span>{course.completedLectures}/{course.totalLectures} ders</span>
                            <span className="text-teal-600 font-medium">Devam Et →</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ─────────── RIGHT PANEL ─────────── */}
          <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 space-y-4">

            {/* Messages Widget */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">Mesajlar</CardTitle>
                    {totalUnread > 0 && (
                      <span className="w-5 h-5 bg-teal-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </div>
                  <Link href="/student/messages" className="text-xs text-teal-600 hover:text-teal-700">
                    Tumunu Gor
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                {recentConversations.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {recentConversations.map((conv) => (
                      <Link
                        key={conv.bookingId}
                        href="/student/messages"
                        className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={conv.otherUserAvatar ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-teal-400 to-green-500 text-white text-xs">
                              {conv.otherUserName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-900 truncate">{conv.otherUserName}</span>
                            {conv.lastMessageAt && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                                {formatRelativeTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            {conv.lastMessageContent || conv.offeringTitle}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 bg-teal-500 text-white text-[9px] rounded-full flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Henuz mesajin yok</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Group Classes */}
            {activeEnrollments.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Grup Derslerim</CardTitle>
                    <Link href="/student/my-classes" className="text-xs text-teal-600 hover:text-teal-700">
                      Tumunu Gor
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {activeEnrollments.slice(0, 2).map((enrollment) => (
                    <Link key={enrollment.enrollmentId} href={`/student/group-classes/${enrollment.classId}`}>
                      <div className="p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                        <p className="font-medium text-gray-900 text-xs line-clamp-1">{enrollment.classTitle}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(enrollment.startAt, 'dd MMM HH:mm')}
                          </span>
                          <span>•</span>
                          <span>{enrollment.mentorName}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Explore Group Classes CTA (if no enrollments) */}
            {activeEnrollments.length === 0 && (
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="font-semibold text-indigo-900 text-sm">Grup Dersleri</p>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Canli grup derslerine katil, birlikte ogren.</p>
                  <Link href="/student/explore-classes">
                    <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                      Kesfet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Become Mentor CTA */}
            {isStudent && !isMentor && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="font-semibold text-amber-900 text-sm">Mentor Ol</p>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Bilgini paylas, gelir kazan.</p>
                  <Link href="/auth/onboarding/mentor?source=student">
                    <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs">
                      Basvur <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Explore Courses CTA */}
            {activeCourses.length === 0 && (
              <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-teal-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center">
                      <PlayCircle className="w-4 h-4 text-teal-600" />
                    </div>
                    <p className="font-semibold text-teal-900 text-sm">Video Kurslar</p>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Kendi hizinda video derslerle ogren.</p>
                  <Link href="/student/explore-courses">
                    <Button size="sm" className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white text-xs">
                      Kesfet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
