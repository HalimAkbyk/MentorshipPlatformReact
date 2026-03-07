'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useSessionPlanByBooking,
  useSessionPlanByGroupClass,
  useUpdateSessionNotes,
  useUpdateAgendaItems,
} from '@/lib/hooks/use-session-plans';
import {
  ClipboardList,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Check,
  BookOpen,
  Download,
  ExternalLink,
  Video,
  Link2,
  Image,
  File,
  Presentation,
  Sheet,
  Loader2,
  Target,
  StickyNote,
  CheckSquare,
} from 'lucide-react';
import type { SessionPlanDetailDto, SessionPlanMaterialDto } from '@/lib/api/session-plans';
import Link from 'next/link';

interface ClassroomPlanPanelProps {
  bookingId?: string;
  groupClassId?: string;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

function getFormatIcon(fileFormat: string) {
  switch (fileFormat) {
    case 'PDF':
      return <FileText className="w-3.5 h-3.5 text-red-500" />;
    case 'DOCX':
      return <FileText className="w-3.5 h-3.5 text-blue-500" />;
    case 'PPTX':
      return <Presentation className="w-3.5 h-3.5 text-orange-500" />;
    case 'XLSX':
      return <Sheet className="w-3.5 h-3.5 text-green-600" />;
    case 'MP4':
    case 'MOV':
      return <Video className="w-3.5 h-3.5 text-purple-500" />;
    case 'PNG':
    case 'JPG':
      return <Image className="w-3.5 h-3.5 text-pink-500" />;
    case 'URL':
      return <Link2 className="w-3.5 h-3.5 text-cyan-600" />;
    default:
      return <File className="w-3.5 h-3.5 text-gray-400" />;
  }
}

function MaterialList({ materials, label }: { materials: SessionPlanMaterialDto[]; label: string }) {
  if (materials.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="space-y-1">
        {materials.map((mat) => (
          <div key={mat.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-700/50">
            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0">
              {getFormatIcon(mat.fileFormat)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-200 truncate">{mat.libraryItemTitle}</div>
              {mat.note && <div className="text-[10px] text-gray-500 truncate">{mat.note}</div>}
            </div>
            {mat.fileUrl && (
              <a
                href={mat.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 flex-shrink-0"
              >
                {mat.fileFormat === 'URL' ? (
                  <ExternalLink className="w-3 h-3" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClassroomPlanPanel({
  bookingId,
  groupClassId,
  isOpen,
  onClose,
  readOnly = false,
}: ClassroomPlanPanelProps) {
  const bookingQuery = useSessionPlanByBooking(bookingId || '');
  const classQuery = useSessionPlanByGroupClass(groupClassId || '');

  const query = bookingId ? bookingQuery : classQuery;
  const plan = query.data;
  const isLoading = query.isLoading;

  const updateNotes = useUpdateSessionNotes();
  const updateAgenda = useUpdateAgendaItems();

  // Local state for debounced notes editing
  const [localNotes, setLocalNotes] = useState('');
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local notes when plan loads
  useEffect(() => {
    if (plan?.sessionNotes !== undefined) {
      setLocalNotes(plan.sessionNotes || '');
    }
  }, [plan?.sessionNotes]);

  // Debounced save for notes
  const handleNotesChange = useCallback(
    (value: string) => {
      setLocalNotes(value);
      if (!plan?.id) return;
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
      notesTimerRef.current = setTimeout(() => {
        updateNotes.mutate({ planId: plan.id, sessionNotes: value });
      }, 1000);
    },
    [plan?.id, updateNotes]
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, []);

  // Toggle agenda item
  const handleToggleAgenda = useCallback(
    (index: number) => {
      if (!plan?.id || !plan.agendaItems) return;
      const updated = plan.agendaItems.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item
      );
      updateAgenda.mutate({ planId: plan.id, agendaItems: updated });
    },
    [plan?.id, plan?.agendaItems, updateAgenda]
  );

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-semibold text-sm">Ders Plani</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && !plan && (
          <div className="px-4 py-8 text-center">
            <ClipboardList className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-3">Oturum plani yok</p>
            {!readOnly && bookingId && (
              <Link
                href={`/mentor/session-plans/create?bookingId=${bookingId}`}
                className="text-teal-400 hover:text-teal-300 text-sm underline"
              >
                Plan Olustur
              </Link>
            )}
            {!readOnly && groupClassId && (
              <Link
                href={`/mentor/session-plans/create?groupClassId=${groupClassId}`}
                className="text-teal-400 hover:text-teal-300 text-sm underline"
              >
                Plan Olustur
              </Link>
            )}
          </div>
        )}

        {!isLoading && plan && (
          <div className="px-4 py-3 space-y-4">
            {/* Title */}
            {plan.title && (
              <div>
                <h4 className="text-white font-medium text-sm">{plan.title}</h4>
              </div>
            )}

            {/* Session Objective */}
            {plan.sessionObjective && (
              <div className="bg-teal-900/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3 h-3 text-teal-400" />
                  <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                    Hedef
                  </span>
                </div>
                <p className="text-sm text-teal-200">{plan.sessionObjective}</p>
              </div>
            )}

            {/* Pre-Session Note */}
            {plan.preSessionNote && (
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Seans Oncesi Notu
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{plan.preSessionNote}</p>
              </div>
            )}

            {/* Pre-Session Materials */}
            <MaterialList materials={plan.preMaterials} label="Seans Oncesi Materyalleri" />

            {/* During-Session Materials */}
            <MaterialList materials={plan.duringMaterials} label="Seans Sirasi Materyalleri" />

            {/* Agenda Items */}
            {plan.agendaItems && plan.agendaItems.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckSquare className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Gundem
                  </span>
                </div>
                <div className="space-y-1">
                  {plan.agendaItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {readOnly ? (
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            item.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-500'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleToggleAgenda(i)}
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            item.completed
                              ? 'bg-green-500 border-green-500 hover:bg-green-600'
                              : 'border-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                      )}
                      <span
                        className={`text-sm ${
                          item.completed ? 'line-through text-gray-500' : 'text-gray-200'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session Notes (editable for mentor) */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <StickyNote className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Seans Notlari
                </span>
                {updateNotes.isPending && (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-500 ml-auto" />
                )}
              </div>
              {readOnly ? (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {plan.sessionNotes || 'Not eklenmedi.'}
                </p>
              ) : (
                <textarea
                  value={localNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Seans notlarinizi buraya yazin..."
                  rows={4}
                  className="w-full bg-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none placeholder-gray-500"
                />
              )}
            </div>

            {/* Post-Session Summary */}
            {plan.postSessionSummary && (
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Seans Sonrasi Ozeti
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{plan.postSessionSummary}</p>
              </div>
            )}

            {/* Post-Session Materials */}
            <MaterialList materials={plan.postMaterials} label="Seans Sonrasi Materyalleri" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Toggle button for the classroom controls bar */
export function PlanPanelToggleButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full w-11 h-11 flex items-center justify-center transition-colors ${
        isOpen
          ? 'bg-primary-600 text-white hover:bg-primary-700'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      title="Ders Plani"
    >
      <ClipboardList className="w-4 h-4" />
    </button>
  );
}
