'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  User, Lock, Bell, Shield, Trash2, Upload, Check, Camera,
  Eye, EyeOff, Target, Briefcase, BookOpen, MessageSquare, Calendar,
  Settings, ChevronRight, Users, DollarSign, Clock, Plus, X, Video, Mic, MessageCircle,
  Globe, Linkedin, Github, ExternalLink, GraduationCap, Award, Star, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/stores/auth-store';
import { userApi } from '@/lib/api/user';
import { onboardingApi, type MentorOnboardingData } from '@/lib/api/onboarding';
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

/* ── Constants for mentor onboarding fields ── */
const CATEGORIES = [
  { id: 'software', label: 'Yazilim Gelistirme', emoji: '\u{1F4BB}' },
  { id: 'data-science', label: 'Veri Bilimi & AI', emoji: '\u{1F916}' },
  { id: 'design', label: 'Tasarim (UI/UX)', emoji: '\u{1F3A8}' },
  { id: 'business', label: 'Is & Girisimcilik', emoji: '\u{1F4CA}' },
  { id: 'marketing', label: 'Dijital Pazarlama', emoji: '\u{1F4F1}' },
  { id: 'education', label: 'Egitim & Sinavlar', emoji: '\u{1F4DA}' },
  { id: 'finance', label: 'Finans & Muhasebe', emoji: '\u{1F4B0}' },
  { id: 'career', label: 'Kariyer Koclugu', emoji: '\u{1F3AF}' },
  { id: 'product', label: 'Urun Yonetimi', emoji: '\u{1F680}' },
  { id: 'devops', label: 'DevOps & Cloud', emoji: '\u{2601}\u{FE0F}' },
];

