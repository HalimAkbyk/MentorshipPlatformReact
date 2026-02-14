import { apiClient } from './client';
import type { AuthResponse, LoginRequest, SignupRequest, ExternalLoginRequest, ExternalLoginResponse } from '../../lib/types/api';
import type { User } from '../types/models';

function setCookie(name: string, value: string, days = 7) {
  const maxAge = days * 24 * 60 * 60;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const sameSite = isHttps ? 'None' : 'Lax';
  const secure = isHttps ? '; Secure' : '';

  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure}`;
}



function clearCookie(name: string) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const sameSite = isHttps ? 'None' : 'Lax';
  const secure = isHttps ? '; Secure' : '';

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`;
}


function normalizeRoles(roles: unknown): string[] {
  if (Array.isArray(roles)) return roles.map(String);
  if (typeof roles === 'string') return [roles];
  return [];
}

function setRolesCookie(roles: unknown) {
  const list = normalizeRoles(roles);
  // cookie string: "Mentor,Student"
  setCookie('roles', list.join(','));
}
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);

localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

setCookie('accessToken', response.accessToken);
setCookie('refreshToken', response.refreshToken);

// ✅ roles cookie
setRolesCookie(response.roles);
    
    return response;
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);

localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);

setCookie('accessToken', response.accessToken);
setCookie('refreshToken', response.refreshToken);

// ✅ roles cookie
setRolesCookie(response.roles);
    
    return response;
  },

  externalLogin: async (data: ExternalLoginRequest): Promise<ExternalLoginResponse> => {
    const response = await apiClient.post<ExternalLoginResponse>('/auth/external-login', data);

    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    setCookie('accessToken', response.accessToken);
    setCookie('refreshToken', response.refreshToken);

    setRolesCookie(response.roles);

    return response;
  },

  logout: () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearCookie('accessToken');
    clearCookie('refreshToken');
    clearCookie('roles'); // ✅
  }
},

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      // Decode JWT (simple base64 decode, in production use a library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.nameid || payload.sub,
        email: payload.email,
        roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],
      };
    } catch {
      return null;
    }
  },
   getMe: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },
  updateRolesCookieFromUser: (user: { roles?: unknown }) => {
  setRolesCookie(user.roles);
},
};