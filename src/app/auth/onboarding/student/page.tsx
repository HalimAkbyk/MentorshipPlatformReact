'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Briefcase, GraduationCap, BookOpen, Rocket, Users,
  MessageSquare, ChevronRight, ChevronLeft, Globe, Clock, Star,
  Sparkles, ArrowRight, Check, Search, Code, BarChart3,
  Palette, TrendingUp, Lightbulb, Brain, Calculator, Compass,
  CalendarDays, Video, Mic, MessageCircle,
  Zap, Heart, Shield, Award, CheckCircle2, X, User, Phone,
  Building2, Camera
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SearchableCitySelect } from '@/components/ui/searchable-city-select';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { userApi } from '@/lib/api/user';
import { onboardingApi, type StudentOnboardingData } from '@/lib/api/onboarding';

// ===== TYPES =====
interface ProfileData {
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  phone: string;
  city: string;
  gender: string;
  status: string;
  // Conditional fields
  schoolName: string;
  grade: string;
  universityName: string;
  department: string;
  uniYear: string;
  graduationYear: string;
  companyName: string;
  position: string;
  sector: string;
  experience: string;
}

interface OnboardingFormData {
  goals: string[];
  categories: string[];
  subtopics: string[];
  level: string;
  preferences: string[];
  budgetRange: number[];
  availability: string[];
  sessionFormat: string[];
}

const initialProfile: ProfileData = {
  birthDay: '', birthMonth: '', birthYear: '', phone: '', city: '', gender: '', status: '',
  schoolName: '', grade: '', universityName: '', department: '', uniYear: '',
  graduationYear: '', companyName: '', position: '', sector: '', experience: '',
};

const initialOnboarding: OnboardingFormData = {
  goals: [], categories: [], subtopics: [], level: '',
  preferences: [], budgetRange: [100, 400], availability: [], sessionFormat: [],
};

// ===== STEP DEFINITIONS =====
const STEPS = [
  { id: 1, label: 'Profil', emoji: '📋' },
  { id: 2, label: 'Hedef', emoji: '🎯' },
  { id: 3, label: 'Konu', emoji: '📚' },
  { id: 4, label: 'Seviye', emoji: '📈' },
  { id: 5, label: 'Tercih', emoji: '💬' },
  { id: 6, label: 'Bütçe', emoji: '💰' },
  { id: 7, label: 'Eşleşme', emoji: '⭐' },
];

