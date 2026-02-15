'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../lib/stores/auth-store';
import { ConfirmDialogProvider } from './confirmDialogProvider';

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
      {children}
      <Toaster position="top-right" />
      <ConfirmDialogProvider />
    </QueryClientProvider>
  );
}