const SUGGESTED_SUBTOPICS: Record<string, string[]> = {
  'software': ['React', 'Node.js', '.NET', 'Python', 'Java', 'TypeScript', 'Go', 'Swift', 'Flutter', 'React Native'],
  'data-science': ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Python', 'TensorFlow', 'PyTorch', 'SQL', 'Power BI', 'Tableau'],
  'design': ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping', 'Adobe XD'],
  'business': ['Startup', 'Business Plan', 'Strateji', 'Yonetim', 'Liderlik'],
  'marketing': ['SEO', 'Google Ads', 'Social Media', 'Content Marketing', 'Growth Hacking'],
  'education': ['YKS', 'TYT', 'AYT', 'KPSS', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Turkce', 'Geometri', 'Ingilizce', 'IELTS', 'TOEFL'],
  'finance': ['Muhasebe', 'Vergi', 'Yatirim', 'Kripto', 'Borsa', 'Finansal Analiz'],
  'career': ['CV Hazirlama', 'Mulakat Hazirlik', 'Kariyer Gecisi', 'LinkedIn Optimizasyon'],
  'product': ['Agile', 'Scrum', 'Product Discovery', 'User Story', 'Roadmap'],
  'devops': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Terraform', 'Linux'],
};

const TARGET_AUDIENCES = [
  { id: 'high-school', label: 'Lise Ogrencileri' },
  { id: 'exam-prep', label: 'Sinav Hazirlik' },
  { id: 'students', label: 'Universite Ogrencileri' },
  { id: 'juniors', label: 'Junior Profesyoneller' },
  { id: 'switchers', label: 'Kariyer Degistirenler' },
  { id: 'seniors', label: 'Deneyimli Profesyoneller' },
  { id: 'entrepreneurs', label: 'Girisimciler' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Baslangic' },
  { id: 'intermediate', label: 'Orta Seviye' },
  { id: 'advanced', label: 'Ileri Seviye' },
];

const MENTORING_TYPES_PRO = [
  { id: 'career', label: 'Kariyer Rehberligi', icon: Target },
  { id: 'technical', label: 'Teknik Mentorluk', icon: Briefcase },
  { id: 'interview', label: 'Mulakat Hazirlik', icon: MessageSquare },
  { id: 'cv-review', label: 'CV Inceleme', icon: User },
  { id: 'project', label: 'Proje Destegi', icon: Package },
  { id: 'exam-coaching', label: 'Sinav Koclugu', icon: BookOpen },
];

const MENTORING_TYPES_STUDENT = [
  { id: 'exam-coaching', label: 'Sinav Koclugu', icon: BookOpen },
  { id: 'study-plan', label: 'Calisma Plani', icon: Target },
  { id: 'motivation', label: 'Motivasyon Destegi', icon: Star },
  { id: 'subject-help', label: 'Ders Destegi', icon: GraduationCap },
  { id: 'uni-guidance', label: 'Universite Rehberligi', icon: Award },
  { id: 'experience-sharing', label: 'Deneyim Paylasimi', icon: MessageSquare },
];

const SESSION_FORMATS = [
  { id: 'video', label: 'Goruntulu Gorusme', icon: Video },
  { id: 'audio', label: 'Sesli Gorusme', icon: Mic },
  { id: 'chat', label: 'Yazili Mesaj', icon: MessageCircle },
];

const CITIES = [
  'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana',
  'Konya', 'Gaziantep', 'Mersin', 'Kayseri', 'Eskisehir', 'Diyarbakir',
  'Samsun', 'Trabzon', 'Denizli', 'Malatya', 'Erzurum', 'Sakarya',
];

const LANGUAGES = [
  'Turkce', 'Ingilizce', 'Almanca', 'Fransizca', 'Ispanyolca',
  'Arapca', 'Rusca', 'Japonca', 'Cince', 'Korece',
];

const TIMEZONES = [
  'Europe/Istanbul (UTC+3)',
  'Europe/London (UTC+0)',
  'Europe/Berlin (UTC+1)',
  'America/New_York (UTC-5)',
  'America/Los_Angeles (UTC-8)',
  'Asia/Dubai (UTC+4)',
];

const YEARS_OF_EXPERIENCE = [
  { id: '1-2', label: '1-2 yil' },
  { id: '3-5', label: '3-5 yil' },
  { id: '5-10', label: '5-10 yil' },
  { id: '10-15', label: '10-15 yil' },
  { id: '15+', label: '15+ yil' },
];

/* ── Tab definitions ── */
const tabs = [
  { id: 'profile', name: 'Profil', icon: User },
  { id: 'mentoring', name: 'Mentorluk Bilgileri', icon: Target },
  { id: 'security', name: 'Guvenlik', icon: Lock },
  { id: 'notifications', name: 'Bildirimler', icon: Bell },
  { id: 'privacy', name: 'Gizlilik', icon: Shield },
];

export default function MentorSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Mentor onboarding state ── */
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [mentorType, setMentorType] = useState('');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('Europe/Istanbul (UTC+3)');
  const [languages, setLanguages] = useState<string[]>(['Turkce']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [subtopicInput, setSubtopicInput] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [previousCompanies, setPreviousCompanies] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [mentoringTypes, setMentoringTypes] = useState<string[]>([]);
  const [sessionFormats, setSessionFormats] = useState<string[]>([]);
  const [offerFreeIntro, setOfferFreeIntro] = useState(true);

  /* ── Load mentor onboarding data ── */
  useEffect(() => {
    onboardingApi.getMentorOnboarding().then(existing => {
      if (!existing) { setOnboardingLoading(false); return; }
      if (existing.mentorType) setMentorType(existing.mentorType);
      if (existing.city) setCity(existing.city);
      if (existing.timezone) setTimezone(existing.timezone);
      if (existing.languages) try { setLanguages(JSON.parse(existing.languages)); } catch {}
      if (existing.categories) try { setSelectedCategories(JSON.parse(existing.categories)); } catch {}
      if (existing.subtopics) try { setSubtopics(JSON.parse(existing.subtopics)); } catch {}
      if (existing.targetAudience) try { setTargetAudience(JSON.parse(existing.targetAudience)); } catch {}
      if (existing.experienceLevels) try { setExperienceLevels(JSON.parse(existing.experienceLevels)); } catch {}
      if (existing.yearsOfExperience) setYearsOfExperience(existing.yearsOfExperience);
      if (existing.currentRole) setCurrentRole(existing.currentRole);
      if (existing.currentCompany) setCurrentCompany(existing.currentCompany);
      if (existing.previousCompanies) setPreviousCompanies(existing.previousCompanies);
      if (existing.education) setEducation(existing.education);
      if (existing.certifications) setCertifications(existing.certifications);
      if (existing.linkedinUrl) setLinkedinUrl(existing.linkedinUrl);
      if (existing.githubUrl) setGithubUrl(existing.githubUrl);
      if (existing.portfolioUrl) setPortfolioUrl(existing.portfolioUrl);
      if (existing.mentoringTypes) try { setMentoringTypes(JSON.parse(existing.mentoringTypes)); } catch {}
      if (existing.sessionFormats) try { setSessionFormats(JSON.parse(existing.sessionFormats)); } catch {}
      if (existing.offerFreeIntro !== undefined) setOfferFreeIntro(existing.offerFreeIntro ?? true);
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
    const trimmed = subtopicInput.trim();
    if (trimmed && !subtopics.includes(trimmed)) {
      setSubtopics([...subtopics, trimmed]);
      setSubtopicInput('');
    }
  };

  const suggestedSubtopics = selectedCategories.flatMap(cat => SUGGESTED_SUBTOPICS[cat] || []).filter(s => !subtopics.includes(s));

  const saveOnboarding = async () => {
    try {
      setSavingOnboarding(true);
      await onboardingApi.saveMentorOnboarding({
        mentorType,
        city,
        timezone,
        languages: JSON.stringify(languages),
        categories: JSON.stringify(selectedCategories),
        subtopics: JSON.stringify(subtopics),
        targetAudience: JSON.stringify(targetAudience),
        experienceLevels: JSON.stringify(experienceLevels),
        yearsOfExperience,
        currentRole,
        currentCompany,
        previousCompanies,
        education,
        certifications,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        mentoringTypes: JSON.stringify(mentoringTypes),
        sessionFormats: JSON.stringify(sessionFormats),
        offerFreeIntro,
      });
      toast.success('Mentorluk bilgileri kaydedildi');
    } catch {
      toast.error('Bilgiler kaydedilirken hata olustu');
    } finally {
      setSavingOnboarding(false);
    }
  };

  const activeMentoringTypes = mentorType === 'student' ? MENTORING_TYPES_STUDENT : MENTORING_TYPES_PRO;

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
                    { href: '/mentor/dashboard', icon: User, label: 'Panel', color: 'text-teal-600' },
                    { href: '/mentor/courses', icon: BookOpen, label: 'Video Kurslarim', color: 'text-green-600' },
                    { href: '/mentor/offerings', icon: Package, label: 'Paketlerim', color: 'text-blue-600' },
                    { href: '/mentor/availability', icon: Clock, label: 'Uygunluk', color: 'text-purple-600' },
                    { href: '/mentor/bookings', icon: Calendar, label: 'Derslerim', color: 'text-orange-600' },
                    { href: '/mentor/group-classes', icon: Users, label: 'Grup Dersleri', color: 'text-indigo-600' },
                    { href: '/mentor/messages', icon: MessageSquare, label: 'Mesajlarim', color: 'text-pink-600' },
                    { href: '/mentor/earnings', icon: DollarSign, label: 'Kazanclarim', color: 'text-emerald-600' },
                    { href: '/mentor/settings', icon: Settings, label: 'Ayarlar', color: 'text-teal-600', active: true },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        item.active
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="truncate">{item.label}</span>
                      {item.active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-400" />}
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

            {/* ═══ TAB: MENTORING INFO (Onboarding Data) ═══ */}
            {activeTab === 'mentoring' && (
              <>
                {onboardingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                  </div>
                ) : (
                  <>
                    {/* Mentor Type & Location */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Globe className="w-5 h-5 text-teal-600" />Genel Bilgiler</CardTitle>
                        <CardDescription>Mentor tipiniz, konum ve dil bilgileriniz</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Mentor Type */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Mentor Tipi</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'professional', label: 'Profesyonel', desc: 'Is hayatinda aktif' },
                              { id: 'student', label: 'Ogrenci Mentor', desc: 'Universite ogrencisi' },
                            ].map((type) => (
                              <button
                                key={type.id}
                                onClick={() => setMentorType(type.id)}
                                className={cn(
                                  'p-3 rounded-xl border text-left transition-all',
                                  mentorType === type.id ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:border-teal-200'
                                )}
                              >
                                <p className={cn('text-sm font-medium', mentorType === type.id ? 'text-teal-700' : 'text-gray-700')}>{type.label}</p>
                                <p className="text-xs text-gray-500">{type.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Sehir</label>
                          <Select value={city} onValueChange={setCity}>
                            <SelectTrigger><SelectValue placeholder="Sehir secin" /></SelectTrigger>
                            <SelectContent>
                              {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Timezone */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Saat Dilimi</label>
                          <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger><SelectValue placeholder="Saat dilimi secin" /></SelectTrigger>
                            <SelectContent>
                              {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Languages */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Diller</label>
                          <div className="flex flex-wrap gap-2">
                            {LANGUAGES.map((lang) => {
                              const selected = languages.includes(lang);
                              return (
                                <button
                                  key={lang}
                                  onClick={() => toggleItem(languages, lang, setLanguages)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg border text-xs transition-all',
                                    selected ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-teal-200'
                                  )}
                                >
                                  {lang} {selected && <Check className="w-3 h-3 inline ml-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Categories */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Target className="w-5 h-5 text-green-600" />Uzmanlik Alanlari</CardTitle>
                        <CardDescription>Hangi konularda mentorluk veriyorsun? (en fazla 3)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {CATEGORIES.map((cat) => {
                            const selected = selectedCategories.includes(cat.id);
                            const atMax = selectedCategories.length >= 3 && !selected;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => !atMax && toggleItem(selectedCategories, cat.id, setSelectedCategories)}
                                disabled={atMax}
                                className={cn(
                                  'flex items-center gap-2 p-3 rounded-xl border text-sm transition-all text-left',
                                  selected ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-200 text-gray-700',
                                  atMax && 'opacity-40 cursor-not-allowed'
                                )}
                              >
                                <span className="text-base">{cat.emoji}</span>
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
                        <CardDescription>Spesifik uzmanlik konularini ekle</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 mb-1">
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
                            value={subtopicInput}
                            onChange={(e) => setSubtopicInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtopic(); } }}
                            className="flex-1"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={addSubtopic} className="border-teal-200 text-teal-700 hover:bg-teal-50">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {suggestedSubtopics.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Oneriler:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {suggestedSubtopics.slice(0, 10).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setSubtopics([...subtopics, s])}
                                  className="px-2 py-1 rounded-md border border-dashed border-gray-300 text-xs text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
                                >
                                  + {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Target Audience & Experience Levels */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" />Hedef Kitle & Seviye</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium mb-2">Hedef Kitle</label>
                          <div className="flex flex-wrap gap-2">
                            {TARGET_AUDIENCES.map((ta) => {
                              const selected = targetAudience.includes(ta.id);
                              return (
                                <button
                                  key={ta.id}
                                  onClick={() => toggleItem(targetAudience, ta.id, setTargetAudience)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg border text-xs transition-all',
                                    selected ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                                  )}
                                >
                                  {ta.label} {selected && <Check className="w-3 h-3 inline ml-0.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Ogrenci Seviyeleri</label>
                          <div className="flex flex-wrap gap-2">
                            {EXPERIENCE_LEVELS.map((lvl) => {
                              const selected = experienceLevels.includes(lvl.id);
                              return (
                                <button
                                  key={lvl.id}
                                  onClick={() => toggleItem(experienceLevels, lvl.id, setExperienceLevels)}
                                  className={cn(
                                    'px-4 py-2 rounded-lg border text-sm transition-all',
                                    selected ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                                  )}
                                >
                                  {lvl.label} {selected && <Check className="w-3.5 h-3.5 inline ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Professional Info */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" />Profesyonel Bilgiler</CardTitle>
                        <CardDescription>Kariyer ve egitim bilgileriniz</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Deneyim Suresi</label>
                            <Select value={yearsOfExperience} onValueChange={setYearsOfExperience}>
                              <SelectTrigger><SelectValue placeholder="Secin" /></SelectTrigger>
                              <SelectContent>
                                {YEARS_OF_EXPERIENCE.map(y => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Mevcut Pozisyon</label>
                            <Input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="ornegin: Senior Developer" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Mevcut Sirket</label>
                            <Input value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} placeholder="Sirket adi" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Onceki Sirketler</label>
                            <Input value={previousCompanies} onChange={(e) => setPreviousCompanies(e.target.value)} placeholder="Google, Microsoft..." />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Egitim</label>
                            <Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Universite, Bolum" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Sertifikalar</label>
                            <Input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="AWS, PMP..." />
                          </div>
                        </div>

                        {/* Social Links */}
                        <div className="pt-2">
                          <label className="block text-sm font-medium mb-3">Sosyal Baglantilar</label>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/kullaniciadi" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Github className="w-4 h-4 text-gray-700 flex-shrink-0" />
                              <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="github.com/kullaniciadi" />
                            </div>
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-teal-600 flex-shrink-0" />
                              <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="portfolyo.com" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mentoring Types & Session Formats */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-5 h-5 text-purple-600" />Mentorluk Tercihleri</CardTitle>
                        <CardDescription>Mentorluk turlerin ve seans formatlarin</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* Mentoring Types */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Mentorluk Turleri</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {activeMentoringTypes.map((mt) => {
                              const selected = mentoringTypes.includes(mt.id);
                              return (
                                <button
                                  key={mt.id}
                                  onClick={() => toggleItem(mentoringTypes, mt.id, setMentoringTypes)}
                                  className={cn(
                                    'flex items-center gap-2 p-3 rounded-xl border text-sm transition-all text-left',
                                    selected ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200 text-gray-700'
                                  )}
                                >
                                  <mt.icon className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-purple-600' : 'text-gray-400'}`} />
                                  <span className="truncate">{mt.label}</span>
                                  {selected && <Check className="w-3.5 h-3.5 ml-auto text-purple-600 flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Session Formats */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Seans Formati</label>
                          <div className="flex flex-wrap gap-2">
                            {SESSION_FORMATS.map((fmt) => {
                              const selected = sessionFormats.includes(fmt.id);
                              return (
                                <button
                                  key={fmt.id}
                                  onClick={() => toggleItem(sessionFormats, fmt.id, setSessionFormats)}
                                  className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all',
                                    selected ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-teal-200'
                                  )}
                                >
                                  <fmt.icon className={`w-4 h-4 ${selected ? 'text-teal-600' : 'text-gray-400'}`} />
                                  {fmt.label} {selected && <Check className="w-3.5 h-3.5 ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Free Intro */}
                        <div className="flex items-center justify-between p-4 border rounded-xl">
                          <div>
                            <p className="font-medium text-sm">Ucretsiz Tanitim Seansi</p>
                            <p className="text-xs text-gray-500">15 dakika ucretsiz tanitim gorusmesi sun</p>
                          </div>
                          <Switch checked={offerFreeIntro} onCheckedChange={setOfferFreeIntro} />
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
                        {savingOnboarding ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
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
