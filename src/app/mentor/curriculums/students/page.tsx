'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMentorStudentsProgress, useCurriculums } from '@/lib/hooks/use-curriculum';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  ChevronRight,
  GraduationCap,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { StudentProgressDto } from '@/lib/api/curriculum';

function getProgressColor(pct: number) {
  if (pct >= 80) return 'from-green-500 to-emerald-500';
  if (pct >= 50) return 'from-indigo-500 to-teal-500';
  if (pct >= 20) return 'from-amber-500 to-orange-500';
  return 'from-gray-400 to-gray-500';
}

function getProgressBgColor(pct: number) {
  if (pct >= 80) return 'text-green-700 bg-green-50';
  if (pct >= 50) return 'text-indigo-700 bg-indigo-50';
  if (pct >= 20) return 'text-amber-700 bg-amber-50';
  return 'text-gray-600 bg-gray-100';
}

export default function MentorStudentsProgressPage() {
  const router = useRouter();
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data: curriculums } = useCurriculums({ status: 'Published' });
  const { data: studentsProgress, isLoading } = useMentorStudentsProgress(selectedCurriculumId);

  const curriculumList = curriculums?.items ?? [];
  const progressList = studentsProgress ?? [];

  // Filter by search
  const filtered = search.trim()
    ? progressList.filter((s) => s.studentName.toLowerCase().includes(search.toLowerCase()))
    : progressList;

  // Group by curriculum
  const grouped = new Map<string, StudentProgressDto[]>();
  for (const sp of filtered) {
    const key = sp.curriculumId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(sp);
  }

  // KPI calculations
  const totalEnrollments = progressList.length;
  const avgCompletion = totalEnrollments > 0
    ? Math.round(progressList.reduce((sum, s) => sum + s.completionPercentage, 0) / totalEnrollments)
    : 0;
  const activeStudents = progressList.filter((s) => s.status === 'Active').length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Ogrenci Ilerlemeleri</h1>
            <p className="text-xs text-gray-500">Mufredatlara kayitli ogrencilerin ilerleme durumu</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalEnrollments}</div>
              <div className="text-[10px] text-gray-500">Toplam Kayit</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">%{avgCompletion}</div>
              <div className="text-[10px] text-gray-500">Ortalama Tamamlanma</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeStudents}</div>
              <div className="text-[10px] text-gray-500">Aktif Ogrenci</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCurriculumId(undefined)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              !selectedCurriculumId ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tumu
          </button>
          {curriculumList.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCurriculumId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCurriculumId === c.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Ogrenci ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([curriculumId, students]) => {
            const curriculumTitle = curriculumList.find((c) => c.id === curriculumId)?.title ?? 'Mufredat';

            return (
              <div key={curriculumId}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-semibold text-gray-800">{curriculumTitle}</h2>
                  <span className="text-[10px] text-gray-400">{students.length} ogrenci</span>
                </div>

                <div className="space-y-2">
                  {students.map((student) => (
                    <Card
                      key={student.enrollmentId}
                      className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => router.push(`/mentor/curriculums/${curriculumId}?studentId=${student.enrollmentId}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-indigo-700">
                              {student.studentName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">{student.studentName}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                student.status === 'Active' ? 'bg-green-50 text-green-700' :
                                student.status === 'Completed' ? 'bg-indigo-50 text-indigo-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {student.status === 'Active' ? 'Aktif' :
                                 student.status === 'Completed' ? 'Tamamlandi' : student.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${getProgressColor(student.completionPercentage)} rounded-full transition-all`}
                                  style={{ width: `${student.completionPercentage}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getProgressBgColor(student.completionPercentage)}`}>
                                %{Math.round(student.completionPercentage)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </div>
                        <div className="mt-2 text-[10px] text-gray-400 ml-11">
                          Baslangic: {new Date(student.startedAt).toLocaleDateString('tr-TR')}
                          {student.topicProgresses && (
                            <span className="ml-3">
                              {student.topicProgresses.filter((t) => t.status === 'Completed').length} konu tamamlandi
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {search ? 'Aramanizla eslesen ogrenci bulunamadi' : 'Henuz kayitli ogrenci yok'}
            </h3>
            <p className="text-xs text-gray-500">
              {search ? 'Farkli arama terimleri deneyin' : 'Ogrencilere mufredat atadiktan sonra ilerlemelerini buradan takip edebilirsiniz'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
