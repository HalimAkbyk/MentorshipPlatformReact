'use client';

import { useState } from 'react';
import { useSessionPlanTemplates } from '@/lib/hooks/use-session-plans';
import { useCurriculumTemplates } from '@/lib/hooks/use-curriculum';
import { useAssignmentTemplates } from '@/lib/hooks/use-assignments';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import {
  FileText,
  ClipboardList,
  BookOpen,
  FileCheck,
  Calendar,
  FolderOpen,
} from 'lucide-react';

type TemplateType = 'all' | 'session-plan' | 'curriculum' | 'assignment';

const TABS: { label: string; value: TemplateType; icon: typeof FileText; color: string }[] = [
  { label: 'Tumu', value: 'all', icon: FolderOpen, color: 'bg-gray-600' },
  { label: 'Oturum Planlari', value: 'session-plan', icon: ClipboardList, color: 'bg-amber-600' },
  { label: 'Mufredatlar', value: 'curriculum', icon: BookOpen, color: 'bg-indigo-600' },
  { label: 'Odevler', value: 'assignment', icon: FileCheck, color: 'bg-emerald-600' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface UnifiedTemplate {
  id: string;
  title: string;
  type: 'session-plan' | 'curriculum' | 'assignment';
  typeLabel: string;
  description?: string;
  createdAt: string;
  meta: string;
}

export default function MentorTemplatesPage() {
  const [activeTab, setActiveTab] = useState<TemplateType>('all');

  const { data: spTemplates, isLoading: loadingSP } = useSessionPlanTemplates();
  const { data: curTemplates, isLoading: loadingCur } = useCurriculumTemplates();
  const { data: asgTemplates, isLoading: loadingAsg } = useAssignmentTemplates();

  const isLoading = loadingSP || loadingCur || loadingAsg;

  // Unify all templates
  const allTemplates: UnifiedTemplate[] = [];

  (spTemplates ?? []).forEach((t) => {
    allTemplates.push({
      id: t.id,
      title: t.title,
      type: 'session-plan',
      typeLabel: 'Oturum Plani',
      description: t.sessionObjective,
      createdAt: t.createdAt,
      meta: `${t.materialCount} materyal`,
    });
  });

  (curTemplates ?? []).forEach((t) => {
    allTemplates.push({
      id: t.id,
      title: t.title,
      type: 'curriculum',
      typeLabel: 'Mufredat',
      description: t.description,
      createdAt: t.createdAt,
      meta: [t.subject, t.level, `${t.totalWeeks} hafta`].filter(Boolean).join(' - '),
    });
  });

  (asgTemplates ?? []).forEach((t) => {
    allTemplates.push({
      id: t.id,
      title: t.title,
      type: 'assignment',
      typeLabel: 'Odev',
      description: undefined,
      createdAt: t.createdAt,
      meta: [t.assignmentType, t.difficultyLevel, t.maxScore ? `${t.maxScore} puan` : null].filter(Boolean).join(' - '),
    });
  });

  // Sort by creation date (newest first)
  allTemplates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter by tab
  const filtered = activeTab === 'all' ? allTemplates : allTemplates.filter((t) => t.type === activeTab);

  function getTypeIcon(type: string) {
    switch (type) {
      case 'session-plan': return <ClipboardList className="w-4 h-4 text-amber-600" />;
      case 'curriculum': return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'assignment': return <FileCheck className="w-4 h-4 text-emerald-600" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  }

  function getTypeBg(type: string) {
    switch (type) {
      case 'session-plan': return 'bg-amber-50';
      case 'curriculum': return 'bg-indigo-50';
      case 'assignment': return 'bg-emerald-50';
      default: return 'bg-gray-50';
    }
  }

  function getTypeBadgeColor(type: string) {
    switch (type) {
      case 'session-plan': return 'bg-amber-100 text-amber-700';
      case 'curriculum': return 'bg-indigo-100 text-indigo-700';
      case 'assignment': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Sablonlarim</h1>
          <p className="text-xs text-gray-500">Kaydedilmis sablonlarinizi goruntuleyın ve yonetin</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              activeTab === tab.value
                ? `${tab.color} text-white`
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.value !== 'all' && (
              <span className={cn(
                'text-[9px] px-1 py-0.5 rounded',
                activeTab === tab.value ? 'bg-white/20' : 'bg-gray-200/60'
              )}>
                {allTemplates.filter((t) => t.type === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((template) => (
            <Card key={`${template.type}-${template.id}`} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', getTypeBg(template.type))}>
                    {getTypeIcon(template.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">{template.title}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', getTypeBadgeColor(template.type))}>
                        {template.typeLabel}
                      </span>
                    </div>
                    {template.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{template.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      {template.meta && <span>{template.meta}</span>}
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(template.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-amber-200 bg-amber-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {activeTab === 'all' ? 'Henuz sablonunuz yok' : 'Bu kategoride sablon yok'}
            </h3>
            <p className="text-xs text-gray-500">
              Oturum planlarinizdan, mufredatlarinizdan veya odevlerinizden sablon olusturabilirsiniz.
              Detay sayfalarindaki &quot;Sablon Kaydet&quot; butonunu kullanin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
