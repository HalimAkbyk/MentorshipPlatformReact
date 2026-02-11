'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
  }, [initialize]);

  if (!mounted) return null;
  return <>{children}</>;
}
