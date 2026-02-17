'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  Eye,
  Calendar,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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

export default function AdminCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['admin-course-detail', courseId],
    queryFn: () => adminApi.getEducationCourseDetail(courseId),
    enabled: !!courseId,
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

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
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
        {/* Left: Details */}
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

        {/* Right: Cover image */}
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

      {/* Curriculum */}
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
                  {section.lectures.map((lecture: any) => (
                    <div key={lecture.id} className="flex items-center justify-between px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        <Video className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600">{lecture.title}</span>
                        {lecture.isPreview && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                            Onizleme
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {lecture.durationSec ? formatDuration(lecture.durationSec) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!course.sections || course.sections.length === 0) && (
            <p className="text-sm text-slate-400 text-center py-4">Henuz mufredat eklenmemis.</p>
          )}
        </div>
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
    </div>
  );
}
