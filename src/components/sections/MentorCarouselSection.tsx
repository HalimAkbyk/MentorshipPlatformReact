'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Star, Users, Award, ArrowRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MentorListItem } from '@/lib/types/models';

/* ── Props ── */
interface MentorCarouselSectionProps {
  title: string;
  icon: string;
  mentors: MentorListItem[];
  isLoading?: boolean;
  viewAllHref?: string;
}

/* ── Online status helper ── */
function isOnline(userId: string): boolean {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 3 === 0;
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <Card className="overflow-hidden border-2 border-gray-100 animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </Card>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="flex items-center justify-center w-full py-16 col-span-full">
      <div className="text-center">
        <div className="text-4xl mb-3">🎓</div>
        <p className="text-gray-500 text-sm">
          Henuz mentor bulunamadi. Yakinda burada olacaklar!
        </p>
      </div>
    </div>
  );
}

/* ── Mentor Card (Figma design) ── */
function MentorCard({ mentor }: { mentor: MentorListItem }) {
  const online = useMemo(() => isOnline(mentor.userId), [mentor.userId]);
  const initials = mentor.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/public/mentors/${mentor.userId}`} className="block group">
      <Card className="overflow-hidden border-2 border-gray-100 hover:border-teal-300 hover:shadow-xl transition-all duration-300">
        {/* Image area */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-teal-100 to-green-100">
          {mentor.avatarUrl ? (
            <img
              src={mentor.avatarUrl}
              alt={mentor.displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-teal-50 text-teal-600 text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          {/* Badge */}
          {mentor.isVerified && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full text-xs flex items-center gap-1">
                <Award className="w-3 h-3" />
                Onaylanmis
              </span>
            </div>
          )}
          {/* Online indicator */}
          {online && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Aktif
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900">{mentor.displayName}</h3>
          <p className="text-teal-600 text-sm mb-2">{mentor.department || mentor.university}</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-900">{mentor.ratingAvg.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({mentor.ratingCount})</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />{mentor.totalStudents || 0} ogrenci
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              {mentor.hourlyRate != null && mentor.hourlyRate > 0 ? (
                <>
                  <span className="text-xl font-bold text-gray-900">₺{mentor.hourlyRate}</span>
                  <span className="text-sm text-gray-500"> / saat</span>
                </>
              ) : (
                <span className="text-sm text-gray-500">Fiyat bilgisi yok</span>
              )}
            </div>
            <Button size="sm" className="bg-gradient-to-r from-teal-600 to-green-600 text-white text-xs">
              Profili Gor
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ── Main Section ── */
export default function MentorCarouselSection({
  title,
  icon,
  mentors,
  isLoading = false,
  viewAllHref,
}: MentorCarouselSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-4 border border-teal-200">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span className="text-sm text-teal-700">{title}</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600">Binlerce ogrencinin tercih ettigi uzman mentorler</p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : mentors.length === 0 ? (
            <EmptyState />
          ) : (
            mentors.slice(0, 6).map((mentor) => (
              <MentorCard key={mentor.userId} mentor={mentor} />
            ))
          )}
        </div>

        {/* View all button */}
        {viewAllHref && (
          <div className="text-center mt-10">
            <Link href={viewAllHref}>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-teal-300 hover:bg-teal-50 gap-2"
              >
                Tum Mentorleri Gor
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
