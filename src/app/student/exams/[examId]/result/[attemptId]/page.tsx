'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  CheckCircle2, XCircle, Clock, Award, ChevronLeft,
  RotateCcw, AlertTriangle, FileText, HelpCircle,
} from 'lucide-react';
import { examsApi } from '@/lib/api/exams';

const questionTypeLabels: Record<string, string> = {
  SingleChoice: 'Tek Secmeli',
  MultipleChoice: 'Cok Secmeli',
  TrueFalse: 'Dogru/Yanlis',
  ShortAnswer: 'Kisa Cevap',
  Essay: 'Yazili',
};

export default function StudentExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const attemptId = params.attemptId as string;

  const { data: resultData, isLoading } = useQuery({
    queryKey: ['exam-result', attemptId],
    queryFn: () => examsApi.getAttemptResult(attemptId),
  });

  const result = resultData?.data ?? resultData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Sonuc bulunamadi</p>
      </div>
    );
  }

  const attempt = result.attempt ?? result;
  const exam = result.exam ?? {};
  const answers = attempt.answers ?? [];
  const questions = result.questions ?? exam.questions ?? [];

  const scorePercentage = attempt.scorePercentage ?? 0;
  const earnedPoints = attempt.earnedPoints ?? 0;
  const totalPoints = attempt.totalPoints ?? questions.reduce((s: number, q: any) => s + (q.points ?? 0), 0);
  const passed = attempt.passed ?? false;
  const passingScore = exam.passingScore ?? attempt.passingScore ?? 0;
  const showResults = exam.showResults ?? result.showResults ?? true;
  const maxAttempts = exam.maxAttempts ?? attempt.maxAttempts;
  const attemptNumber = attempt.attemptNumber ?? 1;

  const correctCount = answers.filter((a: any) => a.isCorrect === true).length;
  const wrongCount = answers.filter((a: any) => a.isCorrect === false).length;
  const pendingCount = answers.filter((a: any) => a.isCorrect === null || a.isCorrect === undefined).length;

  // Calculate duration
  let durationStr = '--';
  if (attempt.completedAt && attempt.startedAt) {
    const start = new Date(attempt.startedAt).getTime();
    const end = new Date(attempt.completedAt).getTime();
    const mins = Math.floor((end - start) / 60000);
    const secs = Math.floor(((end - start) % 60000) / 1000);
    durationStr = `${mins} dk ${secs} sn`;
  }

  const statsRow = [
    { label: 'Sure', value: durationStr, icon: Clock, color: '' },
    { label: 'Dogru', value: correctCount.toString(), icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Yanlis', value: wrongCount.toString(), icon: XCircle, color: 'text-red-500' },
    { label: 'Bekleyen', value: pendingCount.toString(), icon: HelpCircle, color: 'text-amber-500' },
    { label: 'Gecme Puani', value: `%${passingScore}`, icon: Award, color: '' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/student/exams')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Sinavlara Don
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Score Card */}
        <Card className="border border-gray-200 overflow-hidden">
          <div className={cn(
            'p-8 text-center',
            passed
              ? 'bg-gradient-to-br from-green-50 to-emerald-50'
              : 'bg-gradient-to-br from-red-50 to-amber-50'
          )}>
            <div className="text-sm text-gray-500 mb-1">SINAV SONUCU</div>
            <h2 className="text-xl text-gray-900 mb-4 font-medium">{exam.title ?? attempt.examTitle ?? 'Sinav'}</h2>
            {exam.createdByName && (
              <p className="text-sm text-gray-500 mb-6">Egitmen: {exam.createdByName}</p>
            )}

            {/* Score Circle */}
            <div
              className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 mb-4 mx-auto"
              style={{
                borderColor: passed ? '#10b981' : '#ef4444',
                backgroundColor: passed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
              }}
            >
              <div className="text-3xl text-gray-900 font-bold">{earnedPoints}/{totalPoints}</div>
              <div className={cn('text-lg font-medium', passed ? 'text-green-600' : 'text-red-600')}>
                %{scorePercentage}
              </div>
            </div>

            <div className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
              passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}>
              {passed ? <Award className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {passed ? 'BASARILI' : 'BASARISIZ'}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-gray-100 border-t border-gray-100">
            {statsRow.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="p-4 text-center">
                  <Icon className={cn('w-4 h-4 mx-auto mb-1', stat.color || 'text-gray-400')} />
                  <div className="text-lg text-gray-900 font-medium">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Answer Key */}
        {showResults && questions.length > 0 && (
          <>
            <h2 className="text-lg text-gray-900 font-medium flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Cevap Anahtari
            </h2>

            <div className="space-y-3">
              {questions.map((question: any, qIndex: number) => {
                const answer = answers.find((a: any) => a.questionId === question.id);
                const isCorrect = answer?.isCorrect;
                const isPending = isCorrect === null || isCorrect === undefined;

                return (
                  <Card key={question.id} className={cn(
                    'border overflow-hidden',
                    isPending ? 'border-amber-200' :
                    isCorrect ? 'border-green-200' : 'border-red-200'
                  )}>
                    {/* Question Header */}
                    <div className={cn(
                      'px-4 py-2 flex items-center justify-between',
                      isPending ? 'bg-amber-50' :
                      isCorrect ? 'bg-green-50' : 'bg-red-50'
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">#{qIndex + 1}</span>
                        <span className="px-1.5 py-0.5 bg-white/80 rounded text-xs text-gray-600">
                          {questionTypeLabels[question.questionType] ?? question.questionType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <span className="flex items-center gap-1 text-xs text-amber-700">
                            <HelpCircle className="w-3 h-3" /> DEGERLENDIRME BEKLENIYOR
                          </span>
                        ) : isCorrect ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle2 className="w-3 h-3" /> DOGRU +{answer?.pointsEarned ?? question.points}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="w-3 h-3" /> YANLIS 0
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Body */}
                    <div className="p-4">
                      <p className="text-sm text-gray-900 mb-3">{question.questionText}</p>

                      {/* Choice Questions */}
                      {(question.questionType === 'SingleChoice' || question.questionType === 'MultipleChoice') && question.options && (
                        <div className="space-y-1.5 mb-3">
                          {question.options.map((opt: any) => {
                            const correctKeys = (question.correctAnswer ?? '').split(',');
                            const isCorrectOpt = correctKeys.includes(opt.key);
                            const studentSelected =
                              answer?.answerText?.split(',').includes(opt.key) ||
                              answer?.selectedOptions?.includes(opt.key);

                            return (
                              <div
                                key={opt.key}
                                className={cn(
                                  'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                                  isCorrectOpt ? 'bg-green-50 text-green-700 border border-green-200' :
                                  studentSelected ? 'bg-red-50 text-red-600 border border-red-200' :
                                  'text-gray-600'
                                )}
                              >
                                <span className="w-5">{opt.key})</span>
                                <span className="flex-1">{opt.text}</span>
                                {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                                {studentSelected && !isCorrectOpt && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TrueFalse */}
                      {question.questionType === 'TrueFalse' && (
                        <div className="text-xs space-y-1 mb-3">
                          <div className="text-gray-600">
                            Sizin cevabin: <span className={isCorrect ? 'text-green-700' : 'text-red-600'}>{answer?.answerText}</span>
                          </div>
                          {!isCorrect && !isPending && (
                            <div className="text-green-700">
                              Dogru cevap: {question.correctAnswer}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ShortAnswer */}
                      {question.questionType === 'ShortAnswer' && (
                        <div className="text-xs space-y-1 mb-3">
                          <div className="text-gray-600">
                            Sizin cevabin: <span className={isCorrect ? 'text-green-700' : 'text-red-600'}>{answer?.answerText}</span>
                          </div>
                          {!isCorrect && !isPending && (
                            <div className="text-green-700">
                              Dogru cevap: {question.correctAnswer}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Essay */}
                      {question.questionType === 'Essay' && (
                        <div className="text-xs space-y-2 mb-3">
                          <div className="p-2 bg-gray-50 rounded-lg text-gray-700 max-h-24 overflow-y-auto">
                            &quot;{answer?.answerText || '--'}&quot;
                          </div>
                          {isPending && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="w-3 h-3" />
                              Egitmen tarafindan degerlendirilecektir
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && !isPending && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-700">
                            <strong>Aciklama:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-4 pb-8">
          <Link href="/student/exams">
            <Button variant="outline" className="border-gray-200 gap-1">
              <ChevronLeft className="w-4 h-4" /> Sinavlara Don
            </Button>
          </Link>
          {(!maxAttempts || attemptNumber < maxAttempts) && (
            <Link href={`/student/exams/${examId}/take/new`}>
              <Button className="bg-gradient-to-r from-teal-600 to-green-600 text-white gap-1">
                <RotateCcw className="w-4 h-4" /> Tekrar Coz
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
