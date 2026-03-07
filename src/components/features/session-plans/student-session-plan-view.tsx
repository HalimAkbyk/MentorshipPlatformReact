'use client';

import { useSessionPlanByBooking, useSessionPlanByGroupClass } from '@/lib/hooks/use-session-plans';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  FileText,
  Video,
  Link2,
  Image,
  File,
  Presentation,
  Sheet,
  Download,
  ExternalLink,
  BookOpen,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import type { SessionPlanMaterialDto } from '@/lib/api/session-plans';

interface StudentSessionPlanViewProps {
  bookingId?: string;
  groupClassId?: string;
}

function getFormatIcon(fileFormat: string) {
  switch (fileFormat) {
    case 'PDF':
      return <FileText className="w-4 h-4 text-red-500" />;
    case 'DOCX':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'PPTX':
      return <Presentation className="w-4 h-4 text-orange-500" />;
    case 'XLSX':
      return <Sheet className="w-4 h-4 text-green-600" />;
    case 'MP4':
    case 'MOV':
      return <Video className="w-4 h-4 text-purple-500" />;
    case 'PNG':
    case 'JPG':
      return <Image className="w-4 h-4 text-pink-500" />;
    case 'URL':
      return <Link2 className="w-4 h-4 text-cyan-600" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
}

function MaterialSection({ title, materials, icon: Icon }: {
  title: string;
  materials: SessionPlanMaterialDto[];
  icon: typeof BookOpen;
}) {
  if (materials.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        <Badge variant="outline" className="text-[9px] ml-1">{materials.length}</Badge>
      </div>
      <div className="space-y-1.5">
        {materials.map((mat) => (
          <div key={mat.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
              {getFormatIcon(mat.fileFormat)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {mat.libraryItemTitle}
              </div>
              {mat.note && (
                <div className="text-[10px] text-gray-400 truncate">{mat.note}</div>
              )}
            </div>
            {mat.fileUrl && (
              <a
                href={mat.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:underline flex-shrink-0"
              >
                {mat.fileFormat === 'URL' ? (
                  <>
                    <ExternalLink className="w-3 h-3" />
                    Ac
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Indir
                  </>
                )}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudentSessionPlanView({ bookingId, groupClassId }: StudentSessionPlanViewProps) {
  const bookingQuery = useSessionPlanByBooking(bookingId || '');
  const classQuery = useSessionPlanByGroupClass(groupClassId || '');

  const query = bookingId ? bookingQuery : classQuery;
  const plan = query.data;
  const isLoading = query.isLoading;

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!plan) return null;

  // Only show if the plan is shared or completed
  if (plan.status !== 'Shared' && plan.status !== 'Completed') return null;

  const isCompleted = plan.status === 'Completed';

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {plan.title || 'Oturum Plani'}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              isCompleted
                ? 'bg-green-50 text-green-600 border-green-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            {isCompleted ? 'Tamamlandi' : 'Paylasildi'}
          </Badge>
        </div>

        {/* Session Objective */}
        {plan.sessionObjective && (
          <div className="bg-teal-50 rounded-lg px-3 py-2">
            <div className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider mb-0.5">Hedef</div>
            <p className="text-sm text-teal-800">{plan.sessionObjective}</p>
          </div>
        )}

        {/* Pre-Session Note & Materials */}
        {plan.preSessionNote && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Seans Oncesi</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.preSessionNote}</p>
          </div>
        )}
        <MaterialSection title="Seans Oncesi Materyalleri" materials={plan.preMaterials} icon={BookOpen} />

        {/* During session materials */}
        <MaterialSection title="Seans Sirasi Materyalleri" materials={plan.duringMaterials} icon={ClipboardList} />

        {/* Agenda Items (if completed) */}
        {isCompleted && plan.agendaItems && plan.agendaItems.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gundem</div>
            <div className="space-y-1">
              {plan.agendaItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      item.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {item.completed && <CheckSquare className="w-3 h-3" />}
                  </div>
                  <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Post-Session Summary (if completed) */}
        {isCompleted && plan.postSessionSummary && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Seans Sonrasi Ozeti</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.postSessionSummary}</p>
          </div>
        )}
        {isCompleted && (
          <MaterialSection title="Seans Sonrasi Materyalleri" materials={plan.postMaterials} icon={CheckSquare} />
        )}
      </CardContent>
    </Card>
  );
}
