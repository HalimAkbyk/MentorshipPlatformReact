'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as start of week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

interface Preset {
  label: string;
  getRange: () => { from: string; to: string };
}

const presets: Preset[] = [
  {
    label: 'Bugun',
    getRange: () => {
      const today = formatDate(new Date());
      return { from: today, to: today };
    },
  },
  {
    label: 'Bu Hafta',
    getRange: () => {
      const now = new Date();
      return {
        from: formatDate(getStartOfWeek(now)),
        to: formatDate(now),
      };
    },
  },
  {
    label: 'Bu Ay',
    getRange: () => {
      const now = new Date();
      return {
        from: formatDate(getStartOfMonth(now)),
        to: formatDate(now),
      };
    },
  },
  {
    label: 'Son 30 Gun',
    getRange: () => {
      const now = new Date();
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      return { from: formatDate(past), to: formatDate(now) };
    },
  },
  {
    label: 'Son 90 Gun',
    getRange: () => {
      const now = new Date();
      const past = new Date(now);
      past.setDate(past.getDate() - 90);
      return { from: formatDate(past), to: formatDate(now) };
    },
  },
];

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const handlePreset = (preset: Preset) => {
    const range = preset.getRange();
    onChange(range.from, range.to);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date inputs */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={from}
            onChange={(e) => onChange(e.target.value, to)}
            className={cn(
              'h-9 rounded-lg border border-gray-300 bg-white pl-8 pr-3 text-sm text-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'hover:border-gray-400 transition-colors'
            )}
          />
        </div>
        <span className="text-sm text-gray-400">&ndash;</span>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={to}
            onChange={(e) => onChange(from, e.target.value)}
            className={cn(
              'h-9 rounded-lg border border-gray-300 bg-white pl-8 pr-3 text-sm text-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'hover:border-gray-400 transition-colors'
            )}
          />
        </div>
      </div>

      {/* Preset buttons */}
      <div className="flex items-center gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePreset(preset)}
            className={cn(
              'h-9 px-3 rounded-lg text-xs font-medium transition-colors',
              'border border-gray-200 bg-white text-gray-600',
              'hover:bg-gray-50 hover:border-gray-300',
              'focus:outline-none focus:ring-2 focus:ring-primary-500'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
