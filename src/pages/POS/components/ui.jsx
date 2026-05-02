import React from "react";
import { cn, usd, khr } from "./posData";

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return <span className={cn("inline-flex rounded-full px-2 py-1 text-[11px] font-medium", tones[tone])}>{children}</span>;
}

export function SectionCard({ children, className = "" }) {
  return <div className={cn("rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function PaymentRow({ label, currency, received, applied, change }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3 text-sm">
      <div className="font-medium text-slate-900">{label}</div>
      <div className="mt-2 space-y-1 text-slate-600">
        <div>Amount received: {currency === "USD" ? usd(received) : khr(received)}</div>
        <div>Amount applied to invoice: {usd(applied)}</div>
        <div>Change: {currency === "USD" ? usd(change) : khr(change)}</div>
      </div>
    </div>
  );
}