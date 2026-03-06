'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { cn } from '@/lib/utils/cn';

export function RoleToggle() {
  const { user, activeView, setActiveView } = useAuthStore();

  const roles = user?.roles ?? [];
  const isMentor = roles.includes(UserRole.Mentor);
  const isStudent = roles.includes(UserRole.Student);

  // Only show for dual-role users
  if (!isMentor || !isStudent) return null;

  return (
    <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-xs">
      <button
        onClick={() => setActiveView('student')}
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
        onClick={() => setActiveView('mentor')}
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
  );
}
