import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authService, type AuthUser, type LoginResponse } from "../services/auth.service";
import { setToken, getToken } from "../services/api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  patientLogin: (phone: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  role: "admin" | "staff" | "patient" | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      authService.getMe()
        .then(setUser)
        .catch(() => setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const fullUser = await authService.getMe();
    setUser(fullUser);
  }, []);

  const patientLogin = useCallback(async (phone: string) => {
    const res = await authService.patientLogin(phone);
    const fullUser = await authService.getMe();
    setUser(fullUser);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, patientLogin, logout,
      isAuthenticated: !!user,
      role: user?.role || null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
