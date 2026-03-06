'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { useCreateSessionRequest } from '@/lib/hooks/use-session-requests';

interface SessionRequestDialogProps {
  mentorUserId: string;
  offeringId: string;
  startAt: string;
  durationMin: number;
  onClose: () => void;
}

export function SessionRequestDialog({
  mentorUserId, offeringId, startAt, durationMin, onClose,
}: SessionRequestDialogProps) {
  const [note, setNote] = useState('');
  const createMutation = useCreateSessionRequest();

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        mentorUserId,
        offeringId,
        requestedStartAt: startAt,
        durationMin,
        studentNote: note || undefined,
      });
      toast.success('Seans talebi gonderildi');
      onClose();
    } catch {
      // error handled by apiClient
    }
  };

  const date = new Date(startAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Seans Talebi Olustur</h3>
        <p className="text-xs text-gray-500 mb-4">
          Egitmenin bu saatte musait olmayabilir. Talep onaylanirsa seans olusturulacaktir.
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            {' '}({durationMin} dk)
          </span>
        </div>

        <Textarea
          placeholder="Notunuz (istege bagli)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="text-sm min-h-[80px] resize-none mb-4"
        />

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Vazgec
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="text-xs"
          >
            {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Talep Gonder
          </Button>
        </div>
      </div>
    </div>
  );
}
