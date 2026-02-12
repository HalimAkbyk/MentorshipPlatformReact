import axios, { AxiosError, AxiosInstance,AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { localizeErrorMessage } from '../utils/error-messages';



const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072/api';

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

  // 🔥 BURASI ÖNEMLİ → Türkçeye çeviriyoruz
  return rawMessage
    .split('\n')
    .map((m: string) => localizeErrorMessage(m.trim()))
    .join('\n');
}


class ApiClient {
  private client: AxiosInstance;

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

    // 401 -> logout + redirect (mevcut davranış)
    if (status === 401) {
      this.clearTokens();

      // Login sayfasında zaten isen spam toast basma
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/login')) {
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        window.location.href = '/auth/login';
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
    // Diğer tüm hatalar
    const msg = extractErrorMessage(error);
    toast.error(msg);

    return Promise.reject(error);
  }
);

  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
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

// async post <T>(url: string, data?: any, config?: AxiosRequestConfig) {
//   const response = await this.client.post<T>(url, data, config);
//   return response.data;
//   }

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
}

export const apiClient = new ApiClient();