'use client';

import { useEffect, useRef } from 'react';

interface RemoteVideoMountProps {
  videoEl: HTMLVideoElement | null;
  objectFit?: 'cover' | 'contain';
}

export function RemoteVideoMount({ videoEl, objectFit = 'cover' }: RemoteVideoMountProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';
    if (videoEl) {
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = objectFit;
      host.appendChild(videoEl);
    }
  }, [videoEl, objectFit]);

  return <div ref={hostRef} className="w-full h-full" />;
}
