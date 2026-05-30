"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users, BarChart3, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================================
// Animations
// ============================================================================
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// ============================================================================
// Components
// ============================================================================

function BentoCard({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeIn}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-500 hover:border-indigo-500/30 group",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner shadow-white/5 group-hover:scale-110 group-hover:text-indigo-300 group-hover:border-indigo-400/30 transition-all duration-500">
        <Icon size={24} />
      </div>
      <h3 className="relative z-10 mb-2 font-heading text-xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
        {title}
      </h3>
      <p className="relative z-10 text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
        {description}
      </p>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] selection:bg-indigo-500/30">
      {/* Background Effects (Aurora / Blur) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/15 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[40%] right-[0%] h-[40%] w-[40%] rounded-full bg-violet-600/15 blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-[20%] left-[20%] h-[40%] w-[40%] rounded-full bg-fuchsia-600/10 blur-[120px] mix-blend-screen" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navbar (simulated) */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-heading font-bold text-xl text-white tracking-tight">AgendaAí</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Entrar
          </Link>
          <Link href="/auth/register" className="hidden sm:inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10">
            Começar Grátis
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-24 sm:px-8 lg:px-12">
        {/* HERO SECTION */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={fadeIn} className="mb-8 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-md">
            <Sparkles className="mr-2 h-4 w-4 text-indigo-400" />
            SaaS de Agendamento Pro Max
            <span className="ml-3 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </motion.div>

          <motion.h1 variants={fadeIn} className="mb-8 font-heading text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-[5rem] leading-[1.1]">
            A agenda inteligente <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              para quem não tem tempo a perder.
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            Automatize seus agendamentos, reduza ausências e escale seu negócio com um sistema pensado para alta performance e design impecável.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
            <Link
              href="/auth/register"
              className="group relative flex items-center justify-center rounded-xl px-8 py-4 font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/auth/login"
              className="group flex items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-4 font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20"
            >
              Acessar Painel
            </Link>
          </motion.div>
          
          <motion.div variants={fadeIn} className="mt-12 flex items-center justify-center gap-4 text-sm text-zinc-500">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User avatar" />
                </div>
              ))}
            </div>
            <p>Junte-se a <span className="text-zinc-300 font-semibold">1,000+</span> profissionais no AgendaAí</p>
          </motion.div>
        </motion.div>

        {/* BENTO GRID FEATURES */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="mt-32 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <BentoCard
            title="Agendamento Inteligente"
            description="Permita que seus clientes agendem horários de forma autônoma 24/7, sem trocas infinitas de mensagens."
            icon={Calendar}
            className="sm:col-span-2 lg:col-span-1 lg:row-span-2 bg-gradient-to-b from-white/5 to-transparent"
          />
          <BentoCard
            title="Lembretes Automáticos"
            description="Reduza faltas drasticamente com notificações via Email e SMS antes de cada sessão."
            icon={Clock}
          />
          <BentoCard
            title="Mini-CRM Integrado"
            description="Acompanhe o histórico de cada cliente, anotações e frequência de retornos em um só lugar."
            icon={Users}
          />
          <BentoCard
            title="Pagamentos Simplificados"
            description="Cobre antecipadamente com integrações de pagamento e tenha previsibilidade de caixa no fim do mês."
            icon={BarChart3}
            className="sm:col-span-2 lg:col-span-2"
          />
        </motion.div>
      </div>
    </main>
  );
}
