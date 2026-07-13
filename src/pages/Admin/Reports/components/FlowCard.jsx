import React from "react";
import { FiArrowRight } from "react-icons/fi";

export default function FlowCard({ theme, title, value, steps, icon, color }) {
  const palette = {
    emerald: { icon: "bg-emerald-500/10 text-emerald-500", border: "border-l-emerald-500" },
    blue:    { icon: "bg-blue-500/10 text-blue-500",       border: "border-l-blue-500"    },
    red:     { icon: "bg-red-500/10 text-red-500",         border: "border-l-red-500"     },
    purple:  { icon: "bg-purple-500/10 text-purple-500",   border: "border-l-purple-500"  },
  };
  const pal = palette[color] ?? palette.red;
  const Icon = icon;
  return (
    <div className={`rounded-2xl border border-l-4 p-5 shadow-sm ${theme.card} ${pal.border}`}>
      <div className="mb-3 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${pal.icon}`}>
          <Icon />
        </div>
        <span className={`text-2xl font-extrabold ${theme.pageTitle}`}>{value}</span>
      </div>
      <p className={`text-sm font-bold ${theme.pageTitle}`}>{title}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <span className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${pal.icon}`}>{step}</span>
            {i < steps.length - 1 && <FiArrowRight className={`text-xs shrink-0 ${theme.muted}`} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}


