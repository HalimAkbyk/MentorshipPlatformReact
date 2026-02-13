'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,
  Clock, DollarSign, HelpCircle, ChevronDown, ChevronUp,
  Package, ArrowLeft, Loader2, MessageSquare, Calendar, Save,
  Settings2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useConfirm } from '@/lib/hooks/useConfirm';
import { offeringsApi, type OfferingDto, type OfferingQuestion } from '@/lib/api/offerings';
import {
  useOfferingTemplate,
  useSaveOfferingTemplate,
  useDeleteOfferingTemplate,
} from '@/lib/hooks/use-availability';
import type { AvailabilityRuleDto, AvailabilitySettingsDto } from '@/lib/api/availability';

// ==================== SCHEMAS ====================

const offeringSchema = z.object({
  title: z.string().min(2, 'Paket adı en az 2 karakter olmalı').max(100, 'En fazla 100 karakter'),
  subtitle: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  detailedDescription: z.string().max(2000).optional().or(z.literal('')),
  category: z.string().max(50).optional().or(z.literal('')),
  sessionType: z.string().max(50).optional().or(z.literal('')),
  durationMin: z.coerce.number().min(15, 'En az 15 dakika').max(180, 'En fazla 180 dakika'),
  price: z.coerce.number().min(0, 'Fiyat 0 veya daha fazla olmalı'),
  maxBookingDaysAhead: z.coerce.number().min(1).max(365).default(60),
  minNoticeHours: z.coerce.number().min(0).max(72).default(2),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
});

type OfferingFormData = z.infer<typeof offeringSchema>;

