'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, FileText, Users, BarChart3, Clock,
  CheckCircle, XCircle, Target, HelpCircle,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminExamDetailPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const { data: exam, isLoading, error } = useQuery({
    queryKey: ['admin-exam-detail', examId],
    queryFn: () => adminApi.getEducationExamDetail(examId),
    enabled: !!examId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl text-center py-20">
        <p className="text-slate-500">Sinav bulunamadi.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Geri Don
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Sinavlara Don
        </button>
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-800">{exam.title}</h1>
          {exam.isPublished ? (
            <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Yayinda</span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Taslak</span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Mentor: <span className="font-medium text-slate-700">{exam.mentorName}</span>
          {exam.mentorEmail && <span className="text-slate-400 ml-1">({exam.mentorEmail})</span>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <HelpCircle className="h-4 w-4" /> Soru Sayisi
          </div>
          <p className="text-2xl font-bold text-slate-800">{exam.questionCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Users className="h-4 w-4" /> Katilim
          </div>
          <p className="text-2xl font-bold text-slate-800">{exam.attemptCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <BarChart3 className="h-4 w-4" /> Ortalama Puan
          </div>
          <p className="text-2xl font-bold text-amber-600">{exam.averageScore}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Target className="h-4 w-4" /> Basari Orani
          </div>
          <p className="text-2xl font-bold text-emerald-600">{exam.passRate}%</p>
        </div>
      </div>

      {/* Exam details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" /> Sinav Bilgileri
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Sure</span>
              <p className="font-medium text-slate-800">{exam.durationMinutes} dakika</p>
            </div>
            <div>
              <span className="text-slate-500">Gecme Puani</span>
              <p className="font-medium text-slate-800">{exam.passingScore}%</p>
            </div>
            <div>
              <span className="text-slate-500">Kapsam</span>
              <p className="font-medium text-slate-800">{exam.scopeType}</p>
            </div>
            <div>
              <span className="text-slate-500">Maks Deneme</span>
              <p className="font-medium text-slate-800">{exam.maxAttempts || 'Sinirsiz'}</p>
            </div>
            <div>
              <span className="text-slate-500">Soru Karistirma</span>
              <p className="font-medium text-slate-800">{exam.shuffleQuestions ? 'Evet' : 'Hayir'}</p>
            </div>
            <div>
              <span className="text-slate-500">Sonuclari Goster</span>
              <p className="font-medium text-slate-800">{exam.showResults ? 'Evet' : 'Hayir'}</p>
            </div>
            {exam.startDate && (
              <div>
                <span className="text-slate-500">Baslangic Tarihi</span>
                <p className="font-medium text-slate-800">{formatDate(exam.startDate)}</p>
              </div>
            )}
            {exam.endDate && (
              <div>
                <span className="text-slate-500">Bitis Tarihi</span>
                <p className="font-medium text-slate-800">{formatDate(exam.endDate)}</p>
              </div>
            )}
            <div>
              <span className="text-slate-500">Olusturulma</span>
              <p className="font-medium text-slate-800">{formatDate(exam.createdAt)}</p>
            </div>
          </div>
          {exam.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Aciklama</span>
              <p className="text-sm text-slate-700 mt-1">{exam.description}</p>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Sorular ({exam.questionCount})
          </h2>
          {exam.questions && exam.questions.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {exam.questions.map((q: any, i: number) => (
                <div key={q.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 line-clamp-2">{q.questionText}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{q.questionType}</span>
                      <span className="text-xs text-slate-400">{q.points} puan</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Henuz soru eklenmemis.</p>
          )}
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Denemeler ({exam.attempts?.length || 0})
        </h2>
        {exam.attempts && exam.attempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Ogrenci</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">E-posta</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Puan</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Sonuc</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Durum</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {exam.attempts.map((a: any) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-2 font-medium text-slate-700">{a.studentName}</td>
                    <td className="py-2.5 px-2 text-slate-500">{a.studentEmail}</td>
                    <td className="py-2.5 px-2">
                      <span className="font-medium">{a.scorePercentage}%</span>
                      <span className="text-xs text-slate-400 ml-1">({a.earnedPoints}/{a.totalPoints})</span>
                    </td>
                    <td className="py-2.5 px-2">
                      {a.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Gecti
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Kaldi
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2"><StatusBadge status={a.status} /></td>
                    <td className="py-2.5 px-2 text-slate-500">{formatDate(a.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Henuz deneme yapilmamis.</p>
        )}
      </div>
    </div>
  );
}
