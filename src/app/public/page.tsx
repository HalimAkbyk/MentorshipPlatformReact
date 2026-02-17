'use client';

import HeroCarousel from '@/components/sections/HeroCarousel';
import CourseStrip from '@/components/sections/CourseStrip';
import MentorCarouselSection from '@/components/sections/MentorCarouselSection';
import PromoBanner from '@/components/sections/PromoBanner';
import StatsSection from '@/components/sections/StatsSection';
import HowItWorks from '@/components/sections/HowItWorks';
import TestimonialCarousel from '@/components/sections/TestimonialCarousel';
import BecomeMentor from '@/components/sections/BecomeMentor';
import CmsModuleRenderer from '@/components/sections/CmsModuleRenderer';
import { useTopRatedMentors, useNewestMentors, useActiveModules } from '@/lib/hooks/use-homepage';

export default function HomePage() {
  const { data: modules = [], isLoading: modulesLoading } = useActiveModules();
  const { data: topRatedMentors = [], isLoading: loadingTopRated } = useTopRatedMentors(12);
  const { data: newestMentors = [], isLoading: loadingNewest } = useNewestMentors(12);

  // ── CMS-driven layout ──
  // If there are active CMS modules, render them in sort order
  if (!modulesLoading && modules.length > 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {modules.map((mod) => (
          <CmsModuleRenderer key={mod.id} module={mod} />
        ))}
      </div>
    );
  }

  // ── Fallback: hardcoded layout ──
  // Shown when no CMS modules exist or while loading
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 1. Hero Section */}
      <HeroCarousel />

      {/* 2. Popular Courses */}
      <CourseStrip />

      {/* 3. Top Rated Mentors */}
      <MentorCarouselSection
        title="En Yuksek Puanli Mentorler"
        icon="⭐"
        mentors={topRatedMentors}
        isLoading={loadingTopRated}
        viewAllHref="/public/mentors"
      />

      {/* 4. Promo Banner */}
      <PromoBanner />

      {/* 5. Newest Mentors */}
      <MentorCarouselSection
        title="Yeni Katilan Mentorler"
        icon="🆕"
        mentors={newestMentors}
        isLoading={loadingNewest}
        viewAllHref="/public/mentors"
      />

      {/* 6. How It Works */}
      <HowItWorks />

      {/* 7. Stats */}
      <StatsSection />

      {/* 8. Testimonials */}
      <TestimonialCarousel />

      {/* 9. Become Mentor CTA */}
      <BecomeMentor />
    </div>
  );
}
