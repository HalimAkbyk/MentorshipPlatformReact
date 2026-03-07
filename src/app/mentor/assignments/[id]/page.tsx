'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useAssignment,
  useUpdateAssignment,
  usePublishAssignment,
  useCloseAssignment,
  useDeleteAssignment,
  useAddAssignmentMaterial,
  useRemoveAssignmentMaterial,
  useReviewSubmission,
} from '@/lib/hooks/use-assignments';
import { useLibraryItems } from '@/lib/hooks/use-library';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  ArrowLeft,
  FileCheck,
  Send,
  Lock,
  Trash2,
  Plus,
  X,
  Download,
  Star,
  CalendarDays,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
} from 'lucide-react';
import type { SubmissionDto, AssignmentMaterialDto } from '@/lib/api/assignments';

const TYPE_LABELS: Record<string, string> = {
  Homework: 'Odev', Project: 'Proje', Practice: 'Pratik',
  Quiz: 'Quiz', Reading: 'Okuma', Research: 'Arastirma',
};
const DIFFICULTY_LABELS: Record<string, string> = { Easy: 'Kolay', Medium: 'Orta', Hard: 'Zor' };
const STATUS_LABELS: Record<string, string> = { Draft: 'Taslak', Published: 'Yayinda', Closed: 'Kapali' };

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  Pending: 'Bekliyor',
  Approved: 'Onaylandi',
  RevisionRequired: 'Revizyon Gerekli',
  Rejected: 'Reddedildi',
};

