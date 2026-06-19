import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { loginUser, registerUser, fetchMe } from "../api/auth";

const TOKEN_KEY = "discretastore-auth-token";
const USER_KEY = "discretastore-auth-user";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch { return null; }
}

function saveToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveUser(user: User | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);
  const [token, setToken] = useState<string | null>(loadToken);

  // Sincronizar token con localStorage para que api/client.ts lo lea
  useEffect(() => { saveToken(token); }, [token]);
  useEffect(() => { saveUser(user); }, [user]);

  // Verificar sesión al montar si hay token
  useEffect(() => {
    if (token && !user) {
      fetchMe()
        .then((profile) => {
          setUser({ id: profile.id, name: profile.name, email: profile.email, role: profile.role });
        })
        .catch(() => {
          // Token inválido/expirado
          setToken(null);
          setUser(null);
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);
      setToken(response.token);
      const role = response.user.role;
      setUser({ id: response.user.id, name: response.user.name, email: response.user.email, role });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      return { success: false, error: msg };
    }
  }, []);

  const loginAsAdmin = useCallback(async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);
      if (response.user.role !== 'admin') {
        return { success: false, error: "No tienes permisos de administrador" };
      }
      setToken(response.token);
      setUser({ id: response.user.id, name: response.user.name, email: response.user.email, role: response.user.role });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await registerUser(name, email, password);
      setToken(response.token);
      setUser({ id: response.user.id, name: response.user.name, email: response.user.email, role: 'user' });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse";
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, register, logout, loginAsAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
