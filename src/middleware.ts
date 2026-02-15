import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseRolesCookie(value?: string) {
  if (!value) return [];
  try {
    if (value.trim().startsWith('[')) return JSON.parse(value);
  } catch {}
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('accessToken')?.value;
  const rolesCookie = request.cookies.get('roles')?.value || request.cookies.get('role')?.value;
  const roles = parseRolesCookie(rolesCookie);

  const isAuthRoute =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/signup');

  // ─── ONLY redirect logged-in users AWAY from auth pages ───
  // If user has a valid cookie and visits /auth/login or /auth/signup,
  // redirect to their dashboard. This is a convenience redirect.
  if (isAuthRoute && token) {
    if (roles.includes('Admin')) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (roles.includes('Mentor')) return NextResponse.redirect(new URL('/mentor/dashboard', request.url));
    if (roles.includes('Student')) return NextResponse.redirect(new URL('/student/dashboard', request.url));
    // Cookie exists but no role → let client-side handle
  }

  // ─── ALL other routes: pass through ───
  // Protected routes (/student/*, /mentor/*, /admin/*) are guarded by
  // client-side layout components (student/layout.tsx, mentor/layout.tsx)
  // which check auth state from localStorage (the reliable source).
  //
  // We do NOT redirect here because:
  // 1) Middleware can only read cookies, but cookies can vanish
  //    (SameSite restrictions, hard reload, browser quirks)
  // 2) localStorage (where tokens are stored) persists reliably
  //    but is not accessible in middleware (server-side)
  // 3) Client-side guards already handle unauthenticated users
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
