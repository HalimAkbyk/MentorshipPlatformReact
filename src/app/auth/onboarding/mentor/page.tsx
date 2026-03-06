'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Target, CheckCircle2,
  Camera, X, Plus, ChevronRight, ChevronLeft,
  Sparkles, ArrowRight, Check, Video, Mic, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { SearchableCitySelect } from '@/components/ui/searchable-city-select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { mentorsApi } from '@/lib/api/mentors';
import { userApi } from '@/lib/api/user';
import { updateTokensAfterRoleChange } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { onboardingApi, type MentorOnboardingData } from '@/lib/api/onboarding';
import { FeatureGate } from '@/components/feature-gate';

// ===== TYPES =====
type StepKey = 'profile' | 'expertise' | 'review';

// ===== CONSTANTS =====
const STEPS = [
  { id: 1, key: 'profile' as StepKey, label: 'Profil', icon: User, description: 'Temel bilgileriniz' },
  { id: 2, key: 'expertise' as StepKey, label: 'Uzmanlik', icon: Target, description: 'Alan ve konular' },
  { id: 3, key: 'review' as StepKey, label: 'Onizleme', icon: CheckCircle2, description: 'Son kontrol' },
];

const CATEGORIES = [
  { id: 'matematik', label: 'Matematik', emoji: '\u{1F4D0}' },
  { id: 'fizik', label: 'Fizik', emoji: '\u269B\uFE0F' },
  { id: 'kimya', label: 'Kimya', emoji: '\u{1F9EA}' },
  { id: 'biyoloji', label: 'Biyoloji', emoji: '\u{1F9EC}' },
  { id: 'turkce', label: 'Turkce & Edebiyat', emoji: '\u{1F4D6}' },
  { id: 'tarih', label: 'Tarih & Cografya', emoji: '\u{1F30D}' },
  { id: 'ingilizce', label: 'Ingilizce', emoji: '\u{1F1EC}\u{1F1E7}' },
  { id: 'yazilim', label: 'Yazilim & Teknoloji', emoji: '\u{1F4BB}' },
  { id: 'genel-kultur', label: 'Genel Kultur', emoji: '\u{1F4DA}' },
];

const SUGGESTED_SUBTOPICS: Record<string, string[]> = {
  'matematik': ['TYT Matematik', 'AYT Matematik', 'Geometri', 'Analitik Geometri', 'Integral', 'Turev', 'Limit', 'Olasilik'],
  'fizik': ['TYT Fizik', 'AYT Fizik', 'Mekanik', 'Elektrik', 'Optik', 'Dalgalar', 'Modern Fizik'],
  'kimya': ['TYT Kimya', 'AYT Kimya', 'Organik Kimya', 'Asitler ve Bazlar', 'Kimyasal Denge', 'Elektrokimya'],
  'biyoloji': ['TYT Biyoloji', 'AYT Biyoloji', 'Hucre', 'Genetik', 'Ekoloji', 'Insan Fizyolojisi'],
  'turkce': ['TYT Turkce', 'AYT Edebiyat', 'Paragraf', 'Dil Bilgisi', 'Edebiyat Akimlari'],
  'tarih': ['TYT Tarih', 'AYT Tarih', 'Cografya', 'Inkilap Tarihi', 'Dunya Tarihi'],
  'ingilizce': ['YDT Ingilizce', 'Grammar', 'Reading', 'Vocabulary', 'IELTS', 'TOEFL'],
  'yazilim': ['Python', 'JavaScript', 'React', 'Veri Bilimi', 'Mobil Gelistirme'],
  'genel-kultur': ['Mantik', 'Problem Cozme', 'Calisma Stratejisi', 'Motivasyon'],
};

const SESSION_FORMATS = [
  { id: 'video', label: 'Goruntulu Gorusme', icon: Video },
  { id: 'audio', label: 'Sesli Gorusme', icon: Mic },
  { id: 'chat', label: 'Yazili Mesaj', icon: MessageCircle },
];

const LANGUAGES = [
  'Turkce', 'Ingilizce', 'Almanca', 'Fransizca', 'Ispanyolca',
  'Arapca', 'Rusca', 'Japonca', 'Cince', 'Korece',
];

