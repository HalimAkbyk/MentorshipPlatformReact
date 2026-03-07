'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMyExams, usePublishExam, useUnpublishExam } from '@/lib/hooks/use-exams';
import type { ExamListItem } from '@/lib/api/exams';
import { toast } from 'sonner';
import {
  Plus, Search, Clock, Users, BarChart3, FileText, Send, Edit,
  ArrowDownCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const scopeTypeLabels: Record<string, string> = {
  General: 'Genel',
  Session: 'Seans',
  Course: 'Kurs',
  GroupClass: 'Grup Dersi',
};

export default function MentorExamsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useMyExams({ pageSize: 100 });
  const publishMutation = usePublishExam();
  const unpublishMutation = useUnpublishExam();

  const exams = data?.items ?? [];

  const filtered = exams.filter((exam) => {
    const matchSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchScope = scopeFilter === 'all' || exam.scopeType === scopeFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && exam.isPublished) ||
      (statusFilter === 'draft' && !exam.isPublished);
    return matchSearch && matchScope && matchStatus;
  });

  const handlePublish = async (examId: string) => {
    try {
      await publishMutation.mutateAsync(examId);
      toast.success('Sinav yayinlandi.');
    } catch {
      // error handled by client interceptor
    }
  };

  const handleUnpublish = async (examId: string) => {
    try {
      await unpublishMutation.mutateAsync(examId);
      toast.success('Sinav taslaga alindi.');
    } catch {
      // error handled by client interceptor
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-gray-900 font-semibold">Sinavlarim</h1>
        <Link href="/mentor/exams/create">
          <Button className="bg-gradient-to-r from-teal-600 to-green-600 text-white gap-1.5">
            <Plus className="w-4 h-4" /> Yeni Sinav
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sinav ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
        >
          <option value="all">Tum Kapsamlar</option>
          {Object.entries(scopeTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
        >
          <option value="all">Tum Durumlar</option>
          <option value="published">Yayinda</option>
          <option value="draft">Taslak</option>
        </select>
      </div>

      {/* Exam Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center border border-gray-200">
            <p className="text-gray-500">Yukleniyor...</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center border border-gray-200">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henuz sinav olusturmadin</p>
            <Link href="/mentor/exams/create" className="mt-3 inline-block">
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-600 to-green-600 text-white gap-1"
              >
                <Plus className="w-3 h-3" /> Ilk Sinavini Olustur
              </Button>
            </Link>
          </Card>
        ) : (
          filtered.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              isPublishing={publishMutation.isPending}
              isUnpublishing={unpublishMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ExamCard({
  exam,
  onPublish,
  onUnpublish,
  isPublishing,
  isUnpublishing,
}: {
  exam: ExamListItem;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  isPublishing: boolean;
  isUnpublishing: boolean;
}) {
  return (
    <Card className="p-5 border border-gray-200 hover:border-teal-200 transition-all">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
            exam.isPublished ? 'bg-green-50' : 'bg-amber-50'
          )}
        >
          <FileText
            className={cn('w-5 h-5', exam.isPublished ? 'text-green-600' : 'text-amber-600')}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/mentor/exams/${exam.id}`}
              className="text-gray-900 font-medium hover:text-teal-700 transition-colors truncate"
            >
              {exam.title}
            </Link>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs flex-shrink-0',
                exam.isPublished
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              )}
            >
              {exam.isPublished ? 'Yayinda' : 'Taslak'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
              {scopeTypeLabels[exam.scopeType] ?? exam.scopeType}
            </span>
            <span>{exam.questionCount} soru</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {exam.durationMinutes ? `${exam.durationMinutes} dk` : 'Suresiz'}
            </span>
            <span>Gecme: %{exam.passingScore}</span>
            {exam.isPublished && exam.attemptCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {exam.attemptCount} katilimci
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/mentor/exams/${exam.id}`}>
            <Button size="sm" variant="outline" className="border-gray-200 text-xs gap-1">
              <Edit className="w-3 h-3" /> Duzenle
            </Button>
          </Link>
          {exam.isPublished ? (
            <>
              <Link href={`/mentor/exams/${exam.id}/results`}>
                <Button size="sm" variant="outline" className="border-gray-200 text-xs gap-1">
                  <BarChart3 className="w-3 h-3" /> Sonuclar
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-200 text-xs gap-1"
                onClick={() => onUnpublish(exam.id)}
                disabled={isUnpublishing}
              >
                <ArrowDownCircle className="w-3 h-3" /> Geri Cek
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-gradient-to-r from-teal-600 to-green-600 text-white text-xs gap-1"
              onClick={() => onPublish(exam.id)}
              disabled={isPublishing}
            >
              <Send className="w-3 h-3" /> Yayinla
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
