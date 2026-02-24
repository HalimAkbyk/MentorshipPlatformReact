'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar, Video, Clock, CheckCircle, AlertCircle,
  PlayCircle, GraduationCap, ArrowRight, Sparkles, CreditCard, Users,
  MessageSquare, Settings, Search, BookOpen, ChevronRight,
  UserCircle, Target
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
import { formatDate, formatRelativeTime } from '@/lib/utils/format';
import { BookingStatus } from '@/lib/types/enums';
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
  const { data: confirmedData, isLoading: loadingBookings } = useBookings(BookingStatus.Confirmed);
  const { data: allBookingsData, isLoading: loadingAllBookings } = useBookings(undefined, 1, 1); // status=undefined → tüm bookings, sadece totalCount için
  const { data: conversations } = useConversations();
  const { data: unreadData } = useUnreadCount();
  const { data: enrolledCourses, isLoading: loadingCourses } = useEnrolledCourses(1, 3);
  const { data: enrollments, isLoading: loadingEnrollments } = useMyEnrollments(1, 3);

  /* ── Data still loading? (prevents onboarding flash) ── */
  const dataLoading = loadingAllBookings || loadingCourses || loadingEnrollments;

  /* ── Derived state ── */
  const upcomingBookings = confirmedData?.items ?? [];
  const nextBooking = upcomingBookings[0];
  const profileComplete = Boolean(user?.displayName && user?.birthYear && user?.phone);
  const hasBookings = upcomingBookings.length > 0;
  const totalUnread = unreadData?.totalUnread ?? 0;
  const activeCourses = enrolledCourses?.items ?? [];
  const activeEnrollments = enrollments?.items ?? [];
  const recentConversations = (conversations ?? []).slice(0, 3);
  const totalBookingsEver = allBookingsData?.totalCount ?? 0;

  /* Determine if user has ANY purchase history (any status booking, any enrollment, any course) */
  const hasAnyPurchase = useMemo(() => {
    return totalBookingsEver > 0 || activeCourses.length > 0 || activeEnrollments.length > 0;
  }, [totalBookingsEver, activeCourses, activeEnrollments]);

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
    if (!profileComplete) return 'Profilini tamamlayarak basla!';
    if (hasBookings) {
      const count = upcomingBookings.length;
      return `${count} yaklasan dersin var. Hazir misin?`;
    }
    return 'Hadi ilk dersini planla!';
  };

  /* ── Hero CTA logic ── */
  const getHeroCTA = () => {
    if (canJoinNow()) {
      return (
        <Button
          onClick={handleJoinClass}
          className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg animate-pulse"
          size="sm"
        >
          <Video className="w-4 h-4 mr-1.5" />
          Derse Katil
        </Button>
      );
    }
    if (!profileComplete) {
      return (
        <Link href="/auth/onboarding/student">
          <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg" size="sm">
            <UserCircle className="w-4 h-4 mr-1.5" />
            Profili Tamamla
          </Button>
        </Link>
      );
    }
    return (
      <Link href="/public/mentors">
        <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg" size="sm">
          <Search className="w-4 h-4 mr-1.5" />
          Mentor Bul
        </Button>
      </Link>
    );
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
              {getHeroCTA()}
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
                    { icon: Calendar, value: upcomingBookings.length, label: 'Yaklasan', color: 'text-teal-600 bg-teal-50' },
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

            {dataLoading ? (
              /* ══════ SKELETON LOADING STATE ══════ */
              <>
                {[1, 2, 3].map((i) => (
                  <section key={i}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-200 animate-pulse" />
                      <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-3">
                      {[1, 2, 3].map((j) => (
                        <Card key={j} className="min-w-[280px] flex-1 border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                              </div>
                            </div>
                            <div className="h-8 w-full bg-gray-100 rounded mt-3 animate-pulse" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                ))}
              </>
            ) : hasAnyPurchase ? (
              /* ══════ DYNAMIC HORIZONTAL BARS ══════ */
              <>
                {/* ── BAR 1: Birebir Randevular ── */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-teal-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Birebir Randevular</h2>
                    </div>
                    <Link href="/student/bookings" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                      Tumunu Gor
                    </Link>
                  </div>

                  {upcomingBookings.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {upcomingBookings.slice(0, 3).map((booking) => {
                        const isNext = booking.id === nextBooking?.id;
                        const roomReady = isNext && roomStatus?.isActive;
                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="min-w-[280px] flex-1"
                          >
                            <Card className={`border shadow-sm transition-all hover:shadow-md ${
                              roomReady ? 'border-green-300 bg-green-50/30' : 'border-gray-100 hover:border-teal-200'
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 rounded-xl flex-shrink-0">
                                    <AvatarImage src={booking.mentorAvatar ?? undefined} />
                                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-teal-400 to-green-500 text-white text-sm">
                                      {booking.mentorName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{booking.mentorName}</p>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                      <span className="flex items-center gap-0.5">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(booking.startAt, 'dd MMM')}
                                      </span>
                                      <span className="flex items-center gap-0.5">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(booking.startAt, 'HH:mm')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  {roomReady ? (
                                    <Button
                                      size="sm"
                                      onClick={handleJoinClass}
                                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm text-xs"
                                    >
                                      <Video className="w-3.5 h-3.5 mr-1" />Derse Katil
                                    </Button>
                                  ) : (
                                    <Link href={`/student/bookings/${booking.id}`}>
                                      <Button size="sm" variant="outline" className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 text-xs">
                                        Detay
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                                {isNext && roomStatus !== null && !roomStatus.isActive && (
                                  <div className="flex items-center gap-1 mt-2 text-[11px] text-yellow-600">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>Mentor henuz baglanmadi</span>
                                  </div>
                                )}
                                {isNext && roomReady && (
                                  <div className="flex items-center gap-1 mt-2 text-[11px] text-green-600">
                                    <CheckCircle className="w-3 h-3" />
                                    <span className="font-medium">Mentor hazir</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* No upcoming bookings → link to find mentors */
                    <Card className="border border-dashed border-teal-200 bg-teal-50/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                            <Search className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">Yaklasan randevun yok</p>
                            <p className="text-xs text-gray-500">Yeni bir mentor bul ve ders planla</p>
                          </div>
                        </div>
                        <Link href="/public/mentors">
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                            Mentor Bul <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </section>

                {/* ── BAR 2: Grup Dersleri ── */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Grup Dersleri</h2>
                    </div>
                    <Link href="/student/my-classes" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Tumunu Gor
                    </Link>
                  </div>

                  {activeEnrollments.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {activeEnrollments.slice(0, 3).map((enrollment) => (
                        <Link key={enrollment.enrollmentId} href={`/student/group-classes/${enrollment.classId}`} className="min-w-[280px] flex-1">
                          <Card className="border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all h-full">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 rounded-xl flex-shrink-0">
                                  <AvatarImage src={enrollment.mentorAvatar ?? undefined} />
                                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm">
                                    {enrollment.mentorName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{enrollment.classTitle}</p>
                                  <p className="text-xs text-gray-500 truncate">{enrollment.mentorName}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-200 text-indigo-700">
                                  {enrollment.category}
                                </Badge>
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(enrollment.startAt, 'dd MMM HH:mm')}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    /* No group classes → link to explore */
                    <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">Grup derslerine goz at</p>
                            <p className="text-xs text-gray-500">Canli derslere katil, birlikte ogren</p>
                          </div>
                        </div>
                        <Link href="/student/explore-classes">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                            Kesfet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </section>

                {/* ── BAR 3: Video Kurslar ── */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                        <PlayCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Video Kurslar</h2>
                    </div>
                    <Link href="/student/courses" className="text-xs text-green-600 hover:text-green-700 font-medium">
                      Tumunu Gor
                    </Link>
                  </div>

                  {activeCourses.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {activeCourses.slice(0, 3).map((course) => (
                        <Link key={course.courseId} href={`/student/courses/${course.courseId}/learn`} className="min-w-[280px] flex-1">
                          <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer h-full">
                            <div className="relative h-24 bg-gradient-to-br from-teal-100 to-green-100 overflow-hidden">
                              {course.coverImageUrl ? (
                                <img
                                  src={course.coverImageUrl}
                                  alt={course.courseTitle}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <GraduationCap className="w-8 h-8 text-teal-300" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlayCircle className="w-4 h-4 text-teal-600" />
                                </div>
                              </div>
                            </div>
                            <CardContent className="p-3">
                              <p className="font-medium text-gray-900 text-sm line-clamp-1 mb-0.5">{course.courseTitle}</p>
                              <p className="text-xs text-gray-500 mb-2">{course.mentorName}</p>
                              <div className="flex items-center gap-2">
                                <Progress value={course.completionPercentage} className="h-1.5 flex-1" />
                                <span className="text-xs text-gray-500 flex-shrink-0">{Math.round(course.completionPercentage)}%</span>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                                <span>{course.completedLectures}/{course.totalLectures} ders</span>
                                <span className="text-teal-600 font-medium">Devam Et →</span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    /* No courses → link to explore */
                    <Card className="border border-dashed border-green-200 bg-green-50/30">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <PlayCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">Kendi hizinda ogren</p>
                            <p className="text-xs text-gray-500">Video kurslarla istedigin zaman eris</p>
                          </div>
                        </div>
                        <Link href="/student/explore-courses">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
                            Kesfet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </section>
              </>
            ) : (
              /* ══════ EMPTY STATE: ONBOARDING STEPS (hiç satın alma yok) ══════ */
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
                    {recentConversations.map((conv) => {
                      const isUnread = conv.unreadCount > 0;
                      return (
                        <Link
                          key={conv.conversationId || conv.bookingId}
                          href="/student/messages"
                          className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg transition-colors ${
                            isUnread
                              ? 'bg-teal-50/70 hover:bg-teal-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={conv.otherUserAvatar ?? undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-green-500 text-white text-xs">
                                {conv.otherUserName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {isUnread && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                                {conv.otherUserName}
                              </span>
                              {conv.lastMessageAt && (
                                <span className={`text-[10px] flex-shrink-0 ml-1 ${isUnread ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                                  {formatRelativeTime(conv.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] truncate ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                              {conv.lastMessageContent || conv.offeringTitle}
                            </p>
                          </div>
                          {isUnread && (
                            <span className="min-w-[20px] h-5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 px-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Henuz mesajin yok</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips / Platform Highlights */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-gray-700">Biliyor muydun?</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Video className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Canli Gorusme</p>
                      <p className="text-[11px] text-gray-500">Mentorunle yuz yuze video gorusme yapabilirsin</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Kayit ve Tekrar</p>
                      <p className="text-[11px] text-gray-500">Tum derslerini tekrar izleyebilirsin</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Anlik Mesajlasma</p>
                      <p className="text-[11px] text-gray-500">Mentorunle ders oncesi/sonrasi iletisim kur</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
