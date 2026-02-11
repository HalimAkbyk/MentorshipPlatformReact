export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}