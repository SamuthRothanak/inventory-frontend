import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiEye,
  FiPrinter,
  FiRotateCcw,
  FiSearch,
  FiArrowUpRight,
  FiDollarSign,
  FiShoppingCart,
  FiRefreshCcw,
  FiFilter,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiHash,
  FiClock,
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiInbox,
} from "react-icons/fi";

import SalesActivityChart from "./components/SalesActivityChart";
import SummaryCard from "./components/SummaryCard";
import FilterSelect from "./components/FilterSelect";
import StatusBadge from "./components/StatusBadge";
import { RecordPaymentModal } from "./components/RecordPaymentModal";
import { ReturnSaleModal } from "./components/ReturnSaleModal";
import { ViewSaleModal } from "./components/ViewSaleModal";
import SalePrintModal from "./components/SalePrintModal";
import PendingReturnsPanel from "./components/PendingReturnsPanel";
import Tooltip from "./components/Tooltip";
import ViewPendingReturnModal from "./components/ViewPendingReturnModal";
import RecordRefundModal from "./components/RecordRefundModal";
import PermissionGate from "../../../components/PermissionGate";
import { useConfirm } from "../../../components/ConfirmDialog";
import { useNotification } from "../../../components/AppNotification";
import { useLockBodyScroll } from "./utils/useLockBodyScroll";
import { exportSalesCsv, exportSalesExcel, exportSalesPdf } from "./utils/salesExport";
import {
  getSalesApi,
  getSalesSummaryApi,
  getSalesActivityChartApi,
  recordSalePaymentApi,
} from "../../../services/sale.service";
import {
  getSalesReturnsApi,
  rejectSalesReturnApi,
  completeSalesReturnApi,
  resolveSalesReturnApi,
} from "../../../services/salesReturn.service";

// Calendar-day key in the *local* timezone (not UTC) — staff run this app physically in
// Cambodia, so the browser's local clock already matches the shop's report timezone, and this
// must line up with Dashboard's Asia/Phnom_Penh "today" boundary. `.toISOString()` returns the
// UTC date instead, which silently drops/shifts sales made in the 00:00–07:00 local window
// (still "yesterday" in UTC) from "today" totals.
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function transformSale(s) {
  const roundUsd = (value) => Number(Number(value || 0).toFixed(2));
  const soldAt = new Date(s.sold_at || s.created_at);
  return {
    id: s.id,
    saleNo: s.sale_no,
    customerId: s.customer_id,
    customerName: s.customer_name_snapshot || s.customer?.name || "ភ្ញៀវដើរចូល",
    cashierName: s.creator?.name || "—",
    saleType: s.sale_type,
    saleChannel: s.sale_channel,
    invoiceCurrency: s.invoice_currency,
    exchangeRateKhrPerUsd: s.exchange_rate_khr_per_usd,
    saleDate: toLocalDateKey(soldAt),
    soldAtHour: soldAt.getHours(),
    displayDate: soldAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    subtotal: roundUsd(s.subtotal_usd),
    discountTotal: roundUsd(s.discount_total_usd),
    deliveryRequired: Boolean(s.delivery_option && s.delivery_option !== "customer_pickup" && s.delivery_option !== "none"),
    deliveryOption: s.delivery_option,
    deliveryFee: s.delivery_fee_input,
    deliveryFeeCurrency: s.delivery_fee_currency,
    deliveryAddress: s.delivery_address,
    deliveryStatus: s.delivery_status,
    grandTotal: roundUsd(s.grand_total_usd),
    paidTotal: roundUsd(s.paid_total_usd || 0),
    balanceTotal: roundUsd(s.balance_total_usd ?? s.grand_total_usd ?? 0),
    saleStatus: s.sale_status,
    paymentStatus: s.payment_status,
    isPrinted: s.is_printed,
    printedAt: s.printed_at,
    note: s.note,
    items: (s.items || []).map((item) => ({
      id: item.id,
      productVariantUnitId: item.product_variant_unit_id,
      productNameSnapshot: item.product_name_snapshot,
      variantNameSnapshot: item.variant_name_snapshot,
      unitNameSnapshot: item.unit_name_snapshot,
      qty: item.qty,
      baseQty: item.base_qty,
      conversionQtySnapshot: item.conversion_qty_snapshot,
      returnedQtyBase: Number(item.returned_qty_base || 0),
      unitPrice: item.unit_price_usd ?? item.unit_price,
      discountType: item.discount_type,
      discountValue: item.discount_value,
      discountAmount: item.discount_amount_usd,
      lineSubtotal: item.line_subtotal_usd,
      lineTotal: item.line_total_usd,
    })),
    payments: (s.payments || []).map((p) => ({
      id: p.id,
      paymentMethod: p.payment_method,
      providerName: p.provider_name,
      currencyCode: p.currency_code,
      amountReceived: p.amount_received,
      exchangeRateUsed: p.exchange_rate_used,
      amountAppliedInvoiceCurrency: p.amount_applied_invoice_currency,
      changeAmount: p.change_amount,
      changeCurrency: p.change_currency,
      referenceNo: p.reference_no,
      paidAt: p.paid_at,
    })),
    returnsCount:    s.sales_returns_count ?? 0,
    returnsTotalUsd: s.sales_returns_total_usd ?? 0,
    // Unlike returnsTotalUsd (any resolution type — used for isFullyReturned/return badges),
    // this only counts refund-type completed returns — a replacement or store-credit return
    // keeps the customer's original payment, so it must not reduce a revenue figure.
    returnsRefundTotalUsd: s.sales_returns_refund_total_usd ?? 0,
    // A "refund" return can sit completed for a while before recordRefund() is actually called
    // (see the "រង់ចាំសងប្រាក់" tab) — without this, that gap fell through both sums above and
    // the badge below mislabeled it as a "ដូរទំនិញ" (replacement), which it never was.
    returnsPendingRefundTotalUsd: s.sales_returns_pending_refund_total_usd ?? 0,
    isFullyReturned: (s.sales_returns_count ?? 0) > 0 &&
      Number(s.sales_returns_total_usd ?? 0) >= Number(s.grand_total_usd ?? 0) - 0.001,
    returns: [],
  };
}

