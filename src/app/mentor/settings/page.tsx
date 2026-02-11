'use client';

import { redirect } from 'next/navigation';

export default function MentorSettingsPage() {
  // Redirect to main settings page
  redirect('/settings');
}

// src/app/(mentor)/layout.tsx
