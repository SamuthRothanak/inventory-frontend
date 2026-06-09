import React, { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FiDollarSign,
  FiShoppingCart,
  FiCreditCard,
  FiAlertTriangle,
  FiPackage,
  FiTruck,
  FiRotateCcw,
  FiRefreshCw,
  FiActivity,
  FiBox,
  FiArrowUp,
  FiArrowDown,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiArchive,
  FiExternalLink,
  FiShoppingBag,
  FiZap,
  FiGrid,
  FiSettings,
  FiLayers,
  FiBarChart2,
  FiUser,
  FiTag,
} from "react-icons/fi";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CHART_DATA = [
  { day: "Mon",  sales: 980,  purchases: 1200, returns: 80  },
  { day: "Tue",  sales: 1240, purchases: 0,    returns: 120 },
  { day: "Wed",  sales: 860,  purchases: 3820, returns: 40  },
  { day: "Thu",  sales: 1580, purchases: 2100, returns: 200 },
  { day: "Fri",  sales: 2100, purchases: 1800, returns: 60  },
  { day: "Sat",  sales: 1680, purchases: 0,    returns: 140 },
  { day: "Sun",  sales: 920,  purchases: 960,  returns: 100 },
];

const SUMMARY_CARDS = [
  {
    label: "Today Sales",
    value: "$1,240.00",
    sub: "12 transactions",
    icon: FiDollarSign,
    accent: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    trend: "+8.4%",
    up: true,
  },
  {
    label: "Today Purchases",
    value: "$3,820.00",
    sub: "4 purchase orders",
    icon: FiShoppingCart,
    accent: "border-l-blue-500",
    iconBg: "bg-blue-500/10 text-blue-500",
    trend: "+12.1%",
    up: true,
  },
  {
    label: "Pending Payments",
    value: "$540.00",
    sub: "3 unpaid / partial",
    icon: FiCreditCard,
    accent: "border-l-amber-500",
    iconBg: "bg-amber-500/10 text-amber-500",
    trend: "-2 from yesterday",
    up: false,
  },
  {
    label: "Low Stock Items",
    value: "7",
    sub: "Need restock soon",
    icon: FiAlertTriangle,
    accent: "border-l-red-500",
    iconBg: "bg-red-500/10 text-red-500",
    trend: "+2 new alerts",
    up: false,
  },
  {
    label: "Pending Stock-In",
    value: "3",
    sub: "Waiting confirmation",
    icon: FiPackage,
    accent: "border-l-violet-500",
    iconBg: "bg-violet-500/10 text-violet-500",
    trend: "No change",
    up: null,
  },
  {
    label: "Supplier Claims",
    value: "2",
    sub: "Pending resolution",
    icon: FiTruck,
    accent: "border-l-orange-500",
    iconBg: "bg-orange-500/10 text-orange-500",
    trend: "1 overdue",
    up: false,
  },
  {
    label: "Sales Returns",
    value: "1",
    sub: "Today",
    icon: FiRotateCcw,
    accent: "border-l-rose-500",
    iconBg: "bg-rose-500/10 text-rose-500",
    trend: "$9.75 refunded",
    up: null,
  },
  {
    label: "Purchase Returns",
    value: "2",
    sub: "Pending supplier action",
    icon: FiRefreshCw,
    accent: "border-l-cyan-500",
    iconBg: "bg-cyan-500/10 text-cyan-500",
    trend: "Awaiting replacement",
    up: null,
  },
];

