'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { pickDefaultDashboard, safeRedirectPath } from '@/lib/utils/auth-redirect';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LinkedInCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const externalLogin = useAuthStore((s) => s.externalLogin);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Role selection modal for new users
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const stateParam = searchParams.get('state');

    if (errorParam) {
      setError('LinkedIn girisi iptal edildi veya basarisiz oldu.');
      setIsLoading(false);
      return;
    }

    if (!code) {
      setError('LinkedIn dogrulama kodu bulunamadi.');
      setIsLoading(false);
      return;
    }

    // Parse state to get mode (login or signup)
    let mode = 'login';
    try {
      if (stateParam) {
        const parsed = JSON.parse(atob(stateParam));
        mode = parsed.mode || 'login';
      }
    } catch {
      // Ignore state parse errors
    }

    handleLinkedInCode(code, mode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLinkedInCode = async (code: string, mode: string) => {
    try {
      setIsLoading(true);
      const redirectUri = `${window.location.origin}/auth/callback/linkedin`;

      const result = await externalLogin({
        provider: 'linkedin',
        token: '',
        code,
        redirectUri,
      });

      if (result.isNewUser) {
        toast.success('Hesabiniz olusturuldu!');
      }

      navigateAfterAuth();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.errors?.[0] || e?.message || '';
      if (errorMsg.startsWith('ROLE_REQUIRED')) {
        // New user → need role selection
        // Backend returns "ROLE_REQUIRED:providerAccessToken" so we can retry
        // without the one-time auth code
        const parts = errorMsg.split(':');
        const extractedToken = parts.length > 1 ? parts.slice(1).join(':') : '';
        setPendingToken(extractedToken);
        setShowRoleSelect(true);
        setIsLoading(false);
      } else {
        setError('LinkedIn girisi basarisiz oldu. Lutfen tekrar deneyin.');
        setIsLoading(false);
      }
    }
  };

  const handleRoleSelect = async (role: 'Student' | 'Mentor') => {
    if (!pendingToken) return;
    try {
      setIsLoading(true);
      setShowRoleSelect(false);

      // Use the provider access token (not the one-time code) for the retry
      await externalLogin({
        provider: 'linkedin',
        token: pendingToken,
        initialRole: role,
      });

      toast.success('Hesabiniz olusturuldu!');
      navigateAfterAuth();
    } catch {
      setError('Kayit basarisiz oldu. Lutfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  const navigateAfterAuth = () => {
    const stateUser = useAuthStore.getState().user;
    router.replace(pickDefaultDashboard(stateUser?.roles));
  };

  // Role selection UI
  if (showRoleSelect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg text-center">Rol Secin</CardTitle>
            <CardDescription className="text-center">
              LinkedIn ile devam etmek icin bir rol secin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => handleRoleSelect('Student')}
              disabled={isLoading}
            >
              Danisan olarak devam et
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleRoleSelect('Mentor')}
              disabled={isLoading}
            >
              Mentor olarak devam et
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={() => router.push('/auth/login')}
              disabled={isLoading}
            >
              Iptal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.push('/auth/login')} variant="outline">
              Giris sayfasina don
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
        <p className="text-gray-600">LinkedIn ile giris yapiliyor...</p>
      </div>
    </div>
  );
}
