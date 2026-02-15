'use client';

import { useState } from 'react';
import { Pencil, Trash2, Plus, Clock, X, Check, Loader2 } from 'lucide-react';
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
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900">Notlarim</h3>
        {!isAdding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Not Ekle
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimestamp(currentTimeSec)}</span>
          </div>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Notunuzu yazin..."
            className="w-full p-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              onClick={handleCreateNote}
              disabled={!newNoteContent.trim() || createNote.isPending}
            >
              {createNote.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Kaydet'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewNoteContent('');
              }}
            >
              Iptal
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : sortedNotes.length > 0 ? (
          <div className="divide-y">
            {sortedNotes.map((note) => (
              <div key={note.id} className="p-4 hover:bg-gray-50 transition-colors">
                {editingNoteId === note.id ? (
                  /* Editing Mode */
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editContent.trim() || updateNote.isPending}
                      >
                        {updateNote.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Kaydet
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Iptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div>
                    <button
                      onClick={() => onSeek?.(note.timestampSec)}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium mb-1 transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(note.timestampSec)}
                    </button>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => startEditing(note.id, note.content)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Duzenle
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
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
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">Henuz not eklemediniz</p>
            <p className="text-xs text-gray-300 mt-1">
              Video izlerken onemli anlari not alin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
