import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiBox,
  FiDollarSign,
  FiPackage,
  FiRotateCcw,
  FiSearch,
  FiShoppingCart,
  FiTrendingDown,
  FiTruck,
} from "react-icons/fi";
import ChartTooltip from "./components/ChartTooltip";
import InsightRow from "./components/InsightRow";
import SummaryCard from "./components/SummaryCard";
import TableLoading from "../../../components/TableLoading";
import { fmtUsd } from "./utils/reportFormat";
import { getReportSummaryApi } from "../../../services/report.service";

const METHOD_LABEL = { cash: "សាច់ប្រាក់", bank_transfer: "ផ្ទេរប្រាក់", qr: "QR Code", card: "កាត", other: "ផ្សេងទៀត" };

const toLocalDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMondayOfWeek = (date) => {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
};

export default function Report() {
  const outlet    = useOutletContext();
  const isDark    = outlet?.isDark ?? false;
  const today     = toLocalDateValue(new Date());
  const monthStart = today.slice(0, 8) + "01";

  const [dateFrom,    setDateFrom]    = useState(monthStart);
  const [dateTo,      setDateTo]      = useState(today);
  const [chartPeriod, setChartPeriod] = useState("ខែ");
  const [search,      setSearch]      = useState("");

  const applyPeriod = (period) => {
    const now = new Date();
    const t = toLocalDateValue(now);
    const y = now.getFullYear();
    setChartPeriod(period);
    setDateTo(t);
    if (period === "ថ្ងៃនេះ")  setDateFrom(t);
    if (period === "សប្ដាហ៍") setDateFrom(toLocalDateValue(getMondayOfWeek(now)));
    if (period === "ខែ")     setDateFrom(t.slice(0, 8) + "01");
    if (period === "ឆ្នាំ")   setDateFrom(`${y}-01-01`);
  };

  const PRESETS = ["ថ្ងៃនេះ", "សប្ដាហ៍", "ខែ", "ឆ្នាំ"];

  const dateRangeError = !dateFrom || !dateTo
    ? "សូមជ្រើសរើសថ្ងៃចាប់ផ្ដើម និងថ្ងៃបញ្ចប់។"
    : dateFrom > dateTo
      ? "ថ្ងៃចាប់ផ្ដើមមិនអាចនៅក្រោយថ្ងៃបញ្ចប់បានទេ។"
      : dateFrom > today || dateTo > today
        ? "មិនអាចជ្រើសរើសកាលបរិច្ឆេទនាពេលអនាគតបានទេ។"
        : "";

  const { data: raw, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["report-summary", dateFrom, dateTo],
    queryFn:  () => getReportSummaryApi({ date_from: dateFrom, date_to: dateTo }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: !dateRangeError,
  });

  const d = raw?.data ?? null;
  const stats         = d?.stats          ?? {};
  const chartData     = d?.chart          ?? [];
  const topProducts   = d?.top_products   ?? [];
  const lowStock      = d?.low_stock      ?? [];
  const recentActs    = d?.recent_activities ?? [];
  const payBreakdown  = d?.payment_breakdown ?? [];
  const insights      = d?.insights       ?? {};
  const queryErrorMessage = error?.response?.data?.message
    || error?.message
    || "មិនអាចទាញទិន្នន័យរបាយការណ៍បានទេ។";
  const suppressReport = Boolean(dateRangeError) || (isError && !d) || isLoading;

  const theme = {
    pageTitle: isDark ? "text-white"                                         : "text-zinc-900",
    card:      isDark ? "border-white/10 bg-zinc-900 text-white"             : "border-zinc-200 bg-white text-zinc-900",
    muted:     isDark ? "text-zinc-400"                                      : "text-zinc-500",
    input:     isDark ? "border-white/10 bg-[#1b1b1f] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",
    select:    isDark ? "border-white/10 bg-[#1b1b1f] text-white focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",
    tableWrap: isDark ? "border-white/10 bg-zinc-900"                       : "border-zinc-200 bg-white",
    row:       isDark ? "border-white/10 text-zinc-200 hover:bg-white/[0.04]": "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    badge:     isDark ? "border-white/10 bg-white/5 text-zinc-200"          : "border-zinc-200 bg-zinc-100 text-zinc-700",
    softCard:  isDark ? "border-white/10 bg-white/[0.04]"                   : "border-zinc-200 bg-zinc-50",
    section:   isDark ? "border-white/10 bg-[#18181b]"                      : "border-zinc-200 bg-white",
    gridLine:  isDark ? "rgba(255,255,255,0.06)"                            : "rgba(0,0,0,0.06)",
    axisColor: isDark ? "#71717a"                                           : "#a1a1aa",
  };

  const filteredProducts = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return topProducts.filter((p) =>
      !kw || p.name.toLowerCase().includes(kw) || p.unit.toLowerCase().includes(kw)
    );
  }, [search, topProducts]);

  const totalSales     = stats.total_sales_usd     ?? 0;
  const totalPurchases = stats.total_purchases_usd ?? 0;
  const totalReturns   = stats.sales_returns_usd   ?? 0;
  const salesByType    = d?.sales_by_type          ?? {};

  const SUMMARY_CARDS = [
    {
      title:    "ការលក់សរុប",
      value:    fmtUsd(stats.total_sales_usd),
      subtitle: `${stats.total_sales_count ?? 0} ប្រតិបត្តិការ`,
      icon:     <FiShoppingCart />,
      iconBg:   "bg-emerald-500/10 text-emerald-500",
      accent:   "border-l-emerald-500",
      trend:    null,
      trendType: null,
    },
    {
      title:    "ការទិញសរុប",
      value:    fmtUsd(stats.total_purchases_usd),
      subtitle: `${stats.total_purchases_count ?? 0} បញ្ជាទិញ`,
      icon:     <FiTruck />,
      iconBg:   "bg-blue-500/10 text-blue-500",
      accent:   "border-l-blue-500",
      trend:    null,
      trendType: null,
    },
    {
      title:    "ការត្រឡប់ការលក់",
      value:    fmtUsd(stats.sales_returns_usd),
      subtitle: `${stats.sales_returns_count ?? 0} ប្រតិបត្តិការត្រឡប់`,
      icon:     <FiTrendingDown />,
      iconBg:   "bg-amber-500/10 text-amber-500",
      accent:   "border-l-amber-500",
      trend:    null,
      trendType: "down",
    },
    {
      title:    "ការត្រឡប់ការទិញ",
      value:    fmtUsd(stats.purchase_returns_usd),
      subtitle: `${stats.purchase_returns_count ?? 0} ការទាមទារអ្នកផ្គត់ផ្គង់`,
      icon:     <FiPackage />,
      iconBg:   "bg-pink-500/10 text-pink-500",
      accent:   "border-l-pink-500",
      trend:    null,
      trendType: "down",
    },
    {
      title:    "ទំនិញស្ទើរអស់",
      value:    String(stats.low_stock_count ?? 0),
      subtitle: "ក្រោមកម្រិតអប្បបរមា",
      icon:     <FiAlertTriangle />,
      iconBg:   "bg-orange-500/10 text-orange-500",
      accent:   "border-l-orange-500",
      trend:    (stats.low_stock_count ?? 0) > 0 ? "ត្រូវការបន្ថែមស្តុក" : null,
      trendType: "down",
    },
    {
      title:    "ប្រាក់ជំពាក់",
      value:    fmtUsd(stats.outstanding_balance_usd),
      subtitle: `${stats.outstanding_balance_count ?? 0} វិក្កយបត្រ`,
      icon:     <FiAlertCircle />,
      iconBg:   "bg-red-500/10 text-red-500",
      accent:   "border-l-red-500",
      trend:    (stats.outstanding_balance_count ?? 0) > 0 ? "ត្រូវទូទាត់" : null,
      trendType: "down",
    },
  ];

  return (
    <section className="space-y-6">

      {/* â"€â"€ Filters + Actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${theme.card}`}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

          {/* Left: filters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:items-center xl:gap-3">
            {/* Date From */}
            <div className="relative xl:w-44">
              <input
                type="date"
                value={dateFrom}
                max={today}
                onChange={(e) => { setDateFrom(e.target.value); setChartPeriod("ផ្ទាល់ខ្លួន"); }}
                aria-invalid={Boolean(dateRangeError)}
                className={`h-10 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 ${theme.input} ${dateRangeError ? "border-red-500 ring-2 ring-red-500/10" : ""}`}
              />
            </div>

            {/* Date To */}
            <div className="relative xl:w-44">
              <input
                type="date"
                value={dateTo}
                max={today}
                onChange={(e) => { setDateTo(e.target.value); setChartPeriod("ផ្ទាល់ខ្លួន"); }}
                aria-invalid={Boolean(dateRangeError)}
                className={`h-10 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 ${theme.input} ${dateRangeError ? "border-red-500 ring-2 ring-red-500/10" : ""}`}
              />
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={() => { setSearch(""); setDateFrom(monthStart); setDateTo(today); setChartPeriod("ខែ"); }}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition hover:opacity-80 ${theme.badge}`}
            >
              <FiRotateCcw className="text-sm" />
              កំណត់ឡើងវិញ
            </button>
          </div>

          {/* Right: quick presets */}
          <div className="flex items-center gap-1.5">
            {PRESETS.map((p) => {
              const active = chartPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyPeriod(p)}
                  className={`h-9 rounded-xl border px-3.5 text-xs font-semibold transition ${
                    active
                      ? "border-red-500 bg-red-500 text-white shadow-sm"
                      : `${theme.badge} hover:border-red-400 hover:text-red-500`
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

        </div>
        {isFetching && !isLoading && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-red-500/10" aria-hidden="true">
            <div className="h-full w-full animate-pulse bg-red-500" />
          </div>
        )}
      </div>

      {dateRangeError && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${isDark ? "border-red-500/30 bg-red-500/10" : "border-red-200 bg-red-50"}`} role="alert">
          <FiAlertCircle className="mt-0.5 shrink-0 text-xl text-red-500" />
          <div>
            <p className={`text-sm font-bold ${theme.pageTitle}`}>កាលបរិច្ឆេទមិនត្រឹមត្រូវ</p>
            <p className={`mt-1 text-xs ${theme.muted}`}>{dateRangeError}</p>
          </div>
        </div>
      )}

      {isError && (
        <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-red-500/30 bg-red-500/10" : "border-red-200 bg-red-50"}`} role="alert">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-xl text-red-500" />
            <div>
              <p className={`text-sm font-bold ${theme.pageTitle}`}>ទាញទិន្នន័យមិនបាន</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>{queryErrorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRotateCcw className={isFetching ? "animate-spin" : ""} />
            សាកល្បងម្ដងទៀត
          </button>
        </div>
      )}

      {isLoading && (
        <div className={`flex min-h-[240px] flex-col items-center justify-center rounded-2xl border shadow-sm ${theme.card}`} role="status">
          <FiRotateCcw className="animate-spin text-4xl text-red-500" />
          <p className={`mt-4 text-sm font-bold ${theme.pageTitle}`}>កំពុងរៀបចំរបាយការណ៍...</p>
          <p className={`mt-1 text-xs ${theme.muted}`}>សូមរង់ចាំបន្តិច</p>
        </div>
      )}

      {/* â"€â"€ Summary Cards â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className={suppressReport ? "hidden" : ""}>
        <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>សង្ខេបរយៈពេល</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.title} theme={theme} {...card} />
          ))}
        </div>
      </div>

      {/* ── Chart (full width) ── */}
      <div className={`${suppressReport ? "hidden" : ""} rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>សមត្ថភាពអាជីវកម្ម</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>លក់ធៀបនឹងទិញ និងផលប៉ះពាល់ត្រឡប់</p>
            </div>
            {chartPeriod === "ផ្ទាល់ខ្លួន" && (
              <span className={`self-start rounded-xl border px-3 py-1.5 text-xs font-semibold ${theme.badge}`}>ផ្ទាល់ខ្លួន</span>
            )}
          </div>

          {/* Mini metrics */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "លក់",     value: fmtUsd(totalSales),     cls: "text-emerald-500" },
              { label: "ទិញ",    value: fmtUsd(totalPurchases), cls: "text-blue-500"    },
              { label: "ត្រឡប់", value: fmtUsd(totalReturns),   cls: "text-amber-500"   },
            ].map((m) => (
              <div key={m.label} className={`rounded-xl border p-3 ${theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>{m.label}</p>
                <p className={`mt-1.5 text-base font-bold ${m.cls}`}>{m.value}</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 32, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSales"     x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22c55e" stopOpacity={isDark ? 0.25 : 0.15} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity={isDark ? 0.25 : 0.15} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridLine} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: theme.axisColor }} axisLine={false} tickLine={false} interval={chartData.length > 14 ? Math.ceil(chartData.length / 8) - 1 : 0} />
              <YAxis tick={{ fontSize: 11, fill: theme.axisColor }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
              <Tooltip content={<ChartTooltip theme={theme} />}
                cursor={{ stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: theme.axisColor }} iconType="circle" iconSize={8} />
              <Area dataKey="sales"     name="លក់"     type="monotone" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradSales)"     dot={{ r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#22c55e", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              <Area dataKey="purchases" name="ទិញ" type="monotone" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradPurchases)" dot={{ r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#3b82f6", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              <Line dataKey="returns"   name="ត្រឡប់"   type="monotone" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3"
                dot={{ r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#f59e0b", strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      {/* ── Products table (full width) ── */}
      <div className={`${suppressReport ? "hidden" : ""} overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
        <div className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <div>
            <h2 className={`text-base font-bold ${theme.pageTitle}`}>ទំនិញលក់ដាច់</h2>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>{filteredProducts.length} មុខ · រយៈពេលនេះ</p>
          </div>
          <div className="relative w-full sm:w-72">
            <FiSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base ${theme.muted}`} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកទំនិញក្នុងបញ្ជី..."
              className={`h-10 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">ទំនិញ</th>
                <th className="px-5 py-3 text-left text-sm font-semibold">ខ្នាតទំនិញ</th>
                <th className="px-5 py-3 text-left text-sm font-semibold">ចំនួនលក់</th>
                <th className="px-5 py-3 text-left text-sm font-semibold">ចំណូល</th>
                <th className="px-5 py-3 text-left text-sm font-semibold">ស្តុក</th>
                <th className="px-5 py-3 text-center text-sm font-semibold">ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoading
                  theme={theme}
                  colSpan={6}
                  text="រង់ចាំបន្តិច..."
                />
              ) : filteredProducts.length === 0 ? (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className={`text-sm font-semibold ${theme.pageTitle}`}>រកមិនឃើញ</p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>សាកល្បងពាក្យស្វែងរកផ្សេង</p>
                  </td>
                </tr>
              ) : filteredProducts.map((item, i) => (
                <tr key={item.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><FiBox /></div>
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className={`text-xs ${theme.muted}`}>លំដាប់ #{i + 1}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm">{item.unit}</td>
                  <td className="px-5 py-3.5 text-sm font-bold">{item.soldQty}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-emerald-500">{fmtUsd(item.revenueUsd)}</td>
                  <td className="px-5 py-3.5 text-sm">{item.stock.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.status === "In Stock"  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                      item.status === "Low Stock" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                                    "bg-red-500/10 text-red-500"
                    }`}>{item.status === "In Stock" ? "មានស្តុក" : item.status === "Low Stock" ? "ស្ទើរអស់" : "អស់"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Insights + Activities (two columns) ── */}
      <div className={`${suppressReport ? "hidden" : ""} flex flex-col gap-6 xl:flex-row xl:items-stretch`}>

        {/* Insights */}
        <div className={`flex w-full shrink-0 flex-col rounded-2xl border p-5 shadow-sm xl:w-90 ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-base font-bold ${theme.pageTitle}`}>ការយល់ដឹងរបាយការណ៍</h2>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>ការវាស់វែងសំខាន់ក្នុងរយៈពេលនេះ</p>
          </div>
          {(() => {
            const DAY_KH = { Sun: "អាទិត្យ", Mon: "ច័ន្ទ", Tue: "អង្គារ", Wed: "ពុធ", Thu: "ព្រ.ហ", Fri: "សុក្រ", Sat: "សៅរ៏", Sunday: "អាទិត្យ", Monday: "ច័ន្ទ", Tuesday: "អង្គារ", Wednesday: "ពុធ", Thursday: "ព្រ.ហ", Friday: "សុក្រ", Saturday: "សៅរ៏" };
            const dayKh = (d) => DAY_KH[d] ?? d;
            return (
          <div className="space-y-4">
            {/* ── ថ្ងៃល្អបំផុត ── */}
            <div>
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>ថ្ងៃល្អបំផុត</p>
              <div className="space-y-2">
                <InsightRow theme={theme} label="ថ្ងៃលក់ល្អបំផុត"     value={insights.best_sales_day    ? dayKh(insights.best_sales_day.day)    : "—"} badge={insights.best_sales_day    ? fmtUsd(insights.best_sales_day.amount)    : "—"} badgeColor="emerald" />
                <InsightRow theme={theme} label="ថ្ងៃទិញខ្ពស់បំផុត"   value={insights.best_purchase_day ? dayKh(insights.best_purchase_day.day) : "—"} badge={insights.best_purchase_day ? fmtUsd(insights.best_purchase_day.amount) : "—"} badgeColor="blue"    />
                <InsightRow theme={theme} label="ថ្ងៃត្រឡប់ច្រើនបំផុត" value={insights.most_return_day   ? dayKh(insights.most_return_day.day)   : "—"} badge={insights.most_return_day   ? fmtUsd(insights.most_return_day.amount)   : "—"} badgeColor="amber"   />
              </div>
            </div>

            <div className={`border-t ${isDark ? "border-white/10" : "border-zinc-200"}`} />

            {/* ── ចំណែកការលក់ ── */}
            <div>
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>ចំណែកការលក់</p>
              <div className="space-y-2">
                <InsightRow theme={theme} label="លក់រាយ" value={`${salesByType.retail?.count ?? 0} ប្រតិបត្តិការ`}    badge={fmtUsd(salesByType.retail?.totalUsd)}    badgeColor="emerald" />
                <InsightRow theme={theme} label="លក់ដុំ"  value={`${salesByType.wholesale?.count ?? 0} ប្រតិបត្តិការ`} badge={fmtUsd(salesByType.wholesale?.totalUsd)} badgeColor="blue"    />
              </div>
            </div>

            <div className={`border-t ${isDark ? "border-white/10" : "border-zinc-200"}`} />

            {/* ── ការព្រមាន ── */}
            <div>
              <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>ការព្រមាន</p>
              <div className="space-y-2">
                <InsightRow theme={theme} label="ប្រាក់ជំពាក់"              value={`${stats.outstanding_balance_count ?? 0} វិក្កយបត្រ`} badge={fmtUsd(stats.outstanding_balance_usd)} badgeColor="red"    />
                <InsightRow theme={theme} label="ការទាមទារអ្នកផ្គត់ផ្គង់" value={`${stats.pending_claims_count ?? 0} ការទាមទារ`}    badge="ពិនិត្យ"                               badgeColor="red"    />
                <InsightRow theme={theme} label="ស្តុកស្ទើរអស់"            value={`${stats.low_stock_count ?? 0} មុខ`}              badge="បន្ទាន់"                               badgeColor="orange" />
                <InsightRow theme={theme} label="ស្តុកបច្ចុប្បន្ន"          value={`${(stats.stock_on_hand ?? 0).toLocaleString()} ខ្នាតទំនិញ`} badgeColor="zinc"                />
              </div>
            </div>
          </div>
            );
          })()}

          <div className="flex-1" />
        </div>

        {/* Right column: Activities + Payment stacked */}
        <div className="flex flex-1 flex-col gap-6">

        {/* Activities card */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>សកម្មភាពថ្មីៗ</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>សកម្មភាពសំខាន់ៗចុងក្រោយ</p>
            </div>
            <span className={`text-xs font-semibold ${theme.muted}`}>ទិន្នន័យថ្មីៗ</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {isLoading && (
              <div className={`col-span-2 flex min-h-[180px] flex-col items-center justify-center rounded-xl border ${theme.softCard}`}>
                <FiRotateCcw className={`animate-spin text-3xl ${theme.muted}`} />
                <p className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}>រង់ចាំបន្តិច...</p>
              </div>
            )}
            {recentActs.length === 0 && !isLoading && (
              <p className={`col-span-2 py-6 text-center text-sm ${theme.muted}`}>គ្មានសកម្មភាព</p>
            )}
            {recentActs.map((act, i) => {
              const Icon  = act.type === "purchase" ? FiTruck : FiDollarSign;
              const color = act.type === "purchase" ? "text-blue-500" : "text-emerald-500";
              const bg    = act.type === "purchase" ? "bg-blue-500/10" : "bg-emerald-500/10";
              return (
                <div key={i} className={`flex items-center gap-2.5 rounded-xl border p-3 ${theme.softCard}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${bg} ${color}`}>
                    <Icon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold ${theme.pageTitle}`}>{act.label}</p>
                    <p className={`truncate text-[10px] ${theme.muted}`}>{act.desc}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] ${theme.muted}`}>{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment breakdown card */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${theme.muted}`}>វិធីទូទាត់</p>
          <div className="grid grid-cols-2 gap-2">
            {payBreakdown.length === 0 ? (
              <p className={`col-span-2 py-3 text-center text-xs ${theme.muted}`}>គ្មានការទូទាត់ក្នុងរយៈពេលនេះ</p>
            ) : payBreakdown.map((pm) => (
              <div key={pm.method} className={`flex items-center gap-2 rounded-xl border p-2.5 ${theme.softCard}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm bg-blue-500/10 text-blue-500">
                  <FiDollarSign />
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-[11px] ${theme.muted}`}>{METHOD_LABEL[pm.method] ?? pm.method}</p>
                  <p className={`text-xs font-bold ${theme.pageTitle}`}>{fmtUsd(pm.amountUsd)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>{/* end right column */}

      </div>{/* end insights + activities */}

      {/* ── Low Stock (full-width, hidden when empty) ── */}
      {!suppressReport && lowStock.length > 0 && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>ការព្រមានស្តុកស្ទើរអស់</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>ទំនិញក្រោមកម្រិតអប្បបរមា</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <FiAlertTriangle />
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lowStock.map((item) => {
              const pct = Math.min(100, Math.round((item.current / item.threshold) * 100));
              const barColor = pct <= 30 ? "bg-red-500" : pct <= 60 ? "bg-amber-500" : "bg-orange-400";
              return (
                <div key={item.id} className={`rounded-xl border p-3.5 ${isDark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-200 bg-orange-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.name}</p>
                      <p className={`text-xs ${theme.muted}`}>អប្បបរមា: {item.threshold} {item.unit}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-orange-500">{item.current}</p>
                      <p className={`text-[11px] ${theme.muted}`}>{item.unit} សល់</p>
                    </div>
                  </div>
                  <div className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`}>
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className={`mt-1 text-right text-[11px] font-semibold text-orange-500`}>{pct}% នៃកម្រិត</p>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </section>
  );
}



