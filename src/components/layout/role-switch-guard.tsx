'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { UserRole } from '@/lib/types/enums';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRightLeft } from 'lucide-react';

interface RoleSwitchGuardProps {
  requiredView: 'student' | 'mentor';
  children: React.ReactNode;
}

/**
 * For dual-role users: if activeView doesn't match the required view for this route,
 * show a confirmation dialog to switch roles before rendering the page.
 */
export function RoleSwitchGuard({ requiredView, children }: RoleSwitchGuardProps) {
  const router = useRouter();
  const { user, activeView, setActiveView } = useAuthStore();

  const roles = user?.roles ?? [];
  const isMentor = roles.includes(UserRole.Mentor);
  const isStudent = roles.includes(UserRole.Student);
  const isDualRole = isMentor && isStudent;

  // Only applies to dual-role users whose activeView doesn't match
  if (!isDualRole || activeView === requiredView) {
    return <>{children}</>;
  }

  const targetLabel = requiredView === 'mentor' ? 'Egitmen' : 'Ogrenci';
  const currentLabel = activeView === 'mentor' ? 'Egitmen' : 'Ogrenci';

  const handleSwitch = () => {
    setActiveView(requiredView);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center border border-gray-200 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-5">
          <ArrowRightLeft className="w-6 h-6 text-teal-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Rol Degisikligi Gerekli
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Bu sayfa <span className="font-medium text-gray-700">{targetLabel}</span> gorunumune aittir.
          Su anda <span className="font-medium text-gray-700">{currentLabel}</span> gorunumundesiniz.
          Devam etmek icin rol degistirin.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-200"
            onClick={handleGoBack}
          >
            Geri Don
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-teal-600 to-green-600 text-white"
            onClick={handleSwitch}
          >
            {targetLabel} Moduna Gec
          </Button>
        </div>
      </Card>
    </div>
  );
}
