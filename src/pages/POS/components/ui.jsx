import React from "react";
import { cn, usd, khr } from "./posData";

// ─── Badge ────────────────────────────────────────────────────────
export function Badge({ children, tone = "slate", size = "sm" }) {
  const tones = {
    slate:  "bg-slate-100  text-slate-600",
    green:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    yellow: "bg-amber-50   text-amber-700   ring-1 ring-amber-200",
    red:    "bg-red-50     text-red-600     ring-1 ring-red-200",
    blue:   "bg-blue-50    text-blue-700    ring-1 ring-blue-200",
    purple: "bg-purple-50  text-purple-700  ring-1 ring-purple-200",
  };
  const sizes = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1 text-xs",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-semibold", tones[tone], sizes[size])}>
      {children}
    </span>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────
export function SectionCard({ children, className = "" }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────
export function Divider({ className = "" }) {
  return <div className={cn("h-px bg-slate-100", className)} />;
}

// ─── PaymentRow ──────────────────────────────────────────────────
export function PaymentRow({ label, currency, received, applied, change }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <p className="mb-2 font-semibold text-slate-800">{label}</p>
      <div className="space-y-1.5 text-slate-600">
        <div className="flex justify-between">
          <span>ទទួល</span>
          <span className="font-medium text-slate-900">
            {currency === "KHR" ? khr(received) : usd(received)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>ដាក់ (USD)</span>
          <span className="font-medium text-slate-900">{usd(applied)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-1.5">
          <span>អាប់</span>
          <span className={cn("font-semibold", change > 0 ? "text-emerald-600" : "text-slate-900")}>
            {currency === "KHR" ? khr(change) : usd(change)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Kbd ─────────────────────────────────────────────────────────
export function Kbd({ children }) {
  return (
    <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
      {children}
    </kbd>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────
export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────
export function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}