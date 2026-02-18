'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, RotateCw,
  ChevronDown, ChevronRight, Video, FileText, Clock,
  BookOpen, User, MessageSquare, AlertTriangle, History,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  adminApi,
  type CourseReviewDetailDto,
  type ReviewSectionDto,
  type ReviewLectureDto,
  type ReviewRoundDto,
  type LectureCommentDto,
} from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

// ===== Helpers =====

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PendingReview: 'bg-blue-100 text-blue-800',
    RevisionRequested: 'bg-orange-100 text-orange-800',
    Rejected: 'bg-red-100 text-red-800',
    Published: 'bg-green-100 text-green-800',
    Draft: 'bg-yellow-100 text-yellow-800',
  };
  const labels: Record<string, string> = {
    PendingReview: 'İncelemede',
    RevisionRequested: 'Revizyon İstendi',
    Rejected: 'Reddedildi',
    Published: 'Yayında',
    Draft: 'Taslak',
  };
  return <Badge className={`${map[status] || 'bg-gray-100 text-gray-800'} text-xs`}>{labels[status] || status}</Badge>;
}

function FlagBadge({ flag }: { flag: string }) {
  if (!flag || flag === 'None') return null;
  const map: Record<string, string> = {
    Risky: 'bg-yellow-100 text-yellow-800',
    Inappropriate: 'bg-red-100 text-red-800',
    CopyrightIssue: 'bg-purple-100 text-purple-800',
  };
  const labels: Record<string, string> = {
    Risky: 'Riskli',
    Inappropriate: 'Uygunsuz',
    CopyrightIssue: 'Telif Hakkı',
  };
  return <Badge className={`${map[flag] || 'bg-gray-100 text-gray-800'} text-xs`}>{labels[flag] || flag}</Badge>;
}

const outcomeLabels: Record<string, string> = {
  Approved: 'Onaylandı',
  Rejected: 'Reddedildi',
  RevisionRequested: 'Revizyon İstendi',
};

const outcomeColors: Record<string, string> = {
  Approved: 'text-green-600',
  Rejected: 'text-red-600',
  RevisionRequested: 'text-orange-600',
};

// ===== Main Page =====

