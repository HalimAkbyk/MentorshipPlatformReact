'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Loader2, BookOpen, Calendar, Image as ImageIcon,
} from 'lucide-react';

import { adminApi, type PendingCourseReviewDto } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}s ${minutes}dk`;
  return `${minutes}dk`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CourseReviewsPage() {
  const router = useRouter();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin', 'course-reviews'],
    queryFn: () => adminApi.getPendingCourseReviews(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-3 text-sm text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const items = reviews ?? [];

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Kurs İncelemeleri</h1>
        </div>
        <p className="text-sm text-gray-500">Onay bekleyen kursları inceleyin</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-14 w-14 text-gray-300 mb-4" />
            <p className="text-gray-500 text-base font-medium">Onay bekleyen kurs bulunmuyor</p>
            <p className="text-gray-400 text-sm mt-1">Yeni bir kurs incelemeye gönderildiğinde burada görünecektir.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kapak</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kurs Adı</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mentor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ders</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Süre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiyat</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Gönderim</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Round</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/admin/course-reviews/${item.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {item.coverImageUrl ? (
                        <img src={item.coverImageUrl} alt={item.title} className="h-10 w-16 rounded object-cover border" />
                      ) : (
                        <div className="h-10 w-16 rounded bg-gray-100 border flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{item.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 truncate max-w-[160px]">{item.mentorName}</p>
                    </td>
                    <td className="px-4 py-3">
                      {item.category ? <Badge variant="secondary" className="text-xs">{item.category}</Badge> : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-700">{item.totalLectures}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{formatDuration(item.totalDurationSec)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{item.price.toFixed(2)} {item.currency}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">{formatDate(item.submittedAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-xs">{item.roundNumber}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-500">Toplam <span className="font-medium">{items.length}</span> kurs inceleme bekliyor</p>
          </div>
        </div>
      )}
    </div>
  );
}
