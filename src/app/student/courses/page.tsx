'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Clock, ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEnrolledCourses } from '@/lib/hooks/use-courses';
import { ROUTES } from '@/lib/constants/routes';
import { formatRelativeTime } from '@/lib/utils/format';

export default function StudentCoursesPage() {
  const router = useRouter();
  const { data: courses, isLoading } = useEnrolledCourses();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading mb-2">Kurslarım</h1>
            <p className="text-gray-600">Kayıtlı olduğunuz kursları görüntüleyip devam edin</p>
          </div>
          <Button onClick={() => router.push(ROUTES.COURSE_CATALOG)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Kurs Keşfet
          </Button>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-40 bg-gray-200" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.courseId}
                className="overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Cover Image */}
                <div className="relative h-40 overflow-hidden">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.courseTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  {/* Progress Overlay */}
                  {course.completionPercentage === 100 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Tamamlandı
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {course.courseTitle}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">{course.mentorName}</p>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>
                        {course.completedLectures}/{course.totalLectures} ders tamamlandı
                      </span>
                      <span className="font-medium">
                        %{Math.round(course.completionPercentage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Accessed */}
                  {course.lastAccessedAt && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                      <Clock className="w-3 h-3" />
                      Son erişim: {formatRelativeTime(course.lastAccessedAt)}
                    </p>
                  )}

                  {/* Continue Button */}
                  <Button
                    className="w-full mt-2"
                    size="sm"
                    onClick={() => router.push(ROUTES.COURSE_PLAYER(course.courseId))}
                  >
                    Devam Et
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold font-heading mb-2 text-gray-700">
              Henüz bir kursa kayıt olmadınız
            </h3>
            <p className="text-gray-500 mb-6">
              Kurs kataloğundan ilginizi çeken kursları keşfedin ve öğrenmeye başlayın
            </p>
            <Button onClick={() => router.push(ROUTES.COURSE_CATALOG)}>
              Kursları Keşfet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
