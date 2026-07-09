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
  FiFileText,
} from "react-icons/fi";

import SalesActivityChart from "./components/SalesActivityChart";
import SummaryCard from "./components/SummaryCard";
import FilterSelect from "./components/FilterSelect";
import StatusBadge from "./components/StatusBadge";
import { RecordPaymentModal } from "./components/RecordPaymentModal";
import { ReturnSaleModal } from "./components/ReturnSaleModal";
import { ViewSaleModal } from "./components/ViewSaleModal";
import SalePrintModal from "./components/SalePrintModal";
import TableLoading from "../../../components/TableLoading";
import PermissionGate from "../../../components/PermissionGate";
import { defaultReturnForm, validateSaleReturn } from "./schemas/saleReturnSchema";
import { useLockBodyScroll } from "./utils/useLockBodyScroll";
import { getSalesApi, recordSalePaymentApi } from "../../../services/sale.service";
import { createSalesReturnApi } from "../../../services/salesReturn.service";

function transformSale(s) {
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
    saleDate: soldAt.toISOString().slice(0, 10),
    displayDate: soldAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    subtotal: s.subtotal_usd,
    discountTotal: s.discount_total_usd,
    deliveryRequired: Boolean(s.delivery_option && s.delivery_option !== "customer_pickup" && s.delivery_option !== "none"),
    deliveryOption: s.delivery_option,
    deliveryFee: s.delivery_fee_input,
    deliveryFeeCurrency: s.delivery_fee_currency,
    deliveryAddress: s.delivery_address,
    deliveryStatus: s.delivery_status,
    grandTotal: s.grand_total_usd,
    paidTotal: s.paid_total_usd || 0,
    balanceTotal: s.balance_total_usd ?? s.grand_total_usd ?? 0,
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
  const [saleStatusFilter, setSaleStatusFilter] = useState("All");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalMode, setModalMode] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnForm, setReturnForm] = useState(defaultReturnForm);
  const [returnErrors, setReturnErrors] = useState({});
  const [returnItems, setReturnItems] = useState([]);
  const [rpForm, setRpForm] = useState({
    payment_method: "cash",
    provider_name: "",
    currency_code: "USD",
    amount_received: "",
    exchange_rate_used: "",
    reference_no: "",
    paid_at: "",
    note: "",
  });

  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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

      const matchesSaleStatus =
        saleStatusFilter === "All" || sale.saleStatus === saleStatusFilter;

      return (
        matchesTab &&
        matchesSearch &&
        matchesDate &&
        matchesSaleType &&
        matchesPaymentStatus &&
        matchesSaleStatus
      );
    });
  }, [
    sales,
    activeTab,
    searchTerm,
    startDate,
    saleTypeFilter,
    paymentStatusFilter,
    saleStatusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchTerm,
    startDate,
    saleTypeFilter,
    paymentStatusFilter,
    saleStatusFilter,
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

  const completedSales = sales.filter((sale) => sale.saleStatus === "completed");

  const totalSalesAmount = completedSales
    .filter((sale) => sale.paymentStatus !== "refunded")
    .reduce((total, sale) => total + Number(sale.grandTotal || 0) - Number(sale.returnsTotalUsd || 0), 0);

  const today = new Date().toISOString().slice(0, 10);

  const [chartPeriod, setChartPeriod] = useState("សប្ដាហ៍");

  const weeklyChartData = useMemo(() => {
    const DAYS = ["ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រ.ហ", "សុក្រ", "សៅរ៏", "អាទិត្យ"];
    const totals = Object.fromEntries(DAYS.map((d) => [d, 0]));
    const now = new Date();
    const weekStart = new Date(now);
    const currentDay = now.getDay();
    weekStart.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    for (const sale of sales) {
      const d = new Date(sale.saleDate);
      if (d >= weekStart && d < weekEnd && sale.saleStatus === "completed" && sale.paymentStatus !== "refunded") {
        const mondayBasedDayIndex = (d.getDay() + 6) % 7;
        totals[DAYS[mondayBasedDayIndex]] += Number(sale.grandTotal || 0);
      }
    }
    return DAYS.map((day) => ({ day, amount: totals[day] }));
  }, [sales]);

  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const ranges = [
      { day: "សប្ដាហ៍ទី 1", range: "ថ្ងៃទី 1–7", from: 1, to: 7, amount: 0 },
      { day: "សប្ដាហ៍ទី 2", range: "ថ្ងៃទី 8–14", from: 8, to: 14, amount: 0 },
      { day: "សប្ដាហ៍ទី 3", range: "ថ្ងៃទី 15–21", from: 15, to: 21, amount: 0 },
      { day: "សប្ដាហ៍ទី 4", range: `ថ្ងៃទី 22–${lastDay}`, from: 22, to: lastDay, amount: 0 },
    ];

    for (const sale of sales) {
      const d = new Date(sale.saleDate);
      if (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        sale.saleStatus === "completed" &&
        sale.paymentStatus !== "refunded"
      ) {
        const range = ranges.find(
          ({ from, to }) => d.getDate() >= from && d.getDate() <= to
        );

        if (range) {
          range.amount += Number(sale.grandTotal || 0);
        }
      }
    }

    return ranges.map(({ day, range, amount }) => ({ day, range, amount }));
  }, [sales]);

  const yearlyChartData = useMemo(() => {
    const MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
    const currentYear = new Date().getFullYear();
    const totals = Object.fromEntries(MONTHS.map((month) => [month, 0]));

    for (const sale of sales) {
      const d = new Date(sale.saleDate);
      if (
        d.getFullYear() === currentYear &&
        sale.saleStatus === "completed" &&
        sale.paymentStatus !== "refunded"
      ) {
        totals[MONTHS[d.getMonth()]] += Number(sale.grandTotal || 0);
      }
    }

    return MONTHS.map((day) => ({ day, amount: totals[day] }));
  }, [sales]);

  const activeChartData =
    chartPeriod === "ខែ" ? monthlyChartData :
    chartPeriod === "ឆ្នាំ" ? yearlyChartData :
    weeklyChartData;

  const todaySalesAmount = sales
    .filter(
      (sale) =>
        sale.saleDate === today &&
        sale.saleStatus === "completed" &&
        sale.paymentStatus !== "refunded"
    )
    .reduce((total, sale) => total + Number(sale.grandTotal || 0) - Number(sale.returnsTotalUsd || 0), 0);

  const refundedAmount = sales
    .reduce((total, sale) => total + Number(sale.returnsTotalUsd || 0), 0);

  const pendingPaymentAmount = sales
    .filter(
      (sale) =>
        sale.paymentStatus === "partial" || sale.paymentStatus === "unpaid"
    )
    .reduce((total, sale) => total + Number(sale.grandTotal || 0), 0);

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
    setReturnErrors({});
    setModalMode("view");
  };

  const openReturnModal = (sale) => {
    setSelectedSale(sale);
    setReturnErrors({});
    setReturnForm({
      ...defaultReturnForm,
      totalAmount: sale.grandTotal,
    });
    setReturnItems(
      sale.items.map((item) => ({
        id: item.id,
        productVariantUnitId: item.productVariantUnitId,
        productNameSnapshot: item.productNameSnapshot,
        variantNameSnapshot: item.variantNameSnapshot,
        unitNameSnapshot: item.unitNameSnapshot,
        maxQty: item.qty,
        selected: true,
        qty: item.qty,
        baseQty: item.baseQty,
        condition: "good",
      }))
    );
    setModalMode("return");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSale(null);
    setReturnForm(defaultReturnForm);
    setReturnErrors({});
    setReturnItems([]);
  };

  const openRecordPaymentModal = (sale) => {
    setSelectedSale(sale);
    setRpForm({
      payment_method: "cash",
      provider_name: "",
      currency_code: "USD",
      amount_received: Number(sale.balanceTotal).toFixed(2),
      exchange_rate_used: "",
      reference_no: "",
      paid_at: new Date().toISOString().slice(0, 10),
      note: "",
    });
    setModalMode("record-payment");
  };

  const handleRpFormChange = (field, value) => {
    setRpForm((prev) => ({ ...prev, [field]: value }));
  };

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, payload }) => recordSalePaymentApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      closeModal();
    },
  });

  const handleRecordPayment = () => {
    if (!selectedSale) return;
    if (!rpForm.amount_received || Number(rpForm.amount_received) <= 0) return;
    const payload = {
      payment_method: rpForm.payment_method,
      currency_code: rpForm.currency_code,
      amount_received: Number(rpForm.amount_received),
      ...(rpForm.provider_name && { provider_name: rpForm.provider_name }),
      ...(rpForm.exchange_rate_used && { exchange_rate_used: Number(rpForm.exchange_rate_used) }),
      ...(rpForm.reference_no && { reference_no: rpForm.reference_no }),
      ...(rpForm.paid_at && { paid_at: rpForm.paid_at }),
      ...(rpForm.note && { note: rpForm.note }),
    };
    recordPaymentMutation.mutate({ id: selectedSale.id, payload });
  };

  const handleReturnFormChange = (field, value) => {
    setReturnForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setReturnErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const handleReturnItemChange = (itemId, field, value) => {
    setReturnItems((previous) =>
      previous.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
    setReturnErrors((previous) => ({ ...previous, items: "" }));
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

  const validateReturnForm = () => {
    const nextErrors = validateSaleReturn(returnForm, selectedSale?.grandTotal);

    const selected = returnItems.filter((item) => item.selected);
    if (selected.length === 0) {
      nextErrors.items = "សូមជ្រើសរើសទំនិញយ៉ាងតិច ១ ដើម្បីត្រឡប់ ។";
    } else {
      for (const item of selected) {
        const qty = Number(item.qty);
        if (!qty || qty <= 0) {
          nextErrors.items = "ចំនួនត្រឡប់ ត្រូវ > 0 សម្រាប់ទំនិញដែលបានជ្រើស ។";
          break;
        }
        if (qty > item.maxQty) {
          nextErrors.items = `ចំនួនត្រឡប់ មិនអាចលើស ចំនួនដើម (ច្រើនបំផុត: ${item.maxQty}) ។`;
          break;
        }
      }
    }

    setReturnErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const STOCK_ACTION = {
    good:      "restock",
    damaged:   "damaged_write_off",
    defective: "damaged_write_off",
    expired:   "discard",
  };

  const returnMutation = useMutation({
    mutationFn: (payload) => createSalesReturnApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      closeModal();
      showToast("បង្កើតការត្រឡប់ដោយជោគជ័យ!");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : null) ||
        err?.message ||
        "Failed to create return. Please try again.";
      alert(msg);
    },
  });

  const handleSaveReturn = () => {
    if (!selectedSale) return;
    if (!validateReturnForm()) return;

    const payload = {
      sale_id:             selectedSale.id,
      verification_type:   "system_lookup",
      return_type:         returnForm.returnType,
      resolution_type:     returnForm.resolutionType,
      reason:              returnForm.reason.trim(),
      status:              returnForm.status,
      refund_amount_input: returnForm.totalAmount ? Number(returnForm.totalAmount) : undefined,
      items: returnItems
        .filter((item) => item.selected)
        .map((item) => ({
          sale_item_id:            item.id,
          product_variant_unit_id: item.productVariantUnitId,
          qty:                     Number(item.qty),
          base_qty:                item.baseQty ? Number(item.baseQty) : undefined,
          item_condition:          item.condition,
          stock_action:            STOCK_ACTION[item.condition] ?? "restock",
        })),
    };

    returnMutation.mutate(payload);
  };

  return (
    <section className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          theme={theme}
          title="ការលក់សរុប"
          value={fmtUsd(totalSalesAmount)}
          subValue={fmtKhr(totalSalesAmount)}
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="ការលក់ថ្ងៃនេះ"
          value={fmtUsd(todaySalesAmount)}
          subValue={fmtKhr(todaySalesAmount)}
          icon={<FiShoppingCart className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="ប្រាក់ជំពាក់"
          value={fmtUsd(pendingPaymentAmount)}
          subValue={fmtKhr(pendingPaymentAmount)}
          icon={<FiClock className="text-[34px] text-amber-500" />}
          iconBg="bg-amber-500/10"
        />

        <SummaryCard
          theme={theme}
          title="ប្រាក់សងត្រឡប់"
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
        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-zinc-200 px-4 dark:border-white/10">
          {[
            { id: "all",      label: "ទាំងអស់",       icon: <FiShoppingCart />, count: sales.length,                                                                                        alert: false },
            { id: "pending",  label: "ជំពាក់",       icon: <FiClock />,        count: sales.filter((s) => s.paymentStatus === "unpaid" || s.paymentStatus === "partial").length,           alert: true  },
            { id: "refunded", label: "ត្រឡប់",         icon: <FiRefreshCcw />,   count: sales.filter((s) => s.paymentStatus === "refunded" || s.returnsCount > 0).length,               alert: false },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3.5 text-xs font-bold transition ${
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
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              បើក POS <FiArrowUpRight />
            </Link>
          </div>

          {/* Row 2: Filters + per page */}
          <div className={`grid gap-3 grid-cols-2 ${
            activeTab === "all" ? "xl:grid-cols-5" : "xl:grid-cols-4"
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
                  { value: "paid", label: "បង់ហើយ" },
                  { value: "refunded", label: "ប្រាក់សងត្រឡប់" },
                ]}
              />
            )}

            <FilterSelect icon={<FiFilter />} value={saleStatusFilter} onChange={setSaleStatusFilter} theme={theme}
              options={[
                { value: "All", label: "ស្ថានភាពទាំងអស់" },
                { value: "completed", label: "បញ្ចប់ហើយ" },
                { value: "cancelled", label: "បោះបង់ហើយ" },
              ]}
            />

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
        </div>

        <div className="overflow-x-auto">
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
                  សរុប
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
                <TableLoading
                  theme={theme}
                  colSpan={8}
                  text="រង់ចាំបន្តិច..."
                />
              )}

              {!salesQuery.isLoading && paginatedSales.map((sale) => (
                <tr key={sale.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
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
                      {sale.payments.length === 1 && sale.payments[0].currencyCode === "KHR"
                        ? `${Math.round(sale.grandTotal * sale.exchangeRateKhrPerUsd).toLocaleString()} ៛`
                        : `$${Number(sale.grandTotal).toFixed(2)}`}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      តម្លៃដើម ${Number(sale.subtotal).toFixed(2)}
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
                    {sale.returnsCount > 0 && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-500">
                        <FiRotateCcw size={9} />
                        {sale.returnsCount} ត្រឡប់
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <PermissionGate permission="sales.create">
                        {(sale.paymentStatus === "unpaid" || sale.paymentStatus === "partial") && (
                          <Tooltip label="កត់ត្រាការទូទាត់">
                            <button type="button" onClick={() => openRecordPaymentModal(sale)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0">
                              <FiCreditCard size={16} />
                            </button>
                          </Tooltip>
                        )}
                      </PermissionGate>
                      <Tooltip label="មើលវិក្កយបត្រ">
                        <button type="button" onClick={() => openViewModal(sale)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-600 hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:translate-y-0">
                          <FiEye size={16} />
                        </button>
                      </Tooltip>
                      <PermissionGate permission="sales.print_receipt">
                        <Tooltip label="បោះពុម្ព">
                          <button type="button" onClick={() => handlePrint(sale)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-600/25 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:translate-y-0">
                            <FiPrinter size={16} />
                          </button>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission="sales.refund">
                        <Tooltip label="ត្រឡប់">
                          <button type="button"
                            disabled={sale.paymentStatus !== "paid" || sale.saleStatus === "cancelled" || sale.isFullyReturned}
                            onClick={() => openReturnModal(sale)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">
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
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
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
                className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
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
                className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
          form={returnForm}
          errors={returnErrors}
          theme={theme}
          onChange={handleReturnFormChange}
          onClose={closeModal}
          onSave={handleSaveReturn}
          isSaving={returnMutation.isPending}
          returnItems={returnItems}
          onItemChange={handleReturnItemChange}
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

      {toast && (
        <div className="fixed bottom-6 right-6 z-9999 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl">
          <FiCheckCircle size={17} />
          {toast}
        </div>
      )}
    </section>
  );
}

function Tooltip({ label, children }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
      </span>
    </div>
  );
}

