"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string; name: string; email: string; slug: string;
  bio?: string | null; phone?: string | null; timezone: string;
  plan: string; booking_page_title?: string | null;
  minimum_notice: number; max_days_in_advance: number;
  stripe_account_id?: string | null; stripe_account_status?: string | null;
}

interface AuthCtx {
  user: AuthUser | null; loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, timezone?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) { const d = await res.json(); setUser(d.user); }
    else setUser(null);
  };

  useEffect(() => { refreshUser().finally(() => setLoading(false)); }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const d = await res.json();
    if (!res.ok) return { error: d.error };
    setUser(d.user); return {};
  };

  const register = async (name: string, email: string, password: string, timezone = "America/Sao_Paulo") => {
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, timezone }) });
    const d = await res.json();
    if (!res.ok) return { error: d.error };
    setUser(d.user); return {};
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); router.push("/");
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refreshUser }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
