'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, Users, BarChart3, Award, TrendingUp, Target, FileText, Loader2,
} from 'lucide-react';
import { useExamDetail, useExamResults } from '@/lib/hooks/use-exams';
import { cn } from '@/lib/utils/cn';

const questionTypeLabels: Record<string, string> = {
  SingleChoice: 'Tek Secimli',
  MultipleChoice: 'Coktan Secmeli',
  TrueFalse: 'Dogru / Yanlis',
  ShortAnswer: 'Kisa Cevap',
  Essay: 'Acik Uclu',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MentorExamResultsPage() {
  const router = useRouter();
  const { examId } = useParams<{ examId: string }>();
  const { data: exam, isLoading: examLoading } = useExamDetail(examId);
  const { data: resultsData, isLoading: resultsLoading } = useExamResults(examId, { pageSize: 200 });
  const [activeTab, setActiveTab] = useState<'students' | 'questions'>('students');

  const results = resultsData?.items ?? [];
  const isLoading = examLoading || resultsLoading;

  // Compute KPIs
  const completedResults = results.filter((r) => r.status === 'Completed');
  const avgScore =
    completedResults.length > 0
      ? Math.round(
          completedResults.reduce((s, r) => s + (r.scorePercentage ?? 0), 0) /
            completedResults.length
        )
      : 0;
  const passCount = completedResults.filter((r) => r.passed).length;
  const passRate =
    completedResults.length > 0
      ? Math.round((passCount / completedResults.length) * 100)
      : 0;
  const highestScore =
    completedResults.length > 0
      ? Math.max(...completedResults.map((r) => r.scorePercentage ?? 0))
      : 0;
  const lowestScore =
    completedResults.length > 0
      ? Math.min(...completedResults.map((r) => r.scorePercentage ?? 0))
      : 0;

  const questionStats = exam?.questions ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 border border-gray-200">
              <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse mb-2" />
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Sinav bulunamadi.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/mentor/exams')}>
          Sinavlarima Don
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        onClick={() => router.push(`/mentor/exams/${examId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Sinava Don
      </button>

      <div>
        <h1 className="text-2xl text-gray-900 font-semibold">{exam.title}</h1>
        <p className="text-sm text-gray-500 mt-1">Sinav Sonuclari & Analiz</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Katilim', value: results.length.toString(), icon: Users, color: 'text-teal-600 bg-teal-50' },
          { label: 'Ort. Puan', value: `%${avgScore}`, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
          { label: 'Gecme %', value: `%${passRate}`, icon: Award, color: 'text-green-600 bg-green-50' },
          { label: 'En Yuksek', value: `%${highestScore}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'En Dusuk', value: `%${lowestScore}`, icon: Target, color: 'text-red-600 bg-red-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-4 border border-gray-200">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', stat.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl text-gray-900 font-semibold">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm transition-all',
            activeTab === 'students'
              ? 'bg-teal-100 text-teal-700'
              : 'bg-white border border-gray-200 text-gray-600'
          )}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Ogrenci Sonuclari
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm transition-all',
            activeTab === 'questions'
              ? 'bg-teal-100 text-teal-700'
              : 'bg-white border border-gray-200 text-gray-600'
          )}
        >
          <BarChart3 className="w-4 h-4 inline mr-1.5" />
          Soru Bazli Analiz
        </button>
      </div>

      {/* Student Results Tab */}
      {activeTab === 'students' && (
        <Card className="border border-gray-200 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Henuz katilim yok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-gray-500 font-medium">Ogrenci</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Puan</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Yuzde</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Durum</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center text-white text-xs flex-shrink-0">
                            {getInitials(r.studentName)}
                          </div>
                          <span className="text-gray-900">{r.studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.status === 'InProgress'
                          ? '\u2014'
                          : `${r.earnedPoints ?? 0}/${r.totalPoints ?? 0}`}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'InProgress' ? (
                          '\u2014'
                        ) : (
                          <span className={r.passed ? 'text-green-700' : 'text-red-600'}>
                            %{r.scorePercentage ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn('px-2 py-0.5 rounded-full text-xs', {
                            'bg-blue-50 text-blue-700 border border-blue-200':
                              r.status === 'InProgress',
                            'bg-amber-50 text-amber-700 border border-amber-200':
                              r.status === 'TimedOut',
                            'bg-green-50 text-green-700 border border-green-200':
                              r.status === 'Completed' && r.passed,
                            'bg-red-50 text-red-700 border border-red-200':
                              r.status === 'Completed' && !r.passed,
                          })}
                        >
                          {r.status === 'InProgress'
                            ? 'Cozuyor'
                            : r.status === 'TimedOut'
                            ? 'Sure Doldu'
                            : r.passed
                            ? 'Gecti'
                            : 'Kaldi'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(r.completedAt || r.startedAt).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Question Stats Tab */}
      {activeTab === 'questions' && (
        <Card className="border border-gray-200 overflow-hidden">
          {questionStats.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Soru verisi bulunamadi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-gray-500 font-medium">Soru</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Tip</th>
                    <th className="px-4 py-3 text-gray-500 font-medium">Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questionStats.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">#{i + 1}</span>
                          <span className="text-gray-900 line-clamp-1">{s.questionText}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {questionTypeLabels[s.questionType] ?? s.questionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
