import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";

export default function SummaryCard({ theme, title, value, subtitle, icon, iconBg, accent, trend, trendType }) {
  const isUp      = trendType === "up";
  const isNeutral = trendType === "neutral";
  const badgeCls  = isUp
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : isNeutral
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "bg-red-500/10 text-red-500";
  return (
    <div className={`rounded-2xl border border-l-4 px-5 py-5 shadow-sm transition hover:shadow-md ${theme.card} ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${theme.muted}`}>{title}</p>
          <h3 className={`mt-2 text-2xl font-extrabold leading-none ${theme.pageTitle}`}>{value}</h3>
          {subtitle && <p className={`mt-1.5 truncate text-xs ${theme.muted}`}>{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeCls}`}>
          {isUp ? <FiArrowUpRight /> : <FiArrowDownRight />}
          {trend}
        </div>
      )}
    </div>
  );
}


