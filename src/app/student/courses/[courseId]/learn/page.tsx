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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoursePlayer, useUpdateProgress, useCompleteLecture } from '@/lib/hooks/use-courses';
import VideoPlayer from '@/components/courses/video-player';
import NotesPanel from '@/components/courses/notes-panel';
import CurriculumSidebar from '@/components/courses/curriculum-sidebar';
import { ROUTES } from '@/lib/constants/routes';
import { LectureType } from '@/lib/types/enums';
import { toast } from 'sonner';

function CoursePlayerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  // Selected lecture: from query param or managed by state
  const lectureIdFromQuery = searchParams.get('lectureId');
  const [selectedLectureId, setSelectedLectureId] = useState<string | undefined>(
    lectureIdFromQuery || undefined
  );

  const { data: playerData, isLoading } = useCoursePlayer(courseId, selectedLectureId);
  const updateProgress = useUpdateProgress();
  const completeLecture = useCompleteLecture();

  // Track current video time for notes
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Progress saving refs
  const lastSavedTimeRef = useRef(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef(0);
  const currentLectureIdRef = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => {
    currentTimeRef.current = currentTimeSec;
  }, [currentTimeSec]);

  useEffect(() => {
    currentLectureIdRef.current = playerData?.currentLecture?.id ?? null;
  }, [playerData?.currentLecture?.id]);

  // Helper: save progress to backend
  const saveProgress = useCallback((lectureId: string, timeSec: number) => {
    if (timeSec <= 0) return;
    const flooredTime = Math.floor(timeSec);
    // Skip if same as last saved
    if (flooredTime === Math.floor(lastSavedTimeRef.current)) return;
    updateProgress.mutate({
      lectureId,
      watchedSec: flooredTime,
      lastPositionSec: flooredTime,
    });
    lastSavedTimeRef.current = timeSec;
  }, [updateProgress]);

  // Auto-save progress every 15 seconds (while playing)
  useEffect(() => {
    if (!playerData?.currentLecture) return;
    const lectureId = playerData.currentLecture.id;

    progressIntervalRef.current = setInterval(() => {
      const currentTime = currentTimeRef.current;
      if (currentTime > 0 && Math.abs(currentTime - lastSavedTimeRef.current) > 2) {
        saveProgress(lectureId, currentTime);
      }
    }, 15000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [playerData?.currentLecture?.id, saveProgress]);

  // Save progress on page unload (browser close, refresh, navigate away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const lectureId = currentLectureIdRef.current;
      const time = currentTimeRef.current;
      if (lectureId && time > 0) {
        // Use fetch with keepalive for reliable save during page unload (supports auth headers)
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
          // Swallow — best effort
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Save on component unmount (lecture switch)
  useEffect(() => {
    return () => {
      const lectureId = currentLectureIdRef.current;
      const time = currentTimeRef.current;
      if (lectureId && time > 0) {
        saveProgress(lectureId, time);
      }
    };
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTimeSec(time);
  }, []);

  // Save immediately when user pauses or seeks
  const handleVideoPause = useCallback((time: number) => {
    const lectureId = currentLectureIdRef.current;
    if (lectureId && time > 0) {
      saveProgress(lectureId, time);
    }
  }, [saveProgress]);

  const handleVideoSeeked = useCallback((time: number) => {
    const lectureId = currentLectureIdRef.current;
    if (lectureId && time > 0) {
      saveProgress(lectureId, time);
    }
  }, [saveProgress]);

  const handleVideoEnded = useCallback(() => {
    if (!playerData?.currentLecture) return;
    // Auto-complete if not already completed
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

  const handleSelectLecture = (lectureId: string) => {
    // Clear interval FIRST to prevent concurrent progress saves
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Save current progress before switching
    if (playerData?.currentLecture && currentTimeRef.current > 0) {
      updateProgress.mutate({
        lectureId: playerData.currentLecture.id,
        watchedSec: Math.floor(currentTimeRef.current),
        lastPositionSec: Math.floor(currentTimeRef.current),
      });
    }

    setSelectedLectureId(lectureId);
    setCurrentTimeSec(0);
    setSeekTarget(null);
    lastSavedTimeRef.current = 0;
    currentTimeRef.current = 0;
    setSidebarOpen(false);

    // Update URL without full navigation
    const url = new URL(window.location.href);
    url.searchParams.set('lectureId', lectureId);
    window.history.replaceState({}, '', url.toString());
  };

  const handleSeekToTime = useCallback((timestampSec: number) => {
    setSeekTarget(timestampSec);
  }, []);

  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // Determine if completion button should show
  const canComplete =
    playerData?.currentLecture &&
    !playerData.currentLecture.isCompleted &&
    playerData.currentLecture.durationSec > 0 &&
    currentTimeSec >= playerData.currentLecture.durationSec * 0.9;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Kurs yukleniyor...</p>
        </div>
      </div>
    );
  }

  if (!playerData || !playerData.currentLecture) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Kurs bulunamadi</h2>
          <p className="text-gray-500 mb-4">Kurs icerigi yuklenemedi veya erisim izniniz yok.</p>
          <Button variant="outline" onClick={() => router.push(ROUTES.STUDENT_COURSES)}>
            Kurslarima Don
          </Button>
        </div>
      </div>
    );
  }

  const { currentLecture, sections, courseTitle } = playerData;

  // Normalize lecture type comparison (backend may return string "Video" or "Text")
  const lectureType = (currentLecture.type ?? '').toString();
  const isVideo = lectureType === LectureType.Video || lectureType === 'Video';
  const isText = lectureType === LectureType.Text || lectureType === 'Text';

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-gray-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0 z-20 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(ROUTES.STUDENT_COURSES)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
            title="Kurslarima Don"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-gray-700" />
          <h1 className="text-sm font-medium truncate max-w-lg">{courseTitle}</h1>
        </div>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-gray-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video + Notes (~70%) */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* Video Player or Text Content */}
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
                <div className="bg-white p-8 min-h-[400px]">
                  <div className="prose prose-gray max-w-none whitespace-pre-line">
                    {currentLecture.textContent || 'Icerik bulunamadi'}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2" />
                    <p>Video bulunamadi</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lecture Info */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentLecture.title}</h2>
                  {currentLecture.description && (
                    <p className="text-sm text-gray-600 mt-1">{currentLecture.description}</p>
                  )}
                </div>

                {/* Complete Button */}
                {currentLecture.isCompleted ? (
                  <div className="flex items-center gap-1.5 text-green-600 shrink-0">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Tamamlandi</span>
                  </div>
                ) : canComplete ? (
                  <Button
                    onClick={handleCompleteLecture}
                    disabled={completeLecture.isPending}
                    className="shrink-0"
                  >
                    {completeLecture.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Tamamla
                  </Button>
                ) : (
                  !currentLecture.isCompleted && isText && (
                    <Button
                      onClick={handleCompleteLecture}
                      disabled={completeLecture.isPending}
                      className="shrink-0"
                    >
                      {completeLecture.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Tamamla
                    </Button>
                  )
                )}
              </div>

              {/* Notes Panel (below video) */}
              {isVideo && (
                <NotesPanel
                  lectureId={currentLecture.id}
                  onSeek={(timestampSec) => {
                    setSeekTarget(timestampSec);
                    // Reset seek target after a short delay so the same timestamp can be clicked again
                    setTimeout(() => setSeekTarget(null), 500);
                  }}
                  currentTimeSec={currentTimeSec}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Curriculum Sidebar (~30%) */}
        {/* Desktop */}
        <div className="hidden lg:block w-80 xl:w-96 border-l bg-white overflow-y-auto shrink-0">
          <CurriculumSidebar
            sections={sections}
            currentLectureId={currentLecture.id}
            onSelectLecture={handleSelectLecture}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-80 bg-white z-40 lg:hidden overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">Mufredat</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Kurs yukleniyor...</p>
          </div>
        </div>
      }
    >
      <CoursePlayerContent />
    </Suspense>
  );
}
