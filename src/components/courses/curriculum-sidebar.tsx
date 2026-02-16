'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Circle, Play, FileText, Lock } from 'lucide-react';
import type { CoursePlayerSectionDto } from '@/lib/types/models';
import { LectureType } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';

interface CurriculumSidebarProps {
  sections: CoursePlayerSectionDto[];
  currentLectureId: string;
  onSelectLecture: (lectureId: string) => void;
}

function formatLectureDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CurriculumSidebar({
  sections,
  currentLectureId,
  onSelectLecture,
}: CurriculumSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-expand the section containing the current lecture
  useEffect(() => {
    if (!currentLectureId) return;

    for (const section of sections) {
      const hasCurrentLecture = section.lectures.some((l) => l.id === currentLectureId);
      if (hasCurrentLecture) {
        setExpandedSections((prev) => {
          const next = new Set(prev);
          next.add(section.id);
          return next;
        });
        break;
      }
    }
  }, [currentLectureId, sections]);

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

  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const completedLectures = sections.reduce(
    (sum, s) => sum + s.lectures.filter((l) => l.isCompleted).length,
    0
  );
  const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[13px] text-gray-200 tracking-wide uppercase">
            Mufredat
          </h3>
          <span className="text-[11px] text-gray-500 font-medium tabular-nums">
            {completedLectures}/{totalLectures}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-600 mt-1.5 font-medium">
          %{progressPercent} tamamlandi
        </p>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section, sectionIndex) => {
          const isExpanded = expandedSections.has(section.id);
          const sectionCompletedCount = section.lectures.filter((l) => l.isCompleted).length;
          const allCompleted = sectionCompletedCount === section.lectures.length && section.lectures.length > 0;

          return (
            <div key={section.id} className="border-b border-white/[0.04] last:border-b-0">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
                      Bolum {sectionIndex + 1}
                    </span>
                    <span className="text-[13px] font-medium text-gray-300 truncate block mt-0.5 group-hover:text-white transition-colors">
                      {section.title}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {allCompleted && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  <span className="text-[10px] text-gray-600 font-medium tabular-nums">
                    {sectionCompletedCount}/{section.lectures.length}
                  </span>
                </div>
              </button>

              {/* Lectures */}
              {isExpanded && (
                <div className="pb-1">
                  {section.lectures.map((lecture, lectureIndex) => {
                    const isCurrent = lecture.id === currentLectureId;
                    const isVideoType = lecture.type === LectureType.Video || lecture.type === 'Video';

                    return (
                      <button
                        key={lecture.id}
                        onClick={() => onSelectLecture(lecture.id)}
                        className={cn(
                          'w-full flex items-center gap-3 pl-10 pr-5 py-2.5 text-left transition-all duration-150 group/lecture relative',
                          isCurrent
                            ? 'bg-primary-600/10'
                            : 'hover:bg-white/[0.03]'
                        )}
                      >
                        {/* Active indicator */}
                        {isCurrent && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-primary-500" />
                        )}

                        {/* Status Icon */}
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {lecture.isCompleted ? (
                            <CheckCircle className="w-[18px] h-[18px] text-emerald-500" />
                          ) : isCurrent ? (
                            <div className="w-[18px] h-[18px] rounded-full border-2 border-primary-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                            </div>
                          ) : (
                            <Circle className="w-[18px] h-[18px] text-gray-700" />
                          )}
                        </div>

                        {/* Lecture Info */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-[12.5px] truncate leading-snug transition-colors',
                              isCurrent
                                ? 'text-primary-300 font-medium'
                                : 'text-gray-400 group-hover/lecture:text-gray-300'
                            )}
                          >
                            {lecture.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isVideoType ? (
                              <Play className="w-2.5 h-2.5 text-gray-600" />
                            ) : (
                              <FileText className="w-2.5 h-2.5 text-gray-600" />
                            )}
                            <span className="text-[10px] text-gray-600 font-medium">
                              {lecture.durationSec > 0
                                ? formatLectureDuration(lecture.durationSec)
                                : lecture.type === LectureType.Text || lecture.type === 'Text'
                                ? 'Metin'
                                : '--:--'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
