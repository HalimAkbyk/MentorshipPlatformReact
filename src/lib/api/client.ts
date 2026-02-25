import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { localizeErrorMessage } from '../utils/error-messages';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';

/** Flag to prevent multiple concurrent 401 redirects */
let isRedirectingToLogin = false;

function extractErrorMessage(err: any): string {
  const data = err?.response?.data;

  let rawMessage = '';

  if (data?.errors && Array.isArray(data.errors) && data.errors.length) {
    rawMessage = data.errors.join('\n');
  }
  else if (data?.errors && typeof data.errors === 'object') {
    const parts: string[] = [];
    for (const key of Object.keys(data.errors)) {
      const v = (data.errors as any)[key];
      if (Array.isArray(v)) parts.push(...v.map(String));
      else if (typeof v === 'string') parts.push(v);
    }
    rawMessage = parts.join('\n');
  }
  else if (typeof data?.message === 'string') {
    rawMessage = data.message;
  }
  else if (typeof data?.title === 'string') {
    rawMessage = data.title;
  }
  else if (typeof err?.message === 'string') {
    rawMessage = err.message;
  }

  if (!rawMessage) rawMessage = 'An error occurred';

  return rawMessage
    .split('\n')
    .map((m: string) => localizeErrorMessage(m.trim()))
    .join('\n');
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

class ApiClient {
  private client: AxiosInstance;
  /** When true, 401 errors won't auto-redirect (used during initialization) */
  public suppressAuthRedirect = false;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const status = error.response?.status;

        // 401 -> clear tokens and redirect to login
        if (status === 401) {
          // During initialization, don't redirect — just reject so initialize() can handle it
          if (this.suppressAuthRedirect) {
            return Promise.reject(error);
          }

          // On /auth pages (onboarding, signup, login), don't clear tokens or redirect.
          // These pages handle auth state themselves; clearing here would break
          // onboarding save flows where the user is still authenticated.
          const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
          if (isAuthPage) {
            return Promise.reject(error);
          }

          this.clearTokens();

          // Only redirect to login from protected pages (student, mentor, admin).
          // Public pages should never force a login redirect on 401.
          if (typeof window !== 'undefined') {
            const isProtectedRoute = ['/student', '/mentor', '/admin'].some(
              (prefix) => window.location.pathname.startsWith(prefix)
            );
            if (isProtectedRoute && !isRedirectingToLogin) {
              isRedirectingToLogin = true;
              toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
              window.location.href = '/auth/login';
            }
          }

          return Promise.reject(error);
        }

        // 403 -> yetki yok
        if (status === 403) {
          toast.error('Bu işlem için yetkiniz yok.');
          return Promise.reject(error);
        }

        if (status === 500) {
          toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
          return Promise.reject(error);
        }

        // 404 -> toast gosterme, frontend handle etsin
        if (status === 404) {
          return Promise.reject(error);
        }

        // Diger tum hatalar (400, 422 vb.)
        const msg = extractErrorMessage(error);
        toast.error(msg);

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Primary: localStorage
    let token = localStorage.getItem('accessToken');

    // Fallback: cookie (survives hard reload better)
    if (!token) {
      token = getCookie('accessToken');
      // Re-sync to localStorage
      if (token) {
        localStorage.setItem('accessToken', token);
      }
    }

    return token;
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    const isHttps = window.location.protocol === 'https:';
    const sameSite = isHttps ? 'None' : 'Lax';
    const secure = isHttps ? '; Secure' : '';

    document.cookie = `accessToken=; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`;
    document.cookie = `refreshToken=; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`;
    document.cookie = `roles=; Path=/; Max-Age=0; SameSite=${sameSite}${secure}`;
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  async postForm<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': undefined, // Let axios auto-set with proper boundary
      },
    });
    return response.data;
  }

  async putForm<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.put<T>(url, formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
