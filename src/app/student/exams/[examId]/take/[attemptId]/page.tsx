'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle,
  CheckCircle2, Send, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { examsApi } from '@/lib/api/exams';

interface ExamOption {
  key: string;
  text: string;
}

interface ExamQuestion {
  id: string;
  questionText: string;
  questionType: 'SingleChoice' | 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay';
  options?: ExamOption[];
  points: number;
  imageUrl?: string;
}

interface ExamSession {
  attemptId: string;
  questions: ExamQuestion[];
  durationMinutes: number | null;
  startedAt: string;
  examTitle: string;
}

export default function StudentExamTakePage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const attemptIdParam = params.attemptId as string;

  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showNav, setShowNav] = useState(false);
  const autoSubmittedRef = useRef(false);

  // Start or resume exam
  useEffect(() => {
    const initExam = async () => {
      try {
        let data: any;
        if (attemptIdParam === 'new') {
          data = await examsApi.startExam(examId);
        } else {
          // Resume existing attempt — startExam should handle idempotency
          // or we fetch the attempt data
          data = await examsApi.startExam(examId);
        }

        const result = data?.data ?? data;
        const attemptId = result.attemptId ?? result.id;

        setSession({
          attemptId,
          questions: result.questions ?? [],
          durationMinutes: result.durationMinutes ?? null,
          startedAt: result.startedAt ?? new Date().toISOString(),
          examTitle: result.examTitle ?? result.title ?? 'Sinav',
        });

        // Calculate remaining time
        if (result.durationMinutes) {
          const startTime = new Date(result.startedAt ?? new Date()).getTime();
          const endTime = startTime + result.durationMinutes * 60 * 1000;
          const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setTimeLeft(remaining);
        }

        // Update URL if we got a new attemptId
        if (attemptIdParam === 'new' && attemptId) {
          window.history.replaceState(null, '', `/student/exams/${examId}/take/${attemptId}`);
        }
      } catch (err: any) {
        toast.error(err?.message ?? 'Sinav baslatilamadi');
        router.push('/student/exams');
      } finally {
        setLoading(false);
      }
    };

    initExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            handleSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft !== null]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleMultipleAnswer = useCallback((questionId: string, optionKey: string) => {
    setAnswers(prev => {
      const current = prev[questionId] ? prev[questionId].split(',').filter(Boolean) : [];
      const updated = current.includes(optionKey)
        ? current.filter(k => k !== optionKey)
        : [...current, optionKey];
      return { ...prev, [questionId]: updated.join(',') };
    });
  }, []);

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!session) return;
    if (submitting) return;
    setSubmitting(true);

    try {
      const formattedAnswers = session.questions.map(q => ({
        questionId: q.id,
        answerText: answers[q.id] ?? '',
        selectedOptions: q.questionType === 'MultipleChoice'
          ? (answers[q.id] ?? '').split(',').filter(Boolean)
          : answers[q.id] ? [answers[q.id]] : [],
      }));

      await examsApi.submitExam(session.attemptId, formattedAnswers);

      if (isAutoSubmit) {
        toast.info('Sure doldu, sinaviniz otomatik gonderildi');
      } else {
        toast.success('Sinav basariyla gonderildi');
      }

      router.push(`/student/exams/${examId}/result/${session.attemptId}`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Sinav gonderilemedi');
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Sinav hazirlaniyor...</p>
        </div>
      </div>
    );
  }

  const questions = session.questions;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].trim() !== '').length;
  const unansweredQuestions = questions
    .map((q, i) => (!answers[q.id] || answers[q.id].trim() === '' ? i + 1 : null))
    .filter((n): n is number => n !== null);

  const isWarning = timeLeft !== null && timeLeft < 300;

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
        <p className="text-gray-500">Soru bulunamadi</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      {/* Top Bar */}
      <div className={cn(
        'h-14 flex items-center px-4 gap-4 border-b flex-shrink-0',
        isWarning
          ? 'bg-red-50 border-red-200'
          : 'bg-gradient-to-r from-teal-50 to-green-50 border-teal-200'
      )}>
        <h2 className="text-sm text-gray-900 truncate flex-1 font-medium">{session.examTitle}</h2>

        {timeLeft !== null && (
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
            isWarning
              ? 'bg-red-100 text-red-700 animate-pulse'
              : 'bg-white text-gray-700 border border-gray-200'
          )}>
            <Clock className="w-4 h-4" />
            <span className="tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        )}

        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Bitir
        </button>
      </div>

      {/* Question Navigation Strip */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          {/* Mobile toggle */}
          <button
            onClick={() => setShowNav(!showNav)}
            className="md:hidden text-xs text-gray-500 mr-2 px-2 py-1 border border-gray-200 rounded"
          >
            {currentIndex + 1}/{questions.length}
          </button>

          {/* Desktop nav pills */}
          <div className={cn('flex-wrap gap-1', showNav ? 'flex' : 'hidden md:flex')}>
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] && answers[q.id].trim() !== '';
              const isFlagged = flagged.has(q.id);
              const isCurrent = i === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIndex(i); setShowNav(false); }}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all relative',
                    isCurrent
                      ? 'bg-teal-600 text-white ring-2 ring-teal-300'
                      : isAnswered
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                  )}
                >
                  {i + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="ml-auto text-xs text-gray-500 hidden md:block">
            {answeredCount}/{questions.length} cevaplanmis
            {flagged.size > 0 && <span className="ml-2 text-amber-600">{flagged.size} isaretli</span>}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Soru {currentIndex + 1} / {questions.length}</span>
              <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs border border-teal-200">
                {currentQuestion.points} puan
              </span>
            </div>
            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                flagged.has(currentQuestion.id)
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-amber-50 hover:text-amber-600'
              )}
            >
              <Flag className="w-4 h-4" />
              {flagged.has(currentQuestion.id) ? 'Isaretli' : 'Isaretleme'}
            </button>
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <p className="text-lg text-gray-900 leading-relaxed">{currentQuestion.questionText}</p>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="Soru gorseli"
                className="mt-4 max-w-full rounded-lg border border-gray-200"
              />
            )}
            {currentQuestion.questionType === 'MultipleChoice' && (
              <p className="text-sm text-gray-500 mt-2">(Birden fazla secenek isaretleyebilirsiniz)</p>
            )}
          </div>

          {/* Answer Area */}
          <div className="space-y-3">
            {/* SingleChoice */}
            {currentQuestion.questionType === 'SingleChoice' && currentQuestion.options?.map(opt => {
              const selected = answers[currentQuestion.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setAnswer(currentQuestion.id, opt.key)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    selected
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                    selected ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}>
                    {opt.key}
                  </span>
                  <span className={cn('text-sm', selected ? 'text-teal-800' : 'text-gray-700')}>{opt.text}</span>
                  {selected && <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto" />}
                </button>
              );
            })}

            {/* MultipleChoice */}
            {currentQuestion.questionType === 'MultipleChoice' && currentQuestion.options?.map(opt => {
              const selectedKeys = answers[currentQuestion.id]?.split(',').filter(Boolean) || [];
              const selected = selectedKeys.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleMultipleAnswer(currentQuestion.id, opt.key)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    selected
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0',
                    selected ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}>
                    {opt.key}
                  </span>
                  <span className={cn('text-sm', selected ? 'text-teal-800' : 'text-gray-700')}>{opt.text}</span>
                  {selected && <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto" />}
                </button>
              );
            })}

            {/* TrueFalse */}
            {currentQuestion.questionType === 'TrueFalse' && (
              <div className="flex gap-4">
                {['Dogru', 'Yanlis'].map(val => {
                  const selected = answers[currentQuestion.id] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => setAnswer(currentQuestion.id, val)}
                      className={cn(
                        'flex-1 p-4 rounded-xl border-2 text-center transition-all',
                        selected
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      )}
                    >
                      <span className={cn('text-sm', selected ? 'text-teal-800' : 'text-gray-700')}>{val}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ShortAnswer */}
            {currentQuestion.questionType === 'ShortAnswer' && (
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">Cevabin:</label>
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={e => setAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Cevabinizi yazin..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 text-sm"
                />
              </div>
            )}

            {/* Essay */}
            {currentQuestion.questionType === 'Essay' && (
              <div>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={e => setAnswer(currentQuestion.id, e.target.value)}
                  rows={8}
                  placeholder="Cevabinizi yazin..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 text-sm resize-none"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{(answers[currentQuestion.id] || '').split(/\s+/).filter(Boolean).length} kelime</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="text-xs text-gray-500">
          Ilerleme: {answeredCount}/{questions.length} cevaplanmis
          {flagged.size > 0 && <span className="ml-2 text-amber-600">* {flagged.size} isaretlenmis</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            className="border-gray-200 gap-1 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Onceki
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="bg-gradient-to-r from-teal-600 to-green-600 text-white gap-1 text-sm"
            >
              Sonraki <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
              className="bg-gradient-to-r from-teal-600 to-green-600 text-white gap-1 text-sm"
            >
              <Send className="w-4 h-4" /> Sinavi Bitir
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg text-gray-900 font-medium">Sinavi Bitirmek Istiyor musunuz?</h3>
            </div>

            <div className="space-y-2 mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Toplam:</span>
                <span className="text-gray-900">{questions.length} soru</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cevaplanmis:</span>
                <span className="text-green-700">{answeredCount} soru</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bos:</span>
                <span className={unansweredQuestions.length > 0 ? 'text-red-600' : 'text-gray-900'}>
                  {unansweredQuestions.length} soru
                  {unansweredQuestions.length > 0 && unansweredQuestions.length <= 10 && (
                    <span className="text-xs text-gray-400 ml-1">(#{unansweredQuestions.join(', #')})</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Isaretlenmis:</span>
                <span className="text-amber-600">{flagged.size} soru</span>
              </div>
              {timeLeft !== null && (
                <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                  <span className="text-gray-600">Kalan sure:</span>
                  <span className="text-gray-900">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Sinavi bitirdikten sonra cevaplari degistiremezsiniz.</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1 border-gray-200"
              >
                Sinava Don
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-teal-600 to-green-600 text-white"
              >
                {submitting ? 'Gonderiliyor...' : 'Sinavi Bitir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
