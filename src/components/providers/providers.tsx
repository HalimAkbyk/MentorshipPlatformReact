'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
      <ConfirmDialogProvider />
    </QueryClientProvider>
  );
}