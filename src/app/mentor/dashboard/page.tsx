'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, Users, Star, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { mentorsApi } from '@/lib/api/mentors';
import type { MyMentorProfile, MyMentorOffering } from '@/lib/types/mentor';
import { BookOpen } from 'lucide-react';



export default function MentorDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<MyMentorProfile | null>(null);
  const [offerings, setOfferings] = useState<MyMentorOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    (async () => {
      try {
        const p = await mentorsApi.getMyProfile();
        setProfile(p);
      } catch {
        setProfile(null);
      }

      try {
        const o = await mentorsApi.getMyOfferings();
        setOfferings(o ?? []);
      } catch {
        setOfferings([]);
      }

      setLoading(false);
    })();
  }, []);

  const hasProfile = !!profile;
  const hasOfferings = offerings.length > 0;
  const isApproved = !!profile?.isApprovedForBookings;
  const hasVerifications = profile?.verifications && profile.verifications.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mentör Dashboard</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Hoş geldin, {user?.displayName}! 🎓
          </h2>
          <p className="text-gray-600">
            {hasProfile ? 'Bugün danışanlarına yardım etmeye hazır mısın?' : 'Hemen profilini oluşturarak başlayalım!'}
          </p>
        </div>

        {(!hasProfile || !hasOfferings) && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-blue-900">Profilini Tamamla</CardTitle>
                  <CardDescription className="text-blue-700">
                    Öğrenci kabul edebilmek ve platformda görünür olmak için profil bilgilerini tamamlamalısın.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-3">
              {!hasProfile && (
                <Button onClick={() => router.push('/auth/onboarding/mentor?step=profile')}>
                  Profil Oluştur
                </Button>
              )}
              {!hasOfferings && hasProfile && (
                <Button variant="outline" onClick={() => router.push('/auth/onboarding/mentor?step=pricing')}>
                  Ücretlendirme Belirle
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {hasProfile && hasOfferings && !hasVerifications && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-yellow-900">Doğrulama Belgesi Yükle</CardTitle>
                  <CardDescription className="text-yellow-700">
                    Öğrenci kabul edebilmek için doğrulama belgelerini yüklemelisin. 
                    Belgeler admin tarafından onaylandıktan sonra uygunluk saatleri ekleyebileceksin.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                onClick={() => router.push('/auth/onboarding/mentor?step=verification')}
              >
                Belgeleri Yükle
              </Button>
            </CardContent>
          </Card>
        )}

        {hasProfile && hasOfferings && hasVerifications && (
          <Card className={`mb-8 ${isApproved ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
            <CardHeader>
              <div className="flex items-start gap-3">
                {isApproved ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <CardTitle className={isApproved ? 'text-green-900' : 'text-blue-900'}>
                    {isApproved ? '✓ Doğrulama belgeleriniz onaylandı!' : 'Doğrulama Belgesi Onayı Bekleniyor'}
                  </CardTitle>
                  <CardDescription className={isApproved ? 'text-green-700' : 'text-blue-700'}>
                    {isApproved ? (
                      <>
                        Artık öğrenci kabul edebilir ve uygunluk saatlerinizi ayarlayabilirsiniz.
                        Hemen uygunluk ekleyerek başlayabilirsiniz!
                      </>
                    ) : (
                      <>
                        Yüklediğiniz doğrulama belgeleri admin onayı bekliyor. 
                        Onaylandıktan sonra uygunluk saatlerinizi ayarlayabileceksiniz.
                      </>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {isApproved && (
              <CardContent>
                <Link href="/mentor/availability">
                  <Button className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Uygunluk Saatleri Ekle
                  </Button>
                </Link>
              </CardContent>
            )}
          </Card>
        )}

        {hasProfile && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profil Özeti</CardTitle>
              <Link href="/auth/onboarding/mentor">
                <Button variant="outline" size="sm">Profili Güncelle</Button>
              </Link>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-1">
              <div><b>Üniversite:</b> {profile.university}</div>
              <div><b>Bölüm:</b> {profile.department}</div>
              {profile.graduationYear && <div><b>Mezuniyet:</b> {profile.graduationYear}</div>}
              
              {profile.verifications && profile.verifications.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <b className="block mb-2">Doğrulama Belgeleri:</b>
                  {profile.verifications.map((v) => (
                    <div key={v.id} className="flex items-center gap-2 mb-1">
                      <span className="text-xs">{v.type === 'University' ? '🎓 Üniversite' : '📊 Sınav Sonucu'}:</span>
                      {v.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Onaylandı
                        </span>
                      )}
                      {v.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          Bekliyor
                        </span>
                      )}
                      {v.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                          ✕ Reddedildi
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-2"><b>Yayında:</b> {profile.isListed ? 'Evet' : 'Hayır'}</div>
            </CardContent>
          </Card>
        )}

        {hasOfferings && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ücretlendirme</CardTitle>
              <Link href="/auth/onboarding/mentor?step=pricing">
                <Button variant="outline" size="sm">Güncelle</Button>
              </Link>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-1">
              {offerings.map((o) => (
                <div key={o.id}>
                  <b>{o.title}</b>: {o.priceAmount} {o.currency} / {o.durationMinDefault} dk
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Kazanç</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺0</div>
              <p className="text-xs text-gray-600">Önceki aya göre +0%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Danışan</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan Dersler</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
              <Star className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
            <CardDescription>Sık kullandığın işlemler</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            {isApproved ? (
              <Link href="/mentor/availability">
                <Button variant="outline" className="w-full h-24 flex-col">
                  <Calendar className="w-8 h-8 mb-2" />
                  <span>Uygunluk Ekle</span>
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                className="w-full h-24 flex-col opacity-50 cursor-not-allowed"
                disabled
                title="Doğrulama belgesi onayı gerekli"
              >
                <Calendar className="w-8 h-8 mb-2" />
                <span>Uygunluk Ekle</span>
                <span className="text-xs text-gray-500 mt-1">(Doğrulama onayı gerekli)</span>
              </Button>
            )}
            
            <Link href="/mentor/classes/new">
              <Button variant="outline" className="w-full h-24 flex-col">
                <Users className="w-8 h-8 mb-2" />
                <span>Grup Dersi Oluştur</span>
              </Button>
            </Link>
            <Link href="/mentor/bookings">
  <Button variant="outline" className="w-full h-24 flex-col">
    <BookOpen className="w-8 h-8 mb-2" />
    <span>Derslerim</span>
  </Button>
</Link>

            <Link href="/mentor/earnings">
              <Button variant="outline" className="w-full h-24 flex-col">
                <DollarSign className="w-8 h-8 mb-2" />
                <span>Kazançlarım</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}