const ALERTS = [
  {
    type: "low_stock",
    label: "Low Stock",
    color: "text-red-500",
    bg: "bg-red-500/10",
    icon: FiAlertTriangle,
    items: [
      { name: "Coca Cola 330ml Can",  detail: "5 left · min 24"  },
      { name: "Pepsi 500ml Bottle",   detail: "2 left · min 12"  },
      { name: "Tiger Beer 330ml Can", detail: "8 left · min 24"  },
    ],
  },
  {
    type: "expiring_soon",
    label: "Expiring Soon",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    icon: FiClock,
    items: [
      { name: "Milo Tin 400g",         detail: "Batch B-2024 · 3 days" },
      { name: "Maggi Noodles 5-pack",  detail: "Batch A-2024 · 7 days" },
    ],
  },
  {
    type: "pending_stock_in",
    label: "Pending Stock-In",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    icon: FiPackage,
    items: [
      { name: "PO-031 · ABC Supplier", detail: "Received · needs confirm" },
      { name: "PO-033 · XYZ Trading",  detail: "Received · needs confirm" },
      { name: "PO-034 · Mega Import",  detail: "Received · needs confirm" },
    ],
  },
  {
    type: "supplier_claim",
    label: "Supplier Claims",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    icon: FiAlertCircle,
    items: [
      { name: "PO-028 · ABC Supplier", detail: "Damaged goods · 5 days" },
      { name: "PO-025 · XYZ Trading",  detail: "Wrong item · 12 days"  },
    ],
  },
  {
    type: "unpaid",
    label: "Unpaid / Partial",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    icon: FiCreditCard,
    items: [
      { name: "INV-004 · Sokha Mart", detail: "$83 · partial $40 paid" },
      { name: "INV-007 · Walk-in",    detail: "$22 · not paid"          },
      { name: "INV-009 · Kim Store",  detail: "$56 · partial $20 paid" },
    ],
  },
];

