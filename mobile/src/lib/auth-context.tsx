import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setAuthToken } from '@/lib/api';
import { storage } from '@/lib/storage';

const TOKEN_KEY = 'access_token';

export type AuthUser = {
  id: number;
  name: string;
  mobile_number: string;
  email: string | null;
  status: string;
  roles: string[];
  permissions: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (mobileNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        await storage.deleteItem(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
      async logout() {
        try {
          await api.post('/auth/logout');
        } catch {
          // Best-effort — still clear local state even if the request fails.
        }
        await storage.deleteItem(TOKEN_KEY);
        setAuthToken(null);
        setUser(null);
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
