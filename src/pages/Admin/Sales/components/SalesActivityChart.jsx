import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  buildMoneyChartScale,
  fmtCompactUsd,
  fmtUsd,
} from "../../Reports/utils/reportFormat";

export default function SalesActivityChart({ theme, isDark, data, period, onPeriodChange }) {
  const periods = ["សប្ដាហ៍", "ខែ", "ឆ្នាំ"];
  const chartScale = buildMoneyChartScale(
    data.map((item) => ({ sales: item.amount }))
  );
  const periodDetail = {
    "សប្ដាហ៍": "ចាប់ពីថ្ងៃចន្ទ ដល់ថ្ងៃអាទិត្យ",
    "ខែ": "បែងចែកជា ៤ សប្ដាហ៍ក្នុងខែ",
    "ឆ្នាំ": "បែងចែកតាមខែ មករា ដល់ធ្នូ",
  }[period];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload;

    return (
      <div className={`rounded-xl border px-4 py-3 text-sm shadow-xl ${theme.card}`}>
        <p className="font-bold text-red-500">{label}</p>
        {point?.range && (
          <p className={`mt-0.5 text-xs ${theme.muted}`}>{point.range}</p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className={`text-xs font-medium ${theme.muted}`}>ការលក់</span>
          <span className="ml-auto font-bold">{fmtUsd(payload[0].value)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
            សកម្មភាពការលក់
          </h2>
          <p className={`mt-1 text-xs ${theme.muted}`}>{periodDetail}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center gap-1 rounded-xl border p-1 ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-zinc-200 bg-zinc-100"
            }`}
          >
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onPeriodChange(item)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  period === item
                    ? "bg-red-500 text-white shadow-sm"
                    : `${theme.muted} hover:text-zinc-900 dark:hover:text-white`
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <span className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${theme.badge}`}>
            អ័ក្សដល់ {fmtCompactUsd(chartScale.max)}
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 24, left: -4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesActivityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={isDark ? 0.25 : 0.16} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={fmtCompactUsd}
              tick={{ fontSize: 11, fill: isDark ? "#71717a" : "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              domain={[0, chartScale.max]}
              ticks={chartScale.ticks}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
                strokeWidth: 1,
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="ការលក់"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#salesActivityGradient)"
              dot={{
                r: 3,
                fill: isDark ? "#18181b" : "#fff",
                stroke: "#ef4444",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#ef4444",
                stroke: isDark ? "#18181b" : "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
