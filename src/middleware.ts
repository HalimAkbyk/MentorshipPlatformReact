import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseRolesCookie(value?: string) {
  if (!value) return [];
  // "Student,Mentor" veya '["Student","Mentor"]' destekleyelim
  try {
    if (value.trim().startsWith('[')) return JSON.parse(value);
  } catch {}
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('accessToken')?.value; // auth-provider login’de set ediyorsun varsayımı
  const rolesCookie = request.cookies.get('roles')?.value || request.cookies.get('role')?.value;
  const roles = parseRolesCookie(rolesCookie);

  const isPublic = pathname === '/' || pathname.startsWith('/public');

  const isAuthRoute =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/signup');

  const isStudentRoute = pathname.startsWith('/student');
  const isMentorRoute = pathname.startsWith('/mentor');
  const isAdminRoute = pathname.startsWith('/admin');

  const isProtected =
    isStudentRoute || isMentorRoute || isAdminRoute || pathname.startsWith('/auth/onboarding');

  // Auth sayfalarına login olmuş kullanıcı girmesin
  if (isAuthRoute && token) {
    if (roles.includes('Admin')) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (roles.includes('Mentor')) return NextResponse.redirect(new URL('/mentor/dashboard', request.url));
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // Protected -> token yoksa login
  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role guard
  if (isAdminRoute && token && !roles.includes('Admin')) {
    return NextResponse.redirect(new URL('/public', request.url));
  }

  if (isMentorRoute && token && !roles.includes('Mentor')) {
    return NextResponse.redirect(new URL('/public', request.url));
  }

  if (isStudentRoute && token && !roles.includes('Student')) {
    return NextResponse.redirect(new URL('/public', request.url));
  }

  // Public route’lar serbest
  if (isPublic) return NextResponse.next();

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
