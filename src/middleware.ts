import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseRolesCookie(value?: string) {
  if (!value) return [];
  try {
    if (value.trim().startsWith('[')) return JSON.parse(value);
  } catch {}
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/** Decode JWT and check if it is expired (edge-runtime compatible) */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // Edge runtime has atob
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true; // no exp claim → assume valid
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp > nowSec + 30; // 30s buffer
  } catch {
    return false;
  }
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
  // If user has a VALID (non-expired) cookie and visits /auth/login or /auth/signup,
  // redirect to their dashboard. This is a convenience redirect.
  if (isAuthRoute && token && isTokenValid(token)) {
    if (roles.includes('Admin')) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (roles.includes('Mentor')) return NextResponse.redirect(new URL('/mentor/dashboard', request.url));
    if (roles.includes('Student')) return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // If token is expired on auth routes, clear the stale cookies so the user
  // can log in fresh without a redirect loop.
  if (isAuthRoute && token && !isTokenValid(token)) {
    const response = NextResponse.next();
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('roles');
    return response;
  }

  // ─── ALL other routes: pass through ───
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
