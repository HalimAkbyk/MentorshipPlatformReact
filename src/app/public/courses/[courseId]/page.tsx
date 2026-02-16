'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCourseDetail, useEnrollInCourse } from '@/lib/hooks/use-courses';
import { ROUTES } from '@/lib/constants/routes';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { CourseLevel, LectureType } from '@/lib/types/enums';
import { toast } from 'sonner';

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
    case CourseLevel.Beginner: return 'Baslangic';
    case CourseLevel.Intermediate: return 'Orta';
    case CourseLevel.Advanced: return 'Ileri';
    case CourseLevel.AllLevels: return 'Tum Seviyeler';
    default: return level;
  }
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { data: course, isLoading } = useCourseDetail(courseId);
  const enrollMutation = useEnrollInCourse();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

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

    try {
      const result = await enrollMutation.mutateAsync(course.id);
      toast.success('Kursa basariyla kayit oldunuz!');

      if (course.price === 0) {
        router.push(ROUTES.COURSE_PLAYER(course.id));
      } else {
        // Navigate to payment flow with enrollment id
        router.push(`/student/payments/course?enrollmentId=${result.enrollmentId}&courseId=${course.id}`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Kayit sirasinda bir hata olustu');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton Hero */}
        <div className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl animate-pulse space-y-4">
              <div className="h-8 bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-700 rounded w-1/2" />
              <div className="flex gap-4">
                <div className="h-6 bg-gray-700 rounded w-24" />
                <div className="h-6 bg-gray-700 rounded w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg" />
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
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Kurs bulunamadi</h2>
          <Button variant="outline" onClick={() => router.push(ROUTES.COURSE_CATALOG)}>
            Kataloga Don
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
        className="relative bg-gray-900 text-white py-12"
        style={
          course.coverImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url(${course.coverImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            {course.category && (
              <Badge variant="secondary" className="mb-3">
                {course.category}
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.title}</h1>
            {course.shortDescription && (
              <p className="text-lg text-gray-300 mb-4">{course.shortDescription}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-amber-400">
                  {(course.ratingAvg ?? 0).toFixed(1)}
                </span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-gray-400">
                  ({course.ratingCount} degerlendirme)
                </span>
              </div>
              {/* Enrollment count */}
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-4 h-4" />
                {course.enrollmentCount} ogrenci
              </div>
              {/* Level */}
              <Badge variant="outline" className="text-white border-gray-500">
                {getLevelLabel(course.level)}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={course.mentorAvatar} />
                <AvatarFallback>{(course.mentorName ?? '').charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-300">
                Egitmen: <span className="text-white font-medium">{course.mentorName}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b mb-6">
              {[
                { key: 'overview' as Tab, label: 'Genel Bakis' },
                { key: 'curriculum' as Tab, label: 'Mufredat' },
                { key: 'instructor' as Tab, label: 'Egitmen' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Description */}
                {course.description && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Kurs Hakkinda</h2>
                    <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-line">
                      {course.description}
                    </div>
                  </div>
                )}

                {/* What you will learn */}
                {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Neler Ogreneceksiniz</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {course.whatYouWillLearn.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {course.requirements && course.requirements.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Gereksinimler</h2>
                    <ul className="space-y-2">
                      {course.requirements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0 mt-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Target Audience */}
                {course.targetAudience && course.targetAudience.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Hedef Kitle</h2>
                    <ul className="space-y-2">
                      {course.targetAudience.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0 mt-2" />
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
                    {sections.length} bolum - {totalLectures} ders -{' '}
                    {formatDuration(course.totalDurationSec)} toplam sure
                  </p>
                  <button
                    onClick={() => {
                      if (expandedSections.size === sections.length) {
                        setExpandedSections(new Set());
                      } else {
                        setExpandedSections(new Set(sections.map((s) => s.id)));
                      }
                    }}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {expandedSections.size === sections.length
                      ? 'Tumu Kapat'
                      : 'Tumu Ac'}
                  </button>
                </div>

                {sections.map((section) => (
                  <div key={section.id} className="border rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has(section.id) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">{section.title}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {section.lectures.length} ders
                      </span>
                    </button>

                    {expandedSections.has(section.id) && (
                      <div className="border-t">
                        {section.lectures.map((lecture) => (
                          <div
                            key={lecture.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              {lecture.isPreview ? (
                                <Play className="w-4 h-4 text-primary-600" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-700">{lecture.title}</span>
                              {lecture.isPreview && (
                                <Badge variant="outline" className="text-xs">
                                  Ucretsiz Onizleme
                                </Badge>
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
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={course.mentorAvatar} />
                    <AvatarFallback className="text-2xl">
                      {(course.mentorName ?? '').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{course.mentorName}</h2>
                    {course.mentorBio && (
                      <p className="text-gray-600 mt-3 whitespace-pre-line">
                        {course.mentorBio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-lg border shadow-sm overflow-hidden">
              {/* Sidebar Cover */}
              {course.coverImageUrl && (
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="p-6 space-y-5">
                {/* Price */}
                <div className="text-3xl font-bold text-gray-900">
                  {course.price === 0 ? (
                    <span className="text-green-600">Ucretsiz</span>
                  ) : (
                    formatCurrency(course.price, course.currency)
                  )}
                </div>

                {/* Enroll / Continue Button */}
                {course.isEnrolled ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => router.push(ROUTES.COURSE_PLAYER(course.id))}
                  >
                    Kursa Devam Et
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kayit Yapiliyor...
                      </>
                    ) : (
                      'Kayit Ol'
                    )}
                  </Button>
                )}

                {/* Course Stats */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Toplam Ders
                    </span>
                    <span className="font-medium">{course.totalLectures}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Toplam Sure
                    </span>
                    <span className="font-medium">{formatDuration(course.totalDurationSec)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Seviye
                    </span>
                    <span className="font-medium">{getLevelLabel(course.level)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Dil
                    </span>
                    <span className="font-medium">{course.language || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Ogrenci Sayisi
                    </span>
                    <span className="font-medium">{course.enrollmentCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
