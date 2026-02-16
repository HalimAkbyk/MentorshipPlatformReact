'use client';

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

/* ───────────────────────── Shared variants ───────────────────────── */

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

/* ─────────────────── Reusable wrapper components ─────────────────── */

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
}

/**
 * Fade-in-up animation triggered when section scrolls into view.
 * Wraps a `<section>` element by default.
 */
export function FadeInSection({ children, className, delay = 0 }: MotionSectionProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/**
 * Generic fade-in-up wrapper using a <div>.
 */
export function FadeInDiv({
  children,
  className,
  delay = 0,
}: MotionSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — children using `fadeInUp` as variants will animate sequentially.
 */
export function StaggerGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual stagger item — use inside a <StaggerGrid>.
 */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale-in from slightly smaller — great for hero visuals and images.
 */
export function ScaleInDiv({
  children,
  className,
  delay = 0,
}: MotionSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      variants={scaleIn}
      className={className}
    >
      {children}
    </motion.div>
  );
}
