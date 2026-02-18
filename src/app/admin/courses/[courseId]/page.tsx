'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Video,
  Users,
  DollarSign,
  Star,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  MessageSquarePlus,
  Play,
  Flag,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  FileText,
  Ban,
  CheckCircle2,
  X,
} from 'lucide-react';
import { adminApi, type CourseAdminNoteDto } from '@/lib/api/admin';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function formatCurrency(value: number, currency?: string): string {
  const symbol = currency === 'USD' ? '$' : '\u20BA';
  return `${symbol}${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

const FLAG_OPTIONS = [
  { value: 'Risky', label: 'Riskli Icerik', color: 'bg-amber-100 text-amber-700' },
  { value: 'Inappropriate', label: 'Uygunsuz Icerik', color: 'bg-red-100 text-red-700' },
  { value: 'CopyrightIssue', label: 'Telif Hakki', color: 'bg-purple-100 text-purple-700' },
];

const NOTE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  General: { label: 'Genel Yorum', icon: <MessageSquarePlus className="h-4 w-4" />, color: 'text-blue-500' },
  Flag: { label: 'Isaretleme', icon: <Flag className="h-4 w-4" />, color: 'text-amber-500' },
  LectureDeactivated: { label: 'Ders Pasife Alindi', icon: <Ban className="h-4 w-4" />, color: 'text-red-500' },
  LectureActivated: { label: 'Ders Aktife Alindi', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-500' },
  CourseSuspended: { label: 'Kurs Askiya Alindi', icon: <ShieldAlert className="h-4 w-4" />, color: 'text-red-500' },
  CourseUnsuspended: { label: 'Aski Kaldirildi', icon: <ShieldCheck className="h-4 w-4" />, color: 'text-emerald-500' },
};

// ─── Modals ───

function SuspendModal({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: (reason: string) => void; isPending: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-slate-800">Kursu Askiya Al</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Bu kurs askiya alinacak ve ogrenciler erisemeyecek. Mentore bildirim gonderilecektir.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Askiya alma sebebi (zorunlu)..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Iptal</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => onConfirm(reason)} disabled={!reason.trim() || isPending}>
            {isPending ? 'Isleniyor...' : 'Askiya Al'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UnsuspendModal({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: (note?: string) => void; isPending: boolean }) {
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-slate-800">Askiyi Kaldir</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Kurs tekrar yayina alinacak. Mentore bildirim gonderilecektir.</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Not (opsiyonel)..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Iptal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onConfirm(note || undefined)} disabled={isPending}>
            {isPending ? 'Isleniyor...' : 'Askiyi Kaldir'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function GeneralNoteModal({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: (content: string) => void; isPending: boolean }) {
  const [content, setContent] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquarePlus className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-800">Kurs Hakkinda Yorum</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Mentore genel bir yorum/uyari gonderin.</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Yorumunuz (zorunlu)..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Iptal</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => onConfirm(content)} disabled={!content.trim() || isPending}>
            {isPending ? 'Gonderiliyor...' : 'Gonder'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FlagLectureModal({
  lectureName,
  onClose,
  onConfirm,
  isPending,
}: { lectureName: string; onClose: () => void; onConfirm: (flag: string, content: string) => void; isPending: boolean }) {
  const [flag, setFlag] = useState('');
  const [content, setContent] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Flag className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-800">Ders Isaretle</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          <span className="font-medium text-slate-700">&quot;{lectureName}&quot;</span> dersini isaretle ve mentore gonder.
        </p>
        <div className="space-y-2 mb-4">
          {FLAG_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                flag === opt.value ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="flag"
                value={opt.value}
                checked={flag === opt.value}
                onChange={() => setFlag(opt.value)}
                className="accent-amber-500"
              />
              <span className="text-sm font-medium text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Yorum (zorunlu)..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Iptal</Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onConfirm(flag, content)} disabled={!flag || !content.trim() || isPending}>
            {isPending ? 'Gonderiliyor...' : 'Isaretle'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleLectureModal({
  lectureName,
  isActive,
  onClose,
  onConfirm,
  isPending,
}: { lectureName: string; isActive: boolean; onClose: () => void; onConfirm: (reason?: string) => void; isPending: boolean }) {
  const [reason, setReason] = useState('');
  const action = isActive ? 'Pasife Al' : 'Aktife Al';
  const description = isActive
    ? 'Bu ders pasife alinacak ve ogrenciler erisemeyecek.'
    : 'Bu ders tekrar aktif olacak ve ogrenciler erisebilecek.';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          {isActive ? <ToggleLeft className="h-5 w-5 text-red-500" /> : <ToggleRight className="h-5 w-5 text-emerald-500" />}
          <h3 className="text-lg font-semibold text-slate-800">{action}: {lectureName}</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={isActive ? 'Pasife alma sebebi (zorunlu)...' : 'Not (opsiyonel)...'}
          className="w-full border border-slate-300 rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Iptal</Button>
          <Button
            className={isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            onClick={() => onConfirm(reason || undefined)}
            disabled={(isActive && !reason.trim()) || isPending}
          >
            {isPending ? 'Isleniyor...' : action}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VideoModal({ videoUrl, title, onClose }: { videoUrl: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <video controls autoPlay className="w-full rounded-lg bg-black max-h-[75vh]" src={videoUrl}>
          Tarayiciniz video desteklemiyor.
        </video>
      </div>
    </div>
  );
}

// ─── Main Page ───

export default function AdminCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [flagTarget, setFlagTarget] = useState<{ lectureId: string; name: string } | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{ lectureId: string; name: string; isActive: boolean } | null>(null);
  const [videoTarget, setVideoTarget] = useState<{ url: string; title: string } | null>(null);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['admin-course-detail', courseId],
    queryFn: () => adminApi.getEducationCourseDetail(courseId),
    enabled: !!courseId,
  });

  const { data: adminNotes } = useQuery({
    queryKey: ['admin-course-notes', courseId],
    queryFn: () => adminApi.getCourseAdminNotes(courseId),
    enabled: !!courseId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-course-detail', courseId] });
    queryClient.invalidateQueries({ queryKey: ['admin-course-notes', courseId] });
  };

  const suspendMutation = useMutation({
    mutationFn: (reason: string) => adminApi.suspendCourse(courseId, reason),
    onSuccess: () => { toast.success('Kurs askiya alindi'); setShowSuspendModal(false); invalidate(); },
    onError: () => toast.error('Kurs askiya alinamadi'),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (note?: string) => adminApi.unsuspendCourse(courseId, note),
    onSuccess: () => { toast.success('Kurs tekrar yayinda'); setShowUnsuspendModal(false); invalidate(); },
    onError: () => toast.error('Aski kaldirilamadi'),
  });

  const noteMutation = useMutation({
    mutationFn: (data: { lectureId?: string; flag?: string; content: string }) => adminApi.addCourseAdminNote(courseId, data),
    onSuccess: () => { toast.success('Yorum eklendi'); setShowNoteModal(false); setFlagTarget(null); invalidate(); },
    onError: () => toast.error('Yorum eklenemedi'),
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { lectureId: string; isActive: boolean; reason?: string }) =>
      adminApi.toggleLectureActive(courseId, data.lectureId, data.isActive, data.reason),
    onSuccess: () => { toast.success('Ders durumu guncellendi'); setToggleTarget(null); invalidate(); },
    onError: () => toast.error('Ders durumu guncellenemedi'),
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="text-center py-20">
          <p className="text-slate-500">Kurs bulunamadi.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Don
          </Button>
        </div>
      </div>
    );
  }

  const isSuspended = course.status === 'Suspended';
  const isPublished = course.status === 'Published';

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Suspended Banner */}
      {isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Bu kurs askida</p>
            <p className="text-xs text-red-500">Ogrenciler bu kursa eriseemiyor. Askiyi kaldirmak icin asagidaki butonu kullanin.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kurslara Don
          </button>
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-800">{course.title}</h1>
            <StatusBadge status={course.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mentor: <span className="font-medium text-slate-700">{course.mentorName}</span>
            {course.mentorEmail && <span className="text-slate-400 ml-1">({course.mentorEmail})</span>}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNoteModal(true)}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            <MessageSquarePlus className="h-4 w-4 mr-1.5" />
            Yorum Ekle
          </Button>
          {isPublished && (
            <Button
              size="sm"
              onClick={() => setShowSuspendModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <ShieldAlert className="h-4 w-4 mr-1.5" />
              Askiya Al
            </Button>
          )}
          {isSuspended && (
            <Button
              size="sm"
              onClick={() => setShowUnsuspendModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Askiyi Kaldir
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Kayitli Ogrenci
          </div>
          <p className="text-2xl font-bold text-slate-800">{course.enrollmentCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign className="h-4 w-4" />
            Toplam Gelir
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(course.totalRevenue, course.currency)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Star className="h-4 w-4" />
            Ortalama Puan
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {course.ratingAvg > 0 ? course.ratingAvg.toFixed(1) : '-'}
            <span className="text-sm font-normal text-slate-400 ml-1">({course.ratingCount})</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Toplam Sure
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {formatDuration(course.totalDurationSec)}
          </p>
          <p className="text-xs text-slate-400">{course.totalLectures} ders</p>
        </div>
      </div>

      {/* Course Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-400" />
            Kurs Bilgileri
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Fiyat</span>
              <p className="font-medium text-slate-800">{formatCurrency(course.price, course.currency)}</p>
            </div>
            <div>
              <span className="text-slate-500">Kategori</span>
              <p className="font-medium text-slate-800">{course.category || '-'}</p>
            </div>
            <div>
              <span className="text-slate-500">Seviye</span>
              <p className="font-medium text-slate-800">{course.level}</p>
            </div>
            <div>
              <span className="text-slate-500">Dil</span>
              <p className="font-medium text-slate-800">{course.language || 'Turkce'}</p>
            </div>
            <div>
              <span className="text-slate-500">Olusturulma</span>
              <p className="font-medium text-slate-800">{formatDate(course.createdAt)}</p>
            </div>
            <div>
              <span className="text-slate-500">Son Guncelleme</span>
              <p className="font-medium text-slate-800">{course.updatedAt ? formatDate(course.updatedAt) : '-'}</p>
            </div>
          </div>
          {course.shortDescription && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">Kisa Aciklama</span>
              <p className="text-sm text-slate-700 mt-1">{course.shortDescription}</p>
            </div>
          )}
          {course.description && (
            <div className="mt-3">
              <span className="text-sm text-slate-500">Detayli Aciklama</span>
              <p className="text-sm text-slate-700 mt-1 line-clamp-6">{course.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {course.coverImageUrl ? (
            <img
              src={course.coverImageUrl}
              alt={course.title}
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
          ) : (
            <div className="w-full h-48 bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
              <Video className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">{formatCurrency(course.price, course.currency)}</p>
            <p className="text-xs text-slate-500 mt-1">Kurs ID: {course.id?.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {/* Curriculum - Interactive */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Mufredat ({course.sections?.length || 0} bolum, {course.totalLectures} ders)
        </h2>
        <div className="space-y-2">
          {course.sections?.map((section: any) => (
            <div key={section.id} className="border border-slate-100 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-slate-700">{section.title}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {section.lectures?.length || 0} ders
                </span>
              </button>
              {expandedSections.has(section.id) && section.lectures && (
                <div className="divide-y divide-slate-50">
                  {section.lectures.map((lecture: any) => {
                    const isInactive = lecture.isActive === false;
                    return (
                      <div
                        key={lecture.id}
                        className={`flex items-center justify-between px-6 py-3 ${
                          isInactive ? 'bg-red-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Video className={`h-3.5 w-3.5 shrink-0 ${isInactive ? 'text-red-400' : 'text-slate-400'}`} />
                          <span className={`text-sm truncate ${isInactive ? 'text-red-500 line-through' : 'text-slate-600'}`}>
                            {lecture.title}
                          </span>
                          {lecture.isPreview && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium shrink-0">
                              Onizleme
                            </span>
                          )}
                          {isInactive && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium shrink-0">
                              Pasif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          {/* Play Video */}
                          {lecture.videoUrl && (
                            <button
                              onClick={() => setVideoTarget({ url: lecture.videoUrl, title: lecture.title })}
                              className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition-colors"
                              title="Videoyu Izle"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {/* Flag */}
                          <button
                            onClick={() => setFlagTarget({ lectureId: lecture.id, name: lecture.title })}
                            className="p-1.5 rounded-md hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors"
                            title="Isaretle"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </button>
                          {/* Toggle Active */}
                          <button
                            onClick={() => setToggleTarget({ lectureId: lecture.id, name: lecture.title, isActive: lecture.isActive !== false })}
                            className={`p-1.5 rounded-md transition-colors ${
                              isInactive
                                ? 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700'
                                : 'hover:bg-red-50 text-red-400 hover:text-red-600'
                            }`}
                            title={isInactive ? 'Aktife Al' : 'Pasife Al'}
                          >
                            {isInactive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </button>
                          {/* Duration */}
                          <span className="text-xs text-slate-400 w-12 text-right">
                            {lecture.durationSec ? formatDuration(lecture.durationSec) : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {(!course.sections || course.sections.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-4">Henuz mufredat eklenmemis.</p>
          )}
        </div>
      </div>

      {/* Admin Notes / Moderation History */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-400" />
          Moderasyon Gecmisi ({adminNotes?.length || 0})
        </h2>
        {adminNotes && adminNotes.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {adminNotes.map((note: CourseAdminNoteDto) => {
              const config = NOTE_TYPE_CONFIG[note.noteType] || NOTE_TYPE_CONFIG.General;
              const flagInfo = note.flag ? FLAG_OPTIONS.find((f) => f.value === note.flag) : null;
              return (
                <div key={note.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700">{config.label}</span>
                      {flagInfo && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${flagInfo.color}`}>
                          {flagInfo.label}
                        </span>
                      )}
                      {note.lectureTitle && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                          {note.lectureTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{note.content}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {note.adminName} - {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Henuz moderasyon notu yok.</p>
        )}
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Kayitli Ogrenciler ({course.enrollments?.length || 0})
        </h2>
        {course.enrollments && course.enrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Ogrenci</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">E-posta</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Durum</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Ilerleme</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {course.enrollments.map((e: any) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-2 font-medium text-slate-700">{e.studentName}</td>
                    <td className="py-2.5 px-2 text-slate-500">{e.studentEmail}</td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(e.progress || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{Math.round(e.progress || 0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500">{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">Henuz kayitli ogrenci yok.</p>
        )}
      </div>

      {/* Modals */}
      {showSuspendModal && (
        <SuspendModal
          onClose={() => setShowSuspendModal(false)}
          onConfirm={(reason) => suspendMutation.mutate(reason)}
          isPending={suspendMutation.isPending}
        />
      )}
      {showUnsuspendModal && (
        <UnsuspendModal
          onClose={() => setShowUnsuspendModal(false)}
          onConfirm={(note) => unsuspendMutation.mutate(note)}
          isPending={unsuspendMutation.isPending}
        />
      )}
      {showNoteModal && (
        <GeneralNoteModal
          onClose={() => setShowNoteModal(false)}
          onConfirm={(content) => noteMutation.mutate({ content })}
          isPending={noteMutation.isPending}
        />
      )}
      {flagTarget && (
        <FlagLectureModal
          lectureName={flagTarget.name}
          onClose={() => setFlagTarget(null)}
          onConfirm={(flag, content) => noteMutation.mutate({ lectureId: flagTarget.lectureId, flag, content })}
          isPending={noteMutation.isPending}
        />
      )}
      {toggleTarget && (
        <ToggleLectureModal
          lectureName={toggleTarget.name}
          isActive={toggleTarget.isActive}
          onClose={() => setToggleTarget(null)}
          onConfirm={(reason) =>
            toggleMutation.mutate({
              lectureId: toggleTarget.lectureId,
              isActive: !toggleTarget.isActive,
              reason,
            })
          }
          isPending={toggleMutation.isPending}
        />
      )}
      {videoTarget && (
        <VideoModal
          videoUrl={videoTarget.url}
          title={videoTarget.title}
          onClose={() => setVideoTarget(null)}
        />
      )}
    </div>
  );
}
