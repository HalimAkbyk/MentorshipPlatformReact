'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAssignment } from '@/lib/hooks/use-assignments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, FileCheck, Save } from 'lucide-react';
import Link from 'next/link';

const ASSIGNMENT_TYPES = [
  { value: 'Homework', label: 'Odev' },
  { value: 'Project', label: 'Proje' },
  { value: 'Practice', label: 'Pratik' },
  { value: 'Quiz', label: 'Quiz' },
  { value: 'Reading', label: 'Okuma' },
  { value: 'Research', label: 'Arastirma' },
];

const DIFFICULTY_LEVELS = [
  { value: '', label: 'Secilmedi' },
  { value: 'Easy', label: 'Kolay' },
  { value: 'Medium', label: 'Orta' },
  { value: 'Hard', label: 'Zor' },
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const createMutation = useCreateAssignment();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [assignmentType, setAssignmentType] = useState('Homework');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState<number | ''>('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [latePenaltyPercent, setLatePenaltyPercent] = useState<number | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Baslik zorunludur');
      return;
    }

    try {
      const id = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        assignmentType,
        difficultyLevel: difficultyLevel || undefined,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        dueDate: dueDate || undefined,
        maxScore: maxScore ? Number(maxScore) : undefined,
        allowLateSubmission,
        latePenaltyPercent: allowLateSubmission && latePenaltyPercent ? Number(latePenaltyPercent) : undefined,
      });
      toast.success('Odev olusturuldu');
      router.push(`/mentor/assignments/${id}`);
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mentor/assignments">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Yeni Odev Olustur</h1>
            <p className="text-xs text-gray-500">Odev bilgilerini doldurun</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baslik <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Odev basligi"
                className="text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aciklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Odev aciklamasi (markdown desteklenir)"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[80px] resize-y"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Talimatlar</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ogrenciler icin detayli talimatlar"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[80px] resize-y"
              />
            </div>

            {/* Type + Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tur</label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  {ASSIGNMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zorluk</label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* EstimatedMinutes + MaxScore */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Sure (dakika)</label>
                <Input
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ornegin: 60"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Puan</label>
                <Input
                  type="number"
                  min={1}
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ornegin: 100"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Son Teslim Tarihi</label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Late Submission */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLateSubmission}
                  onChange={(e) => setAllowLateSubmission(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Gec teslime izin ver</span>
              </label>
              {allowLateSubmission && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gec Teslim Cezasi (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={latePenaltyPercent}
                    onChange={(e) => setLatePenaltyPercent(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ornegin: 10"
                    className="text-sm max-w-xs"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={createMutation.isPending} className="text-sm">
            <Save className="w-4 h-4 mr-1" />
            {createMutation.isPending ? 'Kaydediliyor...' : 'Olustur'}
          </Button>
        </div>
      </form>
    </div>
  );
}
