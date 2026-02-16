import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../../lib/api/auth';
import { apiClient } from '../../lib/api/client';
import type { User } from '../../lib/types/models';

interface ExternalLoginParams {
  provider: string;
  token: string;
  code?: string;
  redirectUri?: string;
  displayName?: string;
  initialRole?: string;
}

interface ExternalLoginResult {
  isNewUser: boolean;
  pendingToken?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, role: string) => Promise<void>;
  externalLogin: (params: ExternalLoginParams) => Promise<ExternalLoginResult>;
  logout: () => void;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type AnyAuthResponse = any;

function mapUserFromResponse(params: {
  response: AnyAuthResponse;
  emailFallback: string;
  displayNameFallback: string;
}): User {
  const { response, emailFallback, displayNameFallback } = params;

  const u = (response?.User ?? response?.user ?? response?.data?.User ?? response?.data?.user) as Partial<User> | undefined;

  const id = (u?.id ?? response?.userId ?? response?.UserId ?? response?.userID) as string;
  const email = (u?.email ?? emailFallback) as string;
  const displayName = (u?.displayName ?? displayNameFallback ?? email) as string;
  const roles = (u?.roles ?? response?.roles ?? []) as User['roles'];

  return {
    id,
    email,
    displayName,
    roles,
    status: (u?.status ?? 'Active') as User['status'],
    createdAt: (u?.createdAt ?? '') as string,
    updatedAt: (u?.updatedAt ?? '') as string,
    avatarUrl: u?.avatarUrl,
    birthYear: u?.birthYear,
    phone: u?.phone,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      _hasHydrated: false,

      initialize: async () => {
        // 1) Check if any token exists at all (localStorage + cookie fallback)
        const rawToken = authApi.getAccessToken();

        if (!rawToken) {
          // No token anywhere → not authenticated
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // 2) Try to decode JWT for instant UI (before network call)
        const decoded = authApi.getCurrentUser();

        if (decoded && decoded.roles && decoded.roles.length > 0) {
          // Valid, non-expired token with roles → set user immediately
          set({
            user: {
              id: decoded.id,
              email: decoded.email,
              displayName: decoded.email,
              roles: decoded.roles,
              status: 'Active',
              createdAt: '',
              updatedAt: '',
            } as any,
            isAuthenticated: true,
            isLoading: true,
          });
        }
        // If decoded is null (expired) or has no roles, we still try getMe()
        // because the server might still accept the token (clock skew, etc.)

        // 3) Validate with server — this is the authoritative check
        try {
          apiClient.suppressAuthRedirect = true;
          const me = await authApi.getMe();
          apiClient.suppressAuthRedirect = false;

          authApi.updateRolesCookieFromUser(me);
          set({ user: me, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          apiClient.suppressAuthRedirect = false;

          const status = err?.response?.status;
          if (status === 401) {
            // Token truly expired / rejected by server — clear everything
            authApi.clearTokens();
            set({ user: null, isAuthenticated: false, isLoading: false });
          } else {
            // Network error, server down, etc.
            if (decoded && decoded.roles && decoded.roles.length > 0) {
              // Keep JWT-decoded user for offline resilience
              set({ isLoading: false });
            } else {
              // No valid decoded user and can't reach server → not authenticated
              authApi.clearTokens();
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          }
        }
      },

      login: async (email: string, password: string) => {
        const response = (await authApi.login({ email, password })) as AnyAuthResponse;

        set({
          user: mapUserFromResponse({
            response,
            emailFallback: email,
            displayNameFallback: email,
          }),
          isAuthenticated: true,
        });

        // Fetch full user profile (phone, birthYear, displayName etc.)
        try {
          const me = await authApi.getMe();
          authApi.updateRolesCookieFromUser(me);
          set({ user: me, isAuthenticated: true });
        } catch {
          // Ignore - basic user info is already set from login response
        }
      },

      signup: async (email: string, password: string, displayName: string, role: string) => {
        const response = (await authApi.signup({
          email,
          password,
          displayName,
          initialRole: role as any,
        })) as AnyAuthResponse;

        set({
          user: mapUserFromResponse({
            response,
            emailFallback: email,
            displayNameFallback: displayName || email,
          }),
          isAuthenticated: true,
        });

        // Fetch full user profile
        try {
          const me = await authApi.getMe();
          authApi.updateRolesCookieFromUser(me);
          set({ user: me, isAuthenticated: true });
        } catch {
          // Ignore - basic user info is already set from signup response
        }
      },

      externalLogin: async (params: ExternalLoginParams): Promise<ExternalLoginResult> => {
        const response = await authApi.externalLogin({
          provider: params.provider,
          token: params.token,
          code: params.code,
          redirectUri: params.redirectUri,
          displayName: params.displayName,
          initialRole: params.initialRole as any,
        });

        // If backend returned a pendingToken OR empty accessToken, this is a ROLE_REQUIRED response
        const isPendingRole = response.pendingToken || !response.accessToken;
        if (isPendingRole) {
          authApi.logout();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return { isNewUser: false, pendingToken: response.pendingToken || 'ROLE_REQUIRED' };
        }

        set({
          user: mapUserFromResponse({
            response,
            emailFallback: '',
            displayNameFallback: params.displayName || '',
          }),
          isAuthenticated: true,
        });

        // Fetch full user profile
        try {
          const me = await authApi.getMe();
          authApi.updateRolesCookieFromUser(me);
          set({ user: me, isAuthenticated: true });
        } catch {
          // Ignore - basic user info is already set
        }

        return { isNewUser: response.isNewUser };
      },

      refreshUser: async () => {
        try {
          const me = await authApi.getMe();
          authApi.updateRolesCookieFromUser(me);
          set({ user: me });
        } catch {
          // Ignore - user data stays as is
        }
      },

      logout: () => {
        authApi.logout();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state._hasHydrated = true;
          }
        };
      },
    }
  )
);
