import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  FiActivity, FiAlertTriangle, FiArchive, FiArrowDown, FiArrowUp,
  FiBarChart2, FiBox, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign,
  FiExternalLink, FiFileText, FiLayers, FiPackage,
  FiRefreshCw, FiRotateCcw, FiShoppingCart, FiTag, FiTruck, FiZap,
} from "react-icons/fi";

import ActivityItem   from "./components/ActivityItem";
import AlertSection   from "./components/AlertSection";
import CustomTooltip  from "./components/CustomTooltip";
import { getDashboardSummaryApi } from "../../../services/dashboard.service";
import { useAuthStore } from "../../../store/authStore";

const PAYMENT_METHOD_META = {
  bank_transfer: { label: "ធនាគារ", icon: FiCreditCard, color: "text-violet-500", bg: "bg-violet-500/10" },
  qr:            { label: "QR Code", icon: FiActivity,   color: "text-pink-500",   bg: "bg-pink-500/10"   },
  card:          { label: "កាត",     icon: FiCreditCard, color: "text-blue-500",   bg: "bg-blue-500/10"   },
  other:         { label: "ផ្សេងៗ",  icon: FiTag,        color: "text-amber-500",  bg: "bg-amber-500/10"  },
};

// ── Static nav links ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "បើក POS",          icon: FiZap,         to: "/pos",                bg: "bg-red-500 hover:bg-red-600 text-white",                                              permission: "sales.create"   },
  { label: "ស្តុក",            icon: FiArchive,      to: "/home/inventory",     bg: "bg-emerald-600 hover:bg-emerald-700 text-white",                                      permission: "stock.view"     },
  { label: "បន្ថែមការទិញ",     icon: FiShoppingCart, to: "/home/purchases",     bg: "bg-blue-600 hover:bg-blue-700 text-white",                                            permission: "purchases.view" },
  { label: "បន្ថែមទំនិញ",      icon: FiBox,          to: "/home/products",      bg: "bg-violet-600 hover:bg-violet-700 text-white",                                        permission: "products.view"  },
  { label: "របាយការណ៍",        icon: FiBarChart2,    to: "/home/reports",       bg: "bg-amber-500 hover:bg-amber-600 text-white",                                          permission: "reports.sales"  },
  { label: "អត្រាប្តូរប្រាក់", icon: FiRefreshCw,    to: "/home/exchange-rate", bg: "bg-zinc-600 hover:bg-zinc-700 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600",   permission: "settings.view"  },
];

const ACTIVITY_META = {
  sale:     { icon: FiDollarSign,   color: "text-emerald-500", bg: "bg-emerald-500/10" },
  purchase: { icon: FiShoppingCart, color: "text-blue-500",    bg: "bg-blue-500/10"    },
};

// ── Helpers ───────────────────────────────────────────────────────
const fmtUsd = (n) =>
  Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n ?? 0).toLocaleString("en-US");
const formatMixedMoney = (usd, khr) => {
  const usdAmount = Number(usd ?? 0);
  const khrAmount = Number(khr ?? 0);
  const parts = [];

  if (usdAmount > 0) parts.push(`$${fmtUsd(usdAmount)}`);
  if (khrAmount > 0) parts.push(`៛${fmtInt(khrAmount)}`);

  return parts.length > 0 ? parts.join(" / ") : "$0.00";
};

const fmtCompactUsd = (value) => {
  const amount = Number(value ?? 0);

  if (Math.abs(amount) >= 1_000_000) {
    return `$${Number((amount / 1_000_000).toFixed(1))}M`;
  }

  if (Math.abs(amount) >= 1_000) {
    return `$${Number((amount / 1_000).toFixed(1))}k`;
  }

  return `$${Number(amount.toFixed(2)).toLocaleString("en-US")}`;
};

