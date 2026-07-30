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
    <div className={`min-w-0 rounded-2xl border border-l-4 px-3 py-4 shadow-sm transition hover:shadow-md sm:px-4 sm:py-5 xl:px-5 ${theme.card} ${accent}`}>
      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-semibold uppercase leading-4 tracking-wide sm:text-xs ${theme.muted}`}>{title}</p>
          <h3
            className={`mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-base font-extrabold leading-none tabular-nums min-[380px]:text-lg sm:text-xl xl:text-2xl ${theme.pageTitle}`}
            title={String(value)}
          >
            {value}
          </h3>
          {subtitle && <p className={`mt-1.5 truncate text-xs ${theme.muted}`}>{subtitle}</p>}
        </div>
        <div className={`summary-icon-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`mt-3 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold sm:px-2.5 sm:text-xs ${badgeCls}`}>
          {isUp ? <FiArrowUpRight /> : <FiArrowDownRight />}
          {trend}
        </div>
      )}
    </div>
  );
}
