'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useCreateExam,
  usePublishExam,
  useUnpublishExam,
  useAddQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from '@/lib/hooks/use-exams';
import type { AddQuestionInput, QuestionOptionDto } from '@/lib/api/exams';
import { toast } from 'sonner';
import {
  Plus, ChevronLeft, Edit, Trash2, Eye, Send,
  FileText, GripVertical, ImagePlus, ChevronDown, ChevronUp,
  Target, XCircle, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const scopeTypeLabels: Record<string, string> = {
  General: 'Genel',
  Session: 'Seans',
  Course: 'Kurs',
  GroupClass: 'Grup Dersi',
};

const questionTypeLabels: Record<string, string> = {
  SingleChoice: 'Tek Secimli',
  MultipleChoice: 'Coktan Secmeli',
  TrueFalse: 'Dogru / Yanlis',
  ShortAnswer: 'Kisa Cevap',
  Essay: 'Acik Uclu',
};

export default function MentorExamCreatePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scopeType, setScopeType] = useState('General');
  const [duration, setDuration] = useState('');
  const [passingScore, setPassingScore] = useState('70');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showResults, setShowResults] = useState(true);

  const [savedExamId, setSavedExamId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<
    Array<{ id: string; questionText: string; questionType: string; points: number; sortOrder: number; options?: QuestionOptionDto[]; correctAnswer: string | null; explanation: string | null; imageUrl: string | null }>
  >([]);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<typeof localQuestions[number] | null>(null);

  const createExamMutation = useCreateExam();
  const publishMutation = usePublishExam();
  const addQuestionMutation = useAddQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  const totalPoints = localQuestions.reduce((s, q) => s + q.points, 0);

  const handleSaveExam = async () => {
    if (!title.trim()) {
      toast.error('Sinav adi zorunludur.');
      return;
    }
    try {
      const result = await createExamMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        scopeType,
        durationMinutes: duration ? parseInt(duration) : 0,
        passingScore: parseInt(passingScore) || 70,
        shuffleQuestions,
        showResults,
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
      });
      setSavedExamId(result.id);
      toast.success('Sinav bilgileri kaydedildi. Simdi soru ekleyebilirsiniz.');
    } catch {
      // error handled by client interceptor
    }
  };

  const handleSaveQuestion = async (q: {
    questionText: string;
    questionType: string;
    points: number;
    options?: QuestionOptionDto[];
    correctAnswer: string;
    explanation: string;
    imageUrl: string;
  }) => {
    if (!savedExamId) return;

    const input: AddQuestionInput = {
      questionText: q.questionText,
      questionType: q.questionType,
      points: q.points,
      sortOrder: localQuestions.length + 1,
      options: q.options || null,
      correctAnswer: q.correctAnswer || null,
      explanation: q.explanation || null,
      imageUrl: q.imageUrl || null,
    };

    try {
      if (editingQuestion) {
        await updateQuestionMutation.mutateAsync({
          examId: savedExamId,
          questionId: editingQuestion.id,
          data: { ...input, sortOrder: editingQuestion.sortOrder },
        });
        setLocalQuestions((prev) =>
          prev.map((pq) =>
            pq.id === editingQuestion.id
              ? { ...pq, ...input, sortOrder: editingQuestion.sortOrder }
              : pq
          )
        );
        toast.success('Soru guncellendi.');
      } else {
        const result = await addQuestionMutation.mutateAsync({
          examId: savedExamId,
          data: input,
        });
        setLocalQuestions((prev) => [
          ...prev,
          {
            id: result.id,
            ...input,
            sortOrder: prev.length + 1,
          },
        ]);
        toast.success('Soru eklendi.');
      }
    } catch {
      // error handled by client interceptor
    }

    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!savedExamId) return;
    try {
      await deleteQuestionMutation.mutateAsync({ examId: savedExamId, questionId: qId });
      setLocalQuestions((prev) =>
        prev.filter((q) => q.id !== qId).map((q, i) => ({ ...q, sortOrder: i + 1 }))
      );
      toast.success('Soru silindi.');
    } catch {
      // error handled by client interceptor
    }
  };

  const handlePublish = async () => {
    if (!savedExamId) return;
    try {
      await publishMutation.mutateAsync(savedExamId);
      toast.success('Sinav yayinlandi.');
      router.push('/mentor/exams');
    } catch {
      // error handled by client interceptor
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <button
        onClick={() => router.push('/mentor/exams')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Sinavlarima Don
      </button>

      <h1 className="text-2xl text-gray-900 font-semibold">Yeni Sinav Olustur</h1>

      {/* Exam Info Card */}
      <Card className="p-6 border border-gray-200">
        <h2 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Sinav Bilgileri
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Sinav Adi *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ornegin: TYT Matematik Deneme 1"
              disabled={!!savedExamId}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Aciklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Sinav hakkinda kisa bir aciklama..."
              disabled={!!savedExamId}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 resize-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Kapsam</label>
              <select
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value)}
                disabled={!!savedExamId}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
              >
                {Object.entries(scopeTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Sure (dakika)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="0 = suresiz"
                disabled={!!savedExamId}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Gecme Puani (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                min={0}
                max={100}
                disabled={!!savedExamId}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Maks. Deneme Sayisi</label>
              <input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="Bos = sinirsiz"
                min={1}
                disabled={!!savedExamId}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                disabled={!!savedExamId}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Soru sirasini karistir</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showResults}
                onChange={(e) => setShowResults(e.target.checked)}
                disabled={!!savedExamId}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Sonuclari ogrenciye goster</span>
            </label>
          </div>

          {!savedExamId && (
            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-teal-600 to-green-600 text-white"
                onClick={handleSaveExam}
                disabled={createExamMutation.isPending}
              >
                {createExamMutation.isPending ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Questions Section - only after exam saved */}
      {savedExamId && (
        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              Sorular
              <span className="text-sm text-gray-500">
                ({localQuestions.length} soru, toplam {totalPoints} puan)
              </span>
            </h2>
            <Button
              onClick={() => {
                setEditingQuestion(null);
                setShowQuestionModal(true);
              }}
              className="bg-gradient-to-r from-teal-600 to-green-600 text-white gap-1"
            >
              <Plus className="w-4 h-4" /> Soru Ekle
            </Button>
          </div>

          {localQuestions.length === 0 ? (
            <div className="py-12 text-center">
              <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Henuz soru eklenmedi</p>
              <p className="text-xs text-gray-400">
                Soru ekle butonuna tiklayarak ilk sorunuzu olusturun.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {localQuestions.map((q, idx) => (
                <QuestionPreviewCard
                  key={q.id}
                  question={q}
                  index={idx + 1}
                  onEdit={() => {
                    setEditingQuestion(q);
                    setShowQuestionModal(true);
                  }}
                  onDelete={() => handleDeleteQuestion(q.id)}
                />
              ))}
            </div>
          )}

          {localQuestions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Sinav durumu:{' '}
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700">
                  TASLAK
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-gradient-to-r from-teal-600 to-green-600 text-white gap-1 text-sm"
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                >
                  <Send className="w-4 h-4" /> Yayinla
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <QuestionModal
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onClose={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}

// ===== Question Preview Card =====

function QuestionPreviewCard({
  question,
  index,
  onEdit,
  onDelete,
}: {
  question: {
    questionText: string;
    questionType: string;
    points: number;
    options?: QuestionOptionDto[];
    correctAnswer: string | null;
    explanation: string | null;
  };
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-teal-200 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1 text-gray-400 flex-shrink-0 mt-0.5">
          <GripVertical className="w-4 h-4 cursor-grab" />
          <span className="text-xs text-gray-500 w-5">#{index}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-xs border border-teal-200">
              {questionTypeLabels[question.questionType] ?? question.questionType}
            </span>
            <span className="text-xs text-gray-500">{question.points} puan</span>
          </div>
          <p className="text-sm text-gray-900 line-clamp-2">{question.questionText}</p>

          {expanded && (
            <div className="mt-3 space-y-2">
              {/* Options for choice questions */}
              {question.options && question.options.length > 0 && (
                <div className="space-y-1">
                  {question.options.map((opt) => {
                    const correctKeys = question.correctAnswer?.split(',') ?? [];
                    const isCorrect = correctKeys.includes(opt.key);
                    return (
                      <div
                        key={opt.key}
                        className={cn(
                          'flex items-center gap-2 text-xs px-2 py-1 rounded',
                          isCorrect ? 'bg-green-50 text-green-700' : 'text-gray-600'
                        )}
                      >
                        <span className="w-5">{opt.key})</span>
                        <span>{opt.text}</span>
                        {isCorrect && <CheckCircle2 className="w-3 h-3 text-green-600 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True/False answer */}
              {question.questionType === 'TrueFalse' && (
                <div className="text-xs text-gray-600">
                  Dogru Cevap:{' '}
                  <span className="text-green-700">{question.correctAnswer}</span>
                </div>
              )}

              {/* Short answer */}
              {question.questionType === 'ShortAnswer' && (
                <div className="text-xs text-gray-600">
                  Dogru Cevap:{' '}
                  <span className="text-green-700">{question.correctAnswer}</span>
                </div>
              )}

              {/* Essay note */}
              {question.questionType === 'Essay' && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="w-3 h-3" />
                  Manuel degerlendirme gerektirir
                </div>
              )}

              {/* Explanation */}
              {question.explanation && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100">
                  <strong>Aciklama:</strong> {question.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-teal-600 rounded-md hover:bg-teal-50"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Question Modal =====

function QuestionModal({
  question,
  onSave,
  onClose,
}: {
  question: {
    questionText: string;
    questionType: string;
    points: number;
    options?: QuestionOptionDto[];
    correctAnswer: string | null;
    explanation: string | null;
    imageUrl?: string | null;
  } | null;
  onSave: (q: {
    questionText: string;
    questionType: string;
    points: number;
    options?: QuestionOptionDto[];
    correctAnswer: string;
    explanation: string;
    imageUrl: string;
  }) => void;
  onClose: () => void;
}) {
  const [questionType, setQuestionType] = useState(question?.questionType || 'SingleChoice');
  const [questionText, setQuestionText] = useState(question?.questionText || '');
  const [points, setPoints] = useState(question?.points?.toString() || '10');
  const [explanation, setExplanation] = useState(question?.explanation || '');
  const [imageUrl, setImageUrl] = useState(question?.imageUrl || '');
  const [options, setOptions] = useState<QuestionOptionDto[]>(
    question?.options && question.options.length > 0
      ? question.options
      : [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ]
  );
  const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || '');
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>(
    question?.questionType === 'MultipleChoice' ? (question.correctAnswer?.split(',') || []) : []
  );

  const handleTypeChange = (type: string) => {
    setQuestionType(type);
    setCorrectAnswer('');
    setSelectedMultiple([]);
    if (type === 'SingleChoice' || type === 'MultipleChoice') {
      setOptions([
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ]);
    }
  };

  const addOption = () => {
    const nextKey = String.fromCharCode(65 + options.length);
    setOptions([...options, { key: nextKey, text: '' }]);
  };

  const toggleMultipleCorrect = (key: string) => {
    setSelectedMultiple((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    if (!questionText.trim()) {
      toast.error('Soru metni zorunludur.');
      return;
    }
    const finalCorrect =
      questionType === 'MultipleChoice' ? selectedMultiple.join(',') : correctAnswer;
    onSave({
      questionText,
      questionType,
      points: parseInt(points) || 10,
      options: questionType === 'SingleChoice' || questionType === 'MultipleChoice' ? options : undefined,
      correctAnswer: finalCorrect,
      explanation,
      imageUrl,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg text-gray-900 font-semibold">
            {question ? 'Soruyu Duzenle' : 'Soru Ekle'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Question Type */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Soru Tipi *</label>
            <select
              value={questionType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
            >
              {Object.entries(questionTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Soru Metni *</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              placeholder="Sorunuzu yazin..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Gorsel URL (opsiyonel)</label>
            <div className="flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... gorsel linki"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Puan *</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min={1}
              className="w-32 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* === Type-specific fields === */}

          {/* SingleChoice Options */}
          {questionType === 'SingleChoice' && (
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">Secenekler</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={correctAnswer === opt.key}
                      onChange={() => setCorrectAnswer(opt.key)}
                      className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="w-6 text-sm text-gray-500">{opt.key})</span>
                    <input
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[i] = { ...updated[i], text: e.target.value };
                        setOptions(updated);
                      }}
                      placeholder={`Secenek ${opt.key}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                    />
                    {correctAnswer === opt.key && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-200">
                        DOGRU
                      </span>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button
                    onClick={addOption}
                    className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mt-1"
                  >
                    <Plus className="w-3 h-3" /> Secenek Ekle
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MultipleChoice Options */}
          {questionType === 'MultipleChoice' && (
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">
                Secenekler (birden fazla dogru isaretlenebilir)
              </label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedMultiple.includes(opt.key)}
                      onChange={() => toggleMultipleCorrect(opt.key)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="w-6 text-sm text-gray-500">{opt.key})</span>
                    <input
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[i] = { ...updated[i], text: e.target.value };
                        setOptions(updated);
                      }}
                      placeholder={`Secenek ${opt.key}`}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400"
                    />
                    {selectedMultiple.includes(opt.key) && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-200">
                        DOGRU
                      </span>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button
                    onClick={addOption}
                    className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 mt-1"
                  >
                    <Plus className="w-3 h-3" /> Secenek Ekle
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TrueFalse */}
          {questionType === 'TrueFalse' && (
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">Dogru Cevap *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tf"
                    checked={correctAnswer === 'Dogru'}
                    onChange={() => setCorrectAnswer('Dogru')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-sm">Dogru</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tf"
                    checked={correctAnswer === 'Yanlis'}
                    onChange={() => setCorrectAnswer('Yanlis')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-sm">Yanlis</span>
                </label>
              </div>
            </div>
          )}

          {/* ShortAnswer */}
          {questionType === 'ShortAnswer' && (
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block">Dogru Cevap *</label>
              <input
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Dogru cevabi yazin"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Buyuk/kucuk harf duyarsiz karsilastirilir
              </p>
            </div>
          )}

          {/* Essay Note */}
          {questionType === 'Essay' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="mb-1">Acik uclu sorular otomatik puanlanmaz.</p>
                <p>Egitmen sinav sonrasi manuel degerlendirir.</p>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="text-sm text-gray-700 mb-1.5 block">Aciklama (opsiyonel)</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder="Ogrenci cevap sonrasi bu aciklamayi gorur..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-400 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-gray-200">
            Vazgec
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-teal-600 to-green-600 text-white"
          >
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}