// ===== SCHEMA =====
const profileSchema = z.object({
  fullName: z.string().min(2, 'Ad soyad gerekli'),
  headline: z.string().min(3, 'Baslik gerekli').max(300),
  bio: z.string().min(20, 'En az 20 karakter yazin').max(2000),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ===== HELPERS =====
function normalizeStep(v: string | null): StepKey {
  const valid: StepKey[] = ['profile', 'expertise', 'review'];
  if (v && valid.includes(v as StepKey)) return v as StepKey;
  return 'profile';
}

function stepKeyToId(key: StepKey): number {
  const found = STEPS.find((s) => s.key === key);
  return found?.id ?? 1;
}

function idToStepKey(id: number): StepKey {
  const found = STEPS.find((s) => s.id === id);
  return found?.key ?? 'profile';
}

function toggleInArray(arr: string[], item: string, setter: (v: string[]) => void) {
  if (arr.includes(item)) setter(arr.filter((x) => x !== item));
  else setter([...arr, item]);
}

// ===== MAIN COMPONENT =====
export default function MentorOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const authUser = useAuthStore((s) => s.user);
  const stepFromUrl = useMemo(() => normalizeStep(searchParams.get('step')), [searchParams]);
  const isStudentUpgrade = searchParams.get('source') === 'student';
  const [currentStep, setCurrentStep] = useState<number>(stepKeyToId(stepFromUrl));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasProfile, setHasProfile] = useState(false);
  const [isPrefillLoading, setIsPrefillLoading] = useState(true);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', headline: '', bio: '' },
  });

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Step 1 extras
  const [city, setCity] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Turkce']);

  // Step 2
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [subtopicInput, setSubtopicInput] = useState('');
  const [sessionFormats, setSessionFormats] = useState<string[]>([]);

  // ===== URL sync =====
  useEffect(() => {
    setCurrentStep(stepKeyToId(stepFromUrl));
  }, [stepFromUrl]);

  const goStep = useCallback((key: StepKey) => {
    const sourceParam = isStudentUpgrade ? '&source=student' : '';
    router.replace(`/auth/onboarding/mentor?step=${key}${sourceParam}`);
  }, [isStudentUpgrade, router]);

  // ===== Prefill =====
  useEffect(() => {
    (async () => {
      const storeUser = useAuthStore.getState().user;
      if (storeUser?.displayName) {
        profileForm.setValue('fullName', storeUser.displayName);
      }
      if (storeUser?.avatarUrl) {
        setAvatarPreview(storeUser.avatarUrl);
      }

      if (isStudentUpgrade) {
        setHasProfile(false);
        try {
          const studentOb = await onboardingApi.getStudentOnboarding();
          if (studentOb) {
            if (studentOb.city) setCity(studentOb.city);
            if (studentOb.categories) { try { setSelectedCategories(JSON.parse(studentOb.categories)); } catch { /* */ } }
            if (studentOb.subtopics) { try { setSubtopics(JSON.parse(studentOb.subtopics)); } catch { /* */ } }
            if (studentOb.sessionFormats) { try { setSessionFormats(JSON.parse(studentOb.sessionFormats)); } catch { /* */ } }
          }
        } catch { /* no student onboarding data */ }
        setIsPrefillLoading(false);
        return;
      }

      try {
        const p = await mentorsApi.getMyProfile();
        setHasProfile(true);
        profileForm.reset({
          fullName: p.displayName ?? storeUser?.displayName ?? '',
          headline: p.headline ?? '',
          bio: p.bio ?? '',
        });
      } catch {
        setHasProfile(false);
      }

      try {
        const ob = await onboardingApi.getMentorOnboarding();
        if (ob) {
          if (ob.city) setCity(ob.city);
          if (ob.languages) { try { setLanguages(JSON.parse(ob.languages)); } catch { /* */ } }
          if (ob.categories) { try { setSelectedCategories(JSON.parse(ob.categories)); } catch { /* */ } }
          if (ob.subtopics) { try { setSubtopics(JSON.parse(ob.subtopics)); } catch { /* */ } }
          if (ob.sessionFormats) { try { setSessionFormats(JSON.parse(ob.sessionFormats)); } catch { /* */ } }
        }
      } catch { /* no saved onboarding data yet */ }

      setIsPrefillLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Photo handling =====
  const handlePhotoUpload = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ===== Subtopic handling =====
  const addSubtopic = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !subtopics.includes(trimmed)) setSubtopics([...subtopics, trimmed]);
    setSubtopicInput('');
  };
  const removeSubtopic = (t: string) => setSubtopics(subtopics.filter((x) => x !== t));

  // ===== Navigation =====
  const handleBack = () => { if (currentStep > 1) goStep(idToStepKey(currentStep - 1)); };

  // ===== Step handlers =====
  const handleProfileNext = async () => {
    const valid = await profileForm.trigger();
    if (!valid) return;
    const data = profileForm.getValues();
    try {
      setIsSubmitting(true);

      if (isStudentUpgrade && !hasProfile) {
        const payload = { bio: data.bio, headline: data.headline };
        const response = await mentorsApi.becomeMentor(payload);
        updateTokensAfterRoleChange(response.accessToken, response.refreshToken, response.roles);
        await useAuthStore.getState().applyRoleUpgrade();
        toast.success('Tebrikler! Artik bir egitmensiniz!');
        setTimeout(() => router.push('/mentor/dashboard'), 1000);
        return;
      }

      if (avatarFile) { try { await userApi.uploadAvatar(avatarFile); } catch { /* non-blocking */ } }

      const payload = { bio: data.bio, headline: data.headline };
      if (hasProfile) {
        await mentorsApi.updateProfile(payload);
        toast.success('Profil bilgileri guncellendi');
      } else {
        await mentorsApi.createProfile(payload);
        setHasProfile(true);
        toast.success('Profil bilgileri kaydedildi');
      }
      goStep('expertise');
    } catch (error: any) { toast.error(error?.response?.data?.errors?.[0] || 'Bir hata olustu'); }
    finally { setIsSubmitting(false); }
  };

  const handleExpertiseNext = () => {
    if (selectedCategories.length === 0) { toast.error('En az bir uzmanlik alani secin'); return; }
    goStep('review');
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      const onboardingData: MentorOnboardingData = {
        city,
        languages: JSON.stringify(languages),
        categories: JSON.stringify(selectedCategories),
        subtopics: JSON.stringify(subtopics),
        sessionFormats: JSON.stringify(sessionFormats),
      };
      await onboardingApi.saveMentorOnboarding(onboardingData);
      toast.success('Basvurunuz basariyla gonderildi!');
      setTimeout(() => router.push('/mentor/dashboard'), 1500);
    } catch (error: any) { toast.error(error?.response?.data?.errors?.[0] || 'Bir hata olustu'); }
    finally { setIsSubmitting(false); }
  };

  const progressPercent = (currentStep / STEPS.length) * 100;

  const completionItems = useMemo(() => [
    { label: 'Profil bilgileri tamamlandi', done: (profileForm.getValues('fullName') || '').length >= 2 },
    { label: 'Biyografi yazildi', done: (profileForm.getValues('bio') || '').length >= 20 },
    { label: 'Uzmanlik alanlari eklendi', done: selectedCategories.length > 0 },
    { label: 'Seans formatlari secildi', done: sessionFormats.length > 0 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [selectedCategories, sessionFormats]);

  const completionPercent = useMemo(() => {
    const done = completionItems.filter((i) => i.done).length;
    return Math.round((done / completionItems.length) * 100);
  }, [completionItems]);

  const suggestedTopics = selectedCategories.flatMap((c) => SUGGESTED_SUBTOPICS[c] || []);

  return (
    <FeatureGate flag="EXTERNAL_MENTOR_REGISTRATION" fallbackMessage="Egitmen basvurulari su anda kapalidir. Egitmen atamalari admin tarafindan yapilmaktadir.">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Student Upgrade Banner */}
        {isStudentUpgrade && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">Egitmen Ol!</h3>
                <p className="text-sm text-amber-800 mt-1">Bilgini paylas, gelir kazan! Profilini olustur ve hemen egitmenlige basla.</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Adim {currentStep} / {STEPS.length}</span>
              <span className="text-sm text-teal-600 font-medium">{STEPS[currentStep - 1]?.label}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="hidden md:flex items-center justify-center gap-0">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => { if (isCompleted || isActive) goStep(step.key); }}
                    className={cn('flex flex-col items-center gap-1.5 px-3 transition-all', (isCompleted || isActive) ? 'cursor-pointer' : 'cursor-default', isActive && 'scale-105')}
                  >
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isCompleted ? 'bg-gradient-to-br from-teal-400 to-green-500 text-white shadow-md shadow-teal-200/50'
                        : isActive ? 'bg-gradient-to-br from-teal-500 to-green-500 text-white shadow-lg shadow-teal-200/50 ring-4 ring-teal-100'
                        : 'bg-gray-100 text-gray-400'
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <div className="text-center">
                      <p className={cn('text-xs font-semibold', isActive ? 'text-teal-700' : isCompleted ? 'text-teal-600' : 'text-gray-400')}>{step.label}</p>
                      <p className={cn('text-[10px]', isActive ? 'text-teal-600' : 'text-gray-400')}>{step.description}</p>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn('w-16 h-0.5 mx-1 rounded-full transition-colors', currentStep > step.id ? 'bg-teal-400' : 'bg-gray-200')} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* ===== STEP 1: PROFIL ===== */}
            {currentStep === 1 && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Profil Bilgileri</h2>
                    <p className="text-sm text-gray-500 mb-6">Ogrencilerin sizi taniyacagi temel bilgiler</p>

                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-teal-100 to-green-100 border-2 border-teal-200 flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-teal-400" />
                          )}
                        </div>
                        <button
                          onClick={handlePhotoUpload}
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-teal-600 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Profil Fotografi</p>
                        <p className="text-xs text-gray-500">JPG veya PNG, max 5MB</p>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2 mb-4">
                      <Label>Ad Soyad</Label>
                      <Input
                        {...profileForm.register('fullName')}
                        placeholder="Adiniz Soyadiniz"
                        disabled={!!authUser?.displayName}
                      />
                      {profileForm.formState.errors.fullName && <p className="text-xs text-red-500">{profileForm.formState.errors.fullName.message}</p>}
                    </div>

                    {/* Headline */}
                    <div className="space-y-2 mb-4">
                      <Label>Kisa Tanitim</Label>
                      <Input
                        {...profileForm.register('headline')}
                        placeholder="Orn: TYT/AYT Matematik Egitmeni"
                        maxLength={300}
                      />
                      {profileForm.formState.errors.headline && <p className="text-xs text-red-500">{profileForm.formState.errors.headline.message}</p>}
                    </div>

                    {/* Bio */}
                    <div className="space-y-2 mb-4">
                      <Label>Biyografi</Label>
                      <Textarea
                        {...profileForm.register('bio')}
                        placeholder="Kendinizi tanitin... Deneyimleriniz, ogretim yaklasiminiz, basarilariniz..."
                        rows={5}
                        maxLength={2000}
                      />
                      <div className="flex justify-between">
                        {profileForm.formState.errors.bio && <p className="text-xs text-red-500">{profileForm.formState.errors.bio.message}</p>}
                        <p className="text-xs text-gray-400 ml-auto">{(profileForm.watch('bio') || '').length}/2000</p>
                      </div>
                    </div>

                    {/* City */}
                    <div className="space-y-2 mb-4">
                      <Label>Sehir</Label>
                      <SearchableCitySelect value={city} onChange={setCity} />
                    </div>

                    {/* Languages */}
                    <div className="space-y-2">
                      <Label>Diller</Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleInArray(languages, lang, setLanguages)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm transition-all border',
                              languages.includes(lang)
                                ? 'bg-teal-50 border-teal-300 text-teal-700 font-medium'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleProfileNext}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white px-8"
                    >
                      {isSubmitting ? 'Kaydediliyor...' : isStudentUpgrade ? 'Egitmen Ol' : 'Devam Et'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Sidebar Preview Card */}
                <div className="hidden md:block">
                  <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Profil Onizleme</h3>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-teal-100 to-green-100 border-2 border-teal-200 flex items-center justify-center mb-3">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-teal-400" />
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{profileForm.watch('fullName') || 'Ad Soyad'}</p>
                      <p className="text-xs text-teal-600 mt-0.5">{profileForm.watch('headline') || 'Baslik'}</p>
                      {city && <p className="text-xs text-gray-500 mt-1">{city}</p>}
                      {languages.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-center">
                          {languages.map((l) => <span key={l} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 line-clamp-4">{profileForm.watch('bio') || 'Biyografiniz burada gorunecek...'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STEP 2: UZMANLIK ===== */}
            {currentStep === 2 && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Categories */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Uzmanlik Alanlari</h2>
                  <p className="text-sm text-gray-500 mb-6">Ders verdiginiz alanlari secin</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleInArray(selectedCategories, cat.id, setSelectedCategories)}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                          selectedCategories.includes(cat.id)
                            ? 'border-teal-300 bg-teal-50 shadow-sm ring-1 ring-teal-200'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className={cn('text-sm font-medium', selectedCategories.includes(cat.id) ? 'text-teal-700' : 'text-gray-700')}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtopics */}
                {selectedCategories.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Alt Konular</h3>
                    <p className="text-sm text-gray-500 mb-4">Onerilen konulari secin veya kendi konularinizi ekleyin</p>

                    {/* Suggested */}
                    {suggestedTopics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {suggestedTopics.filter((t) => !subtopics.includes(t)).map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => addSubtopic(topic)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-dashed border-gray-300 text-gray-600 hover:border-teal-300 hover:text-teal-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> {topic}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Custom input */}
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={subtopicInput}
                        onChange={(e) => setSubtopicInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtopic(subtopicInput); } }}
                        placeholder="Konu ekleyin..."
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => addSubtopic(subtopicInput)} disabled={!subtopicInput.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Selected subtopics */}
                    {subtopics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {subtopics.map((t) => (
                          <span key={t} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-teal-50 border border-teal-200 text-teal-700">
                            {t}
                            <button type="button" onClick={() => removeSubtopic(t)} className="hover:text-red-500 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Session Formats */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Seans Formatlari</h3>
                  <p className="text-sm text-gray-500 mb-4">Hangi formatlarda ders vermek istiyorsunuz?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SESSION_FORMATS.map((fmt) => {
                      const Icon = fmt.icon;
                      const selected = sessionFormats.includes(fmt.id);
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => toggleInArray(sessionFormats, fmt.id, setSessionFormats)}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-xl border transition-all',
                            selected
                              ? 'border-teal-300 bg-teal-50 shadow-sm ring-1 ring-teal-200'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          )}
                        >
                          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', selected ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400')}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={cn('text-sm font-medium', selected ? 'text-teal-700' : 'text-gray-700')}>{fmt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Geri
                  </Button>
                  <Button
                    onClick={handleExpertiseNext}
                    className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white px-8"
                  >
                    Devam Et <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: ONIZLEME ===== */}
            {currentStep === 3 && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Basvuru Ozeti</h2>
                  <p className="text-sm text-gray-500 mb-6">Bilgilerinizi kontrol edin ve basvurunuzu gonderin</p>

                  {/* Completion Progress */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-xl border border-teal-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-teal-700">Tamamlanma</span>
                      <span className="text-sm font-bold text-teal-700">%{completionPercent}</span>
                    </div>
                    <Progress value={completionPercent} className="h-2 mb-3" />
                    <div className="space-y-1.5">
                      {completionItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-xs">
                          <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', item.done ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-400')}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className={item.done ? 'text-teal-700' : 'text-gray-500'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Profile Summary */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-teal-600" />
                        <h4 className="text-sm font-semibold text-gray-800">Profil</h4>
                        <button onClick={() => goStep('profile')} className="ml-auto text-xs text-teal-600 hover:underline">Duzenle</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">Ad Soyad:</span> <span className="font-medium">{profileForm.getValues('fullName')}</span></div>
                        <div><span className="text-gray-500">Sehir:</span> <span className="font-medium">{city || '-'}</span></div>
                        <div className="col-span-2"><span className="text-gray-500">Baslik:</span> <span className="font-medium">{profileForm.getValues('headline')}</span></div>
                        <div className="col-span-2"><span className="text-gray-500">Diller:</span> <span className="font-medium">{languages.join(', ')}</span></div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-teal-600" />
                        <h4 className="text-sm font-semibold text-gray-800">Uzmanlik</h4>
                        <button onClick={() => goStep('expertise')} className="ml-auto text-xs text-teal-600 hover:underline">Duzenle</button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Kategoriler:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedCategories.map((id) => {
                              const cat = CATEGORIES.find((c) => c.id === id);
                              return cat ? <span key={id} className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs">{cat.emoji} {cat.label}</span> : null;
                            })}
                          </div>
                        </div>
                        {subtopics.length > 0 && (
                          <div>
                            <span className="text-gray-500">Alt Konular:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {subtopics.map((t) => <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">{t}</span>)}
                            </div>
                          </div>
                        )}
                        {sessionFormats.length > 0 && (
                          <div>
                            <span className="text-gray-500">Seans Formatlari:</span>
                            <span className="font-medium ml-1">
                              {sessionFormats.map((id) => SESSION_FORMATS.find((f) => f.id === id)?.label).filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Geri
                  </Button>
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white px-8"
                  >
                    {isSubmitting ? 'Gonderiliyor...' : 'Basvuruyu Gonder'}
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </FeatureGate>
  );
}
