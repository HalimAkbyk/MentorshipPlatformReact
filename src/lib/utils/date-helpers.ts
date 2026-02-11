import { format, formatDistance, parseISO, isBefore, isAfter, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: tr });
}

export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'HH:mm', { locale: tr });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'PPP HH:mm', { locale: tr });
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: tr });
}

export function isDateInPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

export function isDateInFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

export function getDateDaysFromNow(days: number): Date {
  return addDays(new Date(), days);
}