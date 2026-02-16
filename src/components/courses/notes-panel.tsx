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
      toast.success('Not eklendi');
    } catch {
      toast.error('Not eklenirken bir hata olustu');
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
      toast.success('Not guncellendi');
    } catch {
      toast.error('Not guncellenirken bir hata olustu');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync({ noteId, lectureId });
      toast.success('Not silindi');
    } catch {
      toast.error('Not silinirken bir hata olustu');
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
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <StickyNote className="w-4 h-4 text-primary-400" />
          <h3 className="font-semibold text-[13px] text-gray-200">Notlarim</h3>
          {sortedNotes.length > 0 && (
            <span className="text-[10px] font-medium text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-full">
              {sortedNotes.length}
            </span>
          )}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-primary-400 hover:text-primary-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <Plus className="w-3.5 h-3.5" />
            Not Ekle
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-600/10 border border-primary-500/20">
              <Clock className="w-3 h-3 text-primary-400" />
              <span className="text-[11px] font-medium text-primary-300 tabular-nums">
                {formatTimestamp(currentTimeSec)}
              </span>
            </div>
          </div>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Notunuzu yazin..."
            className="w-full px-3.5 py-2.5 bg-[#141414] border border-white/[0.08] rounded-lg text-[13px] text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all"
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleCreateNote}
              disabled={!newNoteContent.trim() || createNote.isPending}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-medium rounded-lg transition-all duration-200"
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
              className="px-3.5 py-1.5 text-gray-500 hover:text-gray-300 text-[12px] font-medium rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Iptal
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
              <div key={note.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                {editingNoteId === note.id ? (
                  /* Editing Mode */
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#141414] border border-white/[0.08] rounded-lg text-[13px] text-gray-300 resize-none focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editContent.trim() || updateNote.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white text-[11px] font-medium rounded-lg transition-all"
                      >
                        {updateNote.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Kaydet
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-300 text-[11px] font-medium rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        Iptal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div>
                    <button
                      onClick={() => onSeek?.(note.timestampSec)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/15 transition-all duration-200 mb-2"
                    >
                      <Clock className="w-3 h-3" />
                      <span className="tabular-nums">{formatTimestamp(note.timestampSec)}</span>
                    </button>
                    <p className="text-[13px] text-gray-400 whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => startEditing(note.id, note.content)}
                        className="text-[11px] text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Duzenle
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-[11px] text-gray-600 hover:text-red-400 flex items-center gap-1 transition-colors"
                        disabled={deleteNote.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
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
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
              <MessageSquarePlus className="w-5 h-5 text-gray-700" />
            </div>
            <p className="text-[13px] text-gray-500 font-medium">Henuz not eklemediniz</p>
            <p className="text-[11px] text-gray-600 mt-1">
              Video izlerken onemli anlari not alin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
