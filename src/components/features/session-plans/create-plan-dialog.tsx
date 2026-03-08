'use client';

import { useState, useMemo } from 'react';
import { useCreateSessionPlan, useSessionPlanTemplates, useCreateSessionPlanFromTemplate } from '@/lib/hooks/use-session-plans';
import { useBookings } from '@/lib/hooks/use-bookings';
import { useMyGroupClasses } from '@/lib/hooks/use-classes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X, Loader2, FileText, ChevronRight, Search } from 'lucide-react';

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

  // Fetch bookings and classes for dropdown (only when no defaults)
  const { data: bookingsData } = useBookings(undefined, 1, 50, 'mentor');
  const { data: classesData } = useMyGroupClasses(undefined, 1, 50);

  const [activeTab, setActiveTab] = useState<'new' | 'template'>('new');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceType, setResourceType] = useState<'booking' | 'class' | 'none'>(
    defaultBookingId ? 'booking' : defaultGroupClassId ? 'class' : 'none'
  );

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
    setResourceSearch('');
    setResourceType(defaultBookingId ? 'booking' : defaultGroupClassId ? 'class' : 'none');
  };

  if (!open) return null;

  const templateList = templates ?? [];

  // Filter bookings: Confirmed status, future or recent
  const bookingOptions = useMemo(() => {
    if (!bookingsData?.items) return [];
    return bookingsData.items
      .filter((b: any) => b.status === 'Confirmed' || b.status === 'Completed')
      .filter((b: any) => {
        if (!resourceSearch) return true;
        const search = resourceSearch.toLowerCase();
        return b.studentName?.toLowerCase().includes(search) ||
          b.startAt?.includes(search);
      })
      .slice(0, 20);
  }, [bookingsData, resourceSearch]);

  const classOptions = useMemo(() => {
    if (!classesData?.items) return [];
    return classesData.items
      .filter((c: any) => c.status === 'Published' || c.status === 'Completed')
      .filter((c: any) => {
        if (!resourceSearch) return true;
        const search = resourceSearch.toLowerCase();
        return c.title?.toLowerCase().includes(search) ||
          c.category?.toLowerCase().includes(search);
      })
      .slice(0, 20);
  }, [classesData, resourceSearch]);

  const handleSelectBooking = (id: string) => {
    setForm({ ...form, bookingId: id, groupClassId: '' });
    setResourceType('booking');
    setResourceSearch('');
  };

  const handleSelectClass = (id: string) => {
    setForm({ ...form, groupClassId: id, bookingId: '' });
    setResourceType('class');
    setResourceSearch('');
  };

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
      onCreated?.(id);
      resetForm();
      onClose();
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
      onCreated?.(id);
      resetForm();
      onClose();
    } catch {
      // error handled by interceptor
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  const hasDefaults = !!defaultBookingId || !!defaultGroupClassId;

  // Find selected resource label
  const selectedBooking = bookingsData?.items?.find((b: any) => b.id === form.bookingId);
  const selectedClass = classesData?.items?.find((c: any) => c.id === form.groupClassId);

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
                <label className="text-sm font-medium text-gray-700">Baslik *</label>
                <Input
                  placeholder="Ornegin: Matematik - Turev Konusu"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={200}
                  className="text-gray-900"
                />
              </div>

              {/* Resource picker — searchable dropdown (hide if pre-filled) */}
              {!hasDefaults && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Seansa / Derse Bagla (Opsiyonel)</label>

                  {/* Show selected resource */}
                  {form.bookingId && selectedBooking && (
                    <div className="mt-1 flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-lg">
                      <span className="text-xs text-teal-700 flex-1">
                        1:1 Seans — {(selectedBooking as any).studentName} — {formatDate((selectedBooking as any).startAt)}
                      </span>
                      <button type="button" onClick={() => setForm({ ...form, bookingId: '', groupClassId: '' })} className="text-teal-500 hover:text-teal-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {form.groupClassId && selectedClass && (
                    <div className="mt-1 flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded-lg">
                      <span className="text-xs text-teal-700 flex-1">
                        Grup Dersi — {(selectedClass as any).title} — {formatDate((selectedClass as any).startAt)}
                      </span>
                      <button type="button" onClick={() => setForm({ ...form, bookingId: '', groupClassId: '' })} className="text-teal-500 hover:text-teal-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Search input + dropdown */}
                  {!form.bookingId && !form.groupClassId && (
                    <div className="mt-1 relative">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                        <Input
                          placeholder="Seans veya ders ara..."
                          value={resourceSearch}
                          onChange={(e) => setResourceSearch(e.target.value)}
                          className="pl-8 text-sm text-gray-900"
                        />
                      </div>

                      {/* Dropdown results */}
                      <div className="mt-1 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg">
                        {bookingOptions.length > 0 && (
                          <>
                            <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                              1:1 Seanslar
                            </div>
                            {bookingOptions.map((b: any) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => handleSelectBooking(b.id)}
                                className="w-full text-left px-3 py-2 hover:bg-teal-50 text-sm border-b border-gray-50"
                              >
                                <div className="font-medium text-gray-800">{b.studentName}</div>
                                <div className="text-[10px] text-gray-400">{formatDate(b.startAt)} — {b.durationMin} dk</div>
                              </button>
                            ))}
                          </>
                        )}

                        {classOptions.length > 0 && (
                          <>
                            <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                              Grup Dersleri
                            </div>
                            {classOptions.map((c: any) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectClass(c.id)}
                                className="w-full text-left px-3 py-2 hover:bg-teal-50 text-sm border-b border-gray-50"
                              >
                                <div className="font-medium text-gray-800">{c.title}</div>
                                <div className="text-[10px] text-gray-400">{formatDate(c.startAt)} — {c.category}</div>
                              </button>
                            ))}
                          </>
                        )}

                        {bookingOptions.length === 0 && classOptions.length === 0 && (
                          <div className="px-3 py-4 text-center text-xs text-gray-400">
                            Seans veya ders bulunamadi
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Session Objective */}
              <div>
                <label className="text-sm font-medium text-gray-700">Seans Hedefi</label>
                <Input
                  placeholder="Bu seansin hedefi nedir?"
                  value={form.sessionObjective}
                  onChange={(e) => setForm({ ...form, sessionObjective: e.target.value })}
                  maxLength={500}
                  className="text-gray-900"
                />
              </div>

              {/* Pre Session Note */}
              <div>
                <label className="text-sm font-medium text-gray-700">Seans Oncesi Notu</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1 min-h-[80px] text-gray-900 placeholder-gray-400"
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
