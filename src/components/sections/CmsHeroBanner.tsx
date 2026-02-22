'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

interface CtaButton {
  text: string;
  url: string;
}

interface BadgeConfig {
  text: string;
  color?: 'success' | 'warning' | 'info' | 'default';
}

interface HeroBannerContent {
  badge?: BadgeConfig;
  title?: string;
  subtitle?: string;
  description?: string;
  primaryCta?: CtaButton;
  secondaryCta?: CtaButton;
  backgroundImage?: string;
  features?: string[];
  gradient?: string;
}

const BADGE_COLORS: Record<string, string> = {
  success: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  warning: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  info: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  default: 'bg-white/10 text-white/90 border-white/20',
};

export default function CmsHeroBanner({
  moduleTitle,
  moduleSubtitle,
  content,
}: {
  moduleTitle: string;
  moduleSubtitle: string | null;
  content: HeroBannerContent;
}) {
  const title = content.title || moduleTitle;
  const subtitle = content.subtitle || moduleSubtitle || '';
  const description = content.description || '';
  const gradient = content.gradient || 'from-teal-600 via-teal-700 to-green-800';
  const badge = content.badge;
  const primaryCta = content.primaryCta;
  const secondaryCta = content.secondaryCta;
  const features = content.features || [];
  const backgroundImage = content.backgroundImage;

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className={`bg-gradient-to-br ${gradient} relative`}>
        {backgroundImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            {badge && (
              <div className="inline-flex items-center gap-2 mb-6">
                <span
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border ${
                    BADGE_COLORS[badge.color || 'default']
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {badge.text}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-heading">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xl md:text-2xl text-white/80 mb-4 leading-relaxed">
                {subtitle}
              </p>
            )}

            {/* Description */}
            {description && (
              <p className="text-base md:text-lg text-white/60 mb-8 max-w-2xl mx-auto">
                {description}
              </p>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-white/80 text-sm"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Buttons */}
            {(primaryCta || secondaryCta) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {primaryCta && (
                  <Link
                    href={primaryCta.url}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-teal-700 font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl text-base"
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
