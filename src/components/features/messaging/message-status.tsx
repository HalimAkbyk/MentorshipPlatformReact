'use client';

import { Check, CheckCheck } from 'lucide-react';

interface MessageStatusProps {
  isOwnMessage: boolean;
  deliveredAt: string | null;
  readAt: string | null;
}

export function MessageStatus({ isOwnMessage, deliveredAt, readAt }: MessageStatusProps) {
  if (!isOwnMessage) return null;

  // Read: double blue tick
  if (readAt) {
    return <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  }

  // Delivered: double gray tick
  if (deliveredAt) {
    return <CheckCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
  }

  // Sent: single gray tick
  return <Check className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
}