// ===== CONSTANTS =====
const GOALS = [
  { id: 'career', label: 'Kariyerimi geliştirmek', description: 'Terfi, pozisyon değişikliği veya kariyer planı', icon: TrendingUp, color: 'from-blue-500 to-indigo-500', bgLight: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
  { id: 'skill', label: 'Yeni bir beceri öğrenmek', description: 'Teknik veya profesyonel beceri kazanımı', icon: Brain, color: 'from-purple-500 to-fuchsia-500', bgLight: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700' },
  { id: 'exam', label: 'Sınavlara hazırlanmak', description: 'YKS, KPSS, dil sınavları veya sertifikalar', icon: GraduationCap, color: 'from-green-500 to-emerald-500', bgLight: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  { id: 'job', label: 'İş bulmak', description: 'CV, mülakat hazırlık, networking', icon: Briefcase, color: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  { id: 'startup', label: 'Girişim başlatmak', description: 'İş fikri, MVP, yatırımcı bulma', icon: Rocket, color: 'from-rose-500 to-pink-500', bgLight: 'bg-rose-50 border-rose-200', textColor: 'text-rose-700' },
  { id: 'guidance', label: 'Genel rehberlik almak', description: 'Yönlendirme, ilham ve motivasyon', icon: Compass, color: 'from-teal-500 to-cyan-500', bgLight: 'bg-teal-50 border-teal-200', textColor: 'text-teal-700' },
];

const CATEGORIES = [
  { id: 'software', label: 'Yazılım Geliştirme', icon: Code, emoji: '💻', subtopics: ['React', 'Node.js', 'Python', 'Java', 'TypeScript', '.NET', 'Go', 'Flutter', 'React Native', 'Swift'] },
  { id: 'data-science', label: 'Veri Bilimi & AI', icon: Brain, emoji: '🤖', subtopics: ['Machine Learning', 'Deep Learning', 'Python', 'SQL', 'TensorFlow', 'NLP', 'Power BI', 'Tableau'] },
  { id: 'design', label: 'Tasarım (UI/UX)', icon: Palette, emoji: '🎨', subtopics: ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping', 'Adobe XD'] },
  { id: 'business', label: 'İş & Girişimcilik', icon: Briefcase, emoji: '📊', subtopics: ['Startup', 'Business Plan', 'Strateji', 'Yönetim', 'Liderlik', 'MVP'] },
  { id: 'marketing', label: 'Dijital Pazarlama', icon: TrendingUp, emoji: '📱', subtopics: ['SEO', 'Google Ads', 'Social Media', 'Content Marketing', 'Growth Hacking'] },
  { id: 'education', label: 'Eğitim & Sınavlar', icon: GraduationCap, emoji: '📚', subtopics: ['YKS', 'TYT', 'AYT', 'KPSS', 'Matematik', 'Fizik', 'Kimya', 'İngilizce', 'IELTS', 'TOEFL'] },
  { id: 'finance', label: 'Finans & Muhasebe', icon: Calculator, emoji: '💰', subtopics: ['Muhasebe', 'Vergi', 'Yatırım', 'Borsa', 'Finansal Analiz', 'Kripto'] },
  { id: 'career', label: 'Kariyer Koçluğu', icon: Target, emoji: '🎯', subtopics: ['CV Hazırlama', 'Mülakat Hazırlık', 'Kariyer Geçişi', 'LinkedIn', 'Networking'] },
  { id: 'product', label: 'Ürün Yönetimi', icon: Lightbulb, emoji: '🚀', subtopics: ['Agile', 'Scrum', 'Product Discovery', 'User Story', 'Roadmap', 'OKR'] },
  { id: 'devops', label: 'DevOps & Cloud', icon: Globe, emoji: '☁️', subtopics: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Terraform'] },
];

const LEVELS = [
  { id: 'zero', label: 'Sıfırdan başlıyorum', description: 'Bu konuda hiç bilgim yok, merak ediyorum', emoji: '🌱', color: 'from-green-400 to-emerald-500', illustration: 'Henüz yolun başındasınız — bu harika bir başlangıç!' },
  { id: 'beginner', label: 'Başlangıç seviyesindeyim', description: 'Temel kavramları biliyorum, pratik yapmam gerekiyor', emoji: '🌿', color: 'from-teal-400 to-green-500', illustration: 'Temelleri biliyorsunuz, şimdi güçlendirme zamanı!' },
  { id: 'intermediate', label: 'Orta seviyedeyim', description: 'Proje yapabiliyorum ama derinleşmek istiyorum', emoji: '🌳', color: 'from-blue-400 to-teal-500', illustration: 'Güzel ilerliyorsunuz, bir mentorla çok daha hızlı büyüyeceksiniz!' },
  { id: 'advanced', label: 'İleri seviyedeyim', description: 'Deneyimliyim, uzman görüşü ve yönlendirme arıyorum', emoji: '🏔️', color: 'from-purple-400 to-indigo-500', illustration: 'Deneyimlisiniz — doğru mentor sizi bir üst seviyeye taşıyacak!' },
];

const PREFERENCES = [
  { id: '1on1', label: 'Birebir görüşmeler', description: 'Kişiye özel, odaklanmış mentorluk', icon: Users },
  { id: 'structured', label: 'Yapılandırılmış dersler', description: 'Adım adım müfredat takibi', icon: BookOpen },
  { id: 'project', label: 'Proje bazlı rehberlik', description: 'Gerçek projeler üzerinde çalışma', icon: Rocket },
  { id: 'interview', label: 'Mülakat hazırlık', description: 'Teknik ve davranışsal mülakat pratiği', icon: MessageSquare },
  { id: 'quick-qa', label: 'Hızlı soru-cevap', description: 'Kısa, odaklanmış danışmanlık', icon: Zap },
  { id: 'accountability', label: 'Takip & hesap verebilirlik', description: 'Düzenli check-in ve ilerleme takibi', icon: CheckCircle2 },
];

const AVAILABILITY_OPTIONS = [
  { id: 'weekday-morning', label: 'Hafta içi sabah', sublabel: '09:00 – 12:00', emoji: '🌅' },
  { id: 'weekday-afternoon', label: 'Hafta içi öğleden sonra', sublabel: '12:00 – 17:00', emoji: '☀️' },
  { id: 'weekday-evening', label: 'Hafta içi akşam', sublabel: '17:00 – 21:00', emoji: '🌆' },
  { id: 'weekend', label: 'Hafta sonu', sublabel: 'Cumartesi & Pazar', emoji: '🌙' },
];

const SESSION_FORMAT_OPTIONS = [
  { id: 'video', label: 'Görüntülü', icon: Video },
  { id: 'audio', label: 'Sesli', icon: Mic },
  { id: 'chat', label: 'Yazılı', icon: MessageCircle },
];

const STATUS_OPTIONS = [
  { id: 'highschool', label: 'Lise Öğrencisi', emoji: '🎒', description: 'Lise eğitimine devam ediyorum' },
  { id: 'university', label: 'Üniversite Öğrencisi', emoji: '🎓', description: 'Lisans veya ön lisans öğrencisiyim' },
  { id: 'newgrad', label: 'Yeni Mezun', emoji: '📜', description: 'Son 2 yıl içinde mezun oldum' },
  { id: 'employed', label: 'Çalışan', emoji: '💼', description: 'Bir işte aktif olarak çalışıyorum' },
  { id: 'jobseeker', label: 'İş Arayan', emoji: '🔍', description: 'Yeni iş fırsatları arıyorum' },
  { id: 'careerchange', label: 'Kariyer Değiştiren', emoji: '🔄', description: 'Farklı bir alana geçmek istiyorum' },
  { id: 'freelancer', label: 'Freelancer / Girişimci', emoji: '🚀', description: 'Bağımsız çalışıyorum veya girişimim var' },
];


const SECTORS = [
  'Teknoloji / Yazılım', 'Finans / Bankacılık', 'Sağlık', 'Eğitim', 'Perakende / E-Ticaret',
  'Üretim / İmalat', 'Medya / İletişim', 'Hukuk', 'Danışmanlık', 'Gayrimenkul',
  'Lojistik / Taşımacılık', 'Enerji', 'Turizm / Otelcilik', 'Savunma', 'Kamu', 'Diğer',
];

const STEP_MOTIVATIONS = [
  '',
  'Süper! Profiliniz şekilleniyor. Hedeflerinizi belirleyelim.',
  'Harika seçimler! Şimdi ilgi alanlarınızı keşfedelim.',
  'Güzel! Seviyenizi belirleyelim ki en uygun mentörlerle eşleşelim.',
  'Çok iyi gidiyorsunuz! Nasıl öğrenmeyi sevdiğinizi anlatalım.',
  'Neredeyse bitti! Son detayları tamamlayalım.',
  'Tebrikler! İşte sizin için seçtiğimiz mentörler.',
];

// ===== HELPERS =====
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const months = [
  { value: '01', label: 'Ocak' }, { value: '02', label: 'Şubat' }, { value: '03', label: 'Mart' },
  { value: '04', label: 'Nisan' }, { value: '05', label: 'Mayıs' }, { value: '06', label: 'Haziran' },
  { value: '07', label: 'Temmuz' }, { value: '08', label: 'Ağustos' }, { value: '09', label: 'Eylül' },
  { value: '10', label: 'Ekim' }, { value: '11', label: 'Kasım' }, { value: '12', label: 'Aralık' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => String(currentYear - 14 - i));

/** Format raw phone digits (e.g. "5551234567") into display format "(555) 123 45 67" */
const formatPhoneForDisplay = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length > 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)}${digits.length > 8 ? ' ' + digits.slice(8) : ''}`;
  } else if (digits.length > 3) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length > 0) {
    return `(${digits}`;
  }
  return '';
};

// ===== MAIN COMPONENT =====
export default function StudentOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [data, setData] = useState<OnboardingFormData>(initialOnboarding);
  const [topicSearch, setTopicSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefillDone = useRef(false);

  const TOTAL_STEPS = STEPS.length;
  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  useEffect(() => {
    initialize?.();
  }, [initialize]);

  // Auth guard
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user && !user.roles.includes(UserRole.Student)) {
      router.push('/public');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Prefill from existing user data + onboarding data
  useEffect(() => {
    if (!user || prefillDone.current) return;
    prefillDone.current = true;

    // Prefill profile from user
    if (user.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    }

    // Always prefill birthYear from user entity (not stored in onboarding profile)
    if (user.birthYear) {
      setProfile(p => ({ ...p, birthYear: String(user.birthYear) }));
    }

    // Prefill onboarding data from backend (single source of truth for all onboarding fields)
    onboardingApi.getStudentOnboarding().then(existing => {
      if (!existing) {
        // No onboarding data yet — fallback to user fields for phone
        if (user.phone) setProfile(p => ({ ...p, phone: formatPhoneForDisplay(user.phone || '') }));
        return;
      }

      // Profile fields from onboarding
      const profileUpdates: Partial<ProfileData> = {};
      if (existing.birthDay) profileUpdates.birthDay = existing.birthDay;
      if (existing.birthMonth) profileUpdates.birthMonth = existing.birthMonth;
      // Format phone for display
      const rawPhone = existing.phone || user.phone || '';
      if (rawPhone) profileUpdates.phone = formatPhoneForDisplay(rawPhone);
      if (existing.city) profileUpdates.city = existing.city;
      if (existing.gender) profileUpdates.gender = existing.gender;
      if (existing.status) profileUpdates.status = existing.status;
      if (existing.statusDetail) {
        try {
          const detail = JSON.parse(existing.statusDetail);
          Object.assign(profileUpdates, detail);
        } catch {}
      }

      if (Object.keys(profileUpdates).length > 0) {
        setProfile(p => ({ ...p, ...profileUpdates }));
      }

      // Onboarding form data
      const ob: Partial<OnboardingFormData> = {};
      if (existing.goals) try { ob.goals = JSON.parse(existing.goals); } catch {}
      if (existing.categories) try { ob.categories = JSON.parse(existing.categories); } catch {}
      if (existing.subtopics) try { ob.subtopics = JSON.parse(existing.subtopics); } catch {}
      if (existing.level) ob.level = existing.level;
      if (existing.preferences) try { ob.preferences = JSON.parse(existing.preferences); } catch {}
      if (existing.budgetMin != null && existing.budgetMax != null) {
        ob.budgetRange = [existing.budgetMin, existing.budgetMax];
      }
      if (existing.availability) try { ob.availability = JSON.parse(existing.availability); } catch {}
      if (existing.sessionFormats) try { ob.sessionFormat = JSON.parse(existing.sessionFormats); } catch {}

      if (Object.keys(ob).length > 0) {
        setData(prev => ({ ...prev, ...ob }));
      }
    }).catch(() => {
      // Fallback to user fields if API fails
      if (user.phone) setProfile(p => ({ ...p, phone: formatPhoneForDisplay(user.phone || '') }));
    });
  }, [user]);

  const updateProfile = (updates: Partial<ProfileData>) => setProfile(p => ({ ...p, ...updates }));
  const updateData = (updates: Partial<OnboardingFormData>) => setData(p => ({ ...p, ...updates }));

  const toggleItem = (field: keyof OnboardingFormData, item: string) => {
    setData(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          profile.birthDay !== '' &&
          profile.birthMonth !== '' &&
          profile.birthYear !== '' &&
          profile.phone.replace(/\D/g, '').length >= 10 &&
          profile.city !== '' &&
          profile.status !== ''
        );
      case 2: return data.goals.length > 0;
      case 3: return data.categories.length > 0;
      case 4: return data.level !== '';
      case 5: return data.preferences.length > 0;
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  };

  // Build the onboarding payload from current state
  const buildOnboardingPayload = (): StudentOnboardingData => ({
    birthDay: profile.birthDay || null,
    birthMonth: profile.birthMonth || null,
    phone: profile.phone.replace(/\s/g, '') || null,
    city: profile.city || null,
    gender: profile.gender || null,
    status: profile.status || null,
    statusDetail: buildStatusDetail(),
    goals: JSON.stringify(data.goals),
    categories: JSON.stringify(data.categories),
    subtopics: JSON.stringify(data.subtopics),
    level: data.level || null,
    preferences: JSON.stringify(data.preferences),
    budgetMin: data.budgetRange[0],
    budgetMax: data.budgetRange[1],
    availability: JSON.stringify(data.availability),
    sessionFormats: JSON.stringify(data.sessionFormat),
  });

  // Save progress silently in the background (no toast, no redirect)
  const saveCurrentProgress = async () => {
    try {
      // Save onboarding data
      await onboardingApi.saveStudentOnboarding(buildOnboardingPayload());

      // For step 1, also update the User profile (displayName, phone, birthYear)
      if (currentStep === 1) {
        const birthYear = profile.birthYear ? Number(profile.birthYear) : undefined;
        const displayName = user?.displayName || 'Öğrenci';
        const phone = profile.phone.replace(/\s/g, '');
        try {
          const updated = await userApi.updateProfile({
            displayName,
            phone: phone || undefined,
            birthYear,
          });
          useAuthStore.setState(s => ({
            ...s,
            user: { ...(s.user as any), ...updated },
          }));
        } catch {}

        // Upload avatar if new
        if (avatarFile) {
          try {
            const { avatarUrl } = await userApi.uploadAvatar(avatarFile);
            useAuthStore.setState(s => ({
              ...s,
              user: s.user ? { ...s.user, avatarUrl } : s.user,
            }));
            setAvatarFile(null); // Don't re-upload on next save
          } catch {}
        }
      }
    } catch {
      // Silent fail — don't block navigation
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      // Save progress in the background, then advance
      saveCurrentProgress(); // fire-and-forget
      setCurrentStep(p => p + 1);
    }
  };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(p => p - 1); };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Build statusDetail JSON from conditional fields
  const buildStatusDetail = (): string => {
    const { status } = profile;
    const detail: Record<string, string> = {};
    if (status === 'highschool') {
      if (profile.schoolName) detail.schoolName = profile.schoolName;
      if (profile.grade) detail.grade = profile.grade;
    } else if (status === 'university') {
      if (profile.universityName) detail.universityName = profile.universityName;
      if (profile.department) detail.department = profile.department;
      if (profile.uniYear) detail.uniYear = profile.uniYear;
    } else if (status === 'newgrad') {
      if (profile.universityName) detail.universityName = profile.universityName;
      if (profile.department) detail.department = profile.department;
      if (profile.graduationYear) detail.graduationYear = profile.graduationYear;
    } else if (status === 'employed' || status === 'careerchange' || status === 'freelancer') {
      if (profile.companyName) detail.companyName = profile.companyName;
      if (profile.position) detail.position = profile.position;
      if (profile.sector) detail.sector = profile.sector;
      if (profile.experience) detail.experience = profile.experience;
    } else if (status === 'jobseeker') {
      if (profile.position) detail.position = profile.position;
      if (profile.sector) detail.sector = profile.sector;
      if (profile.experience) detail.experience = profile.experience;
    }
    return JSON.stringify(detail);
  };

  const saveAllData = async (redirectTo: string) => {
    try {
      setSaving(true);

      // Check if token exists before making API calls
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Oturum bilginiz bulunamadı. Lütfen tekrar giriş yapın.');
        router.push('/auth/login');
        return;
      }

      // 1) Upload avatar if new
      if (avatarFile) {
        try {
          const { avatarUrl } = await userApi.uploadAvatar(avatarFile);
          useAuthStore.setState(s => ({
            ...s,
            user: s.user ? { ...s.user, avatarUrl } : s.user,
          }));
        } catch {
          // Avatar upload failing shouldn't block onboarding
        }
      }

      // 2) Update basic profile (displayName, phone, birthYear) via existing endpoint
      const birthYear = profile.birthYear ? Number(profile.birthYear) : undefined;
      const displayName = user?.displayName || 'Öğrenci';
      const phone = profile.phone.replace(/\s/g, '');
      try {
        const updated = await userApi.updateProfile({
          displayName,
          phone: phone || undefined,
          birthYear,
        });
        useAuthStore.setState(s => ({
          ...s,
          user: { ...(s.user as any), ...updated },
        }));
      } catch {}

      // 3) Save onboarding-specific data to new endpoint
      await onboardingApi.saveStudentOnboarding(buildOnboardingPayload());

      toast.success('Profil bilgileriniz kaydedildi!');
      router.push(redirectTo);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error('Oturumunuz zaman aşımına uğramış. Lütfen tekrar giriş yapın.');
        router.push('/auth/login');
      } else {
        toast.error(err?.response?.data?.errors?.[0] || 'Bir hata oluştu');
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Progress */}
        <div className="mb-6 md:mb-8">
          {/* Mobile */}
          <div className="md:hidden mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{STEPS[currentStep - 1].emoji} {STEPS[currentStep - 1].label}</span>
              <span className="text-xs text-gray-400">{currentStep} / {TOTAL_STEPS}</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-gray-100 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-teal-500 [&>[data-slot=progress-indicator]]:to-green-500" />
          </div>
          {/* Desktop stepper */}
          <div className="hidden md:block">
            <div className="flex items-center justify-center gap-1 mb-3">
              {STEPS.map((step, idx) => {
                const done = currentStep > step.id;
                const active = currentStep === step.id;
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => { if (done) setCurrentStep(step.id); }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all ${active ? 'bg-teal-50 border border-teal-200 shadow-sm' : done ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${done ? 'bg-gradient-to-br from-teal-400 to-green-500 text-white' : active ? 'bg-gradient-to-br from-teal-500 to-green-500 text-white ring-4 ring-teal-100' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <Check className="w-3 h-3" /> : <span>{step.emoji}</span>}
                      </div>
                      <span className={`text-[11px] hidden lg:inline ${active ? 'text-teal-700' : done ? 'text-gray-600' : 'text-gray-400'}`}>{step.label}</span>
                    </button>
                    {idx < STEPS.length - 1 && <div className={`w-4 lg:w-7 h-0.5 mx-0.5 ${done ? 'bg-teal-300' : 'bg-gray-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Motivation */}
          {currentStep > 1 && currentStep <= 7 && (
            <motion.p key={`mot-${currentStep}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-center text-xs text-teal-600 mt-1">
              {STEP_MOTIVATIONS[currentStep - 1]}
            </motion.p>
          )}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            {currentStep === 1 && (
              <Step1Profile
                profile={profile}
                updateProfile={updateProfile}
                avatarPreview={avatarPreview}
                onAvatarClick={() => fileInputRef.current?.click()}
              />
            )}
            {currentStep === 2 && <Step2Goal data={data} toggleItem={toggleItem} />}
            {currentStep === 3 && <Step3Topic data={data} toggleItem={toggleItem} topicSearch={topicSearch} setTopicSearch={setTopicSearch} />}
            {currentStep === 4 && <Step4Level data={data} updateData={updateData} />}
            {currentStep === 5 && <Step5Preferences data={data} toggleItem={toggleItem} />}
            {currentStep === 6 && <Step6Budget data={data} updateData={updateData} toggleItem={toggleItem} />}
            {currentStep === 7 && (
              <Step7Recommendations
                data={data}
                saving={saving}
                onExplore={() => saveAllData('/public/mentors')}
                onDashboard={() => saveAllData('/student/dashboard')}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Hidden file input for avatar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* Footer CTA */}
        {currentStep < 7 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="gap-2 text-gray-400 hover:text-gray-600">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Geri</span>
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white rounded-xl px-8 h-11 shadow-lg shadow-teal-200/40 disabled:shadow-none disabled:opacity-50"
            >
              Devam Et
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Optional skip for budget step */}
        {currentStep === 6 && (
          <p className="text-center mt-3">
            <button onClick={handleNext} className="text-xs text-gray-400 hover:text-teal-600 underline underline-offset-2 transition-colors">
              Bu adımı atla, sonra ayarlarım
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// =========================================================
// STEP 1 — PROFİL BİLGİLERİ
// =========================================================
function Step1Profile({ profile, updateProfile, avatarPreview, onAvatarClick }: {
  profile: ProfileData;
  updateProfile: (u: Partial<ProfileData>) => void;
  avatarPreview: string | null;
  onAvatarClick: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h1 className="text-2xl text-gray-900 mb-2">Hoş geldiniz! Sizi tanıyalım 👋</h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Profilinizi tamamlayın, size en uygun mentörleri bulalım ve deneyiminizi kişiselleştirelim. Sadece 2 dakika!
        </p>
      </div>

      <div className="space-y-5">
        {/* Profil Fotoğrafı */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-green-100 border-2 border-dashed border-teal-300 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={onAvatarClick}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-teal-400" />
                )}
              </div>
              <button
                type="button"
                onClick={onAvatarClick}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-teal-600 transition-colors"
              >
                <span className="text-xs">+</span>
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-800">Profil Fotoğrafı</p>
              <p className="text-xs text-gray-400">İsteğe bağlı — mentörlere güven verir</p>
            </div>
          </div>
        </div>

        {/* Doğum Tarihi */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <Label className="text-sm text-gray-700">Doğum Tarihi *</Label>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <Select value={profile.birthDay} onValueChange={v => updateProfile({ birthDay: v })}>
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="Gün" /></SelectTrigger>
              <SelectContent>{days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={profile.birthMonth} onValueChange={v => updateProfile({ birthMonth: v })}>
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="Ay" /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={profile.birthYear} onValueChange={v => updateProfile({ birthYear: v })}>
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="Yıl" /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Telefon & Şehir */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Phone className="w-4 h-4 text-gray-400" />
              <Label className="text-sm text-gray-700">Telefon *</Label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">+90</span>
              <Input
                type="tel"
                value={profile.phone}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                  let formatted = raw;
                  if (raw.length > 6) {
                    formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)} ${raw.slice(6, 8)}${raw.length > 8 ? ' ' + raw.slice(8) : ''}`;
                  } else if (raw.length > 3) {
                    formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`;
                  } else if (raw.length > 0) {
                    formatted = `(${raw}`;
                  }
                  updateProfile({ phone: formatted });
                }}
                placeholder="(5XX) XXX XX XX"
                className="h-11 rounded-xl pl-12 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Seans hatırlatmaları ve bildirimler için kullanılacaktır</p>
          </div>

          <SearchableCitySelect
            value={profile.city}
            onChange={(city) => updateProfile({ city })}
          />
        </div>

        {/* Cinsiyet */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <Label className="text-sm text-gray-700">Cinsiyet</Label>
            </div>
            <span className="text-[10px] text-gray-400">isteğe bağlı</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'female', label: 'Kadın' },
              { id: 'male', label: 'Erkek' },
              { id: 'other', label: 'Diğer' },
              { id: 'prefer-not', label: 'Belirtmek istemiyorum' },
            ].map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => updateProfile({ gender: profile.gender === g.id ? '' : g.id })}
                className={`px-4 py-2 rounded-xl border-2 text-xs transition-all ${profile.gender === g.id ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mevcut Durum */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <Label className="text-sm text-gray-700">Mevcut Durumunuz *</Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STATUS_OPTIONS.map(s => {
              const sel = profile.status === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => updateProfile({
                    status: s.id,
                    schoolName: '', grade: '', universityName: '', department: '',
                    uniYear: '', graduationYear: '', companyName: '', position: '',
                    sector: '', experience: '',
                  })}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${sel ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className={`text-[11px] leading-tight ${sel ? 'text-teal-700' : 'text-gray-600'}`}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Fields */}
        <AnimatePresence mode="wait">
          {profile.status && (
            <motion.div
              key={profile.status}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <ConditionalProfileFields profile={profile} updateProfile={updateProfile} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Conditional fields based on status
function ConditionalProfileFields({ profile, updateProfile }: { profile: ProfileData; updateProfile: (u: Partial<ProfileData>) => void }) {
  const { status } = profile;

  if (status === 'highschool') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-4 h-4 text-teal-500" />
          <span className="text-sm text-gray-700">Lise Bilgileri</span>
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Okul Adı</Label>
          <Input value={profile.schoolName} onChange={e => updateProfile({ schoolName: e.target.value })} placeholder="Lise adınızı yazın" className="h-10 rounded-xl bg-gray-50 border-gray-200" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Sınıf</Label>
          <div className="flex flex-wrap gap-2">
            {['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map(g => (
              <button key={g} type="button" onClick={() => updateProfile({ grade: g })}
                className={`px-4 py-2 rounded-xl border-2 text-xs transition-all ${profile.grade === g ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
              >{g}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'university') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-4 h-4 text-teal-500" />
          <span className="text-sm text-gray-700">Üniversite Bilgileri</span>
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Üniversite</Label>
          <Input value={profile.universityName} onChange={e => updateProfile({ universityName: e.target.value })} placeholder="Üniversite adı" className="h-10 rounded-xl bg-gray-50 border-gray-200" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Bölüm</Label>
          <Input value={profile.department} onChange={e => updateProfile({ department: e.target.value })} placeholder="Bölüm adı" className="h-10 rounded-xl bg-gray-50 border-gray-200" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Sınıf / Yıl</Label>
          <div className="flex flex-wrap gap-2">
            {['Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5+ Sınıf', 'Yüksek Lisans', 'Doktora'].map(y => (
              <button key={y} type="button" onClick={() => updateProfile({ uniYear: y })}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs transition-all ${profile.uniYear === y ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
              >{y}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'newgrad') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-teal-500" />
          <span className="text-sm text-gray-700">Mezuniyet Bilgileri</span>
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Üniversite</Label>
          <Input value={profile.universityName} onChange={e => updateProfile({ universityName: e.target.value })} placeholder="Mezun olduğunuz üniversite" className="h-10 rounded-xl bg-gray-50 border-gray-200" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Bölüm</Label>
          <Input value={profile.department} onChange={e => updateProfile({ department: e.target.value })} placeholder="Bölüm adı" className="h-10 rounded-xl bg-gray-50 border-gray-200" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Mezuniyet Yılı</Label>
          <Select value={profile.graduationYear} onValueChange={v => updateProfile({ graduationYear: v })}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="Yıl seçin" /></SelectTrigger>
            <SelectContent>{Array.from({ length: 5 }, (_, i) => String(currentYear - i)).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (status === 'employed' || status === 'careerchange' || status === 'freelancer') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-teal-500" />
          <span className="text-sm text-gray-700">
            {status === 'employed' ? 'Çalışma Bilgileri' : status === 'careerchange' ? 'Mevcut Pozisyon' : 'Serbest Çalışma Bilgileri'}
          </span>
        </div>
        {status !== 'freelancer' && (
          <div>
            <Label className="text-xs text-gray-500 mb-1.5 block">Şirket / Kurum</Label>
            <Input value={profile.companyName} onChange={e => updateProfile({ companyName: e.target.value })} placeholder="Çalıştığınız yer" className="h-10 rounded-xl bg-gray-50 border-gray-200" />
          </div>
        )}
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">{status === 'freelancer' ? 'Uzmanlık Alanı' : 'Pozisyon / Ünvan'}</Label>
          <Input value={profile.position} onChange={e => updateProfile({ position: e.target.value })} placeholder={status === 'freelancer' ? 'Örn: Full-Stack Developer' : 'Pozisyonunuz'} className="h-10 rounded-xl bg-gray-50 border-gray-200" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Sektör</Label>
          <Select value={profile.sector} onValueChange={v => updateProfile({ sector: v })}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="Sektör seçin" /></SelectTrigger>
            <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Deneyim Süresi</Label>
          <div className="flex flex-wrap gap-2">
            {['0-1 yıl', '1-3 yıl', '3-5 yıl', '5-10 yıl', '10+ yıl'].map(e => (
              <button key={e} type="button" onClick={() => updateProfile({ experience: e })}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs transition-all ${profile.experience === e ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
              >{e}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'jobseeker') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-teal-500" />
          <span className="text-sm text-gray-700">İş Arama Bilgileri</span>
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Son Pozisyon / Ünvan</Label>
          <Input value={profile.position} onChange={e => updateProfile({ position: e.target.value })} placeholder="Son çalıştığınız pozisyon" className="h-10 rounded-xl bg-gray-50 border-gray-200" />
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Hedef Sektör</Label>
          <Select value={profile.sector} onValueChange={v => updateProfile({ sector: v })}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="Sektör seçin" /></SelectTrigger>
            <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Toplam Deneyim</Label>
          <div className="flex flex-wrap gap-2">
            {['Deneyimsiz', '0-1 yıl', '1-3 yıl', '3-5 yıl', '5-10 yıl', '10+ yıl'].map(e => (
              <button key={e} type="button" onClick={() => updateProfile({ experience: e })}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs transition-all ${profile.experience === e ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
              >{e}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// =========================================================
// STEP 2 — HEDEF
// =========================================================
function Step2Goal({ data, toggleItem }: { data: OnboardingFormData; toggleItem: (f: keyof OnboardingFormData, v: string) => void }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-green-50 border border-teal-100 mb-4">
          <span className="text-2xl">🎯</span>
        </motion.div>
        <h1 className="text-2xl text-gray-900 mb-2">Hedefiniz ne?</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">Sizin için en uygun mentörleri bulabilmemiz için hedeflerinizi seçin. Birden fazla seçebilirsiniz.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {GOALS.map(goal => {
          const sel = data.goals.includes(goal.id);
          const Icon = goal.icon;
          return (
            <motion.button key={goal.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => toggleItem('goals', goal.id)}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left group ${sel ? `${goal.bgLight} shadow-md` : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
            >
              {sel && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${sel ? `bg-gradient-to-br ${goal.color} text-white` : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className={`text-sm mb-0.5 ${sel ? goal.textColor : 'text-gray-800'}`}>{goal.label}</h3>
              <p className="text-xs text-gray-400">{goal.description}</p>
            </motion.button>
          );
        })}
      </div>
      {data.goals.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full">
            <Check className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs text-teal-700">{data.goals.length} hedef seçildi</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// =========================================================
// STEP 3 — KONU
// =========================================================
function Step3Topic({ data, toggleItem, topicSearch, setTopicSearch }: { data: OnboardingFormData; toggleItem: (f: keyof OnboardingFormData, v: string) => void; topicSearch: string; setTopicSearch: (v: string) => void }) {
  const filtered = CATEGORIES.filter(c => topicSearch === '' || c.label.toLowerCase().includes(topicSearch.toLowerCase()) || c.subtopics.some(s => s.toLowerCase().includes(topicSearch.toLowerCase())));
  const subs = data.categories.flatMap(cId => CATEGORIES.find(c => c.id === cId)?.subtopics || []);

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 mb-4">
          <span className="text-2xl">📚</span>
        </div>
        <h1 className="text-2xl text-gray-900 mb-2">Hangi konularda destek istiyorsunuz?</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">İlgilendiğiniz alanları seçin, alt konuları da ekleyebilirsiniz.</p>
      </div>
      <div className="max-w-md mx-auto mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={topicSearch} onChange={e => setTopicSearch(e.target.value)} placeholder="Konu veya alan ara... (ör: React, YKS, SEO)" className="h-11 rounded-xl pl-10 bg-gray-50 border-gray-200 focus:bg-white" />
          {topicSearch && <button type="button" onClick={() => setTopicSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mb-5">
        {filtered.map(cat => {
          const sel = data.categories.includes(cat.id);
          return (
            <motion.button key={cat.id} whileTap={{ scale: 0.95 }} type="button" onClick={() => toggleItem('categories', cat.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${sel ? 'bg-teal-50 border-teal-300 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className={`text-xs leading-tight ${sel ? 'text-teal-700' : 'text-gray-600'}`}>{cat.label}</span>
              {sel && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center"><Check className="w-3 h-3" /></motion.span>}
            </motion.button>
          );
        })}
      </div>
      {subs.length > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-2.5 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Alt konulardan da seçebilirsiniz:</p>
          <div className="flex flex-wrap gap-1.5">
            {subs.map(st => {
              const sel = data.subtopics.includes(st);
              return <button key={st} type="button" onClick={() => toggleItem('subtopics', st)} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${sel ? 'bg-teal-100 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600'}`}>{sel ? '✓ ' : '+ '}{st}</button>;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// =========================================================
// STEP 4 — SEVİYE
// =========================================================
function Step4Level({ data, updateData }: { data: OnboardingFormData; updateData: (u: Partial<OnboardingFormData>) => void }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 mb-4">
          <span className="text-2xl">📈</span>
        </div>
        <h1 className="text-2xl text-gray-900 mb-2">Şu anki seviyeniz ne?</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">Seviyenize uygun mentörleri eşleştirelim. Endişelenmeyin, her seviye için harika mentörler var!</p>
      </div>
      <div className="max-w-lg mx-auto space-y-3">
        {LEVELS.map(level => {
          const sel = data.level === level.id;
          return (
            <motion.button key={level.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => updateData({ level: level.id })}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${sel ? 'border-teal-300 bg-gradient-to-r from-teal-50 to-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${sel ? `bg-gradient-to-br ${level.color} shadow-md` : 'bg-gray-100'}`}>
                {sel ? <span className="text-white text-lg">{level.emoji}</span> : <span>{level.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm mb-0.5 ${sel ? 'text-teal-800' : 'text-gray-800'}`}>{level.label}</h3>
                <p className="text-xs text-gray-400">{level.description}</p>
              </div>
              {sel && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" /></motion.div>}
            </motion.button>
          );
        })}
      </div>
      {data.level && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-700">{LEVELS.find(l => l.id === data.level)?.illustration}</span>
        </motion.div>
      )}
    </div>
  );
}

// =========================================================
// STEP 5 — TERCİHLER
// =========================================================
function Step5Preferences({ data, toggleItem }: { data: OnboardingFormData; toggleItem: (f: keyof OnboardingFormData, v: string) => void }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 mb-4">
          <span className="text-2xl">💬</span>
        </div>
        <h1 className="text-2xl text-gray-900 mb-2">Nasıl öğrenmeyi tercih ediyorsunuz?</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">Öğrenme stilinize uygun mentörleri bulalım. Birden fazla seçebilirsiniz.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {PREFERENCES.map(pref => {
          const sel = data.preferences.includes(pref.id);
          const Icon = pref.icon;
          return (
            <motion.button key={pref.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => toggleItem('preferences', pref.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${sel ? 'border-teal-300 bg-teal-50/60 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sel ? 'bg-gradient-to-br from-teal-400 to-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className={`text-sm ${sel ? 'text-teal-800' : 'text-gray-800'}`}>{pref.label}</h3>
                  {sel && <Check className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{pref.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
      {data.preferences.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full">
            <Check className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs text-teal-700">{data.preferences.length} tercih seçildi</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// =========================================================
// STEP 6 — BÜTÇE & MÜSAİTLİK
// =========================================================
function Step6Budget({ data, updateData, toggleItem }: { data: OnboardingFormData; updateData: (u: Partial<OnboardingFormData>) => void; toggleItem: (f: keyof OnboardingFormData, v: string) => void }) {
  const budgetLabel = (v: number) => v >= 500 ? '₺500+' : `₺${v}`;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 mb-4">
          <span className="text-2xl">💰</span>
        </div>
        <h1 className="text-2xl text-gray-900 mb-2">Bütçe ve müsaitlik</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">Bu adım isteğe bağlı — size en uygun mentörleri filtrelememize yardımcı olur.</p>
      </div>
      <div className="max-w-xl mx-auto space-y-6">
        {/* Budget */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center"><span className="text-sm">💰</span></div>
            <div><h3 className="text-sm text-gray-800">Seans Başına Bütçe Aralığı</h3><p className="text-xs text-gray-400">TRY cinsinden</p></div>
          </div>
          <div className="px-2 mb-3">
            <Slider
              value={data.budgetRange[0]}
              onValueChange={v => updateData({ budgetRange: [v, Math.max(v, data.budgetRange[1])] })}
              min={0}
              max={500}
              step={50}
              showValue
              formatValue={budgetLabel}
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">{budgetLabel(data.budgetRange[0])}</span>
            <span className="text-xs text-gray-400">—</span>
            <span className="text-sm text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">{budgetLabel(data.budgetRange[1])}</span>
          </div>
          <div className="px-2 mt-3">
            <Slider
              value={data.budgetRange[1]}
              onValueChange={v => updateData({ budgetRange: [Math.min(data.budgetRange[0], v), v] })}
              min={0}
              max={500}
              step={50}
              showValue
              formatValue={budgetLabel}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">Taksit seçenekleri ile ödemeleri bölebilirsiniz</p>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center"><span className="text-sm">📅</span></div>
            <div><h3 className="text-sm text-gray-800">Ne zaman müsaitsiniz?</h3><p className="text-xs text-gray-400">Birden fazla seçebilirsiniz</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {AVAILABILITY_OPTIONS.map(opt => {
              const sel = data.availability.includes(opt.id);
              return (
                <button key={opt.id} type="button" onClick={() => toggleItem('availability', opt.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${sel ? 'border-teal-300 bg-teal-50/60' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <div><p className={`text-xs ${sel ? 'text-teal-700' : 'text-gray-700'}`}>{opt.label}</p><p className="text-[10px] text-gray-400">{opt.sublabel}</p></div>
                  {sel && <Check className="w-3.5 h-3.5 text-teal-500 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Format */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center"><span className="text-sm">🎥</span></div>
            <div><h3 className="text-sm text-gray-800">Görüşme formatı tercihi</h3><p className="text-xs text-gray-400">Hangi formatları tercih edersiniz?</p></div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SESSION_FORMAT_OPTIONS.map(sf => {
              const sel = data.sessionFormat.includes(sf.id);
              const Icon = sf.icon;
              return (
                <button key={sf.id} type="button" onClick={() => toggleItem('sessionFormat', sf.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${sel ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}
                >
                  <Icon className={`w-4 h-4 ${sel ? 'text-purple-500' : 'text-gray-400'}`} />
                  <span className="text-xs">{sf.label}</span>
                  {sel && <Check className="w-3 h-3 text-purple-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// STEP 7 — ÖNERİLEN MENTÖRLER
// =========================================================
function Step7Recommendations({ data, saving, onExplore, onDashboard }: {
  data: OnboardingFormData;
  saving: boolean;
  onExplore: () => void;
  onDashboard: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-green-500 shadow-lg shadow-teal-200/50 mb-4"
        >
          <Sparkles className="w-7 h-7 text-white" />
        </motion.div>
        <h1 className="text-2xl text-gray-900 mb-2">
          Profiliniz hazır! 🎉
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Hedeflerinize, seviyenize ve tercihlerinize göre en uygun mentörleri bulabilirsiniz. Profil detaylarını inceleyebilir veya hemen randevu alabilirsiniz.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
        {data.goals.map(g => { const goal = GOALS.find(x => x.id === g); return goal ? <span key={g} className="px-2.5 py-1 rounded-full text-[10px] bg-blue-50 text-blue-600 border border-blue-200">{goal.label}</span> : null; })}
        {data.categories.slice(0, 3).map(c => { const cat = CATEGORIES.find(x => x.id === c); return cat ? <span key={c} className="px-2.5 py-1 rounded-full text-[10px] bg-teal-50 text-teal-600 border border-teal-200">{cat.emoji} {cat.label}</span> : null; })}
        {data.level && <span className="px-2.5 py-1 rounded-full text-[10px] bg-green-50 text-green-600 border border-green-200">{LEVELS.find(l => l.id === data.level)?.emoji} {LEVELS.find(l => l.id === data.level)?.label}</span>}
      </div>

      {/* Bottom CTAs */}
      <div className="text-center space-y-3">
        <Button
          onClick={onExplore}
          disabled={saving}
          className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white rounded-xl px-8 h-12 shadow-lg shadow-teal-200/40 gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" /> Mentörleri Keşfet
            </>
          )}
        </Button>
        <div className="flex items-center justify-center gap-4">
          <button onClick={onDashboard} disabled={saving} className="text-xs text-gray-400 hover:text-teal-600 underline underline-offset-2 transition-colors disabled:opacity-50">
            Dashboard&apos;a git
          </button>
          <span className="text-gray-300">•</span>
          <button onClick={onDashboard} disabled={saving} className="text-xs text-gray-400 hover:text-teal-600 underline underline-offset-2 transition-colors disabled:opacity-50">
            Tercihleri sonra düzenle
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Shield className="w-3.5 h-3.5 text-teal-500" />Güvenli ödeme</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Award className="w-3.5 h-3.5 text-teal-500" />Doğrulanmış mentörler</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Heart className="w-3.5 h-3.5 text-teal-500" />Memnuniyet garantisi</div>
        </div>
      </div>
    </div>
  );
}
