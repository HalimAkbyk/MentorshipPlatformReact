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

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function normalizeRoles(roles: unknown): string[] {
  if (Array.isArray(roles)) return roles.map(String);
  if (typeof roles === 'string') return [roles];
  return [];
}

function setRolesCookie(roles: unknown) {
  const list = normalizeRoles(roles);
  setCookie('roles', list.join(','));
}

/** Store tokens in both localStorage and cookies for redundancy */
function persistTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  setCookie('accessToken', accessToken);
  setCookie('refreshToken', refreshToken);
}

/** Read access token from localStorage, fallback to cookie, and re-sync */
function getAccessTokenWithFallback(): string | null {
  if (typeof window === 'undefined') return null;

  // Primary source: localStorage
  let token = localStorage.getItem('accessToken');

  // Fallback: cookie (survives hard reload more reliably)
  if (!token) {
    token = getCookie('accessToken');
    // Re-sync to localStorage so subsequent reads are fast
    if (token) {
      localStorage.setItem('accessToken', token);
      const refreshToken = getCookie('refreshToken');
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
  }

  return token || null;
}

/** Decode JWT payload — returns null on any error */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

/** Check whether JWT is expired (with 30s buffer) */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false; // no exp claim => assume valid
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp < nowSec + 30; // 30s buffer
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    persistTokens(response.accessToken, response.refreshToken);
    setRolesCookie(response.roles);
    return response;
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    persistTokens(response.accessToken, response.refreshToken);
    setRolesCookie(response.roles);
    return response;
  },

  externalLogin: async (data: ExternalLoginRequest): Promise<ExternalLoginResponse> => {
    const response = await apiClient.post<ExternalLoginResponse>('/auth/external-login', data);

    // Only store tokens if this is a real login (not a ROLE_REQUIRED pendingToken response)
    if (response.accessToken) {
      persistTokens(response.accessToken, response.refreshToken);
      setRolesCookie(response.roles);
    }

    return response;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('auth-storage');
      clearCookie('accessToken');
      clearCookie('refreshToken');
      clearCookie('roles');
    }
  },

  /**
   * Read token from localStorage + cookie fallback, decode JWT, return basic user info.
   * Returns null if no token found or token is invalid/expired.
   */
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;

    const token = getAccessTokenWithFallback();
    if (!token) return null;

    // Check expiry
    if (isTokenExpired(token)) {
      // Token expired — don't immediately clear, let initialize handle it
      return null;
    }

    const payload = decodeJwt(token);
    if (!payload) return null;

    return {
      id: payload.nameid || payload.sub,
      email: payload.email,
      roles: payload.role ? (Array.isArray(payload.role) ? payload.role : [payload.role]) : [],
    };
  },

  /** Get the raw access token (with cookie fallback) */
  getAccessToken: (): string | null => {
    return getAccessTokenWithFallback();
  },

  /** Check if the current access token is expired */
  isTokenExpired: (): boolean => {
    const token = getAccessTokenWithFallback();
    if (!token) return true;
    return isTokenExpired(token);
  },

  getMe: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  updateRolesCookieFromUser: (user: { roles?: unknown }) => {
    setRolesCookie(user.roles);
  },
};
