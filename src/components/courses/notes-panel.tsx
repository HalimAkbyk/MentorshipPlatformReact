'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, Clock, X, Check, Loader2, StickyNote, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLectureNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/lib/hooks/use-courses';
import { toast } from 'sonner';

interface NotesPanelProps {
  lectureId: string;
  onSeek?: (timestampSec: number) => void;
  currentTimeSec?: number;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function NotesPanel({ lectureId, onSeek, currentTimeSec = 0 }: NotesPanelProps) {
  const { data: notes, isLoading } = useLectureNotes(lectureId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      await createNote.mutateAsync({
        lectureId,
        timestampSec: Math.floor(currentTimeSec),
        content: newNoteContent.trim(),
      });
      setNewNoteContent('');
      setIsAdding(false);
      toast.success('Not eklendi.');
    } catch {
      toast.error('Not eklenirken bir hata oluştu');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateNote.mutateAsync({
        noteId,
        lectureId,
        content: editContent.trim(),
      });
      setEditingNoteId(null);
      setEditContent('');
      toast.success('Not güncellendi.');
    } catch {
      toast.error('Not güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync({ noteId, lectureId });
      toast.success('Not silindi');
    } catch {
      toast.error('Not silinirken bir hata oluştu');
    }
  };

  const startEditing = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const sortedNotes = notes
    ? [...notes].sort((a, b) => a.timestampSec - b.timestampSec)
    : [];

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <StickyNote className="w-4.5 h-4.5 text-teal-400" />
          <h3 className="font-bold text-sm text-gray-100">Notlarım</h3>
          {sortedNotes.length > 0 && (
            <span className="text-[11px] font-semibold text-gray-400 bg-white/[0.06] px-2 py-0.5 rounded-full">
              {sortedNotes.length}
            </span>
          )}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-teal-400 hover:text-teal-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <Plus className="w-4 h-4" />
            Not Ekle
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-teal-600/10 border border-teal-500/20">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-semibold text-teal-300 tabular-nums">
                {formatTimestamp(currentTimeSec)}
              </span>
            </div>
          </div>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Notunuzu yazın..."
            className="w-full px-3.5 py-2.5 bg-[#141414] border border-white/[0.08] rounded-lg text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all"
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleCreateNote}
              disabled={!newNoteContent.trim() || createNote.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold rounded-lg transition-all duration-200"
            >
              {createNote.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Kaydet'
              )}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewNoteContent('');
              }}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 text-[13px] font-medium rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="px-5 py-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 bg-white/[0.04] rounded w-16" />
                <div className="h-4 bg-white/[0.04] rounded w-full" />
              </div>
            ))}
          </div>
        ) : sortedNotes.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {sortedNotes.map((note) => (
              <div key={note.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                {editingNoteId === note.id ? (
                  /* Editing Mode */
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#141414] border border-white/[0.08] rounded-lg text-sm text-gray-200 resize-none focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 transition-all"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editContent.trim() || updateNote.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-[13px] font-semibold rounded-lg transition-all"
                      >
                        {updateNote.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Kaydet
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3.5 py-1.5 text-gray-400 hover:text-gray-200 text-[13px] font-medium rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div>
                    <button
                      onClick={() => onSeek?.(note.timestampSec)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/15 transition-all duration-200 mb-2"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{formatTimestamp(note.timestampSec)}</span>
                    </button>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => startEditing(note.id, note.content)}
                        className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 font-medium transition-colors"
                        disabled={deleteNote.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 px-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <MessageSquarePlus className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-400 font-semibold">Henüz not eklemediniz</p>
            <p className="text-xs text-gray-500 mt-1.5">
              Video izlerken önemli anları not alın
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
