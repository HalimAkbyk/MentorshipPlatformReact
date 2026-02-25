'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { availabilityApi, type ComputedTimeSlot } from '@/lib/api/availability';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, startOfDay, addDays, isSameDay, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils/cn';

interface RescheduleCalendarProps {
  mentorUserId: string;
  offeringId: string;
  remainingCount: number;
  totalCount?: number;
  isMentor?: boolean;
  isPending: boolean;
  onConfirm: (slot: ComputedTimeSlot) => void;
  onCancel: () => void;
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function RescheduleCalendar({
  mentorUserId,
  offeringId,
  remainingCount,
  totalCount = 2,
  isMentor = false,
  isPending,
  onConfirm,
  onCancel,
}: RescheduleCalendarProps) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const maxDate = addDays(today, 30);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(tomorrow));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<ComputedTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ComputedTimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad with empty slots for alignment (week starts on Monday)
    const firstDayOfWeek = getDay(monthStart); // 0=Sun, 1=Mon, ...
    const padding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Mon-based

    return { days, padding };
  }, [currentMonth]);

  // Check if we can navigate to previous/next month
  const canGoPrev = isSameMonth(currentMonth, tomorrow) ? false : isSameMonth(currentMonth, startOfMonth(tomorrow)) ? false : !isBefore(startOfMonth(currentMonth), startOfMonth(tomorrow));
  const canGoNext = isBefore(startOfMonth(addMonths(currentMonth, 1)), addMonths(startOfMonth(maxDate), 1));

  // Preload availability for visible month
  useEffect(() => {
    const loadMonthAvailability = async () => {
      setLoadingAvailability(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const daysToCheck = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(d => !isBefore(d, tomorrow) && !isBefore(maxDate, d));

      const available = new Set<string>();

      // Check availability in parallel (batch of 5)
      const batchSize = 5;
      for (let i = 0; i < daysToCheck.length; i += batchSize) {
        const batch = daysToCheck.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            try {
              const daySlots = await availabilityApi.getAvailableTimeSlots(mentorUserId, offeringId, dateStr);
              if (daySlots.length > 0) {
                available.add(dateStr);
              }
            } catch {
              // ignore errors
            }
          })
        );
      }

      setAvailableDays(available);
      setLoadingAvailability(false);
    };

    loadMonthAvailability();
  }, [currentMonth, mentorUserId, offeringId]);

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const result = await availabilityApi.getAvailableTimeSlots(mentorUserId, offeringId, dateStr);
        setSlots(result);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, mentorUserId, offeringId]);

  const isDaySelectable = useCallback((day: Date) => {
    if (isBefore(day, tomorrow)) return false;
    if (isBefore(maxDate, day)) return false;
    if (!isSameMonth(day, currentMonth)) return false;
    return true;
  }, [tomorrow, maxDate, currentMonth]);

  const isDayAvailable = useCallback((day: Date) => {
    return availableDays.has(format(day, 'yyyy-MM-dd'));
  }, [availableDays]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Seans Saatini Güncelle</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {isMentor
                  ? `Yeni tarih ve saat seçin. Öğrenci onayladıktan sonra güncellenir. (Kalan hak: ${remainingCount}/${totalCount})`
                  : `Yeni bir tarih ve saat seçin. (Kalan hak: ${remainingCount}/${totalCount})`
                }
              </CardDescription>
            </div>
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Calendar Grid */}
          <div>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
                disabled={!canGoPrev}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  canGoPrev ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: tr })}
              </span>
              <button
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                disabled={!canGoNext}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  canGoNext ? 'hover:bg-gray-100 text-gray-600' : 'text-gray-300 cursor-not-allowed'
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WEEKDAY_LABELS.map(label => (
                <div key={label} className="text-center text-[10px] font-medium text-gray-400 py-1">
                  {label}
                </div>
              ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {/* Padding */}
              {Array.from({ length: calendarDays.padding }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}

              {/* Days */}
              {calendarDays.days.map(day => {
                const selectable = isDaySelectable(day);
                const available = isDayAvailable(day);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isToday = isSameDay(day, today);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => selectable && setSelectedDate(day)}
                    disabled={!selectable}
                    className={cn(
                      'relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-150',
                      !selectable && 'text-gray-300 cursor-not-allowed',
                      selectable && !isSelected && 'hover:bg-teal-50 text-gray-700',
                      selectable && available && !isSelected && 'font-medium text-gray-900',
                      isSelected && 'bg-teal-600 text-white shadow-sm',
                      isToday && !isSelected && selectable && 'ring-1 ring-teal-400'
                    )}
                  >
                    <span className="leading-none">{format(day, 'd')}</span>
                    {/* Availability dot */}
                    {selectable && !loadingAvailability && (
                      <span className={cn(
                        'absolute bottom-0.5 w-1 h-1 rounded-full',
                        available
                          ? isSelected ? 'bg-teal-200' : 'bg-green-500'
                          : isSelected ? 'bg-teal-300' : 'bg-transparent'
                      )} />
                    )}
                    {selectable && loadingAvailability && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-gray-300 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-gray-500">Müsait gün</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded border border-teal-400 text-[8px] flex items-center justify-center text-gray-500">25</span>
                <span className="text-[10px] text-gray-500">Bugün</span>
              </div>
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-2 block">
                {format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr })} — Müsait Saatler
              </label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-4 gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent" />
                  <span className="text-xs text-gray-500">Saatler yükleniyor...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                  <p className="text-xs font-medium text-gray-500">Bu tarihte müsait saat yok</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Yeşil noktalı bir günü seçin</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {slots.map((slot) => {
                    const startTime = format(new Date(slot.startAt), 'HH:mm');
                    const endTime = format(new Date(slot.endAt), 'HH:mm');
                    const isSelected = selectedSlot?.startAt === slot.startAt;
                    return (
                      <button
                        key={slot.startAt}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          'py-2 px-1 rounded-lg border transition-all text-center',
                          isSelected
                            ? 'border-teal-600 bg-teal-50 shadow-sm ring-1 ring-teal-600'
                            : 'border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50'
                        )}
                      >
                        <div className={cn('text-sm font-semibold', isSelected ? 'text-teal-700' : 'text-gray-900')}>
                          {startTime}
                        </div>
                        <div className={cn('text-[10px]', isSelected ? 'text-teal-500' : 'text-gray-400')}>
                          {endTime}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Selected Slot Summary */}
          {selectedSlot && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5 flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="text-xs font-medium text-teal-900">
                {format(new Date(selectedSlot.startAt), 'dd MMMM yyyy, HH:mm', { locale: tr })} — {format(new Date(selectedSlot.endAt), 'HH:mm')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onCancel} className="flex-1 text-sm h-10">
              Vazgeç
            </Button>
            <Button
              onClick={() => selectedSlot && onConfirm(selectedSlot)}
              className="flex-1 text-sm h-10"
              disabled={!selectedSlot || isPending}
            >
              {isPending
                ? (isMentor ? 'Gönderiliyor...' : 'Güncelleniyor...')
                : (isMentor ? 'Talep Gönder' : 'Saati Güncelle')
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
