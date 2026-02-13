'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Star, CheckCircle, Video, Clock, HelpCircle, Tag } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { useMentor } from '../../../../lib/hooks/use-mentors';
import { useAuthStore } from '../../../../lib/stores/auth-store';
import { formatCurrency, formatDate } from '../../../../lib/utils/format';
import { ROUTES } from '../../../../lib/constants/routes';
import type { VerificationType } from '../../../../lib/types/enums';
import { offeringsApi, type OfferingDto } from '../../../../lib/api/offerings';

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
  const [selectedTab, setSelectedTab] = useState<'about' | 'offerings' | 'reviews'>('about');
  const [enrichedOfferings, setEnrichedOfferings] = useState<OfferingDto[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Mentör bulunamadı</h2>
          <Link href="/mentors">
            <Button>Mentörlere Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleBooking = (offeringId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/mentors/${mentorId}`);
      return;
    }
    router.push(`/student/bookings/new?mentorId=${mentorId}&offeringId=${offeringId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            MentorHub
          </Link>
          <div className="flex items-center space-x-4">
            <Link href={ROUTES.MENTORS}>
              <Button variant="ghost">← Mentörlere Dön</Button>
            </Link>
            {!isAuthenticated && (
              <>
                <Link href={ROUTES.LOGIN}>
                  <Button variant="ghost">Giriş Yap</Button>
                </Link>
                <Link href={ROUTES.SIGNUP}>
                  <Button>Kayıt Ol</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  <AvatarImage src={mentor.avatarUrl} />
                  <AvatarFallback className="text-3xl">
                    {mentor.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{mentor.displayName}</CardTitle>
                <CardDescription>
                  <div className="font-semibold text-gray-900">{mentor.university}</div>
                  <div>{mentor.department}</div>
                  {mentor.graduationYear && (
                    <div className="text-sm">Mezuniyet: {mentor.graduationYear}</div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Rating */}
                <div className="flex items-center justify-center mb-6 pb-6 border-b">
                  <Star className="w-6 h-6 text-yellow-500 fill-current mr-2" />
                  <span className="text-2xl font-bold">{mentor.ratingAvg.toFixed(1)}</span>
                  <span className="text-gray-500 ml-2">({mentor.ratingCount} değerlendirme)</span>
                </div>

                {/* Verification Badges */}
                <div className="space-y-2">
                  <h4 className="font-semibold mb-3">Doğrulamalar</h4>
                  {mentor.badges.map((badge) => (
                    <div
                      key={badge.type}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{verificationLabels[badge.type]}</span>
                      {badge.isVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setSelectedTab('about')}
                    className={`py-4 border-b-2 font-medium text-sm ${
                      selectedTab === 'about'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Hakkında
                  </button>
                  <button
                    onClick={() => setSelectedTab('offerings')}
                    className={`py-4 border-b-2 font-medium text-sm ${
                      selectedTab === 'offerings'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Hizmetler
                  </button>
                  <button
                    onClick={() => setSelectedTab('reviews')}
                    className={`py-4 border-b-2 font-medium text-sm ${
                      selectedTab === 'reviews'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Yorumlar
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {selectedTab === 'about' && (
                  <div>
                    {mentor.headline && (
                      <h3 className="text-xl font-semibold mb-4">{mentor.headline}</h3>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap">{mentor.bio}</p>
                  </div>
                )}

                {selectedTab === 'offerings' && (
                  <div className="space-y-4">
                    {offeringsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                      </div>
                    ) : enrichedOfferings.length > 0 ? (
                      enrichedOfferings.map((offering) => (
                        <Card key={offering.id} className="overflow-hidden">
                          {offering.coverImageUrl && (
                            <div className="h-40 bg-gray-200 overflow-hidden">
                              <img
                                src={offering.coverImageUrl}
                                alt={offering.title}
                                className="w-full h-full object-cover"
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
                                  <Badge variant="outline">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {offering.category}
                                  </Badge>
                                )}
                                {offering.sessionType && (
                                  <Badge variant="secondary">{offering.sessionType}</Badge>
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
                                <Clock className="w-4 h-4" />
                                {offering.durationMin} dakika
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {offering.maxBookingDaysAhead} gun ilerisi
                              </span>
                              {offering.minNoticeHours > 0 && (
                                <span className="text-xs text-gray-500">
                                  (en az {offering.minNoticeHours} saat once)
                                </span>
                              )}
                            </div>

                            {offering.questions && offering.questions.length > 0 && (
                              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                                  <HelpCircle className="w-3.5 h-3.5" />
                                  Rezervasyon sirasinda cevaplamaniz gereken sorular:
                                </p>
                                <ul className="text-xs text-blue-600 space-y-1">
                                  {offering.questions.map(q => (
                                    <li key={q.id}>
                                      {q.questionText}
                                      {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="text-2xl font-bold text-primary-600">
                                {formatCurrency(offering.price)}
                              </div>
                              <Button onClick={() => handleBooking(offering.id)}>
                                Randevu Al
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : mentor.offerings.length > 0 ? (
                      // Fallback to basic offerings from mentor detail
                      mentor.offerings.map((offering) => (
                        <Card key={offering.id}>
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
                              <Badge>
                                {offering.type === 'OneToOne' ? 'Bire Bir' : 'Grup'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-600 mb-1">
                                  <Calendar className="w-4 h-4 inline mr-1" />
                                  {offering.durationMin} dakika
                                </div>
                                <div className="text-2xl font-bold text-primary-600">
                                  {formatCurrency(offering.price)}
                                </div>
                              </div>
                              <Button onClick={() => handleBooking(offering.id)}>
                                Randevu Al
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">Henuz paket bulunmuyor</p>
                    )}

                    {/* Available Slots Preview */}
                    {mentor.availableSlots.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Uygun Saatler</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {mentor.availableSlots.slice(0, 6).map((slot) => (
                              <div
                                key={slot.id}
                                className="text-sm p-2 border rounded hover:bg-gray-50"
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

                {selectedTab === 'reviews' && (
                  <div className="text-center text-gray-500 py-8">
                    Yorumlar yakında eklenecek
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}