const RECENT_ACTIVITIES = [
  { id: 1, type: "sale",            label: "Sale Completed",          sub: "INV-012 · Walk-in · $48.50",                  time: "2 min ago",  icon: FiDollarSign,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: 2, type: "stock_in",        label: "Stock-In Confirmed",      sub: "PO-031 · ABC Supplier · 240 cans",            time: "18 min ago", icon: FiPackage,     color: "text-violet-500",  bg: "bg-violet-500/10"  },
  { id: 3, type: "purchase",        label: "Purchase Created",        sub: "PO-034 · Mega Import · $1,200",               time: "34 min ago", icon: FiShoppingCart,color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { id: 4, type: "sale_return",     label: "Sales Return Created",    sub: "SR-004 · INV-009 · $9.75 refunded",           time: "1 hr ago",   icon: FiRotateCcw,   color: "text-rose-500",    bg: "bg-rose-500/10"    },
  { id: 5, type: "purchase_return", label: "Purchase Return Created", sub: "PR-002 · PO-028 · 5 damaged units",           time: "2 hr ago",   icon: FiRefreshCw,   color: "text-orange-500",  bg: "bg-orange-500/10"  },
  { id: 6, type: "exchange_rate",   label: "Exchange Rate Updated",   sub: "1 USD = 4,050 KHR · set by Admin",           time: "3 hr ago",   icon: FiSettings,    color: "text-zinc-400",    bg: isDarkBg => isDarkBg ? "bg-zinc-700/50" : "bg-zinc-100" },
  { id: 7, type: "purchase",        label: "Purchase Confirmed",      sub: "PO-033 · XYZ Trading · $3,820",              time: "4 hr ago",   icon: FiCheckCircle, color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { id: 8, type: "sale",            label: "Sale Completed",          sub: "INV-011 · Sokha Mart · $83.00",              time: "5 hr ago",   icon: FiDollarSign,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const INVENTORY_STATS = [
  { label: "Stock on Hand",  value: "1,248 units", pct: 100, color: "bg-emerald-500" },
  { label: "Low Stock",      value: "7 items",     pct: 14,  color: "bg-amber-500"   },
  { label: "Expiring Soon",  value: "12 batches",  pct: 24,  color: "bg-orange-500"  },
  { label: "Out of Stock",   value: "3 items",     pct: 6,   color: "bg-red-500"     },
];

const PAYMENT_METHODS = [
  { label: "Cash USD",  value: "$840.00",     icon: FiDollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Cash KHR",  value: "៛1,200,000",  icon: FiTag,        color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { label: "ABA / Bank",value: "$400.00",     icon: FiCreditCard, color: "text-violet-500",  bg: "bg-violet-500/10"  },
  { label: "Pending",   value: "$540.00",     icon: FiClock,      color: "text-amber-500",   bg: "bg-amber-500/10"   },
];

const QUICK_ACTIONS = [
  { label: "Open POS",       icon: FiZap,       to: "/pos",                bg: "bg-red-500 hover:bg-red-600 text-white"                                                },
  { label: "Add Product",    icon: FiBox,       to: "/home/products",      bg: "bg-blue-600 hover:bg-blue-700 text-white"                                             },
  { label: "Add Purchase",   icon: FiShoppingCart, to: "/home/purchases",  bg: "bg-violet-600 hover:bg-violet-700 text-white"                                         },
  { label: "Inventory",      icon: FiArchive,   to: "/home/inventory",     bg: "bg-emerald-600 hover:bg-emerald-700 text-white"                                       },
  { label: "Reports",        icon: FiBarChart2, to: "/home/reports",       bg: "bg-amber-500 hover:bg-amber-600 text-white"                                           },
  { label: "Exchange Rate",  icon: FiRefreshCw, to: "/home/exchange-rate", bg: "bg-zinc-600 hover:bg-zinc-700 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600"     },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ card, theme }) {
  const Icon = card.icon;
  return (
    <div className={`rounded-2xl border border-l-4 p-5 shadow-sm transition hover:shadow-md ${theme.card} ${card.accent}`}>
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

function AlertSection({ alert, theme, isDark }) {
  const [open, setOpen] = useState(true);
  const Icon = alert.icon;
  return (
    <div className={`rounded-xl border ${theme.softCard}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:opacity-80`}
      >
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${alert.bg} ${alert.color}`}>
            <Icon />
          </span>
          <span className={`text-sm font-bold ${theme.pageTitle}`}>{alert.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${alert.bg} ${alert.color}`}>
            {alert.items.length}
          </span>
        </div>
        <span className={`text-xs ${theme.muted}`}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-1 px-4 pb-3">
          {alert.items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${isDark ? "bg-white/[0.04]" : "bg-zinc-50"}`}>
              <span className={`font-semibold ${theme.pageTitle}`}>{item.name}</span>
              <span className={theme.muted}>{item.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ act, theme, isDark }) {
  const Icon = act.icon;
  const bg = typeof act.bg === "function" ? act.bg(isDark) : act.bg;
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${bg} ${act.color}`}>
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${theme.pageTitle}`}>{act.label}</p>
        <p className={`text-xs ${theme.muted}`}>{act.sub}</p>
      </div>
      <span className={`shrink-0 text-xs ${theme.muted}`}>{act.time}</span>
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-xl text-xs ${isDark ? "border-white/10 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-900"}`}>
      <p className="mb-2 font-bold">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize font-medium" style={{ color: entry.color }}>{entry.name}</span>
          <span className="ml-auto font-bold">${Number(entry.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const theme = {
    pageTitle: isDark ? "text-white"                                 : "text-zinc-900",
    card:      isDark ? "border-white/10 bg-zinc-900 text-white"    : "border-zinc-200 bg-white text-zinc-900",
    muted:     isDark ? "text-zinc-400"                             : "text-zinc-500",
    softCard:  isDark ? "border-white/10 bg-white/[0.04]"           : "border-zinc-200 bg-white",
    tableWrap: isDark ? "border-white/10 bg-zinc-900"               : "border-zinc-200 bg-white",
    row:       isDark ? "border-white/10 text-zinc-200 hover:bg-white/[0.04]" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    section:   isDark ? "border-white/10 bg-[#18181b]"              : "border-zinc-200 bg-white",
    badge:     isDark ? "border-white/10 bg-white/5 text-zinc-300"  : "border-zinc-200 bg-zinc-100 text-zinc-600",
    gridLine:  isDark ? "#3f3f46"                                   : "#e4e4e7",
    axisColor: isDark ? "#71717a"                                   : "#a1a1aa",
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">

      {/* ── Header Greeting ─────────────────────────────────────── */}
      <div className={`flex flex-col gap-3 rounded-2xl border px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${theme.card}`}>
        <div>
          <h2 className={`text-xl font-extrabold ${theme.pageTitle}`}>Good day, Admin 👋</h2>
          <p className={`mt-1 text-sm ${theme.muted}`}>{today} · Hak Ly Mart is running smoothly.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold ${theme.badge}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            System Online
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-500">
            <FiAlertTriangle />
            7 alerts need attention
          </div>
        </div>
      </div>

      {/* ── 1. Summary Cards (8) ─────────────────────────────────── */}
      <div>
        <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>Today's Overview</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.label} card={card} theme={theme} />
          ))}
        </div>
      </div>

      {/* ── 2. Chart + Action Required ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* Chart */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>Daily Business Snapshot</h3>
              <p className={`text-xs ${theme.muted}`}>This week · Sales, Purchases and Returns (USD)</p>
            </div>
            <div className={`flex items-center gap-2 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold sm:self-auto ${theme.badge}`}>
              <FiActivity className="shrink-0" />
              Last 7 days
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={CHART_DATA} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridLine} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: theme.axisColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: theme.axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12, color: isDark ? "#a1a1aa" : "#71717a" }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="sales"     name="Sales"     fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="purchases" name="Purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Line dataKey="returns" name="Returns" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Action Required */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={`text-base font-bold ${theme.pageTitle}`}>Action Required</h3>
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {ALERTS.reduce((s, a) => s + a.items.length, 0)}
            </span>
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 272 }}>
            {ALERTS.map((alert) => (
              <AlertSection key={alert.type} alert={alert} theme={theme} isDark={isDark} />
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Quick Actions ─────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <h3 className={`mb-4 text-base font-bold ${theme.pageTitle}`}>Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-center text-sm font-semibold shadow-sm transition hover:scale-[1.03] hover:shadow-md active:scale-[0.98] ${action.bg}`}
              >
                <Icon className="text-xl" />
                <span className="text-xs leading-tight">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 4. Inventory Overview + Payment Overview ─────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Inventory Overview */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>Inventory Overview</h3>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>Current stock health at a glance</p>
            </div>
            <Link to="/home/inventory" className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 ${theme.badge}`}>
              <FiExternalLink className="text-xs" />
              View
            </Link>
          </div>
          <div className="space-y-4">
            {INVENTORY_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`text-sm font-semibold ${theme.pageTitle}`}>{stat.label}</span>
                  <span className={`text-xs font-bold ${theme.muted}`}>{stat.value}</span>
                </div>
                <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-100"}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stat.color}`}
                    style={{ width: `${stat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: "Total SKUs",   value: "48",  icon: FiBox,     color: "text-blue-500",    bg: "bg-blue-500/10"    },
              { label: "Active Batches", value: "124", icon: FiLayers,  color: "text-violet-500",  bg: "bg-violet-500/10"  },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex items-center gap-3 rounded-xl border p-3 ${theme.softCard}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                    <Icon />
                  </div>
                  <div>
                    <p className={`text-xs ${theme.muted}`}>{item.label}</p>
                    <p className={`text-lg font-bold ${theme.pageTitle}`}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Overview */}
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className={`text-base font-bold ${theme.pageTitle}`}>Today's Payment Overview</h3>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>Collected from today's sales</p>
            </div>
            <Link to="/home/sales" className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 ${theme.badge}`}>
              <FiExternalLink className="text-xs" />
              View
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              return (
                <div key={pm.label} className={`flex items-center gap-3 rounded-2xl border p-4 ${theme.softCard}`}>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${pm.bg} ${pm.color}`}>
                    <Icon />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${theme.muted}`}>{pm.label}</p>
                    <p className={`truncate text-lg font-extrabold ${theme.pageTitle}`}>{pm.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`mt-4 rounded-2xl border p-4 ${theme.softCard}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${theme.pageTitle}`}>Total Collected Today</p>
              <p className="text-lg font-extrabold text-emerald-500">$1,240.00</p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className={`text-xs ${theme.muted}`}>Pending (unpaid / partial)</p>
              <p className="text-sm font-bold text-amber-500">$540.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Recent Activities ─────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${theme.pageTitle}`}>Recent Activities</h3>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>Latest actions across the system today</p>
          </div>
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${theme.badge}`}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live
          </div>
        </div>
        <div className="space-y-4">
          {RECENT_ACTIVITIES.map((act, index) => (
            <React.Fragment key={act.id}>
              <ActivityItem act={act} theme={theme} isDark={isDark} />
              {index < RECENT_ACTIVITIES.length - 1 && (
                <div className={`ml-[17px] h-px ${isDark ? "bg-white/5" : "bg-zinc-100"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-5">
          <Link
            to="/home/reports"
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition hover:opacity-80 ${theme.badge}`}
          >
            <FiFileText />
            View Full Audit Log
          </Link>
        </div>
      </div>

    </div>
  );
}
