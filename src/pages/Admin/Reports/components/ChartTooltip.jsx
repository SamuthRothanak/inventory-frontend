import { fmtUsd } from "../utils/reportFormat";

export default function ChartTooltip({ active, payload, label, theme, labelFormatter }) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter ? labelFormatter(label, payload[0]?.payload) : label;

  return (
    <div className={`rounded-xl border px-4 py-3 text-xs shadow-xl ${theme.card}`}>
      <p className="mb-2 font-bold text-red-500 uppercase tracking-wide">{displayLabel}</p>
      {payload.map((entry) => {
        const isReturnTotal = entry.dataKey === "returns";
        const salesReturns = Number(entry.payload?.sales_returns ?? 0);
        const purchaseReturns = Number(entry.payload?.purchase_returns ?? 0);
        const showReturnBreakdown = isReturnTotal && (salesReturns > 0 || purchaseReturns > 0);

        return (
          <div key={entry.dataKey}>
            <div className="flex items-center gap-3 py-0.5">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className={`font-medium ${theme.muted}`}>{entry.name}</span>
              <span className="ml-auto font-bold">{fmtUsd(entry.value)}</span>
            </div>
            {showReturnBreakdown && (
              <div className={`ml-5 mt-1 space-y-1 border-l pl-3 ${theme.border}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${theme.muted}`}>ត្រឡប់ពីការលក់</span>
                  <span className="ml-auto font-semibold">{fmtUsd(salesReturns)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${theme.muted}`}>ត្រឡប់ទៅអ្នកផ្គត់ផ្គង់</span>
                  <span className="ml-auto font-semibold">{fmtUsd(purchaseReturns)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


