'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Star, CheckCircle, Video, Clock, HelpCircle, Tag, AlertTriangle,
  ArrowLeft, Users, Award, Shield, Globe, GraduationCap, Building2,
  MessageSquare, Heart, Share2, TrendingUp, Play, Settings, Package, Eye, BarChart3
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { useMentor } from '../../../../lib/hooks/use-mentors';
import { useAuthStore } from '../../../../lib/stores/auth-store';
import { useStartDirectConversation } from '../../../../lib/hooks/use-messages';
import { formatCurrency, formatDate } from '../../../../lib/utils/format';
import { ROUTES } from '../../../../lib/constants/routes';
import type { VerificationType } from '../../../../lib/types/enums';
import { offeringsApi, type OfferingDto } from '../../../../lib/api/offerings';
import { toast } from 'sonner';

const verificationLabels: Record<VerificationType, string> = {
  Basic: 'Temel Doğrulama',
  University: 'Üniversite Doğrulaması',
  Ranking: 'Sıralama Doğrulaması',
  Identity: 'Kimlik Doğrulaması',
};

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params.id as string;
  const { data: mentor, isLoading } = useMentor(mentorId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isOwnProfile = isAuthenticated && user?.id === mentorId;
  const startDirectConversation = useStartDirectConversation();
  const [selectedTab, setSelectedTab] = useState<'about' | 'offerings' | 'reviews'>('about');
  const [enrichedOfferings, setEnrichedOfferings] = useState<OfferingDto[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);

  const handleSendMessage = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/public/mentors/${mentorId}`);
      return;
    }

    const isMentor = user?.roles?.includes('Mentor');
    const basePath = isMentor ? '/mentor/messages' : '/student/messages';

    try {
      const result = await startDirectConversation.mutateAsync(mentorId);
      // Pass recipient info via URL params so messages page can open the conversation
      // even if GetMyConversations doesn't return it yet (no messages sent)
      const params = new URLSearchParams({
        conversationId: result.conversationId,
        recipientName: result.otherUserName,
        recipientId: result.otherUserId,
      });
      if (result.otherUserAvatar) params.set('recipientAvatar', result.otherUserAvatar);
      router.push(`${basePath}?${params.toString()}`);
    } catch {
      toast.error('Mesaj başlatılırken bir hata oluştu.');
    }
  }, [isAuthenticated, mentorId, router, user, startDirectConversation]);

  // Fetch enriched offerings with questions, descriptions, etc.
  useEffect(() => {
    if (!mentorId) return;
    setOfferingsLoading(true);
    offeringsApi.getMentorOfferings(mentorId)
      .then(data => setEnrichedOfferings(data ?? []))
      .catch(() => setEnrichedOfferings([]))
      .finally(() => setOfferingsLoading(false));
  }, [mentorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-teal-600 to-green-600 pt-8 pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-4 bg-white/20 rounded w-32 mb-6" />
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-12">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6 animate-pulse">
              <div className="bg-white rounded-xl p-6 shadow-xl">
                <div className="flex gap-5">
                  <div className="w-28 h-28 rounded-2xl bg-gray-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-48" />
                    <div className="h-4 bg-gray-200 rounded w-36" />
                    <div className="h-4 bg-gray-200 rounded w-64" />
                  </div>
                </div>
              </div>
            </div>
            <div className="animate-pulse">
              <div className="h-96 bg-white rounded-xl shadow-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    // Kendi profiline bakan ama henüz profili oluşturulmamış/onaylanmamış mentor (login'li)
    if (isOwnProfile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Profiliniz Henüz Yayında Değil</h2>
            <p className="text-gray-600 mb-6">
              Mentor profilinizin herkese görünür olması için lütfen profil bilgilerinizi tamamlayın ve
              doğrulama belgelerinizi yükleyin. Admin onayı sonrasında profiliniz yayına alınacaktır.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white" onClick={() => router.push('/auth/onboarding/mentor')}>
                Profili Tamamla
              </Button>
              <Button variant="outline" onClick={() => router.push('/mentor/dashboard')}>
                Dashboard&apos;a Dön
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Mentor Profili Bulunamadı</h2>
          <p className="text-gray-600 mb-6">
            {!isAuthenticated
              ? 'Bu mentor profili henüz herkese açık olmayabilir. Eğer bu sizin profilinizse lütfen giriş yapın.'
              : 'Bu mentor profili mevcut değil veya henüz yayına alınmamış.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isAuthenticated && (
              <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white" onClick={() => router.push(`/auth/login?redirect=/public/mentors/${mentorId}`)}>
                Giriş Yap
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/public/mentors')}>
              Mentörlere Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBooking = (offeringId: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/public/mentors/${mentorId}`);
      return;
    }
    router.push(`/student/bookings/new?mentorId=${mentorId}&offeringId=${offeringId}`);
  };

  const tabs = [
    { id: 'about' as const, label: 'Hakkında' },
    { id: 'offerings' as const, label: 'Hizmetler' },
    { id: 'reviews' as const, label: 'Yorumlar' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Kendi profili ama henüz yayında değil uyarısı */}
      {mentor.isOwnProfile && !mentor.isListed && (() => {
        const vs = mentor.verificationStatus;
        const bannerConfig = vs === 'PendingApproval'
          ? {
              title: 'Belgeleriniz inceleniyor.',
              desc: 'Bu sayfa yalnızca size gösteriliyor. Admin onayından sonra profiliniz herkese açık olacaktır.',
              btnText: 'Belge Durumunu Gör',
              btnHref: '/auth/onboarding/mentor',
              color: 'blue' as const,
            }
          : vs === 'Rejected'
          ? {
              title: 'Belgeleriniz reddedildi.',
              desc: 'Lütfen belgelerinizi kontrol edip tekrar yükleyin. Red sebebini belge detaylarında görebilirsiniz.',
              btnText: 'Belgeleri Düzenle',
              btnHref: '/auth/onboarding/mentor',
              color: 'red' as const,
            }
          : {
              title: 'Profiliniz henüz herkese açık değil.',
              desc: 'Bu sayfa yalnızca size gösteriliyor. Doğrulama belgelerinizi yükleyip admin onayı aldıktan sonra profiliniz yayına alınacaktır.',
              btnText: 'Belgeleri Yükle',
              btnHref: '/auth/onboarding/mentor',
              color: 'amber' as const,
            };

        const colorMap = {
          amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', title: 'text-amber-800', desc: 'text-amber-600', btn: 'border-amber-300 text-amber-700 hover:bg-amber-100' },
          blue:  { bg: 'bg-blue-50',  border: 'border-blue-200',  icon: 'text-blue-600',  title: 'text-blue-800',  desc: 'text-blue-600',  btn: 'border-blue-300 text-blue-700 hover:bg-blue-100' },
          red:   { bg: 'bg-red-50',   border: 'border-red-200',   icon: 'text-red-600',   title: 'text-red-800',   desc: 'text-red-600',   btn: 'border-red-300 text-red-700 hover:bg-red-100' },
        };
        const c = colorMap[bannerConfig.color];

        return (
          <div className={`${c.bg} border-b ${c.border}`}>
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${c.icon} shrink-0`} />
              <div className="flex-1">
                <p className={`text-sm ${c.title} font-medium`}>
                  {bannerConfig.title}
                </p>
                <p className={`text-xs ${c.desc}`}>
                  {bannerConfig.desc}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className={`${c.btn} shrink-0`}
                onClick={() => router.push(bannerConfig.btnHref)}
              >
                {bannerConfig.btnText}
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 to-green-600 pt-8 pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={ROUTES.MENTORS} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mentörlere Dön
          </Link>
        </div>
      </div>

      {/* Main Content — pulled up over hero */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column — Profile + Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card className="p-6 border-0 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-28 h-28 rounded-2xl">
                    <AvatarImage src={mentor.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-3xl rounded-2xl bg-gradient-to-br from-teal-400 to-green-500 text-white">
                      {mentor.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{mentor.displayName}</h1>
                    {mentor.badges.some(b => b.isVerified) && (
                      <span className="px-3 py-1 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-xs flex items-center gap-1">
                        <Award className="w-3 h-3" /> Doğrulanmış
                      </span>
                    )}
                  </div>
                  <p className="text-teal-600 font-medium mb-1">{mentor.university}</p>
                  <p className="text-sm text-gray-500 mb-3">{mentor.department}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-900">{mentor.ratingAvg.toFixed(1)}</span>
                      <span className="text-gray-500">({mentor.ratingCount} yorum)</span>
                    </div>
                    {mentor.graduationYear && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        Mezuniyet: {mentor.graduationYear}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verification Badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                {mentor.badges.filter(b => b.isVerified).map((badge) => (
                  <span key={badge.type} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {verificationLabels[badge.type]}
                  </span>
                ))}
              </div>
            </Card>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-5 py-3 text-sm whitespace-nowrap border-b-2 transition-all font-medium ${
                      selectedTab === tab.id
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* About Tab */}
                {selectedTab === 'about' && (
                  <div>
                    {mentor.headline && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{mentor.headline}</h3>
                    )}
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">{mentor.bio}</p>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Eğitim</h3>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{mentor.university}</p>
                        <p className="text-sm text-gray-500">{mentor.department}</p>
                        {mentor.graduationYear && (
                          <p className="text-xs text-gray-400">Mezuniyet: {mentor.graduationYear}</p>
                        )}
                      </div>
                    </div>

                    {/* Doğrulamalar */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Doğrulamalar</h3>
                    <div className="space-y-2">
                      {mentor.badges.map((badge) => (
                        <div
                          key={badge.type}
                          className="flex items-center justify-between text-sm p-3 rounded-lg bg-gray-50"
                        >
                          <span className="text-gray-700">{verificationLabels[badge.type]}</span>
                          {badge.isVerified ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <span className="text-gray-400 text-xs">Bekliyor</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offerings Tab */}
                {selectedTab === 'offerings' && (
                  <div className="space-y-4">
                    {offeringsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                      </div>
                    ) : enrichedOfferings.length > 0 ? (
                      enrichedOfferings.map((offering) => (
                        <Card key={offering.id} className="overflow-hidden border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all">
                          {offering.coverImageUrl && (
                            <div className="h-40 bg-gray-200 overflow-hidden">
                              <img
                                src={offering.coverImageUrl}
                                alt={offering.title}
                                className="w-full h-full object-cover"
                                style={getCoverImageStyle(offering.coverImagePosition, offering.coverImageTransform)}
                              />
                            </div>
                          )}
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{offering.title}</CardTitle>
                                {offering.subtitle && (
                                  <p className="text-sm text-gray-500 mt-1">{offering.subtitle}</p>
                                )}
                                {offering.description && (
                                  <CardDescription className="mt-2">
                                    {offering.description}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {offering.category && (
                                  <Badge variant="outline" className="border-teal-200 text-teal-700">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {offering.category}
                                  </Badge>
                                )}
                                {offering.sessionType && (
                                  <Badge className="bg-teal-50 text-teal-700 border border-teal-200">{offering.sessionType}</Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {offering.detailedDescription && (
                              <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                                {offering.detailedDescription}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-teal-600" />
                                {offering.durationMin} dakika
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-teal-600" />
                                {offering.maxBookingDaysAhead} gün ilerisi
                              </span>
                              {offering.minNoticeHours > 0 && (
                                <span className="text-xs text-gray-500">
                                  (en az {offering.minNoticeHours} saat önce)
                                </span>
                              )}
                            </div>

                            {offering.questions && offering.questions.length > 0 && (
                              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-teal-700 mb-2 flex items-center gap-1">
                                  <HelpCircle className="w-3.5 h-3.5" />
                                  Rezervasyon sırasında cevaplamanız gereken sorular:
                                </p>
                                <ul className="text-xs text-teal-600 space-y-1">
                                  {offering.questions.map(q => (
                                    <li key={q.id}>
                                      {q.questionText}
                                      {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="text-2xl font-bold text-teal-600">
                                {formatCurrency(offering.price)}
                              </div>
                              {isOwnProfile ? (
                                <span className="text-sm text-gray-400 font-medium">Kendi profiliniz</span>
                              ) : (
                                <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white" onClick={() => handleBooking(offering.id)}>
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Randevu Al
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : mentor.offerings.length > 0 ? (
                      // Fallback to basic offerings from mentor detail
                      mentor.offerings.map((offering) => (
                        <Card key={offering.id} className="border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{offering.title}</CardTitle>
                                {offering.description && (
                                  <CardDescription className="mt-2">
                                    {offering.description}
                                  </CardDescription>
                                )}
                              </div>
                              <Badge className="bg-teal-50 text-teal-700 border border-teal-200">
                                {offering.type === 'OneToOne' ? 'Bire Bir' : 'Grup'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-teal-600" />
                                  {offering.durationMin} dakika
                                </div>
                                <div className="text-2xl font-bold text-teal-600">
                                  {formatCurrency(offering.price)}
                                </div>
                              </div>
                              {isOwnProfile ? (
                                <span className="text-sm text-gray-400 font-medium">Kendi profiliniz</span>
                              ) : (
                                <Button className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white" onClick={() => handleBooking(offering.id)}>
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Randevu Al
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Henüz paket bulunmuyor</p>
                    )}

                    {/* Available Slots Preview */}
                    {mentor.availableSlots.length > 0 && (
                      <Card className="border border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-teal-600" />
                            Uygun Saatler
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {mentor.availableSlots.slice(0, 6).map((slot) => (
                              <div
                                key={slot.id}
                                className="text-sm p-2.5 border border-teal-200 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors text-center"
                              >
                                {formatDate(slot.startAt, 'dd MMM, HH:mm')}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {selectedTab === 'reviews' && (
                  <div className="text-center text-gray-500 py-8">
                    Yorumlar yakında eklenecek
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — Booking Card or Own Profile Actions */}
          <div className="space-y-6">
            {isOwnProfile ? (
              /* ─── Own Profile Sidebar ─── */
              <Card className="p-6 border-0 shadow-xl sticky top-20">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Profiliniz</h3>
                  <p className="text-xs text-gray-500 mt-1">Öğrenciler profilinizi böyle görüyor</p>
                </div>

                <div className="space-y-2 mb-5">
                  <Link href="/mentor/offerings">
                    <Button className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-5">
                      <Package className="w-4 h-4 mr-2" />
                      Paketlerimi Düzenle
                    </Button>
                  </Link>
                  <Link href="/mentor/availability">
                    <Button variant="outline" className="w-full border-2 border-teal-300 hover:bg-teal-50 py-4 text-teal-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      Uygunluk Ayarları
                    </Button>
                  </Link>
                  <Link href="/mentor/settings">
                    <Button variant="outline" className="w-full py-4">
                      <Settings className="w-4 h-4 mr-2" />
                      Profil Ayarları
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Puan</span>
                    <span className="text-gray-900 font-medium flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {mentor.ratingAvg.toFixed(1)} ({mentor.ratingCount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Aktif Paket</span>
                    <span className="text-gray-900 font-medium">{enrichedOfferings.length || mentor.offerings.length} adet</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Uygun Slot</span>
                    <span className="text-gray-900 font-medium">{mentor.availableSlots.length} saat</span>
                  </div>
                  {mentor.graduationYear && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600">Mezuniyet</span>
                      <span className="text-gray-900 font-medium">{mentor.graduationYear}</span>
                    </div>
                  )}
                </div>

                {mentor.availableSlots.length === 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-amber-800 font-medium">Uygun slot yok</p>
                        <p className="text-xs text-amber-600">Öğrencilerin randevu alabilmesi için uygunluk saatlerinizi ayarlayın</p>
                      </div>
                    </div>
                  </div>
                )}

                {(enrichedOfferings.length === 0 && mentor.offerings.length === 0) && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-amber-800 font-medium">Paket oluşturun</p>
                        <p className="text-xs text-amber-600">Profilinizde hizmet görünmesi için en az bir paket ekleyin</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              /* ─── Visitor Sidebar ─── */
              <Card className="p-6 border-0 shadow-xl sticky top-20">
                <div className="text-center mb-5">
                  {enrichedOfferings.length > 0 ? (
                    <>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {formatCurrency(Math.min(...enrichedOfferings.map(o => o.price)))}
                      </div>
                      <p className="text-sm text-gray-500">başlangıç fiyatı</p>
                    </>
                  ) : mentor.offerings.length > 0 ? (
                    <>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {formatCurrency(Math.min(...mentor.offerings.map(o => o.price)))}
                      </div>
                      <p className="text-sm text-gray-500">başlangıç fiyatı</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Fiyat bilgisi için hizmetlere bakın</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Taksit seçeneği mevcuttur</p>
                </div>

                <div className="space-y-3 mb-5">
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white shadow-lg shadow-teal-500/25 py-5"
                    onClick={() => {
                      if (enrichedOfferings.length > 0) {
                        handleBooking(enrichedOfferings[0].id);
                      } else if (mentor.offerings.length > 0) {
                        handleBooking(mentor.offerings[0].id);
                      }
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Görüşme Planla
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-teal-300 hover:bg-teal-50 py-5 text-teal-700"
                    onClick={handleSendMessage}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mesaj Gönder
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Puan</span>
                    <span className="text-gray-900 font-medium flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {mentor.ratingAvg.toFixed(1)} ({mentor.ratingCount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Hizmetler</span>
                    <span className="text-gray-900 font-medium">{enrichedOfferings.length || mentor.offerings.length} paket</span>
                  </div>
                  {mentor.graduationYear && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Mezuniyet</span>
                      <span className="text-gray-900 font-medium">{mentor.graduationYear}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Uygun Slot</span>
                    <span className="text-gray-900 font-medium">{mentor.availableSlots.length} saat</span>
                  </div>
                </div>

                <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-amber-800 font-medium">Para iade garantisi</p>
                      <p className="text-xs text-amber-600">İlk görüşmeden memnun kalmazsanız %100 iade</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" /> Kaydet
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors">
                    <Share2 className="w-4 h-4" /> Paylaş
                  </button>
                </div>
              </Card>
            )}

            {/* Social Proof — only for visitors */}
            {!isOwnProfile && (
              <Card className="p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>Bu hafta birçok kişi görüşme planladı</span>
                </div>
                <div className="flex -space-x-2">
                  {['A', 'M', 'S', 'D', 'E'].map((letter, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                      {letter}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs">
                    +
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
