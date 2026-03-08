'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useSessionPlan,
  useUpdateSessionPlan,
  useShareSessionPlan,
  useCompleteSessionPlan,
  useAddSessionPlanMaterial,
  useRemoveSessionPlanMaterial,
  useSaveSessionPlanAsTemplate,
} from '@/lib/hooks/use-session-plans';
import { useLibraryItems } from '@/lib/hooks/use-library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Share2,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  FileText,
  Video,
  Link2,
  Image,
  File,
  Presentation,
  Sheet,
  Loader2,
  ClipboardList,
  BookOpen,
  PlayCircle,
  CheckSquare,
  Search,
  GripVertical,
  Copy,
} from 'lucide-react';
import type { SessionPlanMaterialDto } from '@/lib/api/session-plans';
import type { LibraryItemDto } from '@/lib/api/library';

type PhaseTab = 'pre' | 'during' | 'post';

const PHASE_TABS: { label: string; value: PhaseTab; icon: typeof BookOpen }[] = [
  { label: 'Seans Oncesi', value: 'pre', icon: BookOpen },
  { label: 'Seans Sirasi', value: 'during', icon: PlayCircle },
  { label: 'Seans Sonrasi', value: 'post', icon: CheckSquare },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'Draft':
      return <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">Taslak</Badge>;
    case 'Shared':
      return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">Paylasildi</Badge>;
    case 'Completed':
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">Tamamlandi</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
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

function MaterialPickerDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: LibraryItemDto) => void;
}) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useLibraryItems({
    search: search.trim() || undefined,
    page: 1,
    pageSize: 20,
  });

  if (!open) return null;

  const items = data?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <CardTitle className="text-base">Kutuphaneden Materyal Sec</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Materyal ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : items.length > 0 ? (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {getFormatIcon(item.fileFormat)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                    <div className="text-[10px] text-gray-400">
                      {item.itemType} - {item.fileFormat}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                {search ? 'Sonuc bulunamadi' : 'Kutuphanenizde materyal yok'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MaterialList({
  materials,
  planId,
  phase,
  onAddClick,
}: {
  materials: SessionPlanMaterialDto[];
  planId: string;
  phase: string;
  onAddClick: () => void;
}) {
  const removeMutation = useRemoveSessionPlanMaterial();

  const handleRemove = async (materialId: string) => {
    try {
      await removeMutation.mutateAsync({ planId, materialId });
      toast.success('Materyal kaldirildi');
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Materyaller ({materials.length})
        </h4>
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={onAddClick}>
          <Plus className="w-3 h-3 mr-1" />
          Materyal Ekle
        </Button>
      </div>
      {materials.length > 0 ? (
        <div className="space-y-1.5">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 group"
            >
              <GripVertical className="w-3.5 h-3.5 text-gray-300" />
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
                  className="text-xs text-teal-600 hover:underline flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ac
                </a>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(mat.id)}
                disabled={removeMutation.isPending}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
          Henuz materyal eklenmedi
        </div>
      )}
    </div>
  );
}

export default function SessionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const { data: plan, isLoading } = useSessionPlan(planId);
  const updateMutation = useUpdateSessionPlan();
  const shareMutation = useShareSessionPlan();
  const completeMutation = useCompleteSessionPlan();
  const addMaterialMutation = useAddSessionPlanMaterial();
  const saveTemplateMutation = useSaveSessionPlanAsTemplate();

  const [activePhase, setActivePhase] = useState<PhaseTab>('pre');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPhase, setPickerPhase] = useState<string>('Pre');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [preSessionNote, setPreSessionNote] = useState('');
  const [sessionObjective, setSessionObjective] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [postSessionSummary, setPostSessionSummary] = useState('');
  const [agendaItems, setAgendaItems] = useState<{ text: string; completed: boolean }[]>([]);
  const [dirty, setDirty] = useState(false);

  // Populate form when plan loads — only if not dirty (avoid overwriting unsaved edits)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (plan && !dirty) {
      setTitle(plan.title || '');
      setPreSessionNote(plan.preSessionNote || '');
      setSessionObjective(plan.sessionObjective || '');
      setSessionNotes(plan.sessionNotes || '');
      setPostSessionSummary(plan.postSessionSummary || '');
      setAgendaItems(plan.agendaItems || []);
      initializedRef.current = true;
    }
  }, [plan, dirty]);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: planId,
        data: {
          title: title.trim() || undefined,
          preSessionNote: preSessionNote.trim() || undefined,
          sessionObjective: sessionObjective.trim() || undefined,
          sessionNotes: sessionNotes.trim() || undefined,
          postSessionSummary: postSessionSummary.trim() || undefined,
          agendaItems: agendaItems.length > 0 ? agendaItems : undefined,
        },
      });
      setDirty(false);
      toast.success('Plan kaydedildi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleShare = async () => {
    try {
      await shareMutation.mutateAsync(planId);
      toast.success('Plan ogrenciyle paylasildi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleComplete = async () => {
    if (!confirm('Bu plani tamamlandi olarak isaretlemek istiyor musunuz?')) return;
    try {
      await completeMutation.mutateAsync(planId);
      toast.success('Plan tamamlandi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleAddMaterial = async (item: LibraryItemDto) => {
    try {
      // Auto-save unsaved form changes before adding material
      if (dirty) {
        await updateMutation.mutateAsync({
          id: planId,
          data: {
            title: title.trim() || undefined,
            preSessionNote: preSessionNote.trim() || undefined,
            sessionObjective: sessionObjective.trim() || undefined,
            sessionNotes: sessionNotes.trim() || undefined,
            postSessionSummary: postSessionSummary.trim() || undefined,
            agendaItems: agendaItems.length > 0 ? agendaItems : undefined,
          },
        });
        setDirty(false);
      }
      await addMaterialMutation.mutateAsync({
        planId,
        data: {
          libraryItemId: item.id,
          phase: pickerPhase,
        },
      });
      toast.success('Materyal eklendi');
    } catch {
      // error handled by interceptor
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      await saveTemplateMutation.mutateAsync({ id: planId, templateName: templateName.trim() });
      toast.success('Sablon olarak kaydedildi');
      setShowSaveTemplate(false);
      setTemplateName('');
    } catch {
      // error handled by interceptor
    }
  };

  const openPicker = (phase: string) => {
    setPickerPhase(phase);
    setShowPicker(true);
  };

  // Agenda item handlers
  const addAgendaItem = () => {
    setAgendaItems((prev) => [...prev, { text: '', completed: false }]);
    markDirty();
  };

  const updateAgendaItem = (index: number, text: string) => {
    setAgendaItems((prev) => prev.map((item, i) => (i === index ? { ...item, text } : item)));
    markDirty();
  };

  const toggleAgendaItem = (index: number) => {
    setAgendaItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    );
    markDirty();
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl text-center">
        <p className="text-gray-500">Plan bulunamadi</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/mentor/session-plans')}>
          Geri Don
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/mentor/session-plans')}
          className="h-8 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            placeholder="Plan basligi..."
            className="text-lg font-semibold border-0 border-b border-transparent hover:border-gray-200 focus:border-teal-500 rounded-none px-0 h-auto py-1 shadow-none"
          />
        </div>

        {getStatusBadge(plan.status)}

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={() => setShowSaveTemplate(true)}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Sablon
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
            onClick={handleSave}
            disabled={updateMutation.isPending || !dirty}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1" />
            )}
            Kaydet
          </Button>
          {plan.status === 'Draft' && (
            <Button
              size="sm"
              className="text-xs h-8 bg-blue-600 hover:bg-blue-700"
              onClick={handleShare}
              disabled={shareMutation.isPending}
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              Paylas
            </Button>
          )}
          {(plan.status === 'Draft' || plan.status === 'Shared') && (
            <Button
              size="sm"
              className="text-xs h-8 bg-green-600 hover:bg-green-700"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Tamamla
            </Button>
          )}
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1.5 mb-5 border-b border-gray-100 pb-3">
        {PHASE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActivePhase(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePhase === tab.value
                ? 'bg-teal-50 text-teal-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Phase Content */}
      <div className="space-y-5">
        {/* ── Pre-Session ── */}
        {activePhase === 'pre' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Seans Oncesi Notu</label>
                  <p className="text-xs text-gray-400 mb-2">Ogrencinin seanstan once hazirlanmasi gereken konular</p>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Seans oncesi notlarinizi yazin..."
                    value={preSessionNote}
                    onChange={(e) => { setPreSessionNote(e.target.value); markDirty(); }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <MaterialList
                  materials={plan.preMaterials}
                  planId={planId}
                  phase="Pre"
                  onAddClick={() => openPicker('Pre')}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* ── During Session ── */}
        {activePhase === 'during' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Seans Hedefi</label>
                  <Input
                    value={sessionObjective}
                    onChange={(e) => { setSessionObjective(e.target.value); markDirty(); }}
                    placeholder="Bu seansin temel hedefi nedir?"
                    className="mt-1"
                  />
                </div>

                {/* Agenda Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Gundem Maddeleri</label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={addAgendaItem}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Madde Ekle
                    </Button>
                  </div>
                  {agendaItems.length > 0 ? (
                    <div className="space-y-1.5">
                      {agendaItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                          <button
                            type="button"
                            onClick={() => toggleAgendaItem(index)}
                            className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              item.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {item.completed && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                          <Input
                            value={item.text}
                            onChange={(e) => updateAgendaItem(index, e.target.value)}
                            placeholder={`Madde ${index + 1}`}
                            className={`flex-1 h-8 text-sm ${item.completed ? 'line-through text-gray-400' : ''}`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                            onClick={() => removeAgendaItem(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
                      Henuz gundem maddesi eklenmedi
                    </div>
                  )}
                </div>

                {/* Session Notes */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Seans Notlari</label>
                  <p className="text-xs text-gray-400 mb-2">Seans sirasinda aldaginiz notlar</p>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[160px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Seans sirasinda not alin..."
                    value={sessionNotes}
                    onChange={(e) => { setSessionNotes(e.target.value); markDirty(); }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <MaterialList
                  materials={plan.duringMaterials}
                  planId={planId}
                  phase="During"
                  onAddClick={() => openPicker('During')}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Post-Session ── */}
        {activePhase === 'post' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Seans Sonrasi Ozeti</label>
                  <p className="text-xs text-gray-400 mb-2">Seans sonrasinda ogrenciyle paylasilacak ozet</p>
                  <textarea
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Seans ozetini yazin..."
                    value={postSessionSummary}
                    onChange={(e) => { setPostSessionSummary(e.target.value); markDirty(); }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <MaterialList
                  materials={plan.postMaterials}
                  planId={planId}
                  phase="Post"
                  onAddClick={() => openPicker('Post')}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Material Picker Dialog */}
      <MaterialPickerDialog
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddMaterial}
      />

      {/* Save as Template Dialog */}
      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="w-full max-w-md mx-4 shadow-xl">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Sablon Olarak Kaydet</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sablon Adi</label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="ornegin: Matematik Ders Plani Sablonu"
                  className="text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }}>
                  Iptal
                </Button>
                <Button
                  size="sm"
                  disabled={!templateName.trim() || saveTemplateMutation.isPending}
                  onClick={handleSaveTemplate}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {saveTemplateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