export default function Sale() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const salesQuery = useQuery({
    queryKey: ["admin-sales"],
    queryFn: () => getSalesApi({ per_page: 200 }),
  });

  const [chartPeriod, setChartPeriod] = useState("សប្ដាហ៍");

  // Khmer chart-toggle label -> backend `period` query param. Both the card ("លក់បានពិត...")
  // and the chart below it are driven by this one value, so they can never disagree on what
  // "this week"/"this month"/etc. means — see [[project_sales_reports_number_consistency]].
  const PERIOD_PARAM = {
    "ថ្ងៃនេះ": "today",
    "សប្ដាហ៍": "week",
    "ខែ": "month",
    "ឆ្នាំ": "year",
    "ទាំងអស់": "all",
  };
  const periodParam = PERIOD_PARAM[chartPeriod] ?? "today";
  const TOTAL_SALES_TITLE = {
    "ថ្ងៃនេះ": "សរុបវិកាយបត្រលក់ថ្ងៃនេះ",
    "សប្ដាហ៍": "សរុបវិកាយបត្រលក់សប្ដាហ៍នេះ",
    "ខែ": "សរុបវិកាយបត្រលក់ខែនេះ",
    "ឆ្នាំ": "សរុបវិកាយបត្រលក់ឆ្នាំនេះ",
    "ទាំងអស់": "សរុបវិកាយបត្រលក់ទាំងអស់",
  };
  const totalSalesTitle = TOTAL_SALES_TITLE[chartPeriod] ?? "សរុបវិកាយបត្រលក់ថ្ងៃនេះ";
  const REAL_SALES_TITLE = {
    "ថ្ងៃនេះ": "លក់បានពិតថ្ងៃនេះ",
    "សប្ដាហ៍": "លក់បានពិតសប្ដាហ៍នេះ",
    "ខែ": "លក់បានពិតខែនេះ",
    "ឆ្នាំ": "លក់បានពិតឆ្នាំនេះ",
    "ទាំងអស់": "លក់បានពិតទាំងអស់",
  };
  const realSalesTitle = REAL_SALES_TITLE[chartPeriod] ?? "លក់បានពិតថ្ងៃនេះ";
  const REFUNDED_TITLE = {
    "ថ្ងៃនេះ": "ប្រាក់សងត្រឡប់ថ្ងៃនេះ",
    "សប្ដាហ៍": "ប្រាក់សងត្រឡប់សប្ដាហ៍នេះ",
    "ខែ": "ប្រាក់សងត្រឡប់ខែនេះ",
    "ឆ្នាំ": "ប្រាក់សងត្រឡប់ឆ្នាំនេះ",
    "ទាំងអស់": "ប្រាក់សងត្រឡប់ទាំងអស់",
  };
  const refundedTitle = REFUNDED_TITLE[chartPeriod] ?? "ប្រាក់សងត្រឡប់ថ្ងៃនេះ";

  // Backend SQL aggregates for the summary cards — NOT derived from `sales` above, which is
  // capped at the 200 most-recently-loaded rows and would silently under-total once the shop
  // passes 200 lifetime sales. Uses the exact same status/gross conventions as the Reports
  // page's "លក់បានសរុប" so the two pages never disagree on what a given number means.
  const salesSummaryQuery = useQuery({
    queryKey: ["admin-sales-summary", periodParam],
    queryFn: () => getSalesSummaryApi(periodParam),
  });

  const salesSummary = salesSummaryQuery.data?.data ?? {};

  const pendingReturnsQuery = useQuery({
    queryKey: ["sales-returns", "pending_review"],
    queryFn: () => getSalesReturnsApi({ status: ["pending_approval", "approved"], per_page: 100 }),
  });

  const pendingReturns = useMemo(() => {
    const res = pendingReturnsQuery.data;
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  }, [pendingReturnsQuery.data]);

  // sale_item_id -> qty already claimed by a return still pending_approval/approved (not yet
  // completed/rejected) — nothing else marks these items as unreturnable, so without this the
  // return modal would let staff submit a duplicate for the same item and only find out it's
  // rejected after filling out the whole form.
  const pendingClaimedBySaleItemId = useMemo(() => {
    const map = {};
    pendingReturns.forEach((ret) => {
      (ret.items || []).forEach((item) => {
        map[item.sale_item_id] = (map[item.sale_item_id] || 0) + Number(item.base_qty || 0);
      });
    });
    return map;
  }, [pendingReturns]);

  // Whether any line item on this sale still has qty left to return, after subtracting both
  // completed returns AND whatever's already claimed by a pending_approval/approved one — used
  // to disable the row-level "ត្រឡប់" button itself instead of only gating the per-item
  // checkboxes once the modal is already open.
  const hasReturnableItems = (sale) =>
    (sale.items || []).some((item) => {
      const remainingAfterCompleted = Number(item.baseQty || 0) - Number(item.returnedQtyBase || 0);
      const pendingClaimed = Number(pendingClaimedBySaleItemId[item.id] || 0);
      return remainingAfterCompleted - pendingClaimed > 0.0001;
    });

  const [sales, setSales] = useState([]);

  useEffect(() => {
    if (salesQuery.data?.data) {
      setSales(salesQuery.data.data.map(transformSale));
    }
  }, [salesQuery.data]);

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // "រង់ចាំអនុម័ត" tab's own search/filters — kept separate from the main table's
  // searchTerm/*Filter state above so switching tabs never cross-contaminates either one.
  const [pendingReturnsSearch, setPendingReturnsSearch] = useState("");
  const [pendingReturnsResolutionFilter, setPendingReturnsResolutionFilter] = useState("All");
  const [pendingReturnsStatusFilter, setPendingReturnsStatusFilter] = useState("All");

  const filteredPendingReturns = useMemo(() => {
    const term = pendingReturnsSearch.trim().toLowerCase();
    return pendingReturns.filter((ret) => {
      const matchesSearch =
        !term ||
        ret.sales_return_no?.toLowerCase().includes(term) ||
        ret.original_sale_no_snapshot?.toLowerCase().includes(term) ||
        ret.customer_name_snapshot?.toLowerCase().includes(term) ||
        (ret.items || []).some((item) =>
          (item.product_name_snapshot || "").toLowerCase().includes(term) ||
          (item.variant_name_snapshot || "").toLowerCase().includes(term)
        );

      const matchesResolution =
        pendingReturnsResolutionFilter === "All" ||
        ret.resolution_type === pendingReturnsResolutionFilter;

      const matchesStatus =
        pendingReturnsStatusFilter === "All" ||
        ret.status === pendingReturnsStatusFilter;

      return matchesSearch && matchesResolution && matchesStatus;
    });
  }, [pendingReturns, pendingReturnsSearch, pendingReturnsResolutionFilter, pendingReturnsStatusFilter]);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnableItems, setReturnableItems] = useState([]);
  const [rpForm, setRpForm] = useState({
    payment_mode: "full",
    payment_method: "cash",
    currency_code: "USD",
    amount_received: "",
    cash_currency_code: "USD",
    cash_amount_received: "",
    transfer_currency_code: "USD",
    transfer_amount_received: "",
    provider_name: "ABA",
    provider_other_name: "",
    exchange_rate_used: "",
    reference_no: "",
    paid_at: "",
    note: "",
  });

  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const notify = useNotification();
  const [processingReturnId, setProcessingReturnId] = useState(null);
  const [viewingReturn, setViewingReturn] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null); // the sales return being refunded
  const [refundForm, setRefundForm] = useState({
    refund_method: "cash",
    refund_provider_name: "",
    refund_reference_no: "",
    refund_currency: "USD",
    refund_amount_input: "",
    refund_exchange_rate_used: "",
  });

  useLockBodyScroll(Boolean(modalMode));

  const theme = {
    pageTitle: isDark ? "text-white" : "text-zinc-900",

    card: isDark
      ? "border-white/10 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modal: isDark
      ? "border-white/10 bg-[#111113] text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modalHeader: isDark
      ? "border-white/10 bg-[#111113]"
      : "border-zinc-200 bg-white",

    modalBody: isDark ? "bg-[#151518]" : "bg-zinc-50/70",

    muted: isDark ? "text-zinc-400" : "text-zinc-500",

    input: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",

    select: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",

    tableWrap: isDark
      ? "border-white/10 bg-zinc-900"
      : "border-zinc-200 bg-white",

    row: isDark
      ? "border-white/10 text-zinc-200 hover:bg-white/[0.04]"
      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",

    badge: isDark
      ? "border-white/10 bg-white/5 text-zinc-200"
      : "border-zinc-200 bg-zinc-100 text-zinc-700",

    softCard: isDark
      ? "border-white/10 bg-white/[0.04]"
      : "border-zinc-200 bg-white",

    section: isDark
      ? "border-white/10 bg-[#18181b]"
      : "border-zinc-200 bg-white",
  };

  const filteredSales = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    return sales.filter((sale) => {
      const paymentNames = sale.payments
        .map((payment) => payment.providerName)
        .join(" ")
        .toLowerCase();

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" &&
          (sale.paymentStatus === "unpaid" || sale.paymentStatus === "partial")) ||
        (activeTab === "refunded" && (sale.paymentStatus === "refunded" || sale.returnsCount > 0));

      const matchesSearch =
        !keyword ||
        sale.saleNo.toLowerCase().includes(keyword) ||
        sale.customerName.toLowerCase().includes(keyword) ||
        sale.cashierName.toLowerCase().includes(keyword) ||
        sale.saleType.toLowerCase().includes(keyword) ||
        sale.saleChannel.toLowerCase().includes(keyword) ||
        paymentNames.includes(keyword) ||
        sale.items.some(
          (item) =>
            item.productNameSnapshot.toLowerCase().includes(keyword) ||
            item.variantNameSnapshot.toLowerCase().includes(keyword)
        );

      const matchesDate = !startDate || sale.saleDate === startDate;

      const matchesSaleType =
        saleTypeFilter === "All" || sale.saleType === saleTypeFilter;

      const matchesPaymentStatus =
        activeTab !== "all" ||
        paymentStatusFilter === "All" ||
        sale.paymentStatus === paymentStatusFilter;

      return (
        matchesTab &&
        matchesSearch &&
        matchesDate &&
        matchesSaleType &&
        matchesPaymentStatus
      );
    });
  }, [
    sales,
    activeTab,
    searchTerm,
    startDate,
    saleTypeFilter,
    paymentStatusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchTerm,
    startDate,
    saleTypeFilter,
    paymentStatusFilter,
    perPage,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginationStart = filteredSales.length === 0 ? 0 : (safeCurrentPage - 1) * perPage + 1;
  const paginationEnd = Math.min(safeCurrentPage * perPage, filteredSales.length);

  const paginatedSales = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * perPage;
    return filteredSales.slice(startIndex, startIndex + perPage);
  }, [filteredSales, safeCurrentPage, perPage]);

  const handleExport = (type) => {
    setExportMenuOpen(false);
    const exportFilters = {
      search: searchTerm,
      activeTab,
      startDate,
      saleType: saleTypeFilter,
      paymentStatus: paymentStatusFilter,
    };
    if (type === "pdf") {
      const opened = exportSalesPdf(filteredSales, exportFilters);
      if (!opened) {
        window.alert("PDF export was blocked by the browser. Please allow pop-ups and try again.");
      }
      return;
    }
    if (type === "excel") {
      exportSalesExcel(filteredSales, exportFilters);
      return;
    }
    exportSalesCsv(filteredSales, exportFilters);
  };

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, safeCurrentPage - half);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safeCurrentPage, totalPages]);

  const activityChartQuery = useQuery({
    queryKey: ["admin-sales-activity-chart", periodParam],
    queryFn: () => getSalesActivityChartApi(periodParam),
  });

  const activeChartData = activityChartQuery.data?.data ?? [];

  const totalSalesAmount = Number(salesSummary.total_sales_usd || 0);
  const realSalesAmount = Number(salesSummary.real_sales_usd || 0);
  const refundedAmount = Number(salesSummary.refunded_usd || 0);
  const pendingPaymentAmount = Number(salesSummary.pending_payment_usd || 0);

  const displayRate = sales.length > 0 ? Number(sales[0].exchangeRateKhrPerUsd) || 4100 : 4100;

  const fmtUsd = (n) =>
    "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtKhr = (n) =>
    Number(n) > 0
      ? "= " + Math.round(Number(n) * displayRate).toLocaleString() + " ៛"
      : null;

  const METHOD_LABEL = { cash: "សាច់ប្រាក់", bank_transfer: "ផ្ទេរ", qr: "QR", card: "កាត", other: "ផ្សេងៗ" };

  const PAYMENT_STATUS_LABEL = { paid: "បានទូទាត់", partial: "បង់មួយចំណែក", unpaid: "មិនទាន់បង់", refunded: "ត្រឡប់ប្រាក់" };
  const SALE_STATUS_LABEL    = { completed: "បញ្ចប់ហើយ", confirmed: "បញ្ជាក់ហើយ", draft: "ព្រាង", cancelled: "បោះបង់ហើយ" };
  const SALE_TYPE_LABEL      = { retail: "លក់រាយ", wholesale: "លក់ដុំ" };
  const DELIVERY_OPTION_KH  = { delivery: "ដឹកជញ្ជូន", customer_pickup: "ទៅយកផ្ទាល់" };
  const DELIVERY_STATUS_KH  = { none: "—", pending: "រង់ចាំ", shipped: "កំពុងដឹក", delivered: "ដឹកដល់", cancelled: "បោះបង់" };

  const getPaymentSummary = (sale) => {
    if (!sale.payments.length) return "—";

    const labels = sale.payments.map((p) => p.providerName || METHOD_LABEL[p.paymentMethod] || p.paymentMethod);
    return [...new Set(labels)].join(" + ");
  };

  const getChangeSummary = (sale) => {
    const totals = sale.payments.reduce((sum, p) => {
      const change = Number(p.changeAmount || 0);
      if (change <= 0) return sum;
      const currency = p.changeCurrency === "KHR" ? "KHR" : "USD";
      sum[currency] += change;
      return sum;
    }, { USD: 0, KHR: 0 });

    return [
      totals.USD > 0 ? fmtUsd(totals.USD) : null,
      totals.KHR > 0 ? `${Math.round(totals.KHR).toLocaleString()} ៛` : null,
    ].filter(Boolean).join(" + ") || null;
  };

  const shouldShowTotalEquivalent = (sale) =>
    sale.paymentStatus === "unpaid" || sale.paymentStatus === "partial" || sale.payments.length === 0;

  const getSaleTotalDisplay = (sale) => {
    if (!shouldShowTotalEquivalent(sale) && sale.payments.length === 1 && sale.payments[0].currencyCode === "KHR") {
      return `${Math.round(sale.grandTotal * sale.exchangeRateKhrPerUsd).toLocaleString()} ៛`;
    }

    return `$${Number(sale.grandTotal).toFixed(2)}`;
  };

  const getItemsCount = (sale) => {
    return sale.items.reduce((total, item) => total + Number(item.qty || 0), 0);
  };

  const getSaleStatusClass = (status) => {
    if (status === "completed") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    if (status === "confirmed") {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }

    if (status === "draft") {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }

    return "bg-red-500/10 text-red-500 dark:text-red-400";
  };

  const getSaleStatusIcon = (status) => {
    if (status === "completed") return <FiCheckCircle />;
    if (status === "confirmed") return <FiClock />;
    if (status === "draft") return <FiFileText />;
    return <FiXCircle />;
  };

  const getPaymentStatusClass = (status) => {
    if (status === "paid") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    if (status === "partial") {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }

    return "bg-red-500/10 text-red-500 dark:text-red-400";
  };

  const getPaymentStatusIcon = (status) => {
    if (status === "paid") return <FiCheckCircle />;
    if (status === "partial") return <FiClock />;
    if (status === "refunded") return <FiRefreshCcw />;
    return <FiXCircle />;
  };

  const openViewModal = (sale) => {
    setSelectedSale(sale);
    setModalMode("view");
  };

  const openReturnModal = (sale) => {
    setSelectedSale(sale);

    // maxQty must subtract whatever was already returned on a prior partial return, AND
    // whatever's still claimed by another return sitting in pending_approval/approved —
    // otherwise the form offers qty that's already spoken for (backend's validateReturnQty
    // rejects the overflow, but only after the user fills the whole form and hits save).
    const items = sale.items.map((item) => {
      const conversionQty = Number(item.conversionQtySnapshot) || 1;
      const remainingAfterCompleted = Math.max(0, Number(item.baseQty || 0) - Number(item.returnedQtyBase || 0));
      const pendingClaimedBase = Number(pendingClaimedBySaleItemId[item.id] || 0);
      const remainingBase = Math.max(0, remainingAfterCompleted - pendingClaimedBase);
      const maxQty = Math.round((remainingBase / conversionQty) * 1000) / 1000;
      const isPendingClaimed = remainingAfterCompleted > 0 && remainingBase <= 0;

      return {
        saleItemId: item.id,
        productVariantUnitId: item.productVariantUnitId,
        productName: item.productNameSnapshot,
        variantName: item.variantNameSnapshot,
        unitName: item.unitNameSnapshot,
        conversionQty,
        unitPrice: item.unitPrice,
        maxQty,
        isPendingClaimed,
      };
    });

    setReturnableItems(items);
    setModalMode("return");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSale(null);
    setReturnableItems([]);
  };

  const openRecordPaymentModal = (sale) => {
    setSelectedSale(sale);
    setRpForm({
      payment_mode: "full",
      payment_method: "cash",
      currency_code: "USD",
      amount_received: Number(sale.balanceTotal).toFixed(2),
      cash_currency_code: "USD",
      cash_amount_received: "",
      transfer_currency_code: "USD",
      transfer_amount_received: "",
      provider_name: "ABA",
      provider_other_name: "",
      exchange_rate_used: Number(sale.exchangeRateKhrPerUsd || 4100),
      reference_no: "",
      paid_at: new Date().toISOString().slice(0, 10),
      note: "",
    });
    setModalMode("record-payment");
  };

  const handleRpFormChange = (field, value) => {
    setRpForm((prev) => ({
      ...prev,
      ...(field === "payment_mode" && value === "partial"
        ? { amount_received: "", cash_amount_received: "", transfer_amount_received: "" }
        : {}),
      ...(field === "payment_mode" && value === "full" && selectedSale
        ? { amount_received: Number(selectedSale.balanceTotal).toFixed(2) }
        : {}),
      ...(field === "payment_method"
        ? { amount_received: "", cash_amount_received: "", transfer_amount_received: "" }
        : {}),
      [field]: value,
    }));
  };

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, payload }) => recordSalePaymentApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sales-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sales-activity-chart"] });
    },
  });

  const handleRecordPayment = async () => {
    if (!selectedSale) return;
    const balance = Number(selectedSale.balanceTotal);
    const rate = Number(rpForm.exchange_rate_used) || Number(selectedSale.exchangeRateKhrPerUsd) || 4100;
    const toUsd = (amount, currency) => (currency === "KHR" ? Number(amount || 0) / rate : Number(amount || 0));
    const fullAmountFor = (currency) => (currency === "KHR" ? Math.round(balance * rate) : Number(balance.toFixed(2)));
    const providerName = rpForm.provider_name === "ផ្សេងៗ" ? rpForm.provider_other_name : rpForm.provider_name;
    const basePayload = {
      ...(rpForm.exchange_rate_used && { exchange_rate_used: Number(rpForm.exchange_rate_used) }),
      ...(rpForm.reference_no && { reference_no: rpForm.reference_no }),
      ...(rpForm.paid_at && { paid_at: rpForm.paid_at }),
      ...(rpForm.note && { note: rpForm.note }),
    };

    const buildPayment = (paymentMethod, currencyCode, amountReceived, provider = "") => ({
      ...basePayload,
      payment_method: paymentMethod,
      currency_code: currencyCode,
      amount_received: Number(amountReceived),
      ...(provider && { provider_name: provider }),
    });

    let payments = [];

    if (rpForm.payment_method === "split") {
      const transferAmount = Number(rpForm.transfer_amount_received || 0);
      const cashAmount = Number(rpForm.cash_amount_received || 0);
      const totalUsd =
        toUsd(transferAmount, rpForm.transfer_currency_code) +
        toUsd(cashAmount, rpForm.cash_currency_code);

      if (totalUsd <= 0 || totalUsd > balance + 0.001) return;
      if (rpForm.payment_mode === "full" && Math.abs(totalUsd - balance) > 0.001) return;

      if (transferAmount > 0) {
        payments.push(buildPayment("bank_transfer", rpForm.transfer_currency_code, transferAmount, providerName || "ធនាគារ / QR"));
      }
      if (cashAmount > 0) {
        payments.push(buildPayment("cash", rpForm.cash_currency_code, cashAmount));
      }
    } else {
      const currencyCode = rpForm.currency_code;
      const amountReceived =
        rpForm.payment_mode === "full" ? fullAmountFor(currencyCode) : Number(rpForm.amount_received || 0);
      const amountUsd = toUsd(amountReceived, currencyCode);

      if (amountUsd <= 0 || amountUsd > balance + 0.001) return;

      payments.push(
        buildPayment(
          rpForm.payment_method === "bank_transfer" ? "bank_transfer" : "cash",
          currencyCode,
          amountReceived,
          rpForm.payment_method === "bank_transfer" ? providerName || "ធនាគារ / QR" : ""
        )
      );
    }

    if (!payments.length) return;

    try {
      for (const payload of payments) {
        await recordPaymentMutation.mutateAsync({ id: selectedSale.id, payload });
      }
      closeModal();
    } catch (error) {
      console.error("Failed to record sale payment", error);
    }
  };

  const handlePrint = (sale) => {
    setSelectedSale(sale);
    setModalMode("print");
    setSales((previous) =>
      previous.map((item) =>
        item.id === sale.id
          ? { ...item, isPrinted: true, printedAt: new Date().toISOString().slice(0, 16).replace("T", " ") }
          : item
      )
    );
  };

  const handleReturnSuccess = (data, form) => {
    queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sales-summary"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sales-activity-chart"] });
    // Must match pendingReturnsQuery's actual key ("pending_review") — this used to say
    // "pending_approval", a key nothing was ever registered under, so submitting a new
    // return never refreshed the "រង់ចាំអនុម័ត" tab/count; only a manual page reload did.
    queryClient.invalidateQueries({ queryKey: ["sales-returns", "pending_review"] });
    closeModal();
    if (form.status === "approved") {
      notify.success("បានកត់ត្រាការត្រឡប់", "កំពុងរង់ចាំទំនិញចូលស្តុក។");
    } else {
      notify.success("បានដាក់ស្នើសំណើត្រឡប់", "រង់ចាំការអនុម័ត។");
    }
  };

  const handleReturnError = (err) => {
    const msg =
      err?.response?.data?.message ||
      (err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : null) ||
      err?.message ||
      "Failed to create return. Please try again.";
    alert(msg);
  };

  const getReturnActionErrorMessage = (err, fallback) =>
    err?.response?.data?.message ||
    (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : null) ||
    err?.message ||
    fallback;

  const invalidatePendingReturns = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sales-summary"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sales-activity-chart"] });
    queryClient.invalidateQueries({ queryKey: ["sales-returns", "pending_review"] });
  };

  const approveReturnMutation = useMutation({
    // Atomic backend action (approve+complete in one request/transaction) — see
    // resolveSalesReturnApi's own comment for why this replaced 2 chained calls.
    mutationFn: (returnId) => resolveSalesReturnApi(returnId),
    onSuccess: () => {
      invalidatePendingReturns();
      notify.success("បានអនុម័ត", "ការត្រឡប់ត្រូវបានអនុម័ត និងបញ្ចប់រួចហើយ។");
    },
    onError: (err) => {
      alert(getReturnActionErrorMessage(err, "ការអនុម័តបរាជ័យ។ សូមព្យាយាមម្តងទៀត។"));
    },
    onSettled: () => setProcessingReturnId(null),
  });

  const rejectReturnMutation = useMutation({
    mutationFn: ({ returnId, reason }) => rejectSalesReturnApi(returnId, reason),
    onSuccess: () => {
      invalidatePendingReturns();
      notify.success("បានបដិសេធ", "សំណើត្រឡប់ត្រូវបានបដិសេធរួចហើយ។");
    },
    onError: (err) => {
      alert(getReturnActionErrorMessage(err, "ការបដិសេធបរាជ័យ។ សូមព្យាយាមម្តងទៀត។"));
    },
    onSettled: () => setProcessingReturnId(null),
  });

  const completeReturnMutation = useMutation({
    // Return is already "approved" (waiting for stock) — a single complete() call applies
    // the stock action and marks it completed.
    mutationFn: (returnId) => completeSalesReturnApi(returnId),
    onSuccess: () => {
      invalidatePendingReturns();
      notify.success("បានបញ្ចប់", "ការត្រឡប់ត្រូវបានបញ្ចប់រួចហើយ។");
    },
    onError: (err) => {
      alert(getReturnActionErrorMessage(err, "ការបញ្ចប់ការត្រឡប់បរាជ័យ។ សូមព្យាយាមម្តងទៀត។"));
    },
    onSettled: () => setProcessingReturnId(null),
  });

  // resolution_type === "refund" returns need one more step than replacement returns —
  // completing them doesn't itself record that cash actually left the register. resolveSalesReturnApi
  // handles whatever combination of approve/complete/refund the return still needs (it skips
  // whichever steps are already done based on current status) in one request/transaction, so
  // from the cashier's side it's one action same as the plain approve button.
  const refundReturnMutation = useMutation({
    mutationFn: ({ ret, payload }) => resolveSalesReturnApi(ret.id, payload),
    onSuccess: () => {
      invalidatePendingReturns();
      notify.success("បានកត់ត្រាការសងប្រាក់", "ការសងប្រាក់ត្រូវបានកត់ត្រារួចរាល់ហើយ។");
      setRefundTarget(null);
    },
    onError: (err) => {
      alert(getReturnActionErrorMessage(err, "ការកត់ត្រាការសងប្រាក់បរាជ័យ។ សូមព្យាយាមម្តងទៀត។"));
    },
    onSettled: () => setProcessingReturnId(null),
  });

  const openRefundModal = (ret) => {
    setRefundTarget(ret);
    setRefundForm({
      refund_method: "cash",
      refund_provider_name: "",
      refund_reference_no: "",
      refund_currency: "USD",
      refund_amount_input: String(ret.total_amount_usd || ""),
      refund_exchange_rate_used: String(ret.exchange_rate_used || ""),
    });
  };

  const handleRefundFormChange = (key, value) => {
    setRefundForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitRefund = () => {
    if (!refundTarget) return;
    const ret = refundTarget;
    setProcessingReturnId(ret.id);
    refundReturnMutation.mutate({
      ret,
      payload: {
        refund_method: refundForm.refund_method,
        refund_provider_name: refundForm.refund_provider_name || undefined,
        refund_reference_no: refundForm.refund_reference_no || undefined,
        refund_currency: refundForm.refund_currency,
        refund_amount_input: Number(refundForm.refund_amount_input || 0),
        refund_exchange_rate_used:
          refundForm.refund_currency === "KHR"
            ? Number(refundForm.refund_exchange_rate_used || 0) || undefined
            : undefined,
      },
    });
  };

  const handleApprovePendingReturn = async (ret) => {
    // resolution_type "refund" needs cash-refund details recorded, not just a plain
    // confirm — route through the refund modal instead (it does approve+complete+refund
    // together on submit, same one-click feel as every other return type still gets below).
    if (ret.resolution_type === "refund") {
      openRefundModal(ret);
      return;
    }

    const ok = await confirm(
      `តើអ្នកប្រាកដថាចង់អនុម័តការត្រឡប់ ${ret.sales_return_no} សម្រាប់ ${ret.original_sale_no_snapshot}? ស្តុក/ការសងប្រាក់ នឹងប៉ះពាល់ភ្លាមៗ។`,
      { title: "អនុម័តការត្រឡប់", confirmLabel: "អនុម័ត", cancelLabel: "បោះបង់" }
    );
    if (!ok) return;
    setProcessingReturnId(ret.id);
    approveReturnMutation.mutate(ret.id);
  };

  const handleCompletePendingReturn = async (ret) => {
    if (ret.resolution_type === "refund") {
      openRefundModal(ret);
      return;
    }

    const ok = await confirm(
      `តើទំនិញចូលស្តុករួចហើយឬ? ការត្រឡប់ ${ret.sales_return_no} សម្រាប់ ${ret.original_sale_no_snapshot} នឹងចូលជាបញ្ចប់ ស្តុក/ការសងប្រាក់ នឹងប៉ះពាល់ភ្លាមៗ។`,
      { title: "បញ្ចប់ការត្រឡប់", confirmLabel: "បញ្ចប់", cancelLabel: "បោះបង់" }
    );
    if (!ok) return;
    setProcessingReturnId(ret.id);
    completeReturnMutation.mutate(ret.id);
  };

  const handleRejectPendingReturn = async (ret) => {
    const reason = await confirm(
      `សូមបញ្ចូលមូលហេតុបដិសេធ/លុបចោលការត្រឡប់ ${ret.sales_return_no}:`,
      { title: "បដិសេធ/លុបចោលការត្រឡប់", confirmLabel: "បញ្ជាក់", cancelLabel: "បោះបង់", reasonRequired: true }
    );
    if (!reason) return;
    setProcessingReturnId(ret.id);
    rejectReturnMutation.mutate({ returnId: ret.id, reason });
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <SummaryCard
          theme={theme}
          title={totalSalesTitle}
          value={fmtUsd(totalSalesAmount)}
          subValue={fmtKhr(totalSalesAmount)}
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title={realSalesTitle}
          value={fmtUsd(realSalesAmount)}
          subValue={fmtKhr(realSalesAmount)}
          icon={<FiShoppingCart className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="លុយមិនទាន់ទូទាត់"
          value={fmtUsd(pendingPaymentAmount)}
          subValue={fmtKhr(pendingPaymentAmount)}
          icon={<FiClock className="text-[34px] text-amber-500" />}
          iconBg="bg-amber-500/10"
        />

        <SummaryCard
          theme={theme}
          title={refundedTitle}
          value={fmtUsd(refundedAmount)}
          subValue={fmtKhr(refundedAmount)}
          icon={<FiRefreshCcw className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      <SalesActivityChart
        theme={theme}
        isDark={isDark}
        data={activeChartData}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
      />

      {/* Sales Table */}
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        {/* Tabs — grid layout matching Purchases.jsx's tab bar style (evenly-spaced, centered,
            border-zinc-800 dark border) instead of the previous left-aligned flex row. */}
        <div className={`grid grid-cols-2 border-b px-2 sm:grid-cols-4 sm:px-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
          {[
            { id: "all",      label: "ទាំងអស់",       icon: <FiShoppingCart />, count: sales.length,                                                                                        alert: false },
            { id: "pending",  label: "មិនទាន់ទូទាត់", icon: <FiClock />,        count: sales.filter((s) => s.paymentStatus === "unpaid" || s.paymentStatus === "partial").length,           alert: true  },
            { id: "pending_returns", label: "រង់ចាំអនុម័ត", icon: <FiInbox />,   count: pendingReturns.length,                                                                              alert: true  },
            { id: "refunded", label: "ដោះស្រាយរួច",     icon: <FiRefreshCcw />,   count: sales.filter((s) => s.paymentStatus === "refunded" || s.returnsCount > 0).length,               alert: false },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-2 py-3.5 text-xs font-bold transition sm:px-3 ${
                activeTab === tab.id
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab.alert
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "pending_returns" ? (
          <>
            {/* Filter bar — own search/filters, matching the other tabs' filter bar style but
                scoped to this tab's own state so it never cross-contaminates the main table. */}
            <div className="border-b border-zinc-200 px-4 py-4 dark:border-white/10 space-y-3">
              <div className="relative">
                <FiSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.muted}`} />
                <input
                  type="text"
                  value={pendingReturnsSearch}
                  onChange={(e) => setPendingReturnsSearch(e.target.value)}
                  placeholder="ស្វែងរក លេខសំណើ, វិក្កយបត្រដើម, អតិថិជន, ផលិតផល..."
                  className={`h-11 w-full rounded-2xl border pl-10 pr-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <FilterSelect icon={<FiRefreshCcw />} value={pendingReturnsResolutionFilter} onChange={setPendingReturnsResolutionFilter} theme={theme}
                  options={[
                    { value: "All", label: "ដំណោះស្រាយទាំងអស់" },
                    { value: "refund", label: "សងប្រាក់" },
                    { value: "replacement", label: "ដូរទំនិញ" },
                  ]}
                />
                <FilterSelect icon={<FiFilter />} value={pendingReturnsStatusFilter} onChange={setPendingReturnsStatusFilter} theme={theme}
                  options={[
                    { value: "All", label: "ស្ថានភាពទាំងអស់" },
                    { value: "pending_approval", label: "រង់ចាំអនុម័ត" },
                    { value: "approved", label: "ចាំស្តុក" },
                  ]}
                />
              </div>
            </div>
            <PendingReturnsPanel
              theme={theme}
              returns={filteredPendingReturns}
              isLoading={pendingReturnsQuery.isLoading}
              onApprove={handleApprovePendingReturn}
              onComplete={handleCompletePendingReturn}
              onReject={handleRejectPendingReturn}
              onView={setViewingReturn}
              processingId={processingReturnId}
            />
          </>
        ) : (
        <>
        {/* Filter bar inside card */}
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-white/10 space-y-3">
          {/* Row 1: Search + POS button */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FiSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.muted}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរក វិក្កយបត្រ, អតិថិជន, ផលិតផល..."
                className={`h-11 w-full rounded-2xl border pl-10 pr-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
              />
            </div>
            <Link
              to="/pos"
              className="quick-action-icon-3d inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0"
            >
              បើក POS <FiArrowUpRight />
            </Link>
          </div>

          {/* Row 2: Filters + per page — date + saleType + perPage always show (3); payment-status
              is "all"-tab-only, adding 1 more (4) when visible. */}
          <div className={`grid gap-3 grid-cols-2 ${
            activeTab === "all" ? "xl:grid-cols-4" : "xl:grid-cols-3"
          }`}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`h-14 w-full rounded-2xl border px-4 text-sm outline-none transition focus:ring-4 ${theme.select}`}
            />

            <FilterSelect icon={<FiUser />} value={saleTypeFilter} onChange={setSaleTypeFilter} theme={theme}
              options={[
                { value: "All", label: "ប្រភេទទាំងអស់" },
                { value: "retail", label: "លក់រាយ" },
                { value: "wholesale", label: "លក់ដុំ" },
              ]}
            />

            {activeTab === "all" && (
              <FilterSelect icon={<FiCreditCard />} value={paymentStatusFilter} onChange={setPaymentStatusFilter} theme={theme}
                options={[
                  { value: "All", label: "ការទូទាត់ទាំងអស់" },
                  { value: "unpaid", label: "មិនទាន់បង់" },
                  { value: "partial", label: "បង់មួយចំណែក" },
                  { value: "paid", label: "បានទូទាត់" },
                  { value: "refunded", label: "ត្រឡប់ប្រាក់" },
                ]}
              />
            )}

            {/* No sale-status filter — removed entirely (not just trimmed) after confirming
                every sale in this system is always `completed`: draft is only ever a transient
                in-transaction value (POS always sends sale_status:"completed"), confirmed isn't
                in StoreSaleRequest/UpdateSaleRequest's validation whitelist (impossible via the
                API), and "voiding" a sale soft-deletes it rather than setting sale_status to
                cancelled. With only one reachable value, "ទាំងអស់" vs "បញ្ចប់ហើយ" always showed
                the identical result set — a control that can never change what's on screen is
                worse than no control. Re-add if/when a real draft-save or cancel-status feature
                ships. */}

            <FilterSelect icon={<FiHash />} value={perPage} onChange={(v) => setPerPage(Number(v))} theme={theme}
              options={[
                { value: 10, label: "10 / ទំព័រ" },
                { value: 25, label: "25 / ទំព័រ" },
                { value: 50, label: "50 / ទំព័រ" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-white/10">
          <p className={`text-xs ${theme.muted}`}>
            បង្ហាញ {paginationStart}-{paginationEnd} នៃ {filteredSales.length} វិក្កយបត្រ
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => filteredSales.length > 0 && setExportMenuOpen((open) => !open)}
              disabled={filteredSales.length === 0}
              className={`table-icon-3d inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${theme.badge} hover:border-red-400 hover:text-red-500`}
            >
              <FiDownload />
              Export
              <FiChevronDown className={`transition ${exportMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {exportMenuOpen && (
              <div className={`absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-xl border py-1 shadow-xl ${isDark ? "border-white/10 bg-zinc-900" : "border-zinc-200 bg-white"}`}>
                {[
                  ["pdf", "PDF"],
                  ["csv", "CSV"],
                  ["excel", "Excel"],
                ].map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleExport(type)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition ${isDark ? "text-zinc-100 hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100"}`}
                  >
                    <FiFileText />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-white/10 lg:hidden">
          {salesQuery.isLoading && (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500/20 border-t-red-500" />
              <p className={`mt-4 text-sm font-semibold ${theme.muted}`}>កំពុងផ្ទុកការលក់...</p>
            </div>
          )}

          {!salesQuery.isLoading && paginatedSales.map((sale) => (
            <article key={sale.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className={`break-words text-base font-extrabold leading-6 ${theme.pageTitle}`}>
                    {sale.saleNo}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}>
                      {SALE_TYPE_LABEL[sale.saleType] ?? sale.saleType}
                    </span>
                    <span className={`text-xs ${theme.muted}`}>
                      {sale.displayDate} · <span className="font-semibold text-blue-500">{sale.cashierName}</span>
                    </span>
                  </div>
                </div>

                <StatusBadge
                  status={sale.saleStatus}
                  label={SALE_STATUS_LABEL[sale.saleStatus]}
                  getStatusClass={getSaleStatusClass}
                  getStatusIcon={getSaleStatusIcon}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className={`min-w-0 rounded-2xl border p-3 ${theme.softCard}`}>
                  <p className={`text-[11px] font-semibold ${theme.muted}`}>អតិថិជន</p>
                  <p className={`mt-1.5 truncate text-sm font-bold ${theme.pageTitle}`} title={sale.customerName}>
                    {sale.customerName}
                  </p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>
                    {sale.customerId ? "លក់ដុំ" : "លក់រាយ"}
                  </p>
                </div>

                <div className={`min-w-0 rounded-2xl border p-3 ${theme.softCard}`}>
                  <p className={`text-[11px] font-semibold ${theme.muted}`}>តម្លៃសរុប</p>
                  <p className={`mt-1.5 break-words text-lg font-extrabold tabular-nums ${theme.pageTitle}`}>
                    {getSaleTotalDisplay(sale)}
                  </p>
                  {shouldShowTotalEquivalent(sale) && (
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      ≈ {Math.round(Number(sale.grandTotal || 0) * Number(sale.exchangeRateKhrPerUsd || 0)).toLocaleString()} ៛
                    </p>
                  )}
                </div>

                <div className={`min-w-0 rounded-2xl border p-3 ${theme.softCard}`}>
                  <p className={`text-[11px] font-semibold ${theme.muted}`}>ទំនិញ</p>
                  <p className={`mt-1.5 text-sm font-bold ${theme.pageTitle}`}>
                    {sale.items.length} មុខ · {getItemsCount(sale)} ចំនួន
                  </p>
                  <p className={`mt-1 truncate text-xs ${theme.muted}`}>
                    {sale.items.map((item) => item.variantNameSnapshot).filter(Boolean).join(", ") || "-"}
                  </p>
                </div>

                <div className={`min-w-0 rounded-2xl border p-3 ${theme.softCard}`}>
                  <p className={`text-[11px] font-semibold ${theme.muted}`}>ការទូទាត់</p>
                  <p className={`mt-1.5 truncate text-sm font-bold ${theme.pageTitle}`}>
                    {getPaymentSummary(sale)}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      status={sale.paymentStatus}
                      label={PAYMENT_STATUS_LABEL[sale.paymentStatus]}
                      getStatusClass={getPaymentStatusClass}
                      getStatusIcon={getPaymentStatusIcon}
                    />
                  </div>
                </div>
              </div>

              {sale.deliveryRequired && (
                <div className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2.5 ${isDark ? "bg-sky-500/10" : "bg-sky-50"}`}>
                  <span className={`text-xs font-semibold ${theme.muted}`}>ថ្លៃដឹកជញ្ជូន</span>
                  <span className="text-sm font-bold text-sky-600">
                    ${Number(sale.deliveryFee || 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-200 pt-3 dark:border-white/10">
                <span className={`mr-auto text-[11px] font-bold ${theme.muted}`}>សកម្មភាព</span>
                <PermissionGate permission="sales.create">
                  {(sale.paymentStatus === "unpaid" || sale.paymentStatus === "partial") && (
                    <button
                      type="button"
                      onClick={() => openRecordPaymentModal(sale)}
                      title="កត់ត្រាការទូទាត់"
                      aria-label="កត់ត្រាការទូទាត់"
                      className="quick-action-icon-3d inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0"
                    >
                      <FiCreditCard size={17} />
                    </button>
                  )}
                </PermissionGate>

                <button
                  type="button"
                  onClick={() => openViewModal(sale)}
                  title="មើលវិក្កយបត្រ"
                  aria-label="មើលវិក្កយបត្រ"
                  className="quick-action-icon-3d inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0"
                >
                  <FiEye size={17} />
                </button>

                <PermissionGate permission="sales.print_receipt">
                  <button
                    type="button"
                    onClick={() => handlePrint(sale)}
                    title="បោះពុម្ពវិក្កយបត្រ"
                    aria-label="បោះពុម្ពវិក្កយបត្រ"
                    className="quick-action-icon-3d inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-emerald-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:translate-y-0"
                  >
                    <FiPrinter size={17} />
                  </button>
                </PermissionGate>

                <PermissionGate permission="sales.refund">
                  <button
                    type="button"
                    disabled={sale.paymentStatus !== "paid" || sale.saleStatus === "cancelled" || sale.isFullyReturned || !hasReturnableItems(sale)}
                    onClick={() => openReturnModal(sale)}
                    title="ត្រឡប់ការលក់"
                    aria-label="ត្រឡប់ការលក់"
                    className="quick-action-icon-3d inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiRotateCcw size={17} />
                  </button>
                </PermissionGate>
              </div>
            </article>
          ))}

          {!salesQuery.isLoading && filteredSales.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <div className={`summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}>
                <FiSearch className={`text-3xl ${theme.muted}`} />
              </div>
              <p className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}>រកមិនឃើញការលក់</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>សូមផ្លាស់ប្ដូរពាក្យស្វែងរក ឬតម្រង។</p>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1060px]">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  វិក្កយបត្រ
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  អតិថិជន
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  ទំនិញ
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  ការទូទាត់
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">
                  ថ្លៃដឹក
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  តម្លៃសរុប
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  ស្ថានភាព
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  សកម្មភាព
                </th>
              </tr>
            </thead>

            <tbody>
              {salesQuery.isLoading && (
                <Sales3DLoading
                  theme={theme}
                  colSpan={8}
                />
              )}

              {!salesQuery.isLoading && paginatedSales.map((sale) => (
                <tr key={sale.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="table-icon-3d flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiHash size={21} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {sale.saleNo}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                          >
                            {SALE_TYPE_LABEL[sale.saleType] ?? sale.saleType}
                          </span>

                          {sale.saleChannel && sale.saleChannel !== "pos" && (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                              {sale.saleChannel === "phone" ? "📞 ទូរស័ព្ទ" : sale.saleChannel === "online" ? "🌐 អនឡាញ" : sale.saleChannel}
                            </span>
                          )}

                          <span className={`text-xs ${theme.muted}`}>
                            {sale.displayDate} · <span className="font-semibold text-blue-500">{sale.cashierName}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 max-w-[160px]">
                    <p className="text-sm font-semibold truncate" title={sale.customerName}>
                      {sale.customerName}
                    </p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {sale.customerId ? "លក់ដុំ" : "លក់រាយ"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">
                      {sale.items.length} មុខ · {getItemsCount(sale)} ចំនួន
                    </p>

                    <p className={`mt-1 max-w-[260px] truncate text-xs ${theme.muted}`}>
                      {sale.items.map((item) => item.variantNameSnapshot).filter(Boolean).join(", ")}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      <FiCreditCard />
                      {getPaymentSummary(sale)}
                    </span>

                    <div className="mt-2">
                      <StatusBadge
                        status={sale.paymentStatus}
                        label={PAYMENT_STATUS_LABEL[sale.paymentStatus]}
                        getStatusClass={getPaymentStatusClass}
                        getStatusIcon={getPaymentStatusIcon}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {sale.deliveryRequired ? (
                      <>
                        <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-1 text-sm font-bold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                          ${Number(sale.deliveryFee || 0).toFixed(2)}
                        </span>
                        {sale.deliveryStatus && sale.deliveryStatus !== "none" && (
                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            {DELIVERY_STATUS_KH[sale.deliveryStatus] ?? sale.deliveryStatus}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className={`text-sm ${theme.muted}`}>—</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">
                      {getSaleTotalDisplay(sale)}
                    </p>

                    {shouldShowTotalEquivalent(sale) && (
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        = {Math.round(Number(sale.grandTotal || 0) * Number(sale.exchangeRateKhrPerUsd || 0)).toLocaleString()} ៛
                      </p>
                    )}

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      តម្លៃមុនបញ្ចុះ ${Number(sale.subtotal).toFixed(2)}
                    </p>
                    {getChangeSummary(sale) && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600">
                        អាប់ {getChangeSummary(sale)}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <StatusBadge
                      status={sale.saleStatus}
                      label={SALE_STATUS_LABEL[sale.saleStatus]}
                      getStatusClass={getSaleStatusClass}
                      getStatusIcon={getSaleStatusIcon}
                    />
                    {sale.returnsCount > 0 && (() => {
                      // returnsTotalUsd is every completed return regardless of resolution
                      // (refund/replacement); returnsRefundTotalUsd is only the
                      // portion actually confirmed paid back in cash (recordRefund() already
                      // called); returnsPendingRefundTotalUsd is refund-type returns still
                      // sitting in the "រង់ចាំសងប្រាក់" tab, not yet recorded. Without that 3rd
                      // bucket, a still-pending refund fell through as neither cash nor counted,
                      // so nonCashUsd (originally totalUsd - refundUsd) silently absorbed it and
                      // mislabeled it "ដូរទំនិញ" (replacement) — a return that was never actually
                      // a product swap.
                      const refundUsd = Number(sale.returnsRefundTotalUsd || 0);
                      const pendingRefundUsd = Number(sale.returnsPendingRefundTotalUsd || 0);
                      const totalUsd = Number(sale.returnsTotalUsd || 0);
                      const nonCashUsd = Math.max(totalUsd - refundUsd - pendingRefundUsd, 0);

                      const parts = [];
                      if (refundUsd > 0.001) parts.push({ text: `សងលុយ $${refundUsd.toFixed(2)}`, color: "red" });
                      if (pendingRefundUsd > 0.001) parts.push({ text: `រង់ចាំសងប្រាក់ $${pendingRefundUsd.toFixed(2)}`, color: "amber" });
                      if (nonCashUsd > 0.001) parts.push({ text: `ដូរទំនិញ $${nonCashUsd.toFixed(2)}`, color: "orange" });
                      if (parts.length === 0) return null;

                      const colorClass = parts.length > 1
                        ? "bg-purple-500/10 text-purple-600"
                        : { red: "bg-red-500/10 text-red-500", amber: "bg-amber-500/10 text-amber-600", orange: "bg-orange-500/10 text-orange-500" }[parts[0].color];

                      return (
                        <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}>
                          <FiRotateCcw size={9} />
                          {parts.map((p) => p.text).join(" + ")}
                        </span>
                      );
                    })()}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <PermissionGate permission="sales.create">
                        {(sale.paymentStatus === "unpaid" || sale.paymentStatus === "partial") && (
                          <Tooltip label="កត់ត្រាការទូទាត់">
                            <button type="button" onClick={() => openRecordPaymentModal(sale)}
                              className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0">
                              <FiCreditCard size={16} />
                            </button>
                          </Tooltip>
                        )}
                      </PermissionGate>
                      <Tooltip label="មើលវិក្កយបត្រ">
                        <button type="button" onClick={() => openViewModal(sale)}
                          className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0">
                          <FiEye size={16} />
                        </button>
                      </Tooltip>
                      <PermissionGate permission="sales.print_receipt">
                        <Tooltip label="បោះពុម្ព">
                          <button type="button" onClick={() => handlePrint(sale)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-emerald-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-600/25 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:translate-y-0">
                            <FiPrinter size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission="sales.refund">
                        <Tooltip label="ត្រឡប់">
                          <button type="button"
                            disabled={sale.paymentStatus !== "paid" || sale.saleStatus === "cancelled" || sale.isFullyReturned || !hasReturnableItems(sale)}
                            onClick={() => openReturnModal(sale)}
                            className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
                            <FiRotateCcw size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}

              {!salesQuery.isLoading && filteredSales.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="8" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                      >
                        <FiSearch className={`text-3xl ${theme.muted}`} />
                      </div>

                      <p className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}>
                        រកមិនឃើញការលក់
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        ព្យាយាមផ្លាស់ប្ដូរ ពាក្យស្វែងរក, កាលបរិច្ឆេទ, ប្រភេទ, ការទូទាត់ ឬ ស្ថានភាព ។
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!salesQuery.isLoading && filteredSales.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-xs ${theme.muted}`}>
              ទំព័រ {safeCurrentPage} នៃ {totalPages}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className={`table-icon-3d inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                    : "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                }`}
              >
                មុន
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`table-icon-3d inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                    page === safeCurrentPage
                      ? "bg-red-600 text-white shadow-sm"
                      : isDark
                        ? "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                        : "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className={`table-icon-3d inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDark
                    ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                    : "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50"
                }`}
              >
                បន្ទាប់
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {modalMode === "print" && selectedSale && (
        <SalePrintModal sale={selectedSale} onClose={closeModal} />
      )}

      {modalMode === "view" && selectedSale && (
        <ViewSaleModal
          sale={selectedSale}
          theme={theme}
          onClose={closeModal}
          onPrint={() => setModalMode("print")}
        />
      )}

      {modalMode === "return" && selectedSale && (
        <ReturnSaleModal
          sale={selectedSale}
          items={returnableItems}
          theme={theme}
          onClose={closeModal}
          onSuccess={handleReturnSuccess}
          onError={handleReturnError}
        />
      )}

      {modalMode === "record-payment" && selectedSale && (
        <RecordPaymentModal
          sale={selectedSale}
          form={rpForm}
          onChange={handleRpFormChange}
          onClose={closeModal}
          onSubmit={handleRecordPayment}
          isLoading={recordPaymentMutation.isPending}
          theme={theme}
        />
      )}

      {viewingReturn && (
        <ViewPendingReturnModal
          salesReturn={viewingReturn}
          theme={theme}
          onClose={() => setViewingReturn(null)}
        />
      )}

      {refundTarget && (
        <RecordRefundModal
          salesReturn={refundTarget}
          form={refundForm}
          onChange={handleRefundFormChange}
          onClose={() => setRefundTarget(null)}
          onSubmit={handleSubmitRefund}
          isLoading={refundReturnMutation.isPending}
          theme={theme}
        />
      )}
    </section>
  );
}

function Sales3DLoading({ theme, colSpan }) {
  return (
    <tr className={`border-t ${theme.row}`}>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div
          className="flex min-h-[230px] flex-col items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="relative flex h-32 w-32 items-center justify-center"
            style={{ perspective: "700px" }}
          >
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-emerald-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-emerald-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-lime-300 border-r-emerald-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-lime-300 via-emerald-500 to-teal-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(6, 95, 70, 0.3), inset 4px 4px 10px rgba(255,255,255,0.38), inset -5px -7px 12px rgba(15,118,110,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiShoppingCart className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 px-1 text-[9px] font-black text-amber-950 shadow-lg shadow-amber-400/40">
                $
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំបញ្ជីការលក់
          </p>
        </div>
      </td>
    </tr>
  );
}

