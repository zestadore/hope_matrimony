import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from '@/lib/api';
import { storage } from '@/lib/storage';

const TOKEN_KEY = 'access_token';

export type AuthUser = {
  id: number;
  name: string;
  mobile_number: string;
  email: string | null;
  status: string;
  /** UI language stored on the account; null until the user picks one. */
  locale: string | null;
  roles: string[];
  permissions: string[];
};

export type RegisterPayload = {
  name: string;
  mobile_number: string;
  email?: string;
  password: string;
  password_confirmation: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (mobileNumber: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await storage.deleteItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  // Any 401 from the API means the bearer token expired or was revoked while
  // the app was open. Dropping the user here is all that's needed to get back
  // to login — the route guards in (tabs)/_layout and profile-editor/_layout
  // redirect as soon as `user` goes null.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });

    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      const token = await storage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      setAuthToken(token);
      try {
        const { data } = await api.get<{ user: AuthUser }>('/auth/me');
        setUser(data.user);
      } catch {
        // Stored token is expired/invalid. There's no mobile-friendly silent
        // refresh yet — the API's refresh token only ever leaves the server
        // as an httpOnly cookie, which React Native has no access to. Until
        // the backend grows a mobile-specific refresh path, an expired
        // access token just sends the user back to the login screen.
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      async login(mobileNumber, password) {
        const { data } = await api.post<{ access_token: string }>('/auth/login', {
          mobile_number: mobileNumber,
          password,
        });

        await storage.setItem(TOKEN_KEY, data.access_token);
        setAuthToken(data.access_token);

        const { data: me } = await api.get<{ user: AuthUser }>('/auth/me');
        setUser(me.user);
      },
      async register(payload) {
        const { data } = await api.post<{ access_token: string }>('/auth/register', payload);

        await storage.setItem(TOKEN_KEY, data.access_token);
        setAuthToken(data.access_token);

        const { data: me } = await api.get<{ user: AuthUser }>('/auth/me');
        setUser(me.user);
      },
      async logout() {
        try {
          await api.post('/auth/logout');
        } catch {
          // Best-effort — still clear local state even if the request fails.
        }
        await clearSession();
      },
    }),
    [user, isLoading, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
