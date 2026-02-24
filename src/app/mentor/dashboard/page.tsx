'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar, DollarSign, Users, Star, AlertCircle, CheckCircle,
  Clock, Package, PlayCircle, BookOpen, ArrowRight, Video,
  MessageSquare, Settings, ChevronRight, Search, TrendingUp,
  Wallet, Eye, Plus, BarChart3, Zap, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useBookings } from '@/lib/hooks/use-bookings';
import { useConversations, useUnreadCount } from '@/lib/hooks/use-messages';
import { useMyGroupClasses } from '@/lib/hooks/use-classes';
import { useMyCourses } from '@/lib/hooks/use-courses';
import { mentorsApi } from '@/lib/api/mentors';
import { earningsApi, type MentorEarningsSummaryDto } from '@/lib/api/earnings';
import { apiClient } from '@/lib/api/client';
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils/format';
import { BookingStatus } from '@/lib/types/enums';
import type { MyMentorProfile, MyMentorOffering } from '@/lib/types/mentor';
import { useSessionJoinSettings, getSessionJoinStatus } from '@/lib/hooks/use-platform-settings';
import { toast } from 'sonner';

/* ──────────────────────────────── Types ──────────────────────────────── */
interface RoomStatus {
  isActive: boolean;
  hostConnected: boolean;
  participantCount: number;
}

