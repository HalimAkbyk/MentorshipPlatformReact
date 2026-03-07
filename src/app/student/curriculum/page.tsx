'use client';

import { useState } from 'react';
import { useMyEnrollment, useMyProgress, useMyEnrolledCurriculums } from '@/lib/hooks/use-curriculum';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  CircleDot,
  FileText,
  Video,
  Link2,
  File,
  Calendar,
  GraduationCap,
  ExternalLink,
  BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CurriculumWeekDto, CurriculumTopicDto, EnrolledCurriculumDto } from '@/lib/api/curriculum';
import { curriculumApi } from '@/lib/api/curriculum';
import { useQuery } from '@tanstack/react-query';

function getMaterialIcon(itemType: string) {
  switch (itemType) {
    case 'Document': return <FileText className="w-3 h-3 text-blue-500" />;
    case 'Video': return <Video className="w-3 h-3 text-purple-500" />;
    case 'Link': return <Link2 className="w-3 h-3 text-cyan-500" />;
    default: return <File className="w-3 h-3 text-gray-400" />;
  }
}

function getTopicStatusIcon(status?: string) {
  switch (status) {
    case 'Completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'InProgress':
      return <CircleDot className="w-4 h-4 text-indigo-500" />;
    case 'Skipped':
      return <Circle className="w-4 h-4 text-amber-400" />;
    default:
      return <Circle className="w-4 h-4 text-gray-300" />;
  }
}

function getTopicStatusLabel(status?: string) {
  switch (status) {
    case 'Completed': return 'Tamamlandi';
    case 'InProgress': return 'Devam Ediyor';
    case 'Skipped': return 'Atlandi';
    default: return 'Baslanmadi';
  }
}

function getProgressColor(pct: number) {
  if (pct >= 80) return 'from-green-500 to-emerald-500';
  if (pct >= 50) return 'from-indigo-500 to-teal-500';
  if (pct >= 20) return 'from-amber-500 to-orange-500';
  return 'from-gray-400 to-gray-500';
}

