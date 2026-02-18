'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/auth-store';
import { ConfirmDialogProvider } from './confirmDialogProvider';
import { FloatingChatWidget } from '../features/messaging/floating-chat-widget';
import { useSignalR } from '../../lib/hooks/use-signalr';
import { useFeatureFlags } from '../../lib/hooks/use-feature-flags';
import { MaintenancePage } from '../maintenance-page';

function SignalRProvider() {
  useSignalR();
  return null;
}

/**
 * Checks maintenance mode and blocks non-admin users.
 */
function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { flags, isLoading } = useFeatureFlags();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Admin users bypass maintenance mode
  const isAdmin = user?.roles?.includes('Admin');

  // Always allow admin routes and auth routes
  const isAllowedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth');

  if (isLoading) return null;

  if (flags.maintenance_mode && !isAdmin && !isAllowedPath) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const initCalled = useRef(false);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Prevent double-init in React 18 StrictMode
    if (initCalled.current) return;
    initCalled.current = true;

    // Wait for initialize() to complete before rendering children
    // This ensures auth state is fully resolved (token read + /auth/me call)
    initialize().finally(() => {
      setReady(true);
    });
  }, [initialize]);

  if (!ready) {
    // Minimal loading state — can be replaced with a spinner/skeleton
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MaintenanceGuard>
        {children}
      </MaintenanceGuard>
      <Toaster position="top-right" />
      <ConfirmDialogProvider />
      <FloatingChatWidget />
      <SignalRProvider />
    </QueryClientProvider>
  );
}
