'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Users,
  BookOpen,
  Clock,
  Globe,
  BarChart3,
  Check,
  Lock,
  Play,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  X,
  ArrowLeft,
  Shield,
  CheckCircle,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCourseDetail, useEnrollInCourse, usePreviewLecture } from '@/lib/hooks/use-courses';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { CourseLevel, LectureType } from '@/lib/types/enums';
import { toast } from 'sonner';
import type { PreviewLectureDto } from '@/lib/types/models';
import VideoPlayer from '@/components/courses/video-player';
import { paymentsApi } from '@/lib/api/payments';
import { IyzicoCheckoutForm } from '@/components/payment/IyzicoCheckoutForm';
import { useAuthStore } from '@/lib/stores/auth-store';

type Tab = 'overview' | 'curriculum' | 'instructor';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  }
  return `${minutes}dk`;
}

function formatLectureDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getLevelLabel(level: CourseLevel): string {
  switch (level) {
    case CourseLevel.Beginner: return 'Başlangıç';
    case CourseLevel.Intermediate: return 'Orta';
    case CourseLevel.Advanced: return 'İleri';
    case CourseLevel.AllLevels: return 'Tüm Seviyeler';
    default: return level;
  }
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { data: course, isLoading } = useCourseDetail(courseId);
  const enrollMutation = useEnrollInCourse();
  const previewMutation = usePreviewLecture();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [previewData, setPreviewData] = useState<PreviewLectureDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutFormHtml, setCheckoutFormHtml] = useState('');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [pendingEnrollmentId, setPendingEnrollmentId] = useState<string | null>(null);

  const handlePreviewClick = useCallback(async (lectureId: string) => {
    try {
      const data = await previewMutation.mutateAsync({ courseId, lectureId });
      setPreviewData(data);
      setPreviewOpen(true);
    } catch {
      toast.error('Önizleme yüklenirken bir hata oluştu');
    }
  }, [courseId, previewMutation]);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setTimeout(() => setPreviewData(null), 300);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewOpen) closePreview();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [previewOpen, closePreview]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!course) return;

    // Login check
    if (!isAuthenticated) {
      toast.error('Kursa kayıt olmak için giriş yapmanız gerekiyor');
      router.push(`/auth/login?redirect=/public/courses/${courseId}`);
      return;
    }

    try {
      setIsProcessing(true);

      // 1) Create enrollment (status: PendingPayment)
      const result = await enrollMutation.mutateAsync(course.id);
      setPendingEnrollmentId(result.enrollmentId);

      // 2) Free course → direct access
      if (course.price === 0) {
        toast.success('Kursa başarıyla kayıt oldunuz!');
        router.push(ROUTES.COURSE_PLAYER(course.id));
        setIsProcessing(false);
        return;
      }

      // 3) Paid course → create order & show Iyzico checkout
      const orderResult = await paymentsApi.createOrder({
        type: 'Course',
        resourceId: result.enrollmentId,
        buyerName: user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User',
        buyerSurname: user?.displayName?.split(' ').slice(1).join(' ') || 'User',
        buyerPhone: user?.phone || '5555555555',
      });

      if (orderResult.checkoutFormContent) {
        setCheckoutFormHtml(orderResult.checkoutFormContent);
        setShowCheckoutForm(true);
        setIsProcessing(false);
      } else if (orderResult.paymentPageUrl) {
        window.location.href = orderResult.paymentPageUrl;
      } else {
        toast.error('Ödeme başlatılamadı. Lütfen tekrar deneyin.');
        setIsProcessing(false);
      }
    } catch (error: any) {
      setIsProcessing(false);
    }
  };

  const handleCloseCheckoutForm = () => {
    setShowCheckoutForm(false);
    setCheckoutFormHtml('');
    setPendingEnrollmentId(null);
    toast.info('Ödeme iptal edildi. Tekrar deneyebilirsiniz.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton Hero */}
        <div className="bg-gradient-to-br from-teal-600 to-green-600 py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-4 bg-white/20 rounded w-32 mb-4" />
            <div className="max-w-3xl animate-pulse space-y-4">
              <div className="h-8 bg-white/20 rounded w-3/4" />
              <div className="h-4 bg-white/20 rounded w-full" />
              <div className="h-4 bg-white/20 rounded w-1/2" />
              <div className="flex gap-4">
                <div className="h-6 bg-white/20 rounded w-24" />
                <div className="h-6 bg-white/20 rounded w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Kurs bulunamadı</h2>
          <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50" onClick={() => router.push(ROUTES.COURSE_CATALOG)}>
            Kataloğa Dön
          </Button>
        </div>
      </div>
    );
  }

  const sections = course.sections ?? [];
  const totalLectures = sections.reduce(
    (sum, sec) => sum + (sec.lectures?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="bg-gradient-to-br from-teal-600 to-green-600 py-10"
        style={
          course.coverImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(13,148,136,0.85), rgba(22,163,74,0.9)), url(${course.coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: course.coverImagePosition || 'center',
              }
            : undefined
        }
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={ROUTES.COURSE_CATALOG} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kurslara Dön
          </Link>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                {course.category && (
                  <span className="px-2 py-1 bg-white/20 text-white rounded text-xs">{course.category}</span>
                )}
                <span className="px-2 py-1 bg-white/20 text-white rounded text-xs">{getLevelLabel(course.level)}</span>
              </div>

              <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-teal-100 mb-4 text-lg">{course.shortDescription}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-semibold">{(course.ratingAvg ?? 0).toFixed(1)}</span>
                  <span>({course.ratingCount} yorum)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.enrollmentCount} öğrenci
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(course.totalDurationSec)}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {course.totalLectures} ders
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <Avatar className="w-10 h-10 border-2 border-white/30">
                  <AvatarImage src={course.mentorAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-green-500 text-white">
                    {(course.mentorName ?? '').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white text-sm font-medium">{course.mentorName}</div>
                  <div className="text-teal-200 text-xs">Eğitmen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200 overflow-x-auto">
                {[
                  { key: 'overview' as Tab, label: 'Genel Bakış' },
                  { key: 'curriculum' as Tab, label: 'Müfredat' },
                  { key: 'instructor' as Tab, label: 'Eğitmen' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
                      activeTab === tab.key
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Tab: Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Description */}
                    {course.description && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Kurs Hakkında</h2>
                        <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-line">
                          {course.description}
                        </div>
                      </div>
                    )}

                    {/* What you will learn */}
                    {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                      <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Neler Öğreneceksiniz</h2>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {course.whatYouWillLearn.map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requirements */}
                    {course.requirements && course.requirements.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Gereksinimler</h2>
                        <ul className="space-y-2">
                          {course.requirements.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 mt-2" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Target Audience */}
                    {course.targetAudience && course.targetAudience.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Hedef Kitle</h2>
                        <ul className="space-y-2">
                          {course.targetAudience.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 mt-2" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Curriculum */}
                {activeTab === 'curriculum' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">
                        {sections.length} bölüm - {totalLectures} ders -{' '}
                        {formatDuration(course.totalDurationSec)} toplam süre
                      </p>
                      <button
                        onClick={() => {
                          if (expandedSections.size === sections.length) {
                            setExpandedSections(new Set());
                          } else {
                            setExpandedSections(new Set(sections.map((s) => s.id)));
                          }
                        }}
                        className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium"
                      >
                        {expandedSections.size === sections.length
                          ? 'Tümü Kapat'
                          : 'Tümü Aç'}
                      </button>
                    </div>

                    {sections.map((section, sIdx) => (
                      <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-teal-300 transition-all">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 text-sm font-medium">
                              {sIdx + 1}
                            </div>
                            <div className="text-left">
                              <span className="font-medium text-gray-900">{section.title}</span>
                              <p className="text-xs text-gray-500">{section.lectures.length} ders</p>
                            </div>
                          </div>
                          {expandedSections.has(section.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {expandedSections.has(section.id) && (
                          <div className="border-t border-gray-100">
                            {section.lectures.map((lecture) => (
                              <div
                                key={lecture.id}
                                onClick={lecture.isPreview ? () => handlePreviewClick(lecture.id) : undefined}
                                className={cn(
                                  'flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors',
                                  lecture.isPreview
                                    ? 'cursor-pointer hover:bg-teal-50 group'
                                    : 'hover:bg-gray-50'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {lecture.isPreview ? (
                                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                                      <Play className="w-3.5 h-3.5 text-teal-600" />
                                    </div>
                                  ) : (
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className={cn(
                                    'text-sm',
                                    lecture.isPreview
                                      ? 'text-teal-700 font-medium group-hover:text-teal-800'
                                      : 'text-gray-700'
                                  )}>
                                    {lecture.title}
                                  </span>
                                  {lecture.isPreview && (
                                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs flex items-center gap-1 border border-teal-200">
                                      <Play className="w-3 h-3" /> Önizleme
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {lecture.type === LectureType.Video ? (
                                    <Play className="w-3.5 h-3.5" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                  )}
                                  {lecture.durationSec > 0 && formatLectureDuration(lecture.durationSec)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: Instructor */}
                {activeTab === 'instructor' && (
                  <div className="flex items-start gap-5">
                    <Avatar className="w-20 h-20 rounded-2xl">
                      <AvatarImage src={course.mentorAvatar} className="object-cover" />
                      <AvatarFallback className="text-2xl rounded-2xl bg-gradient-to-br from-teal-400 to-green-500 text-white">
                        {(course.mentorName ?? '').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">{course.mentorName}</h2>
                      <p className="text-teal-600 text-sm mb-3">Eğitmen</p>
                      {course.mentorBio && (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                          {course.mentorBio}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Öğrenci Yorumları</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{(course.ratingAvg ?? 0).toFixed(1)}</div>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < Math.round(course.ratingAvg ?? 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{course.ratingCount} değerlendirme</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center py-4">Detaylı yorumlar yakında eklenecek</p>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="sticky top-20 bg-white rounded-xl border-0 shadow-xl overflow-hidden">
              {/* Sidebar Cover */}
              {course.coverImageUrl && (
                <div className="relative">
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                    style={getCoverImageStyle(course.coverImagePosition, course.coverImageTransform)}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-teal-600 ml-1" />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Price */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {course.price === 0 ? (
                      <span className="text-green-600">Ücretsiz</span>
                    ) : (
                      formatCurrency(course.price, course.currency)
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Taksit seçeneği mevcuttur</p>
                </div>

                {/* Enroll / Continue Button */}
                {course.isOwnCourse ? (
                  <div className="text-center py-3 px-4 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium mb-4">
                    Bu sizin kursunuz
                  </div>
                ) : course.isEnrolled ? (
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white shadow-lg py-5 mb-4"
                    size="lg"
                    onClick={() => router.push(ROUTES.COURSE_PLAYER(course.id))}
                  >
                    Kursa Devam Et
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white shadow-lg py-5 mb-4"
                    size="lg"
                    onClick={handleEnroll}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        İşlem Yapılıyor...
                      </>
                    ) : course.price === 0 ? (
                      'Ücretsiz Kayıt Ol'
                    ) : (
                      'Hemen Satın Al'
                    )}
                  </Button>
                )}

                {/* Course Features */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span>Ömür boyu erişim</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span>{course.totalLectures} ders, {formatDuration(course.totalDurationSec)} video</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span>İndirilebilir kaynaklar</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span>Tamamlama sertifikası</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span>Mobil ve masaüstü erişim</span>
                  </div>
                </div>

                {/* Course Stats */}
                <div className="space-y-3 pt-4 mt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      Toplam Ders
                    </span>
                    <span className="font-medium">{course.totalLectures}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600" />
                      Toplam Süre
                    </span>
                    <span className="font-medium">{formatDuration(course.totalDurationSec)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-teal-600" />
                      Seviye
                    </span>
                    <span className="font-medium">{getLevelLabel(course.level)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-teal-600" />
                      Dil
                    </span>
                    <span className="font-medium">{course.language || 'Türkçe'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600" />
                      Öğrenci Sayısı
                    </span>
                    <span className="font-medium">{course.enrollmentCount}</span>
                  </div>
                </div>

                {/* Money-back Guarantee */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">30 gün içerisinde para iade garantisi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Iyzico Checkout Form Modal */}
      {showCheckoutForm && checkoutFormHtml && (
        <IyzicoCheckoutForm
          checkoutFormContent={checkoutFormHtml}
          onClose={handleCloseCheckoutForm}
        />
      )}

      {/* Preview Video Modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-4xl mx-4 bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900">
              <div className="flex items-center gap-2 min-w-0">
                <Play className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-white text-sm font-medium truncate">
                  {previewData?.title || 'Önizleme'}
                </span>
                <span className="px-2 py-0.5 bg-teal-600/20 text-teal-300 border-0 text-xs rounded shrink-0">
                  Ücretsiz Önizleme
                </span>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video / Text Content */}
            {previewMutation.isPending ? (
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Ders yükleniyor...</p>
                </div>
              </div>
            ) : previewData?.videoUrl ? (
              <VideoPlayer
                src={previewData.videoUrl}
              />
            ) : previewData?.textContent ? (
              <div className="p-6 max-h-[70vh] overflow-y-auto bg-white">
                <div className="prose prose-gray max-w-none whitespace-pre-line text-gray-800">
                  {previewData.textContent}
                </div>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <p className="text-gray-400 text-sm">Bu ders için içerik bulunamadı</p>
              </div>
            )}

            {/* Modal Footer */}
            {!course.isEnrolled && !course.isOwnCourse && (
              <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-t border-gray-800">
                <p className="text-gray-400 text-sm">
                  Tüm derslere erişim için kursa kayıt olun
                </p>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white"
                  onClick={() => {
                    closePreview();
                    handleEnroll();
                  }}
                  disabled={isProcessing}
                >
                  {course.price === 0 ? 'Ücretsiz Kayıt Ol' : 'Satın Al'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
