'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';

// Pages considered as "work in progress" where switching role needs confirmation
const WORK_IN_PROGRESS_PATTERNS = [
  '/offerings', // creating/editing offerings
  '/settings',  // editing settings
  '/availability', // editing availability
  '/free-session', // active free session
  '/group-classes', // creating group class
  '/courses/', // editing course
];

function isWorkInProgressPage(pathname: string): boolean {
  return WORK_IN_PROGRESS_PATTERNS.some((p) => pathname.includes(p));
}

export function RoleToggle() {
  const { user, activeView, setActiveView } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingView, setPendingView] = useState<'student' | 'mentor' | null>(null);

  const roles = user?.roles ?? [];
  const isMentor = roles.includes(UserRole.Mentor);
  const isStudent = roles.includes(UserRole.Student);

  // Only show for dual-role users
  if (!isMentor || !isStudent) return null;

  const handleSwitch = (newView: 'student' | 'mentor') => {
    if (newView === activeView) return;

    if (isWorkInProgressPage(pathname)) {
      setPendingView(newView);
      setShowConfirm(true);
      return;
    }

    doSwitch(newView);
  };

  const doSwitch = (newView: 'student' | 'mentor') => {
    setActiveView(newView);
    router.push(newView === 'student' ? '/student/dashboard' : '/mentor/dashboard');
  };

  const confirmSwitch = () => {
    if (pendingView) {
      doSwitch(pendingView);
    }
    setShowConfirm(false);
    setPendingView(null);
  };

  const cancelSwitch = () => {
    setShowConfirm(false);
    setPendingView(null);
  };

  return (
    <>
      <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-xs">
        <button
          onClick={() => handleSwitch('student')}
          className={cn(
            'px-3 py-1 rounded-full transition-all font-medium',
            activeView === 'student'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Ogrenci
        </button>
        <button
          onClick={() => handleSwitch('mentor')}
          className={cn(
            'px-3 py-1 rounded-full transition-all font-medium',
            activeView === 'mentor'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Egitmen
        </button>
      </div>

      {/* Unsaved work confirmation dialog — portal to body to avoid header overflow clipping */}
      {showConfirm && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Rol degistirmek istiyor musunuz?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Bu sayfada tamamlanmamis islemleriniz olabilir. Rol degistirirseniz kaydedilmemis
              degisiklikler kaybolabilir.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelSwitch}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Iptal
              </button>
              <button
                onClick={confirmSwitch}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Degistir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
