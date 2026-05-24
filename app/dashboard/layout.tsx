"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/dashboard",                  icon: "🏠", label: "Visão Geral" },
  { href: "/dashboard/agenda",           icon: "📅", label: "Agenda" },
  { href: "/dashboard/servicos",         icon: "🛎️",  label: "Serviços" },
  { href: "/dashboard/disponibilidade",  icon: "⏰", label: "Disponibilidade" },
  { href: "/dashboard/clientes",         icon: "👥", label: "Clientes" },
  { href: "/dashboard/integracoes",      icon: "🔗", label: "Integrações" },
  { href: "/dashboard/pagamentos",       icon: "💳", label: "Pagamentos" },
  { href: "/dashboard/perfil",           icon: "👤", label: "Perfil" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-white font-bold">A</span>
        </div>
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    </div>
  );
  if (!user) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/agendar/${user.slug}`);
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm shadow-green-200">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg text-gray-900">AgendaAí</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Public link quick-copy */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button onClick={copyLink}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-left">
            <span className="text-sm">🔗</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-700">{copying ? "✓ Copiado!" : "Copiar meu link"}</p>
              <p className="text-xs text-green-600 truncate">/agendar/{user.slug}</p>
            </div>
          </button>
        </div>

        {/* User */}
        <div className="px-2 py-3 border-t border-gray-100">
          <Link href="/dashboard/perfil" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-700 font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.plan === "pro" ? "✨ Pro" : "Gratuito"}</p>
            </div>
          </Link>
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-0.5">
            <span className="text-base w-5 text-center">🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