function buildChartScale(rows = []) {
  const highestValue = rows.reduce((highest, row) => Math.max(
    highest,
    Number(row?.sales ?? 0),
    Number(row?.purchases ?? 0),
  ), 0);

  if (highestValue <= 0) {
    return { max: 100, ticks: [0, 25, 50, 75, 100] };
  }

  const roughStep = highestValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const multiplier = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const step = multiplier * magnitude;
  let max = Math.ceil(highestValue / step) * step;

  if (max < highestValue * 1.1) {
    max += step;
  }

  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, index) => index * step);

  return { max, ticks };
}

function trendPct(today, yesterday) {
  if (!yesterday || yesterday === 0 || today === 0) return null;
  const pct = ((today - yesterday) / yesterday) * 100;
  return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
}

function formatKhRelativeTime(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text === "just now" || text === "now") return "ឥឡូវនេះ";

  const match = text.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i);
  if (!match) return text;

  const amount = Number(match[1]);
  const unitLabel = {
    second: "វិនាទី",
    minute: "នាទី",
    hour: "ម៉ោង",
    day: "ថ្ងៃ",
    week: "សប្ដាហ៍",
    month: "ខែ",
    year: "ឆ្នាំ",
  }[match[2].toLowerCase()] ?? match[2];

  return `${amount.toLocaleString("en-US")} ${unitLabel} មុន`;
}

