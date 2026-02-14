'use client';

import { useState, useEffect } from 'react';

export type Platform = 'windows' | 'mac' | 'other';

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) {
      setPlatform('windows');
    } else if (ua.includes('mac')) {
      setPlatform('mac');
    } else {
      setPlatform('other');
    }
  }, []);

  return platform;
}
