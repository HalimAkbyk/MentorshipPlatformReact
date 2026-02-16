'use client';

import * as React from 'react';
import { cn } from '../../lib/utils/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-auto mt-24 w-[92vw] max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="p-5 border-b">
          {title && <div className="text-base font-semibold">{title}</div>}
          {description && <div className="text-sm text-gray-600 mt-1">{description}</div>}
        </div>
        <div className={cn('p-5', className)}>{children}</div>
      </div>
    </div>
  );
}