export default function CourseReviewDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['admin', 'course-review-detail', courseId],
    queryFn: () => adminApi.getCourseReviewDetail(courseId),
    enabled: !!courseId,
  });

  // State
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [lectureComments, setLectureComments] = useState<Record<string, { flag: string; comment: string }>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mutation
  const reviewMutation = useMutation({
    mutationFn: (data: { outcome: string; generalNotes?: string; lectureComments?: { lectureId: string; flag: string; comment: string }[] }) =>
      adminApi.reviewCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-review-detail', courseId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course-reviews'] });
      toast.success('İnceleme başarıyla gönderildi.');
      router.push('/admin/course-reviews');
    },
    onError: () => { toast.error('İnceleme gönderilirken hata oluştu.'); },
    onSettled: () => { setSubmitting(false); },
  });

  const updateLectureComment = (lectureId: string, field: 'flag' | 'comment', value: string) => {
    setLectureComments((prev) => ({
      ...prev,
      [lectureId]: { flag: prev[lectureId]?.flag || 'None', comment: prev[lectureId]?.comment || '', [field]: value },
    }));
  };

  const collectLectureComments = () =>
    Object.entries(lectureComments)
      .filter(([, v]) => v.flag !== 'None' || v.comment.trim() !== '')
      .map(([lectureId, v]) => ({ lectureId, flag: v.flag, comment: v.comment.trim() }));

  const toggleSection = (id: string) => setExpandedSections((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleRound = (id: string) => setExpandedRounds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleApprove = () => { setSubmitting(true); reviewMutation.mutate({ outcome: 'Approved', generalNotes: generalNotes.trim() || undefined, lectureComments: collectLectureComments() }); };
  const handleReject = () => {
    if (!rejectionNotes.trim()) { toast.error('Reddetmek için not girmeniz zorunludur.'); return; }
    setSubmitting(true); setRejectModalOpen(false);
    reviewMutation.mutate({ outcome: 'Rejected', generalNotes: rejectionNotes.trim(), lectureComments: collectLectureComments() });
  };
  const handleRevision = () => {
    const comments = collectLectureComments();
    if (comments.length === 0) { toast.error('Revizyona göndermek için en az 1 ders yorumu gereklidir.'); return; }
    setSubmitting(true);
    reviewMutation.mutate({ outcome: 'RevisionRequested', generalNotes: generalNotes.trim() || undefined, lectureComments: comments });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-7xl text-center py-20">
        <p className="text-gray-500">Kurs bulunamadı.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/course-reviews')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/course-reviews')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <h1 className="text-xl font-bold text-gray-800 truncate max-w-md">{course.title}</h1>
          <StatusBadge status={course.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Course Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border overflow-hidden">
            {course.coverImageUrl ? (
              <img src={course.coverImageUrl} alt={course.title} className="w-full h-44 object-cover" />
            ) : (
              <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
                <Video className="h-12 w-12 text-gray-300" />
              </div>
            )}
            <div className="p-4 space-y-3">
              <div><p className="text-xs text-gray-500">Başlık</p><p className="text-sm font-medium">{course.title}</p></div>
              {course.shortDescription && <div><p className="text-xs text-gray-500">Kısa Açıklama</p><p className="text-sm text-gray-600">{course.shortDescription}</p></div>}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div><p className="text-xs text-gray-500">Fiyat</p><p className="text-sm font-semibold">{course.price.toFixed(2)} {course.currency}</p></div>
                <div><p className="text-xs text-gray-500">Kategori</p><p className="text-sm font-medium">{course.category || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Seviye</p><p className="text-sm font-medium">{course.level}</p></div>
                <div><p className="text-xs text-gray-500">Dil</p><p className="text-sm font-medium">{course.language || 'Türkçe'}</p></div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Toplam Süre</p>
                <p className="text-sm font-medium">{formatDuration(course.totalDurationSec)} ({course.totalLectures} ders)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">Mentor Bilgisi</p>
            </div>
            <p className="text-sm font-medium">{course.mentorName}</p>
            {course.mentorEmail && <p className="text-xs text-gray-500 mt-0.5">{course.mentorEmail}</p>}
          </div>
        </div>

        {/* Main Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sections / Lectures */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gray-400" />
              Müfredat ({course.sections?.length || 0} bölüm)
            </h2>
            <div className="space-y-3">
              {course.sections?.map((section: ReviewSectionDto) => (
                <div key={section.id} className="border rounded-lg overflow-hidden">
                  <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2">
                      {expandedSections.has(section.id) ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <span className="text-sm font-medium text-gray-700">{section.sortOrder + 1}. {section.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{section.lectures?.length || 0} ders</span>
                  </button>

                  {expandedSections.has(section.id) && section.lectures && (
                    <div className="divide-y divide-gray-100">
                      {section.lectures.map((lecture: ReviewLectureDto) => {
                        const lc = lectureComments[lecture.id] || { flag: 'None', comment: '' };
                        return (
                          <div key={lecture.id} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {lecture.type === 'Video' ? <Video className="h-4 w-4 text-indigo-400" /> : <FileText className="h-4 w-4 text-gray-400" />}
                                <span className="text-sm font-medium text-gray-700">{lecture.title}</span>
                                {lecture.isPreview && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">Önizleme</span>}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{lecture.type === 'Video' ? 'Video' : 'Metin'}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lecture.durationSec ? formatDuration(lecture.durationSec) : '-'}</span>
                              </div>
                            </div>

                            {lecture.type === 'Video' && lecture.videoUrl && (
                              <div className="mb-3">
                                <video src={lecture.videoUrl} controls className="w-full max-h-80 rounded-lg bg-black" preload="metadata" />
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 mt-2">
                              <div className="sm:w-48">
                                <label className="block text-xs text-gray-500 mb-1">İşaret</label>
                                <select
                                  value={lc.flag}
                                  onChange={(e) => updateLectureComment(lecture.id, 'flag', e.target.value)}
                                  className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="None">Yok</option>
                                  <option value="Risky">Riskli</option>
                                  <option value="Inappropriate">Uygunsuz</option>
                                  <option value="CopyrightIssue">Telif Hakkı</option>
                                </select>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Yorum</label>
                                <textarea
                                  value={lc.comment}
                                  onChange={(e) => updateLectureComment(lecture.id, 'comment', e.target.value)}
                                  rows={2}
                                  placeholder="Bu ders için yorum ekleyin..."
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Review History */}
          {course.reviewRounds && course.reviewRounds.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-400" />
                İnceleme Geçmişi ({course.reviewRounds.length} tur)
              </h2>
              <div className="space-y-3">
                {course.reviewRounds.map((round: ReviewRoundDto) => (
                  <div key={round.id} className="border rounded-lg overflow-hidden">
                    <button onClick={() => toggleRound(round.id)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        {expandedRounds.has(round.id) ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                        <span className="text-sm font-medium">Tur {round.roundNumber}</span>
                        {round.outcome && <span className={`text-xs font-semibold ${outcomeColors[round.outcome] || ''}`}>{outcomeLabels[round.outcome] || round.outcome}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(round.submittedAt)}</span>
                    </button>

                    {expandedRounds.has(round.id) && (
                      <div className="px-5 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><p className="text-xs text-gray-500">Gönderim</p><p>{formatDate(round.submittedAt)}</p></div>
                          {round.reviewedAt && <div><p className="text-xs text-gray-500">İnceleme</p><p>{formatDate(round.reviewedAt)}</p></div>}
                        </div>
                        {round.mentorNotes && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Mentor Notu</p>
                            <p className="text-sm text-blue-800">{round.mentorNotes}</p>
                          </div>
                        )}
                        {round.adminGeneralNotes && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Admin Notu</p>
                            <p className="text-sm text-amber-800">{round.adminGeneralNotes}</p>
                          </div>
                        )}
                        {round.lectureComments && round.lectureComments.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2">Ders Yorumları ({round.lectureComments.length})</p>
                            <div className="space-y-2">
                              {round.lectureComments.map((lc: LectureCommentDto) => (
                                <div key={lc.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium truncate">{lc.lectureTitle}</p>
                                      <FlagBadge flag={lc.flag} />
                                    </div>
                                    {lc.comment && <p className="text-sm text-gray-600">{lc.comment}</p>}
                                  </div>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(lc.createdAt)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes & Actions */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Admin Genel Not</h2>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={3}
              placeholder="Genel inceleme notlarınızı buraya yazın..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleApprove} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="h-4 w-4 mr-2" /> Onayla
              </Button>
              <Button onClick={() => setRejectModalOpen(true)} disabled={submitting} variant="destructive">
                <XCircle className="h-4 w-4 mr-2" /> Reddet
              </Button>
              <Button onClick={handleRevision} disabled={submitting} className="bg-orange-500 hover:bg-orange-600 text-white">
                <RotateCw className="h-4 w-4 mr-2" /> Revizyona Gönder
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Kursu Reddet" description="Reddetme nedenini belirtin. Bu alan zorunludur.">
        <div className="space-y-4">
          <textarea
            value={rejectionNotes}
            onChange={(e) => setRejectionNotes(e.target.value)}
            rows={4}
            placeholder="Reddetme nedenini yazın..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting || !rejectionNotes.trim()}>
              <XCircle className="h-4 w-4 mr-2" /> Reddet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
