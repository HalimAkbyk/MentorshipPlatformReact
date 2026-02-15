'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Pencil, Trash2, Archive, Send, Loader2,
  BookOpen, Users, Star, Clock, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConfirm } from '@/lib/hooks/useConfirm';
import {
  useMyCourses,
  usePublishCourse,
  useArchiveCourse,
  useDeleteCourse,
} from '@/lib/hooks/use-courses';
import { CourseStatus } from '@/lib/types/enums';
import { ROUTES } from '@/lib/constants/routes';
import type { MentorCourseDto } from '@/lib/types/models';

// ==================== HELPERS ====================

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return `${hours}s ${minutes.toString().padStart(2, '0')}dk`;
  }
  return `${minutes}dk`;
}

function statusBadge(status: CourseStatus) {
  switch (status) {
    case CourseStatus.Draft:
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Taslak</Badge>;
    case CourseStatus.Published:
      return <Badge variant="success">Yayinda</Badge>;
    case CourseStatus.Archived:
      return <Badge variant="secondary">Arsiv</Badge>;
    default:
      return null;
  }
}

type FilterTab = 'all' | CourseStatus;

// ==================== MAIN PAGE ====================

export default function MentorCoursesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data: courses, isLoading } = useMyCourses();
  const publishMutation = usePublishCourse();
  const archiveMutation = useArchiveCourse();
  const deleteMutation = useDeleteCourse();

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (activeTab === 'all') return courses;
    return courses.filter((c) => c.status === activeTab);
  }, [courses, activeTab]);

  // ===== Actions =====

  const handlePublish = async (course: MentorCourseDto) => {
    try {
      await publishMutation.mutateAsync(course.id);
      toast.success('Kurs basariyla yayinlandi!');
    } catch {
      toast.error('Kurs yayinlanirken hata olustu');
    }
  };

  const handleArchive = async (course: MentorCourseDto) => {
    try {
      await archiveMutation.mutateAsync(course.id);
      toast.success('Kurs arsivlendi');
    } catch {
      toast.error('Kurs arsivlenirken hata olustu');
    }
  };

  const handleDelete = (course: MentorCourseDto) => {
    confirm({
      title: 'Kursu Sil',
      description: `"${course.title}" kursunu silmek istediginize emin misiniz? Bu islem geri alinamaz.`,
      variant: 'danger',
      confirmText: 'Sil',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(course.id);
          toast.success('Kurs silindi');
        } catch {
          toast.error('Kurs silinirken hata olustu');
        }
      },
    });
  };

  // ===== Tabs =====

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tumu' },
    { key: CourseStatus.Draft, label: 'Taslak' },
    { key: CourseStatus.Published, label: 'Yayinda' },
    { key: CourseStatus.Archived, label: 'Arsiv' },
  ];

  // ===== Loading State =====

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/mentor/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Kurslarim</h1>
              <p className="text-sm text-gray-500">Video kurslarinizi yonetin</p>
            </div>
          </div>
          <Button onClick={() => router.push(ROUTES.MENTOR_COURSE_NEW)} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Kurs Olustur
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg border p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === 'all'
                  ? 'Henuz kurs olusturmadiniz'
                  : `Bu kategoride kurs bulunamadi`}
              </h3>
              <p className="text-gray-500 mb-6">
                Ogrencilerinize sunacaginiz video kurslarini olusturun.
              </p>
              {activeTab === 'all' && (
                <Button onClick={() => router.push(ROUTES.MENTOR_COURSE_NEW)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ilk Kursunuzu Olusturun
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Course Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => router.push(ROUTES.MENTOR_COURSE_EDIT(course.id))}
                onPublish={() => handlePublish(course)}
                onArchive={() => handleArchive(course)}
                onDelete={() => handleDelete(course)}
                isPublishing={publishMutation.isPending}
                isArchiving={archiveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== COURSE CARD ====================

function CourseCard({
  course,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
  isPublishing,
  isArchiving,
}: {
  course: MentorCourseDto;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isPublishing: boolean;
  isArchiving: boolean;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="relative h-40 overflow-hidden">
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/60" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          {statusBadge(course.status)}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{course.title}</h3>
        {course.shortDescription && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{course.shortDescription}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.totalLectures} ders
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(course.totalDurationSec)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.enrollmentCount}
          </span>
          {course.ratingAvg > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              {course.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="text-lg font-bold text-primary-600 mb-4">
          {course.price > 0 ? `${course.price.toFixed(2)} ${course.currency}` : 'Ucretsiz'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 gap-1">
            <Pencil className="w-3.5 h-3.5" />
            Duzenle
          </Button>

          {course.status === CourseStatus.Draft && (
            <>
              <Button
                size="sm"
                onClick={onPublish}
                disabled={isPublishing}
                className="gap-1"
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Yayinla
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-red-500 hover:text-red-700 h-8 w-8"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {course.status === CourseStatus.Published && (
            <Button
              variant="outline"
              size="sm"
              onClick={onArchive}
              disabled={isArchiving}
              className="gap-1"
            >
              {isArchiving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
              Arsivle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
