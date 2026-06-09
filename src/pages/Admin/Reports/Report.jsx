import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
  FiActivity,
  FiAlertTriangle,
  FiArrowDownRight,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiBox,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiShoppingCart,
  FiTag,
  FiTrendingDown,
  FiTrendingUp,
  FiTruck,
  FiLayers,
  FiAlertCircle,
  FiClock,
  FiPrinter,
} from "react-icons/fi";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = {
  totalSalesUsd:      5_184.50,
  totalSalesKhr:      20_738_000,
  totalPurchasesUsd:  3_420.00,
  totalPurchasesKhr:  13_680_000,
  netCashUsd:         1_764.50,
  grossReturnUsd:       73.50,
  salesReturnsUsd:      46.50,
  purchaseReturnsUsd:   27.00,
  lowStockItems:           8,
  pendingClaims:           3,
  stockOnHand:        32_545,
  totalVariants:          48,
};

const CHART_DATA = [
  { day: "Sun", sales: 2800, purchases: 900,  returns: 120 },
  { day: "Mon", sales: 1200, purchases: 500,  returns:  60 },
  { day: "Tue", sales: 1500, purchases: 1200, returns:  80 },
  { day: "Wed", sales: 1800, purchases: 700,  returns:  95 },
  { day: "Thu", sales:  900, purchases: 1100, returns:  40 },
  { day: "Fri", sales: 3400, purchases: 1300, returns: 150 },
  { day: "Sat", sales:  200, purchases:  400, returns:  20 },
];

const TOP_PRODUCTS = [
  { id: 1, name: "Coca-Cola Can 330ml",     unit: "Can",    soldQty: 245, revenueUsd: 122.5,  stock: 4550,   status: "In Stock"   },
  { id: 2, name: "Face Mask Box",           unit: "Box",    soldQty:  84, revenueUsd: 336.0,  stock:  528,   status: "In Stock"   },
  { id: 3, name: "Dove Shampoo 250ml",      unit: "Bottle", soldQty:  42, revenueUsd: 189.0,  stock:   95,   status: "Low Stock"  },
  { id: 4, name: "Tiger Beer 330ml",        unit: "Can",    soldQty:  38, revenueUsd: 190.0,  stock:   12,   status: "Low Stock"  },
  { id: 5, name: "Sugar Loose",             unit: "Kg",     soldQty:  36, revenueUsd:  36.0,  stock: 25000,  status: "In Stock"   },
  { id: 6, name: "Maggi Noodles 5-pack",    unit: "Pack",   soldQty:  29, revenueUsd:  43.5,  stock:   80,   status: "In Stock"   },
];

const LOW_STOCK = [
  { id: 1, name: "Coca-Cola Bottle 1.5L",  current:  8, threshold: 48, unit: "Bottle" },
  { id: 2, name: "Tiger Beer 330ml Can",   current: 12, threshold: 24, unit: "Can"    },
  { id: 3, name: "Dove Shampoo 500ml",     current:  9, threshold: 12, unit: "Bottle" },
  { id: 4, name: "Facial Spray",           current:  6, threshold: 10, unit: "Piece"  },
  { id: 5, name: "Milo Tin 400g",          current:  4, threshold: 12, unit: "Tin"    },
];

const PAYMENT_BREAKDOWN = [
  { method: "Cash USD",   amountUsd: 2840.00, icon: FiDollarSign,  color: "text-emerald-500", bg: "bg-emerald-500/10", count: 38 },
  { method: "Cash KHR",   amountUsd:  300.00, icon: FiTag,         color: "text-blue-500",    bg: "bg-blue-500/10",   count: 14 },
  { method: "ABA / Bank", amountUsd: 1644.50, icon: FiCreditCard,  color: "text-violet-500",  bg: "bg-violet-500/10", count: 21 },
  { method: "Pending",    amountUsd:  400.00, icon: FiClock,       color: "text-amber-500",   bg: "bg-amber-500/10",  count:  6 },
];

