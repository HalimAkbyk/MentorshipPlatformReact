'use client';

import { useState } from 'react';
import { useCreateSessionPlan, useSessionPlanTemplates, useCreateSessionPlanFromTemplate } from '@/lib/hooks/use-session-plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X, Loader2, FileText, ChevronRight } from 'lucide-react';

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  defaultBookingId?: string;
  defaultGroupClassId?: string;
}

export function CreatePlanDialog({ open, onClose, onCreated, defaultBookingId, defaultGroupClassId }: CreatePlanDialogProps) {
  const createMutation = useCreateSessionPlan();
  const createFromTemplateMutation = useCreateSessionPlanFromTemplate();
  const { data: templates } = useSessionPlanTemplates();

  const [activeTab, setActiveTab] = useState<'new' | 'template'>('new');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    bookingId: defaultBookingId || '',
    groupClassId: defaultGroupClassId || '',
    preSessionNote: '',
    sessionObjective: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      bookingId: defaultBookingId || '',
      groupClassId: defaultGroupClassId || '',
      preSessionNote: '',
      sessionObjective: '',
    });
    setSelectedTemplateId(null);
    setActiveTab('new');
  };

  if (!open) return null;

  const templateList = templates ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Baslik zorunludur');
      return;
    }

    try {
      const id = await createMutation.mutateAsync({
        title: form.title.trim(),
        bookingId: form.bookingId.trim() || undefined,
        groupClassId: form.groupClassId.trim() || undefined,
        preSessionNote: form.preSessionNote.trim() || undefined,
        sessionObjective: form.sessionObjective.trim() || undefined,
      });

      toast.success('Oturum plani olusturuldu');
      resetForm();
      onClose();
      onCreated?.(id);
    } catch {
      // error handled by interceptor
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const id = await createFromTemplateMutation.mutateAsync({
        templateId,
        data: {
          title: form.title.trim() || undefined,
          bookingId: form.bookingId.trim() || undefined,
          groupClassId: form.groupClassId.trim() || undefined,
        },
      });
      toast.success('Sablondan plan olusturuldu');
      resetForm();
      onClose();
      onCreated?.(id);
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Yeni Oturum Plani</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { resetForm(); onClose(); }}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Tab switcher */}
          <div className="flex gap-1 mb-4">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'new' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sifirdan Olustur
            </button>
            {templateList.length > 0 && (
              <button
                onClick={() => setActiveTab('template')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'template' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sablondan Baslat ({templateList.length})
              </button>
            )}
          </div>

          {activeTab === 'template' ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">Mevcut sablonlarinizdan birini secin:</p>

              {/* Optional title override for template */}
              <div>
                <label className="text-xs font-medium text-gray-600">Yeni Baslik (opsiyonel)</label>
                <Input
                  placeholder="Bos birakilirsa sablon basligi kullanilir"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="text-sm h-8 mt-1"
                />
              </div>

              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                {templateList.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleCreateFromTemplate(tpl.id)}
                    disabled={createFromTemplateMutation.isPending}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 border border-gray-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{tpl.title}</div>
                      <div className="text-[10px] text-gray-400">
                        {tpl.materialCount} materyal
                        {tpl.sessionObjective && ` - ${tpl.sessionObjective.substring(0, 50)}...`}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {createFromTemplateMutation.isPending && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600 mr-2" />
                  <span className="text-xs text-gray-500">Olusturuluyor...</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium">Baslik *</label>
                <Input
                  placeholder="Ornegin: Matematik - Turev Konusu"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                />
              </div>

              {/* Booking ID — hide if pre-filled from classroom */}
              {!defaultBookingId && (
                <div>
                  <label className="text-sm font-medium">Seans ID (Opsiyonel)</label>
                  <Input
                    placeholder="Bir seansa baglamak icin seans ID girin"
                    value={form.bookingId}
                    onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Bos birakilabilir, sonra baglanabilir</p>
                </div>
              )}

              {/* Group Class ID — hide if pre-filled from classroom */}
              {!defaultGroupClassId && (
                <div>
                  <label className="text-sm font-medium">Grup Ders ID (Opsiyonel)</label>
                  <Input
                    placeholder="Bir grup dersine baglamak icin ID girin"
                    value={form.groupClassId}
                    onChange={(e) => setForm({ ...form, groupClassId: e.target.value })}
                  />
                </div>
              )}

              {/* Session Objective */}
              <div>
                <label className="text-sm font-medium">Seans Hedefi</label>
                <Input
                  placeholder="Bu seansin hedefi nedir?"
                  value={form.sessionObjective}
                  onChange={(e) => setForm({ ...form, sessionObjective: e.target.value })}
                  maxLength={500}
                />
              </div>

              {/* Pre Session Note */}
              <div>
                <label className="text-sm font-medium">Seans Oncesi Notu</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm mt-1 min-h-[80px]"
                  placeholder="Ogrenci seanstan once neler hazirlamali?"
                  value={form.preSessionNote}
                  onChange={(e) => setForm({ ...form, preSessionNote: e.target.value })}
                  maxLength={2000}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Olusturuluyor...
                    </>
                  ) : (
                    'Olustur'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>
                  Iptal
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
