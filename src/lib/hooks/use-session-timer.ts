'use client';

import { useState, useEffect, useMemo } from 'react';

export type SessionPhase =
  | 'not-started'
  | 'early-join'
  | 'active'
  | 'ending-soon'
  | 'grace-period'
  | 'ended';

export type WarningLevel = 'none' | 'info' | 'warning' | 'danger';

export interface SessionTimerState {
  /** Seconds remaining until official end (can be negative in grace) */
  remainingSeconds: number;
  /** Seconds remaining in grace period (0 if not in grace) */
  graceRemainingSeconds: number;
  /** Current session phase */
  phase: SessionPhase;
  /** Human-readable formatted time MM:SS */
  formattedRemaining: string;
  /** Warning level for UI coloring */
  warningLevel: WarningLevel;
  /** Elapsed seconds since session started */
  elapsedSeconds: number;
  /** Formatted elapsed HH:MM:SS or MM:SS */
  formattedElapsed: string;
}

const ENDING_SOON_THRESHOLD = 5 * 60; // Last 5 minutes

function formatTime(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

interface UseSessionTimerOptions {
  startAt: string;
  endAt: string;
  gracePeriodMinutes: number;
  /** If true, timer is active; if false, paused/not started */
  enabled?: boolean;
}

export function useSessionTimer({
  startAt,
  endAt,
  gracePeriodMinutes,
  enabled = true,
}: UseSessionTimerOptions): SessionTimerState {
  const [now, setNow] = useState(() => new Date());

  const startDate = useMemo(() => new Date(startAt), [startAt]);
  const endDate = useMemo(() => new Date(endAt), [endAt]);
  const graceEndDate = useMemo(
    () => new Date(endDate.getTime() + gracePeriodMinutes * 60 * 1000),
    [endDate, gracePeriodMinutes]
  );

  // Update every second
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  return useMemo(() => {
    const nowMs = now.getTime();
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const graceEndMs = graceEndDate.getTime();

    // Time calculations
    const secondsUntilStart = Math.floor((startMs - nowMs) / 1000);
    const secondsUntilEnd = Math.floor((endMs - nowMs) / 1000);
    const secondsUntilGraceEnd = Math.floor((graceEndMs - nowMs) / 1000);
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));

    let phase: SessionPhase;
    let remainingSeconds: number;
    let graceRemainingSeconds: number;
    let warningLevel: WarningLevel;

    if (nowMs < startMs - 15 * 60 * 1000) {
      // More than 15 min before start
      phase = 'not-started';
      remainingSeconds = secondsUntilEnd;
      graceRemainingSeconds = 0;
      warningLevel = 'none';
    } else if (nowMs < startMs) {
      // Within early join window (15 min before)
      phase = 'early-join';
      remainingSeconds = secondsUntilEnd;
      graceRemainingSeconds = 0;
      warningLevel = 'info';
    } else if (secondsUntilEnd > ENDING_SOON_THRESHOLD) {
      // Active session, more than 5 min left
      phase = 'active';
      remainingSeconds = secondsUntilEnd;
      graceRemainingSeconds = 0;
      warningLevel = 'none';
    } else if (secondsUntilEnd > 0) {
      // Last 5 minutes
      phase = 'ending-soon';
      remainingSeconds = secondsUntilEnd;
      graceRemainingSeconds = 0;
      warningLevel = 'warning';
    } else if (secondsUntilGraceEnd > 0) {
      // In grace period
      phase = 'grace-period';
      remainingSeconds = secondsUntilEnd; // Negative
      graceRemainingSeconds = secondsUntilGraceEnd;
      warningLevel = 'danger';
    } else {
      // Past grace period
      phase = 'ended';
      remainingSeconds = 0;
      graceRemainingSeconds = 0;
      warningLevel = 'danger';
    }

    // Format remaining: show grace countdown when in grace period
    const displaySeconds =
      phase === 'grace-period' ? graceRemainingSeconds : Math.max(0, remainingSeconds);
    const formattedRemaining = formatTime(displaySeconds);
    const formattedElapsed = formatTime(elapsedSeconds);

    return {
      remainingSeconds,
      graceRemainingSeconds,
      phase,
      formattedRemaining,
      warningLevel,
      elapsedSeconds,
      formattedElapsed,
    };
  }, [now, startDate, endDate, graceEndDate]);
}