// ── Sub-components ────────────────────────────────────────────────
function HeroCard({ theme, title, value, sub, icon, iconBg, trend, details = [] }) {
  const Icon = icon;
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold uppercase tracking-wide ${theme.muted}`}>{title}</p>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${iconBg}`}>
          <Icon />
        </div>
      </div>
      <h2 className={`mt-4 text-4xl font-extrabold leading-none ${theme.pageTitle}`}>{value}</h2>
      {details.length > 0 && (
        <div className={`mt-4 space-y-2 rounded-xl border p-3 ${theme.softCard}`}>
          {details.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold ${theme.muted}`}>{item.label}</span>
              <span className={`shrink-0 text-sm font-extrabold ${item.className ?? theme.pageTitle}`}>{item.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <p className={`text-sm ${theme.muted}`}>{sub}</p>
        {trend && (
          <span className={`flex max-w-[8.5rem] items-center gap-1 text-right text-xs font-bold leading-tight ${trend.up ? "text-emerald-500" : "text-red-400"}`}>
            {trend.up ? <FiArrowUp className="shrink-0 text-sm" /> : <FiArrowDown className="shrink-0 text-sm" />}
            {trend.pct}% ធៀបម្សិលមិញ
          </span>
        )}
      </div>
    </div>
  );
}

function MiniCard({ theme, label, value, icon, iconBg, accent }) {
  const Icon = icon;
  return (
    <div className={`rounded-2xl border border-l-4 p-4 shadow-sm ${theme.card} ${accent}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${iconBg}`}>
          <Icon />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${theme.muted}`}>{label}</p>
          <p className={`mt-0.5 text-2xl font-extrabold leading-none ${theme.pageTitle}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function Skeleton({ h = "h-32", theme }) {
  return (
    <div className={`animate-pulse rounded-2xl border ${theme?.card ?? "border-zinc-200 bg-white"} ${h}`} />
  );
}

function LoadingPanel({ theme, text = "រង់ចាំបន្តិច...", minH = "min-h-[180px]" }) {
  return (
    <div className={`flex ${minH} flex-col items-center justify-center rounded-2xl border ${theme.softCard}`}>
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}>
        <FiRefreshCw className={`animate-spin text-3xl ${theme.muted}`} />
      </div>
      <p className={`mt-5 text-sm font-semibold ${theme.pageTitle}`}>{text}</p>
    </div>
  );
}

export default function Dashboard() {
  const outlet = useOutletContext();
  const isDark  = outlet?.isDark ?? false;
  const can     = useAuthStore((s) => s.can);

  const theme = {
    pageTitle: isDark ? "text-white"                                  : "text-zinc-900",
    card:      isDark ? "border-white/10 bg-zinc-900 text-white"     : "border-zinc-200 bg-white text-zinc-900",
    muted:     isDark ? "text-zinc-400"                              : "text-zinc-500",
    softCard:  isDark ? "border-white/10 bg-white/[0.04]"            : "border-zinc-200 bg-white",
    badge:     isDark ? "border-white/10 bg-white/5 text-zinc-300"   : "border-zinc-200 bg-zinc-100 text-zinc-600",
    gridLine:  isDark ? "#3f3f46"                                    : "#e4e4e7",
    axisColor: isDark ? "#71717a"                                    : "#a1a1aa",
  };

  const today = new Date().toLocaleDateString("km-KH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const { data: raw, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn:  getDashboardSummaryApi,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isError && !raw) {
    const message = error?.response?.data?.message
      || error?.message
      || "មិនអាចទាញទិន្នន័យផ្ទាំងគ្រប់គ្រងបានទេ។";

    return (
      <div
        className={"flex min-h-[420px] flex-col items-center justify-center rounded-2xl border p-6 text-center shadow-sm " + theme.card}
        role="alert"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
          <FiAlertTriangle />
        </div>
        <h2 className={"mt-5 text-lg font-extrabold " + theme.pageTitle}>ទាញទិន្នន័យមិនបាន</h2>
        <p className={"mt-2 max-w-md text-sm " + theme.muted}>{message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw className={isFetching ? "animate-spin" : ""} />
          សាកល្បងម្ដងទៀត
        </button>
      </div>
    );
  }

  const source = raw?.data ?? raw ?? {};
  const d = {
    today: {
      sales_total_usd: 0,
      sales_total_khr: 0,
      sales_count: 0,
      purchases_total_usd: 0,
      purchases_total_khr: 0,
      purchases_paid_usd: 0,
      purchases_paid_khr: 0,
      purchases_count: 0,
      pending_usd: 0,
      pending_khr: 0,
      pending_count: 0,
      purchase_pending_usd: 0,
      purchase_pending_khr: 0,
      purchase_pending_count: 0,
      pending_stock_in_count: 0,
      supplier_claims_count: 0,
      sales_returns_today: 0,
      purchase_returns_pending: 0,
      ...(source.today ?? {}),
    },
    yesterday: {
      sales_total_usd: 0,
      purchases_total_usd: 0,
      ...(source.yesterday ?? {}),
    },
    inventory: {
      total_on_hand: 0,
      stock_item_count: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      expiring_soon_count: 0,
      ...(source.inventory ?? {}),
    },
    alerts: {
      low_stock: [],
      pending_stock_in: [],
      unpaid_sales: [],
      expiring_soon: [],
      ...(source.alerts ?? {}),
    },
    chart: source.chart ?? [],
    payment_breakdown: {
      cash_usd: 0,
      cash_khr: 0,
      bank_transfer_usd: 0,
      bank_transfer_khr: 0,
      qr_usd: 0,
      qr_khr: 0,
      card_usd: 0,
      card_khr: 0,
      providers: [],
      total_collected_usd: 0,
      total_collected_actual_usd: 0,
      total_collected_khr: 0,
      ...(source.payment_breakdown ?? {}),
    },
    recent_activities: source.recent_activities ?? [],
  };
  const chartScale = buildChartScale(d.chart);

  // ── Trends ───────────────────────────────────────────────────────
  const salesTrend    = trendPct(d.today.sales_total_usd, d.yesterday.sales_total_usd);
  const purchaseTrend = trendPct(d.today.purchases_total_usd, d.yesterday.purchases_total_usd);
  const stockFollowCount =
    Number(d.inventory.low_stock_count ?? 0) +
    Number(d.inventory.out_of_stock_count ?? 0) +
    Number(d.inventory.expiring_soon_count ?? d.alerts.expiring_soon.length ?? 0);
  const returnFollowCount =
    Number(d.today.sales_returns_today ?? 0) +
    Number(d.today.purchase_returns_pending ?? 0) +
    Number(d.today.supplier_claims_count ?? 0);

  // ── Secondary cards ──────────────────────────────────────────────
  const secondaryCards = [
    {
      label:  "ចាំទទួលស្តុក",
      value:  fmtInt(d.today.pending_stock_in_count),
      raw:    d.today.pending_stock_in_count,
      icon:   FiPackage,
      iconBg: "bg-violet-500/10 text-violet-500",
      accent: "border-l-violet-500",
    },
    {
      label:  "តាមដានស្តុក",
      value:  fmtInt(stockFollowCount),
      raw:    stockFollowCount,
      icon:   FiAlertTriangle,
      iconBg: stockFollowCount > 0 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500",
      accent: stockFollowCount > 0 ? "border-l-amber-500" : "border-l-emerald-500",
    },
    {
      label:  "ត្រឡប់ / ទាមទារ",
      value:  fmtInt(returnFollowCount),
      raw:    returnFollowCount,
      icon:   FiRotateCcw,
      iconBg: returnFollowCount > 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500",
      accent: returnFollowCount > 0 ? "border-l-rose-500" : "border-l-emerald-500",
    },
  ];

  // ── Alerts ───────────────────────────────────────────────────────
  const alerts = [
    d.alerts.low_stock.length > 0 && {
      type: "low_stock", label: "ស្តុកស្ទើរអស់",
      color: "text-red-500", bg: "bg-red-500/10", icon: FiAlertTriangle,
      items: d.alerts.low_stock,
    },
    d.alerts.pending_stock_in.length > 0 && {
      type: "pending_stock_in", label: "រង់ចាំទទួលស្តុក",
      color: "text-violet-500", bg: "bg-violet-500/10", icon: FiPackage,
      items: d.alerts.pending_stock_in,
    },
    d.alerts.unpaid_sales.length > 0 && {
      type: "unpaid", label: "មិនទាន់បង់ / មួយផ្នែក",
      color: "text-amber-500", bg: "bg-amber-500/10", icon: FiCreditCard,
      items: d.alerts.unpaid_sales,
    },
    d.alerts.expiring_soon.length > 0 && {
      type: "expiring_soon", label: "ជិតផុតកំណត់",
      color: "text-orange-500", bg: "bg-orange-500/10", icon: FiClock,
      items: d.alerts.expiring_soon.map((item) => ({
        ...item,
        detail: item.expired_date
          ? item.expired_date + " · សល់ " + fmtInt(item.qty_remaining)
          : item.detail,
      })),
    },
  ].filter(Boolean);

  const totalAlerts = alerts.reduce((s, a) => s + a.items.length, 0);

  // ── Payment methods ───────────────────────────────────────────────
  const legacyPaymentMethods = [
    { label: "សាច់ប្រាក់ USD", value: `$${fmtUsd(d.payment_breakdown.cash_usd)}`,          icon: FiDollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "សាច់ប្រាក់ KHR", value: `៛${fmtInt(d.payment_breakdown.cash_khr)}`,           icon: FiTag,        color: "text-blue-500",    bg: "bg-blue-500/10"    },
    { label: "ABA / ធនាគារ",   value: formatMixedMoney(d.payment_breakdown.bank_transfer_usd, d.payment_breakdown.bank_transfer_khr),  icon: FiCreditCard, color: "text-violet-500",  bg: "bg-violet-500/10"  },
    { label: "QR Code",         value: formatMixedMoney(d.payment_breakdown.qr_usd, d.payment_breakdown.qr_khr),             icon: FiActivity,   color: "text-pink-500",    bg: "bg-pink-500/10"    },
  ];

  // ── Dynamic payment provider cards ────────────────────────────────
  const providerRows = Array.isArray(d.payment_breakdown.providers)
    ? d.payment_breakdown.providers
    : [];
  const providerCards = providerRows
    .filter((row) => Number(row?.total_usd ?? 0) > 0 || Number(row?.total_khr ?? 0) > 0)
    .map((row) => {
      const meta = PAYMENT_METHOD_META[row.method] ?? PAYMENT_METHOD_META.other;
      const provider = String(row.provider ?? "").trim();

      return {
        label: provider || meta.label,
        value: formatMixedMoney(row.total_usd, row.total_khr),
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
      };
    });

  const legacyProviderCards = [
    { label: "ធនាគារ", value: formatMixedMoney(d.payment_breakdown.bank_transfer_usd, d.payment_breakdown.bank_transfer_khr), rawUsd: d.payment_breakdown.bank_transfer_usd, rawKhr: d.payment_breakdown.bank_transfer_khr, ...PAYMENT_METHOD_META.bank_transfer },
    { label: "QR Code", value: formatMixedMoney(d.payment_breakdown.qr_usd, d.payment_breakdown.qr_khr), rawUsd: d.payment_breakdown.qr_usd, rawKhr: d.payment_breakdown.qr_khr, ...PAYMENT_METHOD_META.qr },
    { label: "កាត", value: formatMixedMoney(d.payment_breakdown.card_usd, d.payment_breakdown.card_khr), rawUsd: d.payment_breakdown.card_usd, rawKhr: d.payment_breakdown.card_khr, ...PAYMENT_METHOD_META.card },
  ].filter((row) => Number(row.rawUsd ?? 0) > 0 || Number(row.rawKhr ?? 0) > 0);

  const paymentMethods = [
    legacyPaymentMethods[0],
    legacyPaymentMethods[1],
    ...(providerCards.length > 0 ? providerCards : legacyProviderCards),
  ];

  // ── Inventory bars ────────────────────────────────────────────────
  const stockItemCount = Number(d.inventory.stock_item_count ?? 0);
  const lowStockItemCount = Number(d.inventory.low_stock_count ?? 0);
  const outOfStockItemCount = Number(d.inventory.out_of_stock_count ?? 0);
  const healthyStockItemCount = Math.max(stockItemCount - lowStockItemCount - outOfStockItemCount, 0);
  const stockPercent = (count) => stockItemCount > 0
    ? Math.min(100, Math.round((count / stockItemCount) * 100))
    : 0;

  const inventoryStats = [
    { label: "មានស្តុកធម្មតា", value: fmtInt(healthyStockItemCount) + " មុខ", pct: stockPercent(healthyStockItemCount), color: "bg-emerald-500" },
    { label: "ស្តុកស្ទើរអស់", value: fmtInt(lowStockItemCount) + " មុខ", pct: stockPercent(lowStockItemCount), color: "bg-amber-500" },
    { label: "អស់ស្តុក", value: fmtInt(outOfStockItemCount) + " មុខ", pct: stockPercent(outOfStockItemCount), color: "bg-red-500" },
  ];

  // ── Recent activities ─────────────────────────────────────────────
  const recentActivities = d.recent_activities
    .map((a, i) => ({
        id: i,
        ...(ACTIVITY_META[a.type] ?? { icon: FiActivity, color: "text-zinc-400", bg: "bg-zinc-100" }),
        label: a.label, sub: a.sub, time: formatKhRelativeTime(a.time),
      }));

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={`flex flex-col gap-3 rounded-2xl border px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${theme.card}`}>
        <div>
          <h2 className={`text-xl font-extrabold ${theme.pageTitle}`}>ទិដ្ឋភាពហាងប្រចាំថ្ងៃ</h2>
          <p className={`mt-1 text-sm ${theme.muted}`}>{today} - ការលក់ ស្តុក និងស្ថានភាពសាច់ប្រាក់</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold ${theme.badge}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ប្រព័ន្ធដំណើរការ
          </div>
          {!isLoading && totalAlerts > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-500">
              <FiAlertTriangle className="shrink-0" />
              {totalAlerts} ត្រូវការចាត់វិធានការ
            </div>
          )}
        </div>
      </div>

      {/* ── Hero Cards (Sales + Purchases) ───────────────────────────── */}
      <div>
        <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ទិដ្ឋភាពសម្រាប់ថ្ងៃនេះ</p>
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <Skeleton h="h-40" theme={theme} />
            <Skeleton h="h-40" theme={theme} />
            <Skeleton h="h-40" theme={theme} />
            <Skeleton h="h-40" theme={theme} />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <HeroCard
              theme={theme}
              title="ការលក់ថ្ងៃនេះ"
              value={`$${fmtUsd(d?.today.sales_total_usd)}`}
              sub={`${fmtInt(d?.today.sales_count)} វិក្កយបត្រលក់`}
              icon={FiDollarSign}
              iconBg="bg-emerald-500/10 text-emerald-500"
              trend={salesTrend}
              details={[
                { label: "សរុប KHR", value: `៛${fmtInt(d?.today.sales_total_khr)}` },
                { label: "សរុបជា USD", value: `$${fmtUsd(d?.today.sales_total_usd)}`, className: "text-emerald-500" },
              ]}
            />
            <HeroCard
              theme={theme}
              title="ទិញចូលថ្ងៃនេះ"
              value={`$${fmtUsd(d?.today.purchases_total_usd)}`}
              sub={`${fmtInt(d?.today.purchases_count)} វិក្កយបត្រទិញ`}
              icon={FiShoppingCart}
              iconBg="bg-blue-500/10 text-blue-500"
              trend={purchaseTrend}
              details={[
                { label: "បានបង់ USD", value: `$${fmtUsd(d?.today.purchases_paid_usd)}` },
                { label: "បានបង់ KHR", value: `៛${fmtInt(d?.today.purchases_paid_khr)}` },
              ]}
            />
            <HeroCard
              theme={theme}
              title="ប្រមូលបានសុទ្ធថ្ងៃនេះ"
              value={`$${fmtUsd(d?.payment_breakdown.total_collected_usd)}`}
              sub="ក្រោយដកលុយអាប់"
              icon={FiDollarSign}
              iconBg="bg-emerald-500/10 text-emerald-500"
              trend={null}
              details={[
                { label: "ទទួល USD", value: `$${fmtUsd(d?.payment_breakdown.total_collected_actual_usd)}` },
                { label: "ទទួល KHR", value: `៛${fmtInt(d?.payment_breakdown.total_collected_khr)}` },
              ]}
            />
            <div className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold uppercase tracking-wide ${theme.muted}`}>ជំពាក់បច្ចុប្បន្ន</p>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-xl text-amber-500">
                  <FiCreditCard />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className={`text-xs font-semibold ${theme.muted}`}>អតិថិជនជំពាក់យើង</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className={`text-3xl font-extrabold leading-none ${theme.pageTitle}`}>${fmtUsd(d?.today.pending_usd)}</p>
                    <p className={`shrink-0 text-xs ${theme.muted}`}>{fmtInt(d?.today.pending_count)} វិក្កយបត្រ</p>
                  </div>
                  <p className={`mt-1 text-xs font-semibold ${theme.muted}`}>KHR: ៛{fmtInt(d?.today.pending_khr)}</p>
                </div>
                <div className={`border-t pt-3 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                  <p className={`text-xs font-semibold ${theme.muted}`}>យើងជំពាក់អ្នកផ្គត់ផ្គង់</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="text-xl font-extrabold leading-none text-amber-500">${fmtUsd(d?.today.purchase_pending_usd)}</p>
                    <p className={`shrink-0 text-xs ${theme.muted}`}>{fmtInt(d?.today.purchase_pending_count)} បញ្ជាទិញ</p>
                  </div>
                  <p className={`mt-1 text-xs font-semibold ${theme.muted}`}>KHR: ៛{fmtInt(d?.today.purchase_pending_khr)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Secondary Cards ──────────────────────────────────────────── */}
      {!isLoading && secondaryCards.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {secondaryCards.map((c) => (
            <MiniCard key={c.label} theme={theme} label={c.label} value={c.value} icon={c.icon} iconBg={c.iconBg} accent={c.accent} />
          ))}
        </div>
      )}

      {/* ── Chart + Action Required ───────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">

        {/* Chart */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>និន្នាការលក់ & ទិញតាមម៉ោង</h3>
              <p className={`text-xs ${theme.muted}`}>ថ្ងៃនេះ - ពី 6 AM ដល់ 6 PM ជា USD សរុប</p>
            </div>
            <div className={`flex items-center gap-2 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold sm:self-auto ${theme.badge}`}>
              <FiActivity className="shrink-0" />
              <span>ថ្ងៃនេះ</span>
              <span className={`border-l pl-2 ${isDark ? "border-white/10" : "border-zinc-300"}`}>
                ដល់ {fmtCompactUsd(chartScale.max)}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={d?.chart ?? []} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridLine} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: theme.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: theme.axisColor, fontSize: 11 }}
                axisLine={false} tickLine={false}
                domain={[0, chartScale.max]}
                ticks={chartScale.ticks}
                tickFormatter={fmtCompactUsd}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: isDark ? "#a1a1aa" : "#71717a" }} iconType="circle" iconSize={8} />
              <Bar dataKey="sales"     name="ការលក់" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="purchases" name="ការទិញ" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Action Required — detail */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={`text-base font-bold ${theme.pageTitle}`}>ត្រូវការចាត់វិធានការ</h3>
            {totalAlerts > 0 && (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">{totalAlerts}</span>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 300 }}>
            {isLoading ? (
              <LoadingPanel theme={theme} minH="min-h-[220px]" />
            ) : alerts.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-10 text-center ${theme.muted}`}>
                <FiCheckCircle className="text-3xl text-emerald-500" />
                <p className="mt-2 text-sm font-semibold">គ្មានបញ្ហា!</p>
                <p className="text-xs">មិនមានអ្វីត្រូវចាត់វិធានការ។</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertSection key={alert.type} alert={alert} theme={theme} isDark={isDark} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions (admin only — hidden if fewer than 3 actions visible) ── */}
      {QUICK_ACTIONS.filter((a) => can(a.permission)).length >= 3 && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <h3 className={`mb-4 text-base font-bold ${theme.pageTitle}`}>ប្រតិបត្តិការទូទៅ</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.filter((a) => can(a.permission)).map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-center shadow-sm transition hover:scale-[1.03] hover:shadow-md active:scale-[0.98] ${action.bg}`}
                >
                  <Icon className="text-xl" />
                  <span className="text-xs font-semibold leading-tight">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Inventory + Payment ──────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Inventory */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>ស្ថានភាពស្តុក</h3>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>បរិមាណស្តុក ស្តុកស្ទើរអស់ និងការផុតកំណត់</p>
            </div>
            <Link to="/home/inventory" className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 ${theme.badge}`}>
              <FiExternalLink className="text-xs" /> មើល
            </Link>
          </div>
          {isLoading ? (
            <LoadingPanel theme={theme} minH="min-h-[180px]" />
          ) : (
            <div className="space-y-4">
              {inventoryStats.map((stat) => (
                <div key={stat.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${theme.pageTitle}`}>{stat.label}</span>
                    <span className={`text-xs font-bold ${theme.muted}`}>{stat.value}</span>
                  </div>
                  <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-100"}`}>
                    <div className={`h-full rounded-full transition-all duration-500 ${stat.color}`} style={{ width: `${stat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "ស្តុករួម",       value: isLoading ? "-" : fmtInt(d.inventory.total_on_hand), icon: FiBox,    color: "text-blue-500",   bg: "bg-blue-500/10"  },
              { label: "ស្តុកស្ទើរអស់", value: isLoading ? "-" : fmtInt(d.inventory.low_stock_count), icon: FiLayers, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "ជិតផុតកំណត់",   value: isLoading ? "-" : fmtInt(d.inventory.expiring_soon_count ?? d.alerts.expiring_soon.length), icon: FiClock, color: "text-orange-500", bg: "bg-orange-500/10" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex items-center gap-3 rounded-xl border p-3 ${theme.softCard}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}><Icon /></div>
                  <div>
                    <p className={`text-xs ${theme.muted}`}>{item.label}</p>
                    <p className={`text-lg font-bold ${theme.pageTitle}`}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>ការប្រមូលសុទ្ធថ្ងៃនេះ</h3>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>សាច់ប្រាក់ ធនាគារ និង QR ក្រោយដកលុយអាប់</p>
            </div>
            {can("sales.view") && (
              <Link to="/home/sales" className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 ${theme.badge}`}>
                <FiExternalLink className="text-xs" /> មើល
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {isLoading
              ? <div className="col-span-2"><LoadingPanel theme={theme} minH="min-h-[180px]" /></div>
              : paymentMethods.map((pm, index) => {
                  const Icon = pm.icon;
                  const isLastOddCard = paymentMethods.length % 2 === 1 && index === paymentMethods.length - 1;
                  return (
                    <div key={pm.label} className={`flex items-center gap-3 rounded-2xl border p-4 ${isLastOddCard ? "col-span-2" : ""} ${theme.softCard}`}>
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${pm.bg} ${pm.color}`}><Icon /></div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${theme.muted}`}>{pm.label}</p>
                        <p className={`truncate text-lg font-extrabold ${theme.pageTitle}`}>{pm.value}</p>
                      </div>
                    </div>
                  );
                })
            }
          </div>
          <div className={`mt-4 rounded-2xl border p-4 ${theme.softCard}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${theme.pageTitle}`}>សរុបប្រមូលបានសុទ្ធថ្ងៃនេះ</p>
              <p className="text-lg font-extrabold text-emerald-500">
                {isLoading ? "-" : `$${fmtUsd(d?.payment_breakdown.total_collected_usd)}`}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className={`text-xs ${theme.muted}`}>អតិថិជនជំពាក់យើង</p>
              <p className="text-sm font-bold text-amber-500">
                {isLoading ? "-" : `$${fmtUsd(d?.today.pending_usd)}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Activities ─────────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${theme.pageTitle}`}>សកម្មភាពអាជីវកម្មថ្មីៗ</h3>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>ការលក់ ទិញ ការទូទាត់ និងព្រឹត្តិការណ៍ស្តុកថ្មីៗ</p>
          </div>
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${theme.badge}`}>
            <FiClock className="shrink-0" />
            ទិន្នន័យថ្មីៗ
          </div>
        </div>
        {isLoading ? (
          <LoadingPanel theme={theme} minH="min-h-[220px]" />
        ) : recentActivities.length === 0 ? (
          <p className={`py-6 text-center text-sm ${theme.muted}`}>មិនមានសកម្មភាពថ្មីៗ។</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((act, index) => (
              <React.Fragment key={act.id}>
                <ActivityItem act={act} theme={theme} isDark={isDark} />
                {index < recentActivities.length - 1 && (
                  <div className={`ml-4 h-px ${isDark ? "bg-white/5" : "bg-zinc-100"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {can("reports.sales") && (
          <div className="mt-5">
            <Link to="/home/reports" className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition hover:opacity-80 ${theme.badge}`}>
              <FiFileText /> មើលរបាយការណ៍ទាំងអស់
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
