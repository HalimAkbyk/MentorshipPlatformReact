'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Clock, CheckCircle2, XCircle, Eye, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { examsApi } from '@/lib/api/exams';

export default function StudentMyAttemptsPage() {
  const [examFilter, setExamFilter] = useState('all');

  const { data: attemptsData, isLoading } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => examsApi.getMyAttempts({}),
  });

  const attempts: any[] = attemptsData?.data ?? attemptsData ?? [];

  const uniqueExams = [...new Set(attempts.map((a: any) => a.examTitle))];

  const filtered = examFilter === 'all'
    ? attempts
    : attempts.filter((a: any) => a.examTitle === examFilter);

  const completedAttempts = attempts.filter((a: any) => a.status === 'Completed');
  const passedCount = attempts.filter((a: any) => a.passed).length;
  const failedCount = completedAttempts.filter((a: any) => !a.passed).length;
  const avgScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((s: number, a: any) => s + (a.scorePercentage ?? 0), 0) / completedAttempts.length)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Gecmis Denemelerim</h1>
        <p className="text-sm text-gray-500 mt-1">Tum sinav denemelerinizi goruntuleyin</p>
      </div>

      <div className="flex gap-2 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={examFilter}
          onChange={e => setExamFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
        >
          <option value="all">Tum Sinavlar</option>
          {uniqueExams.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border border-gray-200">
          <div className="text-xs text-gray-500">Toplam Deneme</div>
          <div className="text-2xl text-gray-900 mt-1 font-bold">{attempts.length}</div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="text-xs text-gray-500">Basarili</div>
          <div className="text-2xl text-green-700 mt-1 font-bold">{passedCount}</div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="text-xs text-gray-500">Basarisiz</div>
          <div className="text-2xl text-red-600 mt-1 font-bold">{failedCount}</div>
        </Card>
        <Card className="p-4 border border-gray-200">
          <div className="text-xs text-gray-500">Ort. Basari</div>
          <div className="text-2xl text-teal-700 mt-1 font-bold">%{avgScore}</div>
        </Card>
      </div>

      {/* Attempts List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center border border-gray-200">
            <div className="animate-pulse text-gray-400">Yukleniyour...</div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center border border-gray-200">
            <p className="text-gray-500">Henuz deneme bulunamadi</p>
          </Card>
        ) : (
          filtered.map((attempt: any) => (
            <Card key={attempt.id} className="p-4 border border-gray-200 hover:border-teal-200 transition-all">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  attempt.passed ? 'bg-green-50' : 'bg-red-50'
                )}>
                  {attempt.passed
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : <XCircle className="w-5 h-5 text-red-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-medium">{attempt.examTitle}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                    <span>Puan: {attempt.earnedPoints}/{attempt.totalPoints} (%{attempt.scorePercentage})</span>
                    <span className="text-gray-300">|</span>
                    <span className={attempt.passed ? 'text-green-700' : 'text-red-600'}>
                      {attempt.passed ? 'Gecti' : 'Kaldi'}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>Deneme {attempt.attemptNumber}{attempt.maxAttempts ? `/${attempt.maxAttempts}` : ''}</span>
                    {attempt.completedAt && attempt.startedAt && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {(() => {
                            const start = new Date(attempt.startedAt).getTime();
                            const end = new Date(attempt.completedAt).getTime();
                            const mins = Math.floor((end - start) / 60000);
                            const secs = Math.floor(((end - start) % 60000) / 1000);
                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                          })()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {attempt.startedAt
                      ? new Date(attempt.startedAt).toLocaleDateString('tr-TR')
                      : ''
                    }
                  </span>
                  <Link href={`/student/exams/${attempt.examId}/result/${attempt.id}`}>
                    <Button size="sm" variant="outline" className="border-gray-200 text-xs gap-1">
                      <Eye className="w-3 h-3" /> Sonucu Gor
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
