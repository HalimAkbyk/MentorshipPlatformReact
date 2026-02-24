'use client';

import { Clock, AlertTriangle, XCircle } from 'lucide-react';
import { SessionPhase, WarningLevel } from '../../lib/hooks/use-session-timer';

interface SessionTimerBannerProps {
  phase: SessionPhase;
  formattedRemaining: string;
  formattedElapsed: string;
  warningLevel: WarningLevel;
  graceRemainingSeconds: number;
  gracePeriodMinutes: number;
  isRoomActive: boolean;
}

export function SessionTimerBanner({
  phase,
  formattedRemaining,
  formattedElapsed,
  warningLevel,
  graceRemainingSeconds,
  gracePeriodMinutes,
  isRoomActive,
}: SessionTimerBannerProps) {
  if (phase === 'not-started') return null;
  if (!isRoomActive && phase !== 'early-join' && phase !== 'ending-soon' && phase !== 'grace-period' && phase !== 'ended') return null;

  // Different styling per phase
  const config = getPhaseConfig(phase, formattedRemaining, formattedElapsed, gracePeriodMinutes);

  return (
    <div className={`${config.bgClass} px-4 py-1.5 flex items-center justify-center gap-2 text-sm font-medium shrink-0 transition-colors duration-300 ${config.animate ? 'animate-pulse' : ''}`}>
      <config.icon className={`w-4 h-4 ${config.iconClass}`} />
      <span className={config.textClass}>{config.message}</span>
      <span className={`font-mono font-bold ${config.timerClass}`}>
        {config.timerValue}
      </span>
    </div>
  );
}

function getPhaseConfig(
  phase: SessionPhase,
  formattedRemaining: string,
  formattedElapsed: string,
  gracePeriodMinutes: number
) {
  switch (phase) {
    case 'early-join':
      return {
        bgClass: 'bg-blue-600/20 border-b border-blue-500/30',
        icon: Clock,
        iconClass: 'text-blue-400',
        textClass: 'text-blue-300',
        timerClass: 'text-blue-200',
        message: 'Seans başlangıcına',
        timerValue: formattedRemaining,
        animate: false,
      };
    case 'active':
      return {
        bgClass: 'bg-gray-800/50 border-b border-gray-700/50',
        icon: Clock,
        iconClass: 'text-gray-400',
        textClass: 'text-gray-300',
        timerClass: 'text-white',
        message: 'Kalan süre:',
        timerValue: formattedRemaining,
        animate: false,
      };
    case 'ending-soon':
      return {
        bgClass: 'bg-yellow-600/30 border-b border-yellow-500/40',
        icon: AlertTriangle,
        iconClass: 'text-yellow-400',
        textClass: 'text-yellow-200',
        timerClass: 'text-yellow-100',
        message: 'Seans bitimine kaldı:',
        timerValue: formattedRemaining,
        animate: false,
      };
    case 'grace-period':
      return {
        bgClass: 'bg-red-600/30 border-b border-red-500/40',
        icon: AlertTriangle,
        iconClass: 'text-red-400',
        textClass: 'text-red-200',
        timerClass: 'text-red-100',
        message: `Seans süresi doldu! Uzatma (${gracePeriodMinutes}dk):`,
        timerValue: formattedRemaining,
        animate: true,
      };
    case 'ended':
      return {
        bgClass: 'bg-red-700/40 border-b border-red-600/50',
        icon: XCircle,
        iconClass: 'text-red-400',
        textClass: 'text-red-200',
        timerClass: 'text-red-100',
        message: 'Seans sona erdi',
        timerValue: '',
        animate: true,
      };
    default:
      return {
        bgClass: '',
        icon: Clock,
        iconClass: '',
        textClass: '',
        timerClass: '',
        message: '',
        timerValue: '',
        animate: false,
      };
  }
}
