'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAssignment, useSubmitAssignment } from '@/lib/hooks/use-assignments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  ArrowLeft,
  FileCheck,
  CalendarDays,
  Clock,
  Star,
  Download,
  Send,
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import type { AssignmentMaterialDto, SubmissionDto } from '@/lib/api/assignments';

const TYPE_LABELS: Record<string, string> = {
  Homework: 'Odev', Project: 'Proje', Practice: 'Pratik',
  Quiz: 'Quiz', Reading: 'Okuma', Research: 'Arastirma',
};
const DIFFICULTY_LABELS: Record<string, string> = { Easy: 'Kolay', Medium: 'Orta', Hard: 'Zor' };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getDueCountdown(dueDate?: string): { text: string; urgent: boolean } | null {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff < 0) return { text: 'Sure doldu', urgent: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return { text: `${days} gun ${hours % 24} saat kaldi`, urgent: days < 2 };
  if (hours > 0) return { text: `${hours} saat kaldi`, urgent: true };
  const minutes = Math.floor(diff / (1000 * 60));
  return { text: `${minutes} dakika kaldi`, urgent: true };
}

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: assignment, isLoading } = useAssignment(id);
  const submitMutation = useSubmitAssignment();

  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="border-0 shadow-sm animate-pulse">
          <CardContent className="p-6 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Odev bulunamadi</p>
            <Link href="/student/assignments">
              <Button variant="outline" size="sm" className="mt-3 text-xs">Geri Don</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find my submission (first one — student sees their own)
  const mySubmission: SubmissionDto | undefined = assignment.submissions?.[0];
  const hasSubmitted = !!mySubmission;
  const isReviewed = mySubmission?.review != null;
  const needsRevision = mySubmission?.status === 'RevisionRequired';
  const canSubmit = !hasSubmitted || needsRevision;
  const countdown = getDueCountdown(assignment.dueDate);

  const handleSubmit = async () => {
    if (!submissionText.trim() && !fileUrl.trim()) {
      toast.error('Metin veya dosya gereklidir');
      return;
    }
    try {
      await submitMutation.mutateAsync({
        assignmentId: id,
        data: {
          submissionText: submissionText.trim() || undefined,
          fileUrl: fileUrl.trim() || undefined,
          originalFileName: originalFileName.trim() || undefined,
        },
      });
      toast.success('Teslim basarili');
      setSubmissionText('');
      setFileUrl('');
      setOriginalFileName('');
    } catch {
      // error handled by interceptor
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/student/assignments">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900">{assignment.title}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {TYPE_LABELS[assignment.assignmentType] ?? assignment.assignmentType}
            </Badge>
            {assignment.difficultyLevel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {DIFFICULTY_LABELS[assignment.difficultyLevel] ?? assignment.difficultyLevel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Due date countdown */}
      {countdown && (
        <div className={cn(
          'flex items-center gap-2 p-3 rounded-lg mb-4 text-sm',
          countdown.urgent ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        )}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{countdown.text}</span>
        </div>
      )}

      {/* Assignment Info */}
      <Card className="border-0 shadow-sm mb-4">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {assignment.estimatedMinutes != null && (
              <div>
                <span className="text-xs text-gray-400 block">Tahmini Sure</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {assignment.estimatedMinutes} dk
                </span>
              </div>
            )}
            {assignment.maxScore != null && (
              <div>
                <span className="text-xs text-gray-400 block">Maks Puan</span>
                <span className="font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" /> {assignment.maxScore}
                </span>
              </div>
            )}
            {assignment.dueDate && (
              <div>
                <span className="text-xs text-gray-400 block">Son Teslim</span>
                <span className="font-medium flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> {formatDate(assignment.dueDate)}
                </span>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-400 block">Gec Teslim</span>
              <span className="font-medium">
                {assignment.allowLateSubmission
                  ? `Evet${assignment.latePenaltyPercent ? ` (%${assignment.latePenaltyPercent} ceza)` : ''}`
                  : 'Hayir'}
              </span>
            </div>
          </div>

          {assignment.description && (
            <div>
              <span className="text-xs text-gray-400 block mb-1">Aciklama</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {assignment.instructions && (
            <div>
              <span className="text-xs text-gray-400 block mb-1">Talimatlar</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-teal-50 p-3 rounded-lg">{assignment.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials */}
      {assignment.materials.length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Materyaller</h3>
            <div className="space-y-2">
              {assignment.materials.map((mat: AssignmentMaterialDto) => (
                <div
                  key={mat.libraryItemId}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-800 truncate">{mat.title}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{mat.fileFormat}</Badge>
                    {mat.isRequired && (
                      <Badge className="text-[9px] px-1 py-0 bg-red-100 text-red-600">Zorunlu</Badge>
                    )}
                  </div>
                  {mat.fileUrl && (
                    <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-teal-600">
                        <Download className="w-3 h-3 mr-1" /> Indir
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Area */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Teslim</h3>

          {/* Previous submission info */}
          {hasSubmitted && (
            <div className={cn(
              'rounded-lg p-4 mb-4 border',
              isReviewed
                ? 'bg-teal-50 border-teal-100'
                : needsRevision
                  ? 'bg-orange-50 border-orange-100'
                  : 'bg-blue-50 border-blue-100'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {mySubmission.status === 'Approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {mySubmission.status === 'RevisionRequired' && <RotateCcw className="w-4 h-4 text-orange-600" />}
                {mySubmission.status === 'Rejected' && <XCircle className="w-4 h-4 text-red-600" />}
                {mySubmission.status === 'Pending' && <Clock className="w-4 h-4 text-blue-600" />}
                <span className="text-sm font-medium text-gray-800">
                  {mySubmission.status === 'Approved' && 'Onaylandi'}
                  {mySubmission.status === 'RevisionRequired' && 'Revizyon Gerekli'}
                  {mySubmission.status === 'Rejected' && 'Reddedildi'}
                  {mySubmission.status === 'Pending' && 'Degerlendirme Bekleniyor'}
                </span>
                {mySubmission.isLate && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">Gec Teslim</Badge>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-2">Teslim: {formatDate(mySubmission.submittedAt)}</p>

              {mySubmission.submissionText && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{mySubmission.submissionText}</p>
              )}
              {mySubmission.fileUrl && (
                <a
                  href={mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 mb-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  {mySubmission.originalFileName ?? 'Dosyayi Indir'}
                </a>
              )}

              {/* Review */}
              {mySubmission.review && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-600 block mb-1">Degerlendirme</span>
                  {mySubmission.review.score != null && (
                    <p className="text-sm font-semibold text-teal-700 mb-1">
                      Puan: {mySubmission.review.score}{assignment.maxScore ? `/${assignment.maxScore}` : ''}
                    </p>
                  )}
                  {mySubmission.review.feedback && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{mySubmission.review.feedback}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submission form */}
          {canSubmit && (
            <div className="space-y-3">
              {needsRevision && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                  <RotateCcw className="w-4 h-4" />
                  <span>Revizyon istendi. Tekrar teslim edebilirsiniz.</span>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teslim Metni</label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Cevaplarinizi veya aciklamalarinizi yazin..."
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dosya URL (opsiyonel)</label>
                <Input
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>

              {fileUrl && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Dosya Adi</label>
                  <Input
                    value={originalFileName}
                    onChange={(e) => setOriginalFileName(e.target.value)}
                    placeholder="odev.pdf"
                    className="text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="text-sm bg-gradient-to-r from-teal-600 to-green-600 text-white"
                >
                  <Send className="w-4 h-4 mr-1" />
                  {submitMutation.isPending ? 'Gonderiliyor...' : 'Teslim Et'}
                </Button>
              </div>
            </div>
          )}

          {/* Already submitted and not revision needed */}
          {hasSubmitted && !canSubmit && !isReviewed && (
            <p className="text-xs text-gray-400 text-center py-2">Tesliminiz degerlendirme bekliyor</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
