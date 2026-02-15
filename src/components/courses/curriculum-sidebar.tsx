'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Play, FileText } from 'lucide-react';
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
  // Track which sections are expanded
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

  // Count total and completed lectures
  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const completedLectures = sections.reduce(
    (sum, s) => sum + s.lectures.filter((l) => l.isCompleted).length,
    0
  );

  return (
    <div className="bg-white rounded-lg border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 text-sm">Mufredat</h3>
        <p className="text-xs text-gray-500 mt-1">
          {completedLectures}/{totalLectures} ders tamamlandi
        </p>
        {/* Mini progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
            style={{
              width: totalLectures > 0 ? `${(completedLectures / totalLectures) * 100}%` : '0%',
            }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const sectionCompleted = section.lectures.every((l) => l.isCompleted);
          const sectionCompletedCount = section.lectures.filter((l) => l.isCompleted).length;

          return (
            <div key={section.id} className="border-b last:border-b-0">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {section.title}
                  </span>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {sectionCompletedCount}/{section.lectures.length}
                </span>
              </button>

              {/* Lectures */}
              {isExpanded && (
                <div className="bg-gray-50/50">
                  {section.lectures.map((lecture) => {
                    const isCurrent = lecture.id === currentLectureId;

                    return (
                      <button
                        key={lecture.id}
                        onClick={() => onSelectLecture(lecture.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isCurrent
                            ? 'bg-primary-50 border-l-2 border-primary-600'
                            : 'hover:bg-gray-100 border-l-2 border-transparent'
                        )}
                      >
                        {/* Status Icon */}
                        <div className="shrink-0">
                          {lecture.isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle
                              className={cn(
                                'w-4 h-4',
                                isCurrent ? 'text-primary-600' : 'text-gray-300'
                              )}
                            />
                          )}
                        </div>

                        {/* Lecture Info */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-xs truncate',
                              isCurrent ? 'text-primary-700 font-medium' : 'text-gray-700'
                            )}
                          >
                            {lecture.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {lecture.type === LectureType.Video ? (
                              <Play className="w-3 h-3 text-gray-400" />
                            ) : (
                              <FileText className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="text-[10px] text-gray-400">
                              {lecture.durationSec > 0
                                ? formatLectureDuration(lecture.durationSec)
                                : lecture.type === LectureType.Text
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
