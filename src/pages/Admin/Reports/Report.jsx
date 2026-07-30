import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  ComposedChart,
  FunnelChart,
  Funnel,
  LabelList,
  PieChart,
  Pie,
  Cell,
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
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiFilter,
  FiGrid,
  FiPackage,
  FiRotateCcw,
  FiShoppingCart,
  FiTag,
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
} from "./utils/reportExport";
import { exportReportExcel } from "./utils/reportExcelExport";
import { exportReportPdf } from "./utils/reportPdfExport";
import { getReportSummaryApi } from "../../../services/report.service";
import { getStoredShopInfo } from "../../../utils/shopInfo";
import { formatCondition, formatResolutionType } from "../Purcheases/utils/purchaseUtils";
import { adjustmentReasons } from "../Inventory/utils/inventoryConstants";
import { InventoryDropdown } from "../Inventory/components/InventoryCommon";

const METHOD_LABEL = {
  cash: "សាច់ប្រាក់",
  bank_transfer: "ធនាគារ / QR",
  qr: "ធនាគារ / QR",
  card: "កាត",
  other: "ផ្សេងទៀត",
};

const PAYMENT_STATUS_LABEL = {
  paid: "បានបង់",
  unpaid: "មិនទាន់បង់",
  partial: "បង់ខ្លះ",
  pending: "រង់ចាំបង់",
  refunded: "បានសងប្រាក់",
};

const paymentStatusLabel = (value) => PAYMENT_STATUS_LABEL[String(value || "").toLowerCase()] ?? value ?? "";

const STATUS_LABEL = {
  received: "បានទទួល",
  expiring_soon: "ជិតផុតកំណត់",
  active: "កំពុងប្រើ",
  pending: "រង់ចាំ",
  completed: "បានបញ្ចប់",
  cancelled: "បានបោះបង់",
  expired: "ផុតកំណត់",
  // Purchase status (Purchases module's own STATUS_LABEL, same Khmer wording)
  draft: "ព្រាង",
  pending_receive: "រង់ចាំទទួលទំនិញ",
  pending_stock_in: "រង់ចាំបញ្ចូលក្នុងស្តុក",
  pending_claim: "រង់ចាំការទាមទារ",
  // Purchase return resolution_status (Purchases module's own RETURN_STATUS_LABEL)
  submitted: "រង់ចាំដំណោះស្រាយ",
  approved: "កំពុងដោះស្រាយ",
  waiting_replacement: "រង់ចាំជំនួស",
  rejected: "បានបដិសេធ",
  resolved: "ដោះស្រាយរួច",
};

const statusLabel = (value) => STATUS_LABEL[String(value || "").toLowerCase()] ?? value ?? "";

// Same Khmer wording as Inventory module's own adjustment-type filter options.
const ADJUSTMENT_TYPE_LABEL = { increase: "បន្ថែម", decrease: "កាត់" };
const adjustmentTypeLabel = (value) => ADJUSTMENT_TYPE_LABEL[String(value || "").toLowerCase()] ?? value ?? "";

// Reuses Inventory module's canonical `adjustmentReasons` list (utils/inventoryConstants.js)
// rather than inventing a second Khmer wording for the same reason codes.
const ADJUSTMENT_REASON_LABEL = Object.fromEntries(adjustmentReasons.map((r) => [r.value, r.label]));
const adjustmentReasonLabel = (value) => ADJUSTMENT_REASON_LABEL[String(value || "").toLowerCase()] ?? value ?? "";

const STOCK_SOURCE_LABEL = { purchase: "ការទិញចូល", sales_return: "ត្រឡប់ការលក់" };
const stockSourceLabel = (value) => STOCK_SOURCE_LABEL[String(value || "").toLowerCase()] ?? value ?? "";

const BANK_PROVIDER_META = {
  aba: { name: "ABA", subLabel: "ទូទាត់តាម ABA", order: 1 },
  acleda: { name: "ACLEDA", subLabel: "ទូទាត់តាម ACLEDA", order: 2 },
  bakong: { name: "Bakong", subLabel: "ទូទាត់តាម Bakong", order: 3 },
  wing: { name: "Wing", subLabel: "ទូទាត់តាម Wing", order: 4 },
};
const PAYMENT_DONUT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#f43f5e"];
const EMPTY_LIST = [];
const REPORT_TABLE_PREVIEW_LIMIT = 10;
const CHART_GROUP_BY_PERIOD = {
  "ថ្ងៃនេះ": "hour",
  "សប្ដាហ៍": "day",
  "ខែ": "month_week",
  "ឆ្នាំ": "month",
  "ផ្ទាល់ខ្លួន": "auto",
};

