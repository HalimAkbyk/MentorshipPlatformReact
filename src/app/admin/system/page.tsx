'use client';

import { redirect } from 'next/navigation';

export default function SystemRedirect() {
  redirect('/admin/system/audit-log');
}