const questionSchema = z.object({
  questionText: z.string().min(3, 'Soru en az 3 karakter').max(200, 'En fazla 200 karakter'),
  isRequired: z.boolean(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

// ==================== MAIN PAGE ====================

export default function MentorOfferingsPage() {
  const router = useRouter();
  const confirm = useConfirm();

  const [offerings, setOfferings] = useState<OfferingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffering, setEditingOffering] = useState<OfferingDto | null>(null);
  const [questionsOffering, setQuestionsOffering] = useState<OfferingDto | null>(null);
  const [scheduleOffering, setScheduleOffering] = useState<OfferingDto | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch offerings
  const fetchOfferings = useCallback(async () => {
    try {
      const data = await offeringsApi.getMyOfferings();
      setOfferings(data ?? []);
    } catch {
      toast.error('Paketler yüklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  // Toggle active/inactive
  const handleToggle = async (offering: OfferingDto) => {
    setActionLoading(offering.id);
    try {
      const res = await offeringsApi.toggle(offering.id);
      setOfferings(prev =>
        prev.map(o => o.id === offering.id ? { ...o, isActive: res.isActive } : o)
      );
      toast.success(res.isActive ? 'Paket aktiflestirildi' : 'Paket pasife alindi');
    } catch {
      toast.error('Islem basarisiz');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete offering
  const handleDelete = (offering: OfferingDto) => {
    confirm({
      title: 'Paketi Sil',
      description: `"${offering.title}" paketini silmek istediginize emin misiniz? Bu islem geri alinamaz.`,
      variant: 'danger',
      confirmText: 'Sil',
      onConfirm: async () => {
        try {
          await offeringsApi.delete(offering.id);
          setOfferings(prev => prev.filter(o => o.id !== offering.id));
          toast.success('Paket silindi');
        } catch {
          toast.error('Silme basarisiz');
        }
      },
    });
  };

  // Reorder (move up / move down)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newOfferings = [...offerings];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOfferings.length) return;

    [newOfferings[index], newOfferings[swapIndex]] = [newOfferings[swapIndex], newOfferings[index]];
    setOfferings(newOfferings);

    try {
      await offeringsApi.reorder(newOfferings.map(o => o.id));
    } catch {
      toast.error('Siralama guncellenemedi');
      fetchOfferings(); // rollback
    }
  };

  // After create/update success
  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setEditingOffering(null);
    fetchOfferings();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/mentor/dashboard')} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Paketlerim</h1>
              <p className="text-sm text-gray-500">Mentorluk paketlerinizi yonetin</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Paket
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {offerings.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Henuz paket olusturmadiniz</h3>
              <p className="text-gray-500 mb-6">
                Ogrencilerinize sunacaginiz mentorluk paketlerini olusturun.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Ilk Paketinizi Olusturun
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {offerings.map((offering, index) => (
              <Card
                key={offering.id}
                className={`transition-all ${!offering.isActive ? 'opacity-60 border-dashed' : ''}`}
              >
                <CardContent className="p-0">
                  {/* Main row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Drag handle & order controls */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === offerings.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{offering.title}</h3>
                        <Badge variant={offering.isActive ? 'success' : 'secondary'}>
                          {offering.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                        {offering.availabilityTemplateId ? (
                          <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-[10px]">
                            <Calendar className="w-3 h-3 mr-0.5" />
                            Ozel Program
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Varsayilan</Badge>
                        )}
                        {offering.category && (
                          <Badge variant="outline">{offering.category}</Badge>
                        )}
                      </div>
                      {offering.subtitle && (
                        <p className="text-sm text-gray-500 truncate">{offering.subtitle}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {offering.durationMin} dk
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {offering.price} {offering.currency}
                        </span>
                        {offering.questionCount > 0 && (
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            {offering.questionCount} soru
                          </span>
                        )}
                        {offering.sessionType && (
                          <Badge variant="outline" className="text-xs">
                            {offering.sessionType}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(expandedId === offering.id ? null : offering.id)}
                        title="Detaylari goster"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${expandedId === offering.id ? 'rotate-180' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setScheduleOffering(offering)}
                        title="Musaitlik programi"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuestionsOffering(offering)}
                        title="Sorulari duzenle"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(offering)}
                        disabled={actionLoading === offering.id}
                        title={offering.isActive ? 'Pasife al' : 'Aktif et'}
                      >
                        {actionLoading === offering.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : offering.isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingOffering(offering)}
                        title="Duzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(offering)}
                        title="Sil"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === offering.id && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        {offering.description && (
                          <div>
                            <span className="font-medium text-gray-700">Aciklama:</span>
                            <p className="text-gray-600 mt-1">{offering.description}</p>
                          </div>
                        )}
                        {offering.detailedDescription && (
                          <div>
                            <span className="font-medium text-gray-700">Detayli Aciklama:</span>
                            <p className="text-gray-600 mt-1">{offering.detailedDescription}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Randevu Ayarlari:</span>
                          <ul className="text-gray-600 mt-1 space-y-1">
                            <li>En fazla {offering.maxBookingDaysAhead} gun ilerisi icin randevu</li>
                            <li>En az {offering.minNoticeHours} saat onceden bildirim</li>
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Musaitlik Programi:</span>
                          <p className="text-gray-600 mt-1">
                            {offering.availabilityTemplateId
                              ? 'Bu paket icin ozel musaitlik programi tanimlanmis.'
                              : 'Varsayilan musaitlik programi kullaniliyor.'}
                          </p>
                          <button
                            onClick={() => setScheduleOffering(offering)}
                            className="text-primary-600 hover:text-primary-800 text-sm mt-1 flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            {offering.availabilityTemplateId ? 'Programi Duzenle' : 'Ozel Program Tanimla'}
                          </button>
                        </div>
                        {offering.questions.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Booking Sorulari:</span>
                            <ul className="text-gray-600 mt-1 space-y-1">
                              {offering.questions.map(q => (
                                <li key={q.id} className="flex items-center gap-1">
                                  <HelpCircle className="w-3 h-3" />
                                  {q.questionText}
                                  {q.isRequired && <span className="text-red-500 text-xs">*</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <OfferingFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Edit Modal */}
      {editingOffering && (
        <OfferingFormModal
          offering={editingOffering}
          onClose={() => setEditingOffering(null)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Questions Modal */}
      {questionsOffering && (
        <QuestionsModal
          offering={questionsOffering}
          onClose={() => setQuestionsOffering(null)}
          onSuccess={() => {
            setQuestionsOffering(null);
            fetchOfferings();
          }}
        />
      )}

      {/* Schedule Editor Modal */}
      {scheduleOffering && (
        <ScheduleEditorModal
          offering={scheduleOffering}
          onClose={() => setScheduleOffering(null)}
          onSuccess={() => {
            setScheduleOffering(null);
            fetchOfferings();
          }}
        />
      )}
    </div>
  );
}

// ==================== OFFERING FORM MODAL ====================

function OfferingFormModal({
  offering,
  onClose,
  onSuccess,
}: {
  offering?: OfferingDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!offering;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OfferingFormData>({
    resolver: zodResolver(offeringSchema),
    defaultValues: offering
      ? {
          title: offering.title,
          subtitle: offering.subtitle || '',
          description: offering.description || '',
          detailedDescription: offering.detailedDescription || '',
          category: offering.category || '',
          sessionType: offering.sessionType || '',
          durationMin: offering.durationMin,
          price: offering.price,
          maxBookingDaysAhead: offering.maxBookingDaysAhead,
          minNoticeHours: offering.minNoticeHours,
          coverImageUrl: offering.coverImageUrl || '',
        }
      : {
          title: '',
          subtitle: '',
          description: '',
          detailedDescription: '',
          category: '',
          sessionType: '',
          durationMin: 60,
          price: 0,
          maxBookingDaysAhead: 60,
          minNoticeHours: 2,
          coverImageUrl: '',
        },
  });

  const onSubmit = async (data: OfferingFormData) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await offeringsApi.update(offering!.id, {
          title: data.title,
          description: data.description || undefined,
          durationMin: data.durationMin,
          price: data.price,
          category: data.category || undefined,
          subtitle: data.subtitle || undefined,
          detailedDescription: data.detailedDescription || undefined,
          sessionType: data.sessionType || undefined,
          maxBookingDaysAhead: data.maxBookingDaysAhead,
          minNoticeHours: data.minNoticeHours,
          coverImageUrl: data.coverImageUrl || undefined,
        });
        toast.success('Paket guncellendi');
      } else {
        await offeringsApi.create({
          title: data.title,
          description: data.description || undefined,
          durationMin: data.durationMin,
          price: data.price,
          category: data.category || undefined,
          subtitle: data.subtitle || undefined,
          detailedDescription: data.detailedDescription || undefined,
          sessionType: data.sessionType || undefined,
          maxBookingDaysAhead: data.maxBookingDaysAhead,
          minNoticeHours: data.minNoticeHours,
        });
        toast.success('Paket olusturuldu');
      }
      onSuccess();
    } catch {
      toast.error(isEdit ? 'Guncelleme basarisiz' : 'Olusturma basarisiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Paketi Duzenle' : 'Yeni Paket Olustur'}
      description={isEdit ? 'Paket bilgilerini guncelleyin' : 'Ogrencilerinize sunacaginiz yeni bir paket tanimlayun'}
      className="max-h-[70vh] overflow-y-auto"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Paket Adi *</label>
          <Input placeholder="orn: Matematik Mentorlugu" {...form.register('title')} />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium mb-1">Alt Baslik</label>
          <Input placeholder="orn: YKS Matematik Hazirlik" {...form.register('subtitle')} />
        </div>

        {/* Category & Session Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <Input placeholder="orn: Matematik" {...form.register('category')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Oturum Tipi</label>
            <Input placeholder="orn: Online, Yuz yuze" {...form.register('sessionType')} />
          </div>
        </div>

        {/* Duration & Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Sure (dakika) *</label>
            <Input type="number" min={15} max={180} {...form.register('durationMin')} />
            {form.formState.errors.durationMin && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.durationMin.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fiyat (TRY) *</label>
            <Input type="number" min={0} step="0.01" {...form.register('price')} />
            {form.formState.errors.price && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.price.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Kisa Aciklama</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            placeholder="Paketi kisa bir sekilde tanitin"
            {...form.register('description')}
          />
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Detayli Aciklama</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={4}
            placeholder="Paketin icerigini, kazanimlari, hedef kitleyi detayli anlatin"
            {...form.register('detailedDescription')}
          />
        </div>

        {/* Booking Settings */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3 text-gray-700">Randevu Ayarlari</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Max Ileri Gun</label>
              <Input type="number" min={1} max={365} {...form.register('maxBookingDaysAhead')} />
              <p className="text-xs text-gray-500 mt-1">Kac gun ilerisi icin randevu alinabilir</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Bildirim (saat)</label>
              <Input type="number" min={0} max={72} {...form.register('minNoticeHours')} />
              <p className="text-xs text-gray-500 mt-1">En az kac saat onceden alinmali</p>
            </div>
          </div>
        </div>

        {/* Cover Image URL */}
        {isEdit && (
          <div>
            <label className="block text-sm font-medium mb-1">Kapak Gorseli URL</label>
            <Input placeholder="https://..." {...form.register('coverImageUrl')} />
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Iptal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Guncelle' : 'Olustur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ==================== QUESTIONS MODAL ====================

function QuestionsModal({
  offering,
  onClose,
  onSuccess,
}: {
  offering: OfferingDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [questions, setQuestions] = useState<{ questionText: string; isRequired: boolean }[]>(
    offering.questions.map(q => ({ questionText: q.questionText, isRequired: q.isRequired }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newRequired, setNewRequired] = useState(false);

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    if (questions.length >= 4) {
      toast.warning('En fazla 4 soru eklenebilir');
      return;
    }
    setQuestions(prev => [...prev, { questionText: newQuestion.trim(), isRequired: newRequired }]);
    setNewQuestion('');
    setNewRequired(false);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await offeringsApi.upsertQuestions(offering.id, questions);
      toast.success('Sorular guncellendi');
      onSuccess();
    } catch {
      toast.error('Sorular guncellenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Booking Sorulari" /* QuestionsModal */
      description={`"${offering.title}" paketi icin ogrencilerin rezervasyon sirasinda cevaplayacagi sorular (max 4)`}
    >
      <div className="space-y-4">
        {/* Existing questions */}
        {questions.length > 0 && (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{q.questionText}</p>
                  <Badge variant={q.isRequired ? 'destructive' : 'secondary'} className="mt-1 text-xs">
                    {q.isRequired ? 'Zorunlu' : 'Opsiyonel'}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new question */}
        {questions.length < 4 && (
          <div className="border rounded-lg p-3 space-y-2">
            <Input
              placeholder="Yeni soru ekleyin..."
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQuestion(); } }}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={e => setNewRequired(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Zorunlu
              </label>
              <Button type="button" size="sm" variant="outline" onClick={addQuestion} disabled={!newQuestion.trim()}>
                <Plus className="w-3 h-3 mr-1" />
                Ekle
              </Button>
            </div>
          </div>
        )}

        {questions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Henuz soru eklenmedi. Ogrencilerden randevu sirasinda bilgi almak icin soru ekleyin.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Iptal
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ==================== SCHEDULE EDITOR MODAL ====================

const DAY_SHORT = ['Pz', 'Pt', 'Sa', 'Ca', 'Pe', 'Cu', 'Ct'];

interface WeeklyRule {
  dayOfWeek: number;
  isActive: boolean;
  blocks: { startTime: string; endTime: string }[];
}

function ScheduleEditorModal({
  offering,
  onClose,
  onSuccess,
}: {
  offering: OfferingDto;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: templateData, isLoading } = useOfferingTemplate(offering.id);
  const saveTemplate = useSaveOfferingTemplate();
  const deleteTemplate = useDeleteOfferingTemplate();

  const [useCustom, setUseCustom] = useState(false);
  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isActive: i >= 1 && i <= 5,
      blocks: i >= 1 && i <= 5 ? [{ startTime: '09:00', endTime: '17:00' }] : [],
    }))
  );
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    bufferAfterMin: 15,
    slotGranularityMin: 30,
    maxBookingsPerDay: 5,
    minNoticeHours: 2,
    maxBookingDaysAhead: 60,
  });

  // Load template data when it arrives
  useEffect(() => {
    if (templateData) {
      setUseCustom(templateData.hasCustomSchedule);
      if (templateData.rules && templateData.rules.length > 0) {
        const ruleMap = new Map<number, { startTime: string; endTime: string }[]>();
        templateData.rules.forEach((r) => {
          if (!ruleMap.has(r.dayOfWeek)) ruleMap.set(r.dayOfWeek, []);
          if (r.isActive && r.startTime && r.endTime) {
            ruleMap.get(r.dayOfWeek)!.push({ startTime: r.startTime, endTime: r.endTime });
          }
        });
        setWeeklyRules(
          Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            isActive: (ruleMap.get(i)?.length ?? 0) > 0,
            blocks: ruleMap.get(i) || [],
          }))
        );
      }
      if (templateData.settings) {
        setSettings({
          bufferAfterMin: templateData.settings.bufferAfterMin,
          slotGranularityMin: templateData.settings.slotGranularityMin,
          maxBookingsPerDay: templateData.settings.maxBookingsPerDay,
          minNoticeHours: templateData.settings.minNoticeHours,
          maxBookingDaysAhead: templateData.settings.maxBookingDaysAhead,
        });
      }
    }
  }, [templateData]);

  const toggleDay = (dayIndex: number) => {
    setWeeklyRules(prev => prev.map(r =>
      r.dayOfWeek === dayIndex
        ? {
            ...r,
            isActive: !r.isActive,
            blocks: !r.isActive && r.blocks.length === 0
              ? [{ startTime: '09:00', endTime: '17:00' }]
              : r.blocks,
          }
        : r
    ));
  };

  const updateBlock = (dayIndex: number, blockIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWeeklyRules(prev => prev.map(r =>
      r.dayOfWeek === dayIndex
        ? { ...r, blocks: r.blocks.map((b, i) => i === blockIndex ? { ...b, [field]: value } : b) }
        : r
    ));
  };

  const addBlock = (dayIndex: number) => {
    setWeeklyRules(prev => prev.map(r =>
      r.dayOfWeek === dayIndex
        ? { ...r, blocks: [...r.blocks, { startTime: '14:00', endTime: '18:00' }] }
        : r
    ));
  };

  const removeBlock = (dayIndex: number, blockIndex: number) => {
    setWeeklyRules(prev => prev.map(r =>
      r.dayOfWeek === dayIndex
        ? { ...r, blocks: r.blocks.filter((_, i) => i !== blockIndex), isActive: r.blocks.length > 1 }
        : r
    ));
  };

  const handleSave = async () => {
    if (!useCustom) {
      // Revert to default: delete custom template
      if (templateData?.hasCustomSchedule) {
        try {
          await deleteTemplate.mutateAsync(offering.id);
          toast.success('Varsayilan programa donuldu');
          onSuccess();
        } catch {
          toast.error('Islem basarisiz');
        }
      } else {
        onClose();
      }
      return;
    }

    // Save custom template
    const rules: { dayOfWeek: number; isActive: boolean; startTime: string | null; endTime: string | null; slotIndex?: number }[] =
      weeklyRules.flatMap(r =>
        r.isActive && r.blocks.length > 0
          ? r.blocks.map((b, i) => ({
              dayOfWeek: r.dayOfWeek,
              isActive: true as boolean,
              startTime: b.startTime as string | null,
              endTime: b.endTime as string | null,
              slotIndex: i,
            }))
          : [{ dayOfWeek: r.dayOfWeek, isActive: false as boolean, startTime: null as string | null, endTime: null as string | null, slotIndex: 0 }]
      );

    try {
      await saveTemplate.mutateAsync({
        offeringId: offering.id,
        data: {
          name: `${offering.title} Programi`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          rules,
          settings,
        },
      });
      toast.success('Ozel musaitlik programi kaydedildi!');
      onSuccess();
    } catch {
      toast.error('Program kaydedilirken hata olustu');
    }
  };

  const isSaving = saveTemplate.isPending || deleteTemplate.isPending;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Musaitlik Programi: ${offering.title}`}
      description="Bu paket icin varsayilan veya ozel musaitlik programi belirleyin"
      className="max-h-[80vh] overflow-y-auto"
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Schedule Type Toggle */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUseCustom(false)}
              className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${
                !useCustom
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">Varsayilan Program</div>
              <div className="text-xs text-gray-500 mt-1">
                Musaitlik sayfasindaki genel programi kullan
              </div>
            </button>
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${
                useCustom
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Ozel Program
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Bu paket icin farkli gunler ve saatler belirle
              </div>
            </button>
          </div>

          {/* Custom Schedule Editor */}
          {useCustom && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700">Haftalik Program</h4>

              {weeklyRules.map(rule => (
                <div
                  key={rule.dayOfWeek}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
                    rule.isActive ? 'bg-white border-purple-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDay(rule.dayOfWeek)}
                    className={`mt-1 w-16 text-left font-medium text-sm flex items-center gap-1.5 ${
                      rule.isActive ? 'text-purple-700' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        rule.isActive ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                      }`}
                    >
                      {rule.isActive && <span className="text-white text-[9px]">✓</span>}
                    </div>
                    <span>{DAY_SHORT[rule.dayOfWeek]}</span>
                  </button>

                  <div className="flex-1">
                    {rule.isActive ? (
                      <div className="space-y-1.5">
                        {rule.blocks.map((block, blockIdx) => (
                          <div key={blockIdx} className="flex items-center gap-1.5">
                            <Input
                              type="time"
                              value={block.startTime}
                              onChange={e => updateBlock(rule.dayOfWeek, blockIdx, 'startTime', e.target.value)}
                              className="w-24 h-7 text-xs"
                            />
                            <span className="text-gray-400 text-xs">-</span>
                            <Input
                              type="time"
                              value={block.endTime}
                              onChange={e => updateBlock(rule.dayOfWeek, blockIdx, 'endTime', e.target.value)}
                              className="w-24 h-7 text-xs"
                            />
                            {rule.blocks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBlock(rule.dayOfWeek, blockIdx)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addBlock(rule.dayOfWeek)}
                          className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Ekle
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 mt-1 block">Kapali</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Advanced Settings */}
              <div className="pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {showSettings ? 'Ayarlari Gizle' : 'Gelismis Ayarlar'}
                </button>
                {showSettings && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-gray-500 mb-0.5 block">Arasi Tampon (dk)</label>
                      <Input
                        type="number"
                        min={0}
                        value={settings.bufferAfterMin}
                        onChange={e => setSettings(s => ({ ...s, bufferAfterMin: parseInt(e.target.value) || 0 }))}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 mb-0.5 block">Slot Aralik (dk)</label>
                      <Input
                        type="number"
                        min={5}
                        value={settings.slotGranularityMin}
                        onChange={e => setSettings(s => ({ ...s, slotGranularityMin: parseInt(e.target.value) || 30 }))}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 mb-0.5 block">Max Gunluk Ders</label>
                      <Input
                        type="number"
                        min={1}
                        value={settings.maxBookingsPerDay}
                        onChange={e => setSettings(s => ({ ...s, maxBookingsPerDay: parseInt(e.target.value) || 5 }))}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 mb-0.5 block">Max Ileri Gun</label>
                      <Input
                        type="number"
                        min={1}
                        value={settings.maxBookingDaysAhead}
                        onChange={e => setSettings(s => ({ ...s, maxBookingDaysAhead: parseInt(e.target.value) || 60 }))}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Not using custom - show info */}
          {!useCustom && templateData?.hasCustomSchedule && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>Not:</strong> Bu pakete tanimli ozel program silinecek ve varsayilan programa donulecek.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {useCustom ? (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Programi Kaydet
                </>
              ) : (
                'Kaydet'
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
