'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useCurriculum,
  useUpdateCurriculum,
  usePublishCurriculum,
  useAddWeek,
  useUpdateWeek,
  useDeleteWeek,
  useAddTopic,
  useUpdateTopic,
  useDeleteTopic,
  useAddTopicMaterial,
  useRemoveTopicMaterial,
  useAssignCurriculum,
} from '@/lib/hooks/use-curriculum';
import { useLibraryItems } from '@/lib/hooks/use-library';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { CurriculumWeekDto, CurriculumTopicDto, TopicMaterialDto } from '@/lib/api/curriculum';
import type { LibraryItemDto } from '@/lib/api/library';
import {
  ArrowLeft,
  BookOpen,
  Send,
  Archive,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Clock,
  Target,
  Paperclip,
  X,
  UserPlus,
  FileText,
  Video,
  Link2,
  File,
  Check,
  Calendar,
} from 'lucide-react';

// ── Helpers ──

function getStatusBadge(status: string) {
  switch (status) {
    case 'Draft':
      return <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">Taslak</Badge>;
    case 'Published':
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Yayinda</Badge>;
    case 'Archived':
      return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Arsiv</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function getMaterialIcon(itemType: string) {
  switch (itemType) {
    case 'Document': return <FileText className="w-3.5 h-3.5 text-blue-500" />;
    case 'Video': return <Video className="w-3.5 h-3.5 text-purple-500" />;
    case 'Link': return <Link2 className="w-3.5 h-3.5 text-cyan-500" />;
    default: return <File className="w-3.5 h-3.5 text-gray-400" />;
  }
}

const MATERIAL_ROLES = [
  { label: 'Ana Materyal', value: 'Primary' },
  { label: 'Ek Kaynak', value: 'Supplementary' },
  { label: 'Odev', value: 'Homework' },
  { label: 'Referans', value: 'Reference' },
];

// ── Add Week Dialog ──

function AddWeekDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Yeni Hafta Ekle</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Baslik</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ornegin: Temel Kavramlar"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Aciklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hafta aciklamasi..."
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={onClose}>Iptal</Button>
            <Button
              size="sm"
              disabled={!title.trim() || isPending}
              onClick={() => { onSubmit(title.trim(), description.trim()); setTitle(''); setDescription(''); }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Add Topic Dialog ──

function AddTopicDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; estimatedMinutes: number; objectiveText: string }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [objectiveText, setObjectiveText] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Yeni Konu Ekle</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Baslik</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Konu basligi"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Aciklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tahmini Sure (dk)</label>
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hedef / Kazanim</label>
              <Input
                value={objectiveText}
                onChange={(e) => setObjectiveText(e.target.value)}
                placeholder="Bu konunun ogrenme hedefi"
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={onClose}>Iptal</Button>
            <Button
              size="sm"
              disabled={!title.trim() || isPending}
              onClick={() => {
                onSubmit({ title: title.trim(), description: description.trim(), estimatedMinutes, objectiveText: objectiveText.trim() });
                setTitle(''); setDescription(''); setEstimatedMinutes(30); setObjectiveText('');
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Material Picker Dialog ──

function MaterialPickerDialog({
  open,
  onClose,
  onSelect,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (libraryItemId: string, materialRole: string) => void;
  isPending: boolean;
}) {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('Primary');
  const { data } = useLibraryItems({ search: search.trim() || undefined, pageSize: 20 });

  if (!open) return null;

  const items = data?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Materyal Ekle</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kutuphanede ara..."
                className="text-sm h-8"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs bg-white"
            >
              {MATERIAL_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
            {items.length > 0 ? items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                onClick={() => onSelect(item.id, selectedRole)}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {getMaterialIcon(item.itemType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-400">{item.itemType} - {item.fileFormat}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600"
                  disabled={isPending}
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  Ekle
                </Button>
              </div>
            )) : (
              <div className="text-center py-6 text-xs text-gray-400">
                {search ? 'Sonuc bulunamadi' : 'Kutuphanenizde materyal yok'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Assign Dialog ──

function AssignDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (studentUserId: string) => void;
  isPending: boolean;
}) {
  const [studentUserId, setStudentUserId] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ogrenciye Ata</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ogrenci Kullanici ID</label>
            <Input
              value={studentUserId}
              onChange={(e) => setStudentUserId(e.target.value)}
              placeholder="Ogrenci UUID'si"
              className="text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={onClose}>Iptal</Button>
            <Button
              size="sm"
              disabled={!studentUserId.trim() || isPending}
              onClick={() => { onSubmit(studentUserId.trim()); setStudentUserId(''); }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isPending ? 'Ataniyor...' : 'Ata'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Topic Component ──

function TopicCard({
  topic,
  onDelete,
  onAddMaterial,
  onRemoveMaterial,
}: {
  topic: CurriculumTopicDto;
  onDelete: (topicId: string) => void;
  onAddMaterial: (topicId: string) => void;
  onRemoveMaterial: (topicId: string, itemId: string) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-800">{topic.title}</span>
            {topic.estimatedMinutes && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {topic.estimatedMinutes} dk
              </span>
            )}
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
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(topic.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Materials */}
      {topic.materials && topic.materials.length > 0 && (
        <div className="space-y-1 pl-2 border-l-2 border-indigo-100">
          {topic.materials.map((mat) => (
            <div key={mat.libraryItemId} className="flex items-center gap-2 text-[11px]">
              {getMaterialIcon(mat.itemType)}
              <span className="text-gray-700 truncate flex-1">{mat.title}</span>
              <span className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{mat.materialRole}</span>
              <button
                className="text-red-400 hover:text-red-600"
                onClick={() => onRemoveMaterial(topic.id, mat.libraryItemId)}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] text-indigo-600 hover:bg-indigo-50 px-2"
        onClick={() => onAddMaterial(topic.id)}
      >
        <Paperclip className="w-3 h-3 mr-0.5" />
        Materyal Ekle
      </Button>
    </div>
  );
}

// ── Week Accordion ──

function WeekAccordion({
  week,
  isOpen,
  onToggle,
  onDeleteWeek,
  onAddTopic,
  onDeleteTopic,
  onAddMaterial,
  onRemoveMaterial,
}: {
  week: CurriculumWeekDto;
  isOpen: boolean;
  onToggle: () => void;
  onDeleteWeek: (weekId: string) => void;
  onAddTopic: (weekId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onAddMaterial: (topicId: string) => void;
  onRemoveMaterial: (topicId: string, itemId: string) => void;
}) {
  const sortedTopics = [...(week.topics || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card className="border-0 shadow-sm">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
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
          <span className="text-[10px] text-gray-400">{sortedTopics.length} konu</span>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDeleteWeek(week.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <CardContent className="px-4 pb-4 pt-0">
          {week.description && (
            <p className="text-xs text-gray-500 mb-3 ml-7">{week.description}</p>
          )}

          <div className="space-y-2 ml-7">
            {sortedTopics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onDelete={onDeleteTopic}
                onAddMaterial={onAddMaterial}
                onRemoveMaterial={onRemoveMaterial}
              />
            ))}
          </div>

          <div className="ml-7 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              onClick={() => onAddTopic(week.id)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Konu Ekle
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── Main Page ──

export default function CurriculumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: curriculum, isLoading } = useCurriculum(id);
  const updateMutation = useUpdateCurriculum();
  const publishMutation = usePublishCurriculum();
  const addWeekMutation = useAddWeek();
  const deleteWeekMutation = useDeleteWeek();
  const addTopicMutation = useAddTopic();
  const deleteTopicMutation = useDeleteTopic();
  const addMaterialMutation = useAddTopicMaterial();
  const removeMaterialMutation = useRemoveTopicMaterial();
  const assignMutation = useAssignCurriculum();

  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const [showAddWeek, setShowAddWeek] = useState(false);
  const [addTopicWeekId, setAddTopicWeekId] = useState<string | null>(null);
  const [materialPickerTopicId, setMaterialPickerTopicId] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);

  const toggleWeek = (weekId: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const handleAddWeek = async (title: string, description: string) => {
    try {
      await addWeekMutation.mutateAsync({
        curriculumId: id,
        data: { title, description: description || undefined },
      });
      toast.success('Hafta eklendi');
      setShowAddWeek(false);
    } catch {
      // handled
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!confirm('Bu haftayi ve tum konularini silmek istediginize emin misiniz?')) return;
    try {
      await deleteWeekMutation.mutateAsync(weekId);
      toast.success('Hafta silindi');
    } catch {
      // handled
    }
  };

  const handleAddTopic = async (data: { title: string; description: string; estimatedMinutes: number; objectiveText: string }) => {
    if (!addTopicWeekId) return;
    try {
      await addTopicMutation.mutateAsync({
        weekId: addTopicWeekId,
        data: {
          title: data.title,
          description: data.description || undefined,
          estimatedMinutes: data.estimatedMinutes || undefined,
          objectiveText: data.objectiveText || undefined,
        },
      });
      toast.success('Konu eklendi');
      setAddTopicWeekId(null);
    } catch {
      // handled
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Bu konuyu silmek istediginize emin misiniz?')) return;
    try {
      await deleteTopicMutation.mutateAsync(topicId);
      toast.success('Konu silindi');
    } catch {
      // handled
    }
  };

  const handleAddMaterial = async (libraryItemId: string, materialRole: string) => {
    if (!materialPickerTopicId) return;
    try {
      await addMaterialMutation.mutateAsync({
        topicId: materialPickerTopicId,
        data: { libraryItemId, materialRole },
      });
      toast.success('Materyal eklendi');
      setMaterialPickerTopicId(null);
    } catch {
      // handled
    }
  };

  const handleRemoveMaterial = async (topicId: string, itemId: string) => {
    try {
      await removeMaterialMutation.mutateAsync({ topicId, itemId });
      toast.success('Materyal kaldirildi');
    } catch {
      // handled
    }
  };

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success('Mufredat yayinlandi');
    } catch {
      // handled
    }
  };

  const handleAssign = async (studentUserId: string) => {
    try {
      await assignMutation.mutateAsync({ curriculumId: id, studentUserId });
      toast.success('Mufredat ogrenciye atandi');
      setShowAssign(false);
    } catch {
      // handled
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl text-center">
        <p className="text-sm text-gray-500">Mufredat bulunamadi</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/mentor/curriculums')}>
          Geri Don
        </Button>
      </div>
    );
  }

  const sortedWeeks = [...(curriculum.weeks || [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/mentor/curriculums')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{curriculum.title}</h1>
            {getStatusBadge(curriculum.status)}
          </div>
          {curriculum.description && (
            <p className="text-xs text-gray-500 truncate">{curriculum.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {curriculum.status === 'Published' && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowAssign(true)}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Ogrenciye Ata
            </Button>
          )}
          {curriculum.status === 'Draft' && (
            <Button
              size="sm"
              className="text-xs bg-green-600 hover:bg-green-700"
              onClick={handlePublish}
              disabled={publishMutation.isPending}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Yayinla
            </Button>
          )}
        </div>
      </div>

      {/* Info Bar */}
      <div className="flex items-center gap-3 flex-wrap mb-6 ml-11">
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

      {/* Weeks */}
      <div className="space-y-2">
        {sortedWeeks.map((week) => (
          <WeekAccordion
            key={week.id}
            week={week}
            isOpen={openWeeks.has(week.id)}
            onToggle={() => toggleWeek(week.id)}
            onDeleteWeek={handleDeleteWeek}
            onAddTopic={(weekId) => { setAddTopicWeekId(weekId); setOpenWeeks((prev) => new Set(prev).add(weekId)); }}
            onDeleteTopic={handleDeleteTopic}
            onAddMaterial={(topicId) => setMaterialPickerTopicId(topicId)}
            onRemoveMaterial={handleRemoveMaterial}
          />
        ))}
      </div>

      {/* Add Week Button */}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 w-full"
          onClick={() => setShowAddWeek(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Hafta Ekle
        </Button>
      </div>

      {/* Empty State */}
      {sortedWeeks.length === 0 && (
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30 mt-4">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Henuz hafta eklenmedi</h3>
            <p className="text-xs text-gray-500">Mufredatinizi olusturmak icin ilk haftayi ekleyin</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddWeekDialog
        open={showAddWeek}
        onClose={() => setShowAddWeek(false)}
        onSubmit={handleAddWeek}
        isPending={addWeekMutation.isPending}
      />
      <AddTopicDialog
        open={!!addTopicWeekId}
        onClose={() => setAddTopicWeekId(null)}
        onSubmit={handleAddTopic}
        isPending={addTopicMutation.isPending}
      />
      <MaterialPickerDialog
        open={!!materialPickerTopicId}
        onClose={() => setMaterialPickerTopicId(null)}
        onSelect={handleAddMaterial}
        isPending={addMaterialMutation.isPending}
      />
      <AssignDialog
        open={showAssign}
        onClose={() => setShowAssign(false)}
        onSubmit={handleAssign}
        isPending={assignMutation.isPending}
      />
    </div>
  );
}
