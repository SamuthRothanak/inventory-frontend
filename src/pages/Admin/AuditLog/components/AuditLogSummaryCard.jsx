import React from "react";

export default function AuditLogSummaryCard({ title, value, caption, icon, tone = "red", isDark = false }) {
  const tones = {
    red: "bg-red-500/10 text-red-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    purple: "bg-purple-500/10 text-purple-500",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${isDark ? "border-white/10 bg-[#18181b]" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-center gap-4">
        <div className={`summary-icon-3d flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${tones[tone] || tones.red}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`truncate text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{title}</p>
          <p className="mt-1 text-4xl font-extrabold leading-none">{value}</p>
          {caption && <p className={`mt-2 truncate text-xs ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{caption}</p>}
        </div>
      </div>
    </div>
  );
}
