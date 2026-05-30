"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarCheck, 
  DollarSign, 
  Activity,
  MoreHorizontal
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

// Mock Data for Recharts
const revenueData = [
  { name: "Seg", total: 1200 },
  { name: "Ter", total: 900 },
  { name: "Qua", total: 1600 },
  { name: "Qui", total: 1400 },
  { name: "Sex", total: 2100 },
  { name: "Sáb", total: 3200 },
  { name: "Dom", total: 2800 },
];

const recentBookings = [
  { id: 1, client: "Ana Silva", service: "Consultoria Premium", time: "Hoje, 14:00", status: "Confirmado", price: "R$ 150" },
  { id: 2, client: "Carlos Souza", service: "Sessão Básica", time: "Hoje, 16:30", status: "Pendente", price: "R$ 80" },
  { id: 3, client: "Beatriz M.", service: "Pacote Mensal", time: "Amanhã, 09:00", status: "Confirmado", price: "R$ 400" },
  { id: 4, client: "Fernando", service: "Revisão", time: "Amanhã, 11:15", status: "Cancelado", price: "R$ 50" },
];

// Animations
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function MetricCard({ title, value, icon: Icon, trend, isPositive }: any) {
  return (
    <motion.div variants={fadeIn} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl group">
      {/* Background glow effect on hover */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner shadow-white/5">
          <Icon size={20} />
        </div>
      </div>
      <div className="relative z-10 mt-4 flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={cn(
            "flex items-center text-xs font-medium px-2 py-1 rounded-md", 
            isPositive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
          )}>
            {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardOverview() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white">Overview</h1>
          <p className="text-zinc-400">Acompanhe suas métricas e agendamentos.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Receita Mensal" value="R$ 14.500" icon={DollarSign} trend="+12.5%" isPositive={true} />
        <MetricCard title="Agendamentos" value="342" icon={CalendarCheck} trend="+4.1%" isPositive={true} />
        <MetricCard title="Novos Clientes" value="89" icon={Users} trend="-2.0%" isPositive={false} />
        <MetricCard title="Taxa de Comparecimento" value="94%" icon={Activity} trend="+1.2%" isPositive={true} />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Chart */}
        <motion.div variants={fadeIn} className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:col-span-4 lg:col-span-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 mb-6 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-white">Faturamento Semanal</h2>
          </div>
          <div className="relative z-10 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: "#818cf8", stroke: "#312e81", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeIn} className="col-span-1 flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:col-span-3 lg:col-span-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 mb-6 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-white">Próximos Hoje</h2>
            <button className="text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="relative z-10 flex-1 space-y-4">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0 group/item hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-white">{booking.client}</p>
                  <p className="text-sm text-zinc-400">{booking.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-300">{booking.time}</p>
                  <span className={cn(
                    "mt-1.5 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                    booking.status === "Confirmado" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    booking.status === "Pendente" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
