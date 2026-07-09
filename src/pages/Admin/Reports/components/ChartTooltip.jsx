import { fmtUsd } from "../utils/reportFormat";

export default function ChartTooltip({ active, payload, label, theme, labelFormatter }) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label, payload[0]?.payload) : label;

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs shadow-xl ${theme.card}`}>
      <p className="mb-2 font-bold text-red-500 uppercase tracking-wide">{displayLabel}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-3 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className={`font-medium ${theme.muted}`}>{entry.name}</span>
          <span className="ml-auto font-bold">{fmtUsd(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}


