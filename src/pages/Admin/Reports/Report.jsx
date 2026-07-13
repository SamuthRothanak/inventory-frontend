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
  FiChevronDown,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiGrid,
  FiPackage,
  FiRotateCcw,
  FiSearch,
  FiShoppingCart,
  FiTrendingDown,
  FiTruck,
} from "react-icons/fi";
import ChartTooltip from "./components/ChartTooltip";
import SummaryCard from "./components/SummaryCard";
import TableLoading from "../../../components/TableLoading";
import {
  buildMoneyChartScale,
  fmtCompactUsd,
  fmtHourLabel,
  fmtHourRangeLabel,
  fmtUsd,
} from "./utils/reportFormat";
import {
  buildReportExport,
  exportReportCsv,
  exportReportExcel,
  exportReportPdf,
} from "./utils/reportExport";
import { getReportSummaryApi } from "../../../services/report.service";

const METHOD_LABEL = {
  cash: "សាច់ប្រាក់",
  bank_transfer: "ធនាគារ / QR",
  qr: "ធនាគារ / QR",
  card: "កាត",
  other: "ផ្សេងទៀត",
};

const BANK_PROVIDER_META = {
  aba: { name: "ABA", subLabel: "ទូទាត់តាម ABA", order: 1 },
  acleda: { name: "ACLEDA", subLabel: "ទូទាត់តាម ACLEDA", order: 2 },
  bakong: { name: "Bakong", subLabel: "ទូទាត់តាម Bakong", order: 3 },
  wing: { name: "Wing", subLabel: "ទូទាត់តាម Wing", order: 4 },
};
const PAYMENT_DONUT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#f43f5e"];
const EMPTY_LIST = [];
const CHART_GROUP_BY_PERIOD = {
  "ថ្ងៃនេះ": "hour",
  "សប្ដាហ៍": "day",
  "ខែ": "month_week",
  "ឆ្នាំ": "month",
  "ផ្ទាល់ខ្លួន": "auto",
};

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

const formatReportDate = (value) => {
  const [year, month, day] = String(value ?? "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const formatKhr = (value) => `៛${Math.round(Number(value || 0)).toLocaleString("en-US")}`;

const formatKhRelativeTime = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";

  if (text === "just now" || text === "now") return "ឥឡូវនេះ";

  const match = text.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i);
  if (!match) return text;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitLabel = {
    second: "វិនាទី",
    minute: "នាទី",
    hour: "ម៉ោង",
    day: "ថ្ងៃ",
    week: "សប្ដាហ៍",
    month: "ខែ",
    year: "ឆ្នាំ",
  }[unit] ?? unit;

  return `${amount.toLocaleString("en-US")} ${unitLabel} មុន`;
};

const normalizeProviderKey = (provider, method, index) => {
  const raw = String(provider || "").trim();
  const lower = raw.toLowerCase();

  if (lower.includes("aba")) return "aba";
  if (lower.includes("acleda")) return "acleda";
  if (lower.includes("bakong")) return "bakong";
  if (lower.includes("wing")) return "wing";

  return raw ? lower.replace(/\s+/g, "_") : method || `other-${index}`;
};

const getProviderDisplay = (key, provider, method) => {
  if (BANK_PROVIDER_META[key]) return BANK_PROVIDER_META[key];

  const name = String(provider || "").trim() || METHOD_LABEL[method] || method || "ផ្សេងទៀត";

  return {
    name,
    subLabel: name === "ធនាគារ / QR" ? "ទូទាត់តាមធនាគារ / QR" : `ទូទាត់តាម ${name}`,
    order: 99,
  };
};

const getPaymentDonutLabel = (payment) => {
  const key = normalizeProviderKey(payment?.provider, payment?.method, 0);
  if (BANK_PROVIDER_META[key]) return BANK_PROVIDER_META[key].name;

  const method = String(payment?.method || "");
  if (method === "cash") return "សាច់ប្រាក់";
  if (method === "bank_transfer" || method === "qr") return "ធនាគារ / QR ផ្សេងៗ";
  if (method === "card") return "កាត";
  return "វិធីផ្សេងៗ";
};

