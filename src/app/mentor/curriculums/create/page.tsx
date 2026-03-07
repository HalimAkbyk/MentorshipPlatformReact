'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCurriculum } from '@/lib/hooks/use-curriculum';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BookOpen, ArrowLeft } from 'lucide-react';

const SUBJECTS = [
  { label: 'Matematik', value: 'Matematik' },
  { label: 'Fizik', value: 'Fizik' },
  { label: 'Kimya', value: 'Kimya' },
  { label: 'Biyoloji', value: 'Biyoloji' },
  { label: 'Turkce', value: 'Turkce' },
  { label: 'Tarih', value: 'Tarih' },
  { label: 'Cografya', value: 'Cografya' },
  { label: 'Ingilizce', value: 'Ingilizce' },
  { label: 'Diger', value: 'Diger' },
];

const LEVELS = [
  { label: 'TYT', value: 'TYT' },
  { label: 'AYT', value: 'AYT' },
  { label: 'LGS', value: 'LGS' },
  { label: 'Genel', value: 'Genel' },
];

export default function CreateCurriculumPage() {
  const router = useRouter();
  const createMutation = useCreateCurriculum();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(12);
  const [estimatedHoursPerWeek, setEstimatedHoursPerWeek] = useState(4);

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
        subject: subject || undefined,
        level: level || undefined,
        totalWeeks,
        estimatedHoursPerWeek: estimatedHoursPerWeek || undefined,
      });
      toast.success('Mufredat olusturuldu');
      router.push(`/mentor/curriculums/${id}`);
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/mentor/curriculums')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Yeni Mufredat</h1>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Baslik <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ornegin: TYT Matematik 12 Haftalik Program"
                className="text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Aciklama
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mufredat hakkinda kisa bir aciklama..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Subject & Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ders
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Seciniz</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Seviye
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Seciniz</option>
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Week & Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Toplam Hafta
                </label>
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(Number(e.target.value))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Haftalik Tahmini Saat
                </label>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={estimatedHoursPerWeek}
                  onChange={(e) => setEstimatedHoursPerWeek(Number(e.target.value))}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/mentor/curriculums')}
              >
                Iptal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || !title.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? 'Olusturuluyor...' : 'Olustur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
