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

function trendPct(today, yesterday) {
  if (!yesterday || yesterday === 0 || today === 0) return null;
  const pct = ((today - yesterday) / yesterday) * 100;
  return { pct: Math.abs(pct).toFixed(1), up: pct >= 0 };
}

// ── Sub-components ────────────────────────────────────────────────
function HeroCard({ theme, title, value, sub, icon, iconBg, trend }) {
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
      <div className="mt-3 flex items-center justify-between">
        <p className={`text-sm ${theme.muted}`}>{sub}</p>
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-bold ${trend.up ? "text-emerald-500" : "text-red-400"}`}>
            {trend.up ? <FiArrowUp className="shrink-0" /> : <FiArrowDown className="shrink-0" />}
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
      sales_count: 0,
      purchases_total_usd: 0,
      purchases_count: 0,
      pending_usd: 0,
      pending_count: 0,
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
      qr_usd: 0,
      total_collected_usd: 0,
      ...(source.payment_breakdown ?? {}),
    },
    recent_activities: source.recent_activities ?? [],
  };

  // ── Trends ───────────────────────────────────────────────────────
  const salesTrend    = trendPct(d.today.sales_total_usd, d.yesterday.sales_total_usd);
  const stockWorkCount =
    Number(d.today.pending_stock_in_count ?? 0) +
    Number(d.today.supplier_claims_count ?? 0) +
    Number(d.inventory.low_stock_count ?? 0) +
    Number(d.inventory.expiring_soon_count ?? d.alerts.expiring_soon.length ?? 0);

  // ── Secondary cards (hide if rawValue === 0) ─────────────────────
  const secondaryCards = [
    {
      label:  "ស្តុកស្ទើរអស់",
      value:  fmtInt(d.inventory.low_stock_count),
      raw:    d.inventory.low_stock_count,
      icon:   FiAlertTriangle,
      iconBg: "bg-red-500/10 text-red-500",
      accent: "border-l-red-500",
    },
    {
      label:  "រង់ចាំទទួលស្តុក",
      value:  fmtInt(d.today.pending_stock_in_count),
      raw:    d.today.pending_stock_in_count,
      icon:   FiPackage,
      iconBg: "bg-violet-500/10 text-violet-500",
      accent: "border-l-violet-500",
    },
    {
      label:  "ការទាមទារ​អ្នកផ្គត់ផ្គង់",
      value:  fmtInt(d.today.supplier_claims_count),
      raw:    d.today.supplier_claims_count,
      icon:   FiTruck,
      iconBg: "bg-orange-500/10 text-orange-500",
      accent: "border-l-orange-500",
    },
    {
      label:  "ជិតផុតកំណត់",
      value:  fmtInt(d.inventory.expiring_soon_count ?? d.alerts.expiring_soon.length),
      raw:    Number(d.inventory.expiring_soon_count ?? d.alerts.expiring_soon.length ?? 0),
      icon:   FiClock,
      iconBg: "bg-amber-500/10 text-amber-500",
      accent: "border-l-amber-500",
    },
    {
      label:  "ត្រឡប់ ការលក់",
      value:  fmtInt(d.today.sales_returns_today),
      raw:    d.today.sales_returns_today,
      icon:   FiRotateCcw,
      iconBg: "bg-rose-500/10 text-rose-500",
      accent: "border-l-rose-500",
    },
    {
      label:  "ត្រឡប់ ការទិញ",
      value:  fmtInt(d.today.purchase_returns_pending),
      raw:    d.today.purchase_returns_pending,
      icon:   FiRefreshCw,
      iconBg: "bg-cyan-500/10 text-cyan-500",
      accent: "border-l-cyan-500",
    },
  ].filter((card) => Number(card.raw ?? 0) > 0);

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
  const paymentMethods = [
    { label: "សាច់ប្រាក់ USD", value: `$${fmtUsd(d.payment_breakdown.cash_usd)}`,          icon: FiDollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "សាច់ប្រាក់ KHR", value: `៛${fmtInt(d.payment_breakdown.cash_khr)}`,           icon: FiTag,        color: "text-blue-500",    bg: "bg-blue-500/10"    },
    { label: "ABA / ធនាគារ",   value: `$${fmtUsd(d.payment_breakdown.bank_transfer_usd)}`,  icon: FiCreditCard, color: "text-violet-500",  bg: "bg-violet-500/10"  },
    { label: "QR Code",         value: `$${fmtUsd(d.payment_breakdown.qr_usd)}`,             icon: FiActivity,   color: "text-pink-500",    bg: "bg-pink-500/10"    },
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
        label: a.label, sub: a.sub, time: a.time,
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
              sub={`${fmtInt(d?.today.sales_count)} ប្រតិបត្តិការ`}
              icon={FiDollarSign}
              iconBg="bg-emerald-500/10 text-emerald-500"
              trend={salesTrend}
            />
            <HeroCard
              theme={theme}
              title="ប្រមូលបានថ្ងៃនេះ"
              value={`$${fmtUsd(d?.payment_breakdown.total_collected_usd)}`}
              sub="សាច់ប្រាក់ ធនាគារ និង QR"
              icon={FiDollarSign}
              iconBg="bg-emerald-500/10 text-emerald-500"
              trend={null}
            />
            <HeroCard
              theme={theme}
              title="មិនទាន់បង់ / មួយផ្នែក"
              value={`$${fmtUsd(d?.today.pending_usd)}`}
              sub={`${fmtInt(d?.today.pending_count)} មិនទាន់បង់ / មួយផ្នែក`}
              icon={FiCreditCard}
              iconBg="bg-amber-500/10 text-amber-500"
              trend={null}
            />
            <HeroCard
              theme={theme}
              title="ការងារស្តុក"
              value={fmtInt(stockWorkCount)}
              sub="ស្តុកចូល ការទាមទារ ស្តុកស្ទើរអស់ ផុតកំណត់"
              icon={FiPackage}
              iconBg="bg-blue-500/10 text-blue-500"
              trend={null}
            />
          </div>
        )}
      </div>

      {/* ── Secondary Cards (hide if 0) ──────────────────────────────── */}
      {!isLoading && secondaryCards.length > 0 && (
        <div className={`grid gap-3 sm:grid-cols-2 ${
          secondaryCards.length <= 2 ? "lg:grid-cols-2" :
          secondaryCards.length <= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-6"
        }`}>
          {secondaryCards.map((c) => (
            <MiniCard key={c.label} theme={theme} label={c.label} value={c.value} icon={c.icon} iconBg={c.iconBg} accent={c.accent} />
          ))}
        </div>
      )}

      {/* ── Chart + Action Required ───────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

        {/* Chart */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>និន្នាការលក់ & ទិញប្រចាំថ្ងៃ</h3>
              <p className={`text-xs ${theme.muted}`}>សប្ដាហ៍នេះ - ការប្រែប្រួលនៃការលក់ និងទិញជា USD</p>
            </div>
            <div className={`flex items-center gap-2 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold sm:self-auto ${theme.badge}`}>
              <FiActivity className="shrink-0" />
              សប្ដាហ៍នេះ
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={d?.chart ?? []} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridLine} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: theme.axisColor, fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => ({ Sun: "អាទិត្យ", Mon: "ច័ន្ទ", Tue: "អង្គារ", Wed: "ពុធ", Thu: "ព្រ.ហ", Fri: "សុក្រ", Sat: "សៅរ៏" }[v] ?? v)} />
              <YAxis
                tick={{ fill: theme.axisColor, fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
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
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 256 }}>
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
              { label: "ស្តុករួម",       value: d ? fmtInt(d.inventory.total_on_hand) : "-", icon: FiBox,    color: "text-blue-500",   bg: "bg-blue-500/10"  },
              { label: "ស្តុកស្ទើរអស់", value: d ? fmtInt(d.inventory.low_stock_count) : "-", icon: FiLayers, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "ជិតផុតកំណត់",   value: d ? fmtInt(d.inventory.expiring_soon_count ?? d.alerts.expiring_soon.length) : "-", icon: FiClock, color: "text-orange-500", bg: "bg-orange-500/10" },
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
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>ការប្រមូលថ្ងៃនេះ</h3>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>សាច់ប្រាក់ ធនាគារ និង QR ទទួលបានថ្ងៃនេះ</p>
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
              : paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <div key={pm.label} className={`flex items-center gap-3 rounded-2xl border p-4 ${theme.softCard}`}>
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
              <p className={`text-sm font-bold ${theme.pageTitle}`}>សរុបប្រមូលបានថ្ងៃនេះ</p>
              <p className="text-lg font-extrabold text-emerald-500">
                {isLoading ? "-" : `$${fmtUsd(d?.payment_breakdown.total_collected_usd)}`}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className={`text-xs ${theme.muted}`}>រង់ចាំ (មិនទាន់បង់ / មួយផ្នែក)</p>
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
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            ផ្ទាល់
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
