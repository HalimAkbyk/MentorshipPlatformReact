'use client';

import HeroCarousel from '@/components/sections/HeroCarousel';
import ProductsSection from '@/components/sections/ProductsSection';
import CourseStrip from '@/components/sections/CourseStrip';
import MentorCarouselSection from '@/components/sections/MentorCarouselSection';
import PromoBanner from '@/components/sections/PromoBanner';
import HowItWorks from '@/components/sections/HowItWorks';
import TestimonialCarousel from '@/components/sections/TestimonialCarousel';
import CmsModuleRenderer from '@/components/sections/CmsModuleRenderer';
import { useTopRatedMentors, useNewestMentors, useActiveModules } from '@/lib/hooks/use-homepage';

export default function HomePage() {
  const { data: modules = [], isLoading: modulesLoading } = useActiveModules();
  const { data: topRatedMentors = [], isLoading: loadingTopRated } = useTopRatedMentors(12);
  const { data: newestMentors = [], isLoading: loadingNewest } = useNewestMentors(12);

  // ── CMS-driven layout ──
  if (!modulesLoading && modules.length > 0) {
    return (
      <div className="min-h-screen">
        {modules.map((mod) => (
          <CmsModuleRenderer key={mod.id} module={mod} />
        ))}
      </div>
    );
  }

  // ── Fallback: Figma design layout ──
  return (
    <div className="min-h-screen">
      {/* 1. Hero */}
      <HeroCarousel />

      {/* 2. Products (3 Learning Paths) */}
      <ProductsSection />

      {/* 3. Featured Mentors */}
      <MentorCarouselSection
        title="En Yuksek Puanli Mentorler"
        icon="⭐"
        mentors={topRatedMentors}
        isLoading={loadingTopRated}
        viewAllHref="/public/mentors"
      />

      {/* 4. How It Works */}
      <HowItWorks />

      {/* 5. Popular Courses */}
      <CourseStrip />

      {/* 6. Newest Mentors */}
      <MentorCarouselSection
        title="Yeni Katilan Mentorler"
        icon="🆕"
        mentors={newestMentors}
        isLoading={loadingNewest}
        viewAllHref="/public/mentors"
      />

      {/* 7. Testimonials */}
      <TestimonialCarousel />

      {/* 8. Final CTA */}
      <PromoBanner />
    </div>
  );
}
