"use client";

import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, useEffect } from "react";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 hover:shadow-lg hover:shadow-green-100 hover:-translate-y-0.5 active:translate-y-0",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400",
    outline: "border border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-700 hover:bg-green-50 focus:ring-green-300",
  };
  const sizes = { sm: "text-xs px-3 py-1.5 gap-1.5", md: "text-sm px-4 py-2.5 gap-2", lg: "text-sm px-6 py-3 gap-2" };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
type BadgeColor = "green" | "red" | "yellow" | "blue" | "purple" | "gray" | "orange";
interface BadgeProps { color?: BadgeColor; children: ReactNode; className?: string; dot?: boolean; }

export function Badge({ color = "gray", children, className, dot }: BadgeProps) {
  const colors: Record<BadgeColor, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-100 text-orange-700",
  };
  const dotColors: Record<BadgeColor, string> = {
    green: "bg-green-500", red: "bg-red-500", yellow: "bg-yellow-500",
    blue: "bg-blue-500", purple: "bg-purple-500", gray: "bg-gray-400", orange: "bg-orange-500",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", colors[color], className)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[color])} />}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; helper?: string; prefix?: string; suffix?: string;
}
export function Input({ label, error, helper, prefix, suffix, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative flex">
        {prefix && <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-400">{prefix}</span>}
        <input
          id={inputId}
          className={cn(
            "flex-1 px-4 py-2.5 text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 transition-all",
            prefix ? "rounded-r-xl" : suffix ? "rounded-l-xl" : "rounded-xl",
            error && "border-red-300 focus:ring-red-400",
            className
          )}
          {...rest}
        />
        {suffix && <span className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-gray-200 bg-gray-50 text-sm text-gray-400">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string; helper?: string;
}
export function Textarea({ label, error, helper, className, id, ...rest }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={inputId}
        className={cn("w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 transition-all resize-none", error && "border-red-300", className)}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; helper?: string;
}
export function Select({ label, error, helper, className, id, children, ...rest }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        id={inputId}
        className={cn("w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 bg-white placeholder-gray-400 transition-all", className)}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string; disabled?: boolean; }
export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn("flex items-center gap-3 cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1", checked ? "bg-green-500" : "bg-gray-200")}
      >
        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
          {description && <p className="text-xs text-gray-400">{description}</p>}
        </div>
      )}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
export function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-8 w-8" };
  return (
    <svg className={cn("animate-spin text-current", sizes[size], className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: "sm" | "md" | "lg" | "xl"; }
export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);
  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-white rounded-2xl shadow-2xl w-full", sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">✕</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({ children, className, padding = true }: { children: ReactNode; className?: string; padding?: boolean }) {
  return <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm", padding && "p-6", className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Header
// ---------------------------------------------------------------------------
export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-500 mt-1 text-sm">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge for booking
// ---------------------------------------------------------------------------
export function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: BadgeColor }> = {
    confirmed: { label: "Confirmado", color: "green" },
    pending_payment: { label: "Aguard. pagto.", color: "yellow" },
    completed: { label: "Concluído", color: "blue" },
    no_show: { label: "Não compareceu", color: "orange" },
    cancelled_by_provider: { label: "Cancelado", color: "red" },
    cancelled_by_customer: { label: "Cancelado (cliente)", color: "red" },
  };
  const { label, color } = map[status] ?? { label: status, color: "gray" as BadgeColor };
  return <Badge color={color} dot>{label}</Badge>;
}
