'use client';

import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { PublicClientApplication } from '@azure/msal-browser';
import { usePlatform } from '@/lib/hooks/use-platform';
import { SOCIAL_AUTH_CONFIG } from '@/lib/config/social-auth';
import { Loader2 } from 'lucide-react';

interface SocialLoginButtonsProps {
  mode: 'login' | 'signup';
  onSuccess: (provider: string, token: string, displayName?: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

// MSAL config — initialized lazily
let msalInstance: PublicClientApplication | null = null;
function getMsalInstance() {
  if (!msalInstance) {
    const clientId = SOCIAL_AUTH_CONFIG.microsoft.clientId;
    if (!clientId) return null;
    msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
      },
    });
  }
  return msalInstance;
}

export function SocialLoginButtons({ mode, onSuccess, onError, disabled }: SocialLoginButtonsProps) {
  const platform = usePlatform();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const actionText = mode === 'login' ? 'ile Giriş Yap' : 'ile Kayıt Ol';

  // Google
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      onSuccess('google', tokenResponse.access_token);
      setLoadingProvider(null);
    },
    onError: () => {
      onError?.('Google girişi başarısız oldu');
      setLoadingProvider(null);
    },
    flow: 'implicit',
  });

  // Microsoft
  const handleMicrosoft = async () => {
    try {
      setLoadingProvider('microsoft');
      const msal = getMsalInstance();
      if (!msal) {
        onError?.('Microsoft girişi yapılandırılmamış');
        setLoadingProvider(null);
        return;
      }
      await msal.initialize();
      const result = await msal.loginPopup({
        scopes: ['User.Read'],
      });
      if (result?.accessToken) {
        onSuccess('microsoft', result.accessToken, result.account?.name || undefined);
      }
    } catch (err: any) {
      if (err?.errorCode !== 'user_cancelled') {
        onError?.('Microsoft girişi başarısız oldu');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  // LinkedIn (redirect-based OAuth)
  const handleLinkedIn = () => {
    const clientId = SOCIAL_AUTH_CONFIG.linkedin.clientId || '77j3ve8vc9ir2a';
    const redirectUri = `${window.location.origin}/auth/callback/linkedin`;
    const scope = 'openid profile email';
    const state = btoa(JSON.stringify({ mode }));
    window.location.href =
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
  };

  const isLoading = loadingProvider !== null || disabled;

  const providers = [
    {
      id: 'google',
      label: `Google ${actionText}`,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      onClick: () => {
        setLoadingProvider('google');
        googleLogin();
      },
      show: true,
    },
    {
      id: 'microsoft',
      label: `Microsoft ${actionText}`,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <rect x="1" y="1" width="10" height="10" fill="#F25022" />
          <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
          <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
          <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
        </svg>
      ),
      onClick: handleMicrosoft,
      show: platform === 'windows' || platform === 'other',
    },
    {
      id: 'linkedin',
      label: `LinkedIn ${actionText}`,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
        </svg>
      ),
      onClick: handleLinkedIn,
      show: true,
    },
  ];

  const visibleProviders = providers.filter((p) => p.show);

  return (
    <div className="space-y-3">
      {visibleProviders.map((provider) => (
        <button
          key={provider.id}
          onClick={provider.onClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingProvider === provider.id ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            provider.icon
          )}
          {provider.label}
        </button>
      ))}
    </div>
  );
}
