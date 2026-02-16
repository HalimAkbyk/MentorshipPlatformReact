'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Lock, Save, Clock, X, Ban, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useMyAvailability,
  useDeleteSlot,
  useAvailabilityTemplate,
  useSaveTemplate,
  useAddOverride,
  useDeleteOverride,
} from '@/lib/hooks/use-availability';
import { toast } from 'sonner';
import { mentorsApi } from '@/lib/api/mentors';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventContentArg } from '@fullcalendar/core';

const DAY_SHORT = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
const DAY_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * Get this week's date for a given day-of-week index (0=Sun, 1=Mon, ...)
 * Returns the date and whether it's in the past or today.
 */
function getWeekDateForDay(dayIndex: number): { date: Date; isPast: boolean; isToday: boolean } {
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun
  const diff = dayIndex - todayDow;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);
  date.setHours(0, 0, 0, 0);

  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  return {
    date,
    isPast: date < todayStart,
    isToday: date.getTime() === todayStart.getTime(),
  };
}

interface WeeklyRule {
  dayOfWeek: number;
  isActive: boolean;
  blocks: { startTime: string; endTime: string }[];
}

export default function AvailabilityPage() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);

  const [isApproved, setIsApproved] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(true);

  const { data: template, isLoading: templateLoading } = useAvailabilityTemplate();
  const saveTemplate = useSaveTemplate();
  const addOverride = useAddOverride();
  const deleteOverride = useDeleteOverride();

  const { data: slots } = useMyAvailability();
  const deleteSlot = useDeleteSlot();

  const [weeklyRules, setWeeklyRules] = useState<WeeklyRule[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isActive: i >= 1 && i <= 5,
      blocks: i >= 1 && i <= 5 ? [{ startTime: '09:00', endTime: '17:00' }] : [],
    }))
  );

  const [overrideModal, setOverrideModal] = useState<{
    open: boolean; date: string; isBlocked: boolean;
    startTime: string; endTime: string; reason: string;
  }>({ open: false, date: '', isBlocked: true, startTime: '09:00', endTime: '17:00', reason: '' });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean; slotId: string | null; isDeleting: boolean;
  }>({ open: false, slotId: null, isDeleting: false });

  const [activeTab, setActiveTab] = useState<'schedule' | 'calendar'>('schedule');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    minNoticeHours: 2, maxBookingDaysAhead: 60,
    bufferAfterMin: 15, slotGranularityMin: 30, maxBookingsPerDay: 5,
  });

  useEffect(() => {
    (async () => {
      try {
        const profile = await mentorsApi.getMyProfile();
        setIsApproved(profile.isApprovedForBookings);
      } catch { setIsApproved(false); }
      finally { setIsCheckingApproval(false); }
    })();
  }, []);

  useEffect(() => {
    if (template) {
      const ruleMap = new Map<number, { startTime: string; endTime: string }[]>();
      template.rules.forEach((r) => {
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
      setSettings({
        minNoticeHours: template.settings.minNoticeHours,
        maxBookingDaysAhead: template.settings.maxBookingDaysAhead,
        bufferAfterMin: template.settings.bufferAfterMin,
        slotGranularityMin: template.settings.slotGranularityMin,
        maxBookingsPerDay: template.settings.maxBookingsPerDay,
      });
    }
  }, [template]);

  // ---- Handlers ----
  const toggleDay = (dayIndex: number) => {
    setWeeklyRules(prev => prev.map(r =>
      r.dayOfWeek === dayIndex
        ? { ...r, isActive: !r.isActive, blocks: !r.isActive && r.blocks.length === 0 ? [{ startTime: '09:00', endTime: '17:00' }] : r.blocks }
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
      r.dayOfWeek === dayIndex ? { ...r, blocks: [...r.blocks, { startTime: '14:00', endTime: '18:00' }] } : r
    ));
  };

  const removeBlock = (dayIndex: number, blockIndex: number) => {
    setWeeklyRules(prev => prev.map(r =>
      r.dayOfWeek === dayIndex
        ? { ...r, blocks: r.blocks.filter((_, i) => i !== blockIndex), isActive: r.blocks.length > 1 }
        : r
    ));
  };

  const applyToAll = () => {
    const activeRule = weeklyRules.find(r => r.isActive && r.blocks.length > 0);
    if (!activeRule) { toast.error('Önce en az bir gün için saat belirleyin'); return; }
    setWeeklyRules(prev => prev.map(r => ({ ...r, isActive: true, blocks: [...activeRule.blocks] })));
    toast.success('Tüm günlere uygulandı');
  };

  const handleSaveTemplate = async () => {
    const rules: { dayOfWeek: number; isActive: boolean; startTime: string | null; endTime: string | null; slotIndex?: number }[] =
      weeklyRules.flatMap(r =>
        r.isActive && r.blocks.length > 0
          ? r.blocks.map((b, i) => ({ dayOfWeek: r.dayOfWeek, isActive: true as boolean, startTime: b.startTime as string | null, endTime: b.endTime as string | null, slotIndex: i }))
          : [{ dayOfWeek: r.dayOfWeek, isActive: false as boolean, startTime: null as string | null, endTime: null as string | null, slotIndex: 0 }]
      );
    try {
      await saveTemplate.mutateAsync({
        name: 'Varsayılan Program',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        rules,
        settings,
      });
      toast.success('Müsaitlik programı kaydedildi ve slotlar oluşturuldu!');
    } catch (err: any) {
      console.error('Template save error:', err);
      // Axios interceptor already shows toast for 500/403/401,
      // but show a fallback for other cases
      const status = err?.response?.status;
      if (!status || (status !== 500 && status !== 401 && status !== 403)) {
        toast.error('Program kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleOverrideSave = async () => {
    try {
      await addOverride.mutateAsync({
        date: overrideModal.date,
        isBlocked: overrideModal.isBlocked,
        startTime: overrideModal.isBlocked ? undefined : overrideModal.startTime,
        endTime: overrideModal.isBlocked ? undefined : overrideModal.endTime,
        reason: overrideModal.reason || undefined,
      });
      toast.success(overrideModal.isBlocked ? 'Gün kapatıldı' : 'Özel saat eklendi');
      setOverrideModal(prev => ({ ...prev, open: false }));
    } catch (err: any) {
      console.error('Override save error:', err);
      const status = err?.response?.status;
      if (!status || (status !== 500 && status !== 401 && status !== 403)) {
        toast.error('Özel gün eklenirken bir hata oluştu.');
      }
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteModal.slotId) return;
    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }));
      await deleteSlot.mutateAsync(deleteModal.slotId);
      toast.success('Slot silindi');
      setDeleteModal({ open: false, slotId: null, isDeleting: false });
    } catch (err: any) {
      console.error('Delete slot error:', err);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Calendar events
  const calendarEvents = useMemo(() => {
    if (!slots) return [];
    return slots.map((s: any) => ({
      id: s.id,
      title: s.isBooked ? 'Rezerve' : 'Müsait',
      start: s.startAt,
      end: s.endAt,
      backgroundColor: s.isBooked ? '#DBEAFE' : '#D1FAE5',
      borderColor: s.isBooked ? '#2563EB' : '#16A34A',
      textColor: s.isBooked ? '#1E40AF' : '#166534',
      extendedProps: { type: 'availability', isBooked: s.isBooked, slotId: s.id },
    }));
  }, [slots]);

  const overrideEvents = useMemo(() => {
    if (!template?.overrides) return [];
    return template.overrides.map(o => ({
      id: `override-${o.id}`,
      title: o.isBlocked ? `🚫 ${o.reason || 'Kapalı'}` : `⏰ ${o.startTime}-${o.endTime}`,
      start: o.date,
      allDay: o.isBlocked,
      backgroundColor: o.isBlocked ? '#FEE2E2' : '#FEF3C7',
      borderColor: o.isBlocked ? '#DC2626' : '#F59E0B',
      textColor: o.isBlocked ? '#991B1B' : '#92400E',
      display: 'background' as const,
      extendedProps: { type: 'override', overrideId: o.id },
    }));
  }, [template?.overrides]);

  const renderEventContent = (arg: EventContentArg) => {
    const props = arg.event.extendedProps;
    if (props.type === 'availability') {
      return (
        <div className="p-0.5 text-[11px] leading-tight">
          <div className="flex items-center gap-1">
            {props.isBooked && <Lock className="w-3 h-3" />}
            <span className="font-medium">{props.isBooked ? 'Rezerve' : 'Müsait'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isCheckingApproval || templateLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-yellow-900 mb-2">Uygunluk Ayarları Kilitli</CardTitle>
                <CardDescription className="text-yellow-800">
                  Doğrulama belgelerinizin admin tarafından onaylanması gerekmektedir.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/mentor/dashboard')}>Dashboard&apos;a Dön</Button>
              <Button variant="outline" onClick={() => router.push('/auth/onboarding/mentor?step=verification')}>Belgeleri Yükle</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-1">Müsaitlik Yönetimi</h1>
          <p className="text-gray-600">Haftalık programınızı belirleyin, slotlar otomatik oluşturulsun</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === 'schedule' ? 'default' : 'outline'} onClick={() => setActiveTab('schedule')} size="sm">
            <Clock className="w-4 h-4 mr-1" /> Haftalık Program
          </Button>
          <Button variant={activeTab === 'calendar' ? 'default' : 'outline'} onClick={() => setActiveTab('calendar')} size="sm">
            <CalendarIcon className="w-4 h-4 mr-1" /> Takvim
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <CalendarIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-blue-800 font-medium">Varsayilan Musaitlik Programi</p>
          <p className="text-xs text-blue-600 mt-1">
            Bu program, ozel musaitlik programi tanimlanmamis paketlere uygulanir.
            Paketlerinize ozel program tanimlamak icin{' '}
            <button
              onClick={() => router.push('/mentor/offerings')}
              className="underline hover:text-blue-800 font-medium"
            >
              Paketlerim
            </button>{' '}
            sayfasini ziyaret edin.
          </p>
        </div>
      </div>

      {/* ===== TAB 1: WEEKLY SCHEDULE ===== */}
      {activeTab === 'schedule' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Haftalık Program</CardTitle>
                    <CardDescription>Her gün için müsait olduğunuz saatleri belirleyin. Bu şablon, bugünden itibaren {settings.maxBookingDaysAhead} gün ileriye uygulanır. Geçmiş günler sadece gelecek haftalarda geçerlidir.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={applyToAll}>Tüm Günlere Uygula</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyRules.map(rule => {
                  const weekInfo = getWeekDateForDay(rule.dayOfWeek);
                  const dateStr = weekInfo.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                  return (
                  <div key={rule.dayOfWeek} className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${rule.isActive ? 'bg-white border-primary-200' : 'bg-gray-50 border-gray-200'} ${weekInfo.isPast ? 'opacity-60' : ''}`}>
                    <button onClick={() => toggleDay(rule.dayOfWeek)} className={`mt-1 w-28 text-left font-medium text-sm flex items-center gap-2 ${rule.isActive ? 'text-primary-700' : 'text-gray-400'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${rule.isActive ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                        {rule.isActive && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span>{DAY_SHORT[rule.dayOfWeek]}</span>
                        <span className={`text-[10px] font-normal ${weekInfo.isToday ? 'text-green-600 font-semibold' : weekInfo.isPast ? 'text-gray-400' : 'text-gray-400'}`}>
                          {weekInfo.isToday ? 'Bugün' : dateStr}
                        </span>
                      </div>
                    </button>
                    <div className="flex-1">
                      {rule.isActive ? (
                        <div className="space-y-2">
                          {rule.blocks.map((block, blockIdx) => (
                            <div key={blockIdx} className="flex items-center gap-2">
                              <Input type="time" value={block.startTime} onChange={e => updateBlock(rule.dayOfWeek, blockIdx, 'startTime', e.target.value)} className="w-28 h-8 text-sm" />
                              <span className="text-gray-400">–</span>
                              <Input type="time" value={block.endTime} onChange={e => updateBlock(rule.dayOfWeek, blockIdx, 'endTime', e.target.value)} className="w-28 h-8 text-sm" />
                              {rule.blocks.length > 1 && (
                                <button onClick={() => removeBlock(rule.dayOfWeek, blockIdx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>
                          ))}
                          <button onClick={() => addBlock(rule.dayOfWeek)} className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Zaman aralığı ekle
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 mt-1 block">Kapalı</span>
                      )}
                    </div>
                  </div>
                  );
                })}

                {/* Settings */}
                <div className="pt-4 border-t">
                  <button onClick={() => setShowSettings(!showSettings)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <Settings2 className="w-4 h-4" /> {showSettings ? 'Ayarları Gizle' : 'Gelişmiş Ayarlar'}
                  </button>
                  {showSettings && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Min. Bildirim (saat)</label>
                        <Input type="number" min={0} value={settings.minNoticeHours} onChange={e => setSettings(s => ({ ...s, minNoticeHours: parseInt(e.target.value) || 0 }))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Max İleri Gün</label>
                        <Input type="number" min={1} value={settings.maxBookingDaysAhead} onChange={e => setSettings(s => ({ ...s, maxBookingDaysAhead: parseInt(e.target.value) || 60 }))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Arası Tampon (dk)</label>
                        <Input type="number" min={0} value={settings.bufferAfterMin} onChange={e => setSettings(s => ({ ...s, bufferAfterMin: parseInt(e.target.value) || 0 }))} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Max Günlük Ders</label>
                        <Input type="number" min={1} value={settings.maxBookingsPerDay} onChange={e => setSettings(s => ({ ...s, maxBookingsPerDay: parseInt(e.target.value) || 5 }))} className="h-8 text-sm" />
                      </div>
                    </div>
                  )}
                </div>

                <Button type="button" onClick={handleSaveTemplate} className="w-full mt-4" disabled={saveTemplate.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveTemplate.isPending ? 'Kaydediliyor...' : 'Programı Kaydet & Slotları Oluştur'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Overrides + Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Özel Günler / Tatiller</CardTitle>
                <CardDescription className="text-xs">Takvim sekmesinde tarihe tıklayarak özel gün ekleyin</CardDescription>
              </CardHeader>
              <CardContent>
                {template?.overrides && template.overrides.length > 0 ? (
                  <div className="space-y-2">
                    {template.overrides.map(o => (
                      <div key={o.id} className={`flex items-center justify-between p-2 rounded text-sm ${o.isBlocked ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        <div>
                          <div className="font-medium">
                            {new Date(o.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' })}
                          </div>
                          <div className="text-xs">
                            {o.isBlocked ? 'Kapalı' : `${o.startTime} - ${o.endTime}`}
                            {o.reason && ` · ${o.reason}`}
                          </div>
                        </div>
                        <button onClick={() => o.id && deleteOverride.mutate(o.id)} className="hover:text-red-800"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Henüz özel gün eklenmemiş.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">{slots?.filter((s: any) => !s.isBooked).length || 0}</div>
                    <div className="text-xs text-gray-500">Müsait Slot</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{slots?.filter((s: any) => s.isBooked).length || 0}</div>
                    <div className="text-xs text-gray-500">Rezerve Slot</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== TAB 2: CALENDAR VIEW ===== */}
      {activeTab === 'calendar' && (
        <Card>
          <CardContent className="pt-6">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{ left: 'prev,today,next', center: 'title', right: 'timeGridWeek,dayGridMonth,listWeek' }}
              locale="tr"
              firstDay={1}
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              slotDuration="00:30:00"
              allDaySlot={false}
              height="auto"
              contentHeight={600}
              expandRows
              events={[...calendarEvents, ...overrideEvents]}
              eventContent={renderEventContent}
              dateClick={(info) => {
                setOverrideModal({ open: true, date: info.dateStr.slice(0, 10), isBlocked: true, startTime: '09:00', endTime: '17:00', reason: '' });
              }}
              eventClick={(info) => {
                const props = info.event.extendedProps;
                if (props.type === 'availability' && !props.isBooked) {
                  setDeleteModal({ open: true, slotId: props.slotId, isDeleting: false });
                }
              }}
              buttonText={{ today: 'Bugün', month: 'Ay', week: 'Hafta', list: 'Liste' }}
              noEventsText="Bu dönemde slot yok"
            />
            <div className="mt-4 flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-600" /> Müsait</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-600" /> Rezerve</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-600" /> Kapalı</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== OVERRIDE MODAL ===== */}
      {overrideModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {new Date(overrideModal.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={overrideModal.isBlocked ? 'default' : 'outline'} size="sm" onClick={() => setOverrideModal(p => ({ ...p, isBlocked: true }))}>
                  <Ban className="w-4 h-4 mr-1" /> Günü Kapat
                </Button>
                <Button variant={!overrideModal.isBlocked ? 'default' : 'outline'} size="sm" onClick={() => setOverrideModal(p => ({ ...p, isBlocked: false }))}>
                  <Clock className="w-4 h-4 mr-1" /> Özel Saat
                </Button>
              </div>
              {!overrideModal.isBlocked && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Başlangıç</label>
                    <Input type="time" value={overrideModal.startTime} onChange={e => setOverrideModal(p => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Bitiş</label>
                    <Input type="time" value={overrideModal.endTime} onChange={e => setOverrideModal(p => ({ ...p, endTime: e.target.value }))} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Açıklama (opsiyonel)</label>
                <Input placeholder="ör: Resmi tatil, Bayram" value={overrideModal.reason} onChange={e => setOverrideModal(p => ({ ...p, reason: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleOverrideSave} disabled={addOverride.isPending} className="flex-1">
                {addOverride.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button variant="outline" onClick={() => setOverrideModal(p => ({ ...p, open: false }))}>İptal</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, slotId: null, isDeleting: false })}
        onConfirm={handleDeleteSlot}
        title="Slot'u Sil"
        description="Bu müsaitlik slotunu silmek istediğinizden emin misiniz?"
        confirmText="Evet, Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}
