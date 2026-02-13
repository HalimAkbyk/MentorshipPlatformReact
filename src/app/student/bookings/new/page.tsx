'use client';

import { Suspense } from 'react';
import NewBookingContent from './content';

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#227070]" />
        </div>
      }
    >
      <NewBookingContent />
    </Suspense>
  );
}
