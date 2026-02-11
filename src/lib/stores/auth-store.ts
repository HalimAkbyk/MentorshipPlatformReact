import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../../lib/api/auth';
import type { User } from '../../lib/types/models';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, role: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
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