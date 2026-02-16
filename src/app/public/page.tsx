'use client';

import HeroCarousel from '@/components/sections/HeroCarousel';
import CourseStrip from '@/components/sections/CourseStrip';
import MentorCarouselSection from '@/components/sections/MentorCarouselSection';
import PromoBanner from '@/components/sections/PromoBanner';
import StatsSection from '@/components/sections/StatsSection';
import HowItWorks from '@/components/sections/HowItWorks';
import TestimonialCarousel from '@/components/sections/TestimonialCarousel';
import BecomeMentor from '@/components/sections/BecomeMentor';
import { useTopRatedMentors, useNewestMentors } from '@/lib/hooks/use-homepage';

export default function HomePage() {
  const { data: topRatedMentors = [], isLoading: loadingTopRated } = useTopRatedMentors(12);
  const { data: newestMentors = [], isLoading: loadingNewest } = useNewestMentors(12);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 1. Hero Section */}
      <HeroCarousel />

      {/* 2. Popüler Eğitimler (Video Kurslar — API Driven) */}
      <CourseStrip />

      {/* 3. En Yüksek Puanlı Mentörler */}
      <MentorCarouselSection
        title="En Yüksek Puanlı Mentörler"
        icon="⭐"
        mentors={topRatedMentors}
        isLoading={loadingTopRated}
        viewAllHref="/public/mentors"
      />

      {/* 4. Promosyon Banner */}
      <PromoBanner />

      {/* 5. Yeni Katılan Mentörler */}
      <MentorCarouselSection
        title="Yeni Katılan Mentörler"
        icon="🆕"
        mentors={newestMentors}
        isLoading={loadingNewest}
        viewAllHref="/public/mentors"
      />

      {/* 6. Nasıl Çalışır */}
      <HowItWorks />

      {/* 7. İstatistikler */}
      <StatsSection />

      {/* 8. Başarı Hikayeleri */}
      <TestimonialCarousel />

      {/* 9. Mentör Ol CTA */}
      <BecomeMentor />
    </div>
  );
}
