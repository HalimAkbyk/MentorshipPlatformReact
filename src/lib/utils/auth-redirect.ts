import { UserRole } from '../types/enums';

export function pickDefaultDashboard(roles: unknown): string {
  const list = Array.isArray(roles) ? roles.map(String) : typeof roles === 'string' ? [roles] : [];

  const isMentor = list.includes(UserRole.Mentor as any) || list.includes('Mentor');
  const isStudent = list.includes(UserRole.Student as any) || list.includes('Student');

  if (isMentor && !isStudent) return '/mentor/dashboard';
  // hem mentor hem student ise default student bırakıyoruz (istersen mentor yaparız)
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
