import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SalesActivityChart({ theme, isDark, data, period, onPeriodChange }) {
  const periods = ["សប្តាហ៍", "ខែ", "ឆ្នាំ"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`rounded-xl border px-3 py-2 text-sm shadow-md ${theme.card}`}
        >
          <p className="font-bold">${Number(payload[0].value).toLocaleString()}</p>
          <p className={`text-xs ${theme.muted}`}>{label}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
          សកម្មភាពការលក់
        </h2>

        <div
          className={`flex items-center gap-1 rounded-xl border p-1 ${
            isDark
              ? "border-white/10 bg-white/5"
              : "border-zinc-200 bg-zinc-100"
          }`}
        >
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                period === p
                  ? "bg-red-500 text-white shadow-sm"
                  : `${theme.muted} hover:text-zinc-900 dark:hover:text-white`
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={
                isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
              }
              vertical={false}
            />

            <XAxis
              dataKey="day"
              tick={{
                fontSize: 11,
                fill: isDark ? "#71717a" : "#a1a1aa",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(v) => `${v / 1000}k`}
              tick={{
                fontSize: 11,
                fill: isDark ? "#71717a" : "#a1a1aa",
              }}
              axisLine={false}
              tickLine={false}
              domain={[0, 4000]}
              ticks={[0, 1000, 2000, 3000, 4000]}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.07)",
                strokeWidth: 1,
              }}
            />

            <Line
              type="monotone"
              dataKey="amount"
              stroke="#ef4444"
              strokeWidth={2.5}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