const RECENT_ACTIVITIES = [
  { id: 1, type: "sale",     icon: FiDollarSign,  label: "Sale Completed",             desc: "INV-012 · Walk-in · $48.50 paid by cash",            time: "12 min ago",  color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: 2, type: "stock_in", icon: FiPackage,     label: "Stock-In Confirmed",         desc: "PO-031 · ABC Supplier · 240 cans received",          time: "28 min ago",  color: "text-violet-500",  bg: "bg-violet-500/10"  },
  { id: 3, type: "purchase", icon: FiShoppingCart,label: "Purchase Created",           desc: "PO-034 · Mega Import · $1,200 · awaiting delivery",  time: "1 hr ago",    color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { id: 4, type: "claim",    icon: FiAlertCircle, label: "Supplier Claim Pending",     desc: "PO-028 · 5 damaged cans · awaiting replacement",     time: "2 hr ago",    color: "text-orange-500",  bg: "bg-orange-500/10"  },
  { id: 5, type: "s_return", icon: FiRotateCcw,   label: "Sales Return Created",       desc: "SR-004 · INV-009 · $9.75 refunded to customer",      time: "3 hr ago",    color: "text-rose-500",    bg: "bg-rose-500/10"    },
  { id: 6, type: "p_return", icon: FiRefreshCw,   label: "Purchase Return Created",    desc: "PR-002 · PO-028 · 3 damaged items returned",        time: "4 hr ago",    color: "text-amber-500",   bg: "bg-amber-500/10"   },
  { id: 7, type: "stock_adj",icon: FiBarChart2,   label: "Stock Adjustment Approved",  desc: "ADJ-007 · 5 damaged Coca-Cola cans adjusted out",   time: "5 hr ago",    color: "text-cyan-500",    bg: "bg-cyan-500/10"    },
  { id: 8, type: "sale",     icon: FiCheckCircle, label: "Sale Completed",             desc: "INV-011 · Sokha Mart · $83.00 · partial payment",   time: "6 hr ago",    color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtUsd  = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtKhr  = (n) => `${Math.round(Number(n || 0)).toLocaleString("en-US")}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ theme, title, value, subtitle, icon, iconBg, accent, trend, trendType }) {
  const isUp = trendType === "up";
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
        <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          isUp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-500"
        }`}>
          {isUp ? <FiArrowUpRight /> : <FiArrowDownRight />}
          {trend}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ icon, value, onChange, options, theme }) {
  return (
    <div className="relative">
      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-10 text-sm outline-none transition focus:ring-4 ${theme.select}`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FiChevronDown className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${theme.muted}`} />
    </div>
  );
}

function ChartTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-4 py-3 text-xs shadow-xl ${theme.card}`}>
      <p className="mb-2 font-bold text-red-500 uppercase tracking-wide">{label}</p>
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

function FlowCard({ theme, title, value, steps, icon, color }) {
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

function InsightRow({ theme, label, value, badge, badgeColor }) {
  const badgePalette = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red:     "bg-red-500/10 text-red-500",
    zinc:    "bg-zinc-500/10 text-zinc-500",
  };
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${theme.softCard}`}>
      <span className={`text-sm ${theme.muted}`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-sm ${theme.pageTitle}`}>{value}</span>
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgePalette[badgeColor] ?? badgePalette.zinc}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Report() {
  const outlet    = useOutletContext();
  const isDark    = outlet?.isDark ?? false;

  const [dateFrom,    setDateFrom]    = useState("2026-06-01");
  const [dateTo,      setDateTo]      = useState("2026-06-08");
  const [reportType,  setReportType]  = useState("all");
  const [chartPeriod, setChartPeriod] = useState("Week");
  const [search,      setSearch]      = useState("");

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
    return TOP_PRODUCTS.filter((p) =>
      !kw || p.name.toLowerCase().includes(kw) || p.unit.toLowerCase().includes(kw)
    );
  }, [search]);

  const totalSales     = CHART_DATA.reduce((s, d) => s + d.sales, 0);
  const totalPurchases = CHART_DATA.reduce((s, d) => s + d.purchases, 0);
  const totalReturns   = CHART_DATA.reduce((s, d) => s + d.returns, 0);
  const netCash        = totalSales - totalPurchases - totalReturns;

  const SUMMARY_CARDS = [
    {
      title:    "Total Sales",
      value:    fmtUsd(STATS.totalSalesUsd),
      subtitle: `KHR ${fmtKhr(STATS.totalSalesKhr)} converted`,
      icon:     <FiShoppingCart />,
      iconBg:   "bg-emerald-500/10 text-emerald-500",
      accent:   "border-l-emerald-500",
      trend:    "+12.5% vs last week",
      trendType:"up",
    },
    {
      title:    "Total Purchases",
      value:    fmtUsd(STATS.totalPurchasesUsd),
      subtitle: `KHR ${fmtKhr(STATS.totalPurchasesKhr)} purchased`,
      icon:     <FiTruck />,
      iconBg:   "bg-blue-500/10 text-blue-500",
      accent:   "border-l-blue-500",
      trend:    "+3 new records",
      trendType:"up",
    },
    {
      title:    "Net Cash",
      value:    fmtUsd(STATS.netCashUsd),
      subtitle: "Sales minus purchases",
      icon:     <FiDollarSign />,
      iconBg:   "bg-red-500/10 text-red-500",
      accent:   "border-l-red-500",
      trend:    "+8.2% profit margin",
      trendType:"up",
    },
    {
      title:    "Gross Return Amount",
      value:    fmtUsd(STATS.grossReturnUsd),
      subtitle: "Sales + purchase returns combined",
      icon:     <FiRefreshCw />,
      iconBg:   "bg-rose-500/10 text-rose-500",
      accent:   "border-l-rose-500",
      trend:    "3 return cases",
      trendType:"down",
    },
    {
      title:    "Sales Returns",
      value:    fmtUsd(STATS.salesReturnsUsd),
      subtitle: "Refund / exchange",
      icon:     <FiTrendingDown />,
      iconBg:   "bg-amber-500/10 text-amber-500",
      accent:   "border-l-amber-500",
      trend:    "2 return transactions",
      trendType:"down",
    },
    {
      title:    "Purchase Returns",
      value:    fmtUsd(STATS.purchaseReturnsUsd),
      subtitle: "Supplier claims",
      icon:     <FiPackage />,
      iconBg:   "bg-pink-500/10 text-pink-500",
      accent:   "border-l-pink-500",
      trend:    "1 pending refund",
      trendType:"down",
    },
    {
      title:    "Low Stock Items",
      value:    String(STATS.lowStockItems),
      subtitle: "Below minimum threshold",
      icon:     <FiAlertTriangle />,
      iconBg:   "bg-orange-500/10 text-orange-500",
      accent:   "border-l-orange-500",
      trend:    "+2 new alerts today",
      trendType:"down",
    },
    {
      title:    "Pending Claims",
      value:    String(STATS.pendingClaims),
      subtitle: "Supplier refund / replacement",
      icon:     <FiAlertCircle />,
      iconBg:   "bg-violet-500/10 text-violet-500",
      accent:   "border-l-violet-500",
      trend:    "Needs review",
      trendType:"down",
    },
  ];

  return (
    <section className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={`flex flex-col gap-4 rounded-2xl border px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${theme.card}`}>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${theme.pageTitle}`}>Reports</h1>
          <p className={`mt-1 text-sm ${theme.muted}`}>
            Overview of sales, purchases, returns, stock, and payment flow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition hover:opacity-80 ${theme.badge}`}>
            <FiRefreshCw className="text-base" />
            Refresh
          </button>
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
            <FiPrinter className="text-base" />
            Print
          </button>
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600">
            <FiDownload className="text-base" />
            Export
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_160px_160px_200px_auto]">

          {/* Search */}
          <div className="relative">
            <FiSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base ${theme.muted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, report item..."
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          {/* Date From */}
          <div className="relative">
            <FiCalendar className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base ${theme.muted}`} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <FiCalendar className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base ${theme.muted}`} />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          {/* Report Type */}
          <FilterSelect
            icon={<FiFilter />}
            value={reportType}
            onChange={setReportType}
            theme={theme}
            options={[
              { value: "all",       label: "All Reports"  },
              { value: "sales",     label: "Sales"        },
              { value: "purchases", label: "Purchases"    },
              { value: "inventory", label: "Inventory"    },
              { value: "returns",   label: "Returns"      },
              { value: "payments",  label: "Payments"     },
            ]}
          />

          {/* Reset */}
          <button
            type="button"
            onClick={() => { setSearch(""); setDateFrom("2026-06-01"); setDateTo("2026-06-08"); setReportType("all"); }}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-semibold transition hover:opacity-80 ${theme.badge}`}
          >
            <FiRotateCcw />
            Reset
          </button>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div>
        <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Period Summary</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.title} theme={theme} {...card} />
          ))}
        </div>
      </div>

      {/* ── Business Performance + Insights ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">

        {/* Chart */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>Business Performance</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>Sales vs purchases with returns impact.</p>
            </div>
            <div className={`flex items-center gap-1 rounded-xl border p-1 self-start ${isDark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-100"}`}>
              {["Week", "Month", "Year"].map((p) => (
                <button key={p} type="button" onClick={() => setChartPeriod(p)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    chartPeriod === p ? "bg-red-500 text-white shadow-sm" : `${theme.muted} hover:opacity-80`
                  }`}>{p}</button>
              ))}
            </div>
          </div>

          {/* Mini metrics */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Sales",     value: fmtUsd(totalSales),     cls: "text-emerald-500" },
              { label: "Purchases", value: fmtUsd(totalPurchases), cls: "text-blue-500"    },
              { label: "Returns",   value: fmtUsd(totalReturns),   cls: "text-amber-500"   },
              { label: "Net Cash",  value: fmtUsd(netCash),        cls: netCash >= 0 ? "text-red-500" : "text-red-400" },
            ].map((m) => (
              <div key={m.label} className={`rounded-xl border p-3 ${theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>{m.label}</p>
                <p className={`mt-1.5 text-base font-bold ${m.cls}`}>{m.value}</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={CHART_DATA} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
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
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: theme.axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: theme.axisColor }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
              <Tooltip content={<ChartTooltip theme={theme} />}
                cursor={{ stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: theme.axisColor }} iconType="circle" iconSize={8} />
              <Area dataKey="sales"     name="Sales"     type="monotone" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradSales)"     dot={{ r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#22c55e", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              <Area dataKey="purchases" name="Purchases" type="monotone" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradPurchases)" dot={{ r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#3b82f6", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              <Line dataKey="returns"   name="Returns"   type="monotone" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3"
                dot={{ r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#f59e0b", strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-base font-bold ${theme.pageTitle}`}>Report Insights</h2>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>Key metrics from this period.</p>
          </div>
          <div className="space-y-2.5">
            <InsightRow theme={theme} label="Best Sales Day"          value="Friday"    badge="$3,400"  badgeColor="emerald" />
            <InsightRow theme={theme} label="Highest Purchase Day"    value="Friday"    badge="$1,300"  badgeColor="blue"    />
            <InsightRow theme={theme} label="Most Returned Day"       value="Friday"    badge="$150"    badgeColor="amber"   />
            <InsightRow theme={theme} label="Pending Supplier Claims" value="3 Claims"  badge="Review"  badgeColor="red"     />
            <InsightRow theme={theme} label="Low Stock Alerts"        value="8 Items"   badge="Urgent"  badgeColor="red"     />
            <InsightRow theme={theme} label="Total Return Amount"     value={fmtUsd(STATS.grossReturnUsd)} badge="Combined" badgeColor="amber" />
            <InsightRow theme={theme} label="Net Cash Flow"           value={fmtUsd(STATS.netCashUsd)}     badge="Positive" badgeColor="emerald" />
            <InsightRow theme={theme} label="Stock on Hand"           value={`${STATS.stockOnHand.toLocaleString()} units`} badgeColor="zinc" />
          </div>

          {/* Payment mini breakdown */}
          <div className="mt-5">
            <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${theme.muted}`}>Payment Methods</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_BREAKDOWN.map((pm) => {
                const Icon = pm.icon;
                return (
                  <div key={pm.method} className={`flex items-center gap-2 rounded-xl border p-2.5 ${theme.softCard}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${pm.bg} ${pm.color}`}>
                      <Icon />
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-[11px] ${theme.muted}`}>{pm.method}</p>
                      <p className={`text-xs font-bold ${theme.pageTitle}`}>{fmtUsd(pm.amountUsd)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Flow Summary Cards ───────────────────────────────────── */}
      <div>
        <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Business Flow Summary</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FlowCard theme={theme} color="emerald" icon={FiTrendingUp}
            title="Sales Flow"       value={fmtUsd(STATS.totalSalesUsd)}
            steps={["Sales", "Payments", "Stock Out"]} />
          <FlowCard theme={theme} color="blue"    icon={FiTruck}
            title="Purchase Flow"    value={fmtUsd(STATS.totalPurchasesUsd)}
            steps={["Purchases", "Stock-In", "Batches"]} />
          <FlowCard theme={theme} color="red"     icon={FiRefreshCw}
            title="Return Flow"      value={fmtUsd(STATS.grossReturnUsd)}
            steps={["Sale Return", "P. Return", "Credit"]} />
          <FlowCard theme={theme} color="purple"  icon={FiBarChart2}
            title="Stock Flow"       value={`${STATS.stockOnHand.toLocaleString()} u`}
            steps={["Batches", "Movements", "Balances"]} />
        </div>
      </div>

      {/* ── Top Products + Low Stock ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">

        {/* Top Selling Products */}
        <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
          <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
            <div>
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>Top Selling Products</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>{filteredProducts.length} items · this period</p>
            </div>
            <FiPackage className="text-xl text-red-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold">Unit</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold">Sold Qty</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold">Revenue</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold">Stock</th>
                  <th className="px-5 py-3 text-center text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr className={`border-t ${theme.row}`}>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className={`text-sm font-semibold ${theme.pageTitle}`}>No results found</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>Try a different keyword.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item, i) => (
                    <tr key={item.id} className={`border-t transition ${theme.row}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                            <FiBox />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className={`text-xs ${theme.muted}`}>Rank #{i + 1}</p>
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
                        }`}>{item.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>Low Stock Alerts</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>Items below minimum threshold</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <FiAlertTriangle />
            </span>
          </div>
          <div className="space-y-3">
            {LOW_STOCK.map((item) => {
              const pct = Math.min(100, Math.round((item.current / item.threshold) * 100));
              const barColor = pct <= 30 ? "bg-red-500" : pct <= 60 ? "bg-amber-500" : "bg-orange-400";
              return (
                <div key={item.id} className={`rounded-xl border p-3.5 ${isDark ? "border-orange-500/20 bg-orange-500/5" : "border-orange-200 bg-orange-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.name}</p>
                      <p className={`text-xs ${theme.muted}`}>Min: {item.threshold} {item.unit}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-orange-500">{item.current}</p>
                      <p className={`text-[11px] ${theme.muted}`}>{item.unit} left</p>
                    </div>
                  </div>
                  <div className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`}>
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className={`mt-1 text-right text-[11px] font-semibold text-orange-500`}>{pct}% of threshold</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Activities ────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className={`text-base font-bold ${theme.pageTitle}`}>Recent Report Activities</h2>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>Latest important system actions</p>
          </div>
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${theme.badge}`}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <FiActivity className="text-red-500" />
            Live
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RECENT_ACTIVITIES.map((act) => {
            const Icon = act.icon;
            return (
              <div key={act.id} className={`flex items-start gap-3 rounded-xl border p-3.5 ${theme.softCard}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${act.bg} ${act.color}`}>
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${theme.pageTitle}`}>{act.label}</p>
                  <p className={`mt-0.5 truncate text-xs ${theme.muted}`}>{act.desc}</p>
                </div>
                <span className={`shrink-0 text-xs ${theme.muted}`}>{act.time}</span>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
