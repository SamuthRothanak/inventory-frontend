import { FiArrowDown, FiArrowUp } from "react-icons/fi";

export default function SummaryCard({ card, theme }) {
  const Icon = card.icon;
  const isZero = card.value === "0" || card.value === 0;
  return (
    <div className={`rounded-2xl border border-l-4 p-5 shadow-sm transition hover:shadow-md ${theme.card} ${card.accent} ${isZero ? "opacity-45" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${card.iconBg}`}>
          <Icon />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${theme.muted}`}>{card.label}</p>
          <h3 className={`mt-1 text-2xl font-extrabold leading-none ${theme.pageTitle}`}>{card.value}</h3>
          <p className={`mt-1 text-xs ${theme.muted}`}>{card.sub}</p>
        </div>
      </div>
      {card.trend && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${
          card.up === true  ? "text-emerald-500" :
          card.up === false ? "text-red-400" :
          theme.muted
        }`}>
          {card.up === true  && <FiArrowUp className="shrink-0" />}
          {card.up === false && <FiArrowDown className="shrink-0" />}
          {card.trend}
        </div>
      )}
    </div>
  );
}


