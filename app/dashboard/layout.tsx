"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  BarChart3, 
  LayoutDashboard,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Minha Agenda", href: "/dashboard/agenda", icon: Calendar },
  { name: "Clientes", href: "/dashboard/clientes", icon: Users },
  { name: "Financeiro", href: "/dashboard/pagamentos", icon: CreditCard },
  { name: "Integrações", href: "/dashboard/integracoes", icon: BarChart3 },
  { name: "Configurações", href: "/dashboard/perfil", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] opacity-50" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-col border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl lg:flex relative z-10">
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
              AgendaAí
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Menu Principal
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "text-white" 
                    : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/15 to-violet-500/5 border border-indigo-500/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Hover effect for inactive items */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                
                <item.icon size={18} className={cn("relative z-10 transition-colors", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400 group">
            <LogOut size={18} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-full lg:w-[calc(100%-18rem)] relative z-10">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-zinc-950/50 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-white/5"
            >
              <Menu size={24} />
            </button>
            <div className="ml-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="font-heading font-semibold text-zinc-100">
                AgendaAí
              </span>
            </div>
          </div>
          
          {/* Topbar Right */}
          <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
            <button className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-white/5 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 border-2 border-zinc-950" />
            </button>

            {/* Agendamento Rápido */}
            <Link
              href="/dashboard/agenda"
              className="hidden sm:flex items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all duration-200"
            >
              + Novo Agendamento
            </Link>

            {/* Perfil */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 p-[2px] cursor-pointer hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                <span className="text-indigo-400 font-bold text-xs">GB</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 left-0 w-3/4 max-w-xs border-r border-white/10 bg-zinc-950 p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="font-heading text-lg font-semibold text-zinc-100">
                      AgendaAí
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsMobileOpen(false)} 
                    className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <nav className="flex flex-col gap-2">
                  <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Menu
                  </div>
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                        )}
                      >
                        <item.icon size={20} className={isActive ? "text-indigo-400" : "text-zinc-500"} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5">
                  <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400">
                    <LogOut size={20} />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