const REPORT_TYPE_OPTIONS = {
  sales: [
    { key: "all", label: "ទាំងអស់" },
    { key: "summary", label: "សង្ខេបការលក់" },
    { key: "details", label: "លម្អិតការលក់" },
    { key: "product", label: "លក់តាមទំនិញ" },
    { key: "customer", label: "លក់តាមអតិថិជន" },
    { key: "cashier", label: "លក់តាមអ្នកលក់" },
    { key: "return", label: "ការត្រឡប់ការលក់" },
    { key: "profit", label: "ប្រាក់ចំណេញ" },
  ],
  purchases: [
    { key: "all", label: "ទាំងអស់" },
    { key: "summary", label: "សង្ខេបការទិញ" },
    { key: "details", label: "លម្អិតការទិញ" },
    { key: "product", label: "ទិញតាមទំនិញ" },
    { key: "supplier", label: "ទិញតាមអ្នកផ្គត់ផ្គង់" },
    { key: "supplier_due", label: "មិនទាន់បង់អ្នកផ្គត់ផ្គង់" },
    { key: "return", label: "ការត្រឡប់ការទិញ" },
  ],
  inventory: [
    { key: "all", label: "ទាំងអស់" },
    { key: "current", label: "ស្តុកបច្ចុប្បន្ន" },
    { key: "movement", label: "ចលនាស្តុក" },
    { key: "low_stock", label: "ស្តុកស្ទើរអស់" },
    { key: "out_of_stock", label: "ស្តុកអស់" },
    { key: "valuation", label: "តម្លៃស្តុក" },
    { key: "batch_expiry", label: "Batch/ផុតកំណត់" },
    { key: "adjustment", label: "កែតម្រូវស្តុក" },
    { key: "damaged", label: "ស្តុកខូច" },
  ],
  financial: [
    { key: "all", label: "ទាំងអស់" },
    { key: "profit", label: "ប្រាក់ចំណេញ" },
    { key: "customer_due", label: "អតិថិជនមិនទាន់ទូទាត់" },
    { key: "supplier_due", label: "មិនទាន់បង់អ្នកផ្គត់ផ្គង់" },
    { key: "payments", label: "ប្រតិបត្តិការទូទាត់" },
    { key: "cash_flow", label: "លុយចូល/ចេញ" },
  ],
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

const cleanRepeatedProductName = (value) => {
  const words = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words.join(" ");

  const adjacentCleaned = words.filter((word, index) => (
    index === 0 || word.toLowerCase() !== words[index - 1].toLowerCase()
  ));

  for (let size = Math.floor(adjacentCleaned.length / 2); size >= 1; size -= 1) {
    const first = adjacentCleaned.slice(0, size).join(" ").toLowerCase();
    const second = adjacentCleaned.slice(size, size * 2).join(" ").toLowerCase();

    if (first === second) {
      return [
        ...adjacentCleaned.slice(0, size),
        ...adjacentCleaned.slice(size * 2),
      ].join(" ");
    }
  }

  return adjacentCleaned.join(" ");
};

const getReportTablePageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

export default function Report() {
  const outlet    = useOutletContext();
  const isDark    = outlet?.isDark ?? false;
  const today     = toLocalDateValue(new Date());
  const monthStart = today.slice(0, 8) + "01";

  const [dateFrom,    setDateFrom]    = useState(monthStart);
  const [dateTo,      setDateTo]      = useState(today);
  const [chartPeriod, setChartPeriod] = useState("ខែ");
  const [followUpTab, setFollowUpTab] = useState("purchase");
  const [reportTab,   setReportTab]   = useState("overview");
  const [reportType,  setReportType]  = useState({
    sales: "all",
    purchases: "all",
    inventory: "all",
    financial: "all",
  });
  const [tablePages, setTablePages] = useState({});
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
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: !dateRangeError,
  });

  const d = raw?.data ?? null;
  const stats         = d?.stats          ?? {};
  const chartData     = d?.chart          ?? EMPTY_LIST;
  const chartScale    = buildMoneyChartScale(chartData);
  const topProducts   = d?.top_products   ?? EMPTY_LIST;
  const topPurchaseItems = d?.top_purchase_items ?? EMPTY_LIST;
  const salesProfit   = d?.sales_profit ?? {};
  const salesDetails  = d?.sales_details ?? EMPTY_LIST;
  const salesByCustomer = d?.sales_by_customer ?? EMPTY_LIST;
  const salesByCashier = d?.sales_by_cashier ?? EMPTY_LIST;
  const purchaseDetails = d?.purchase_details ?? EMPTY_LIST;
  const purchasesBySupplier = d?.purchases_by_supplier ?? EMPTY_LIST;
  const purchaseReturns = d?.purchase_returns ?? EMPTY_LIST;
  const paymentTransactions = d?.payment_transactions ?? EMPTY_LIST;
  const lowStock      = d?.low_stock      ?? EMPTY_LIST;
  const recentActs    = d?.recent_activities ?? EMPTY_LIST;
  const payBreakdown  = d?.payment_breakdown ?? EMPTY_LIST;
  const paymentSummary = d?.payment_summary ?? {};
  const outstanding    = d?.outstanding ?? {};
  const purchaseMoney  = d?.purchase_money ?? {};
  const stockReport    = d?.stock_report ?? {};
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

  // netEquivalentUsd/Khr (not cashUsd+electronicUsd-refundUsd) — those sum only payments
  // literally received in that one currency, so a period where everyone happened to pay in
  // USD would show ៛0 "real received" despite a correct non-zero $ figure, and vice versa.
  // netEquivalent* converts every payment via its own exchange_rate_used first.
  const realSalesUsd = Number(paymentSummary.netEquivalentUsd || 0);
  const realSalesKhr = Number(paymentSummary.netEquivalentKhr || 0);

  const renderPaymentLedger = (item, compact = false) => (
    <div className={compact ? "space-y-1.5" : "mt-3 space-y-2"}>
      {[
        ["ទទួល USD", fmtUsd(item.receivedUsd), theme.pageTitle],
        ["អាប់ USD", fmtUsd(item.changeUsd), "text-amber-600"],
        ["ទទួលពិត USD", fmtUsd(item.usd), "text-emerald-600"],
        ["ទទួល KHR", formatKhr(item.receivedKhr), theme.pageTitle],
        ["អាប់ KHR", formatKhr(item.changeKhr), "text-amber-600"],
        ["ទទួលពិត KHR", formatKhr(item.khr), "text-emerald-600"],
      ].map(([label, value, valueClass]) => {
        const isNetSale = label.startsWith("ទទួលពិត");
        const rowClass = isNetSale
          ? isDark
            ? "border border-emerald-500/25 bg-emerald-500/15"
            : "border border-emerald-200 bg-emerald-50"
          : isDark
            ? "bg-black/15"
            : "bg-white";
        const labelClass = isNetSale
          ? isDark ? "text-emerald-200" : "text-emerald-700"
          : theme.muted;

        return (
          <div key={label} className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 ${rowClass}`}>
            <p className={`min-w-0 truncate text-xs font-bold ${labelClass}`}>{label}</p>
            <p className={`shrink-0 text-sm font-extrabold tabular-nums ${valueClass}`}>{value}</p>
          </div>
        );
      })}
    </div>
  );

  const totalSales = stats.total_sales_usd ?? 0;
  const totalPurchases = stats.total_purchases_usd ?? 0;
  const totalReturns = stats.gross_return_usd ?? stats.sales_returns_usd ?? 0;
  const salesCostUsd = Number(salesProfit.costUsd ?? stats.sales_cost_usd ?? 0);
  const returnProfitImpactUsd = Number(salesProfit.returnProfitImpactUsd ?? stats.sales_return_profit_impact_usd ?? 0);
  const grossProfitUsd = Number(stats.net_gross_profit_usd ?? salesProfit.netGrossProfitUsd ?? stats.gross_profit_usd ?? 0);
  const salesPurchaseGapUsd = Number(totalSales || 0) - Number(totalPurchases || 0);
  const profitMarginPercent = Number(totalSales || 0) > 0
    ? (grossProfitUsd / Number(totalSales || 0)) * 100
    : 0;
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
      title:    "ចំណេញពីការលក់",
      value:    fmtUsd(grossProfitUsd),
      subtitle: "ប្រាក់លក់ - ថ្លៃដើម",
      icon:     <FiDollarSign />,
      iconBg:   "bg-emerald-500/10 text-emerald-500",
      accent:   "border-l-emerald-500",
      trend:    null,
      trendType: null,
    },
    {
      title:    "តម្លៃស្តុក",
      value:    fmtUsd(stockReport.valueUsd),
      subtitle: `${formatKhr(stockReport.valueKhr)} · ${stockReport.stockItemCount ?? 0} មុខទំនិញ`,
      icon:     <FiBox />,
      iconBg:   "bg-violet-500/10 text-violet-500",
      accent:   "border-l-violet-500",
      trend:    null,
      trendType: null,
    },
    {
      title:    "ស្តុកស្ទើរអស់",
      value:    String(stats.low_stock_count ?? 0),
      subtitle: "ក្រោមកម្រិតអប្បបរមា",
      icon:     <FiAlertTriangle />,
      iconBg:   "bg-orange-500/10 text-orange-500",
      accent:   "border-l-orange-500",
      trend:    null,
      trendType: "down",
    },
    {
      title:    "ស្តុកអស់",
      value:    String(stockReport.outOfStockCount ?? 0),
      subtitle: "ត្រូវពិនិត្យបន្ថែម",
      icon:     <FiAlertCircle />,
      iconBg:   "bg-red-500/10 text-red-500",
      accent:   "border-l-red-500",
      trend:    null,
      trendType: "down",
    },
    {
      title:    "លុយអតិថិជនមិនទាន់បង់",
      value:    fmtUsd(stats.outstanding_balance_usd),
      subtitle: `${stats.outstanding_balance_count ?? 0} វិក្កយបត្រ · សមតុល្យបច្ចុប្បន្ន`,
      icon:     <FiAlertCircle />,
      iconBg:   "bg-red-500/10 text-red-500",
      accent:   "border-l-red-500",
      trend:    (stats.outstanding_balance_count ?? 0) > 0 ? "មិនទាន់ទូទាត់" : null,
      trendType: "down",
    },
    {
      title:    "មិនទាន់បង់អ្នកផ្គត់ផ្គង់",
      value:    fmtUsd(purchaseMoney.outstandingUsd),
      subtitle: `${(purchaseMoney.suppliers ?? []).length} អ្នកផ្គត់ផ្គង់ · សមតុល្យបច្ចុប្បន្ន`,
      icon:     <FiCreditCard />,
      iconBg:   "bg-amber-500/10 text-amber-500",
      accent:   "border-l-amber-500",
      trend:    Number(purchaseMoney.outstandingUsd || 0) > 0 ? "ត្រូវតាមដាន" : null,
      trendType: "down",
    },
  ];

  const canExport = !suppressReport && Boolean(d);
  const reportTabs = [
    { key: "overview", label: "សរុប", icon: FiGrid },
    { key: "sales", label: "ការលក់", icon: FiShoppingCart },
    { key: "purchases", label: "ការទិញ", icon: FiTruck },
    { key: "inventory", label: "ស្តុក", icon: FiBox },
    { key: "financial", label: "ហិរញ្ញវត្ថុ", icon: FiDollarSign },
  ];
  const reportTypeOptions = REPORT_TYPE_OPTIONS[reportTab] ?? EMPTY_LIST;
  const activeReportType = reportType[reportTab] ?? reportTypeOptions[0]?.key ?? "";

  const reportExport = useMemo(() => buildReportExport({
    dateFrom,
    dateTo,
    stats,
    salesByType,
    chartData,
    chartGranularity,
    topProducts,
    topPurchaseItems,
    salesProfit,
    salesDetails,
    salesByCustomer,
    salesByCashier,
    purchaseDetails,
    purchasesBySupplier,
    purchaseReturns,
    paymentSummary,
    paymentBreakdown: payBreakdown,
    paymentTransactions,
    lowStock,
    outstanding,
    purchaseMoney,
    stockReport,
    insights,
    recentActivities: recentActs,
    reportTab,
    reportType: activeReportType,
  }), [
    activeReportType,
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
    reportTab,
    recentActs,
    salesByCashier,
    salesByCustomer,
    salesDetails,
    salesProfit,
    salesByType,
    stockReport,
    stats,
    topProducts,
    topPurchaseItems,
    paymentTransactions,
    purchaseDetails,
    purchasesBySupplier,
    purchaseReturns,
  ]);

  const allTabsReportExport = useMemo(() => {
    const report = buildReportExport({
      dateFrom,
      dateTo,
      stats,
      salesByType,
      chartData,
      chartGranularity,
      topProducts,
      topPurchaseItems,
      salesProfit,
      salesDetails,
      salesByCustomer,
      salesByCashier,
      purchaseDetails,
      purchasesBySupplier,
      purchaseReturns,
      paymentSummary,
      paymentBreakdown: payBreakdown,
      paymentTransactions,
      lowStock,
      outstanding,
      purchaseMoney,
      stockReport,
      insights,
      recentActivities: recentActs,
      reportTab: "all",
      reportType: "all",
    });

    return { ...report, title: "របាយការណ៍ទាំង 5 ផ្ទាំង" };
  }, [
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
    salesByCashier,
    salesByCustomer,
    salesDetails,
    salesProfit,
    salesByType,
    stockReport,
    stats,
    topProducts,
    topPurchaseItems,
    paymentTransactions,
    purchaseDetails,
    purchasesBySupplier,
    purchaseReturns,
  ]);

  const activeFollowUpTab =
    reportTab === "purchases" ? "purchase"
      : reportTab === "financial" ? "debt"
        : reportTab === "sales" ? "debt"
          : followUpTab;
  const isAllReport = activeReportType === "all";
  const showReportType = (key) => isAllReport || activeReportType === key;
  const showAnyReportType = (keys) => isAllReport || keys.includes(activeReportType);
  const showPurchaseSummary = reportTab === "overview" || showReportType("summary");
  const showPurchaseProducts = reportTab === "overview" || showAnyReportType(["summary", "product"]);
  const showSupplierDue = reportTab === "overview" || showAnyReportType(["summary", "supplier_due"]);
  const salesProductVisualData = topProducts.slice(0, 8).map((item) => ({
    name: cleanRepeatedProductName(item.name),
    originalName: item.name,
    value: Number(item.revenueUsd || 0),
    meta: `${Number(item.soldQty || 0).toLocaleString("en-US")} ${item.unit || ""}`,
  }));
  const purchaseSupplierVisualData = purchasesBySupplier.map((item) => ({
    name: item.supplierName,
    value: Number(item.totalUsd || 0),
    meta: `${Number(item.count || 0).toLocaleString("en-US")} វិក្កយបត្រ`,
  }));
  const salesTypeVisualData = [
    { name: "លក់រាយ", value: Number(salesByType.retail?.totalUsd || 0), count: Number(salesByType.retail?.count || 0) },
    { name: "បោះដុំ", value: Number(salesByType.wholesale?.totalUsd || 0), count: Number(salesByType.wholesale?.count || 0) },
  ].filter((item) => item.value > 0 || item.count > 0);
  const stockStatusVisualData = [
    {
      name: "មានស្តុក",
      value: Math.max(0, Number(stockReport.stockItemCount || 0) - Number(stockReport.lowStockCount ?? stats.low_stock_count ?? 0) - Number(stockReport.outOfStockCount || 0)),
    },
    {
      name: "ស្តុកស្ទើរអស់",
      value: Number(stockReport.lowStockCount ?? stats.low_stock_count ?? 0),
    },
    {
      name: "ស្តុកអស់",
      value: Number(stockReport.outOfStockCount || 0),
    },
  ].filter((item) => item.value > 0);
  const renderBarVisual = ({ title, subtitle, data, color = "#ef4444", icon: Icon = FiTag, badgeLabel, maxVisibleRows }) => {
    const visibleRows = maxVisibleRows ? Math.min(data.length, maxVisibleRows) : data.length;
    const chartHeight = Math.max(300, visibleRows * 54 + 72);
    const innerChartHeight = Math.max(chartHeight, data.length * 54 + 72);
    const axisTextColor = isDark ? "#a1a1aa" : "#71717a";

    return (
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-lg text-red-500">
              <Icon />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>{title}</h2>
              {subtitle && <p className={`mt-1 text-sm ${theme.muted}`}>{subtitle}</p>}
            </div>
          </div>
          <span className={`self-start rounded-xl border px-3 py-1.5 text-xs font-bold ${theme.badge}`}>
            {badgeLabel ?? `កំពូល ${data.length}`}
          </span>
        </div>

        {data.length === 0 ? (
          <div className={`flex min-h-48 items-center justify-center rounded-xl border border-dashed ${isDark ? "border-white/10" : "border-zinc-200"}`}>
            <p className={`text-sm ${theme.muted}`}>គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          <div className="min-h-72 overflow-y-auto pr-2" style={{ maxHeight: chartHeight }}>
            <ResponsiveContainer width="100%" height={innerChartHeight}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 12, right: 90, bottom: 18, left: 10 }}
                barCategoryGap={18}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"} />
                <XAxis
                  type="number"
                  tickFormatter={fmtCompactUsd}
                  tick={{ fill: axisTextColor, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={220}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: axisTextColor, fontSize: 13, fontWeight: 600 }}
                />
                <Tooltip
                  content={<ChartTooltip theme={theme} labelFormatter={(label, payload) => payload?.name || label} />}
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)" }}
                />
                <Bar dataKey="value" name={title} fill={color} radius={[0, 10, 10, 0]} barSize={24}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={fmtUsd}
                    style={{ fill: color, fontSize: 12, fontWeight: 800 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };
  const renderDonutVisual = ({ title, subtitle, data, centerValue, valueFormatter = (value) => value, icon: Icon = FiCreditCard }) => (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-lg text-blue-500">
          <Icon />
        </div>
        <div className="min-w-0">
          <h2 className={`text-base font-bold ${theme.pageTitle}`}>{title}</h2>
          {subtitle && <p className={`mt-1 text-sm ${theme.muted}`}>{subtitle}</p>}
        </div>
      </div>

      {data.length === 0 ? (
        <div className={`flex min-h-56 items-center justify-center rounded-xl border border-dashed ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <p className={`text-sm ${theme.muted}`}>គ្មានទិន្នន័យ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr] lg:items-center">
          <div className="relative h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92} paddingAngle={3}>
                  {data.map((item, index) => (
                    <Cell key={item.name} fill={PAYMENT_DONUT_COLORS[index % PAYMENT_DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [valueFormatter(value), "សរុប"]}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e4e4e7",
                    background: isDark ? "#18181b" : "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className={`text-xs font-bold ${theme.muted}`}>សរុប</p>
              <p className={`mt-1 max-w-28 truncate text-center text-lg font-extrabold tabular-nums ${theme.pageTitle}`}>{centerValue}</p>
            </div>
          </div>

          <div className="space-y-2">
            {data.map((item, index) => {
              const total = data.reduce((sum, row) => sum + Number(row.value || 0), 0);
              const percent = total > 0 ? (Number(item.value || 0) / total) * 100 : 0;
              const color = PAYMENT_DONUT_COLORS[index % PAYMENT_DONUT_COLORS.length];

              return (
                <div key={item.name} className={`rounded-xl border p-3 ${theme.softCard}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.name}</p>
                    </div>
                    <p className={`shrink-0 text-sm font-extrabold tabular-nums ${theme.pageTitle}`}>{valueFormatter(item.value)}</p>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, percent)}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
  const renderCashierPerformance = () => {
    const rows = [...salesByCashier].sort((a, b) => Number(b.totalUsd || 0) - Number(a.totalUsd || 0));
    const maxValue = Math.max(...rows.map((row) => Number(row.totalUsd || 0)), 1);
    const topRow = rows[0];

    return (
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className={`text-base font-bold ${theme.pageTitle}`}>បុគ្គលិកលក់បានច្រើន</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>ចំណាត់ថ្នាក់តាមចំណូលលក់ក្នុងរយៈពេលដែលបានជ្រើស</p>
          </div>
          <span className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${theme.badge}`}>
            កំពូល {Math.min(rows.length, 6)}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className={`flex min-h-44 items-center justify-center rounded-xl border border-dashed ${isDark ? "border-white/10" : "border-zinc-200"}`}>
            <p className={`text-sm ${theme.muted}`}>គ្មានទិន្នន័យ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[0.78fr_1.22fr]">
            <div className={`rounded-2xl border p-4 ${isDark ? "border-emerald-500/20 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"}`}>
              <p className={`text-xs font-bold ${theme.muted}`}>អ្នកលក់លេខ 1</p>
              <p className="mt-2 line-clamp-2 text-xl font-extrabold leading-tight text-emerald-700">{topRow.cashierName || "Unknown"}</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-emerald-600">{fmtUsd(topRow.totalUsd)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={`rounded-xl px-3 py-2 ${isDark ? "bg-black/20" : "bg-white"}`}>
                  <p className={`text-[11px] font-bold ${theme.muted}`}>វិក្កយបត្រ</p>
                  <p className={`text-lg font-extrabold ${theme.pageTitle}`}>{Number(topRow.count || 0).toLocaleString("en-US")}</p>
                </div>
                <div className={`rounded-xl px-3 py-2 ${isDark ? "bg-black/20" : "bg-white"}`}>
                  <p className={`text-[11px] font-bold ${theme.muted}`}>បានបង់</p>
                  <p className="text-lg font-extrabold text-emerald-600">{fmtUsd(topRow.paidUsd)}</p>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <p className={`text-xs font-bold ${theme.muted}`}>សរុបការលក់</p>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rows.slice(0, 6).map((row) => ({
                      name: row.cashierName || "Unknown",
                      sales: Number(row.totalUsd || 0),
                    }))}
                    margin={{ top: 4, right: 18, left: 4, bottom: 28 }}
                  >
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb"} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      height={28}
                      tickFormatter={(value) => {
                        const text = String(value || "");
                        return text.length > 12 ? `${text.slice(0, 12)}...` : text;
                      }}
                      tick={{ fill: isDark ? "#a1a1aa" : "#52525b", fontSize: 12, fontWeight: 700 }}
                    />
                    <YAxis tickFormatter={fmtCompactUsd} tick={{ fill: isDark ? "#a1a1aa" : "#71717a", fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip theme={theme} labelFormatter={(label) => label} />} />
                    <Bar dataKey="sales" name="សរុបការលក់" fill="#1d2aa6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };
  const renderCustomerDebtPanel = () => {
    const agingRows = outstanding.aging ?? EMPTY_LIST;
    const customerRows = outstanding.customers ?? EMPTY_LIST;
    const hasRisk = Number(outstanding.totalUsd || 0) > 0;

    return (
      <div className={`rounded-2xl border p-5 shadow-sm ${hasRisk ? (isDark ? "border-red-500/25 bg-red-500/5" : "border-red-100 bg-red-50/40") : theme.card}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>មិនទាន់ទូទាត់</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>តាមដានអតិថិជននៅខ្វះប្រាក់ និងអាយុកាលបំណុល</p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-right ${isDark ? "border-red-500/25 bg-black/20" : "border-red-100 bg-white"}`}>
            <p className={`text-xs font-bold ${theme.muted}`}>{Number(outstanding.count || 0).toLocaleString("en-US")} វិក្កយបត្រ</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-red-500">{fmtUsd(outstanding.totalUsd)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ["សរុបមិនទាន់ទូទាត់", fmtUsd(outstanding.totalUsd), "text-red-500", hasRisk ? "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10" : ""],
            ...agingRows.map((item) => {
              const isOverdue = String(item.key || item.label || "").includes("over_30") || String(item.label || "").includes("30");
              return [
                item.label,
                fmtUsd(item.totalUsd),
                isOverdue ? "text-red-600" : "text-amber-600",
                isOverdue
                  ? "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10"
                  : "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10",
              ];
            }),
          ].map(([label, value, valueClass, toneClass]) => (
            <div key={label} className={`rounded-2xl border px-4 py-3 ${toneClass || theme.softCard}`}>
              <p className={`truncate text-sm font-semibold ${theme.muted}`}>{label}</p>
              <p className={`mt-1 truncate text-lg font-extrabold tabular-nums ${valueClass}`}>{value}</p>
            </div>
          ))}
        </div>

        {customerRows.length > 0 && (
          <div className={`mt-4 border-t pt-4 ${isDark ? "border-white/10" : "border-red-100"}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className={`text-sm font-bold ${theme.pageTitle}`}>អតិថិជននៅខ្វះប្រាក់</p>
              <span className={`rounded-xl border px-3 py-1 text-xs font-bold ${theme.badge}`}>
                {customerRows.length.toLocaleString("en-US")} អតិថិជន
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {customerRows.slice(0, 6).map((item) => (
                <div key={item.customerName} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-black/15" : "border-red-100 bg-white"}`}>
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
    );
  };
  const renderOverviewComparisonPanel = () => {
    const stockHealthy = Math.max(0, Number(stockReport.stockItemCount || 0) - Number(stockReport.lowStockCount ?? stats.low_stock_count ?? 0) - Number(stockReport.outOfStockCount || 0));
    const stockRiskCount = Number(stockReport.lowStockCount ?? stats.low_stock_count ?? 0) + Number(stockReport.outOfStockCount || 0);
    const paymentLeaders = paymentDonutData.slice(0, 4);
    const paymentFunnelData = paymentLeaders.map((item, index) => ({
      ...item,
      fill: PAYMENT_DONUT_COLORS[index % PAYMENT_DONUT_COLORS.length],
    }));
    const stockRiskCards = [
      { label: "មានស្តុក", value: stockHealthy, tone: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
      { label: "ស្តុកស្ទើរអស់", value: Number(stockReport.lowStockCount ?? stats.low_stock_count ?? 0), tone: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/30" },
      { label: "ស្តុកអស់", value: Number(stockReport.outOfStockCount || 0), tone: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
    ];
    const businessMax = Math.max(Number(totalSales || 0), Number(totalPurchases || 0), 1);
    const businessBars = [
      { label: "ការលក់", count: stats.total_sales_count ?? 0, value: Number(totalSales || 0), amount: fmtUsd(totalSales), color: "#10b981" },
      { label: "ការទិញ", count: stats.total_purchases_count ?? 0, value: Number(totalPurchases || 0), amount: fmtUsd(totalPurchases), color: "#3b82f6" },
    ];
    const profitBase = Math.max(Number(totalSales || 0), 1);
    const costShare = Math.min(100, Math.max(0, (Number(salesCostUsd || 0) / profitBase) * 100));
    const returnShare = Math.min(100, Math.max(0, (Number(returnProfitImpactUsd || 0) / profitBase) * 100));
    const profitShare = Math.min(100, Math.max(0, (Math.max(Number(grossProfitUsd || 0), 0) / profitBase) * 100));
    const adjustedReturnShare = Math.min(returnShare, Math.max(0, 100 - costShare));
    const profitParts = [
      { label: "ថ្លៃដើម", value: fmtUsd(salesCostUsd), color: "bg-blue-500", text: "text-blue-600" },
      { label: "ត្រឡប់", value: fmtUsd(returnProfitImpactUsd), color: "bg-amber-500", text: "text-amber-600" },
      { label: "ចំណេញ", value: fmtUsd(grossProfitUsd), color: grossProfitUsd >= 0 ? "bg-emerald-500" : "bg-red-500", text: grossProfitUsd >= 0 ? "text-emerald-600" : "text-red-500" },
    ];

    return (
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className={`text-base font-bold ${theme.pageTitle}`}>ផ្ទាំងប្រៀបធៀបសរុប</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>ផ្ទាំងសរុបប្រើសម្រាប់មើលទំនាក់ទំនងរវាងលក់ ទិញ ចំណេញ ការទូទាត់ និងស្តុក</p>
          </div>
          <span className={`self-start rounded-xl border px-3 py-1.5 text-xs font-bold ${theme.badge}`}>
            មើលសរុបសម្រាប់អ្នកគ្រប់គ្រង
          </span>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["លុយទទួលបានពិត", fmtUsd(paymentSummary.netEquivalentUsd), "text-emerald-600", "bg-emerald-500/10"],
            ["អតិថិជននៅខ្វះ", fmtUsd(outstanding.totalUsd), "text-red-500", "bg-red-500/10"],
            ["មិនទាន់បង់អ្នកផ្គត់ផ្គង់", fmtUsd(purchaseMoney.outstandingUsd), "text-amber-600", "bg-amber-500/10"],
            ["តម្លៃស្តុក", fmtUsd(stockReport.valueUsd), "text-violet-600", "bg-violet-500/10"],
          ].map(([label, value, valueClass, bgClass]) => (
            <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`truncate text-xs font-bold ${theme.muted}`}>{label}</p>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bgClass}`} />
              </div>
              <p className={`mt-1 truncate text-lg font-extrabold tabular-nums ${valueClass}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-extrabold ${theme.pageTitle}`}>លក់ធៀបទិញ</p>
                <p className={`mt-0.5 text-xs ${theme.muted}`}>ប្រៀបធៀបចំណូលលក់ និងប្រាក់ទិញចូល មិនមែនថ្លៃដើមលក់</p>
              </div>
              <p className={`rounded-xl px-2.5 py-1 text-xs font-bold ${salesPurchaseGapUsd >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                {salesPurchaseGapUsd >= 0 ? `+${fmtUsd(salesPurchaseGapUsd)}` : fmtUsd(salesPurchaseGapUsd)}
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-black/10" : "border-zinc-100 bg-white"}`}>
              <div className="grid grid-cols-2 gap-3">
                {businessBars.map((item) => (
                  <div key={item.label} className={`rounded-xl border px-3 py-2 ${theme.softCard}`}>
                    <p className={`text-xs font-bold ${theme.muted}`}>{item.label}</p>
                    <p className="mt-1 text-lg font-extrabold tabular-nums" style={{ color: item.color }}>{item.amount}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">{item.count} វិក្កយបត្រ</p>
                  </div>
                ))}
              </div>

              <div className={`mt-3 rounded-2xl border px-3 py-3 ${isDark ? "border-white/10 bg-black/10" : "border-zinc-100 bg-zinc-50"}`}>
                <svg viewBox="0 0 420 150" role="img" aria-label="Sales and purchase column chart" className="h-36 w-full">
                  {[0, 1, 2].map((line) => {
                    const y = 24 + line * 40;
                    return (
                      <line
                        key={line}
                        x1="34"
                        y1={y}
                        x2="390"
                        y2={y}
                        stroke={isDark ? "rgba(255,255,255,0.09)" : "#e5e7eb"}
                        strokeDasharray="4 5"
                      />
                    );
                  })}
                  <line x1="34" y1="124" x2="390" y2="124" stroke={isDark ? "rgba(255,255,255,0.22)" : "#a1a1aa"} />
                  {businessBars.map((item, index) => {
                    const barHeight = Math.max(8, Math.min(94, (item.value / businessMax) * 94));
                    const x = 120 + index * 110;
                    const y = 124 - barHeight;
                    return (
                      <g key={item.label}>
                        <rect x={x} y={y} width="54" height={barHeight} rx="12" fill={item.color} />
                        <text x={x + 27} y={Math.max(16, y - 8)} textAnchor="middle" fontSize="12" fontWeight="800" fill={item.color}>
                          {item.amount}
                        </text>
                        <text x={x + 27} y="144" textAnchor="middle" fontSize="12" fontWeight="800" fill={isDark ? "#e4e4e7" : "#52525b"}>
                          {item.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className={`mt-4 grid grid-cols-2 gap-3 border-t pt-3 ${isDark ? "border-white/10" : "border-zinc-100"}`}>
                <div>
                  <p className={`text-[11px] font-bold ${theme.muted}`}>ខុសគ្នា</p>
                  <p className={`mt-1 text-sm font-extrabold tabular-nums ${salesPurchaseGapUsd >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {fmtUsd(salesPurchaseGapUsd)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[11px] font-bold ${theme.muted}`}>ស្ថានភាព</p>
                  <p className={`mt-1 text-sm font-extrabold ${salesPurchaseGapUsd >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {salesPurchaseGapUsd >= 0 ? "លក់លើសទិញ" : "ទិញលើសលក់"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`flex flex-col rounded-2xl border p-4 ${theme.softCard}`}>
            <div className="mb-4">
              <p className={`text-sm font-extrabold ${theme.pageTitle}`}>គណនាចំណេញ</p>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>ប្រើថ្លៃដើមលក់ មិនមែនការទិញសរុប · ខៀវ/លឿងជាតម្លៃដកចេញ</p>
            </div>
            <div className={`flex flex-1 flex-col justify-between rounded-2xl border p-4 ${isDark ? "border-white/10 bg-black/10" : "border-zinc-100 bg-white"}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-bold ${theme.muted}`}>ចំណូលលក់</p>
                  <p className="mt-0.5 text-lg font-extrabold tabular-nums text-emerald-600">{fmtUsd(totalSales)}</p>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-right ${grossProfitUsd >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <p className={`text-[11px] font-bold ${theme.muted}`}>ចំណេញ</p>
                  <p className={`text-sm font-extrabold tabular-nums ${grossProfitUsd >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmtUsd(grossProfitUsd)}</p>
                </div>
              </div>

              <div className={`relative h-9 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`} aria-label="Profit bridge progress">
                <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500" style={{ width: "100%" }} />
                <div className="absolute inset-y-0 left-0 bg-blue-500" style={{ width: `${costShare}%` }} />
                {adjustedReturnShare > 0 && (
                  <div className="absolute inset-y-0 bg-amber-500" style={{ left: `${costShare}%`, width: `${adjustedReturnShare}%` }} />
                )}
                <div className="absolute inset-y-1 right-1 flex min-w-14 items-center justify-center rounded-full bg-white/85 px-3 text-xs font-extrabold text-emerald-700 shadow-sm">
                  {Math.round(profitShare)}%
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {profitParts.map((item) => (
                  <div key={item.label} className={`rounded-xl border px-3 py-2 ${theme.softCard}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
                      <p className={`truncate text-xs font-bold ${theme.muted}`}>{item.label}</p>
                    </div>
                    <p className={`mt-1 truncate text-sm font-extrabold tabular-nums ${item.text}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className={`mt-3 rounded-xl border px-3 py-2 text-center text-xs font-semibold ${isDark ? "border-white/10 bg-black/15 text-zinc-300" : "border-zinc-100 bg-zinc-50 text-zinc-600"}`}>
                ការលក់ - ថ្លៃដើម - ត្រឡប់ = ចំណេញពីការលក់
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
            <div className="mb-4">
              <p className={`text-sm font-extrabold ${theme.pageTitle}`}>លំដាប់វិធីទូទាត់</p>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>បង្ហាញវិធីទូទាត់ដែលប្រើច្រើន ដាក់ជាលំដាប់ងាយមើល</p>
            </div>
            {paymentFunnelData.length === 0 ? (
              <div className={`flex h-24 items-center justify-center rounded-xl border border-dashed ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                <p className={`text-sm ${theme.muted}`}>គ្មានទិន្នន័យ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(180px,0.9fr)_minmax(220px,1fr)] lg:items-center">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <Tooltip
                        formatter={(value) => [fmtUsd(value), "សរុប"]}
                        contentStyle={{
                          borderRadius: 12,
                          borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e4e4e7",
                          background: isDark ? "#18181b" : "#fff",
                        }}
                      />
                      <Funnel dataKey="value" data={paymentFunnelData} nameKey="name" isAnimationActive={false}>
                        {paymentFunnelData.map((item) => (
                          <Cell key={item.name} fill={item.fill} />
                        ))}
                        <LabelList
                          dataKey="name"
                          position="right"
                          fill={isDark ? "#e4e4e7" : "#3f3f46"}
                          stroke="none"
                          fontSize={11}
                        />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {paymentFunnelData.map((item, index) => {
                    const percent = paymentDonutTotal > 0 ? (Number(item.value || 0) / paymentDonutTotal) * 100 : 0;
                    return (
                      <div key={item.name} className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 ${isDark ? "border-white/10 bg-black/15" : "border-zinc-100 bg-white"}`}>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: item.fill }}>
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.name}</p>
                            <p className={`text-xs ${theme.muted}`}>{percent.toFixed(percent >= 10 ? 0 : 1)}% នៃការទូទាត់</p>
                          </div>
                        </div>
                        <p className={`shrink-0 text-sm font-extrabold tabular-nums ${theme.pageTitle}`}>{fmtUsd(item.value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
            <div className="mb-4">
              <p className={`text-sm font-extrabold ${theme.pageTitle}`}>ស្ថានភាពហានិភ័យស្តុក</p>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>បែងចែកស្តុកជា មានគ្រប់គ្រាន់ ស្តុកស្ទើរអស់ និងស្តុកអស់</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stockRiskCards.map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${item.border} ${item.bg}`}>
                  <p className={`text-xs font-bold ${theme.muted}`}>{item.label}</p>
                  <p className={`mt-2 text-3xl font-extrabold tabular-nums ${item.tone}`}>{Number(item.value || 0).toLocaleString("en-US")}</p>
                </div>
              ))}
            </div>
            <div className={`mt-3 rounded-2xl border px-4 py-3 ${isDark ? "border-white/10 bg-black/15" : "border-zinc-100 bg-white"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs font-bold ${theme.muted}`}>ត្រូវពិនិត្យ</p>
                <p className={`text-sm font-extrabold tabular-nums ${stockRiskCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {Number(stockRiskCount || 0).toLocaleString("en-US")} មុខទំនិញ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderReportTable = (title, subtitle, columns, rows, headerAction = null) => {
    const tableRows = rows ?? EMPTY_LIST;
    const tableKey = title;
    const totalPages = Math.max(1, Math.ceil(tableRows.length / REPORT_TABLE_PREVIEW_LIMIT));
    const currentPage = Math.min(Math.max(1, Number(tablePages[tableKey] || 1)), totalPages);
    const pageStartIndex = (currentPage - 1) * REPORT_TABLE_PREVIEW_LIMIT;
    const visibleRows = tableRows.slice(pageStartIndex, pageStartIndex + REPORT_TABLE_PREVIEW_LIMIT);
    const displayFrom = tableRows.length === 0 ? 0 : pageStartIndex + 1;
    const displayTo = Math.min(pageStartIndex + visibleRows.length, tableRows.length);
    const pageNumbers = getReportTablePageNumbers(currentPage, totalPages);

    return (
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
        <div className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${isDark ? "border-white/10" : "border-zinc-200"}`}>
          <div>
            <h2 className={`text-base font-bold ${theme.pageTitle}`}>{title}</h2>
            {subtitle && <p className={`mt-1 text-sm ${theme.muted}`}>{subtitle}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {headerAction}
            <span className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${theme.badge}`}>
              បង្ហាញ {displayFrom.toLocaleString("en-US")}-{displayTo.toLocaleString("en-US")} នៃ {tableRows.length.toLocaleString("en-US")}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="responsive-card-table min-w-full divide-y divide-zinc-200/70 text-sm dark:divide-white/10">
            <thead className={isDark ? "bg-white/[0.03]" : "bg-zinc-50"}>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`whitespace-nowrap px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide ${theme.muted}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={`px-4 py-8 text-center text-sm ${theme.muted}`}>
                    គ្មានទិន្នន័យ
                  </td>
                </tr>
              ) : visibleRows.map((row, index) => (
                <tr key={row.id ?? `${title}-${index}`} className={`border-t ${theme.row}`}>
                  {columns.map((column) => (
                    <td data-label={column.label} key={column.key} className={`whitespace-nowrap px-4 py-3 ${column.className ?? ""}`}>
                      {column.render ? column.render(row) : (row[column.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className={`flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between ${isDark ? "border-white/10" : "border-zinc-200"}`}>
            <p className={`text-xs ${theme.muted}`}>
              ទំព័រ {currentPage} នៃ {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setTablePages((prev) => ({ ...prev, [tableKey]: currentPage - 1 }))}
                className={`table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${theme.badge} hover:bg-red-500/10 hover:text-red-500`}
              >
                <FiChevronLeft />
                មុន
              </button>

              {pageNumbers.map((item, index) =>
                item === "..." ? (
                  <span key={`${tableKey}-ellipsis-${index}`} className={`px-2 text-sm font-semibold ${theme.muted}`}>
                    ...
                  </span>
                ) : (
                  <button
                    key={`${tableKey}-${item}`}
                    type="button"
                    onClick={() => setTablePages((prev) => ({ ...prev, [tableKey]: item }))}
                    className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 ${
                      item === currentPage
                        ? "quick-action-icon-3d bg-red-600 text-white"
                        : `table-icon-3d ${theme.badge} border hover:bg-red-500/10 hover:text-red-500`
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setTablePages((prev) => ({ ...prev, [tableKey]: currentPage + 1 }))}
              className={`table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${theme.badge} hover:bg-red-500/10 hover:text-red-500`}
            >
              បន្ទាប់
              <FiChevronRight />
            </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handlePdfExport = (report = reportExport) => {
    if (!canExport) return;
    const opened = exportReportPdf(report);
    if (!opened) {
      window.alert("PDF export was blocked by the browser. Please allow pop-ups and try again.");
    }
  };

  const handleExport = (type, scope = "current") => {
    if (!canExport) return;
    setExportMenuOpen(false);
    const targetReport = {
      ...(scope === "all" ? allTabsReportExport : reportExport),
      shopInfo: getStoredShopInfo(),
    };

    if (type === "pdf") {
      handlePdfExport(targetReport);
      return;
    }

    if (type === "excel") {
      exportReportExcel(targetReport);
      return;
    }

    exportReportCsv(targetReport);
  };

  return (
    <section className="space-y-4 sm:space-y-6">

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
              onClick={() => { setDateFrom(monthStart); setDateTo(today); setChartPeriod("ខែ"); }}
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
                <div className={`absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border py-2 shadow-xl ${isDark ? "border-white/10 bg-zinc-900" : "border-zinc-200 bg-white"}`} role="menu">
                  <p className={`px-4 pb-1 text-[11px] font-extrabold uppercase tracking-wide ${theme.muted}`}>Current view</p>
                  {[
                    ["pdf", "PDF", FiFileText],
                    ["excel", "Excel", FiGrid],
                    ["csv", "CSV", FiDownload],
                  ].map(([type, label, Icon]) => (
                    <button
                      key={`current-${type}`}
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport(type, "current")}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold transition ${isDark ? "text-zinc-100 hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100"}`}
                    >
                      <Icon className="text-base" />
                      {label}
                    </button>
                  ))}

                  <div className={`my-1 border-t ${isDark ? "border-white/10" : "border-zinc-200"}`} />
                  <p className={`px-4 pb-1 text-[11px] font-extrabold uppercase tracking-wide ${theme.muted}`}>All 5 tabs</p>
                  {[
                    ["pdf", "PDF", FiFileText],
                    ["excel", "Excel", FiGrid],
                    ["csv", "CSV", FiDownload],
                  ].map(([type, label, Icon]) => (
                    <button
                      key={`all-${type}`}
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport(type, "all")}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold transition ${isDark ? "text-zinc-100 hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100"}`}
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
        <div className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border shadow-sm ${theme.card}`} role="status" aria-live="polite">
          <div
            className="relative flex h-32 w-32 items-center justify-center"
            style={{ perspective: "700px" }}
          >
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-fuchsia-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-fuchsia-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-pink-300 border-r-violet-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-pink-300 via-fuchsia-500 to-violet-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(107, 33, 168, 0.3), inset 4px 4px 10px rgba(255,255,255,0.35), inset -5px -7px 12px rgba(88,28,135,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiFileText className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[10px] font-black text-emerald-950 shadow-lg shadow-emerald-400/40">
                ↗
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>រង់ចាំបន្តិច...</p>
          <p className={`mt-1 text-xs ${theme.muted}`}>កំពុងរៀបចំទិន្នន័យរបាយការណ៍</p>
        </div>
      )}

      {!suppressReport && (
        <div className={`rounded-2xl border p-2 shadow-sm ${theme.card}`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              const active = reportTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setReportTab(tab.key)}
                  className={`inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
                    active
                      ? "bg-red-500 text-white shadow-sm"
                      : `${theme.muted} hover:bg-red-500/10 hover:text-red-500`
                  }`}
                >
                  <Icon className="shrink-0 text-base" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!suppressReport && reportTab !== "overview" && (
        <div className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm font-extrabold ${theme.pageTitle}`}>ប្រភេទរបាយការណ៍</p>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>ជ្រើសរើសទិន្ន័យដែលចង់ពិនិត្យក្នុងផ្នែកនេះ</p>
            </div>
            <div className="w-full sm:w-72">
              <InventoryDropdown
                value={activeReportType}
                onChange={(value) => setReportType((prev) => ({ ...prev, [reportTab]: value }))}
                theme={theme}
                icon={<FiFilter />}
                options={reportTypeOptions.map((option) => ({ value: option.key, label: option.label }))}
                heightClass="h-11"
                fontClass="font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* â"€â"€ Summary Cards â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <div className={suppressReport || reportTab !== "overview" ? "hidden" : ""}>
        <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>សង្ខេបរយៈពេល</p>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {SUMMARY_CARDS.map((card) => (
            <SummaryCard key={card.title} theme={theme} {...card} />
          ))}
        </div>
      </div>

      {/* ── Chart (full width) ── */}
      <div className={`${suppressReport || reportTab !== "overview" ? "hidden" : ""} rounded-2xl border p-5 shadow-sm ${theme.card}`}>
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
                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={isDark ? 0.25 : 0.15} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={isDark ? 0.25 : 0.15} />
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
              <Area dataKey="sales" name="ការលក់សរុប" type="monotone" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradSales)" dot={showChartDots ? { r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#22c55e", strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
              <Area dataKey="purchases" name="ការទិញសរុប" type="monotone" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradPurchases)" dot={showChartDots ? { r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#3b82f6", strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
              <Line dataKey="returns"   name="ត្រឡប់ទំនិញសរុប"   type="monotone" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3"
                dot={showChartDots ? { r: 3, fill: isDark ? "#18181b" : "#fff", stroke: "#f59e0b", strokeWidth: 2 } : false} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      {!suppressReport && reportTab === "overview" && renderOverviewComparisonPanel()}

      {!suppressReport && reportTab === "sales" && showAnyReportType(["summary", "profit"]) && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>សង្ខេបការលក់</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>លក់បានសរុប ប្រាក់លក់បានពិត និងការត្រឡប់/សងទឹកប្រាក់</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["លក់បានសរុប", fmtUsd(stats.total_sales_usd), formatKhr(stats.total_sales_khr), "text-emerald-600", "តម្លៃវិក្កយបត្រលក់ទាំងអស់ក្នុងរយៈពេលនេះ"],
              ["ប្រាក់លក់បានពិត", fmtUsd(realSalesUsd), formatKhr(realSalesKhr), "text-blue-600", "លុយបានទទួលជាក់ស្តែង (ក្រោយដកសងវិញរួច)"],
              ["ត្រឡប់/សងទឹកប្រាក់", fmtUsd(stats.sales_returns_usd), formatKhr(stats.sales_returns_khr), "text-amber-600", "ការទាមទារត្រឡប់សរុប (មិនទាន់ដកចេញពីលុយទទួល)"],
            ].map(([label, value, khrValue, valueClass, hint]) => (
              <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                <p className={`truncate text-sm font-semibold ${theme.muted}`}>{label}</p>
                <p className={`mt-1 truncate text-xl font-extrabold tabular-nums ${valueClass}`}>{value}</p>
                <p className={`mt-0.5 truncate text-xs ${theme.muted}`}>{khrValue}</p>
                <p className={`mt-1.5 text-[11px] leading-snug ${theme.muted}`}>{hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!suppressReport && reportTab === "sales" && showReportType("summary") && renderCustomerDebtPanel()}

      {!suppressReport && reportTab === "sales" && showReportType("summary") && renderDonutVisual({
        title: "លក់រាយ vs បោះដុំ",
        subtitle: "ប្រៀបធៀបចំណូលតាមប្រភេទអតិថិជន",
        data: salesTypeVisualData,
        centerValue: fmtUsd(salesTypeVisualData.reduce((sum, item) => sum + Number(item.value || 0), 0)),
        valueFormatter: fmtUsd,
        icon: FiShoppingCart,
      })}

      {!suppressReport && reportTab === "sales" && showReportType("product") && renderBarVisual({
        title: "ក្រាបទំនិញលក់ដាច់",
        subtitle: "តម្លៃលក់តាមវិក្កយបត្រ រួមទាំងបានបង់ និងនៅខ្វះ",
        data: salesProductVisualData,
        color: "#10b981",
        icon: FiTag,
      })}

      {!suppressReport && reportTab === "sales" && showReportType("details") && renderReportTable(
        "លម្អិតការលក់",
        "វិក្កយបត្រលក់ចុងក្រោយក្នុងរយៈពេលដែលបានជ្រើស",
        [
          { key: "saleNo", label: "លេខវិក្កយបត្រ" },
          { key: "date", label: "ថ្ងៃ/ម៉ោង" },
          { key: "customerName", label: "អតិថិជន" },
          { key: "cashierName", label: "អ្នកលក់" },
          { key: "totalUsd", label: "សរុប", render: (row) => fmtUsd(row.totalUsd), className: "font-bold text-emerald-600" },
          { key: "paidUsd", label: "បានបង់", render: (row) => fmtUsd(row.paidUsd) },
          { key: "dueUsd", label: "នៅខ្វះ", render: (row) => fmtUsd(row.dueUsd), className: "font-bold text-red-500" },
          { key: "paymentStatus", label: "ស្ថានភាពបង់", render: (row) => paymentStatusLabel(row.paymentStatus) },
        ],
        salesDetails
      )}

      {!suppressReport && reportTab === "sales" && showReportType("customer") && renderReportTable(
        "លក់តាមអតិថិជន",
        "សរុបការលក់ បង់រួច និងនៅខ្វះតាមអតិថិជន",
        [
          { key: "customerName", label: "អតិថិជន" },
          { key: "count", label: "វិក្កយបត្រ" },
          { key: "totalUsd", label: "សរុប", render: (row) => fmtUsd(row.totalUsd), className: "font-bold text-emerald-600" },
          { key: "paidUsd", label: "បានបង់", render: (row) => fmtUsd(row.paidUsd) },
          { key: "dueUsd", label: "នៅខ្វះ", render: (row) => fmtUsd(row.dueUsd), className: "font-bold text-red-500" },
        ],
        salesByCustomer
      )}

      {!suppressReport && reportTab === "sales" && showReportType("cashier") && renderCashierPerformance()}

      {!suppressReport && reportTab === "purchases" && showReportType("summary") && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>សង្ខេបការទិញ</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>ទិញបានសរុប ចំណាយបានពិត និងការទាមទារត្រឡប់</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["ទិញបានសរុប", fmtUsd(stats.total_purchases_usd), formatKhr(stats.total_purchases_khr), "text-blue-600", "តម្លៃវិក្កយបត្រទាំងអស់ក្នុងរយៈពេលនេះ"],
              ["ចំណាយទិញបានពិត", fmtUsd(purchaseMoney.netCostUsd), formatKhr(purchaseMoney.netCostKhr), "text-pink-600", "លុយចេញជាក់ស្តែង (ក្រោយដកសងវិញរួច)"],
              ["ត្រឡប់ការទិញ", fmtUsd(stats.purchase_returns_usd), formatKhr(stats.purchase_returns_khr), "text-amber-600", "ការទាមទារខូចខាត/ត្រឡប់សរុប (មិនទាន់ដកចេញពីចំណាយ)"],
            ].map(([label, value, khrValue, valueClass, hint]) => (
              <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                <p className={`truncate text-sm font-semibold ${theme.muted}`}>{label}</p>
                <p className={`mt-1 truncate text-xl font-extrabold tabular-nums ${valueClass}`}>{value}</p>
                <p className={`mt-0.5 truncate text-xs ${theme.muted}`}>{khrValue}</p>
                <p className={`mt-1.5 text-[11px] leading-snug ${theme.muted}`}>{hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!suppressReport && reportTab === "purchases" && showReportType("supplier") && renderBarVisual({
        title: "ក្រាបទិញតាមអ្នកផ្គត់ផ្គង់",
        subtitle: "ប្រៀបធៀបអ្នកផ្គត់ផ្គង់ដែលមានតម្លៃទិញខ្ពស់ក្នុងរយៈពេលនេះ",
        data: purchaseSupplierVisualData,
        color: "#3b82f6",
        icon: FiTruck,
        badgeLabel: `${purchaseSupplierVisualData.length} អ្នកផ្គត់ផ្គង់`,
      })}

      {!suppressReport && reportTab === "purchases" && showReportType("details") && renderReportTable(
        "លម្អិតការទិញ",
        "វិក្កយបត្រទិញចុងក្រោយក្នុងរយៈពេលដែលបានជ្រើស",
        [
          { key: "purchaseNo", label: "លេខទិញ" },
          { key: "date", label: "ថ្ងៃ" },
          { key: "supplierName", label: "អ្នកផ្គត់ផ្គង់" },
          { key: "totalUsd", label: "សរុប", render: (row) => fmtUsd(row.totalUsd), className: "font-bold text-blue-600" },
          { key: "paidUsd", label: "បានបង់", render: (row) => fmtUsd(row.paidUsd) },
          { key: "dueUsd", label: "នៅខ្វះ", render: (row) => fmtUsd(row.dueUsd), className: "font-bold text-amber-600" },
          { key: "paymentStatus", label: "ស្ថានភាពបង់", render: (row) => paymentStatusLabel(row.paymentStatus) },
          { key: "status", label: "ស្ថានភាព", render: (row) => statusLabel(row.status) },
        ],
        purchaseDetails
      )}

      {!suppressReport && reportTab === "purchases" && showReportType("supplier") && renderReportTable(
        "ទិញតាមអ្នកផ្គត់ផ្គង់",
        "សរុបការទិញ បង់រួច និងនៅខ្វះតាម supplier",
        [
          { key: "supplierName", label: "អ្នកផ្គត់ផ្គង់" },
          { key: "count", label: "វិក្កយបត្រ" },
          { key: "totalUsd", label: "សរុប", render: (row) => fmtUsd(row.totalUsd), className: "font-bold text-blue-600" },
          { key: "paidUsd", label: "បានបង់", render: (row) => fmtUsd(row.paidUsd) },
          { key: "dueUsd", label: "នៅខ្វះ", render: (row) => fmtUsd(row.dueUsd), className: "font-bold text-amber-600" },
        ],
        purchasesBySupplier
      )}

      {!suppressReport && reportTab === "financial" && showReportType("payments") && renderDonutVisual({
        title: "ក្រាបចំណែកការទូទាត់",
        subtitle: "បង្ហាញវិធីទូទាត់ដែលអតិថិជនប្រើច្រើនបំផុត",
        data: paymentDonutData,
        centerValue: fmtUsd(paymentDonutTotal),
        valueFormatter: fmtUsd,
        icon: FiCreditCard,
      })}

      {!suppressReport && reportTab === "financial" && showReportType("payments") && renderReportTable(
        "ប្រតិបត្តិការទូទាត់",
        "លម្អិតការទូទាត់តាមវិក្កយបត្រ វិធីសាស្ត្រ និងអ្នកទទួលប្រាក់",
        [
          { key: "date", label: "ថ្ងៃ/ម៉ោង" },
          { key: "saleNo", label: "វិក្កយបត្រ" },
          { key: "customerName", label: "អតិថិជន" },
          { key: "method", label: "វិធី" },
          { key: "provider", label: "ប្រភព" },
          { key: "receivedAmount", label: "បានទទួល", render: (row) => `${Number(row.receivedAmount || 0).toLocaleString("en-US")} ${row.currency || ""}` },
          { key: "amountUsd", label: "ស្មើ USD", render: (row) => fmtUsd(row.amountUsd), className: "font-bold text-emerald-600" },
          { key: "receiverName", label: "អ្នកទទួល" },
        ],
        paymentTransactions
      )}

      {!suppressReport && reportTab === "sales" && showReportType("return") && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>ការត្រឡប់ការលក់</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>សង្ខេបចំនួន និងតម្លៃត្រឡប់ក្នុងរយៈពេលដែលបានជ្រើស</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
              <p className={`text-sm font-semibold ${theme.muted}`}>តម្លៃត្រឡប់</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-amber-600">{fmtUsd(stats.sales_returns_usd)}</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
              <p className={`text-sm font-semibold ${theme.muted}`}>ចំនួនប្រតិបត្តិការ</p>
              <p className={`mt-1 text-2xl font-extrabold tabular-nums ${theme.pageTitle}`}>{stats.sales_returns_count ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      {!suppressReport && reportTab === "purchases" && showReportType("return") && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>ការត្រឡប់ការទិញ</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>សង្ខេបការទាមទារត្រឡប់ទៅអ្នកផ្គត់ផ្គង់</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
              <p className={`text-sm font-semibold ${theme.muted}`}>តម្លៃត្រឡប់</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-pink-600">{fmtUsd(stats.purchase_returns_usd)}</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
              <p className={`text-sm font-semibold ${theme.muted}`}>ចំនួនប្រតិបត្តិការ</p>
              <p className={`mt-1 text-2xl font-extrabold tabular-nums ${theme.pageTitle}`}>{stats.purchase_returns_count ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      {!suppressReport && reportTab === "purchases" && showReportType("return") && renderReportTable(
        "លម្អិតការត្រឡប់ការទិញ",
        "បញ្ជី claim/return ទៅអ្នកផ្គត់ផ្គង់ក្នុងរយៈពេលដែលបានជ្រើស",
        [
          { key: "returnNo", label: "លេខត្រឡប់" },
          { key: "date", label: "ថ្ងៃ/ម៉ោង" },
          { key: "purchaseNo", label: "លេខទិញ" },
          { key: "supplierName", label: "អ្នកផ្គត់ផ្គង់" },
          { key: "reason", label: "មូលហេតុ", render: (row) => formatCondition(row.reason) },
          { key: "resolutionType", label: "ដំណោះស្រាយ", render: (row) => formatResolutionType(row.resolutionType) },
          { key: "totalUsd", label: "សរុប", render: (row) => fmtUsd(row.totalUsd), className: "font-bold text-amber-600" },
          { key: "resolutionStatus", label: "ស្ថានភាព", render: (row) => statusLabel(row.resolutionStatus) },
        ],
        purchaseReturns
      )}

      {/* ── Stock report ── */}
      {!suppressReport && reportTab === "inventory" && showAnyReportType(["current", "low_stock", "out_of_stock", "valuation"]) && renderDonutVisual({
        title: "ស្ថានភាពស្តុក",
        subtitle: "បំបែកស្តុកជា មានស្តុក ស្ទើរអស់ និងអស់",
        data: stockStatusVisualData,
        centerValue: Number(stockReport.stockItemCount || 0).toLocaleString("en-US"),
        valueFormatter: (value) => Number(value || 0).toLocaleString("en-US"),
        icon: FiBox,
      })}

      {!suppressReport && reportTab === "inventory" && showAnyReportType(["current", "movement", "valuation"]) && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>របាយការណ៍ស្តុក</h2>
              <p className={`mt-1 text-sm ${theme.muted}`}>ស្តុកបច្ចុប្បន្ន និងចលនាស្តុកតាមរយៈពេលដែលជ្រើស</p>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold ${theme.badge}`}>
              <FiBox /> {stockReport.stockItemCount ?? 0} មុខទំនិញ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ["តម្លៃស្តុក USD", fmtUsd(stockReport.valueUsd), "text-emerald-600"],
              ["តម្លៃស្តុក KHR", formatKhr(stockReport.valueKhr), "text-emerald-600"],
              ["ចំនួនស្តុកសរុប", Number(stockReport.stockOnHand || 0).toLocaleString("en-US"), theme.pageTitle],
              ["ចូលស្តុក", Number(stockReport.stockInQty || 0).toLocaleString("en-US"), "text-blue-600"],
              ["ចេញស្តុក", Number(stockReport.stockOutQty || 0).toLocaleString("en-US"), "text-red-500"],
            ].map(([label, value, valueClass]) => (
              <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                <p className={`truncate text-sm font-semibold ${theme.muted}`}>{label}</p>
                <p className={`mt-1 truncate text-xl font-extrabold tabular-nums ${valueClass}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[
              ["ចូលស្តុកក្នុងរយៈពេលនេះ", stockReport.stockInItems ?? [], "text-blue-600"],
              ["ចេញស្តុកក្នុងរយៈពេលនេះ", stockReport.stockOutItems ?? [], "text-red-500"],
            ].map(([title, items, valueClass]) => (
              <div key={title} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                <p className={`mb-3 text-sm font-bold ${theme.pageTitle}`}>{title}</p>
                {items.length === 0 ? (
                  <p className={`py-4 text-center text-sm ${theme.muted}`}>គ្មានទិន្នន័យ</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={`${title}-${item.id}`} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${isDark ? "bg-black/15" : "bg-white"}`}>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.name}</p>
                          <p className={`text-xs ${theme.muted}`}>{item.count} ចលនា</p>
                        </div>
                        <p className={`shrink-0 text-sm font-extrabold tabular-nums ${valueClass}`}>
                          {Number(item.qty || 0).toLocaleString("en-US")} {item.unit || ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!suppressReport && reportTab === "inventory" && showReportType("out_of_stock") && renderReportTable(
        "ស្តុកអស់",
        "ទំនិញដែលចំនួននៅសល់ស្មើសូន្យ ឬតិចជាងសូន្យ",
        [
          { key: "name", label: "ទំនិញ" },
          { key: "current", label: "នៅសល់", render: (row) => `${Number(row.current || 0).toLocaleString("en-US")} ${row.unit || ""}`, className: "font-bold text-red-500" },
          { key: "threshold", label: "កម្រិតអប្បបរមា" },
        ],
        stockReport.outOfStockItems ?? EMPTY_LIST
      )}

      {!suppressReport && reportTab === "inventory" && showReportType("batch_expiry") && renderReportTable(
        "Batch និងថ្ងៃផុតកំណត់",
        "Batch ដែលនៅសល់ស្តុក និងមានថ្ងៃផុតកំណត់",
        [
          { key: "batchNo", label: "Batch" },
          { key: "lotNo", label: "Lot" },
          { key: "name", label: "ទំនិញ" },
          { key: "expiredDate", label: "ផុតកំណត់" },
          { key: "qtyRemaining", label: "នៅសល់", render: (row) => Number(row.qtyRemaining || 0).toLocaleString("en-US") },
          { key: "valueUsd", label: "តម្លៃ", render: (row) => fmtUsd(row.valueUsd), className: "font-bold text-emerald-600" },
          { key: "status", label: "ស្ថានភាព", render: (row) => statusLabel(row.status) },
        ],
        stockReport.batchExpiry ?? EMPTY_LIST
      )}

      {!suppressReport && reportTab === "inventory" && showReportType("adjustment") && renderReportTable(
        "កែតម្រូវស្តុក",
        "ការកែតម្រូវស្តុកក្នុងរយៈពេលដែលបានជ្រើស",
        [
          { key: "adjustmentNo", label: "លេខកែតម្រូវ" },
          { key: "date", label: "ថ្ងៃ/ម៉ោង" },
          { key: "type", label: "ប្រភេទ", render: (row) => adjustmentTypeLabel(row.type) },
          { key: "reason", label: "មូលហេតុ", render: (row) => adjustmentReasonLabel(row.reason) },
          { key: "itemCount", label: "មុខទំនិញ" },
          { key: "qty", label: "ចំនួន", render: (row) => Number(row.qty || 0).toLocaleString("en-US") },
          { key: "cost", label: "តម្លៃ", render: (row) => fmtUsd(row.cost), className: "font-bold text-emerald-600" },
          { key: "createdBy", label: "បង្កើតដោយ" },
        ],
        stockReport.stockAdjustments ?? EMPTY_LIST
      )}

      {!suppressReport && reportTab === "inventory" && showReportType("damaged") && renderReportTable(
        "ស្តុកខូច",
        "ទំនិញខូចពីការទិញចូល និងការត្រឡប់ពីអតិថិជន",
        [
          { key: "source", label: "ប្រភព", render: (row) => stockSourceLabel(row.source) },
          { key: "referenceNo", label: "ឯកសារ" },
          { key: "partyName", label: "ភាគី" },
          { key: "name", label: "ទំនិញ" },
          { key: "qty", label: "ចំនួន", render: (row) => `${Number(row.qty || 0).toLocaleString("en-US")} ${row.unit || ""}`, className: "font-bold text-red-500" },
          { key: "valueUsd", label: "តម្លៃខូច", render: (row) => fmtUsd(row.valueUsd), className: "font-bold text-red-500" },
        ],
        stockReport.damagedStock ?? EMPTY_LIST
      )}

      {!suppressReport && reportTab === "inventory" && showReportType("low_stock") && renderReportTable(
        "ស្តុកស្ទើរអស់",
        "ទំនិញក្រោមកម្រិតអប្បបរមា ដែលត្រូវពិចារណាទិញបន្ថែម",
        [
          { key: "name", label: "ទំនិញ" },
          { key: "current", label: "នៅសល់", render: (row) => `${Number(row.current || 0).toLocaleString("en-US")} ${row.unit || ""}`, className: "font-bold text-orange-500" },
          { key: "threshold", label: "កម្រិតអប្បបរមា", render: (row) => `${Number(row.threshold || 0).toLocaleString("en-US")} ${row.unit || ""}` },
          {
            key: "percent",
            label: "% នៃកម្រិត",
            render: (row) => {
              const current = Number(row.current || 0);
              const threshold = Number(row.threshold || 0);
              return threshold > 0 ? `${Math.round((current / threshold) * 100)}%` : "—";
            },
            className: "font-bold text-amber-600",
          },
        ],
        lowStock
      )}

      {!suppressReport && reportTab === "financial" && showAnyReportType(["profit", "cash_flow"]) && (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>សង្ខេបហិរញ្ញវត្ថុ</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>ប្រាក់ចំណេញពិត លុយចូល លុយចេញ និងលុយមិនទាន់ទូទាត់</p>
          </div>

          <div className="space-y-5">
            <div>
              <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ប្រាក់ចំណេញ</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                  <p className={`truncate text-sm font-semibold ${theme.muted}`}>ចំណេញពីការលក់</p>
                  <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-emerald-600">{fmtUsd(grossProfitUsd)}</p>
                  <p className={`mt-1.5 text-[11px] leading-snug ${theme.muted}`}>ចំណូលលក់ ដកថ្លៃដើមទំនិញលក់</p>
                </div>
              </div>
            </div>

            <div>
              <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>សាច់ប្រាក់ក្នុងរយៈពេលនេះ</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                  <p className={`truncate text-sm font-semibold ${theme.muted}`}>លុយទទួលបានពិត</p>
                  <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-emerald-600">{fmtUsd(realSalesUsd)}</p>
                  <p className={`mt-0.5 truncate text-xs ${theme.muted}`}>{formatKhr(realSalesKhr)}</p>
                  <p className={`mt-1.5 text-[11px] leading-snug ${theme.muted}`}>លុយបានទទួលពីអតិថិជនជាក់ស្តែង (ក្រោយដកសងវិញ)</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                  <p className={`truncate text-sm font-semibold ${theme.muted}`}>ចំណាយទិញបានពិត</p>
                  <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-blue-600">{fmtUsd(purchaseMoney.netCostUsd ?? purchaseMoney.paidUsd)}</p>
                  <p className={`mt-1.5 text-[11px] leading-snug ${theme.muted}`}>លុយបានចេញទៅអ្នកផ្គត់ផ្គង់ជាក់ស្តែង (ក្រោយដកសងវិញ)</p>
                </div>
              </div>
            </div>

            <div>
              <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>មិនទាន់ទូទាត់ (សមតុល្យបច្ចុប្បន្ន — មិនប្តូរតាមកាលបរិច្ឆេទ)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                  <p className={`truncate text-sm font-semibold ${theme.muted}`}>អតិថិជនមិនទាន់ទូទាត់</p>
                  <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-red-500">{fmtUsd(outstanding.totalUsd)}</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                  <p className={`truncate text-sm font-semibold ${theme.muted}`}>មិនទាន់បង់អ្នកផ្គត់ផ្គង់</p>
                  <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-amber-600">{fmtUsd(purchaseMoney.outstandingUsd)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ការទាមទារត្រឡប់ (មិនទាន់ដកចេញពីខាងលើ)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                  <p className={`truncate text-sm font-semibold ${theme.muted}`}>ត្រឡប់ការលក់</p>
                  <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-amber-600">{fmtUsd(stats.sales_returns_usd)}</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                  <p className={`truncate text-sm font-semibold ${theme.muted}`}>ត្រឡប់ការទិញ</p>
                  <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-pink-600">{fmtUsd(stats.purchase_returns_usd)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!suppressReport && reportTab === "financial" && showReportType("cash_flow") && (() => {
        const cashIn = Number(paymentSummary.netEquivalentUsd || 0);
        const cashOut = Number(purchaseMoney.paidEquivalentUsd ?? purchaseMoney.paidUsd ?? 0);
        const net = cashIn - cashOut;
        const netClass = net > 0 ? "text-emerald-600" : net < 0 ? "text-red-500" : "text-violet-600";
        const netHint = net > 0
          ? "លុយចូលច្រើនជាងលុយចេញ ក្នុងរយៈពេលនេះ"
          : net < 0
            ? "លុយចេញច្រើនជាងលុយចូល ក្នុងរយៈពេលនេះ"
            : "លុយចូល និងលុយចេញស្មើគ្នា";
        return (
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>លុយចូល / លុយចេញ</h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>សង្ខេប cash flow សរុប (មិនទាន់ដកសងវិញ ខុសពី "ចំណាយទិញបានពិត" ខាងលើ)</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["លុយចូល", fmtUsd(cashIn), "text-emerald-600", null],
              ["លុយចេញ", fmtUsd(cashOut), "text-blue-600", null],
              ["សល់ (លុយចូល ដក លុយចេញ)", fmtUsd(net), netClass, netHint],
            ].map(([label, value, valueClass, hint]) => (
              <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                <p className={`text-sm font-semibold ${theme.muted}`}>{label}</p>
                <p className={`mt-1 truncate text-2xl font-extrabold tabular-nums ${valueClass}`}>{value}</p>
                {hint && <p className={`mt-1.5 text-[11px] leading-snug ${theme.muted}`}>{hint}</p>}
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {!suppressReport && reportTab === "financial" && showReportType("customer_due") && renderReportTable(
        "អតិថិជនមិនទាន់ទូទាត់",
        "អតិថិជនដែលនៅខ្វះលុយ និងចំនួនវិក្កយបត្រ",
        [
          { key: "customerName", label: "អតិថិជន" },
          { key: "count", label: "វិក្កយបត្រ" },
          { key: "totalUsd", label: "នៅខ្វះ", render: (row) => fmtUsd(row.totalUsd), className: "font-bold text-red-500" },
        ],
        outstanding.customers ?? EMPTY_LIST
      )}

      {!suppressReport && reportTab === "financial" && showReportType("supplier_due") && renderReportTable(
        "មិនទាន់បង់អ្នកផ្គត់ផ្គង់",
        "អ្នកផ្គត់ផ្គង់ដែលនៅមិនទាន់បង់ក្នុងរយៈពេលនេះ",
        [
          { key: "supplierName", label: "អ្នកផ្គត់ផ្គង់" },
          { key: "count", label: "វិក្កយបត្រទិញ" },
          { key: "totalUsd", label: "នៅខ្វះ", render: (row) => fmtUsd(row.totalUsd), className: "font-bold text-amber-600" },
        ],
        purchaseMoney.suppliers ?? EMPTY_LIST
      )}

      {/* ── Payment overview + follow-up ── */}
      <div className={`${suppressReport || reportTab === "overview" || reportTab === "inventory" || (reportTab === "sales" && !showAnyReportType(["summary", "profit"])) || (reportTab === "purchases" && showReportType("return") && !isAllReport) ? "hidden" : ""} flex flex-col gap-6`}>

        {/* Payment share */}
        <div className={`${reportTab !== "sales" || !showAnyReportType(["summary", "profit"]) ? "hidden" : ""} flex w-full flex-col rounded-2xl border p-4 shadow-sm ${theme.card}`}>
          <div className="space-y-3">
              <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ចំណែកការទូទាត់</p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>គណនាភាគរយតាមតម្លៃសមមូល USD</p>
                </div>
                <div className={`shrink-0 rounded-xl border px-3 py-2 text-right ${theme.badge}`}>
                  <p className={`text-xs font-semibold ${theme.muted}`}>ប្រាក់ទទួលសរុប</p>
                  <p className={`text-base font-extrabold tabular-nums ${theme.pageTitle}`}>{fmtUsd(paymentDonutTotal)}</p>
                </div>
              </div>

              {paymentDonutData.length === 0 ? (
                <div className={`mt-3 flex min-h-44 items-center justify-center rounded-xl border border-dashed ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                  <p className={`text-xs ${theme.muted}`}>គ្មានទិន្នន័យការទូទាត់</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr] lg:items-center">
                    <div className="relative h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentDonutData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={88}
                            paddingAngle={2}
                            stroke={isDark ? "#18181b" : "#fff"}
                            strokeWidth={3}
                          >
                            {paymentDonutData.map((item, index) => (
                              <Cell key={item.name} fill={PAYMENT_DONUT_COLORS[index % PAYMENT_DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [fmtUsd(value), "សរុប"]}
                            contentStyle={{
                              borderRadius: 12,
                              borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e4e4e7",
                              background: isDark ? "#18181b" : "#fff",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <p className={`text-xs font-bold ${theme.muted}`}>សរុប</p>
                        <p className={`mt-1 text-xl font-extrabold tabular-nums ${theme.pageTitle}`}>{fmtUsd(paymentDonutTotal)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {paymentDonutData.map((item, index) => {
                        const percent = paymentDonutTotal > 0
                          ? (item.value / paymentDonutTotal) * 100
                          : 0;
                        const color = PAYMENT_DONUT_COLORS[index % PAYMENT_DONUT_COLORS.length];

                        return (
                          <div key={item.name} className={`rounded-xl border p-2.5 ${theme.softCard}`}>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/40" style={{ backgroundColor: color }} />
                                <span className={`truncate text-sm font-bold ${theme.pageTitle}`}>{item.name}</span>
                              </div>
                              <span className={`shrink-0 text-xs font-bold ${theme.muted}`}>{percent.toFixed(percent >= 10 ? 0 : 1)}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <p className={`text-sm font-extrabold tabular-nums ${theme.pageTitle}`}>{fmtUsd(item.value)}</p>
                              <div className={`h-1.5 w-24 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-zinc-200"}`}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${Math.max(2, percent)}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </>
              )}
          </div>
        </div>

        <div className={`${reportTab !== "sales" || !showAnyReportType(["summary", "profit"]) ? "hidden" : ""} rounded-2xl border p-4 shadow-sm ${theme.card}`}>
          <div className="mb-3">
            <p className={`text-sm font-extrabold ${theme.pageTitle}`}>ការយល់ដឹងការលក់</p>
            <p className={`mt-1 text-xs ${theme.muted}`}>ចំណុចសំខាន់ៗពីលក់ ការទូទាត់ និងអតិថិជននៅខ្វះក្នុងរយៈពេលនេះ</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {[
              {
                label: "ថ្ងៃលក់ល្អ",
                value: insights.best_sales_day ? dayKh(insights.best_sales_day.day) : "—",
                badge: insights.best_sales_day ? fmtUsd(insights.best_sales_day.amount) : "—",
                badgeClass: "bg-emerald-500/10 text-emerald-600",
              },
              {
                label: "វិធីទូទាត់ខ្ពស់",
                value: paymentDonutData[0]?.name ?? "—",
                badge: paymentDonutData[0] ? fmtUsd(paymentDonutData[0].value) : "—",
                badgeClass: "bg-blue-500/10 text-blue-600",
              },
              {
                label: "អតិថិជននៅខ្វះច្រើន",
                value: outstanding.customers?.[0]?.customerName ?? "—",
                badge: outstanding.customers?.[0] ? fmtUsd(outstanding.customers[0].totalUsd) : "—",
                badgeClass: "bg-red-500/10 text-red-500",
              },
            ].map((row) => (
              <div key={row.label} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${theme.softCard}`}>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-bold ${theme.pageTitle}`}>{row.label}</p>
                  <p className={`truncate text-xs ${theme.muted}`}>{row.value}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-extrabold tabular-nums ${row.badgeClass}`}>
                  {row.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment + follow-up */}
        <div className="contents">

        {/* Payment summary card */}
        <div className={`${reportTab !== "sales" || !showAnyReportType(["summary", "profit"]) ? "hidden" : ""} w-full rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-4">
            <div className="min-w-0">
              <h2 className={`text-base font-bold ${theme.pageTitle}`}>សេចក្តីសង្ខេបការទូទាត់</h2>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>រាប់តែការទូទាត់ដែលទទួលបាន មិនរាប់វិក្កយបត្រនៅខ្វះ</p>
            </div>
          </div>

          <div className={`mb-4 rounded-2xl border p-3 ${isDark ? "border-emerald-500/20 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"}`}>
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm font-extrabold ${isDark ? "text-emerald-100" : "text-emerald-950"}`}>លុយទទួលបានពិត</p>
              <p className={`text-xs font-semibold ${isDark ? "text-emerald-200/75" : "text-emerald-700"}`}>មិនរាប់អតិថិជនមិនទាន់បង់</p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className={`rounded-xl border px-3 py-2.5 ${isDark ? "border-white/10 bg-black/20" : "border-emerald-100 bg-white"}`}>
                <p className={`text-xs font-bold ${theme.muted}`}>លុយទទួលសរុបគិតជា USD</p>
                <p className="text-xl font-extrabold tabular-nums text-emerald-700">{fmtUsd(paymentSummary.netEquivalentUsd)}</p>
              </div>
              <div className={`rounded-xl border px-3 py-2.5 ${isDark ? "border-white/10 bg-black/20" : "border-emerald-100 bg-white"}`}>
                <p className={`text-xs font-bold ${theme.muted}`}>ទទួលពិត USD</p>
                <p className="text-xl font-extrabold tabular-nums text-emerald-700">{fmtUsd(realSalesUsd)}</p>
              </div>
              <div className={`rounded-xl border px-3 py-2.5 ${isDark ? "border-white/10 bg-black/20" : "border-emerald-100 bg-white"}`}>
                <p className={`text-xs font-bold ${theme.muted}`}>ទទួលពិត KHR</p>
                <p className="text-xl font-extrabold tabular-nums text-emerald-700">{formatKhr(realSalesKhr)}</p>
              </div>
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
            <div className={`mt-5 border-t pt-4 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
              <p className={`mb-4 text-sm font-extrabold uppercase tracking-wide ${theme.pageTitle}`}>លម្អិតតាមធនាគារ / QR</p>
              <div className={`grid grid-cols-1 gap-3 ${paymentProviderCards.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {paymentProviderCards.map((pm, index) => {
                  const isLastOddCard = paymentProviderCards.length > 1
                    && paymentProviderCards.length % 2 === 1
                    && index === paymentProviderCards.length - 1;

                  return (
                  <div key={pm.key} className={`rounded-2xl border p-4 ${isLastOddCard ? "sm:col-span-2" : ""} ${theme.softCard}`}>
                    <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate text-base font-extrabold ${theme.pageTitle}`}>{pm.name}</p>
                        <p className={`mt-1 truncate text-sm ${theme.muted}`}>{pm.subLabel}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${theme.badge}`}>
                        ធនាគារ / QR
                      </span>
                    </div>

                    {renderPaymentLedger(pm)}
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Follow-up details */}
        <div className={`${reportTab === "sales" ? "hidden" : ""} w-full rounded-2xl border p-5 shadow-sm ${theme.card}`}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className={`text-lg font-extrabold ${theme.pageTitle}`}>
                {reportTab === "purchases" ? "សេចក្តីសង្ខេបការទិញ" : "តាមដានបន្ថែម"}
              </h2>
              <p className={`mt-1 text-sm ${theme.muted}`}>
                {reportTab === "purchases" ? "លុយបានបង់ មិនទាន់បង់ ទំនិញទិញចូល និងអ្នកផ្គត់ផ្គង់" : "តាមដានការទិញ មិនទាន់ទូទាត់ និងសកម្មភាពចុងក្រោយ"}
              </p>
            </div>
            {reportTab === "overview" && (
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
            )}
          </div>

          {activeFollowUpTab === "purchase" && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-lg text-blue-500"><FiPackage /></div>
                <div>
                  <p className={`text-base font-extrabold ${theme.pageTitle}`}>ការទិញ / លុយចេញ</p>
                  <p className={`text-sm ${theme.muted}`}>{purchaseMoney.count ?? 0} វិក្កយបត្រទិញ</p>
                </div>
              </div>
              {showPurchaseSummary && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["បានបង់", fmtUsd(purchaseMoney.paidEquivalentUsd), formatKhr(purchaseMoney.paidEquivalentKhr), theme.pageTitle],
                  ["មិនទាន់បង់", fmtUsd(purchaseMoney.outstandingUsd), formatKhr(purchaseMoney.outstandingKhr), "text-amber-600"],
                ].map(([label, value, khrValue, valueClass]) => (
                  <div key={label} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                    <p className={`truncate text-sm font-semibold ${theme.muted}`}>{label}</p>
                    <p className={`mt-1 truncate text-lg font-extrabold tabular-nums ${valueClass}`}>{value}</p>
                    <p className={`mt-0.5 truncate text-xs ${theme.muted}`}>{khrValue}</p>
                  </div>
                ))}
              </div>
              )}
              {showPurchaseProducts && topPurchaseItems.length > 0 && (
                <div className={`mt-4 border-t pt-4 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                  <div className="mb-3">
                    <p className={`text-sm font-bold ${theme.pageTitle}`}>ទំនិញទិញចូល</p>
                    <p className={`mt-0.5 text-xs ${theme.muted}`}>ទំនិញដែលបានទិញក្នុងរយៈពេលដែលជ្រើស</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {topPurchaseItems.map((item) => {
                      const displayName = cleanRepeatedProductName(item.name);

                      return (
                        <div key={`${item.name}-${item.unit}`} className={`rounded-2xl border px-4 py-3 ${theme.softCard}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-bold ${theme.pageTitle}`} title={item.name}>{displayName}</p>
                              <p className={`text-xs ${theme.muted}`}>
                                {Number(item.qty || 0).toLocaleString("en-US")} {item.unit || ""} · {item.count || 0} វិក្កយបត្រទិញ
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className={`text-xs font-bold ${theme.muted}`}>តម្លៃទិញ</p>
                              <p className="text-sm font-extrabold tabular-nums text-blue-600">{fmtUsd(item.totalUsd)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {showSupplierDue && (purchaseMoney.suppliers ?? []).length > 0 && (
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

          {activeFollowUpTab === "debt" && reportTab !== "sales" && (
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

          {activeFollowUpTab === "activity" && (
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

    </section>
  );
}