export default function StudentCurriculumPage() {
  const { data: curriculum, isLoading: loadingCurriculum } = useMyEnrollment();
  const { data: progress, isLoading: loadingProgress } = useMyProgress();
  const { data: enrolledCurriculums, isLoading: loadingEnrolled } = useMyEnrolledCurriculums();

  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  // If user selects a specific curriculum from the list, load its detail
  const { data: selectedCurriculum } = useQuery({
    queryKey: ['curriculum', selectedCurriculumId],
    queryFn: () => curriculumApi.getById(selectedCurriculumId!),
    enabled: !!selectedCurriculumId,
  });

  const { data: selectedProgress } = useQuery({
    queryKey: ['my-curriculum-progress-specific', selectedCurriculumId],
    queryFn: () => curriculumApi.getMyProgress(),
    enabled: !!selectedCurriculumId,
  });

  const toggleWeek = (weekId: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const isLoading = loadingCurriculum || loadingProgress || loadingEnrolled;

  // Build a map of topicId -> progress status
  const activeProgress = selectedCurriculumId ? selectedProgress : progress;
  const activeCurriculum = selectedCurriculumId ? selectedCurriculum : curriculum;

  const topicProgressMap = new Map<string, { status: string; completedAt?: string; mentorNote?: string }>();
  if (activeProgress?.topicProgresses) {
    for (const tp of activeProgress.topicProgresses) {
      topicProgressMap.set(tp.topicId, tp);
    }
  }

  const completionPercentage = activeProgress?.completionPercentage ?? 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show enrolled curriculums list if multiple
  const enrollments = enrolledCurriculums ?? [];
  const hasMultiple = enrollments.length > 1;

  if (!curriculum && enrollments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Henuz bir mufredatiniz yok
            </h3>
            <p className="text-xs text-gray-500">
              Egitmeniniz size bir mufredat atadiktan sonra buradan takip edebilirsiniz
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If selectedCurriculumId is set, show detail view with back button
  if (selectedCurriculumId && activeCurriculum) {
    const sortedWeeks = [...(activeCurriculum.weeks || [])].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {hasMultiple && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedCurriculumId(null); setOpenWeeks(new Set()); }}
            className="mb-3 text-xs text-gray-500"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Tum Mufredatlar
          </Button>
        )}

        <CurriculumDetail
          curriculum={activeCurriculum}
          completionPercentage={completionPercentage}
          progressStatus={activeProgress?.status}
          topicProgressMap={topicProgressMap}
          openWeeks={openWeeks}
          toggleWeek={toggleWeek}
        />
      </div>
    );
  }

  // If multiple enrollments, show a list with progress cards
  if (hasMultiple) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mufredatlarim</h1>
            <p className="text-xs text-gray-500">Kayitli oldugunuz mufredatlar ve ilerlemeniz</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {enrollments.map((enrollment) => (
            <Card
              key={enrollment.enrollmentId}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setSelectedCurriculumId(enrollment.curriculumId);
                setOpenWeeks(new Set());
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{enrollment.curriculumTitle}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {enrollment.subject && (
                        <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                          {enrollment.subject}
                        </span>
                      )}
                      {enrollment.level && (
                        <span className="text-[10px] font-medium bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
                          {enrollment.level}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{enrollment.totalWeeks} hafta</span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-indigo-600 ml-2">
                    {Math.round(enrollment.completionPercentage)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressColor(enrollment.completionPercentage)} rounded-full transition-all duration-500`}
                    style={{ width: `${enrollment.completionPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    enrollment.status === 'Active' ? 'bg-green-50 text-green-700' :
                    enrollment.status === 'Completed' ? 'bg-indigo-50 text-indigo-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {enrollment.status === 'Active' ? 'Aktif' :
                     enrollment.status === 'Completed' ? 'Tamamlandi' : enrollment.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(enrollment.startedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Single enrollment: show directly (original behavior)
  if (!activeCurriculum) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <CurriculumDetail
        curriculum={activeCurriculum}
        completionPercentage={completionPercentage}
        progressStatus={activeProgress?.status}
        topicProgressMap={topicProgressMap}
        openWeeks={openWeeks}
        toggleWeek={toggleWeek}
      />
    </div>
  );
}

function CurriculumDetail({
  curriculum,
  completionPercentage,
  progressStatus,
  topicProgressMap,
  openWeeks,
  toggleWeek,
}: {
  curriculum: any;
  completionPercentage: number;
  progressStatus?: string;
  topicProgressMap: Map<string, { status: string; completedAt?: string; mentorNote?: string }>;
  openWeeks: Set<string>;
  toggleWeek: (weekId: string) => void;
}) {
  const sortedWeeks = [...(curriculum.weeks || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{curriculum.title}</h1>
          {curriculum.description && (
            <p className="text-xs text-gray-500 truncate">{curriculum.description}</p>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {curriculum.subject && (
          <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
            {curriculum.subject}
          </span>
        )}
        {curriculum.level && (
          <span className="text-[10px] font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
            {curriculum.level}
          </span>
        )}
        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
          <Calendar className="w-3 h-3" />
          {curriculum.totalWeeks} hafta
        </span>
        {curriculum.estimatedHoursPerWeek && (
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            Haftalik ~{curriculum.estimatedHoursPerWeek} saat
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <Card className="border-0 shadow-sm mb-5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Genel Ilerleme</span>
            <span className="text-sm font-bold text-indigo-600">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor(completionPercentage)} rounded-full transition-all duration-500`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {progressStatus && (
            <div className="mt-2 text-[10px] text-gray-400">
              Durum: {progressStatus === 'Active' ? 'Aktif' : progressStatus === 'Completed' ? 'Tamamlandi' : progressStatus}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weeks */}
      <div className="space-y-2">
        {sortedWeeks.map((week: any) => {
          const isOpen = openWeeks.has(week.id);
          const sortedTopics = [...(week.topics || [])].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
          const completedCount = sortedTopics.filter(
            (t: any) => topicProgressMap.get(t.id)?.status === 'Completed'
          ).length;
          const weekProgress = sortedTopics.length > 0 ? (completedCount / sortedTopics.length) * 100 : 0;

          return (
            <Card key={week.id} className="border-0 shadow-sm">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleWeek(week.id)}
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5">
                    Hafta {week.weekNumber}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">{week.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getProgressColor(weekProgress)} rounded-full`}
                      style={{ width: `${weekProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {completedCount}/{sortedTopics.length}
                  </span>
                </div>
              </div>

              {isOpen && (
                <CardContent className="px-4 pb-4 pt-0">
                  {week.description && (
                    <p className="text-xs text-gray-500 mb-3 ml-7">{week.description}</p>
                  )}

                  <div className="space-y-2 ml-7">
                    {sortedTopics.map((topic: any) => {
                      const tp = topicProgressMap.get(topic.id);
                      return (
                        <div key={topic.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            {getTopicStatusIcon(tp?.status)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-800">{topic.title}</span>
                                {topic.estimatedMinutes && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {topic.estimatedMinutes} dk
                                  </span>
                                )}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                  tp?.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                  tp?.status === 'InProgress' ? 'bg-indigo-50 text-indigo-700' :
                                  tp?.status === 'Skipped' ? 'bg-amber-50 text-amber-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {getTopicStatusLabel(tp?.status)}
                                </span>
                              </div>
                              {topic.description && (
                                <p className="text-[11px] text-gray-500 mt-0.5">{topic.description}</p>
                              )}
                              {topic.objectiveText && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Target className="w-3 h-3 text-indigo-500" />
                                  <span className="text-[10px] text-indigo-600">{topic.objectiveText}</span>
                                </div>
                              )}
                              {tp?.mentorNote && (
                                <div className="mt-1 text-[10px] text-teal-700 bg-teal-50 rounded px-2 py-1">
                                  Egitmen notu: {tp.mentorNote}
                                </div>
                              )}

                              {/* Materials */}
                              {topic.materials && topic.materials.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {topic.materials.map((mat: any) => (
                                    <div
                                      key={mat.libraryItemId}
                                      className="flex items-center gap-2 text-[11px] text-gray-600 hover:text-indigo-600 cursor-pointer"
                                    >
                                      {getMaterialIcon(mat.itemType)}
                                      <span className="truncate">{mat.title}</span>
                                      <span className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                                        {mat.materialRole === 'Primary' ? 'Ana' :
                                         mat.materialRole === 'Supplementary' ? 'Ek' :
                                         mat.materialRole === 'Homework' ? 'Odev' : mat.materialRole}
                                      </span>
                                      <ExternalLink className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedWeeks.length === 0 && (
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30 mt-4">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Mufredat icerigi henuz hazir degil</h3>
            <p className="text-xs text-gray-500">Egitmeniniz icerigi hazirlayinca burada gorunecek</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
