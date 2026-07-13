import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArchive,
  FiBarChart2,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiRotateCcw,
  FiSettings,
  FiShoppingCart,
  FiTag,
  FiTruck,
  FiZap,
} from "react-icons/fi";

export const CHART_DATA = [
  { day: "Mon",  sales: 980,  purchases: 1200, returns: 80  },
  { day: "Tue",  sales: 1240, purchases: 0,    returns: 120 },
  { day: "Wed",  sales: 860,  purchases: 3820, returns: 40  },
  { day: "Thu",  sales: 1580, purchases: 2100, returns: 200 },
  { day: "Fri",  sales: 2100, purchases: 1800, returns: 60  },
  { day: "Sat",  sales: 1680, purchases: 0,    returns: 140 },
  { day: "Sun",  sales: 920,  purchases: 960,  returns: 100 },
];

export const SUMMARY_CARDS = [
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

export const ALERTS = [
  {
    type: "low_stock",
    label: "Low Stock",
    color: "text-red-500",
    bg: "bg-red-500/10",
    icon: FiAlertTriangle,
    items: [
      { name: "Coca Cola 330ml Can",  detail: "5 left Â· min 24"  },
      { name: "Pepsi 500ml Bottle",   detail: "2 left Â· min 12"  },
      { name: "Tiger Beer 330ml Can", detail: "8 left Â· min 24"  },
    ],
  },
  {
    type: "expiring_soon",
    label: "Expiring Soon",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    icon: FiClock,
    items: [
      { name: "Milo Tin 400g",         detail: "Batch B-2024 Â· 3 days" },
      { name: "Maggi Noodles 5-pack",  detail: "Batch A-2024 Â· 7 days" },
    ],
  },
  {
    type: "pending_stock_in",
    label: "Pending Stock-In",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    icon: FiPackage,
    items: [
      { name: "PO-031 Â· ABC Supplier", detail: "Received Â· needs confirm" },
      { name: "PO-033 Â· XYZ Trading",  detail: "Received Â· needs confirm" },
      { name: "PO-034 Â· Mega Import",  detail: "Received Â· needs confirm" },
    ],
  },
  {
    type: "supplier_claim",
    label: "Supplier Claims",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    icon: FiAlertCircle,
    items: [
      { name: "PO-028 Â· ABC Supplier", detail: "Damaged goods Â· 5 days" },
      { name: "PO-025 Â· XYZ Trading",  detail: "Wrong item Â· 12 days"  },
    ],
  },
  {
    type: "unpaid",
    label: "Unpaid / Partial",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    icon: FiCreditCard,
    items: [
      { name: "INV-004 Â· Sokha Mart", detail: "$83 Â· partial $40 paid" },
      { name: "INV-007 Â· Walk-in",    detail: "$22 Â· not paid"          },
      { name: "INV-009 Â· Kim Store",  detail: "$56 Â· partial $20 paid" },
    ],
  },
];

export const RECENT_ACTIVITIES = [
  { id: 1, type: "sale",            label: "Sale Completed",          sub: "INV-012 Â· Walk-in Â· $48.50",                  time: "2 min ago",  icon: FiDollarSign,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: 2, type: "stock_in",        label: "Stock-In Confirmed",      sub: "PO-031 Â· ABC Supplier Â· 240 cans",            time: "18 min ago", icon: FiPackage,     color: "text-violet-500",  bg: "bg-violet-500/10"  },
  { id: 3, type: "purchase",        label: "Purchase Created",        sub: "PO-034 Â· Mega Import Â· $1,200",               time: "34 min ago", icon: FiShoppingCart,color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { id: 4, type: "sale_return",     label: "Sales Return Created",    sub: "SR-004 Â· INV-009 Â· $9.75 refunded",           time: "1 hr ago",   icon: FiRotateCcw,   color: "text-rose-500",    bg: "bg-rose-500/10"    },
  { id: 5, type: "purchase_return", label: "Purchase Return Created", sub: "PR-002 Â· PO-028 Â· 5 damaged units",           time: "2 hr ago",   icon: FiRefreshCw,   color: "text-orange-500",  bg: "bg-orange-500/10"  },
  { id: 6, type: "exchange_rate",   label: "Exchange Rate Updated",   sub: "1 USD = 4,050 KHR Â· set by Admin",           time: "3 hr ago",   icon: FiSettings,    color: "text-zinc-400",    bg: isDarkBg => isDarkBg ? "bg-zinc-700/50" : "bg-zinc-100" },
  { id: 7, type: "purchase",        label: "Purchase Confirmed",      sub: "PO-033 Â· XYZ Trading Â· $3,820",              time: "4 hr ago",   icon: FiCheckCircle, color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { id: 8, type: "sale",            label: "Sale Completed",          sub: "INV-011 Â· Sokha Mart Â· $83.00",              time: "5 hr ago",   icon: FiDollarSign,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export const INVENTORY_STATS = [
  { label: "Stock on Hand",  value: "1,248 units", pct: 100, color: "bg-emerald-500" },
  { label: "Low Stock",      value: "7 items",     pct: 14,  color: "bg-amber-500"   },
  { label: "Expiring Soon",  value: "12 batches",  pct: 24,  color: "bg-orange-500"  },
  { label: "Out of Stock",   value: "3 items",     pct: 6,   color: "bg-red-500"     },
];

export const PAYMENT_METHODS = [
  { label: "Cash USD",  value: "$840.00",     icon: FiDollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Cash KHR",  value: "áŸ›1,200,000",  icon: FiTag,        color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { label: "ABA / Bank",value: "$400.00",     icon: FiCreditCard, color: "text-violet-500",  bg: "bg-violet-500/10"  },
  { label: "Pending",   value: "$540.00",     icon: FiClock,      color: "text-amber-500",   bg: "bg-amber-500/10"   },
];

export const QUICK_ACTIONS = [
  { label: "Open POS",       icon: FiZap,       to: "/pos",                bg: "bg-red-500 hover:bg-red-600 text-white"                                                },
  { label: "Add Product",    icon: FiBox,       to: "/home/products",      bg: "bg-blue-600 hover:bg-blue-700 text-white"                                             },
  { label: "Add Purchase",   icon: FiShoppingCart, to: "/home/purchases",  bg: "bg-violet-600 hover:bg-violet-700 text-white"                                         },
  { label: "Inventory",      icon: FiArchive,   to: "/home/inventory",     bg: "bg-emerald-600 hover:bg-emerald-700 text-white"                                       },
  { label: "Reports",        icon: FiBarChart2, to: "/home/reports",       bg: "bg-amber-500 hover:bg-amber-600 text-white"                                           },
  { label: "Exchange Rate",  icon: FiRefreshCw, to: "/home/exchange-rate", bg: "bg-zinc-600 hover:bg-zinc-700 text-white dark:bg-zinc-700 dark:hover:bg-zinc-600"     },
];

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


