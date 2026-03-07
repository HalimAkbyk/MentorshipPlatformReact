'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CalendarSlot {
  startAt: string;
  endAt: string;
  type: 'Available' | 'Booked' | 'Unavailable';
}

interface FullCalendarViewProps {
  mentorId: string;
  offeringId: string;
  onSlotClick?: (slot: CalendarSlot) => void;
}

const DAYS_TR = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function FullCalendarView({ mentorId, offeringId, onSlotClick }: FullCalendarViewProps) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);

  const { data: slots, isLoading } = useQuery({
    queryKey: ['mentor-calendar', mentorId, offeringId, weekStart.toISOString()],
    queryFn: () =>
      apiClient.get(
        `/mentors/${mentorId}/calendar?offeringId=${offeringId}&start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`
      ) as Promise<CalendarSlot[]>,
    enabled: !!mentorId && !!offeringId,
  });

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  // Group slots by day
  const dayColumns = useMemo(() => {
    const columns: Map<string, CalendarSlot[]> = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      columns.set(d.toDateString(), []);
    }
    if (slots) {
      for (const slot of slots) {
        const day = new Date(slot.startAt).toDateString();
        if (columns.has(day)) {
          columns.get(day)!.push(slot);
        }
      }
    }
    return columns;
  }, [slots, weekStart]);

  const slotColor = (type: string) => {
    switch (type) {
      case 'Available':
        return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer border-green-200';
      case 'Booked':
        return 'bg-red-50 text-red-400 border-red-200 cursor-not-allowed';
      case 'Unavailable':
        return 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer border-blue-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const formatWeekRange = () => {
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    return `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={prevWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700">{formatWeekRange()}</span>
        <Button variant="outline" size="sm" onClick={nextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span className="text-gray-600">Musait</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
          <span className="text-gray-600">Talep edilebilir</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span className="text-gray-600">Dolu</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {Array.from(dayColumns.keys()).map((dayStr, i) => {
            const d = new Date(dayStr);
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div key={dayStr} className="text-center mb-2">
                <p className={cn('text-xs font-medium', isToday ? 'text-teal-600' : 'text-gray-500')}>
                  {DAYS_TR[i]}
                </p>
                <p className={cn(
                  'text-sm font-semibold',
                  isToday ? 'text-teal-600 bg-teal-50 rounded-full w-7 h-7 flex items-center justify-center mx-auto' : 'text-gray-900'
                )}>
                  {d.getDate()}
                </p>
              </div>
            );
          })}

          {/* Slot columns */}
          {Array.from(dayColumns.entries()).map(([dayStr, daySlots]) => (
            <div key={dayStr} className="space-y-0.5 min-h-[200px]">
              {daySlots.length === 0 ? (
                <p className="text-[10px] text-gray-300 text-center pt-4">-</p>
              ) : (
                daySlots.map((slot, idx) => {
                  const startTime = new Date(slot.startAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit', minute: '2-digit',
                  });
                  const clickable = slot.type !== 'Booked';
                  return (
                    <button
                      key={idx}
                      disabled={!clickable}
                      onClick={() => clickable && onSlotClick?.(slot)}
                      className={cn(
                        'w-full text-[10px] py-1 px-0.5 rounded border transition-colors',
                        slotColor(slot.type)
                      )}
                    >
                      {startTime}
                    </button>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
