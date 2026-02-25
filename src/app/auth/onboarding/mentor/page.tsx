'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Target, Briefcase, MessageSquare, CheckCircle2,
  Camera, X, Plus, ChevronRight, ChevronLeft, Globe, Clock, Star,
  Shield, Linkedin, Github, ExternalLink, Sparkles, Info, Search,
  ArrowRight, Check, Users, Video, Mic, MessageCircle, Package,
  GraduationCap, Award, FileText, Trash2, Trophy, BookOpen, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { mentorsApi } from '@/lib/api/mentors';
import { userApi } from '@/lib/api/user';
import { updateTokensAfterRoleChange } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { onboardingApi, type MentorOnboardingData } from '@/lib/api/onboarding';
import type { MentorVerification } from '@/lib/types/mentor';

// ===== TYPES =====
type MentorType = 'professional' | 'student' | '';
type StepKey = 'profile' | 'expertise' | 'qualifications' | 'mentoring' | 'review';

// ===== CONSTANTS =====
const STEPS = [
  { id: 1, key: 'profile' as StepKey, label: 'Profil', icon: User, description: 'Temel bilgileriniz' },
  { id: 2, key: 'expertise' as StepKey, label: 'Uzmanlik', icon: Target, description: 'Alan ve konular' },
  { id: 3, key: 'qualifications' as StepKey, label: 'Yetkinlik', icon: Briefcase, description: 'Kariyer/Akademik' },
  { id: 4, key: 'mentoring' as StepKey, label: 'Mentorluk', icon: MessageSquare, description: 'Tercihleriniz' },
  { id: 5, key: 'review' as StepKey, label: 'Onizleme', icon: CheckCircle2, description: 'Son kontrol' },
];

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

const MENTORING_TYPES = [
  { id: 'career', label: 'Kariyer Rehberligi', icon: Target, description: 'Kariyer yolculugunda yonlendirme' },
  { id: 'technical', label: 'Teknik Mentorluk', icon: Briefcase, description: 'Teknik konularda derinlemesine destek' },
  { id: 'interview', label: 'Mulakat Hazirlik', icon: MessageSquare, description: 'Is gorusmelerine hazirlik' },
  { id: 'cv-review', label: 'CV Inceleme', icon: User, description: 'CV ve portfolyo degerlendirmesi' },
  { id: 'project', label: 'Proje Destegi', icon: Package, description: 'Proje bazli rehberlik' },
  { id: 'exam-coaching', label: 'Sinav Koclugu', icon: BookOpen, description: 'Sinav stratejisi ve motivasyon' },
];

const STUDENT_MENTORING_TYPES = [
  { id: 'exam-coaching', label: 'Sinav Koclugu', icon: BookOpen, description: 'YKS stratejisi ve rehberlik' },
  { id: 'study-plan', label: 'Calisma Plani', icon: Target, description: 'Kisisellestirilmis calisma programi' },
  { id: 'motivation', label: 'Motivasyon Destegi', icon: Star, description: 'Surec boyunca motivasyon' },
  { id: 'subject-help', label: 'Ders Destegi', icon: GraduationCap, description: 'Belirli derslerde yardim' },
  { id: 'uni-guidance', label: 'Universite Rehberligi', icon: Award, description: 'Bolum ve universite secimi' },
  { id: 'experience-sharing', label: 'Deneyim Paylasimi', icon: MessageSquare, description: 'Sinav deneyimini aktarma' },
];

const SESSION_FORMATS = [
  { id: 'video', label: 'Goruntulu Gorusme', icon: Video },
  { id: 'audio', label: 'Sesli Gorusme', icon: Mic },
  { id: 'chat', label: 'Yazili Mesaj', icon: MessageCircle },
];

const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya',
  'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
  'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
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

const UNIVERSITIES = [
  'Bogazici Universitesi', 'ODTU', 'ITU', 'Hacettepe Universitesi',
  'Bilkent Universitesi', 'Koc Universitesi', 'Sabanci Universitesi',
  'Galatasaray Universitesi', 'Ankara Universitesi', 'Istanbul Universitesi',
  'Yildiz Teknik Universitesi', 'Ege Universitesi', 'Dokuz Eylul Universitesi',
  'Marmara Universitesi', 'Gazi Universitesi', 'Diger',
];

const UNIVERSITY_YEARS = [
  'Hazirlik', '1. Sinif', '2. Sinif', '3. Sinif', '4. Sinif',
  '5. Sinif', '6. Sinif', 'Yuksek Lisans', 'Doktora',
];

const YKS_EXAM_TYPES = [
  { id: 'say', label: 'SAY (Sayisal)' },
  { id: 'ea', label: 'EA (Esit Agirlik)' },
  { id: 'soz', label: 'SOZ (Sozel)' },
  { id: 'dil', label: 'DIL (Yabanci Dil)' },
  { id: 'tyt', label: 'TYT (Temel Yeterlilik)' },
];

