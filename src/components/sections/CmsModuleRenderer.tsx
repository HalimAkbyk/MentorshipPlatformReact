'use client';

import type { ActiveModule } from '@/lib/api/homepage';
import { useTopRatedMentors, useNewestMentors } from '@/lib/hooks/use-homepage';
import { useCategoryNames } from '@/lib/hooks/use-categories';
import { useRouter } from 'next/navigation';

// Existing section components
import CourseStrip from '@/components/sections/CourseStrip';
import MentorCarouselSection from '@/components/sections/MentorCarouselSection';
import StatsSection from '@/components/sections/StatsSection';
import TestimonialCarousel from '@/components/sections/TestimonialCarousel';
import HowItWorks from '@/components/sections/HowItWorks';
import BecomeMentor from '@/components/sections/BecomeMentor';

// CMS-specific components
import CmsHeroBanner from '@/components/sections/CmsHeroBanner';
import CmsCtaBanner from '@/components/sections/CmsCtaBanner';

// ── Helpers ──

function safeParseJSON(json: string | null | undefined): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// ── FeaturedMentors wrapper ──
// Needs hooks so must be its own component

function CmsFeaturedMentors({
  moduleTitle,
  content,
}: {
  moduleTitle: string;
  content: Record<string, unknown>;
}) {
  const sortBy = (content.sortBy as string) || 'rating';
  const limit = (content.limit as number) || 12;
  const icon = (content.icon as string) || '';

  const isTopRated = sortBy === 'rating';
  const { data: topRated = [], isLoading: loadingTop } = useTopRatedMentors(limit);
  const { data: newest = [], isLoading: loadingNew } = useNewestMentors(limit);

  const mentors = isTopRated ? topRated : newest;
  const isLoading = isTopRated ? loadingTop : loadingNew;

  return (
    <MentorCarouselSection
      title={moduleTitle}
      icon={icon}
      mentors={mentors}
      isLoading={isLoading}
      viewAllHref="/public/mentors"
    />
  );
}

// ── Categories section ──

function CmsCategoriesSection({ moduleTitle }: { moduleTitle: string }) {
  const router = useRouter();
  const courseCategories = useCategoryNames('Course');
  const classCategories = useCategoryNames('GroupClass');

  // Merge and deduplicate
  const allCategories = Array.from(new Set([...courseCategories, ...classCategories]));

  if (allCategories.length === 0) return null;

  // Category icons - match common category names
  const CATEGORY_ICONS: Record<string, string> = {
    'Yazilim': '\uD83D\uDCBB',
    'Matematik': '\uD83D\uDCCA',
    'Muzik': '\uD83C\uDFB5',
    'Dil': '\uD83C\uDF0D',
    'Sanat': '\uD83C\uDFA8',
    'Bilim': '\uD83D\uDD2C',
    'Spor/Saglik': '\uD83C\uDFCB\uFE0F',
    'Is/Kariyer': '\uD83D\uDCBC',
  };

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">
            {moduleTitle}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => router.push(`/public/mentors?category=${encodeURIComponent(cat)}`)}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all group cursor-pointer"
            >
              <span className="text-3xl">
                {CATEGORY_ICONS[cat] || '\uD83D\uDCD6'}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                {cat}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main Renderer ──

export default function CmsModuleRenderer({ module }: { module: ActiveModule }) {
  const content = safeParseJSON(module.content);

  switch (module.moduleType) {
    case 'HeroBanner':
      return (
        <CmsHeroBanner
          moduleTitle={module.title}
          moduleSubtitle={module.subtitle}
          content={content as Parameters<typeof CmsHeroBanner>[0]['content']}
        />
      );

    case 'PopularCourses':
      return <CourseStrip />;

    case 'FeaturedMentors':
      return (
        <CmsFeaturedMentors
          moduleTitle={module.title}
          content={content}
        />
      );

    case 'CTA':
      return (
        <CmsCtaBanner
          moduleTitle={module.title}
          moduleSubtitle={module.subtitle}
          content={content as Parameters<typeof CmsCtaBanner>[0]['content']}
        />
      );

    case 'Categories':
      return <CmsCategoriesSection moduleTitle={module.title} />;

    case 'Stats':
      return <StatsSection />;

    case 'Testimonials':
      return <TestimonialCarousel />;

    case 'HowItWorks':
      return <HowItWorks />;

    case 'BecomeMentor':
      return <BecomeMentor />;

    default:
      return null;
  }
}
