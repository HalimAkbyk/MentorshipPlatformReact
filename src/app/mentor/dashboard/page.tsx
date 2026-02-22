'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, DollarSign, Users, Star, AlertCircle, CheckCircle, Clock, Info, Package, PlayCircle, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { mentorsApi } from '@/lib/api/mentors';
import type { MyMentorProfile, MyMentorOffering } from '@/lib/types/mentor';

export default function MentorDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<MyMentorProfile | null>(null);
  const [offerings, setOfferings] = useState<MyMentorOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try { const p = await mentorsApi.getMyProfile(); setProfile(p); } catch { setProfile(null); }
      try { const o = await mentorsApi.getMyOfferings(); setOfferings(o ?? []); } catch { setOfferings([]); }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Gradient Welcome Bar */}
        <div className="bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">Hoş geldin, {user?.displayName}!</h2>
              <p className="text-teal-100">{hasProfile ? 'Bugün danışanlarına yardım etmeye hazır mısın?' : 'Hemen profilini oluşturarak başlayalım!'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/mentor/bookings"><Button className="bg-white text-teal-700 hover:bg-teal-50 shadow-lg">Seanslarım</Button></Link>
              <Link href="/auth/onboarding/mentor"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Profili Güncelle</Button></Link>
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        {(!hasProfile || !hasOfferings) && (
          <Card className="mb-8 border-teal-200 bg-teal-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center"><Info className="w-5 h-5 text-teal-600" /></div>
                <div className="flex-1">
                  <CardTitle className="text-teal-900">Profilini Tamamla</CardTitle>
                  <CardDescription className="text-teal-700">Öğrenci kabul edebilmek ve platformda görünür olmak için profil bilgilerini tamamlamalısın.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-3">
              {!hasProfile && <Button onClick={() => router.push('/auth/onboarding/mentor?step=profile')} className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white">Profil Oluştur</Button>}
              {!hasOfferings && hasProfile && <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50" onClick={() => router.push('/auth/onboarding/mentor?step=pricing')}>Ücretlendirme Belirle</Button>}
            </CardContent>
          </Card>
        )}

        {/* Verification */}
        {hasProfile && hasOfferings && !hasVerifications && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-yellow-600" /></div>
                <div className="flex-1">
                  <CardTitle className="text-yellow-900">Doğrulama Belgesi Yükle</CardTitle>
                  <CardDescription className="text-yellow-700">Öğrenci kabul edebilmek için doğrulama belgelerini yüklemelisin.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent><Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100" onClick={() => router.push('/auth/onboarding/mentor?step=verification')}>Belgeleri Yükle</Button></CardContent>
          </Card>
        )}

        {/* Approval */}
        {hasProfile && hasOfferings && hasVerifications && (
          <Card className={`mb-8 ${isApproved ? 'border-green-200 bg-green-50' : 'border-teal-200 bg-teal-50'}`}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isApproved ? 'bg-green-100' : 'bg-teal-100'}`}>
                  {isApproved ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-teal-600" />}
                </div>
                <div className="flex-1">
                  <CardTitle className={isApproved ? 'text-green-900' : 'text-teal-900'}>
                    {isApproved ? '✓ Doğrulama belgeleriniz onaylandı!' : 'Doğrulama Belgesi Onayı Bekleniyor'}
                  </CardTitle>
                  <CardDescription className={isApproved ? 'text-green-700' : 'text-teal-700'}>
                    {isApproved ? 'Artık öğrenci kabul edebilir ve uygunluk saatlerinizi ayarlayabilirsiniz.' : 'Yüklediğiniz doğrulama belgeleri admin onayı bekliyor.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {isApproved && (
              <CardContent>
                <Link href="/mentor/availability"><Button className="gap-2 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white"><Calendar className="w-4 h-4" />Uygunluk Saatleri Ekle</Button></Link>
              </CardContent>
            )}
          </Card>
        )}

        {/* Profile Summary */}
        {hasProfile && (
          <Card className="mb-6 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profil Özeti</CardTitle>
              <Link href="/auth/onboarding/mentor"><Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50">Profili Güncelle</Button></Link>
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
                      {v.status === 'Approved' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs"><CheckCircle className="w-3 h-3" />Onaylandı</span>}
                      {v.status === 'Pending' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs"><Clock className="w-3 h-3" />Bekliyor</span>}
                      {v.status === 'Rejected' && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">✕ Reddedildi</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2"><b>Yayında:</b> {profile.isListed ? 'Evet' : 'Hayır'}</div>
            </CardContent>
          </Card>
        )}

        {/* Offerings */}
        {hasOfferings && (
          <Card className="mb-8 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Paketlerim</CardTitle>
              <Link href="/mentor/offerings"><Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50">Paketleri Yönet</Button></Link>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-1">
              {offerings.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${o.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <b>{o.title}</b>: {o.priceAmount} {o.currency} / {o.durationMinDefault} dk
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold text-gray-900">₺0</p><p className="text-xs text-gray-500">Bu Ay Kazanç</p></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Users className="w-5 h-5 text-teal-600" /></div><div><p className="text-2xl font-bold text-gray-900">0</p><p className="text-xs text-gray-500">Toplam Danışan</p></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-gray-900">0</p><p className="text-xs text-gray-500">Tamamlanan Dersler</p></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center"><Star className="w-5 h-5 text-yellow-600" /></div><div><p className="text-2xl font-bold text-gray-900">-</p><p className="text-xs text-gray-500">Ortalama Puan</p></div></div></CardContent></Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Hızlı İşlemler</CardTitle><CardDescription>Sık kullandığın işlemler</CardDescription></CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <Link href="/mentor/courses"><Button variant="outline" className="w-full h-24 flex-col border-teal-200 hover:border-teal-400 hover:bg-teal-50"><PlayCircle className="w-8 h-8 mb-2 text-teal-600" /><span>Video Kurslarım</span></Button></Link>
            <Link href="/mentor/group-classes"><Button variant="outline" className="w-full h-24 flex-col border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"><Users className="w-8 h-8 mb-2 text-indigo-600" /><span>Grup Dersleri</span></Button></Link>
            <Link href="/mentor/offerings"><Button variant="outline" className="w-full h-24 flex-col border-green-200 hover:border-green-400 hover:bg-green-50"><Package className="w-8 h-8 mb-2 text-green-600" /><span>Paketlerim</span></Button></Link>
            {isApproved ? (
              <Link href="/mentor/availability"><Button variant="outline" className="w-full h-24 flex-col border-teal-200 hover:border-teal-400 hover:bg-teal-50"><Calendar className="w-8 h-8 mb-2 text-teal-600" /><span>Uygunluk Ekle</span></Button></Link>
            ) : (
              <Button variant="outline" className="w-full h-24 flex-col opacity-50 cursor-not-allowed" disabled title="Doğrulama belgesi onayı gerekli"><Calendar className="w-8 h-8 mb-2" /><span>Uygunluk Ekle</span><span className="text-xs text-gray-500 mt-1">(Onay gerekli)</span></Button>
            )}
            <Link href="/mentor/bookings"><Button variant="outline" className="w-full h-24 flex-col border-teal-200 hover:border-teal-400 hover:bg-teal-50"><BookOpen className="w-8 h-8 mb-2 text-teal-600" /><span>Derslerim</span></Button></Link>
            <Link href="/mentor/earnings"><Button variant="outline" className="w-full h-24 flex-col border-green-200 hover:border-green-400 hover:bg-green-50"><DollarSign className="w-8 h-8 mb-2 text-green-600" /><span>Kazançlarım</span></Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
