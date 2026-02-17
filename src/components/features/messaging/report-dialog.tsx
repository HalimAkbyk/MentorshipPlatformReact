'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReportMessage } from '@/lib/hooks/use-messages';

interface ReportDialogProps {
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDialog({ messageId, isOpen, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState('');
  const reportMutation = useReportMessage();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    try {
      await reportMutation.mutateAsync({ messageId, reason: reason.trim() });
      setReason('');
      onClose();
    } catch {
      // Error handled by mutation / API client
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-red-600">
            <Flag className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Mesajı Bildir</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Bu mesajın neden uygunsuz olduğunu açıklayınız.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Raporlama sebebi..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
        <div className="text-xs text-gray-400 text-right mt-1">
          {reason.length}/500
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Iptal
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSubmit}
            disabled={!reason.trim() || reportMutation.isPending}
          >
            {reportMutation.isPending ? 'Gönderiliyor...' : 'Bildir'}
          </Button>
        </div>
      </div>
    </div>
  );
}