// ===== SCHEMA =====
const profileSchema = z.object({
  fullName: z.string().min(2, 'Ad soyad gerekli'),
  headline: z.string().min(3, 'Baslik gerekli').max(300),
  bio: z.string().min(20, 'En az 20 karakter yazin').max(2000),
  university: z.string().optional(),
  department: z.string().optional(),
  graduationYear: z.union([z.number(), z.string()]).optional().transform((v) => {
    if (v === undefined || v === null || v === '') return undefined;
    return typeof v === 'string' ? Number(v) : v;
  }),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ===== HELPERS =====
function normalizeStep(v: string | null): StepKey {
  const valid: StepKey[] = ['profile', 'expertise', 'qualifications', 'mentoring', 'review'];
  if (v && valid.includes(v as StepKey)) return v as StepKey;
  if (v === 'verification') return 'qualifications';
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

  const stepFromUrl = useMemo(() => normalizeStep(searchParams.get('step')), [searchParams]);
  const isStudentUpgrade = searchParams.get('source') === 'student';
  const [currentStep, setCurrentStep] = useState<number>(stepKeyToId(stepFromUrl));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasProfile, setHasProfile] = useState(false);
  const [isPrefillLoading, setIsPrefillLoading] = useState(true);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', headline: '', bio: '', university: '', department: '' },
  });

  // Mentor type
  const [mentorType, setMentorType] = useState<MentorType>('');

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Step 1 extras
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const [timezone, setTimezone] = useState('Europe/Istanbul (UTC+3)');
  const [languages, setLanguages] = useState<string[]>(['Turkce']);

  // Step 2
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [subtopicInput, setSubtopicInput] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);

  // Step 3 - Professional
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [previousCompanies, setPreviousCompanies] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Step 3 - Student
  const [university, setUniversity] = useState('');
  const [universityOther, setUniversityOther] = useState('');
  const [department, setDepartment] = useState('');
  const [universityYear, setUniversityYear] = useState('');
  const [yksExamType, setYksExamType] = useState('');
  const [yksScore, setYksScore] = useState('');
  const [yksRanking, setYksRanking] = useState('');

  // Step 3 - Verification (preserved from production)
  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [existingVerifications, setExistingVerifications] = useState<MentorVerification[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    verificationId: string | null;
    isDeleting: boolean;
  }>({ open: false, verificationId: null, isDeleting: false });

  // Step 4
  const [mentoringTypes, setMentoringTypes] = useState<string[]>([]);
  const [sessionFormats, setSessionFormats] = useState<string[]>([]);
  const [offerFreeIntro, setOfferFreeIntro] = useState(true);

  // ===== URL sync =====
  useEffect(() => {
    setCurrentStep(stepKeyToId(stepFromUrl));
  }, [stepFromUrl]);

  // Close city dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCities = useMemo(() => {
    if (!citySearch) return CITIES;
    const q = citySearch.toLowerCase().replace(/[ıİ]/g, m => m === 'ı' ? 'i' : 'i');
    return CITIES.filter(c => c.toLowerCase().replace(/[ıİ]/g, m => m === 'ı' ? 'i' : 'i').includes(q));
  }, [citySearch]);

  const goStep = useCallback((key: StepKey) => {
    const sourceParam = isStudentUpgrade ? '&source=student' : '';
    router.replace(`/auth/onboarding/mentor?step=${key}${sourceParam}`);
  }, [isStudentUpgrade, router]);

  // ===== Prefill =====
  useEffect(() => {
    (async () => {
      if (isStudentUpgrade) {
        setHasProfile(false);
        setIsPrefillLoading(false);
        return;
      }

      try {
        const p = await mentorsApi.getMyProfile();
        setHasProfile(true);
        profileForm.reset({
          fullName: p.displayName ?? '',
          headline: p.headline ?? '',
          bio: p.bio ?? '',
          university: p.university ?? '',
          department: p.department ?? '',
          graduationYear: p.graduationYear ?? undefined,
        });
        if (p.verifications && p.verifications.length > 0) {
          setExistingVerifications(p.verifications);
        }
      } catch {
        setHasProfile(false);
      }

      try {
        const ob = await onboardingApi.getMentorOnboarding();
        if (ob) {
          if (ob.mentorType) setMentorType(ob.mentorType as MentorType);
          if (ob.city) setCity(ob.city);
          if (ob.timezone) setTimezone(ob.timezone);
          if (ob.languages) { try { setLanguages(JSON.parse(ob.languages)); } catch { /* */ } }
          if (ob.categories) { try { setSelectedCategories(JSON.parse(ob.categories)); } catch { /* */ } }
          if (ob.subtopics) { try { setSubtopics(JSON.parse(ob.subtopics)); } catch { /* */ } }
          if (ob.targetAudience) { try { setTargetAudience(JSON.parse(ob.targetAudience)); } catch { /* */ } }
          if (ob.experienceLevels) { try { setExperienceLevels(JSON.parse(ob.experienceLevels)); } catch { /* */ } }
          if (ob.yearsOfExperience) setYearsOfExperience(ob.yearsOfExperience);
          if (ob.currentRole) setCurrentRole(ob.currentRole);
          if (ob.currentCompany) setCurrentCompany(ob.currentCompany);
          if (ob.previousCompanies) setPreviousCompanies(ob.previousCompanies);
          if (ob.education) setEducation(ob.education);
          if (ob.certifications) setCertifications(ob.certifications);
          if (ob.linkedinUrl) setLinkedinUrl(ob.linkedinUrl);
          if (ob.githubUrl) setGithubUrl(ob.githubUrl);
          if (ob.portfolioUrl) setPortfolioUrl(ob.portfolioUrl);
          if (ob.yksExamType) setYksExamType(ob.yksExamType);
          if (ob.yksScore) setYksScore(ob.yksScore);
          if (ob.yksRanking) setYksRanking(ob.yksRanking);
          if (ob.mentoringTypes) { try { setMentoringTypes(JSON.parse(ob.mentoringTypes)); } catch { /* */ } }
          if (ob.sessionFormats) { try { setSessionFormats(JSON.parse(ob.sessionFormats)); } catch { /* */ } }
          if (ob.offerFreeIntro !== undefined) setOfferFreeIntro(ob.offerFreeIntro ?? true);
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

  // ===== Delete verification modal (preserved) =====
  const openDeleteModal = (verificationId: string) => setDeleteModal({ open: true, verificationId, isDeleting: false });
  const closeDeleteModal = () => { if (!deleteModal.isDeleting) setDeleteModal({ open: false, verificationId: null, isDeleting: false }); };
  const confirmDeleteVerification = async () => {
    if (!deleteModal.verificationId) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      await mentorsApi.deleteVerification(deleteModal.verificationId);
      setExistingVerifications((prev) => prev.filter((v) => v.id !== deleteModal.verificationId));
      toast.success('Belge basariyla silindi');
      closeDeleteModal();
    } catch (error: any) {
      toast.error(error?.response?.data?.errors?.[0] || 'Belge silinirken hata olustu');
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // ===== Navigation =====
  const handleBack = () => { if (currentStep > 1) goStep(idToStepKey(currentStep - 1)); };

  // ===== Step handlers =====
  const handleProfileNext = async () => {
    const valid = await profileForm.trigger();
    if (!valid) return;
    const data = profileForm.getValues();
    try {
      setIsSubmitting(true);
      const payload = { university: data.university || '', department: data.department || '', bio: data.bio, graduationYear: data.graduationYear, headline: data.headline };

      if (isStudentUpgrade && !hasProfile) {
        const response = await mentorsApi.becomeMentor(payload);
        updateTokensAfterRoleChange(response.accessToken, response.refreshToken, response.roles);
        await useAuthStore.getState().applyRoleUpgrade();
        toast.success('Tebrikler! Artik bir mentorsunuz!');
        setTimeout(() => router.push('/mentor/dashboard'), 1000);
        return;
      }

      if (avatarFile) { try { await userApi.uploadAvatar(avatarFile); } catch { /* non-blocking */ } }
      if (hasProfile) { await mentorsApi.updateProfile(payload); toast.success('Profil bilgileri guncellendi'); }
      else { await mentorsApi.createProfile(payload); setHasProfile(true); toast.success('Profil bilgileri kaydedildi'); }
      goStep('expertise');
    } catch (error: any) { toast.error(error?.response?.data?.errors?.[0] || 'Bir hata olustu'); }
    finally { setIsSubmitting(false); }
  };

  const handleExpertiseNext = () => {
    if (selectedCategories.length === 0) { toast.error('En az bir uzmanlik alani secin'); return; }
    goStep('qualifications');
  };

  const handleQualificationsNext = async () => {
    try {
      setIsSubmitting(true);
      if (studentCardFile) { try { await mentorsApi.submitVerification('University', studentCardFile); setStudentCardFile(null); } catch { /* */ } }
      if (transcriptFile) { try { await mentorsApi.submitVerification('Ranking', transcriptFile); setTranscriptFile(null); } catch { /* */ } }
      goStep('mentoring');
    } catch { toast.error('Bir hata olustu'); }
    finally { setIsSubmitting(false); }
  };

  const handleMentoringNext = () => {
    if (mentoringTypes.length === 0) { toast.error('En az bir mentorluk turu secin'); return; }
    goStep('review');
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      const onboardingData: MentorOnboardingData = {
        mentorType, city, timezone,
        languages: JSON.stringify(languages),
        categories: JSON.stringify(selectedCategories),
        subtopics: JSON.stringify(subtopics),
        targetAudience: JSON.stringify(targetAudience),
        experienceLevels: JSON.stringify(experienceLevels),
        yearsOfExperience, currentRole, currentCompany, previousCompanies,
        education, certifications, linkedinUrl, githubUrl, portfolioUrl,
        yksExamType, yksScore, yksRanking,
        mentoringTypes: JSON.stringify(mentoringTypes),
        sessionFormats: JSON.stringify(sessionFormats),
        offerFreeIntro,
      };
      await onboardingApi.saveMentorOnboarding(onboardingData);
      toast.success('Basvurunuz basariyla gonderildi!');
      setTimeout(() => router.push('/mentor/dashboard'), 1500);
    } catch (error: any) { toast.error(error?.response?.data?.errors?.[0] || 'Bir hata olustu'); }
    finally { setIsSubmitting(false); }
  };

  const progressPercent = (currentStep / STEPS.length) * 100;

  const completionItems = useMemo(() => [
    { label: 'Mentor turu secildi', done: mentorType !== '' },
    { label: 'Profil bilgileri tamamlandi', done: (profileForm.getValues('fullName') || '').length >= 2 },
    { label: 'Biyografi yazildi', done: (profileForm.getValues('bio') || '').length >= 20 },
    { label: 'Uzmanlik alanlari eklendi', done: selectedCategories.length > 0 },
    ...(mentorType === 'student'
      ? [{ label: 'Universite bilgisi girildi', done: university !== '' }, { label: 'Sinav bilgileri eklendi', done: yksExamType !== '' }]
      : [{ label: 'Deneyim bilgileri girildi', done: yearsOfExperience !== '' }]
    ),
    { label: 'Mentorluk tercihleri secildi', done: mentoringTypes.length > 0 },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [mentorType, selectedCategories, university, yksExamType, yearsOfExperience, mentoringTypes]);

  const completionPercent = useMemo(() => {
    const done = completionItems.filter((i) => i.done).length;
    return Math.round((done / completionItems.length) * 100);
  }, [completionItems]);

  const suggestedTopics = selectedCategories.flatMap((c) => SUGGESTED_SUBTOPICS[c] || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Top Nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-green-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Mentor Basvurusu</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/mentor/dashboard')} className="text-gray-500 text-xs">
            Daha Sonra Tamamla
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Student Upgrade Banner */}
        {isStudentUpgrade && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">Mentor Ol!</h3>
                <p className="text-sm text-amber-800 mt-1">Bilgini paylas, gelir kazan! Profilini olustur ve hemen mentorluga basla.</p>
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
              const StepIcon = step.id === 3 && mentorType === 'student' ? GraduationCap : step.icon;
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
                    <span className={cn('text-xs whitespace-nowrap', isActive ? 'text-teal-700 font-medium' : isCompleted ? 'text-gray-600' : 'text-gray-400')}>
                      {step.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={cn('w-12 lg:w-20 h-0.5 mx-1 mt-[-18px] transition-colors', isCompleted ? 'bg-gradient-to-r from-teal-400 to-green-400' : 'bg-gray-200')} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {isPrefillLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Bilgileriniz yukleniyor...</p>
          </div>
        )}

        {!isPrefillLoading && (
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

              {/* ===== STEP 1: PROFILE ===== */}
              {currentStep === 1 && (
                <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-50">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center"><User className="w-5 h-5 text-white" /></div><div><h2 className="text-xl font-bold text-gray-900">Profil Bilgileri</h2><p className="text-sm text-gray-500">Kendinizi tanitin</p></div></div>
                    </div>
                    <div className="px-6 sm:px-8 py-6 space-y-6">
                      {/* Mentor Type */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block">Mentor Turunuz <span className="text-red-500">*</span></Label>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <button type="button" onClick={() => setMentorType('professional')} className={cn('relative flex flex-col p-4 rounded-xl border-2 transition-all text-left', mentorType === 'professional' ? 'border-teal-400 bg-teal-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
                            {mentorType === 'professional' && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>}
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', mentorType === 'professional' ? 'bg-gradient-to-br from-teal-400 to-green-500 text-white' : 'bg-gray-100 text-gray-400')}><Briefcase className="w-5 h-5" /></div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-1">Profesyonel Mentor</h3>
                            <p className="text-xs text-gray-500">Is deneyimine sahip profesyonel olarak mentorluk verin.</p>
                          </button>
                          <button type="button" onClick={() => setMentorType('student')} className={cn('relative flex flex-col p-4 rounded-xl border-2 transition-all text-left', mentorType === 'student' ? 'border-purple-400 bg-purple-50/50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
                            {mentorType === 'student' && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>}
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', mentorType === 'student' ? 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white' : 'bg-gray-100 text-gray-400')}><GraduationCap className="w-5 h-5" /></div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-1">Ogrenci Mentor</h3>
                            <p className="text-xs text-gray-500">Sinav deneyiminizi lise ogrencileriyle paylasin.</p>
                          </button>
                        </div>
                        {mentorType === 'student' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-purple-700">Ogrenci mentorlar, sinav basarilarini lise ogrencileriyle paylasin. Belgeleriniz onay surecinde dogrulanacaktir.</p>
                          </motion.div>
                        )}
                      </div>

                      {/* Photo */}
                      <div className="flex items-start gap-5">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 to-green-100 border-2 border-dashed border-teal-300 flex items-center justify-center overflow-hidden cursor-pointer" onClick={handlePhotoUpload}>
                            {avatarPreview ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-teal-400" />}
                          </div>
                          <button type="button" onClick={handlePhotoUpload} className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-teal-500 to-green-500 text-white rounded-full flex items-center justify-center shadow-md"><Camera className="w-3.5 h-3.5" /></button>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </div>
                        <div className="flex-1 pt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Profil Fotografi</p>
                          <p className="text-xs text-gray-400 mb-2">Min. 400x400px, JPG/PNG.</p>
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit"><Star className="w-3.5 h-3.5" />Fotografli profiller %80 daha fazla tiklaniyor</div>
                        </div>
                      </div>

                      {/* Name & Title */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ad Soyad <span className="text-red-500">*</span></Label>
                          <Input placeholder="Adiniz ve soyadiniz" {...profileForm.register('fullName')} />
                          {profileForm.formState.errors.fullName && <p className="text-xs text-red-600 mt-1">{profileForm.formState.errors.fullName.message}</p>}
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">{mentorType === 'student' ? 'Kisa Tanitim' : 'Profesyonel Unvan'} <span className="text-red-500">*</span></Label>
                          <Input placeholder={mentorType === 'student' ? 'Or: Bogazici Bilgisayar Muh.' : 'Or: Senior .NET Architect'} {...profileForm.register('headline')} />
                          {profileForm.formState.errors.headline && <p className="text-xs text-red-600 mt-1">{profileForm.formState.errors.headline.message}</p>}
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Hakkimda <span className="text-red-500">*</span></Label>
                        <Textarea placeholder="Kendinizi tanitin, deneyimlerinizi paylasin..." className="min-h-[100px]" {...profileForm.register('bio')} />
                        {profileForm.formState.errors.bio && <p className="text-xs text-red-600 mt-1">{profileForm.formState.errors.bio.message}</p>}
                      </div>

                      {/* Location */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div ref={cityRef} className="relative">
                          <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Şehir</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <Input
                              type="text"
                              value={cityDropdownOpen ? citySearch : (city || '')}
                              onChange={e => { setCitySearch(e.target.value); if (!cityDropdownOpen) setCityDropdownOpen(true); }}
                              onFocus={() => { setCityDropdownOpen(true); setCitySearch(''); }}
                              placeholder="Şehir ara..."
                              className="pl-10"
                              autoComplete="off"
                            />
                            {city && !cityDropdownOpen && (
                              <button type="button" onClick={() => { setCity(''); setCitySearch(''); setCityDropdownOpen(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {cityDropdownOpen && (
                            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {filteredCities.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-400">Sonuç bulunamadı</div>
                              ) : (
                                filteredCities.map(c => (
                                  <button key={c} type="button" onClick={() => { setCity(c); setCitySearch(''); setCityDropdownOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-50 transition-colors ${city === c ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}>
                                    {c}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Zaman Dilimi</Label><Select value={timezone} onValueChange={setTimezone}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent></Select></div>
                      </div>

                      {/* Languages */}
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Diller</Label>
                        <div className="flex flex-wrap gap-2">
                          {LANGUAGES.map((lang) => { const sel = languages.includes(lang); return (
                            <button key={lang} type="button" onClick={() => toggleInArray(languages, lang, setLanguages)} className={cn('px-3 py-1.5 rounded-full text-xs border transition-all', sel ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300')}>
                              {sel && <span className="mr-1">&#10003;</span>}{lang}
                            </button>
                          ); })}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button type="button" variant="gradient" size="lg" className="gap-2" onClick={handleProfileNext} disabled={isSubmitting || mentorType === ''}>
                          {isSubmitting ? 'Kaydediliyor...' : (isStudentUpgrade ? 'Kaydet ve Basla' : 'Devam Et')}{!isSubmitting && <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className="hidden lg:block">
                    <div className="sticky top-24">
                      <p className="text-xs text-gray-400 mb-2">Profil Onizleme</p>
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className={cn('h-16', mentorType === 'student' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-teal-500 to-green-500')} />
                        <div className="px-4 pb-4">
                          <div className="w-16 h-16 rounded-full border-3 border-white bg-gradient-to-br from-teal-100 to-green-100 -mt-8 mb-3 overflow-hidden flex items-center justify-center">
                            {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-teal-400" />}
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 truncate">{profileForm.watch('fullName') || 'Adiniz Soyadiniz'}</h3>
                          <p className="text-xs text-gray-500 truncate mb-2">{profileForm.watch('headline') || 'Kisa tanitim'}</p>
                          {mentorType && <span className={cn('inline-block text-[10px] py-0.5 px-2 rounded-full mb-2 font-medium', mentorType === 'student' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-teal-50 text-teal-600 border border-teal-200')}>{mentorType === 'student' ? 'Ogrenci Mentor' : 'Profesyonel Mentor'}</span>}
                          {city && <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> {city}</p>}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> Yeni Mentor</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 0 ogrenci</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: EXPERTISE ===== */}
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-50">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center"><Target className="w-5 h-5 text-white" /></div><div><h2 className="text-xl font-bold text-gray-900">Uzmanlik Alanlari</h2><p className="text-sm text-gray-500">Hangi konularda mentorluk vereceksiniz?</p></div></div>
                  </div>
                  <div className="px-6 sm:px-8 py-6 space-y-8">
                    {mentorType === 'student' && <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-start gap-2.5"><Info className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" /><p className="text-xs text-purple-700">&quot;Egitim &amp; Sinavlar&quot; kategorisi sizin icin one cikarilmistir.</p></div>}

                    {/* Categories */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1 block">Ana Uzmanlik Alanlari <span className="text-red-500">*</span></Label>
                      <p className="text-xs text-gray-400 mb-3">En az bir, en fazla uc alan secin.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {CATEGORIES.map((cat) => { const isSel = selectedCategories.includes(cat.id); const isHL = mentorType === 'student' && cat.id === 'education' && !isSel; return (
                          <button key={cat.id} type="button" onClick={() => { if (isSel || selectedCategories.length < 3) toggleInArray(selectedCategories, cat.id, setSelectedCategories); }}
                            className={cn('flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center', isSel ? 'bg-teal-50 border-teal-300 shadow-sm' : isHL ? 'bg-purple-50/50 border-purple-200 ring-2 ring-purple-100' : 'bg-white border-gray-200 hover:border-gray-300', !isSel && selectedCategories.length >= 3 && 'opacity-50 cursor-not-allowed')}>
                            <span className="text-2xl">{cat.emoji}</span>
                            <span className={cn('text-xs', isSel ? 'text-teal-700 font-medium' : 'text-gray-600')}>{cat.label}</span>
                            {isSel && <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                          </button>
                        ); })}
                      </div>
                    </div>

                    {/* Subtopics */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1 block">Alt Konular &amp; Beceriler</Label>
                      <div className="flex gap-2 mb-3">
                        <Input value={subtopicInput} onChange={(e) => setSubtopicInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtopic(subtopicInput); } }} placeholder="Konu ekleyin..." className="flex-1" />
                        <Button type="button" variant="outline" onClick={() => addSubtopic(subtopicInput)}><Plus className="w-4 h-4" /></Button>
                      </div>
                      {subtopics.length > 0 && <div className="flex flex-wrap gap-2 mb-4">{subtopics.map((t) => <span key={t} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-200">{t}<button type="button" onClick={() => removeSubtopic(t)} className="hover:bg-teal-100 rounded-full p-0.5"><X className="w-3 h-3" /></button></span>)}</div>}
                      {suggestedTopics.length > 0 && <div><p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> Onerilen:</p><div className="flex flex-wrap gap-1.5">{suggestedTopics.filter((t) => !subtopics.includes(t)).slice(0, 12).map((t) => <button key={t} type="button" onClick={() => addSubtopic(t)} className="px-2.5 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all">+ {t}</button>)}</div></div>}
                    </div>

                    {/* Target Audience */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">Hedef Kitle</Label>
                      <div className="flex flex-wrap gap-2">{TARGET_AUDIENCES.map((ta) => { const sel = targetAudience.includes(ta.id); return <button key={ta.id} type="button" onClick={() => toggleInArray(targetAudience, ta.id, setTargetAudience)} className={cn('px-4 py-2 rounded-xl text-xs border transition-all', sel ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}>{sel && <Check className="w-3 h-3 inline mr-1.5" />}{ta.label}</button>; })}</div>
                    </div>

                    {/* Experience Levels */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">Desteklediginiz Seviyeler</Label>
                      <div className="flex flex-wrap gap-2">{EXPERIENCE_LEVELS.map((el) => { const sel = experienceLevels.includes(el.id); return <button key={el.id} type="button" onClick={() => toggleInArray(experienceLevels, el.id, setExperienceLevels)} className={cn('px-4 py-2 rounded-xl text-xs border transition-all', sel ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}>{sel && <Check className="w-3 h-3 inline mr-1.5" />}{el.label}</button>; })}</div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button type="button" variant="outline" size="lg" onClick={handleBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Geri</Button>
                      <Button type="button" variant="gradient" size="lg" className="flex-1 gap-2" onClick={handleExpertiseNext}>Devam Et <ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: QUALIFICATIONS ===== */}
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-50">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center">{mentorType === 'student' ? <GraduationCap className="w-5 h-5 text-white" /> : <Briefcase className="w-5 h-5 text-white" />}</div><div><h2 className="text-xl font-bold text-gray-900">{mentorType === 'student' ? 'Akademik Bilgiler' : 'Profesyonel Deneyim'}</h2><p className="text-sm text-gray-500">{mentorType === 'student' ? 'Universite ve sinav bilgileriniz' : 'Kariyer gecmisiniz'}</p></div></div>
                  </div>
                  <div className="px-6 sm:px-8 py-6 space-y-6">
                    {/* PROFESSIONAL */}
                    {mentorType !== 'student' && (<>
                      <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3"><Shield className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" /><div><p className="text-sm text-teal-800 font-medium">Dogrulanmis profiller 3x daha fazla rezervasyon alir</p></div></div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Toplam Deneyim <span className="text-red-500">*</span></Label><Select value={yearsOfExperience} onValueChange={setYearsOfExperience}><SelectTrigger><SelectValue placeholder="Deneyim sureniz" /></SelectTrigger><SelectContent>{['1-2 yil', '3-5 yil', '5-10 yil', '10-15 yil', '15+ yil'].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mevcut Pozisyon</Label><Input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="Or: Lead Software Engineer" /></div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mevcut Sirket</Label><Input value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} placeholder="Or: Google" /></div>
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Onceki Sirketler</Label><Input value={previousCompanies} onChange={(e) => setPreviousCompanies(e.target.value)} placeholder="Virgullerle ayirin" /></div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Egitim</Label><Input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Or: Bilgisayar Muh., Bogazici" /></div>
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sertifikalar</Label><Input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="Or: AWS, PMP" /></div>
                      </div>
                      <div><Label className="text-sm font-semibold text-gray-700 mb-3 block">Sosyal Baglantilar</Label><div className="space-y-3">
                        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Linkedin className="w-4 h-4 text-blue-600" /></div><Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/username" /></div>
                        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Github className="w-4 h-4 text-gray-700" /></div><Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="github.com/username" /></div>
                        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0"><ExternalLink className="w-4 h-4 text-green-600" /></div><Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="portfolio.com" /></div>
                      </div></div>
                    </>)}

                    {/* STUDENT */}
                    {mentorType === 'student' && (<>
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3"><Shield className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" /><div><p className="text-sm text-purple-800 font-medium">Belge dogrulamasi guvenilirliginizi artirir</p></div></div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Universite <span className="text-red-500">*</span></Label><Select value={university} onValueChange={setUniversity}><SelectTrigger><SelectValue placeholder="Secin" /></SelectTrigger><SelectContent>{UNIVERSITIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                        {university === 'Diger' && <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Universite Adi <span className="text-red-500">*</span></Label><Input value={universityOther} onChange={(e) => setUniversityOther(e.target.value)} placeholder="Tam adi" /></div>}
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Bolum <span className="text-red-500">*</span></Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Or: Bilgisayar Muh." /></div>
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sinif</Label><Select value={universityYear} onValueChange={setUniversityYear}><SelectTrigger><SelectValue placeholder="Sinifiniz" /></SelectTrigger><SelectContent>{UNIVERSITY_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
                      </div>
                      <div><h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Sinav Bilgileri</h3><div className="grid sm:grid-cols-3 gap-4">
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Puan Turu <span className="text-red-500">*</span></Label><Select value={yksExamType} onValueChange={setYksExamType}><SelectTrigger><SelectValue placeholder="Secin" /></SelectTrigger><SelectContent>{YKS_EXAM_TYPES.map((ex) => <SelectItem key={ex.id} value={ex.id}>{ex.label}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Puan</Label><Input type="number" value={yksScore} onChange={(e) => setYksScore(e.target.value)} placeholder="480.25" /></div>
                        <div><Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Siralama</Label><Input type="number" value={yksRanking} onChange={(e) => setYksRanking(e.target.value)} placeholder="847" /></div>
                      </div></div>

                      {/* Verification uploads */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Belge Yukleme (Opsiyonel)</h3>
                        <p className="text-xs text-gray-400 mb-4">PDF veya resim formati. Maks 10MB.</p>
                        {existingVerifications.length > 0 && (
                          <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-sm mb-3">Mevcut Belgeleriniz:</h4>
                            <div className="space-y-2">{existingVerifications.map((v) => (
                              <div key={v.id} className="flex items-center justify-between p-3 bg-white rounded border">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">{v.type === 'University' ? '\u{1F393}' : '\u{1F4CA}'}</div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{v.type === 'University' ? 'Ogrenci Belgesi' : 'Transkript/Sonuc'}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {v.status === 'Approved' && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium"><Check className="w-3 h-3 inline mr-0.5" />Onaylandi</span>}
                                      {v.status === 'Pending' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium"><Clock className="w-3 h-3 inline mr-0.5" />Onay Bekliyor</span>}
                                      {v.status === 'Rejected' && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">Reddedildi</span>}
                                    </div>
                                    {v.notes && <p className="text-xs text-gray-600 mt-1 italic">Not: {v.notes}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                  {v.documentUrl && <a href={v.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">Goruntule <ExternalLink className="w-3 h-3" /></a>}
                                  {(v.status === 'Pending' || v.status === 'Rejected') && <button type="button" onClick={() => openDeleteModal(v.id)} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /> Sil</button>}
                                </div>
                              </div>
                            ))}</div>
                          </div>
                        )}
                        <div className="space-y-4">
                          <div><label className="block text-sm font-medium mb-2">Ogrenci Belgesi</label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setStudentCardFile(e.target.files?.[0] || null)} />{studentCardFile && <p className="text-xs text-green-600 mt-1">Secildi: {studentCardFile.name}</p>}</div>
                          <div><label className="block text-sm font-medium mb-2">Transkript / Sonuc Belgesi</label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)} />{transcriptFile && <p className="text-xs text-green-600 mt-1">Secildi: {transcriptFile.name}</p>}</div>
                        </div>
                      </div>
                    </>)}

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"><div className="flex items-start gap-3"><Shield className="w-5 h-5 text-green-600 mt-0.5 shrink-0" /><div><h4 className="font-semibold text-green-900 text-sm">Guvenlik &amp; Gizlilik</h4><p className="text-xs text-green-700 mt-1">Yuklediginiz belgeler guvenli saklanir ve yalnizca admin ekibimiz tarafindan incelenir.</p></div></div></div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button type="button" variant="outline" size="lg" onClick={handleBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Geri</Button>
                      <Button type="button" variant="gradient" size="lg" className="flex-1 gap-2" onClick={handleQualificationsNext} disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor...' : 'Devam Et'}{!isSubmitting && <ChevronRight className="w-4 h-4" />}</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 4: MENTORING ===== */}
              {currentStep === 4 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-50">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div><div><h2 className="text-xl font-bold text-gray-900">Mentorluk Tercihleri</h2><p className="text-sm text-gray-500">Nasil mentorluk yapmak istiyorsunuz?</p></div></div>
                  </div>
                  <div className="px-6 sm:px-8 py-6 space-y-8">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">Mentorluk Turleri <span className="text-red-500">*</span></Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {(mentorType === 'student' ? STUDENT_MENTORING_TYPES : MENTORING_TYPES).map((mt) => { const sel = mentoringTypes.includes(mt.id); const Icon = mt.icon; return (
                          <button key={mt.id} type="button" onClick={() => toggleInArray(mentoringTypes, mt.id, setMentoringTypes)} className={cn('flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left', sel ? 'border-teal-500 bg-teal-50/50 shadow-md shadow-teal-500/10' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', sel ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500')}><Icon className="w-5 h-5" /></div>
                            <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-semibold text-gray-900 text-sm">{mt.label}</span>{sel && <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" /></div>}</div><p className="text-xs text-gray-500 mt-0.5">{mt.description}</p></div>
                          </button>
                        ); })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-3 block">Oturum Formati</Label>
                      <div className="flex flex-wrap gap-3">
                        {SESSION_FORMATS.map((sf) => { const sel = sessionFormats.includes(sf.id); const Icon = sf.icon; return (
                          <button key={sf.id} type="button" onClick={() => toggleInArray(sessionFormats, sf.id, setSessionFormats)} className={cn('flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all', sel ? 'border-teal-500 bg-teal-50/50' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                            <Icon className={cn('w-5 h-5', sel ? 'text-teal-600' : 'text-gray-400')} />
                            <span className={cn('font-medium text-sm', sel ? 'text-teal-700' : 'text-gray-600')}>{sf.label}</span>
                            {sel && <Check className="w-4 h-4 text-teal-500" />}
                          </button>
                        ); })}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Zap className="w-5 h-5 text-blue-600" /></div><div><h4 className="font-semibold text-gray-900 text-sm">Ucretsiz Tanitim Oturumu</h4><p className="text-xs text-gray-600 mt-0.5">15 dakikalik ucretsiz tanitim gorusmesi sunun.</p></div></div>
                        <Switch checked={offerFreeIntro} onCheckedChange={setOfferFreeIntro} />
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"><div className="flex items-start gap-2"><Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" /><p className="text-xs text-gray-600">Fiyatlandirma ve paket detaylarini profiliniz onaylandiktan sonra dashboard uzerinden ayarlayabilirsiniz.</p></div></div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button type="button" variant="outline" size="lg" onClick={handleBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Geri</Button>
                      <Button type="button" variant="gradient" size="lg" className="flex-1 gap-2" onClick={handleMentoringNext}>Devam Et <ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 5: REVIEW ===== */}
              {currentStep === 5 && (
                <div className="grid lg:grid-cols-[1fr,340px] gap-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-50">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center"><Star className="w-5 h-5 text-white" /></div><div><h2 className="text-xl font-bold text-gray-900">Basvurunuzu Inceleyin</h2><p className="text-sm text-gray-500">Son bir goz atin</p></div></div>
                    </div>
                    <div className="px-6 sm:px-8 py-6 space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-green-400 p-[3px] shrink-0"><div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">{avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-gray-400" />}</div></div>
                        <div>
                          <h3 className="font-bold text-gray-900">{profileForm.getValues('fullName') || '-'}</h3>
                          <p className="text-sm text-teal-600">{profileForm.getValues('headline') || '-'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {city && <span className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-3 h-3" /> {city}</span>}
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', mentorType === 'student' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700')}>{mentorType === 'student' ? 'Ogrenci Mentor' : 'Profesyonel'}</span>
                          </div>
                        </div>
                      </div>

                      <div><h4 className="text-sm font-semibold text-gray-700 mb-2">Hakkimda</h4><p className="text-sm text-gray-600 whitespace-pre-line">{profileForm.getValues('bio') || '-'}</p></div>

                      <div><h4 className="text-sm font-semibold text-gray-700 mb-2">Uzmanlik Alanlari</h4>
                        <div className="flex flex-wrap gap-2 mb-2">{selectedCategories.map((cId) => { const c = CATEGORIES.find((x) => x.id === cId); return c ? <span key={cId} className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-sm font-medium">{c.emoji} {c.label}</span> : null; })}</div>
                        {subtopics.length > 0 && <div className="flex flex-wrap gap-1.5">{subtopics.map((t) => <span key={t} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs">{t}</span>)}</div>}
                      </div>

                      <div><h4 className="text-sm font-semibold text-gray-700 mb-2">Nitelikler</h4>
                        {mentorType !== 'student' ? (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {yearsOfExperience && <div><span className="text-gray-500">Deneyim:</span> <span className="font-medium">{yearsOfExperience}</span></div>}
                            {currentRole && <div><span className="text-gray-500">Pozisyon:</span> <span className="font-medium">{currentRole}</span></div>}
                            {currentCompany && <div><span className="text-gray-500">Sirket:</span> <span className="font-medium">{currentCompany}</span></div>}
                            {education && <div><span className="text-gray-500">Egitim:</span> <span className="font-medium">{education}</span></div>}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {university && <div><span className="text-gray-500">Universite:</span> <span className="font-medium">{university === 'Diger' ? universityOther : university}</span></div>}
                            {department && <div><span className="text-gray-500">Bolum:</span> <span className="font-medium">{department}</span></div>}
                            {yksExamType && <div><span className="text-gray-500">Sinav:</span> <span className="font-medium">{YKS_EXAM_TYPES.find((e) => e.id === yksExamType)?.label}</span></div>}
                            {yksRanking && <div><span className="text-gray-500">Siralama:</span> <span className="font-medium">{yksRanking}</span></div>}
                          </div>
                        )}
                      </div>

                      {mentoringTypes.length > 0 && <div><h4 className="text-sm font-semibold text-gray-700 mb-2">Mentorluk Turleri</h4><div className="flex flex-wrap gap-2">{mentoringTypes.map((mtId) => { const types = mentorType === 'student' ? STUDENT_MENTORING_TYPES : MENTORING_TYPES; const mt = types.find((m) => m.id === mtId); return mt ? <span key={mtId} className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium">{mt.label}</span> : null; })}</div></div>}
                      {sessionFormats.length > 0 && <div><h4 className="text-sm font-semibold text-gray-700 mb-2">Oturum Formati</h4><div className="flex gap-2">{sessionFormats.map((sfId) => { const sf = SESSION_FORMATS.find((s) => s.id === sfId); if (!sf) return null; const SfI = sf.icon; return <span key={sfId} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center gap-1"><SfI className="w-3 h-3" /> {sf.label}</span>; })}</div></div>}
                      {offerFreeIntro && <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2"><Zap className="w-4 h-4" /> Ucretsiz tanitim oturumu sunuluyor</div>}

                      <div className="flex gap-3 pt-6 border-t border-gray-100">
                        <Button type="button" variant="outline" size="lg" onClick={handleBack} className="gap-2"><ChevronLeft className="w-4 h-4" /> Geri</Button>
                        <Button type="button" variant="gradient" size="lg" className="flex-1 gap-2" onClick={handleFinalSubmit} disabled={isSubmitting}>{isSubmitting ? 'Gonderiliyor...' : 'Basvuruyu Gonder'}{!isSubmitting && <ArrowRight className="w-4 h-4" />}</Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Sidebar */}
                  <div className="hidden lg:block">
                    <div className="sticky top-24">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tamamlanma Durumu</h3>
                        <div className="flex justify-center mb-6">
                          <div className="relative w-28 h-28">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#pg)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${completionPercent * 2.64} 264`} className="transition-all duration-500" />
                              <defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#22c55e" /></linearGradient></defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-gray-900">{completionPercent}%</span></div>
                          </div>
                        </div>
                        <div className="space-y-3">{completionItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0', item.done ? 'bg-teal-500' : 'border-2 border-gray-300')}>{item.done && <Check className="w-3 h-3 text-white" />}</div>
                            <span className={cn('text-sm', item.done ? 'text-gray-900' : 'text-gray-400')}>{item.label}</span>
                          </div>
                        ))}</div>
                      </div>
                      <div className={cn('mt-4 rounded-xl p-4 border', mentorType === 'student' ? 'bg-purple-50 border-purple-200' : 'bg-teal-50 border-teal-200')}>
                        <div className="flex items-start gap-2">
                          <Shield className={cn('w-4 h-4 mt-0.5 shrink-0', mentorType === 'student' ? 'text-purple-600' : 'text-teal-600')} />
                          <p className={cn('text-xs leading-relaxed', mentorType === 'student' ? 'text-purple-700' : 'text-teal-700')}>{mentorType === 'student' ? 'Belgeleriniz dogrulanacak. Onay sureci 24-48 saat.' : 'Profiliniz 24 saat icinde incelenecektir.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog open={deleteModal.open} onClose={closeDeleteModal} onConfirm={confirmDeleteVerification} title="Belgeyi Sil" description="Bu belgeyi silmek istediginizden emin misiniz?" confirmText="Evet, Sil" cancelText="Iptal" variant="danger" isLoading={deleteModal.isDeleting} />
    </div>
  );
}
