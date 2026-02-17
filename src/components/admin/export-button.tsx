'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  columns: { key: string; label: string }[];
  disabled?: boolean;
}

function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape fields containing commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[]
): string {
  // BOM for UTF-8 Excel compatibility
  const bom = '\uFEFF';
  const header = columns.map((col) => escapeCSVField(col.label)).join(',');
  const rows = data.map((item) =>
    columns.map((col) => escapeCSVField(item[col.key])).join(',')
  );
  return bom + [header, ...rows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton({
  data,
  filename,
  columns,
  disabled = false,
}: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;
    const csv = generateCSV(data, columns);
    downloadCSV(csv, filename);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || data.length === 0}
    >
      <Download className="h-4 w-4 mr-1.5" />
      Disa Aktar
    </Button>
  );
}
