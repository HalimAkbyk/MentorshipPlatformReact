'use client';

import { Wrench, Clock } from 'lucide-react';

/**
 * Full-screen maintenance mode page shown when the system is in maintenance.
 */
export function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="text-center px-6 max-w-lg">
        {/* Icon */}
        <div className="relative inline-flex mb-8">
          <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative bg-white rounded-full p-6 shadow-lg border border-gray-100">
            <Wrench className="h-16 w-16 text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Bakim Modu
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-6">
          Sistemimiz su anda bakim calismalari nedeniyle gecici olarak kullanim disi.
          Kisa surede geri donecegiz.
        </p>

        {/* Time indicator */}
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Lutfen daha sonra tekrar deneyin</span>
        </div>

        {/* Decorative dots */}
        <div className="flex justify-center gap-1.5 mt-10">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
