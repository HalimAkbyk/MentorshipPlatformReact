'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CtaButton {
  text: string;
  url: string;
}

interface BadgeConfig {
  text: string;
  color?: string;
}

interface CtaBannerContent {
  badge?: BadgeConfig;
  title?: string;
  subtitle?: string;
  primaryCta?: CtaButton;
  secondaryCta?: CtaButton;
  gradient?: string;
}

export default function CmsCtaBanner({
  moduleTitle,
  moduleSubtitle,
  content,
}: {
  moduleTitle: string;
  moduleSubtitle: string | null;
  content: CtaBannerContent;
}) {
  const title = content.title || moduleTitle;
  const subtitle = content.subtitle || moduleSubtitle || '';
  const gradient = content.gradient || 'from-teal-600 to-green-700';
  const badge = content.badge;
  const primaryCta = content.primaryCta;
  const secondaryCta = content.secondaryCta;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-8 md:p-12 lg:p-16`}
        >
          {/* Decorative */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative text-center max-w-2xl mx-auto">
            {/* Badge */}
            {badge && (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-white/15 text-white border border-white/20 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                {badge.text}
              </div>
            )}

            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 font-heading">
              {title}
            </h2>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-base md:text-lg text-white/80 mb-8 leading-relaxed">
                {subtitle}
              </p>
            )}

            {/* CTA Buttons */}
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {primaryCta && (
                  <Link
                    href={primaryCta.url}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg text-base"
                  >
                    {primaryCta.text}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {secondaryCta && (
                  <Link
                    href={secondaryCta.url}
                    className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-base"
                  >
                    {secondaryCta.text}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
