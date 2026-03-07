'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Clock, Play, FileText, CalendarDays, Eye, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { examsApi } from '@/lib/api/exams';

const scopeTypeLabels: Record<string, string> = {
  General: 'Genel',
  Course: 'Kurs',
  Booking: 'Seans',
  GroupClass: 'Grup Dersi',
};

const scopeFilters = [
  { key: 'all', label: 'Tumu' },
  { key: 'General', label: 'Genel' },
  { key: 'Course', label: 'Kurs' },
  { key: 'Booking', label: 'Seans' },
  { key: 'GroupClass', label: 'Grup Dersi' },
];

export default function StudentExamsPage() {
  const [scopeFilter, setScopeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: examsData, isLoading } = useQuery({
    queryKey: ['available-exams', scopeFilter],
    queryFn: () =>
      examsApi.getAvailableExams({
        scopeType: scopeFilter === 'all' ? undefined : scopeFilter,
        pageSize: 100,
      }),
  });

  const allExams: any[] = examsData?.items ?? [];
  const exams = searchTerm
    ? allExams.filter((e: any) => e.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : allExams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Sinavlar</h1>
        <p className="text-sm text-gray-500 mt-1">Mevcut sinavlari gor ve cozmeye basla</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {scopeFilters.map(scope => (
          <button
            key={scope.key}
            onClick={() => setScopeFilter(scope.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-all',
              scopeFilter === scope.key
                ? 'bg-teal-100 text-teal-700'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {scope.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 w-44"
          />
        </div>
      </div>

      {/* Exam Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center border border-gray-200">
            <div className="animate-pulse text-gray-400">Yukleniyour...</div>
          </Card>
        ) : !Array.isArray(exams) || exams.length === 0 ? (
          <Card className="p-8 text-center border border-gray-200">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Mevcut sinav bulunamadi</p>
          </Card>
        ) : (
          exams.map((exam: any) => {
            const attemptCount = exam.myAttemptCount ?? exam.attemptCount ?? 0;
            const maxAttempts = exam.maxAttempts;
            const maxReached = maxAttempts && attemptCount >= maxAttempts;

            return (
              <Card key={exam.id} className="p-5 border border-gray-200 hover:border-teal-200 transition-all">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-gray-900 font-medium">{exam.title}</h3>
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {scopeTypeLabels[exam.scopeType] ?? exam.scopeType}
                      </span>
                      {exam.scopeLabel && (
                        <span className="text-xs text-teal-600">{exam.scopeLabel}</span>
                      )}
                    </div>

                    {exam.mentorName && (
                      <p className="text-sm text-gray-500 mb-1">Egitmen: {exam.mentorName}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span>{exam.questionCount ?? 0} soru</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.durationMinutes ? `${exam.durationMinutes} dakika` : 'Suresiz'}
                      </span>
                      <span>Gecme: %{exam.passingScore}</span>
                      <span>{maxAttempts ? `${maxAttempts} hak` : 'Sinirsiz hak'}</span>
                    </div>

                    {exam.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{exam.description}</p>
                    )}

                    {/* Attempt info */}
                    {attemptCount > 0 && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-600">
                          Denemelerim: {attemptCount}{maxAttempts ? `/${maxAttempts}` : ''} kullanildi
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="text-teal-700">Deneme: {attemptCount}</span>
                      </div>
                    )}

                    {exam.endDate && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                        <CalendarDays className="w-3 h-3" />
                        Son tarih: {new Date(exam.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {attemptCount > 0 && (
                      <Link href="/student/exams/my-attempts">
                        <Button size="sm" variant="outline" className="border-gray-200 text-xs gap-1">
                          <Eye className="w-3 h-3" /> Sonuclarim
                        </Button>
                      </Link>
                    )}
                    {maxReached ? (
                      <Button size="sm" disabled className="text-xs opacity-50 cursor-not-allowed">
                        Hak Doldu
                      </Button>
                    ) : (
                      <Link href={`/student/exams/${exam.id}/take/new`}>
                        <Button size="sm" className="bg-gradient-to-r from-teal-600 to-green-600 text-white text-xs gap-1">
                          <Play className="w-3 h-3" />
                          {attemptCount > 0 ? 'Tekrar Coz' : 'Sinava Basla'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
