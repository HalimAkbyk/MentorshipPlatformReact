import { format, formatDistance } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatDate(date: string | Date, formatStr: string = 'PPP') {
  return format(new Date(date), formatStr, { locale: tr });
}

export function formatTime(date: string | Date, formatStr: string = 'HH:mm') {
  return format(new Date(date), formatStr, { locale: tr });
}

export function formatCurrency(amount: number, currency: string = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatRelativeTime(date: string | Date) {
  return formatDistance(new Date(date), new Date(), {
    addSuffix: true,
    locale: tr,
  });
}