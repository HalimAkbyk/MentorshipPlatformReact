import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../../lib/api/auth';
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
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: async () => {
        const decoded = authApi.getCurrentUser();

        if (!decoded) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // If the stored JWT has no roles, it's invalid (e.g. from a previous
        // social login that never completed role selection). Clear it.
        if (!decoded.roles || decoded.roles.length === 0) {
          authApi.logout();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

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

        try {
          const me = await authApi.getMe();
          authApi.updateRolesCookieFromUser(me);
          set({ user: me, isAuthenticated: true, isLoading: false });
        } catch {
          authApi.logout();
          set({ user: null, isAuthenticated: false, isLoading: false });
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

        // If backend returned a pendingToken, this is a ROLE_REQUIRED response
        // — clear any stale auth state and pass the token back to the caller
        if (response.pendingToken) {
          authApi.logout();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return { isNewUser: false, pendingToken: response.pendingToken };
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
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);