/* ──────────────────────────────── Page ───────────────────────────────── */
export default function MentorDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  /* ── Mentor profile & offerings (direct API) ── */
  const [profile, setProfile] = useState<MyMentorProfile | null>(null);
  const [offerings, setOfferings] = useState<MyMentorOffering[]>([]);
  const [earnings, setEarnings] = useState<MentorEarningsSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const p = await mentorsApi.getMyProfile(); setProfile(p); } catch { setProfile(null); }
      try { const o = await mentorsApi.getMyOfferings(); setOfferings(o ?? []); } catch { setOfferings([]); }
      try { const e = await earningsApi.getSummary(); setEarnings(e); } catch { setEarnings(null); }
      setLoading(false);
    })();
  }, []);

  /* ── Data hooks ── */
  const { data: confirmedData } = useBookings(BookingStatus.Confirmed);
  const { data: allBookingsData } = useBookings(undefined, 1, 1);
  const { data: conversations } = useConversations();
  const { data: unreadData } = useUnreadCount();
  const { data: myGroupClasses } = useMyGroupClasses(undefined, 1, 5);
  const { data: myCourses } = useMyCourses(1, 5);

  /* ── Session join settings ── */
  const { devMode, earlyJoinMinutes } = useSessionJoinSettings();

  /* ── Derived state ── */
  const upcomingBookings = confirmedData?.items ?? [];
  const nextBooking = upcomingBookings[0];
  const totalBookingsEver = allBookingsData?.totalCount ?? 0;
  const totalUnread = unreadData?.totalUnread ?? 0;
  const recentConversations = (conversations ?? []).slice(0, 3);
  const groupClasses = myGroupClasses?.items ?? [];
  const courses = myCourses?.items ?? [];

  const hasProfile = !!profile;
  const hasOfferings = offerings.length > 0;
  const isApproved = !!profile?.isApprovedForBookings;
  const hasVerifications = profile?.verifications && profile.verifications.length > 0;

  /* ── Room status polling ── */
  const [roomStatus, setRoomStatus] = useState<Record<string, RoomStatus>>({});

  const checkRoomStatuses = useCallback(async () => {
    if (upcomingBookings.length === 0) return;
    const statuses: Record<string, RoomStatus> = {};
    for (const booking of upcomingBookings.slice(0, 3)) {
      try {
        const resp = await apiClient.get<RoomStatus>(`/video/room/${booking.id}/status`);
        statuses[booking.id] = resp;
      } catch {
        statuses[booking.id] = { isActive: false, hostConnected: false, participantCount: 0 };
      }
    }
    setRoomStatus(statuses);
  }, [upcomingBookings]);

  useEffect(() => {
    if (upcomingBookings.length === 0) return;
    checkRoomStatuses();
    const interval = setInterval(checkRoomStatuses, 15000);
    return () => clearInterval(interval);
  }, [upcomingBookings, checkRoomStatuses]);

  const handleStartSession = (bookingId: string, startAt?: string) => {
    if (startAt) {
      const { canJoin, minutesUntilStart } = getSessionJoinStatus(startAt, devMode, earlyJoinMinutes);
      if (!canJoin) {
        toast.error(`Ders en erken ${earlyJoinMinutes} dakika önce başlatılabilir. Başlangıca ${Math.ceil(minutesUntilStart)} dakika kaldı.`);
        return;
      }
    }
    router.push(`/mentor/classroom/${bookingId}`);
  };

  /* ── Profile completion score ── */
  const profileScore = useMemo(() => {
    let score = 0;
    const total = 5;
    if (hasProfile) score++;
    if (hasOfferings) score++;
    if (hasVerifications) score++;
    if (isApproved) score++;
    if (profile?.isListed) score++;
    return Math.round((score / total) * 100);
  }, [hasProfile, hasOfferings, hasVerifications, isApproved, profile]);

  /* ── Hero context ── */
  const getContextText = () => {
    if (!hasProfile) return 'Hemen profilini olusturarak baslayalim!';
    if (!isApproved) return 'Dogrulama surecini tamamla, ogrenci kabul etmeye basla.';
    const sessionCount = upcomingBookings.length;
    if (sessionCount > 0) return `${sessionCount} yaklasan dersin var.`;
    return 'Takvimini guncelle, yeni ogrenci kazan.';
  };

  const getHeroCTA = () => {
    if (!hasProfile) {
      return (
        <Link href="/auth/onboarding/mentor?step=profile">
          <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Profil Olustur
          </Button>
        </Link>
      );
    }
    if (!isApproved) {
      return (
        <Link href="/auth/onboarding/mentor?step=verification">
          <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg" size="sm">
            <Shield className="w-4 h-4 mr-1.5" />
            Dogrulama Yap
          </Button>
        </Link>
      );
    }
    if (nextBooking) {
      const heroJoinStatus = getSessionJoinStatus(nextBooking.startAt, devMode, earlyJoinMinutes);
      return (
        <Button
          onClick={() => handleStartSession(nextBooking.id, nextBooking.startAt)}
          className={`shadow-lg ${heroJoinStatus.canJoin ? 'bg-white text-teal-700 hover:bg-teal-50' : 'bg-white/60 text-teal-700/60 cursor-not-allowed'}`}
          size="sm"
          disabled={!heroJoinStatus.canJoin}
        >
          <Video className="w-4 h-4 mr-1.5" />
          {heroJoinStatus.canJoin ? 'Dersi Baslat' : `${Math.ceil(heroJoinStatus.minutesUntilStart)} dk sonra`}
        </Button>
      );
    }
    return (
      <Link href="/mentor/availability">
        <Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg" size="sm">
          <Calendar className="w-4 h-4 mr-1.5" />
          Uygunluk Ekle
        </Button>
      </Link>
    );
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

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

            {/* Profile Health Card */}
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
                    <svg className="absolute -inset-0.5 w-[52px] h-[52px]" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="24" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                      <circle
                        cx="26" cy="26" r="24" fill="none" stroke="#14b8a6" strokeWidth="2"
                        strokeDasharray={`${(profileScore / 100) * 150.8} 150.8`}
                        strokeLinecap="round"
                        transform="rotate(-90 26 26)"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">Profil %{profileScore}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {isApproved ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-300 text-green-700 bg-green-50">
                      <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Onayli
                    </Badge>
                  ) : hasVerifications ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-300 text-yellow-700 bg-yellow-50">
                      <Clock className="w-2.5 h-2.5 mr-0.5" /> Onay Bekliyor
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-300 text-red-700 bg-red-50">
                      <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Dogrulama Gerekli
                    </Badge>
                  )}
                  {profile?.isListed && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-teal-300 text-teal-700 bg-teal-50">
                      <Eye className="w-2.5 h-2.5 mr-0.5" /> Yayinda
                    </Badge>
                  )}
                </div>

                {profileScore < 100 && (
                  <Link href="/auth/onboarding/mentor">
                    <Button variant="outline" size="sm" className="w-full text-xs border-teal-200 text-teal-700 hover:bg-teal-50">
                      <Zap className="w-3.5 h-3.5 mr-1" />
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
                    { href: '/mentor/availability', icon: Calendar, label: 'Uygunluk Ekle', color: 'text-teal-600', primary: true, show: isApproved },
                    { href: '/mentor/bookings', icon: BookOpen, label: 'Seanslarim', color: 'text-blue-600', show: true },
                    { href: '/mentor/courses', icon: PlayCircle, label: 'Video Kurslarim', color: 'text-green-600', show: true },
                    { href: '/mentor/group-classes', icon: Users, label: 'Grup Dersleri', color: 'text-indigo-600', show: true },
                    { href: '/mentor/offerings', icon: Package, label: 'Paketlerim', color: 'text-purple-600', show: true },
                    { href: '/mentor/earnings', icon: DollarSign, label: 'Kazanclarim', color: 'text-green-600', show: true },
                    { href: '/mentor/settings', icon: Settings, label: 'Ayarlar', color: 'text-gray-500', show: true },
                  ].filter(item => item.show).map((item) => (
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
                    { icon: DollarSign, value: earnings ? formatCurrency(earnings.thisMonthEarnings) : '0', label: 'Bu Ay', color: 'text-green-600 bg-green-50' },
                    { icon: MessageSquare, value: totalUnread, label: 'Mesaj', color: 'text-blue-600 bg-blue-50' },
                    { icon: BarChart3, value: totalBookingsEver, label: 'Toplam', color: 'text-purple-600 bg-purple-50' },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-none truncate">{stat.value}</p>
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

            {/* ── Setup Steps (if not fully set up) ── */}
            {(!hasProfile || !hasOfferings || !hasVerifications || !isApproved) && (
              <section>
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-teal-600" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-900">Baslangic Adimlari</h2>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          done: hasProfile,
                          label: 'Profil Olustur',
                          desc: 'Universite, bolum ve biyografi bilgilerini ekle',
                          href: '/auth/onboarding/mentor?step=profile',
                          icon: Star,
                        },
                        {
                          done: hasOfferings,
                          label: 'Ucretlendirme Belirle',
                          desc: 'Seans ucretini ve suresini ayarla',
                          href: '/auth/onboarding/mentor?step=pricing',
                          icon: Package,
                        },
                        {
                          done: hasVerifications,
                          label: 'Dogrulama Belgesi Yukle',
                          desc: 'Universite veya sinav belgelerini yukle',
                          href: '/auth/onboarding/mentor?step=verification',
                          icon: Shield,
                        },
                        {
                          done: isApproved,
                          label: 'Admin Onayi',
                          desc: isApproved
                            ? 'Belgelerin onaylandi!'
                            : hasVerifications
                            ? 'Belgeler inceleniyor, yakinda onaylanacak'
                            : 'Belgeleri yukledikten sonra admin inceleyecek',
                          href: '#',
                          icon: CheckCircle,
                          isWaiting: hasVerifications && !isApproved,
                        },
                      ].map((step, i) => (
                        <Link key={i} href={step.done || step.href === '#' ? '#' : step.href} className="block">
                          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            step.done
                              ? 'border-green-200 bg-green-50/50'
                              : step.isWaiting
                              ? 'border-yellow-200 bg-yellow-50/30'
                              : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50/20'
                          }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              step.done ? 'bg-green-100' : step.isWaiting ? 'bg-yellow-100' : 'bg-gray-100'
                            }`}>
                              {step.done ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : step.isWaiting ? (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <step.icon className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${step.done ? 'text-green-800' : 'text-gray-900'}`}>{step.label}</p>
                              <p className="text-xs text-gray-500 truncate">{step.desc}</p>
                            </div>
                            {!step.done && !step.isWaiting && step.href !== '#' && (
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* ── Upcoming Sessions ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-teal-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Yaklasan Dersler</h2>
                </div>
                <Link href="/mentor/bookings" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                  Tumunu Gor
                </Link>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {upcomingBookings.slice(0, 3).map((booking) => {
                    const status = roomStatus[booking.id];
                    const isActive = status?.isActive === true;
                    const joinStatus = getSessionJoinStatus(booking.startAt, devMode, earlyJoinMinutes);
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="min-w-[280px] flex-1"
                      >
                        <Card className={`border shadow-sm transition-all hover:shadow-md ${
                          isActive ? 'border-green-300 bg-green-50/30' : 'border-gray-100 hover:border-teal-200'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 rounded-xl flex-shrink-0">
                                <AvatarImage src={booking.studentAvatar ?? undefined} />
                                <AvatarFallback className="rounded-xl bg-gradient-to-br from-teal-400 to-green-500 text-white text-sm">
                                  {booking.studentName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{booking.studentName}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(booking.startAt, 'dd MMM')}
                                  </span>
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(booking.startAt, 'HH:mm')}
                                  </span>
                                  <span className="text-gray-400">{booking.durationMin}dk</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Button
                                size="sm"
                                onClick={() => handleStartSession(booking.id, booking.startAt)}
                                disabled={!joinStatus.canJoin && !isActive}
                                className={`w-full text-xs ${
                                  isActive
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm'
                                    : joinStatus.canJoin
                                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <Video className="w-3.5 h-3.5 mr-1" />
                                {isActive ? 'Derse Katil' : joinStatus.canJoin ? 'Dersi Baslat' : `${Math.ceil(joinStatus.minutesUntilStart)} dk sonra`}
                              </Button>
                              {!joinStatus.canJoin && !isActive && (
                                <p className="text-[10px] text-center text-gray-400 mt-1">
                                  En erken {earlyJoinMinutes} dk once baslatilabilir
                                </p>
                              )}
                            </div>
                            {isActive && (
                              <div className="flex items-center gap-1 mt-2 text-[11px] text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span className="font-medium">Ogrenci bekliyor ({status.participantCount} kisi)</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card className="border border-dashed border-teal-200 bg-teal-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Yaklasan dersin yok</p>
                        <p className="text-xs text-gray-500">
                          {isApproved
                            ? 'Takviminde uygun saatleri ekle'
                            : 'Onay surecini tamamla, ogrenci kabul et'}
                        </p>
                      </div>
                    </div>
                    {isApproved ? (
                      <Link href="/mentor/availability">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                          Uygunluk Ekle <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/onboarding/mentor?step=verification">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                          Dogrulama <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </section>

            {/* ── Earnings Overview ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Kazanc Ozeti</h2>
                </div>
                <Link href="/mentor/earnings" className="text-xs text-green-600 hover:text-green-700 font-medium">
                  Detay
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Bu Ay',
                    value: formatCurrency(earnings?.thisMonthEarnings ?? 0),
                    icon: TrendingUp,
                    color: 'text-green-600 bg-green-50',
                  },
                  {
                    label: 'Toplam Kazanc',
                    value: formatCurrency(earnings?.totalEarnings ?? 0),
                    icon: DollarSign,
                    color: 'text-teal-600 bg-teal-50',
                  },
                  {
                    label: 'Cekilebilir',
                    value: formatCurrency(earnings?.availableBalance ?? 0),
                    icon: Wallet,
                    color: 'text-blue-600 bg-blue-50',
                  },
                  {
                    label: 'Emanet',
                    value: formatCurrency(earnings?.escrowBalance ?? 0),
                    icon: Clock,
                    color: 'text-amber-600 bg-amber-50',
                  },
                ].map((item, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${item.color}`}>
                          <item.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] text-gray-500">{item.label}</span>
                      </div>
                      <p className="text-base font-bold text-gray-900 truncate">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── My Offerings ── */}
            {hasOfferings && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Paketlerim</h2>
                  </div>
                  <Link href="/mentor/offerings" className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                    Yonet
                  </Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {offerings.map((offering) => (
                    <Link key={offering.id} href="/mentor/offerings" className="min-w-[220px] flex-1">
                      <Card className="border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                offering.isActive
                                  ? 'border-green-300 text-green-700 bg-green-50'
                                  : 'border-gray-300 text-gray-500 bg-gray-50'
                              }`}
                            >
                              {offering.isActive ? 'Aktif' : 'Pasif'}
                            </Badge>
                            <span className="text-xs text-gray-400">{offering.durationMinDefault}dk</span>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm truncate">{offering.title}</p>
                          <p className="text-lg font-bold text-teal-700 mt-1">
                            {formatCurrency(offering.priceAmount, offering.currency)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Group Classes ── */}
            {groupClasses.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Grup Derslerim</h2>
                  </div>
                  <Link href="/mentor/group-classes" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    Tumunu Gor
                  </Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {groupClasses.slice(0, 3).map((cls: any) => (
                    <Link key={cls.id} href="/mentor/group-classes" className="min-w-[260px] flex-1">
                      <Card className="border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all h-full">
                        <CardContent className="p-4">
                          <p className="font-semibold text-gray-900 text-sm truncate">{cls.title}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-200 text-indigo-700">
                              {cls.category}
                            </Badge>
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(cls.startAt, 'dd MMM HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {cls.enrollmentCount ?? 0}/{cls.capacity} katilimci
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── My Courses ── */}
            {courses.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                      <PlayCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Video Kurslarim</h2>
                  </div>
                  <Link href="/mentor/courses" className="text-xs text-green-600 hover:text-green-700 font-medium">
                    Tumunu Gor
                  </Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {courses.slice(0, 3).map((course: any) => (
                    <Link key={course.id} href="/mentor/courses" className="min-w-[260px] flex-1">
                      <Card className="border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                course.status === 'Published'
                                  ? 'border-green-300 text-green-700 bg-green-50'
                                  : course.status === 'PendingReview'
                                  ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                  : 'border-gray-300 text-gray-500 bg-gray-50'
                              }`}
                            >
                              {course.status === 'Published' ? 'Yayinda' : course.status === 'PendingReview' ? 'Incelemede' : course.status === 'Draft' ? 'Taslak' : course.status}
                            </Badge>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm truncate">{course.title}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-0.5">
                              <Users className="w-3 h-3" />
                              {course.enrollmentCount ?? 0} kayit
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(course.price ?? 0)}
                            </span>
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
                  <Link href="/mentor/messages" className="text-xs text-teal-600 hover:text-teal-700">
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
                          href="/mentor/messages"
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

            {/* Mentor Tips */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-gray-700">Mentor Ipuclari</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Duzgun Takvim</p>
                      <p className="text-[11px] text-gray-500">Haftalik uygunluk sablonu olustur, otomatik yayinlansin</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PlayCircle className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Video Kurs</p>
                      <p className="text-[11px] text-gray-500">Pasif gelir icin video kurs olustur ve sat</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Grup Dersleri</p>
                      <p className="text-[11px] text-gray-500">Birden fazla ogrenciye ayni anda ders ver</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800">Yorum Topla</p>
                      <p className="text-[11px] text-gray-500">Iyi yorumlar profilinin one cikarilmasini saglar</p>
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
