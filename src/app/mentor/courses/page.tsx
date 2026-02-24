'use client';

import { useState, useMemo } from 'react';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { useRouter } from 'next/navigation';
import {
  Plus, Pencil, Trash2, Archive, Send, Loader2,
  BookOpen, Users, Star, Clock, PlayCircle,
  XCircle, RotateCw,
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
import { Pagination } from '@/components/ui/pagination';

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
    case CourseStatus.PendingReview:
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">İncelemede</Badge>;
    case CourseStatus.RevisionRequested:
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Revizyon İstendi</Badge>;
    case CourseStatus.Rejected:
      return <Badge className="bg-red-100 text-red-800 border-red-200">Reddedildi</Badge>;
    case CourseStatus.Published:
      return <Badge variant="success">Yayında</Badge>;
    case CourseStatus.Archived:
      return <Badge variant="secondary">Arşiv</Badge>;
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
  const [page, setPage] = useState(1);

  const { data: coursesData, isLoading } = useMyCourses(page);
  const courses = coursesData?.items;
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
      await publishMutation.mutateAsync({ id: course.id });
      toast.success('Kurs onaya gönderildi!');
    } catch {
      toast.error('Kurs onaya gönderilirken hata oluştu');
    }
  };

  const handleArchive = async (course: MentorCourseDto) => {
    try {
      await archiveMutation.mutateAsync(course.id);
      toast.success('Kurs arşivlendi');
    } catch {
      toast.error('Kurs arşivlenirken hata oluştu');
    }
  };

  const handleDelete = (course: MentorCourseDto) => {
    confirm({
      title: 'Kursu Sil',
      description: `"${course.title}" kursunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      variant: 'danger',
      confirmText: 'Sil',
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(course.id);
          toast.success('Kurs silindi');
        } catch {
          toast.error('Kurs silinirken hata oluştu');
        }
      },
    });
  };

  // ===== Tabs =====

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: CourseStatus.Draft, label: 'Taslak' },
    { key: CourseStatus.PendingReview, label: 'İncelemede' },
    { key: CourseStatus.RevisionRequested, label: 'Revizyon' },
    { key: CourseStatus.Published, label: 'Yayında' },
    { key: CourseStatus.Rejected, label: 'Reddedildi' },
    { key: CourseStatus.Archived, label: 'Arşiv' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <PlayCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Kurslarım</h1>
              <p className="text-xs text-gray-500">Video kurslarınızı yönetin</p>
            </div>
          </div>
          <Button size="sm" onClick={() => router.push(ROUTES.MENTOR_COURSE_NEW)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Yeni Kurs Oluştur
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          /* ══════ SKELETON ══════ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm animate-pulse overflow-hidden">
                <div className="h-28 bg-gray-200" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-3 bg-gray-100 rounded w-12" />
                    <div className="h-3 bg-gray-100 rounded w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          /* ══════ EMPTY STATE ══════ */
          <Card className="border border-dashed border-purple-200 bg-purple-50/30">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {activeTab === 'all'
                  ? 'Henüz kurs oluşturmadınız'
                  : `Bu kategoride kurs bulunamadı`}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Öğrencilerinize sunacağınız video kurslarını oluşturun.
              </p>
              {activeTab === 'all' && (
                <Button size="sm" className="text-xs" onClick={() => router.push(ROUTES.MENTOR_COURSE_NEW)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  İlk Kursunuzu Oluşturun
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* ══════ COURSE GRID ══════ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        {courses && courses.length > 0 && (
          <Pagination
            page={page}
            totalPages={coursesData?.totalPages ?? 1}
            totalCount={coursesData?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="kurs"
          />
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
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
      {/* Cover Image */}
      <div className="relative h-28 overflow-hidden">
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
            style={getCoverImageStyle(course.coverImagePosition, course.coverImageTransform)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white/60" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          {statusBadge(course.status)}
        </div>
      </div>

      <CardContent className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-sm text-gray-900 mb-0.5 line-clamp-2">{course.title}</h3>
        {course.shortDescription && (
          <p className="text-xs text-gray-500 line-clamp-1 mb-2">{course.shortDescription}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-0.5">
            <BookOpen className="w-3 h-3" />
            {course.totalLectures}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatDuration(course.totalDurationSec)}
          </span>
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {course.enrollmentCount}
          </span>
          {course.ratingAvg > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {course.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="text-sm font-bold text-teal-600 mb-3">
          {course.price > 0 ? `${course.price.toFixed(2)} ${course.currency}` : 'Ücretsiz'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 gap-1">
            <Pencil className="w-3.5 h-3.5" />
            Düzenle
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
                Onaya Gönder
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

          {course.status === CourseStatus.PendingReview && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              İnceleniyor
            </Badge>
          )}

          {course.status === CourseStatus.RevisionRequested && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="gap-1 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Düzenle & Gönder
            </Button>
          )}

          {course.status === CourseStatus.Rejected && (
            <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
              <XCircle className="w-3 h-3 mr-1" />
              Reddedildi
            </Badge>
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
              Arşivle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
