import { UserRole } from '../types/enums';

export function pickDefaultDashboard(roles: unknown): string {
  const list = Array.isArray(roles) ? roles.map(String) : typeof roles === 'string' ? [roles] : [];

  const isMentor = list.includes(UserRole.Mentor as any) || list.includes('Mentor');
  const isAdmin = list.includes(UserRole.Admin as any) || list.includes('Admin');

  if (isAdmin) return '/admin/dashboard';
  // Mentor rolü olan kullanıcılar artık Student rolüne de sahip olduğundan
  // Mentor varsa mentor dashboard'a yönlendir
  if (isMentor) return '/mentor/dashboard';
  return '/student/dashboard';
}

export function safeRedirectPath(redirect: string | null | undefined): string | null {
  if (!redirect) return null;

  // sadece internal path olsun
  if (!redirect.startsWith('/')) return null;
  // auth sayfalarına geri döndürme
  if (redirect.startsWith('/auth')) return null;
  // open redirect engelle
  if (redirect.includes('://')) return null;

  return redirect;
}
