'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCoverImageStyle } from '@/components/ui/cover-image-editor';
import { BookOpen, Clock, ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEnrolledCourses } from '@/lib/hooks/use-courses';
import { ROUTES } from '@/lib/constants/routes';
import { formatRelativeTime } from '@/lib/utils/format';
import { Pagination } from '@/components/ui/pagination';

export default function StudentCoursesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data: coursesData, isLoading } = useEnrolledCourses(page);
  const courses = coursesData?.items;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Kayıtlarım</h1>
            <p className="text-xs text-gray-500">Kayıtlı olduğunuz kurslar</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => router.push(ROUTES.COURSE_CATALOG)}
        >
          <BookOpen className="w-3.5 h-3.5 mr-1" />
          Kurs Keşfet
        </Button>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse overflow-hidden">
              <div className="h-28 bg-gray-200" />
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-2 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card
                key={course.courseId}
                className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Cover Image */}
                <div className="relative h-28 overflow-hidden">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={course.courseTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getCoverImageStyle(course.coverImagePosition, course.coverImageTransform)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                  {course.completionPercentage === 100 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Tamamlandı
                    </div>
                  )}
                </div>

                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm text-gray-900 mb-0.5 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {course.courseTitle}
                  </h3>
                  <p className="text-[10px] text-gray-400 mb-2">{course.mentorName}</p>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>
                        {course.completedLectures}/{course.totalLectures} ders
                      </span>
                      <span className="font-medium">
                        %{Math.round(course.completionPercentage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${course.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Accessed */}
                  {course.lastAccessedAt && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-2">
                      <Clock className="w-2.5 h-2.5" />
                      Son: {formatRelativeTime(course.lastAccessedAt)}
                    </p>
                  )}

                  {/* Continue Button */}
                  <Button
                    className="w-full text-xs"
                    size="sm"
                    onClick={() => router.push(ROUTES.COURSE_PLAYER(course.courseId))}
                  >
                    Devam Et
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={coursesData?.totalPages ?? 1}
            totalCount={coursesData?.totalCount ?? 0}
            onPageChange={setPage}
            itemLabel="kurs"
          />
        </>
      ) : (
        <Card className="border border-dashed border-purple-200 bg-purple-50/30">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Henüz bir kursa kayıt olmadınız</h3>
            <p className="text-xs text-gray-500 mb-4">
              Kurs kataloğundan ilginizi çeken kursları keşfedin
            </p>
            <Button size="sm" className="text-xs" onClick={() => router.push(ROUTES.COURSE_CATALOG)}>
              Kursları Keşfet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
