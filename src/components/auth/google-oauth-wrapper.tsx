'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { SOCIAL_AUTH_CONFIG } from '@/lib/config/social-auth';

export function GoogleOAuthWrapper({ children }: { children: React.ReactNode }) {
  const clientId = SOCIAL_AUTH_CONFIG.google.clientId;

  // If no client ID, just render children without provider
  if (!clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