function statusColor(status: string) {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-700';
    case 'Published': return 'bg-green-100 text-green-700';
    case 'Closed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function submissionStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-700';
    case 'Approved': return 'bg-green-100 text-green-700';
    case 'RevisionRequired': return 'bg-orange-100 text-orange-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MentorAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: assignment, isLoading } = useAssignment(id);
  const publishMutation = usePublishAssignment();
  const closeMutation = useCloseAssignment();
  const deleteMutation = useDeleteAssignment();
  const addMaterialMutation = useAddAssignmentMaterial();
  const removeMaterialMutation = useRemoveAssignmentMaterial();
  const reviewMutation = useReviewSubmission();

  const [activeTab, setActiveTab] = useState<'detail' | 'submissions'>('detail');
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  // Review form state
  const [reviewForms, setReviewForms] = useState<Record<string, { score: string; feedback: string; status: string }>>({});

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="border-0 shadow-sm animate-pulse">
          <CardContent className="p-6 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Odev bulunamadi</p>
            <Link href="/mentor/assignments">
              <Button variant="outline" size="sm" className="mt-3 text-xs">Geri Don</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDraft = assignment.status === 'Draft';
  const submissions = assignment.submissions ?? [];

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success('Odev yayinlandi');
    } catch { /* interceptor */ }
  };

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(id);
      toast.success('Odev kapatildi');
    } catch { /* interceptor */ }
  };

  const handleDelete = async () => {
    if (!confirm('Bu odevi silmek istediginize emin misiniz?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Odev silindi');
      router.push('/mentor/assignments');
    } catch { /* interceptor */ }
  };

  const handleAddMaterial = async (libraryItemId: string) => {
    try {
      await addMaterialMutation.mutateAsync({
        assignmentId: id,
        data: { libraryItemId, isRequired: true },
      });
      toast.success('Materyal eklendi');
      setShowMaterialPicker(false);
    } catch { /* interceptor */ }
  };

  const handleRemoveMaterial = async (itemId: string) => {
    try {
      await removeMaterialMutation.mutateAsync({ assignmentId: id, itemId });
      toast.success('Materyal kaldirildi');
    } catch { /* interceptor */ }
  };

  const handleReview = async (submissionId: string) => {
    const form = reviewForms[submissionId];
    if (!form?.feedback?.trim()) {
      toast.error('Geri bildirim zorunludur');
      return;
    }
    try {
      await reviewMutation.mutateAsync({
        submissionId,
        data: {
          score: form.score ? Number(form.score) : undefined,
          feedback: form.feedback.trim(),
          status: form.status || 'Approved',
        },
      });
      toast.success('Degerlendirme kaydedildi');
      setExpandedSubmission(null);
      setReviewForms((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
    } catch { /* interceptor */ }
  };

  const getReviewForm = (submissionId: string) => {
    return reviewForms[submissionId] || { score: '', feedback: '', status: 'Approved' };
  };

  const setReviewForm = (submissionId: string, field: string, value: string) => {
    setReviewForms((prev) => ({
      ...prev,
      [submissionId]: { ...getReviewForm(submissionId), [field]: value },
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/mentor/assignments">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">{assignment.title}</h1>
            <Badge className={cn('text-[10px] px-1.5 py-0', statusColor(assignment.status))}>
              {STATUS_LABELS[assignment.status] ?? assignment.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Olusturulma: {formatDate(assignment.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700" onClick={handlePublish} disabled={publishMutation.isPending}>
              <Send className="w-3 h-3 mr-1" /> Yayinla
            </Button>
          )}
          {assignment.status === 'Published' && (
            <Button size="sm" variant="outline" className="text-xs" onClick={handleClose} disabled={closeMutation.isPending}>
              <Lock className="w-3 h-3 mr-1" /> Kapat
            </Button>
          )}
          {isDraft && (
            <Button size="sm" variant="ghost" className="text-xs text-red-500" onClick={handleDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('detail')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'detail' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          )}
        >
          Odev Detay
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'submissions' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          )}
        >
          Teslimler ({submissions.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'detail' ? (
        <DetailTab
          assignment={assignment}
          onAddMaterial={() => setShowMaterialPicker(true)}
          onRemoveMaterial={handleRemoveMaterial}
          removePending={removeMaterialMutation.isPending}
        />
      ) : (
        <SubmissionsTab
          submissions={submissions}
          maxScore={assignment.maxScore}
          expandedId={expandedSubmission}
          onToggle={(sid) => setExpandedSubmission(expandedSubmission === sid ? null : sid)}
          reviewForms={reviewForms}
          getReviewForm={getReviewForm}
          setReviewForm={setReviewForm}
          onReview={handleReview}
          reviewPending={reviewMutation.isPending}
        />
      )}

      {/* Material Picker Modal */}
      {showMaterialPicker && (
        <MaterialPicker
          existingIds={assignment.materials.map((m) => m.libraryItemId)}
          onSelect={handleAddMaterial}
          onClose={() => setShowMaterialPicker(false)}
          isPending={addMaterialMutation.isPending}
        />
      )}
    </div>
  );
}

// ── Detail Tab ──

function DetailTab({
  assignment,
  onAddMaterial,
  onRemoveMaterial,
  removePending,
}: {
  assignment: any;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
  removePending: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Tur</span>
              <span className="font-medium">{TYPE_LABELS[assignment.assignmentType] ?? assignment.assignmentType}</span>
            </div>
            {assignment.difficultyLevel && (
              <div>
                <span className="text-xs text-gray-400 block">Zorluk</span>
                <span className="font-medium">{DIFFICULTY_LABELS[assignment.difficultyLevel] ?? assignment.difficultyLevel}</span>
              </div>
            )}
            {assignment.estimatedMinutes != null && (
              <div>
                <span className="text-xs text-gray-400 block">Tahmini Sure</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {assignment.estimatedMinutes} dk
                </span>
              </div>
            )}
            {assignment.maxScore != null && (
              <div>
                <span className="text-xs text-gray-400 block">Maks Puan</span>
                <span className="font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" /> {assignment.maxScore}
                </span>
              </div>
            )}
            {assignment.dueDate && (
              <div>
                <span className="text-xs text-gray-400 block">Son Teslim</span>
                <span className="font-medium flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> {formatDate(assignment.dueDate)}
                </span>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-400 block">Gec Teslim</span>
              <span className="font-medium">
                {assignment.allowLateSubmission
                  ? `Evet${assignment.latePenaltyPercent ? ` (%${assignment.latePenaltyPercent} ceza)` : ''}`
                  : 'Hayir'}
              </span>
            </div>
          </div>

          {assignment.description && (
            <div>
              <span className="text-xs text-gray-400 block mb-1">Aciklama</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {assignment.instructions && (
            <div>
              <span className="text-xs text-gray-400 block mb-1">Talimatlar</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Materyaller</h3>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={onAddMaterial}>
              <Plus className="w-3 h-3 mr-1" /> Materyal Ekle
            </Button>
          </div>
          {assignment.materials.length > 0 ? (
            <div className="space-y-2">
              {assignment.materials.map((mat: AssignmentMaterialDto) => (
                <div
                  key={mat.libraryItemId}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-800 truncate">{mat.title}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{mat.itemType}</Badge>
                    {mat.isRequired && (
                      <Badge className="text-[9px] px-1 py-0 bg-red-100 text-red-600">Zorunlu</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {mat.fileUrl && (
                      <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                      onClick={() => onRemoveMaterial(mat.libraryItemId)}
                      disabled={removePending}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Henuz materyal eklenmedi</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Submissions Tab ──

function SubmissionsTab({
  submissions,
  maxScore,
  expandedId,
  onToggle,
  reviewForms,
  getReviewForm,
  setReviewForm,
  onReview,
  reviewPending,
}: {
  submissions: SubmissionDto[];
  maxScore?: number;
  expandedId: string | null;
  onToggle: (id: string) => void;
  reviewForms: Record<string, any>;
  getReviewForm: (id: string) => { score: string; feedback: string; status: string };
  setReviewForm: (id: string, field: string, value: string) => void;
  onReview: (id: string) => void;
  reviewPending: boolean;
}) {
  if (submissions.length === 0) {
    return (
      <Card className="border border-dashed border-gray-200">
        <CardContent className="p-8 text-center">
          <FileCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Henuz teslim yapilmadi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {submissions.map((sub) => {
        const isExpanded = expandedId === sub.id;
        const form = getReviewForm(sub.id);
        const hasReview = !!sub.review;

        return (
          <Card key={sub.id} className="border-0 shadow-sm">
            <CardContent className="p-0">
              {/* Row */}
              <button
                onClick={() => onToggle(sub.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{sub.studentName}</span>
                    <Badge className={cn('text-[10px] px-1.5 py-0', submissionStatusColor(sub.status))}>
                      {SUBMISSION_STATUS_LABELS[sub.status] ?? sub.status}
                    </Badge>
                    {sub.isLate && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">Gec</Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    {formatDate(sub.submittedAt)}
                  </span>
                </div>
                {sub.review?.score != null && (
                  <span className="text-sm font-semibold text-teal-700">
                    {sub.review.score}{maxScore ? `/${maxScore}` : ''}
                  </span>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {/* Submission content */}
                  {sub.submissionText && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Teslim Metni</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{sub.submissionText}</p>
                    </div>
                  )}
                  {sub.fileUrl && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Dosya</span>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {sub.originalFileName ?? 'Dosyayi Indir'}
                      </a>
                    </div>
                  )}

                  {/* Existing review */}
                  {hasReview && (
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 space-y-1">
                      <span className="text-xs font-medium text-teal-700">Onceki Degerlendirme</span>
                      {sub.review!.score != null && (
                        <p className="text-sm text-gray-800">Puan: {sub.review!.score}{maxScore ? `/${maxScore}` : ''}</p>
                      )}
                      {sub.review!.feedback && (
                        <p className="text-sm text-gray-700">{sub.review!.feedback}</p>
                      )}
                    </div>
                  )}

                  {/* Review form */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                    <span className="text-xs font-semibold text-gray-700">Degerlendir</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">Puan</label>
                        <Input
                          type="number"
                          min={0}
                          max={maxScore ?? 999}
                          value={form.score}
                          onChange={(e) => setReviewForm(sub.id, 'score', e.target.value)}
                          placeholder={maxScore ? `0-${maxScore}` : 'Puan'}
                          className="text-sm h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">Durum</label>
                        <select
                          value={form.status}
                          onChange={(e) => setReviewForm(sub.id, 'status', e.target.value)}
                          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="Approved">Onaylandi</option>
                          <option value="RevisionRequired">Revizyon Gerekli</option>
                          <option value="Rejected">Reddedildi</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Geri Bildirim</label>
                      <textarea
                        value={form.feedback}
                        onChange={(e) => setReviewForm(sub.id, 'feedback', e.target.value)}
                        placeholder="Geri bildiriminizi yazin..."
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => onReview(sub.id)}
                        disabled={reviewPending}
                      >
                        {reviewPending ? 'Kaydediliyor...' : 'Degerlendir'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Material Picker ──

function MaterialPicker({
  existingIds,
  onSelect,
  onClose,
  isPending,
}: {
  existingIds: string[];
  onSelect: (id: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [search, setSearch] = useState('');
  const { data } = useLibraryItems({ search: search.trim() || undefined, pageSize: 20 });
  const items = (data?.items ?? []).filter((item) => !existingIds.includes(item.id));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm text-gray-900">Materyal Sec</h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-3 border-b">
          <Input
            placeholder="Materyal ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm h-8"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                disabled={isPending}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-teal-50 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-800 truncate block">{item.title}</span>
                  <span className="text-[10px] text-gray-400">{item.itemType} - {item.fileFormat}</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">Materyal bulunamadi</p>
          )}
        </div>
      </div>
    </div>
  );
}