const isBankPayment = (payment) => {
  const method = String(payment?.method || "");
  return method !== "cash" && method !== "other";
};

const getPaymentUsd = (payment) => Number(payment?.netUsd ?? payment?.amountUsd ?? payment?.usd ?? 0);
const getPaymentKhr = (payment) => Number(payment?.netKhr ?? payment?.amountKhr ?? payment?.khr ?? 0);
const getReceivedUsd = (payment) => Number(payment?.receivedUsd ?? getPaymentUsd(payment));
const getReceivedKhr = (payment) => Number(payment?.receivedKhr ?? getPaymentKhr(payment));
const getChangeUsd = (payment) => Number(payment?.changeUsd ?? 0);
const getChangeKhr = (payment) => Number(payment?.changeKhr ?? 0);

export default function Report() {
  const outlet    = useOutletContext();
  const isDark    = outlet?.isDark ?? false;
  const today     = toLocalDateValue(new Date());
  const monthStart = today.slice(0, 8) + "01";

  const [dateFrom,    setDateFrom]    = useState(monthStart);
  const [dateTo,      setDateTo]      = useState(today);
  const [chartPeriod, setChartPeriod] = useState("ខែ");
  const [search,      setSearch]      = useState("");
  const [followUpTab, setFollowUpTab] = useState("purchase");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

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

  const chartGroup = CHART_GROUP_BY_PERIOD[chartPeriod] ?? "auto";

  const { data: raw, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["report-summary", dateFrom, dateTo, chartGroup],
    queryFn:  () => getReportSummaryApi({
      date_from: dateFrom,
      date_to: dateTo,
      chart_group: chartGroup,
    }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: !dateRangeError,
  });

  const d = raw?.data ?? null;
  const stats         = d?.stats          ?? {};
  const chartData     = d?.chart          ?? EMPTY_LIST;
  const chartScale    = buildMoneyChartScale(chartData);
  const topProducts   = d?.top_products   ?? EMPTY_LIST;
  const lowStock      = d?.low_stock      ?? EMPTY_LIST;
  const recentActs    = d?.recent_activities ?? EMPTY_LIST;
  const payBreakdown  = d?.payment_breakdown ?? EMPTY_LIST;
  const paymentSummary = d?.payment_summary ?? {};
  const outstanding    = d?.outstanding ?? {};
  const purchaseMoney  = d?.purchase_money ?? {};
  const insights       = d?.insights ?? {};
  const salesByType    = d?.sales_by_type ?? {};
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
    border:    isDark ? "border-white/10"                                    : "border-zinc-200",
    gridLine:  isDark ? "rgba(255,255,255,0.06)"                            : "rgba(0,0,0,0.06)",
    axisColor: isDark ? "#71717a"                                           : "#a1a1aa",
  };

  const filteredProducts = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return topProducts.filter((p) =>
      !kw || p.name.toLowerCase().includes(kw) || p.unit.toLowerCase().includes(kw)
    );
  }, [search, topProducts]);

  const paymentDonutData = useMemo(() => {
    const grouped = new Map();

    payBreakdown.forEach((payment) => {
      const amount = Math.max(0, Number(payment.amountUsd ?? 0));
      if (amount <= 0) return;

      const label = getPaymentDonutLabel(payment);

      grouped.set(label, (grouped.get(label) ?? 0) + amount);
    });

    const sorted = [...grouped.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return sorted;
  }, [payBreakdown]);

  const paymentDonutTotal = paymentDonutData.reduce((sum, item) => sum + item.value, 0);
  const DAY_KH = { Sun: "អាទិត្យ", Mon: "ច័ន្ទ", Tue: "អង្គារ", Wed: "ពុធ", Thu: "ព្រហ", Fri: "សុក្រ", Sat: "សៅរ៍", Sunday: "អាទិត្យ", Monday: "ច័ន្ទ", Tuesday: "អង្គារ", Wednesday: "ពុធ", Thursday: "ព្រហ", Friday: "សុក្រ", Saturday: "សៅរ៍" };
  const dayKh = (day) => DAY_KH[day] ?? day ?? "—";

  const paymentProviderCards = useMemo(() => {
    const grouped = new Map();

    payBreakdown.forEach((payment, index) => {
      if (!isBankPayment(payment)) return;

      const usd = getPaymentUsd(payment);
      const khr = getPaymentKhr(payment);
      const receivedUsd = getReceivedUsd(payment);
      const receivedKhr = getReceivedKhr(payment);
      const changeUsd = getChangeUsd(payment);
      const changeKhr = getChangeKhr(payment);

      if (receivedUsd === 0 && receivedKhr === 0 && usd === 0 && khr === 0) return;

      const key = normalizeProviderKey(payment.provider, payment.method, index);
      const display = getProviderDisplay(key, payment.provider, payment.method);
      const current = grouped.get(key) ?? {
        key,
        name: display.name,
        subLabel: display.subLabel,
        order: display.order,
        receivedUsd: 0,
        receivedKhr: 0,
        changeUsd: 0,
        changeKhr: 0,
        usd: 0,
        khr: 0,
      };

      current.receivedUsd += receivedUsd;
      current.receivedKhr += receivedKhr;
      current.changeUsd += changeUsd;
      current.changeKhr += changeKhr;
      current.usd += usd;
      current.khr += khr;
      grouped.set(key, current);
    });

    return [...grouped.values()].sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
  }, [payBreakdown]);

  const renderPaymentLedger = (item, compact = false) => (
    <div className={compact ? "space-y-1.5" : "mt-3 space-y-2"}>
      {[
        ["ទទួល USD", fmtUsd(item.receivedUsd), theme.pageTitle],
        ["អាប់ USD", fmtUsd(item.changeUsd), "text-amber-600"],
        ["លក់បាន USD", fmtUsd(item.usd), "text-emerald-600"],
        ["ទទួល KHR", formatKhr(item.receivedKhr), theme.pageTitle],
        ["អាប់ KHR", formatKhr(item.changeKhr), "text-amber-600"],
        ["លក់បាន KHR", formatKhr(item.khr), "text-emerald-600"],
      ].map(([label, value, valueClass]) => (
        <div key={label} className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${isDark ? "bg-black/15" : "bg-white"}`}>
          <p className={`min-w-0 truncate text-xs font-semibold ${theme.muted}`}>{label}</p>
          <p className={`shrink-0 text-sm font-extrabold tabular-nums ${valueClass}`}>{value}</p>
        </div>
      ))}
    </div>
  );

  const totalSales     = stats.total_sales_usd     ?? 0;
  const totalPurchases = stats.total_purchases_usd ?? 0;
  const totalReturns   = stats.gross_return_usd     ?? stats.sales_returns_usd ?? 0;
  const selectedDayCount = dateFrom && dateTo
    ? Math.max(1, Math.round((new Date(`${dateTo}T00:00:00`) - new Date(`${dateFrom}T00:00:00`)) / 86_400_000) + 1)
    : 0;
  const chartGranularity = d?.chart_granularity
    ?? (selectedDayCount <= 1 ? "hour" : selectedDayCount <= 20 ? "day" : selectedDayCount <= 60 ? "week" : "month");
  const chartIntervalLabel = {
    hour: "បែងចែករាល់ 1 ម៉ោង (00:00–23:59)",
    day: "បែងចែកតាមថ្ងៃ",
    week: "បែងចែកតាមសប្ដាហ៍ (ចន្ទ–អាទិត្យ)",
    month_week: "បែងចែកជា ៤ សប្ដាហ៍ក្នុងខែ",
    month: "បែងចែកតាមខែ",
  }[chartGranularity] ?? "បែងចែកតាមរយៈពេល";
  const showChartDots = chartData.length <= 14;
  const formatChartTooltipLabel = (label, point) => {
    const dateLabel = formatReportDate(point?.date);

    if (chartGranularity === "hour") {
      return `${dateLabel} · ${fmtHourRangeLabel(label)}`;
    }

    if (point?.date_to) {
      return `${label} · ${dateLabel}–${formatReportDate(point.date_to)}`;
    }

    return dateLabel ? `${label} · ${dateLabel}` : label;
  };

  const SUMMARY_CARDS = [
    {
      title:    "ការលក់សរុប",
      value:    fmtUsd(stats.total_sales_usd),
      subtitle: `${stats.total_sales_count ?? 0} វិក្កយបត្រលក់`,
      icon:     <FiShoppingCart />,
      iconBg:   "bg-emerald-500/10 text-emerald-500",
      accent:   "border-l-emerald-500",
      trend:    null,
      trendType: null,
    },
    {
      title:    "ការទិញសរុប",
      value:    fmtUsd(stats.total_purchases_usd),
      subtitle: `${stats.total_purchases_count ?? 0} វិក្កយបត្រទិញ`,
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
      title:    "លុយមិនទាន់ទូទាត់",
      value:    fmtUsd(stats.outstanding_balance_usd),
      subtitle: `${stats.outstanding_balance_count ?? 0} វិក្កយបត្រ`,
      icon:     <FiAlertCircle />,
      iconBg:   "bg-red-500/10 text-red-500",
      accent:   "border-l-red-500",
      trend:    (stats.outstanding_balance_count ?? 0) > 0 ? "មិនទាន់ទូទាត់" : null,
      trendType: "down",
    },
  ];

  const reportExport = useMemo(() => buildReportExport({
    dateFrom,
    dateTo,
    stats,
    salesByType,
    chartData,
    chartGranularity,
    topProducts,
    paymentSummary,
    paymentBreakdown: payBreakdown,
    lowStock,
    outstanding,
    purchaseMoney,
    insights,
    recentActivities: recentActs,
  }), [
    chartData,
    chartGranularity,
    dateFrom,
    dateTo,
    insights,
    lowStock,
    outstanding,
    payBreakdown,
    paymentSummary,
    purchaseMoney,
    recentActs,
    salesByType,
    stats,
    topProducts,
  ]);

  const canExport = !suppressReport && Boolean(d);

  const handlePdfExport = () => {
    if (!canExport) return;
    const opened = exportReportPdf(reportExport);
    if (!opened) {
      window.alert("PDF export was blocked by the browser. Please allow pop-ups and try again.");
    }
  };

  const handleExport = (type) => {
    if (!canExport) return;
    setExportMenuOpen(false);

    if (type === "pdf") {
      handlePdfExport();
      return;
    }

    if (type === "excel") {
      exportReportExcel(reportExport);
      return;
    }

    exportReportCsv(reportExport);
  };

  return (
    <section className="space-y-6">

      {/* â"€â"€ Filters + Actions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className={`relative rounded-2xl border p-4 shadow-sm ${theme.card} ${exportMenuOpen ? "mb-14" : ""}`}>
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

          {/* Right: quick presets + export */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-1.5">
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
            <div className="relative sm:border-l sm:pl-2 sm:dark:border-white/10">
              <button
                type="button"
                onClick={() => canExport && setExportMenuOpen((open) => !open)}
                disabled={!canExport}
                aria-haspopup="menu"
                aria-expanded={exportMenuOpen}
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.badge} hover:border-red-400 hover:text-red-500`}
              >
                <FiDownload />
                Export
                <FiChevronDown className={`transition ${exportMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {exportMenuOpen && (
                <div className={`absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border py-1 shadow-xl ${isDark ? "border-white/10 bg-zinc-900" : "border-zinc-200 bg-white"}`} role="menu">
                  {[
                    ["pdf", "PDF", FiFileText],
                    ["excel", "Excel", FiGrid],
                    ["csv", "CSV", FiDownload],
                  ].map(([type, label, Icon]) => (
                    <button
                      key={type}
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport(type)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition ${isDark ? "text-zinc-100 hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100"}`}
                    >
                      <Icon className="text-base" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
              <p className={`mt-0.5 text-xs ${theme.muted}`}>
                លក់ធៀបនឹងទិញ និងផលប៉ះពាល់ត្រឡប់ · {chartIntervalLabel}
              </p>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                តម្លៃខាងលើជាសរុបរយៈពេល ខណៈចំណុចលើក្រាបជាតម្លៃក្នុងចន្លោះនីមួយៗ។
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start">
              <span className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${theme.badge}`}>
                {chartPeriod}
              </span>
              <span className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${theme.badge}`}>
                អ័ក្សដល់ {fmtCompactUsd(chartScale.max)}
              </span>
            </div>
          </div>

          {/* Mini metrics */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "ការលក់សរុប", value: fmtUsd(totalSales), cls: "text-emerald-500" },
              { label: "ការទិញសរុប",    value: fmtUsd(totalPurchases), cls: "text-blue-500"    },
              { label: "ត្រឡប់ទំនិញសរុប", value: fmtUsd(totalReturns),   cls: "text-amber-500"   },
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
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: theme.axisColor }}
                axisLine={false}
                tickLine={false}
                interval={chartGranularity === "hour" ? 3 : chartData.length > 14 ? Math.ceil(chartData.length / 8) - 1 : 0}
                minTickGap={18}
                tickFormatter={chartGranularity === "hour" ? fmtHourLabel : undefined}
              />
              <YAxis tick={{ fontSize: 11, fill: theme.axisColor }} axisLine={false} tickLine={false}
                domain={[0, chartScale.max]}
                ticks={chartScale.ticks}
                tickFormatter={fmtCompactUsd} />
              <Tooltip content={<ChartTooltip theme={theme} labelFormatter={formatChartTooltipLabel} />}
                cursor={{ stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: theme.axisColor }} iconType="circle" iconSize={8} />
              <Area dataKey="sales"     name="ការលក់សរុប"     type="monotone" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradSales)"     dot={showChartDots ? { r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#22c55e", strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
              <Area dataKey="purchases" name="ការទិញសរុប" type="monotone" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradPurchases)" dot={showChartDots ? { r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#3b82f6", strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
              <Line dataKey="returns"   name="ត្រឡប់ទំនិញសរុប"   type="monotone" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3"
                dot={showChartDots ? { r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#f59e0b", strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
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

      {/* ── Payment overview + follow-up ── */}
      <div className={`${suppressReport ? "hidden" : ""} flex flex-col gap-6`}>

        {/* Payment share */}
        <div className={`flex w-full flex-col rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="space-y-4">
              <div className="mb-1 flex items-end justify-between gap-3">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ចំណែកការទូទាត់</p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>គណនាភាគរយតាមតម្លៃសមមូល USD</p>
                </div>
              </div>

              {paymentDonutData.length === 0 ? (
                <div className={`mt-3 flex min-h-44 items-center justify-center rounded-xl border border-dashed ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                  <p className={`text-xs ${theme.muted}`}>គ្មានទិន្នន័យការទូទាត់</p>
                </div>
              ) : (
                <>
                  <div className={`rounded-xl border p-3 ${theme.softCard}`}>
                    <p className={`text-xs font-semibold ${theme.muted}`}>ប្រាក់ទទួលសរុប</p>
                    <p className={`mt-1 text-2xl font-extrabold tabular-nums ${theme.pageTitle}`}>{fmtUsd(paymentDonutTotal)}</p>
                  </div>

                  <div className="space-y-3">
                    {paymentDonutData.map((item, index) => {
                      const percent = paymentDonutTotal > 0
                        ? (item.value / paymentDonutTotal) * 100
                        : 0;
                      const color = PAYMENT_DONUT_COLORS[index % PAYMENT_DONUT_COLORS.length];

                      return (
                        <div key={item.name} className={`rounded-xl border p-3 ${theme.softCard}`}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                              <span className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.name}</span>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`text-sm font-extrabold tabular-nums ${theme.pageTitle}`}>{fmtUsd(item.value)}</span>
                              <span className={`ml-2 text-xs font-semibold ${theme.muted}`}>{percent.toFixed(percent >= 10 ? 0 : 1)}%</span>
                            </div>
                          </div>
                          <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${Math.max(2, percent)}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`border-t pt-3 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                    <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ការយល់ដឹងរបាយការណ៍</p>
                    <div className="space-y-1.5">
                      {[
                        {
                          label: "ថ្ងៃលក់ល្អ",
                          value: insights.best_sales_day ? dayKh(insights.best_sales_day.day) : "—",
                          badge: insights.best_sales_day ? fmtUsd(insights.best_sales_day.amount) : "—",
                          badgeClass: "bg-emerald-500/10 text-emerald-600",
                        },
                        {
                          label: "ថ្ងៃទិញខ្ពស់",
                          value: insights.best_purchase_day ? dayKh(insights.best_purchase_day.day) : "—",
                          badge: insights.best_purchase_day ? fmtUsd(insights.best_purchase_day.amount) : "—",
                          badgeClass: "bg-blue-500/10 text-blue-600",
                        },
                        {
                          label: "ថ្ងៃត្រឡប់ច្រើន",
                          value: insights.most_return_day ? dayKh(insights.most_return_day.day) : "—",
                          badge: insights.most_return_day ? fmtUsd(insights.most_return_day.amount) : "—",
                          badgeClass: "bg-amber-500/10 text-amber-600",
                        },
                      ].map((row) => (
                        <div key={row.label} className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${isDark ? "bg-black/15" : "bg-zinc-50"}`}>
                          <div className="min-w-0">
                            <p className={`truncate text-xs font-semibold ${theme.pageTitle}`}>{row.label}</p>
                            <p className={`truncate text-xs ${theme.muted}`}>{row.value}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-extrabold tabular-nums ${row.badgeClass}`}>
                            {row.badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </>
              )}
          </div>
        </div>

        {/* Payment + follow-up */}
        <div className="contents">

        {/* Payment summary card */}
        <div className={`w-full rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>សេចក្តីសង្ខេបការទូទាត់</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>បំបែកសាច់ប្រាក់ និងធនាគារ / QR តាម USD និង KHR</p>
            </div>
            <div className={`shrink-0 rounded-xl border px-3 py-2 text-right ${theme.badge}`}>
              <p className={`text-xs ${theme.muted}`}>សរុបលក់បានក្រោយសង</p>
              <p className={`text-sm font-extrabold ${theme.pageTitle}`}>{fmtUsd(paymentSummary.netEquivalentUsd)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                label: "សាច់ប្រាក់ទទួល",
                subLabel: "ផ្ទៀងផ្ទាត់ជាមួយថតលុយ",
                receivedUsd: paymentSummary.cashReceivedUsd,
                receivedKhr: paymentSummary.cashReceivedKhr,
                changeUsd: paymentSummary.cashChangeUsd,
                changeKhr: paymentSummary.cashChangeKhr,
                usd: paymentSummary.cashUsd,
                khr: paymentSummary.cashKhr,
                ledger: true,
                icon: FiDollarSign,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
              },
              {
                label: "ធនាគារ / QR",
                subLabel: "ABA / ACLEDA / Bakong / Wing",
                receivedUsd: paymentSummary.electronicReceivedUsd,
                receivedKhr: paymentSummary.electronicReceivedKhr,
                changeUsd: paymentSummary.electronicChangeUsd,
                changeKhr: paymentSummary.electronicChangeKhr,
                usd: paymentSummary.electronicUsd,
                khr: paymentSummary.electronicKhr,
                ledger: true,
                icon: FiCreditCard,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                label: "លុយអាប់បានប្រគល់",
                subLabel: "ចេញពីសាច់ប្រាក់",
                usd: paymentSummary.changeUsd,
                khr: paymentSummary.changeKhr,
                icon: FiRotateCcw,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                label: "ប្រាក់សងអតិថិជន",
                subLabel: "Refund",
                usd: paymentSummary.refundUsd,
                khr: paymentSummary.refundKhr,
                icon: FiTrendingDown,
                color: "text-red-500",
                bg: "bg-red-500/10",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex min-h-[132px] flex-col justify-between rounded-xl border p-3.5 ${theme.softCard}`}>
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                      <Icon />
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.label}</p>
                      <p className={`mt-0.5 truncate text-xs ${theme.muted}`}>{item.subLabel}</p>
                    </div>
                  </div>

                  {item.ledger ? renderPaymentLedger(item) : (
                    <div className="mt-3 space-y-2">
                      <div className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${isDark ? "bg-black/15" : "bg-white"}`}>
                        <p className={`min-w-0 truncate text-xs font-semibold ${theme.muted}`}>សរុប USD</p>
                        <p className={`shrink-0 text-sm font-extrabold tabular-nums ${theme.pageTitle}`}>{fmtUsd(item.usd)}</p>
                      </div>
                      <div className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${isDark ? "bg-black/15" : "bg-white"}`}>
                        <p className={`min-w-0 truncate text-xs font-semibold ${theme.muted}`}>សរុប KHR</p>
                        <p className={`shrink-0 text-sm font-extrabold tabular-nums ${theme.pageTitle}`}>{formatKhr(item.khr)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {paymentProviderCards.length === 0 ? (
            <p className={`mt-3 py-2 text-center text-xs ${theme.muted}`}>គ្មានការទូទាត់តាមធនាគារ / QR ក្នុងរយៈពេលនេះ</p>
          ) : (
            <div className={`mt-4 border-t pt-3 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
              <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${theme.muted}`}>លម្អិតតាមធនាគារ / QR</p>
              <div className={`grid grid-cols-1 gap-2.5 ${paymentProviderCards.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {paymentProviderCards.map((pm, index) => {
                  const isLastOddCard = paymentProviderCards.length > 1
                    && paymentProviderCards.length % 2 === 1
                    && index === paymentProviderCards.length - 1;

                  return (
                  <div key={pm.key} className={`rounded-xl border p-3 ${isLastOddCard ? "sm:col-span-2" : ""} ${theme.softCard}`}>
                    <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{pm.name}</p>
                        <p className={`mt-0.5 truncate text-xs ${theme.muted}`}>{pm.subLabel}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-bold ${theme.badge}`}>
                        ធនាគារ / QR
                      </span>
                    </div>

                    {renderPaymentLedger(pm, true)}
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Follow-up details */}
        <div className={`w-full rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>តាមដានបន្ថែម</h2>
              <p className={`mt-1 text-sm ${theme.muted}`}>តាមដានការទិញ មិនទាន់ទូទាត់ និងសកម្មភាពចុងក្រោយ</p>
            </div>
            <div className={`grid grid-cols-3 rounded-2xl border p-1 ${theme.badge}`}>
              {[
                ["purchase", "ការទិញ"],
                ["debt", "មិនទាន់ទូទាត់"],
                ["activity", "សកម្មភាព"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFollowUpTab(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${followUpTab === key ? "bg-red-500 text-white shadow-sm" : theme.muted}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {followUpTab === "purchase" && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-lg text-blue-500"><FiPackage /></div>
                <div>
                  <p className={`text-base font-extrabold ${theme.pageTitle}`}>Purchases / លុយចេញ</p>
                  <p className={`text-sm ${theme.muted}`}>{purchaseMoney.count ?? 0} វិក្កយបត្រទិញ</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ["បានបង់ USD", fmtUsd(purchaseMoney.paidUsd), theme.pageTitle],
                  ["បានបង់ KHR", formatKhr(purchaseMoney.paidKhr), theme.pageTitle],
                  ["មិនទាន់បង់ USD", fmtUsd(purchaseMoney.outstandingUsd), "text-amber-600"],
                  ["មិនទាន់បង់ KHR", formatKhr(purchaseMoney.outstandingKhr), "text-amber-600"],
                ].map(([label, value, valueClass]) => (
                  <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                    <p className={`truncate text-sm font-semibold ${theme.muted}`}>{label}</p>
                    <p className={`mt-1 truncate text-lg font-extrabold tabular-nums ${valueClass}`}>{value}</p>
                  </div>
                ))}
              </div>
              {(purchaseMoney.suppliers ?? []).length > 0 && (
                <div className={`mt-4 border-t pt-4 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                  <div className="mb-3">
                    <p className={`text-sm font-bold ${theme.pageTitle}`}>មិនទាន់បង់អ្នកផ្គត់ផ្គង់សរុប</p>
                    <p className={`mt-0.5 text-xs ${theme.muted}`}>បង្ហាញបំណុលអ្នកផ្គត់ផ្គង់ដែលនៅមិនទាន់បង់ទាំងអស់</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(purchaseMoney.suppliers ?? []).map((item) => (
                      <div key={item.supplierName} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.supplierName}</p>
                          <p className={`text-sm ${theme.muted}`}>{item.count} វិក្កយបត្រទិញ</p>
                        </div>
                        <p className="shrink-0 text-sm font-extrabold tabular-nums text-amber-600">{fmtUsd(item.totalUsd)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {followUpTab === "debt" && (
            <div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ["សរុបមិនទាន់ទូទាត់", fmtUsd(outstanding.totalUsd), "text-red-500"],
                  ...((outstanding.aging ?? []).slice(0, 3).map((item) => [item.label, fmtUsd(item.totalUsd), "text-red-500"])),
                ].map(([label, value, valueClass]) => (
                  <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                    <p className={`truncate text-sm font-semibold ${theme.muted}`}>{label}</p>
                    <p className={`mt-1 truncate text-lg font-extrabold tabular-nums ${valueClass}`}>{value}</p>
                  </div>
                ))}
              </div>
              {(outstanding.customers ?? []).length > 0 && (
                <div className={`mt-4 border-t pt-4 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                  <p className={`mb-3 text-sm font-bold ${theme.pageTitle}`}>អតិថិជនមិនទាន់ទូទាត់</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(outstanding.customers ?? []).map((item) => (
                      <div key={item.customerName} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.customerName}</p>
                          <p className={`text-sm ${theme.muted}`}>{item.count} វិក្កយបត្រ</p>
                        </div>
                        <p className="shrink-0 text-sm font-extrabold tabular-nums text-red-500">{fmtUsd(item.totalUsd)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {followUpTab === "activity" && (
            <div className="space-y-3">
              {isLoading && <div className={`flex min-h-24 items-center justify-center rounded-xl border ${theme.softCard}`}><FiRotateCcw className={`animate-spin text-2xl ${theme.muted}`} /></div>}
              {recentActs.length === 0 && !isLoading && <p className={`py-6 text-center text-sm ${theme.muted}`}>គ្មានសកម្មភាព</p>}
              {recentActs.slice(0, 6).map((act, i) => {
                const Icon  = act.type === "purchase" ? FiTruck : FiDollarSign;
                const color = act.type === "purchase" ? "text-blue-500" : "text-emerald-500";
                const bg    = act.type === "purchase" ? "bg-blue-500/10" : "bg-emerald-500/10";
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${bg} ${color}`}><Icon /></div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{act.label}</p>
                      <p className={`truncate text-sm ${theme.muted}`}>{act.desc}</p>
                    </div>
                    <span className={`shrink-0 text-sm ${theme.muted}`}>{formatKhRelativeTime(act.time)}</span>
                  </div>
                );
              })}
            </div>
          )}
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
