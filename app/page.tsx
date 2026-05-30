"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users, BarChart3, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================================
// Animations
// ============================================================================
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
        "relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-card/80",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={24} />
      </div>
      <h3 className="mb-2 font-heading text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects (Aurora / Blur) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[40%] right-[0%] h-[40%] w-[40%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-24 sm:px-8 lg:px-12">
        {/* HERO SECTION */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={fadeIn} className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            SaaS de Agendamento Pro Max
          </motion.div>

          <motion.h1 variants={fadeIn} className="mb-8 font-heading text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
            A agenda inteligente <br />
            <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              para quem não tem tempo a perder.
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Automatize seus agendamentos, reduza ausências e escale seu negócio com um sistema pensado para alta performance.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="group flex items-center justify-center rounded-lg bg-primary px-8 py-4 font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center justify-center rounded-lg border border-border bg-card/50 backdrop-blur px-8 py-4 font-medium text-foreground transition-all duration-200 hover:bg-muted"
            >
              Acessar Painel
            </Link>
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
            description="Permita que seus clientes agendem horários de forma autônoma, sem trocas infinitas de mensagens."
            icon={Calendar}
            className="sm:col-span-2 lg:col-span-1 lg:row-span-2"
          />
          <BentoCard
            title="Lembretes Automáticos"
            description="Reduza faltas drasticamente com notificações via WhatsApp, Email e SMS antes de cada sessão."
            icon={Clock}
          />
          <BentoCard
            title="Mini-CRM Integrado"
            description="Acompanhe o histórico de cada cliente, anotações e frequência de retornos."
            icon={Users}
          />
          <BentoCard
            title="Pagamentos e Receitas"
            description="Cobre antecipadamente com Stripe e tenha previsibilidade de caixa no fim do mês."
            icon={BarChart3}
            className="sm:col-span-2"
          />
        </motion.div>
      </div>
    </main>
  );
}
