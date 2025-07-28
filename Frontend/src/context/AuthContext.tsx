import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextData {
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthToken: () => string | null;
}

const AUTH_TOKEN_LOCALSTORAGE_KEY = 'auth_token';

const AuthContext = createContext<AuthContextData>({
  isAuthenticated: () => false,
  login: async () => false,
  logout: async () => {},
  getAuthToken: () => null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = () => localStorage.getItem(AUTH_TOKEN_LOCALSTORAGE_KEY) !== null;

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/v1/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",                 // if you're using cookies
        body: JSON.stringify({ email, password }),
      });

      if (! res.ok) {
        return false;
      } else {
        const body = await res.json();
        // on success, store token / flags

        if (! body.token) {
          return false;
        } else {
          localStorage.setItem(AUTH_TOKEN_LOCALSTORAGE_KEY, body.token);
        }
      }
      
      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_LOCALSTORAGE_KEY);
  };

  const getAuthToken = (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_LOCALSTORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, getAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
