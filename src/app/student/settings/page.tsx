'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  User, Lock, Bell, Shield, Trash2, Upload, Check, Camera,
  Eye, EyeOff, Calendar, BookOpen, CreditCard, Search, Users, MessageSquare,
  ChevronRight, Settings, Target, Briefcase, GraduationCap, Brain, TrendingUp,
  Rocket, Compass, Code, Palette, Calculator, X, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAuthStore } from '@/lib/stores/auth-store';
import { userApi } from '@/lib/api/user';
import { onboardingApi, type StudentOnboardingData } from '@/lib/api/onboarding';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

/* ── Schemas ── */
const profileSchema = z.object({
  displayName: z.string().min(2, 'En az 2 karakter'),
  email: z.string().email('Gecerli email adresi girin'),
  phone: z.string().optional(),
  birthYear: z.coerce.number().min(1950).max(2010).optional().or(z.literal(0).transform(() => undefined)),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Mevcut sifrenizi girin'),
  newPassword: z.string().min(8, 'En az 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Sifreler eslemiyor',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

/* ── Constants for onboarding fields ── */
const GOALS = [
  { id: 'career', label: 'Kariyerimi gelistirmek', icon: TrendingUp },
  { id: 'skill', label: 'Yeni beceri ogrenmek', icon: Brain },
  { id: 'exam', label: 'Sinavlara hazirlanmak', icon: GraduationCap },
  { id: 'job', label: 'Is bulmak', icon: Briefcase },
  { id: 'startup', label: 'Girisim baslatmak', icon: Rocket },
  { id: 'guidance', label: 'Genel rehberlik', icon: Compass },
];

const CATEGORIES = [
  { id: 'software', label: 'Yazilim', icon: Code },
  { id: 'data-science', label: 'Veri Bilimi & AI', icon: Brain },
  { id: 'design', label: 'Tasarim', icon: Palette },
  { id: 'business', label: 'Is & Girisimcilik', icon: Briefcase },
  { id: 'marketing', label: 'Dijital Pazarlama', icon: TrendingUp },
  { id: 'education', label: 'Egitim & Sinavlar', icon: GraduationCap },
  { id: 'finance', label: 'Finans', icon: Calculator },
  { id: 'career-coaching', label: 'Kariyer', icon: Target },
];

const LEVELS = [
  { id: 'zero', label: 'Sifir' },
  { id: 'beginner', label: 'Baslangic' },
  { id: 'intermediate', label: 'Orta' },
  { id: 'advanced', label: 'Ileri' },
];

const PREFERENCES = [
  { id: 'one-on-one', label: 'Birebir gorusme' },
  { id: 'structured', label: 'Yapilandirilmis dersler' },
  { id: 'project', label: 'Proje bazli' },
  { id: 'interview', label: 'Mulakat hazirligi' },
  { id: 'qa', label: 'Hizli soru-cevap' },
  { id: 'accountability', label: 'Takip & hesap verebilirlik' },
];

const AVAILABILITY = [
  { id: 'weekday-morning', label: 'Hafta ici sabah' },
  { id: 'weekday-afternoon', label: 'Hafta ici ogle' },
  { id: 'weekday-evening', label: 'Hafta ici aksam' },
  { id: 'weekend', label: 'Hafta sonu' },
];

const SESSION_FORMATS = [
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Ses' },
  { id: 'chat', label: 'Mesaj' },
];

/* ── Tab definitions ── */
const tabs = [
  { id: 'profile', name: 'Profil', icon: User },
  { id: 'learning', name: 'Ogrenme Tercihleri', icon: Target },
  { id: 'security', name: 'Guvenlik', icon: Lock },
  { id: 'notifications', name: 'Bildirimler', icon: Bell },
  { id: 'privacy', name: 'Gizlilik', icon: Shield },
];

export default function StudentSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Onboarding state ── */
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<number[]>([100, 400]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [sessionFormat, setSessionFormat] = useState<string[]>([]);
  const [newSubtopic, setNewSubtopic] = useState('');

  /* ── Load onboarding data ── */
  useEffect(() => {
    onboardingApi.getStudentOnboarding().then(existing => {
      if (!existing) { setOnboardingLoading(false); return; }
      if (existing.goals) try { setGoals(JSON.parse(existing.goals)); } catch {}
      if (existing.categories) try { setCategories(JSON.parse(existing.categories)); } catch {}
      if (existing.subtopics) try { setSubtopics(JSON.parse(existing.subtopics)); } catch {}
      if (existing.level) setLevel(existing.level);
      if (existing.preferences) try { setPreferences(JSON.parse(existing.preferences)); } catch {}
      if (existing.budgetMin != null && existing.budgetMax != null) {
        setBudgetRange([existing.budgetMin, existing.budgetMax]);
      }
      if (existing.availability) try { setAvailability(JSON.parse(existing.availability)); } catch {}
      if (existing.sessionFormats) try { setSessionFormat(JSON.parse(existing.sessionFormats)); } catch {}
      setOnboardingLoading(false);
    }).catch(() => setOnboardingLoading(false));
  }, []);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.displayName || '', email: user?.email || '', phone: user?.phone || '', birthYear: user?.birthYear || undefined },
  });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  // user verisi async geldiğinde formu güncelle
  useEffect(() => {
    if (user) {
      profileForm.reset({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthYear: user.birthYear || undefined,
      });
    }
  }, [user, profileForm]);

  const updateProfile = async (data: ProfileForm) => {
    try { setIsUpdating(true); await userApi.updateProfile({ displayName: data.displayName, phone: data.phone, birthYear: data.birthYear }); toast.success('Profil guncellendi'); refreshUser(); }
    catch (error: any) { toast.error(error.response?.data?.errors?.[0] || 'Bir hata olustu'); }
    finally { setIsUpdating(false); }
  };

  const updatePassword = async (data: PasswordForm) => {
    try { setIsUpdating(true); await userApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }); toast.success('Sifre guncellendi'); passwordForm.reset(); }
    catch (error: any) { toast.error(error.response?.data?.errors?.[0] || 'Bir hata olustu'); }
    finally { setIsUpdating(false); }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('Dosya boyutu 2MB\'den buyuk olamaz'); return; }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { toast.error('Sadece JPG, PNG, GIF veya WebP yuklenebilir'); return; }
    try { setIsUploadingAvatar(true); setSelectedPreset(null); await userApi.uploadAvatar(file); toast.success('Avatar guncellendi'); refreshUser(); }
    catch { toast.error('Dosya yuklenirken hata olustu'); }
    finally { setIsUploadingAvatar(false); }
  };

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const addSubtopic = () => {
    const trimmed = newSubtopic.trim();
    if (trimmed && !subtopics.includes(trimmed)) {
      setSubtopics([...subtopics, trimmed]);
      setNewSubtopic('');
    }
  };

  const saveOnboarding = async () => {
    try {
      setSavingOnboarding(true);
      await onboardingApi.saveStudentOnboarding({
        goals: JSON.stringify(goals),
        categories: JSON.stringify(categories),
        subtopics: JSON.stringify(subtopics),
        level,
        preferences: JSON.stringify(preferences),
        budgetMin: budgetRange[0],
        budgetMax: budgetRange[1],
        availability: JSON.stringify(availability),
        sessionFormats: JSON.stringify(sessionFormat),
      });
      toast.success('Ogrenme tercihleri kaydedildi');
    } catch {
      toast.error('Tercihler kaydedilirken hata olustu');
    } finally {
      setSavingOnboarding(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ═══════════════════ 3-COLUMN LAYOUT ═══════════════════ */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ─────────── LEFT PANEL (Dashboard-consistent) ─────────── */}
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
                    <svg className="absolute -inset-0.5 w-[52px] h-[52px]" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="24" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                      <circle cx="26" cy="26" r="24" fill="none" stroke="#14b8a6" strokeWidth="2"
                        strokeDasharray={`${(profilePercent / 100) * 150.8} 150.8`} strokeLinecap="round" transform="rotate(-90 26 26)" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{user?.displayName}</p>
                    <p className="text-xs text-gray-500">%{profilePercent} tamamlandi</p>
                  </div>
                </div>
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
                    { href: '/student/settings', icon: Settings, label: 'Ayarlar', color: 'text-teal-600', active: true },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        item.active
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : item.primary
                          ? 'bg-teal-50/50 text-teal-700 font-medium hover:bg-teal-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="truncate">{item.label}</span>
                      {(item.primary || item.active) && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-400" />}
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Settings Tabs */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-gray-700">Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-0.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                        activeTab === tab.id
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* ─────────── MAIN CONTENT ─────────── */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* ═══ TAB: PROFILE ═══ */}
            {activeTab === 'profile' && (
              <>
                {/* Avatar */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Camera className="w-5 h-5" />Profil Fotografi</CardTitle>
                    <CardDescription>Kendi fotografinizi yukleyin veya onerilen avatarlardan birini secin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-teal-100">
                          <AvatarImage src={user?.avatarUrl} />
                          <AvatarFallback className="text-3xl bg-teal-50 text-teal-700">{user?.displayName?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <div>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); e.target.value = ''; }} />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                          <Upload className="w-4 h-4 mr-2" />{isUploadingAvatar ? 'Yukleniyor...' : 'Bilgisayarimdan Yukle'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF veya WebP. Max 2MB.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Info */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Kisisel Bilgiler</CardTitle>
                    <CardDescription>Ad, email ve iletisim bilgilerinizi guncelleyin</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(updateProfile)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Isim Soyisim</label>
                        <Input {...profileForm.register('displayName')} />
                        {profileForm.formState.errors.displayName && <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.displayName.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input type="email" {...profileForm.register('email')} disabled />
                        <p className="text-xs text-gray-500 mt-1">Email adresi degistirilemez</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telefon (Opsiyonel)</label>
                        <Input type="tel" {...profileForm.register('phone')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Dogum Yili (Opsiyonel)</label>
                        <Input type="number" {...profileForm.register('birthYear')} placeholder="1990" />
                      </div>
                      <Button type="submit" disabled={isUpdating} className="bg-teal-600 hover:bg-teal-700 text-white">
                        {isUpdating ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ═══ TAB: LEARNING PREFERENCES (Onboarding Data) ═══ */}
            {activeTab === 'learning' && (
              <>
                {onboardingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                  </div>
                ) : (
                  <>
                    {/* Goals */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Target className="w-5 h-5 text-teal-600" />Hedeflerim</CardTitle>
                        <CardDescription>Mentorluktan ne bekliyorsun? (birden fazla secebilirsin)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {GOALS.map((goal) => {
                            const selected = goals.includes(goal.id);
                            return (
                              <button
                                key={goal.id}
                                onClick={() => toggleItem(goals, goal.id, setGoals)}
                                className={cn(
                                  'flex items-center gap-2 p-3 rounded-xl border text-sm transition-all text-left',
                                  selected ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-teal-200 text-gray-700'
                                )}
                              >
                                <goal.icon className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-teal-600' : 'text-gray-400'}`} />
                                <span className="truncate">{goal.label}</span>
                                {selected && <Check className="w-3.5 h-3.5 ml-auto text-teal-600 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Categories */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-5 h-5 text-green-600" />Ilgi Alanlarim</CardTitle>
                        <CardDescription>Hangi konularda mentorluk almak istiyorsun?</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {CATEGORIES.map((cat) => {
                            const selected = categories.includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                onClick={() => toggleItem(categories, cat.id, setCategories)}
                                className={cn(
                                  'flex items-center gap-2 p-3 rounded-xl border text-sm transition-all text-left',
                                  selected ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200 text-gray-700'
                                )}
                              >
                                <cat.icon className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-green-600' : 'text-gray-400'}`} />
                                <span className="truncate">{cat.label}</span>
                                {selected && <Check className="w-3.5 h-3.5 ml-auto text-green-600 flex-shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Subtopics */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Alt Konular</CardTitle>
                        <CardDescription>Spesifik konularini ekle (ornegin: React, Python, YKS Matematik)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {subtopics.map((topic) => (
                            <Badge key={topic} variant="outline" className="px-2.5 py-1 text-xs border-teal-200 bg-teal-50 text-teal-700 gap-1">
                              {topic}
                              <button onClick={() => setSubtopics(subtopics.filter(t => t !== topic))} className="ml-0.5 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Konu ekle..."
                            value={newSubtopic}
                            onChange={(e) => setNewSubtopic(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtopic(); } }}
                            className="flex-1"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={addSubtopic} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Level */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Seviyem</CardTitle>
                        <CardDescription>Genel yetkinlik seviyen</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                          {LEVELS.map((lvl) => (
                            <button
                              key={lvl.id}
                              onClick={() => setLevel(lvl.id)}
                              className={cn(
                                'p-3 rounded-xl border text-sm font-medium transition-all',
                                level === lvl.id ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-teal-200 text-gray-600'
                              )}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Ogrenme Tercihleri</CardTitle>
                        <CardDescription>Nasil ogrenmeyi tercih ediyorsun?</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {PREFERENCES.map((pref) => {
                            const selected = preferences.includes(pref.id);
                            return (
                              <button
                                key={pref.id}
                                onClick={() => toggleItem(preferences, pref.id, setPreferences)}
                                className={cn(
                                  'p-3 rounded-xl border text-sm transition-all text-left',
                                  selected ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-indigo-200 text-gray-700'
                                )}
                              >
                                <span>{pref.label}</span>
                                {selected && <Check className="w-3.5 h-3.5 inline ml-1 text-indigo-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Budget, Availability, Format */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Butce & Uygunluk</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Budget */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Butce Araligi: <span className="text-teal-600">{budgetRange[0]} - {budgetRange[1]} TL</span>
                          </label>
                          <Slider
                            value={budgetRange}
                            onValueChange={setBudgetRange}
                            min={0}
                            max={500}
                            step={25}
                          />
                        </div>

                        {/* Availability */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Uygun Zamanlarim</label>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABILITY.map((slot) => {
                              const selected = availability.includes(slot.id);
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => toggleItem(availability, slot.id, setAvailability)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg border text-xs transition-all',
                                    selected ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-teal-200'
                                  )}
                                >
                                  {slot.label} {selected && <Check className="w-3 h-3 inline ml-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Session Format */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Seans Formati</label>
                          <div className="flex gap-2">
                            {SESSION_FORMATS.map((fmt) => {
                              const selected = sessionFormat.includes(fmt.id);
                              return (
                                <button
                                  key={fmt.id}
                                  onClick={() => toggleItem(sessionFormat, fmt.id, setSessionFormat)}
                                  className={cn(
                                    'px-4 py-2 rounded-lg border text-sm transition-all',
                                    selected ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-teal-200'
                                  )}
                                >
                                  {fmt.label} {selected && <Check className="w-3.5 h-3.5 inline ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={saveOnboarding}
                        disabled={savingOnboarding}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                      >
                        {savingOnboarding ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ═══ TAB: SECURITY ═══ */}
            {activeTab === 'security' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Sifre Degistir</CardTitle>
                  <CardDescription>Guclu bir sifre kullanin (en az 8 karakter)</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(updatePassword)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Mevcut Sifre</label>
                      <div className="relative">
                        <Input type={showCurrentPw ? 'text' : 'password'} {...passwordForm.register('currentPassword')} className="pr-10" />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Yeni Sifre</label>
                      <div className="relative">
                        <Input type={showNewPw ? 'text' : 'password'} {...passwordForm.register('newPassword')} className="pr-10" />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Yeni Sifre (Tekrar)</label>
                      <div className="relative">
                        <Input type={showConfirmPw ? 'text' : 'password'} {...passwordForm.register('confirmPassword')} className="pr-10" />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" disabled={isUpdating} className="bg-teal-600 hover:bg-teal-700 text-white">
                      {isUpdating ? 'Guncelleniyor...' : 'Sifreyi Guncelle'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ═══ TAB: NOTIFICATIONS ═══ */}
            {activeTab === 'notifications' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Bildirim Tercihleri</CardTitle>
                  <CardDescription>Hangi bildirimleri almak istediginizi secin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Email Bildirimleri', desc: 'Yeni mesajlar ve ders hatirlatmalari', defaultChecked: true },
                    { label: 'SMS Bildirimleri', desc: 'Sadece acil durumlarda', defaultChecked: false },
                    { label: 'Push Bildirimleri', desc: 'Tarayici bildirimleri', defaultChecked: true },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked={item.defaultChecked} className="w-5 h-5 accent-teal-600" />
                    </label>
                  ))}
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">Tercihleri Kaydet</Button>
                </CardContent>
              </Card>
            )}

            {/* ═══ TAB: PRIVACY ═══ */}
            {activeTab === 'privacy' && (
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Gizlilik Ayarlari</CardTitle>
                    <CardDescription>Verilerinizi ve gorunurlugunuzu kontrol edin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Profil Gorunurlugu', desc: 'Profilinizi herkese goster', defaultChecked: true },
                      { label: 'Aktivite Durumu', desc: 'Cevrimici durumunuzu goster', defaultChecked: true },
                    ].map((item) => (
                      <label key={item.label} className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <input type="checkbox" defaultChecked={item.defaultChecked} className="w-5 h-5 accent-teal-600" />
                      </label>
                    ))}
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">Ayarlari Kaydet</Button>
                  </CardContent>
                </Card>
                <Card className="border-red-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-red-600 text-base">Tehlikeli Bolge</CardTitle>
                    <CardDescription>Kalici islemler - dikkatli olun</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">Hesabi Sil</p>
                        <p className="text-xs text-gray-500">Tum verileriniz kalici olarak silinecek</p>
                      </div>
                      <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" />Hesabi Sil</Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
