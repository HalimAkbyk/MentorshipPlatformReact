'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  BookOpen,
  FileText,
  Menu,
  X,
  GraduationCap,
  LayoutList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoursePlayer, useUpdateProgress, useCompleteLecture } from '@/lib/hooks/use-courses';
import VideoPlayer from '@/components/courses/video-player';
import NotesPanel from '@/components/courses/notes-panel';
import CurriculumSidebar from '@/components/courses/curriculum-sidebar';
import { ROUTES } from '@/lib/constants/routes';
import { LectureType } from '@/lib/types/enums';
import { toast } from 'sonner';

// ─── Progress Saving Strategy ───
// All events (pause, seek, timeUpdate, interval) feed into a single debounced save.
// This coalesces rapid events into ONE backend request.
//
// Event flow:
//   pause/seek/interval → scheduleProgressSave() → 3s debounce → single API call
//   lecture switch / unmount / beforeunload → flushProgressSave() → immediate API call
//
// Result: ~1 request per user interaction burst instead of N requests.

function CoursePlayerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const lectureIdFromQuery = searchParams.get('lectureId');
  const [selectedLectureId, setSelectedLectureId] = useState<string | undefined>(
    lectureIdFromQuery || undefined
  );

  const { data: playerData, isLoading } = useCoursePlayer(courseId, selectedLectureId);
  const updateProgress = useUpdateProgress();
  const completeLecture = useCompleteLecture();

  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // ─── Refs ───
  const currentTimeRef = useRef(0);
  const currentLectureIdRef = useRef<string | null>(null);
  const lastSavedTimeRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ lectureId: string; time: number } | null>(null);

  // Keep refs in sync
  useEffect(() => {
    currentTimeRef.current = currentTimeSec;
  }, [currentTimeSec]);

  useEffect(() => {
    currentLectureIdRef.current = playerData?.currentLecture?.id ?? null;
  }, [playerData?.currentLecture?.id]);

  // ─── Core: Debounced progress save ───
  const doSave = useCallback((lectureId: string, timeSec: number) => {
    const flooredTime = Math.floor(timeSec);
    if (flooredTime <= 0) return;
    if (flooredTime === Math.floor(lastSavedTimeRef.current)) return;

    updateProgress.mutate({
      lectureId,
      watchedSec: flooredTime,
      lastPositionSec: flooredTime,
    });
    lastSavedTimeRef.current = timeSec;
    pendingSaveRef.current = null;
  }, [updateProgress]);

  const scheduleProgressSave = useCallback((lectureId: string, timeSec: number) => {
    pendingSaveRef.current = { lectureId, time: timeSec };

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const pending = pendingSaveRef.current;
      if (pending) doSave(pending.lectureId, pending.time);
    }, 3000);
  }, [doSave]);

  const flushProgressSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (pending) doSave(pending.lectureId, pending.time);
  }, [doSave]);

  // ─── Fallback interval: save every 60s while playing ───
  useEffect(() => {
    if (!playerData?.currentLecture) return;
    const lectureId = playerData.currentLecture.id;

    const interval = setInterval(() => {
      const time = currentTimeRef.current;
      if (time > 0 && Math.abs(time - lastSavedTimeRef.current) > 3) {
        scheduleProgressSave(lectureId, time);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [playerData?.currentLecture?.id, scheduleProgressSave]);

  // ─── Save on page unload ───
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      const lectureId = currentLectureIdRef.current;
      const time = currentTimeRef.current;
      if (!lectureId || time <= 0) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mentorship-api-mentorship-90dbd57b.koyeb.app/api';
      const url = `${baseUrl}/course-enrollments/progress/${lectureId}`;
      const token = document.cookie.match(/accessToken=([^;]+)/)?.[1]
        || localStorage.getItem('accessToken');
      try {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            watchedSec: Math.floor(time),
            lastPositionSec: Math.floor(time),
          }),
          keepalive: true,
        });
      } catch {
        // Best effort
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ─── Flush on unmount ───
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      const lectureId = currentLectureIdRef.current;
      const time = currentTimeRef.current;
      if (lectureId && time > 0) {
        const flooredTime = Math.floor(time);
        if (flooredTime !== Math.floor(lastSavedTimeRef.current)) {
          updateProgress.mutate({
            lectureId,
            watchedSec: flooredTime,
            lastPositionSec: flooredTime,
          });
        }
      }
    };
  }, []);

  // ─── Video event handlers ───
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTimeSec(time);
  }, []);

  const handleVideoPause = useCallback((time: number) => {
    const lectureId = currentLectureIdRef.current;
    if (lectureId && time > 0) {
      scheduleProgressSave(lectureId, time);
    }
  }, [scheduleProgressSave]);

  const handleVideoSeeked = useCallback((time: number) => {
    const lectureId = currentLectureIdRef.current;
    if (lectureId && time > 0) {
      scheduleProgressSave(lectureId, time);
    }
  }, [scheduleProgressSave]);

  const handleVideoEnded = useCallback(() => {
    if (!playerData?.currentLecture) return;
    if (!playerData.currentLecture.isCompleted) {
      handleCompleteLecture();
    }
  }, [playerData?.currentLecture]);

  const handleCompleteLecture = async () => {
    if (!playerData?.currentLecture) return;
    try {
      await completeLecture.mutateAsync(playerData.currentLecture.id);
      toast.success('Ders tamamlandi olarak isaretlendi!');
    } catch {
      toast.error('Ders tamamlanirken bir hata olustu');
    }
  };

  // ─── Lecture switch ───
  const handleSelectLecture = (lectureId: string) => {
    flushProgressSave();

    setSelectedLectureId(lectureId);
    setCurrentTimeSec(0);
    setSeekTarget(null);
    lastSavedTimeRef.current = 0;
    currentTimeRef.current = 0;
    pendingSaveRef.current = null;
    setSidebarOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.set('lectureId', lectureId);
    window.history.replaceState({}, '', url.toString());
  };

  const canComplete =
    playerData?.currentLecture &&
    !playerData.currentLecture.isCompleted &&
    playerData.currentLecture.durationSec > 0 &&
    currentTimeSec >= playerData.currentLecture.durationSec * 0.9;

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-primary-800/30" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-400 animate-spin" />
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-wide">Ders yukleniyor...</p>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (!playerData || !playerData.currentLecture) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Kurs bulunamadi</h2>
          <p className="text-gray-500 text-sm mb-6">Kurs icerigi yuklenemedi veya erisim izniniz yok.</p>
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.STUDENT_COURSES)}
            className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kurslarima Don
          </Button>
        </div>
      </div>
    );
  }

  const { currentLecture, sections, courseTitle } = playerData;

  const lectureType = (currentLecture.type ?? '').toString();
  const isVideo = lectureType === LectureType.Video || lectureType === 'Video';
  const isText = lectureType === LectureType.Text || lectureType === 'Text';

  // Progress calculation
  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const completedLectures = sections.reduce(
    (sum, s) => sum + s.lectures.filter((l) => l.isCompleted).length,
    0
  );
  const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  return (
    <div className="h-screen bg-[#0f0f0f] flex flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="bg-[#141414] text-white px-4 lg:px-6 h-14 flex items-center justify-between shrink-0 z-20 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(ROUTES.STUDENT_COURSES)}
            className="text-gray-500 hover:text-white transition-all duration-200 p-2 -ml-2 rounded-lg hover:bg-white/[0.06]"
            title="Kurslarima Don"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </button>

          <div className="h-5 w-px bg-white/[0.08]" />

          <div className="min-w-0 flex items-center gap-3">
            <h1 className="text-[13px] font-medium text-gray-300 truncate max-w-md">
              {courseTitle}
            </h1>
            {/* Mini progress badge */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="w-20 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500 font-medium tabular-nums">
                %{progressPercent}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop sidebar toggle hint */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-500 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-white/[0.06]"
          >
            {sidebarOpen ? <X className="w-[18px] h-[18px]" /> : <LayoutList className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video + Info + Notes */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
          {/* Video Area */}
          <div className="bg-black">
            {isVideo && currentLecture.videoUrl ? (
              <VideoPlayer
                key={currentLecture.id}
                src={currentLecture.videoUrl}
                startTime={seekTarget ?? currentLecture.lastPositionSec ?? 0}
                onTimeUpdate={handleTimeUpdate}
                onPause={handleVideoPause}
                onSeeked={handleVideoSeeked}
                onEnded={handleVideoEnded}
              />
            ) : isText ? (
              <div className="bg-[#1a1a1a] p-8 lg:p-12 min-h-[400px]">
                <div className="max-w-3xl mx-auto">
                  <div className="prose prose-invert prose-gray max-w-none whitespace-pre-line text-gray-300 leading-relaxed">
                    {currentLecture.textContent || 'Icerik bulunamadi'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-[#1a1a1a] flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Video bulunamadi</p>
                </div>
              </div>
            )}
          </div>

          {/* Lecture Info + Notes */}
          <div className="max-w-4xl mx-auto">
            {/* Lecture Title Bar */}
            <div className="px-6 lg:px-8 py-5 border-b border-white/[0.06]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base lg:text-lg font-semibold text-white leading-snug">
                    {currentLecture.title}
                  </h2>
                  {currentLecture.description && (
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                      {currentLecture.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {currentLecture.isCompleted ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Tamamlandi</span>
                    </div>
                  ) : canComplete ? (
                    <Button
                      onClick={handleCompleteLecture}
                      disabled={completeLecture.isPending}
                      size="sm"
                      className="bg-primary-600 hover:bg-primary-500 text-white rounded-full px-4 h-9 text-xs font-medium shadow-lg shadow-primary-900/20 transition-all duration-200"
                    >
                      {completeLecture.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Tamamla
                    </Button>
                  ) : (
                    !currentLecture.isCompleted && isText && (
                      <Button
                        onClick={handleCompleteLecture}
                        disabled={completeLecture.isPending}
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-500 text-white rounded-full px-4 h-9 text-xs font-medium shadow-lg shadow-primary-900/20 transition-all duration-200"
                      >
                        {completeLecture.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Tamamla
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Notes Panel */}
            {isVideo && (
              <div className="px-6 lg:px-8 py-6">
                <NotesPanel
                  lectureId={currentLecture.id}
                  onSeek={(timestampSec) => {
                    setSeekTarget(timestampSec);
                    setTimeout(() => setSeekTarget(null), 500);
                  }}
                  currentTimeSec={currentTimeSec}
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Curriculum Sidebar (Desktop) ─── */}
        <div className="hidden lg:block w-80 xl:w-[340px] border-l border-white/[0.06] bg-[#141414] overflow-y-auto shrink-0">
          <CurriculumSidebar
            sections={sections}
            currentLectureId={currentLecture.id}
            onSelectLecture={handleSelectLecture}
          />
        </div>

        {/* ─── Mobile Sidebar Overlay ─── */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-[320px] bg-[#141414] z-40 lg:hidden overflow-y-auto shadow-2xl shadow-black/50 animate-slide-in-right">
              <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06]">
                <h3 className="font-semibold text-sm text-gray-300">Mufredat</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <CurriculumSidebar
                sections={sections}
                currentLectureId={currentLecture.id}
                onSelectLecture={handleSelectLecture}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CoursePlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-primary-800/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-400 animate-spin" />
            </div>
            <p className="text-gray-500 text-sm font-medium tracking-wide">Ders yukleniyor...</p>
          </div>
        </div>
      }
    >
      <CoursePlayerContent />
    </Suspense>
  );
}
