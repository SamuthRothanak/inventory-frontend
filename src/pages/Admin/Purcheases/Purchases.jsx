import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "../../../components/ConfirmDialog";
import {
  FiAlertTriangle,
  FiArrowRightCircle,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiHash,
  FiPackage,
  FiPlus,
  FiPlusCircle,
  FiRotateCcw,
  FiSave,
  FiSearch,
  FiShoppingCart,
  FiTrash,
  FiTruck,
  FiUser,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  applyPurchaseCreditApi,
  createPurchaseApi,
  createPurchaseReturnApi,
  getAllPurchaseReturnsApi,
  getAllPurchasesApi,
  getPurchaseByIdApi,
  getPurchaseStatsApi,
  getPurchasesApi,
  recordPurchasePaymentApi,
  syncPurchaseItemsApi,
  updatePurchaseApi,
  updatePurchaseReturnApi,
} from "../../../services/purchase.service";
import { getActiveSuppliersApi, getSupplierCreditBalanceApi } from "../../../services/supplier.service";
import { getActiveExchangeRateApi } from "../../../services/exchangeRate.service";
import { getProductVariantUnitsApi } from "../../../services/productVariantUnit.service";
import { useNotification } from "../../../components/AppNotification";
import PermissionGate from "../../../components/PermissionGate";

import {
  EmptyState,
  FilterSelect,
  PurchaseFormModal,
  PurchaseItemModal,
  PurchaseMobileCard,
  PurchaseReturnModal,
  ReceiveReplacementModal,
  ResolveMoneyClaimModal,
  RecordPaymentModal,
  PurchaseTable,
  SummaryCard,
  Tooltip,
  ViewPurchaseModal,
} from "./components";
import {
  emptyItemForm,
  emptyPurchaseForm,
  emptyPurchaseReturnForm,
  emptyPurchaseReturnItemForm,
} from "./schemas/purchaseSchemas";
import {
  paymentModeOptions,
  RETURN_STATUS,
  RETURN_STATUS_LABEL,
  STATUS,
  STATUS_LABEL,
} from "./utils/purchaseConstants";
import {
  buildTheme,
  calculateCurrencyPreview,
  convertCost,
  currencyToApi,
  extractApiData,
  extractApiObject,
  formatCurrencyPair,
  formatDateOnly,
  formatMoney,
  formatCondition,
  formatSnake,
  getErrorMessage,
  normalizePurchase,
  normalizeDeliveryOption,
  normalizeDeliveryPaidBy,
  normalizeSupplier,
  normalizeVariantUnit,
  statusToApi,
  useLockBodyScroll,
} from "./utils/purchaseUtils";
import {
  exportPurchasesCsv,
  exportPurchasesExcel,
  exportPurchasesPdf,
} from "./utils/purchaseExport";
import {
  calculateGrandTotal,
  calculateLineTotalsByPaymentMode,
  calculateSubtotal,
  fmtUsd,
  getClaimRequiredCount,
  getClampedClaimAmount,
  getDamagedCount,
  getItemOnlyAmount,
  getPurchaseLines,
  getPurchasePaymentBalance,
  getPurchaseReturnStatusClass,
  getPurchaseReturnStatusIcon,
  getReturnItemResolution,
  getStatusClass,
  getStatusIcon,
  getUnpaidItemAmountBeforeClaim,
  hasAnyStockedInQty,
  hasPurchasePaymentBalance,
  hasRemainingStockInQty,
  isReplacementClaimIncomplete,
  normalizeClaimResolutionType,
  normalizeReturnResolutionType,
  normalizeReturnStatusLabel,
  returnHasOpenReplacementItem,
} from "./utils/purchaseStatusHelpers.jsx";
import { usePurchaseClaimStatus } from "./hooks/usePurchaseClaimStatus";

const PURCHASE_ACTION_ICON_CLASS =
  "quick-action-icon-3d inline-flex h-9 w-9 items-center justify-center rounded-xl text-white ring-1 ring-white/30 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 active:translate-y-0";

const CLIENT_TAB_PAGE_SIZE = 10;

const PURCHASE_ACTION_TONE = {
  view: "bg-orange-500 shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/25 focus:ring-orange-500/20",
  receive: "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/25 focus:ring-indigo-500/20",
  confirm: "bg-emerald-500 shadow-emerald-600/20 hover:bg-emerald-600 hover:shadow-emerald-600/25 focus:ring-emerald-500/20",
  claim: "bg-red-600 shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/25 focus:ring-red-500/20",
  payment: "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/25 focus:ring-blue-500/20",
};

export default function Purchases() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const theme = buildTheme(isDark);
  const queryClient = useQueryClient();
  const notify = useNotification();
  const confirm = useConfirm();

  const [localPurchases, setLocalPurchases] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [recordPaymentPurchase, setRecordPaymentPurchase] = useState(null);

  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [purchaseErrors, setPurchaseErrors] = useState({});
  const [paidCurrencyTouched, setPaidCurrencyTouched] = useState(false);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemEditIndex, setItemEditIndex] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [itemErrors, setItemErrors] = useState({});

  const [purchaseReturnForm, setPurchaseReturnForm] = useState(emptyPurchaseReturnForm);
  const [purchaseReturnItems, setPurchaseReturnItems] = useState([]);
  const [purchaseReturnErrors, setPurchaseReturnErrors] = useState({});
  const [purchaseReturnItemForm, setPurchaseReturnItemForm] = useState(emptyPurchaseReturnItemForm);
  const [purchaseReturnItemErrors, setPurchaseReturnItemErrors] = useState({});

  const [replacementModalOpen, setReplacementModalOpen] = useState(false);
  const [replacementPurchase, setReplacementPurchase] = useState(null);
  const [replacementReturn, setReplacementReturn] = useState(null);
  const [replacementItems, setReplacementItems] = useState([]);
  const [replacementErrors, setReplacementErrors] = useState({});

  const [resolveMoneyModalOpen, setResolveMoneyModalOpen] = useState(false);
  const [resolveMoneyPurchase, setResolveMoneyPurchase] = useState(null);
  const [resolveMoneyReturn, setResolveMoneyReturn] = useState(null);

  useLockBodyScroll(Boolean(modalMode || itemModalOpen || replacementModalOpen || resolveMoneyModalOpen));

  const [activeTab, setActiveTab] = useState("orders");
  const [returnStatusFilter, setReturnStatusFilter] = useState("open");
  const [paymentViewFilter, setPaymentViewFilter] = useState("outstanding");
  const [newReturnPanelOpen, setNewReturnPanelOpen] = useState(false);
  const [newReturnSearchTerm, setNewReturnSearchTerm] = useState("");
  const [expandedReturnId, setExpandedReturnId] = useState(null);

  const [receiveSearchTerm, setReceiveSearchTerm] = useState("");
  const [returnSearchTerm, setReturnSearchTerm] = useState("");
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");

  // ទទួលទំនិញ/ការទាមទារ/ការទូទាត់ tabs fetch their full list client-side (see allPurchasesQuery/
  // purchaseReturnsQuery's per_page: 500) rather than paginating server-side like the "បញ្ជាទិញ"
  // tab — this just slices whichever filtered list is already in memory, so a tab with 100+ rows
  // doesn't render one endless page.
  const [receivePage, setReceivePage] = useState(1);
  const [returnsPage, setReturnsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);

  useEffect(() => setReceivePage(1), [receiveSearchTerm]);
  useEffect(() => setReturnsPage(1), [returnStatusFilter, returnSearchTerm]);
  useEffect(() => setPaymentsPage(1), [paymentViewFilter, paymentSearchTerm]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // searchTerm (not debouncedSearchTerm) — filtering is client-side now (see exportPurchases),
  // so there's no server round-trip to debounce against; dateFilter added since it's now also
  // one of the client filter criteria the page needs to reset for.
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, paymentStatusFilter, dateFilter, dateFrom, dateTo, perPage]);

  useEffect(() => {
    setNewReturnPanelOpen(false);
    setNewReturnSearchTerm("");
    if (activeTab !== "receive") setReceiveSearchTerm("");
    if (activeTab !== "returns") setReturnSearchTerm("");
    if (activeTab !== "payments") setPaymentSearchTerm("");
  }, [activeTab]);

  const purchasesQuery = useQuery({
    queryKey: [
      "purchases",
      {
        page,
        perPage,
        search: debouncedSearchTerm,
        statusFilter,
        paymentStatusFilter,
      },
    ],
    queryFn: () =>
      getPurchasesApi({
        page,
        per_page: perPage,
        search: debouncedSearchTerm || undefined,
        status: statusFilter === "All" ? undefined : statusToApi(statusFilter),
        payment_status:
          paymentStatusFilter === "All" ? undefined : paymentStatusFilter,
      }),
    keepPreviousData: true,
  });

  const purchaseStatsQuery = useQuery({
    queryKey: ["purchases", "stats"],
    queryFn: getPurchaseStatsApi,
    staleTime: 1000 * 60,
  });

  const allPurchasesQuery = useQuery({
    queryKey: ["purchases", "all-unpaginated"],
    queryFn: () => getAllPurchasesApi(),
    staleTime: 1000 * 60,
  });

  const purchaseReturnsQuery = useQuery({
    queryKey: ["purchase-returns", "purchase-page"],
    queryFn: () => getAllPurchaseReturnsApi(),
    staleTime: 1000 * 60,
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "active-for-purchases"],
    queryFn: () => getActiveSuppliersApi({ per_page: 500 }),
    staleTime: 1000 * 60 * 5,
  });

  // Only meaningful when creating a brand-new purchase — an existing purchase already has its
  // own credit_applied_usd/khr persisted from whenever it was applied, and editing/receiving
  // flows don't re-offer this control (see purchaseForm.creditApplied usage below).
  const supplierCreditQuery = useQuery({
    queryKey: ["supplier-credit-balance", purchaseForm.supplierId],
    queryFn: () => getSupplierCreditBalanceApi(purchaseForm.supplierId),
    enabled: modalMode === "add" && Boolean(purchaseForm.supplierId),
  });
  const supplierCreditBalance = supplierCreditQuery.data?.data || null;

  // Sums the EXACT remaining_usd/khr of whichever specific supplier_credits rows the user has
  // checked — not a typed/converted amount, so it's exact regardless of today's exchange rate.
  const getSelectedCreditsTotal = (selectedCreditIds = []) => {
    const availableCredits = Array.isArray(supplierCreditBalance?.credits) ? supplierCreditBalance.credits : [];
    const selectedSet = new Set((selectedCreditIds || []).map(Number));
    return availableCredits
      .filter((credit) => selectedSet.has(Number(credit.id)))
      .reduce(
        (acc, credit) => ({
          usd: acc.usd + Number(credit.remaining_usd || 0),
          khr: acc.khr + Number(credit.remaining_khr || 0),
        }),
        { usd: 0, khr: 0 }
      );
  };

  // Caps how much supplier credit can be applied at both the supplier's own available balance
  // AND this purchase's own remaining balance (after its own payment) — mirrors
  // PurchaseService::applyCredit's two caps on the backend. Computed against balance BEFORE
  // credit (creditApplied: 0) since calculateCurrencyPreview's own totals already have the
  // CURRENT credit subtracted out — reusing those directly here would double-count it.
  const getCreditAppliedMaxUsd = () => {
    const availableUsd = Number(supplierCreditBalance?.available_usd) || 0;
    const totalsBeforeCredit = calculateCurrencyPreview({
      items: purchaseItems,
      form: { ...purchaseForm, creditApplied: 0, selectedCreditIds: [] },
    });
    // For "paid" status, paidAmountUsd there isn't an independent constraint — it's whatever's
    // left after credit (see calculateCurrencyPreview) — so it must NOT be subtracted here, or
    // credit could never apply at all (paidAmount would always "use up" the whole total first).
    const independentPaidUsd = purchaseForm.paymentStatus === "paid" ? 0 : totalsBeforeCredit.paidAmountUsd;
    return Math.min(
      availableUsd,
      Math.max(0, totalsBeforeCredit.grandTotalUsd - totalsBeforeCredit.claimDeductionUsd - independentPaidUsd)
    );
  };

  const activeRateQuery = useQuery({
    queryKey: ["exchange-rates", "active"],
    queryFn: getActiveExchangeRateApi,
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const variantUnitsQuery = useQuery({
    queryKey: ["product-variant-units", "purchase-options"],
    queryFn: () =>
      getProductVariantUnitsApi({
        per_page: 500,
        status: "active",
      }),
    enabled: itemModalOpen,
    staleTime: 1000 * 60,
  });

  const suppliers = useMemo(() => {
    return extractApiData(suppliersQuery.data).map(normalizeSupplier);
  }, [suppliersQuery.data]);

  useEffect(() => {
    const data = extractApiData(purchaseReturnsQuery.data);

    setPurchaseReturns(data.map((item) => ({
      id: item.id,
      purchaseReturnNo: item.purchase_return_no || item.purchaseReturnNo || "",
      purchaseId: item.purchase_id || item.purchaseId || "",
      purchaseNo: item.purchase_no || item.purchaseNo || "",
      supplierId: item.supplier_id || item.supplierId || "",
      supplierName: item.supplier_name || item.supplierName || item.supplier?.name || "",
      returnDate: item.return_date || item.returnDate || (item.created_at ? String(item.created_at).slice(0, 10) : ""),
      returnType: item.return_type || item.returnType || "",
      returnReason: item.return_reason || item.returnReason || "",
      resolutionType: normalizeReturnResolutionType(item.resolution_type || item.resolutionType || ""),
      resolutionStatus: item.resolution_status || item.resolutionStatus || "",
      subtotal: Number(item.total_amount_usd ?? item.subtotal_usd ?? item.subtotal ?? 0),
      subtotalUsd: Number(item.total_amount_usd ?? item.subtotal_usd ?? item.subtotalUsd ?? 0),
      subtotalKhr: Number(item.total_amount_khr ?? item.subtotal_khr ?? item.subtotalKhr ?? 0),
      refundStatus: item.refund_status || item.refundStatus || "none",
      refundAmountUsd: Number(item.refund_amount_usd ?? item.refundAmountUsd ?? 0),
      refundAmountKhr: Number(item.refund_amount_khr ?? item.refundAmountKhr ?? 0),
      refundedAt: item.refunded_at || item.refundedAt || null,
      creditNoteNo: item.credit_note_no || item.creditNoteNo || "",
      creditAmountUsd: Number(item.credit_amount_usd ?? item.creditAmountUsd ?? 0),
      creditAmountKhr: Number(item.credit_amount_khr ?? item.creditAmountKhr ?? 0),
      creditStatus: item.credit_status || item.creditStatus || "none",
      note: item.note || "",
      status: normalizeReturnStatusLabel(item.status || item.resolution_status || item.resolutionStatus || RETURN_STATUS.SUBMITTED),
      replacementQty: Number(item.replacement_qty ?? item.replacementQty ?? 0),
      replacementReceivedQty: Number(item.replacement_received_qty ?? item.replacementReceivedQty ?? 0),
      replacementStockedInQty: Number(item.replacement_stocked_in_qty ?? item.replacementStockedInQty ?? 0),
      items: item.items || item.purchase_return_items || [],
      raw: item,
    })));
  }, [purchaseReturnsQuery.data]);

  const activeExchangeRate = useMemo(() => {
    const data = extractApiObject(activeRateQuery.data);
    const rate =
      data?.usd_to_khr_rate ??
      data?.usdToKhrRate ??
      data?.rate ??
      data?.exchange_rate_used ??
      0;

    return Number(rate || 0);
  }, [activeRateQuery.data]);

  const activeKhrRounding = useMemo(() => {
    const data = extractApiObject(activeRateQuery.data);
    return data?.khr_rounding || data?.khrRounding || "floor";
  }, [activeRateQuery.data]);

  useEffect(() => {
    if (modalMode !== "add" || !activeExchangeRate) return;

    setPurchaseForm((previous) => {
      if (Number(previous.exchangeRateUsed || 0) > 0) return previous;
      return {
        ...previous,
        exchangeRateUsed: activeExchangeRate,
        khrRounding: activeKhrRounding,
        exchangeRateSource: "system",
      };
    });
  }, [activeExchangeRate, activeKhrRounding, modalMode]);

  const variantUnits = useMemo(() => {
    return extractApiData(variantUnitsQuery.data).map(normalizeVariantUnit);
  }, [variantUnitsQuery.data]);

  const serverPurchases = useMemo(() => {
    return extractApiData(purchasesQuery.data).map(normalizePurchase);
  }, [purchasesQuery.data]);

  const purchases = purchasesQuery.data ? serverPurchases : localPurchases;

  const allPurchases = useMemo(
    () => extractApiData(allPurchasesQuery.data).map(normalizePurchase),
    [allPurchasesQuery.data]
  );

  const calculateBalanceAmount = (grandTotal, paidAmount) => Math.max(0, Number(grandTotal || 0) - Number(paidAmount || 0));

  const totalPurchaseReturnAmount = purchaseReturns.reduce((total, item) => total + Number(item.subtotal || 0), 0);

  const {
    purchaseReturnsByPurchaseId,
    getRelatedPurchaseReturns,
    getOpenSupplierClaim,
    hasUnresolvedClaimDecision,
    hasResolvedSupplierClaim,
    getEffectivePurchaseStatus,
    hasPendingReplacementStockIn,
    getOpenReplacementClaim,
    getOpenMoneyClaim,
    isPaymentReady,
    shouldShowInPaymentFlow,
  } = usePurchaseClaimStatus(purchaseReturns);

  // Moved below getEffectivePurchaseStatus (was defined earlier in the file, before that
  // function existed) — filterPurchaseList's status match now calls it, and a const defined
  // later can't be referenced by code that runs earlier in the same render pass.
  const filterPurchaseList = (list) => {
    const search = searchTerm.toLowerCase();
    const fmtLocal = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const today = new Date();
    const todayStr = fmtLocal(today);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    const weekStartStr = fmtLocal(weekStart);

    const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

    return list.filter((purchase) => {
      const lines = purchase.items?.length ? purchase.items : purchase.summaryItems || [];
      const matchesSearch =
        purchase.purchaseNo.toLowerCase().includes(search) ||
        purchase.supplierName.toLowerCase().includes(search) ||
        purchase.note.toLowerCase().includes(search) ||
        lines.some(
          (item) => item.variantName.toLowerCase().includes(search) || item.variantCode.toLowerCase().includes(search)
        );

      // Matches the EFFECTIVE status (what the table's own badge actually shows — e.g. a
      // resolved claim already reads "ស្តុកចូលរួចរាល់អស់" even while the raw persisted
      // purchase.status still lags behind at "រង់ចាំការទាមទារ") — filtering on the raw field
      // used to silently exclude/include rows that visibly contradicted the selected filter.
      const matchesStatus = statusFilter === "All" || getEffectivePurchaseStatus(purchase) === statusFilter;
      const matchesPaymentStatus = paymentStatusFilter === "All" || purchase.paymentStatus === paymentStatusFilter;

      const d = purchase.purchaseDate ? String(purchase.purchaseDate).slice(0, 10) : "";
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" && d === todayStr) ||
        (dateFilter === "week" && d >= weekStartStr && d <= todayStr) ||
        (dateFilter === "month" && d >= monthStartStr && d <= todayStr) ||
        (dateFilter === "custom" &&
          (!dateFrom || d >= dateFrom) &&
          (!dateTo || d <= dateTo));

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate;
    });
  };

  // Full, unpaginated, effective-status-aware filtered list — the "orders" tab used to trust
  // server-side pagination/filtering (purchasesQuery), but that only ever filtered on the raw
  // purchase.status, never the effective one the table itself displays. Filtering client-side
  // over allPurchases (already fetched in full for the receive/returns/payments tabs) instead
  // keeps the filter and the badge it's supposed to match in sync.
  const exportPurchases = useMemo(() => {
    // Attach the effective status here too, not just raw purchase.status — purchaseExport.js
    // has no access to getEffectivePurchaseStatus's closure (it depends on purchaseReturns
    // state), so the export's status column would otherwise show a stale value that
    // contradicts the badge this same filtered list renders on screen.
    return filterPurchaseList(allPurchases.length > 0 ? allPurchases : purchases).map((purchase) => ({
      ...purchase,
      effectiveStatus: getEffectivePurchaseStatus(purchase),
    }));
  }, [allPurchases, purchases, searchTerm, statusFilter, paymentStatusFilter, dateFilter, dateFrom, dateTo]);

  // Client-side page slice of the same fully-filtered list Export uses.
  const filteredPurchases = useMemo(() => {
    return exportPurchases.slice((page - 1) * perPage, page * perPage);
  }, [exportPurchases, page, perPage]);

  const handleExport = (type) => {
    setExportMenuOpen(false);
    if (type === "pdf") {
      const opened = exportPurchasesPdf(exportPurchases);
      if (!opened) window.alert("PDF export was blocked. Please allow pop-ups and try again.");
      return;
    }
    if (type === "excel") {
      exportPurchasesExcel(exportPurchases);
      return;
    }
    exportPurchasesCsv(exportPurchases);
  };

  // Client-computed pagination meta over exportPurchases (the full filtered list) — replaces the
  // old server-meta-based version (getPaginationMeta(purchasesQuery.data, ...)), since the
  // "orders" tab no longer trusts server-side pagination for its displayed page (see
  // filterPurchaseList's status-matching comment above for why).
  const pagination = useMemo(() => {
    const total = exportPurchases.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(Math.max(1, page), lastPage);
    return {
      currentPage,
      perPage,
      total,
      lastPage,
      from: total === 0 ? 0 : (currentPage - 1) * perPage + 1,
      to: Math.min(currentPage * perPage, total),
    };
  }, [exportPurchases.length, perPage, page]);
  const pageNumbers = useMemo(
    () => getPageNumbers(pagination.currentPage, pagination.lastPage),
    [pagination.currentPage, pagination.lastPage]
  );

  // These used to be plain consts recomputed on every render (any keystroke anywhere on the page),
  // each scanning all of allPurchases — now memoized so they only redo the scan when the purchase/
  // return data actually changes.
  const { pendingReceive, pendingStockIn, pendingClaims, pendingClaimWithStock } = useMemo(() => {
    let receive = 0;
    let stockIn = 0;
    let claims = 0;
    let claimWithStock = 0;
    for (const item of allPurchases) {
      const eff = getEffectivePurchaseStatus(item);
      if (eff === STATUS.PENDING_RECEIVE) receive += 1;
      if (eff === STATUS.PENDING_STOCK_IN) stockIn += 1;
      if (eff === STATUS.PENDING_CLAIM) claims += 1;
      if (item.status === STATUS.PENDING_CLAIM && hasRemainingStockInQty(item)) claimWithStock += 1;
    }
    return { pendingReceive: receive, pendingStockIn: stockIn, pendingClaims: claims, pendingClaimWithStock: claimWithStock };
  }, [allPurchases, purchaseReturnsByPurchaseId]);
  const purchaseStats = extractApiObject(purchaseStatsQuery.data) || {};
  const totalPurchasesCount = Number(purchaseStats.total_purchases ?? purchaseStats.totalPurchases ?? pagination.total ?? purchases.length);
  const pendingReceiveCount = Number(purchaseStats.pending_receive ?? purchaseStats.pendingReceive ?? pendingReceive);
  const pendingStockInCount = Number(purchaseStats.pending_stock_in ?? purchaseStats.pendingStockIn ?? pendingStockIn);
  const pendingClaimsCount = Number(purchaseStats.pending_claim ?? purchaseStats.pendingClaim ?? pendingClaims);
  const totalGrandUsd = Number(purchaseStats.total_grand_usd ?? 0);
  const totalGrandKhr = Number(purchaseStats.total_grand_khr ?? 0);
  const totalBalanceUsd = Number(purchaseStats.total_balance_usd ?? 0);
  const totalBalanceKhr = Number(purchaseStats.total_balance_khr ?? 0);

  const filteredSummaryPurchases = exportPurchases;
  const filteredTotalUsd = filteredSummaryPurchases.reduce((sum, p) => sum + Number(p.grandTotalUsd || 0), 0);
  const filteredTotalKhr = filteredSummaryPurchases.reduce((sum, p) => sum + Number(p.grandTotalKhr || 0), 0);
  const filteredCount = filteredSummaryPurchases.length;
  const isDateFiltered = dateFilter !== "all";
  const invoiceTotalTitle = isDateFiltered
    ? `តម្លៃវិក្កយបត្រ${dateFilter === "today" ? "ថ្ងៃនេះ" : dateFilter === "week" ? "អាទិត្យនេះ" : dateFilter === "month" ? "ខែនេះ" : "តាមកាលបរិច្ឆេទ"}`
    : "តម្លៃវិក្កយបត្រសរុប";
  const summaryPurchases = isDateFiltered ? filteredSummaryPurchases : allPurchases;
  const summaryPurchaseIds = new Set(summaryPurchases.map((purchase) => String(purchase.id)));
  const summaryInvoiceUsd = isDateFiltered ? filteredTotalUsd : totalGrandUsd;
  const summaryInvoiceKhr = isDateFiltered ? filteredTotalKhr : totalGrandKhr;
  const summaryPaidUsd = summaryPurchases.reduce((sum, p) => sum + Number(p.paidAmountUsd || 0), 0);
  const summaryPaidKhr = summaryPurchases.reduce((sum, p) => sum + Number(p.paidAmountKhr || 0), 0);
  const summaryClaimDeduction = purchaseReturns.reduce(
    (total, ret) => {
      if (summaryPurchaseIds.size > 0 && !summaryPurchaseIds.has(String(ret.purchaseId))) return total;

      // Per-item, not the return's own resolutionType rollup — a return with items of
      // different types (e.g. one replacement + one refund) rolls its resolutionType up to
      // "mixed", which never equals "refund" and would silently hide that item's refund
      // amount from this total. Falls back to the return object itself only when it has no
      // items recorded (legacy data with no per-item resolution).
      const items = Array.isArray(ret.items) && ret.items.length > 0 ? ret.items : [ret];

      return items.reduce((subtotal, item) => {
        if (
          normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status || item.status) !==
          RETURN_STATUS.COMPLETED
        ) {
          return subtotal;
        }

        const resolutionType = normalizeClaimResolutionType(item.resolutionType || item.resolution_type || "");
        // credit_note deliberately excluded: this card is a CASH metric ("ចំណាយពិត ដក
        // តែតម្លៃសងដែលដោះស្រាយរួច" — actual cost = cash paid minus cash refunded), but a resolved
        // credit_note never produces cash at all — it creates a portable credit for a DIFFERENT,
        // later purchase instead (credit_amount_usd/khr is now always the full claim value, not a
        // cash figure — see PurchaseReturnService::applyItemSettlement). Including it here would
        // wrongly subtract money that was never actually paid back.
        if (resolutionType !== "refund") return subtotal;

        const amount = getClampedClaimAmount(item, "refund");
        return {
          usd: subtotal.usd + amount.usd,
          khr: subtotal.khr + amount.khr,
        };
      }, total);
    },
    { usd: 0, khr: 0 }
  );
  const summaryClaimDeductionKhr =
    summaryClaimDeduction.khr || (activeExchangeRate ? summaryClaimDeduction.usd * activeExchangeRate : 0);
  const summaryNetUsd = Math.max(0, summaryPaidUsd - summaryClaimDeduction.usd);
  const summaryNetKhr = Math.max(
    0,
    (summaryPaidKhr || (activeExchangeRate ? summaryPaidUsd * activeExchangeRate : 0)) - summaryClaimDeductionKhr
  );

  const openReturnsCount = purchaseReturns.filter((r) =>
    ![RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(
      normalizeReturnStatusLabel(r.status || r.resolutionStatus)
    ) || isReplacementClaimIncomplete(r)
  ).length;

  const resolvedReturnsCount = purchaseReturns.filter((r) =>
    [RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(
      normalizeReturnStatusLabel(r.status || r.resolutionStatus)
    ) && !isReplacementClaimIncomplete(r)
  ).length;

  const goToPaymentTab = (purchase) => {
    setPaymentViewFilter("outstanding");
    setPaymentSearchTerm(purchase?.purchaseNo || purchase?.supplierName || "");
    setActiveTab("payments");
  };

  const { unpaidCount, totalOutstandingUsd } = useMemo(() => {
    const outstanding = allPurchases.filter(
      (p) =>
        p.status !== STATUS.CANCELLED &&
        hasPurchasePaymentBalance(p) &&
        isPaymentReady(p) &&
        shouldShowInPaymentFlow(p)
    );
    return {
      unpaidCount: outstanding.length,
      totalOutstandingUsd: outstanding.reduce((sum, p) => sum + getPurchasePaymentBalance(p).usd, 0),
    };
  }, [allPurchases, purchaseReturnsByPurchaseId]);

  // Tab-scoped filtered lists below were plain IIFEs computed on every render regardless of which
  // tab was active — switching to "orders" still redid the receive/returns/payments scans every
  // keystroke. Wrapped in useMemo so each only recomputes when its own inputs actually change.
  const receiveFilteredList = useMemo(() => {
    const base = allPurchases.filter((p) => {
      const eff = getEffectivePurchaseStatus(p);
      if (eff === STATUS.PENDING_RECEIVE) return true;
      // A purchase can now read effective-PENDING_STOCK_IN purely because a replacement claim's
      // supplier-side action is done (received in full) — with the accepted portion already
      // fully stocked in, that's not a genuine Receive-tab action, only hasPendingReplacementStockIn
      // below covers that (and only when accepted stock-in is also still outstanding).
      if (eff === STATUS.PENDING_STOCK_IN && hasRemainingStockInQty(p)) return true;
      if (p.status === STATUS.PENDING_CLAIM && hasRemainingStockInQty(p)) return true;
      // Replacement goods can be marked "received" without being stocked in yet
      // (stockInReplacementIfNeeded is a separate trigger) — overall purchase status
      // can already be RECEIVED by then, so this must not be gated on p.status.
      // Only surface it here too when the *accepted* portion still has its own stock-in
      // action pending — if accepted qty is already fully stocked in, the replacement
      // stock-in action already lives in the Returns tab and repeating it here would just
      // be a duplicate entry with nothing distinct left to do from this tab.
      if (hasPendingReplacementStockIn(p) && hasRemainingStockInQty(p)) return true;
      // Status can jump straight to RECEIVED once accepted units are stocked in, even
      // when damaged/missing units still have an unclaimed claim_qty — keep the purchase
      // visible here as a reminder until a claim is actually created for it.
      return getClaimRequiredCount(p) > 0 && !getOpenSupplierClaim(p) && !hasResolvedSupplierClaim(p);
    });
    const q = receiveSearchTerm.trim().toLowerCase();
    if (!q) return base;
    // Also matches product/variant name, not just purchase no/supplier — this tab's own table
    // prominently shows product names in its "ទំនិញ / ខូច" column, so searching by product was a
    // reasonable expectation this didn't satisfy before.
    return base.filter(
      (p) =>
        (p.purchaseNo || "").toLowerCase().includes(q) ||
        (p.supplierName || "").toLowerCase().includes(q) ||
        (Array.isArray(p.items) ? p.items : []).some(
          (item) =>
            (item.productName || "").toLowerCase().includes(q) ||
            (item.variantName || "").toLowerCase().includes(q)
        )
    );
  }, [allPurchases, receiveSearchTerm, purchaseReturnsByPurchaseId]);
  const receiveLastPage = Math.max(1, Math.ceil(receiveFilteredList.length / CLIENT_TAB_PAGE_SIZE));
  const receivePageItems = receiveFilteredList.slice(
    (receivePage - 1) * CLIENT_TAB_PAGE_SIZE,
    receivePage * CLIENT_TAB_PAGE_SIZE
  );

  const returnFilteredList = useMemo(() => {
    let list = purchaseReturns;
    if (returnStatusFilter === "open")
      list = list.filter((r) =>
        ![RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(normalizeReturnStatusLabel(r.status || r.resolutionStatus)) ||
        isReplacementClaimIncomplete(r)
      );
    else if (returnStatusFilter === "resolved")
      list = list.filter((r) =>
        [RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(normalizeReturnStatusLabel(r.status || r.resolutionStatus)) &&
        !isReplacementClaimIncomplete(r)
      );
    const q = returnSearchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.purchaseReturnNo || "").toLowerCase().includes(q) ||
        (r.purchaseNo || "").toLowerCase().includes(q) ||
        (r.supplierName || "").toLowerCase().includes(q)
    );
  }, [purchaseReturns, returnStatusFilter, returnSearchTerm]);
  const returnsLastPage = Math.max(1, Math.ceil(returnFilteredList.length / CLIENT_TAB_PAGE_SIZE));
  const returnPageItems = returnFilteredList.slice(
    (returnsPage - 1) * CLIENT_TAB_PAGE_SIZE,
    returnsPage * CLIENT_TAB_PAGE_SIZE
  );

  const eligibleForReturn = useMemo(
    () =>
      allPurchases.filter((p) =>
        [STATUS.RECEIVED, STATUS.PENDING_STOCK_IN, STATUS.PENDING_CLAIM].includes(getEffectivePurchaseStatus(p))
      ),
    [allPurchases, purchaseReturnsByPurchaseId]
  );

  const newReturnEligible = useMemo(() => {
    const q = newReturnSearchTerm.trim().toLowerCase();
    if (!q) return eligibleForReturn;
    return eligibleForReturn.filter(
      (p) =>
        (p.purchaseNo || "").toLowerCase().includes(q) ||
        (p.supplierName || "").toLowerCase().includes(q)
    );
  }, [eligibleForReturn, newReturnSearchTerm]);

  const paymentFilteredList = useMemo(() => {
    let list;
    if (paymentViewFilter === "outstanding")
      list = allPurchases.filter(
        (p) =>
          p.status !== STATUS.CANCELLED &&
          hasPurchasePaymentBalance(p) &&
          isPaymentReady(p) &&
          shouldShowInPaymentFlow(p)
      );
    else if (paymentViewFilter === "paid")
      list = allPurchases.filter((p) => p.paymentStatus === "paid" && p.status !== STATUS.CANCELLED);
    else
      list = allPurchases.filter((p) => p.status !== STATUS.CANCELLED);
    const q = paymentSearchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        (p.purchaseNo || "").toLowerCase().includes(q) ||
        (p.supplierName || "").toLowerCase().includes(q)
    );
  }, [allPurchases, paymentViewFilter, paymentSearchTerm, purchaseReturnsByPurchaseId]);
  const paymentsLastPage = Math.max(1, Math.ceil(paymentFilteredList.length / CLIENT_TAB_PAGE_SIZE));
  const paymentPageItems = paymentFilteredList.slice(
    (paymentsPage - 1) * CLIENT_TAB_PAGE_SIZE,
    paymentsPage * CLIENT_TAB_PAGE_SIZE
  );

  // Only the replacement-claim progress nuance (agreed but not fully received/stocked yet) —
  // used on its own in the Receive tab row, which already has its own separate ខូច/claim pill
  // and its own status badge, so the other generic branches below (claim count, pending-receive)
  // would just repeat what that row already shows elsewhere.
  const getReplacementProgressLabel = (purchase) => {
    const replacementClaim = getOpenReplacementClaim(purchase);
    if (replacementClaim) {
      // Always just "រង់ចាំដំណោះស្រាយ" while anything's still outstanding, whether nothing or only
      // part has been received so far — the adjacent "N ខូច · សង M" pill already spells out the
      // exact damaged/resolved quantities, so a separate "សល់ N ទៀត" wording here was a redundant
      // second way of saying the same thing.
      return "រង់ចាំដំណោះស្រាយ";
    }
    // getOpenReplacementClaim above is receiving-based (isReplacementNotFullyReceived) — once
    // the full claimed qty has been received, it stops matching even though the goods still
    // haven't been stocked into inventory yet. Catch that distinct sub-state here so it doesn't
    // fall through to the generic "claim created" label below. Unlike the Returns tab's own 3-state
    // wording (which has its own separate stock-in action button right next to it), this badge is
    // the only place the Purchases-tab row communicates this, so it spells out that stock-in
    // confirmation specifically is what's still pending.
    // isReplacementClaimIncomplete is already item-aware (checks each item's own resolutionType) —
    // re-checking the return's own rollup resolutionType === "replacement" here was redundant AND
    // wrong: a mixed claim's rollup type reads "mixed", which never equals "replacement" and made
    // this branch never match for a mixed claim's still-pending replacement item at all, silently
    // leaving the purchase stuck showing "រង់ចាំការទាមទារ" forever even once genuinely done except
    // for the stock-in step.
    const pendingStockInReplacement = getRelatedPurchaseReturns(purchase).find(isReplacementClaimIncomplete);
    if (pendingStockInReplacement) return "ដោះស្រាយរួច ចាំបញ្ជាក់ស្តុកចូល";
    // Don't gate this on raw purchase.status === PENDING_CLAIM — the backend already flips it to
    // PENDING_STOCK_IN as soon as a money claim (refund/credit_note) resolves, so that check never
    // matched and this message silently never showed for resolved money claims. Gate on
    // hasRemainingStockInQty instead: only worth saying "claim resolved" while there's still an
    // accepted-qty stock-in action pending — once that's done too, this stops being relevant.
    if (hasResolvedSupplierClaim(purchase) && !getOpenSupplierClaim(purchase) && hasRemainingStockInQty(purchase)) {
      const resolvedReturn = getRelatedPurchaseReturns(purchase).find(
        (item) =>
          normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status) === RETURN_STATUS.COMPLETED &&
          !isReplacementClaimIncomplete(item)
      );
      const resolutionType = normalizeReturnResolutionType(resolvedReturn?.resolutionType || resolvedReturn?.resolution_type);
      // A replacement item can reach this branch too: its OWN claim stock-in is already done
      // (isReplacementClaimIncomplete is false, checked above), but the purchase's separate
      // accepted/usable-qty stock-in is still outstanding — a genuinely different, standalone
      // fact ("the replacement side is finished") rather than "waiting to confirm" like the other
      // three, so it doesn't get the generic " ចាំបញ្ជាក់ស្តុកចូល" suffix appended (that would
      // self-contradict "already confirmed" and "waiting to confirm" in the same label). Still
      // shares the "បញ្ជាក់ស្តុកចូល" substring so it gets the same purple-pill treatment as the
      // other three (see isPendingStockInAfterResolution's substring check).
      if (resolutionType === "replacement") return "ទំនិញជំនួសថ្មីបញ្ជាក់ស្តុកចូលរួចរាល់";
      // Used to append " ចាំបញ្ជាក់ស្តុកចូល" here (unlike the replacement case above, which never
      // did — see its own comment). That made sense back when this text only ever surfaced as plain
      // problemLabel text, with nothing else in the row saying stock-in was still pending. Now that
      // getPurchaseStatusBadge promotes this text into the primary purple badge unconditionally
      // (not just while effectiveStatus === PENDING_CLAIM), hasSeparatePendingStockIn's own blue
      // "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន" pill already fires right alongside it under the exact same
      // hasRemainingStockInQty condition — so the suffix became a duplicate of that pill. Drop it,
      // matching the replacement case's own reasoning above.
      const resolvedLabel = resolutionType === "refund" ? "សងប្រាក់រួចរាល់" : resolutionType === "credit_note" ? "កាត់លុយលើកក្រោយ ចប់ស្រេច" : "ការទាមទារ អ្នកផ្គត់ផ្គង់ បានដោះស្រាយ";
      return resolvedLabel;
    }
    return "";
  };

  const getPurchaseProblemLabel = (purchase) => {
    const damagedQty = getDamagedCount(purchase);
    const replacementProgress = getReplacementProgressLabel(purchase);
    if (replacementProgress) return replacementProgress;
    const moneyClaim = getOpenMoneyClaim(purchase);
    if (moneyClaim) {
      const resolutionType = normalizeReturnResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type);
      return resolutionType === "refund" ? "រង់ចាំការសងប្រាក់" : "កាត់លុយលើកក្រោយ កំពុងដំណើរការ";
    }
    if (getOpenSupplierClaim(purchase)) return "ការទាមទារ អ្នកផ្គត់ផ្គង់ បានបង្កើត";
    // The plain "ចំនួនខូច N" number itself now always shows as its own dedicated line in
    // PurchaseTable.jsx (regardless of claim state) — this branch used to be the only place it
    // showed, and only before a claim existed, so it's been moved rather than duplicated. Still
    // used in the list/table (see below) — only the ViewPurchaseModal detail popup drops this
    // specific branch, since that popup separately spells out the excluded amount in its own
    // payment summary (see hasPayAfterCheckDamage in ViewPurchaseModal.jsx) and showing both was
    // reported as a redundant duplicate there.
    if (purchase.paymentMode === "pay_after_check" && damagedQty > 0) return `${damagedQty} ខូចដកចេញ`;
    // No PENDING_RECEIVE branch here: wherever this label is shown, the purchase's own status
    // badge already reads "រង់ចាំទទួលទំនិញ" right next to it — repeating that as a sub-line
    // added no new information, just duplicate text.
    return "";
  };

  // Once a replacement claim exists (any resolution status — even still "submitted"), we already
  // know specifically what's being waited on. Showing the generic "រង់ចាំការទាមទារ" ("waiting for
  // claim") badge next to a "រង់ចាំទំនិញជំនួសថ្មី" sub-line said the same thing twice in less-clear
  // words first — replace the badge itself with the specific text instead, matching how the
  // Returns tab already displays this same claim. `overrode: true` tells callers to skip the
  // separate problemLabel sub-line since it would now just repeat the badge.
  const getPurchaseStatusBadge = (purchase) => {
    const effectiveStatus = getEffectivePurchaseStatus(purchase);
    // Not gated on effectiveStatus === PENDING_CLAIM: normally a claim only exists while
    // effectiveStatus genuinely still reads PENDING_CLAIM, so this gate used to be a no-op safety
    // net. But partial_prepaid's "silently absorbed" case (isSupplierClaimNeeded skips the claim
    // step entirely when the damage value fits inside the still-unpaid balance) can reach
    // PENDING_STOCK_IN/RECEIVED with purchase.status frozen there — and the user can still create a
    // claim manually afterward (e.g. choosing replacement instead of accepting the silent
    // deduction). effectiveStatus never reflects that later claim, so this check must run
    // unconditionally to still catch it. Both helpers already self-gate correctly once truly done
    // (not completed/cancelled, or replacement not fully received), so this is safe for every
    // payment mode — for prepaid/pay_after_check, isSupplierClaimNeeded never takes the silent-
    // absorption shortcut, so effectiveStatus always genuinely reflects an open claim already;
    // removing this gate changes nothing for them.
    const replacementProgress = getReplacementProgressLabel(purchase);
    if (replacementProgress) {
      // Icon must match which of getReplacementProgressLabel's possible messages this actually
      // is — a hardcoded FiTruck here read as a delivery-in-transit icon even for the "nothing
      // received yet" and "fully received/resolved" messages, which aren't about a truck at all.
      const icon = replacementProgress.includes("រង់ចាំដំណោះស្រាយ") ? <FiClock /> : <FiCheckCircle />;
      return {
        label: replacementProgress,
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        icon,
        overrode: true,
      };
    }
    // Same idea for a money claim (refund/credit_note) that's been created but not yet
    // resolved — we already know what's specifically being waited on, so show that instead
    // of the generic "រង់ចាំការទាមទារ" badge, consistent with the replacement case above.
    const moneyClaim = getOpenMoneyClaim(purchase);
    if (moneyClaim) {
      const resolutionType = normalizeReturnResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type);
      return {
        label: resolutionType === "refund" ? "រង់ចាំការសងប្រាក់" : "កាត់លុយលើកក្រោយ កំពុងដំណើរការ",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        icon: <FiDollarSign />,
        overrode: true,
      };
    }
    // partial_prepaid purchases can reach PENDING_STOCK_IN with damaged qty still on them without
    // ever creating a formal supplier claim — isSupplierClaimNeeded skips the claim step whenever
    // the damaged goods' value can just be silently deducted from the still-unpaid balance instead
    // (see getPartialPrepaidClaimDeduction/getUnpaidItemAmountBeforeClaim above). The plain "រង់ចាំ
    // បញ្ចូលក្នុងស្តុក" label then reads as if the FULL invoiced qty is going to stock, when really
    // only the accepted/usable portion is — same "waiting to confirm usable qty" wording already
    // used elsewhere (isPendingStockInAfterResolution, the PENDING_CLAIM stock-in sub-badge) fits
    // here too.
    if (
      effectiveStatus === STATUS.PENDING_STOCK_IN &&
      purchase.paymentMode === "partial_prepaid" &&
      getDamagedCount(purchase) > 0
    ) {
      return {
        label: "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន",
        className: getStatusClass(effectiveStatus),
        icon: getStatusIcon(effectiveStatus),
        overrode: false,
      };
    }
    return {
      label: STATUS_LABEL[effectiveStatus] ?? effectiveStatus,
      className: getStatusClass(effectiveStatus),
      icon: getStatusIcon(effectiveStatus),
      overrode: false,
    };
  };

  const getNextActionLabel = (purchase) => {
    const effectiveStatus = getEffectivePurchaseStatus(purchase);
    if (effectiveStatus === STATUS.DRAFT) return "បន្តកែ";
    if (effectiveStatus === STATUS.PENDING_RECEIVE) return "ទទួលទំនិញ";
    if (getOpenReplacementClaim(purchase)) return "ទទួលជំនួស";
    const moneyClaim = getOpenMoneyClaim(purchase);
    if (moneyClaim) {
      const resolutionType = normalizeReturnResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type);
      return resolutionType === "refund" ? "ប្រាក់ត្រូវបានសង" : "ដោះស្រាយកាត់លុយលើកក្រោយ";
    }
    if (getOpenSupplierClaim(purchase)) return "ការទាមទារ អ្នកផ្គត់ផ្គង់ បានបង្កើត";
    if (effectiveStatus === STATUS.PENDING_CLAIM) return "បង្កើតការទាមទារ អ្នកផ្គត់ផ្គង់";
    if (effectiveStatus === STATUS.PENDING_STOCK_IN) return "បើក ស្តុក";
    if (effectiveStatus === STATUS.RECEIVED) return "បានបញ្ចប់";
    return "គ្មានសកម្មភាព";
  };

  const getPrimarySaveLabel = () => {
    if (modalMode === "receive_goods") return "រក្សាការទទួល";
    if (purchaseForm.paymentMode === "pay_after_check") return "រក្សាទុកការទិញ";
    if (purchaseForm.paymentMode === "prepaid" || purchaseForm.paymentMode === "partial_prepaid") {
      const hasReceived = purchaseItems.some((item) => Number(item.receivedQty || 0) > 0);
      const hasClaim = purchaseItems.some((item) => Number(item.claimQty || 0) > 0);
      if (!hasReceived) return "រក្សារង់ចាំទទួល";
      if (hasClaim) return "រក្សារង់ចាំការទាមទារ";
      return "រក្សារង់ចាំបញ្ចូលក្នុងស្តុក";
    }
    return "រក្សាការទិញ";
  };

  const invalidatePurchaseQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["purchases"] });
    queryClient.invalidateQueries({ queryKey: ["purchases", "detail"] });
    queryClient.removeQueries({ queryKey: ["purchases", "detail"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
  };

  const createPurchaseMutation = useMutation({
    mutationFn: createPurchaseApi,
    onSuccess: () => {
      invalidatePurchaseQueries();
      notify.success("បានបង្កើតការទិញ", "វិក្កយបត្រការទិញបានរក្សាទុករួចហើយ។");
      closeModal();
    },
    onError: (error) => {
      notify.error("បរាជ័យក្នុងការបង្កើត", getErrorMessage(error));
    },
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: updatePurchaseApi,
    onSuccess: () => {
      invalidatePurchaseQueries();
      notify.success("បានធ្វើបច្ចុប្បន្នភាពការទិញ", "វិក្កយបត្រការទិញបានធ្វើបច្ចុប្បន្នភាពរួចហើយ។");
      closeModal();
    },
    onError: (error) => {
      notify.error("បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាព", getErrorMessage(error));
    },
  });

  const createPurchaseReturnMutation = useMutation({
    mutationFn: createPurchaseReturnApi,
    onSuccess: () => {
      invalidatePurchaseQueries();
      notify.success("បានរក្សាការទាមទារ អ្នកផ្គត់ផ្គង់", "ការត្រឡប់ទំនិញបានរក្សាទុករួចហើយ។");
      closeModal();
    },
    onError: (error) => {
      notify.error("បរាជ័យក្នុងការទាមទារ", getErrorMessage(error));
    },
  });

  const sanitizePurchaseItemsForApi = (payload = {}) => ({
    ...payload,
    items: Array.isArray(payload.items)
      ? payload.items.map((item) => {
          const expiredDate = formatDateOnly(item.expired_date || item.expiry_date || item.expiredDate || item.expiryDate);
          return {
            ...item,
            expired_date: expiredDate === "-" ? null : expiredDate,
            expiry_date: expiredDate === "-" ? null : expiredDate,
          };
        })
      : payload.items,
  });

  const receiveReplacementMutation = useMutation({
    mutationFn: async ({ purchaseReturn, payload, purchasePayload, purchaseId }) => {
      const response = await updatePurchaseReturnApi({
        id: purchaseReturn.id,
        payload,
      });

      if (purchasePayload && purchaseId) {
        const sanitizedPayload = sanitizePurchaseItemsForApi(purchasePayload);
        await syncPurchaseItemsApi({
          purchaseId,
          items: sanitizedPayload.items || [],
        });
      }

      return response;
    },
    onSuccess: () => {
      invalidatePurchaseQueries();
      notify.success("បានទទួលជំនួស", "ការជំនួស អ្នកផ្គត់ផ្គង់ បានកត់ទុកថាបានទទួលរួចហើយ។");
      closeReplacementModal();
      closeModal();
    },
    onError: (error) => {
      notify.error("បរាជ័យក្នុងការទទួលជំនួស", getErrorMessage(error));
    },
  });

  const resolveSupplierClaimMutation = useMutation({
    mutationFn: ({ claim, payload }) =>
      updatePurchaseReturnApi({
        id: claim.id,
        payload,
      }),
    onSuccess: () => {
      invalidatePurchaseQueries();
      notify.success("ការទាមទារ អ្នកផ្គត់ផ្គង់ បានដោះស្រាយ", "ការសង ឬ កាត់លុយលើកក្រោយ បានកត់ទុកថាបានបញ្ចប់រួចហើយ។");
      closeModal();
    },
    onError: (error) => {
      notify.error("បរាជ័យក្នុងការដោះស្រាយការទាមទារ", getErrorMessage(error));
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, payload }) => recordPurchasePaymentApi({ id, payload }),
    onSuccess: (response) => {
      invalidatePurchaseQueries();
      const updated = normalizePurchase(extractApiObject(response));
      setRecordPaymentPurchase(null);
      if (updated) setSelectedPurchase(updated);
      if (updated?.paymentStatus === "paid") {
        notify.success("ការទូទាត់បានបញ្ចប់", "ការទិញបានបង់ទាំងស្រុងរួចហើយ។");
        closeModal();
      } else {
        notify.success("ការទូទាត់បានកត់ត្រា", "ការទូទាត់ផ្នែកខ្លះបានកត់ត្រារួចហើយ។");
      }
    },
    onError: (error) => {
      notify.error("បរាជ័យក្នុងការកត់ការទូទាត់", getErrorMessage(error));
    },
  });

  const loadPurchaseDetail = async (purchase) => {
    if (!purchasesQuery.data || !purchase?.id || String(purchase.id).startsWith("local-")) {
      return purchase;
    }

    try {
      const response = await queryClient.fetchQuery({
        queryKey: ["purchases", "detail", purchase.id],
        queryFn: () => getPurchaseByIdApi(purchase.id),
        staleTime: 0,
      });

      return normalizePurchase(extractApiObject(response));
    } catch (error) {
      notify.error("Purchase detail failed", getErrorMessage(error));
      return purchase;
    }
  };

  const openAddModal = () => {
    const dateKey = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    setSelectedPurchase(null);
    setPurchaseErrors({});
    setPaidCurrencyTouched(false);
    setPurchaseForm({
      ...emptyPurchaseForm,
      purchaseNo: `PUR-${dateKey}-${String((pagination.total || purchases.length) + 1).padStart(5, "0")}`,
      exchangeRateUsed: activeExchangeRate,
      khrRounding: activeKhrRounding,
      exchangeRateSource: activeExchangeRate ? "system" : "manual",
    });
    setPurchaseItems([]);
    setModalMode("add");
  };

  const openViewModal = async (purchase) => {
    const detail = await loadPurchaseDetail(purchase);
    setSelectedPurchase(detail);
    setModalMode("view");
  };

  const openEditModal = async (purchase) => {
    const detail = await loadPurchaseDetail(purchase);
    setSelectedPurchase(detail);
    setPurchaseErrors({});
    setPaidCurrencyTouched(true);
    setPurchaseForm({
      purchaseNo: detail.purchaseNo,
      supplierId: detail.supplierId,
      purchaseDate: detail.purchaseDate,
      inputCurrency: detail.inputCurrency || "USD",
      exchangeRateUsed: detail.exchangeRateUsed || activeExchangeRate,
      khrRounding: detail.khrRounding || "floor",
      exchangeRateSource: detail.exchangeRateSource || "manual",
      exchangeRateNote: detail.exchangeRateNote || "",
      paymentMode: detail.paymentMode || "pay_after_check",
      paymentStatus: detail.paymentStatus || "unpaid",
      discountTotal: detail.discountTotal,
      discountCurrency: detail.discountCurrency || "USD",
      deliveryOption: detail.deliveryOption,
      deliveryFee: detail.deliveryFee,
      deliveryFeeCurrency: detail.deliveryFeeCurrency,
      deliveryPaidBy: detail.deliveryPaidBy,
      paidAmount: detail.paidAmount || 0,
      paidCurrency: detail.paidCurrency || "USD",
      // Already-applied supplier credit (from creation time, or a later apply-credit pass) —
      // read-only here (this form doesn't re-expose the apply-credit control outside "add" mode),
      // just needed so calculateCurrencyPreview's summary figures stay accurate for this purchase.
      creditApplied: detail.creditAppliedUsd || 0,
      creditAppliedCurrency: "USD",
      note: detail.note,
      status: detail.status,
    });
    setPurchaseItems(detail.items || []);
    setModalMode("edit");
  };

  const openReceiveGoodsModal = async (purchase) => {
    const detail = await loadPurchaseDetail(purchase);
    setSelectedPurchase(detail);
    setPaidCurrencyTouched(true);
    setPurchaseForm({
      purchaseNo: detail.purchaseNo,
      supplierId: detail.supplierId,
      purchaseDate: detail.purchaseDate,
      inputCurrency: detail.inputCurrency || "USD",
      exchangeRateUsed: detail.exchangeRateUsed || activeExchangeRate,
      khrRounding: detail.khrRounding || "floor",
      exchangeRateSource: detail.exchangeRateSource || "manual",
      exchangeRateNote: detail.exchangeRateNote || "",
      paymentMode: detail.paymentMode || "prepaid",
      // Was "paid" — a stale/inconsistent fallback vs. every other spot in this file (see
      // openEditModal's own "unpaid" fallback just below), and specifically wrong for
      // pay_after_check purchases, which are never paid upfront.
      paymentStatus: detail.paymentStatus || "unpaid",
      discountTotal: detail.discountTotal,
      discountCurrency: detail.discountCurrency || "USD",
      deliveryOption: detail.deliveryOption,
      deliveryFee: detail.deliveryFee,
      deliveryFeeCurrency: detail.deliveryFeeCurrency,
      deliveryPaidBy: detail.deliveryPaidBy,
      paidAmount: detail.paidAmount || 0,
      paidCurrency: detail.paidCurrency || "USD",
      // Already-applied supplier credit (from creation time, or a later apply-credit pass) —
      // read-only here (this form doesn't re-expose the apply-credit control outside "add" mode),
      // just needed so calculateCurrencyPreview's summary figures stay accurate for this purchase.
      creditApplied: detail.creditAppliedUsd || 0,
      creditAppliedCurrency: "USD",
      note: detail.note,
      status: detail.status,
    });
    setPurchaseItems(detail.items || []);
    setModalMode("receive_goods");
  };

  const openPurchaseReturnModal = async (purchase) => {
    const detail = await loadPurchaseDetail(purchase);
    const claimItems = (detail.items || [])
      // Only auto-add items that actually have recorded damage/claim — getAvailableReturnQty
      // falls back to the full acceptedQty for items with neither, which is meant for manually
      // adding an item to a claim later (e.g. wrong-item returns), not for auto-populating a
      // brand-new claim with fully-good, undamaged items.
      .filter((item) => Number(item.claimQty || 0) > 0 || Number(item.damagedQty || 0) > 0)
      .map((item) => {
        const availableQty = getAvailableReturnQty(item, { purchaseContext: detail, draftItems: [] });
        return { item, availableQty };
      })
      .filter(({ availableQty }) => availableQty > 0)
      .map(({ item, availableQty }) =>
        buildPurchaseReturnItemFromPurchaseItem(item, {
          purchaseContext: detail,
          qtyReturned: availableQty,
          condition: "damaged",
          reason: "ទំនិញខូចបានទាមទារទៅអ្នកផ្គត់ផ្គង់ ។",
        })
      );

    setSelectedPurchase(detail);
    setPurchaseReturnErrors({});
    setPurchaseReturnItemErrors({});
    setPurchaseReturnForm({
      ...emptyPurchaseReturnForm,
      purchaseReturnNo: `PRET-${String(purchaseReturns.length + 1).padStart(3, "0")}`,
      purchaseId: detail.id,
      supplierId: detail.supplierId,
      returnDate: new Date().toISOString().slice(0, 10),
      returnReason: getClaimRequiredCount(detail) > 0 ? "damaged" : "other",
      resolutionType: "replacement",
      resolutionStatus: "submitted",
      status: RETURN_STATUS.SUBMITTED,
    });
    setPurchaseReturnItems(claimItems);
    setPurchaseReturnItemForm(emptyPurchaseReturnItemForm);
    setModalMode("purchase_return");
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setItemEditIndex(null);
    setItemForm(emptyItemForm);
    setItemErrors({});
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPurchase(null);
    setPurchaseForm(emptyPurchaseForm);
    setPaidCurrencyTouched(false);
    setPurchaseItems([]);
    setPurchaseErrors({});
    setItemErrors({});
    setPurchaseReturnForm(emptyPurchaseReturnForm);
    setPurchaseReturnItems([]);
    setPurchaseReturnErrors({});
    setPurchaseReturnItemForm(emptyPurchaseReturnItemForm);
    setPurchaseReturnItemErrors({});
    closeItemModal();
  };

  const clampPaidAmountForForm = (formToClamp, itemsToUse = purchaseItems) => {
    const next = { ...formToClamp };
    const paidValue = Number(next.paidAmount || 0);

    if (next.paymentMode === "pay_after_check" || next.paymentStatus === "paid" || paidValue <= 0) {
      return next;
    }

    if (itemsToUse.length === 0) {
      next.paidAmount = 0;
      return next;
    }

    const totals = calculateCurrencyPreview({
      items: itemsToUse,
      form: { ...next, paidAmount: 0 },
    });
    const maxAmount = next.paidCurrency === "KHR" ? totals.grandTotalKhr : totals.grandTotalUsd;

    if (maxAmount <= 0) {
      next.paidAmount = 0;
      return next;
    }

    if (paidValue > maxAmount) {
      next.paidAmount = next.paidCurrency === "KHR"
        ? String(Math.floor(maxAmount))
        : String(Number(maxAmount).toFixed(2));
    }

    return next;
  };

  const clampDiscountForForm = (formToClamp, itemsToUse = purchaseItems) => {
    const next = { ...formToClamp };

    if ((next.discountType || "amount") === "percent") {
      const percent = Number(next.discountPercent || 0);
      if (percent > 100) next.discountPercent = 100;
      if (percent < 0) next.discountPercent = 0;
      return next;
    }

    const discountValue = Number(next.discountTotal || 0);
    if (discountValue <= 0) return next;

    if (itemsToUse.length === 0) {
      next.discountTotal = 0;
      return next;
    }

    const totals = calculateCurrencyPreview({
      items: itemsToUse,
      form: { ...next, discountTotal: 0, discountPercent: 0 },
    });
    const discountCurrency = String(next.discountCurrency || itemsToUse[0]?.inputCurrency || next.inputCurrency || "USD").toUpperCase();
    const maxDiscount = discountCurrency === "KHR" ? totals.subtotalKhr : totals.subtotalUsd;

    if (maxDiscount <= 0) {
      next.discountTotal = 0;
      return next;
    }

    if (discountValue > maxDiscount) {
      next.discountTotal = discountCurrency === "KHR"
        ? String(Math.floor(maxDiscount))
        : String(Number(maxDiscount).toFixed(2));
    }

    return next;
  };

  const normalizePurchaseFormAmounts = (formToNormalize, itemsToUse = purchaseItems) =>
    clampPaidAmountForForm(clampDiscountForForm(formToNormalize, itemsToUse), itemsToUse);

  const handlePurchaseFormChange = (field, value) => {
    if (field === "paidCurrency") {
      setPaidCurrencyTouched(true);
    }

    setPurchaseForm((previous) => {
      const next = { ...previous, [field]: value };

      // Credit balance is per-supplier — switching supplier makes any previously-selected
      // credit meaningless (it belonged to the OLD supplier's balance).
      if (field === "supplierId") {
        next.creditApplied = 0;
        next.selectedCreditIds = [];
      }

      // Checkbox toggle for one SOURCE PURCHASE's whole group of supplier_credits rows (see
      // PurchaseFormModal's grouped credit list — multiple damaged items claimed within the same
      // invoice are one invoice's worth of credit, so checking the box selects/deselects all of
      // that group's underlying ids together, never just one). Not a real form field itself, so
      // it's translated into selectedCreditIds plus the derived creditApplied/
      // creditAppliedCurrency that the rest of this form (totals, validation, save payload)
      // already knows how to read.
      if (field === "toggleCreditGroup") {
        const groupIds = (Array.isArray(value) ? value : [value]).map(Number);
        const currentIds = Array.isArray(previous.selectedCreditIds) ? previous.selectedCreditIds : [];
        const groupAlreadySelected = groupIds.every((id) => currentIds.includes(id));
        const nextIds = groupAlreadySelected
          ? currentIds.filter((id) => !groupIds.includes(id))
          : [...new Set([...currentIds, ...groupIds])];
        const totals = getSelectedCreditsTotal(nextIds);
        next.selectedCreditIds = nextIds;
        next.creditApplied = totals.usd;
        next.creditAppliedCurrency = "USD";
        delete next.toggleCreditGroup;
      }

      if (field === "paymentMode") {
        if (value === "prepaid") {
          next.paymentStatus = "paid";
          next.status = STATUS.PENDING_RECEIVE;
        } else if (value === "pay_after_check") {
          next.paymentStatus = "unpaid";
          next.status = STATUS.PENDING_STOCK_IN;
          next.paidAmount = 0;
        } else {
          next.paymentStatus = "partial";
          next.status = STATUS.PENDING_RECEIVE;
          next.paidAmount = 0;
        }
      }

      if (field === "paymentStatus" && value === "paid") {
        const grandTotal = calculateGrandTotal(purchaseItems, next);
        next.paidAmount = grandTotal;
      }

      if (field === "paymentStatus" && value !== "paid") {
        next.paidAmount = 0;
      }

      return normalizePurchaseFormAmounts(next);
    });

    setPurchaseErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const openAddItemModal = () => {
    setItemErrors({});
    setItemEditIndex(null);
    setItemForm({
      ...emptyItemForm,
      inputCurrency: purchaseItems[0]?.inputCurrency || purchaseForm.paidCurrency || "USD",
      receivedQty: (purchaseForm.paymentMode === "prepaid" || purchaseForm.paymentMode === "partial_prepaid" || purchaseForm.paymentMode === "pay_after_check") ? 0 : "",
      acceptedQty: (purchaseForm.paymentMode === "prepaid" || purchaseForm.paymentMode === "partial_prepaid" || purchaseForm.paymentMode === "pay_after_check") ? 0 : "",
    });
    setItemModalOpen(true);
  };

  const openEditItemModal = (item, index) => {
    setItemErrors({});
    setItemEditIndex(index);
    setItemForm({
      variantUnitId: item.variantUnitId,
      invoicedQty: item.invoicedQty,
      paidQty: item.paidQty,
      receivedQty: item.receivedQty,
      acceptedQty: item.acceptedQty,
      damagedQty: item.damagedQty,
      claimQty: item.claimQty,
      inputCurrency: item.inputCurrency || "USD",
      inputUnitCost: item.inputUnitCost || item.unitCost ? String(Number(item.inputUnitCost || item.unitCost || 0).toFixed(2)) : "",
      invoiceTotal: (() => {
        if (item.invoiceTotal) return String(Number(item.invoiceTotal).toFixed(2));
        const cost = Number(item.inputUnitCost || item.unitCost || 0);
        const qty = Number(item.invoicedQty || 0);
        return cost > 0 && qty > 0 ? String(parseFloat((cost * qty).toFixed(2))) : "";
      })(),
      paidAmount: "",
      unitCost: item.unitCost,
      expiredDate: formatDateOnly(item.expiredDate) === "-" ? "" : formatDateOnly(item.expiredDate),
    });
    setItemModalOpen(true);
  };

  const handleItemFormChange = (field, value) => {
    setItemForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "variantUnitId") {
        const selected = variantUnits.find((unit) => String(unit.id) === String(value));
        if (selected) {
          next.inputUnitCost = next.inputUnitCost || selected.defaultCost;
          next.unitCost = next.unitCost || selected.defaultCost;
        }
      }

      if (field === "invoiceTotal") {
        const qty = Number(next.invoicedQty || 0);
        if (qty > 0 && value !== "") {
          next.inputUnitCost = String(Number(value) / qty > 0 ? Number(Number(value) / qty).toFixed(2) : "0.00");
          next.unitCost = next.inputUnitCost;
        }
      }

      if (field === "inputUnitCost") {
        const qty = Number(next.invoicedQty || 0);
        next.invoiceTotal = qty > 0 ? String(parseFloat((Number(value || 0) * qty).toFixed(2))) : "";
      }

      if (field === "invoicedQty") {
        if (purchaseForm.paymentMode === "prepaid" || purchaseForm.paymentMode === "partial_prepaid") next.paidQty = value;
        const unitCost = Number(next.inputUnitCost || 0);
        if (unitCost > 0) {
          next.invoiceTotal = String(parseFloat((unitCost * Number(value || 0)).toFixed(2)));
        }
      }

      if (field === "receivedQty") {
        const receivedQty = Number(value || 0);
        const damagedQty = Number(next.damagedQty || 0);
        next.acceptedQty = Math.max(0, receivedQty - damagedQty);
      }

      if (field === "damagedQty") {
        const receivedQty = Number(next.receivedQty || 0);
        const damagedQty = Number(value || 0);
        next.acceptedQty = Math.max(0, receivedQty - damagedQty);
        if (purchaseForm.paymentMode === "prepaid") next.claimQty = damagedQty;
        if (purchaseForm.paymentMode === "pay_after_check") next.claimQty = 0;
      }

      if (field === "acceptedQty") {
        const acceptedQty = Number(value || 0);
        if (purchaseForm.paymentMode === "pay_after_check") {
          next.paidQty = acceptedQty;
          next.claimQty = 0;
        }
      }

      return next;
    });

    setItemErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const validatePurchaseItem = (formToValidate = itemForm) => {
    const nextErrors = {};
    const selectedUnit = variantUnits.find((unit) => String(unit.id) === String(formToValidate.variantUnitId));

    if (!formToValidate.variantUnitId) {
      nextErrors.variantUnitId = "សូមជ្រើសប្រភេទផលិតផល";
    } else {
      // Nothing previously stopped picking the same product+unit twice, leaving two fully
      // identical rows in the items table with no way to tell them apart — block it here instead,
      // excluding the row currently being edited (re-saving it unchanged isn't a duplicate).
      const duplicateIndex = purchaseItems.findIndex(
        (row, index) => String(row.variantUnitId) === String(formToValidate.variantUnitId) && index !== itemEditIndex
      );
      if (duplicateIndex !== -1) {
        nextErrors.variantUnitId = "ផលិតផលនេះមានរួចហើយក្នុងបញ្ជី — សូមកែប្រែជួរដែលមានស្រាប់ជំនួសវិញ។";
      }
    }
    if (!formToValidate.inputCurrency) nextErrors.inputCurrency = "សូមជ្រើសរូបិយប័ណ្ណ";
    if (!formToValidate.invoicedQty || Number(formToValidate.invoicedQty) <= 0) nextErrors.invoicedQty = "ចំនួនកម្មង់ត្រូវតែធំជាង 0";
    if (!formToValidate.invoiceTotal || Number(formToValidate.invoiceTotal) <= 0) nextErrors.invoiceTotal = "សរុបតម្លៃទំនិញនេះត្រូវតែធំជាង 0";
    if (formToValidate.receivedQty === "" || Number(formToValidate.receivedQty) < 0) nextErrors.receivedQty = "ចំនួនមកដល់មិនអាចតិចជាង 0";
    if (formToValidate.acceptedQty === "" || Number(formToValidate.acceptedQty) < 0) nextErrors.acceptedQty = "ចំនួនទទួលយកមិនអាចតិចជាង 0";
    if (Number(formToValidate.acceptedQty || 0) > Number(formToValidate.invoicedQty || 0)) nextErrors.acceptedQty = "ចំនួនទទួលយកមិនអាចលើសចំនួនកម្មង់";
    if (Number(formToValidate.acceptedQty || 0) + Number(formToValidate.damagedQty || 0) > Number(formToValidate.invoicedQty || 0)) nextErrors.damagedQty = "ចំនួនទទួលយក + ខូចមិនអាចលើសចំនួនកម្មង់";
    if (Number(formToValidate.acceptedQty || 0) > Number(formToValidate.receivedQty || 0)) nextErrors.acceptedQty = "ចំនួនទទួលយកមិនអាចលើសចំនួនមកដល់";
    if (Number(formToValidate.damagedQty || 0) < 0) nextErrors.damagedQty = "ចំនួនខូចមិនអាចតិចជាង 0";
    if (selectedUnit?.isExpirable && Number(formToValidate.receivedQty || 0) > 0 && !formToValidate.expiredDate) {
      nextErrors.expiredDate = "ថ្ងៃផុតកំណត់ចាំបាច់ក្រោយទទួលទំនិញ";
    }

    setItemErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPurchaseItemFromForm = (formToBuild = itemForm) => {
    const selectedUnit = variantUnits.find((unit) => String(unit.id) === String(formToBuild.variantUnitId));
    if (!selectedUnit) return null;

    const paymentMode = purchaseForm.paymentMode;
    const invoicedQty = Number(formToBuild.invoicedQty || 0);
    const receivedQty = Number(formToBuild.receivedQty || 0);
    const acceptedQty = Number(formToBuild.acceptedQty || 0);
    const damagedQty = Number(formToBuild.damagedQty || 0);
    const inputCurrency = formToBuild.inputCurrency || "USD";
    const inputUnitCost = Number(formToBuild.inputUnitCost || formToBuild.unitCost || 0);
    const exchangeRate = Number(purchaseForm.exchangeRateUsed || activeExchangeRate || 0);
    const { unitCostUsd, unitCostKhr } = convertCost({
      inputCurrency,
      inputUnitCost,
      exchangeRate,
    });

    let paidQty = Number(formToBuild.paidQty || 0);
    let claimQty = Number(formToBuild.claimQty || 0);

    if (paymentMode === "pay_after_check") {
      paidQty = acceptedQty;
      claimQty = 0;
    }

    if (paymentMode === "prepaid") {
      paidQty = invoicedQty;
      claimQty = damagedQty;
    }

    if (paymentMode === "partial_prepaid") {
      paidQty = invoicedQty;
      claimQty = receivedQty > 0 ? Math.max(0, invoicedQty - acceptedQty) : 0;
    }

    const { lineTotalUsd, lineTotalKhr } = calculateLineTotalsByPaymentMode({
      paymentMode,
      inputCurrency,
      inputUnitCost,
      invoiceTotal: formToBuild.invoiceTotal,
      paidAmount: paymentMode === "prepaid" ? formToBuild.invoiceTotal : 0,
      invoicedQty,
      acceptedQty,
      receivedQty,
      damagedQty,
      paidQty,
      exchangeRate,
    });
    const unitCostBase = unitCostUsd / Number(selectedUnit.conversionQty || 1);

    return {
      id: Date.now(),
      variantUnitId: selectedUnit.id,
      productName: selectedUnit.productName,
      variantName: selectedUnit.variantName,
      variantCode: selectedUnit.variantCode,
      unitName: selectedUnit.unitName,
      baseUnit: selectedUnit.baseUnit,
      conversionQty: selectedUnit.conversionQty,
      invoicedQty,
      paidQty,
      receivedQty,
      acceptedQty,
      damagedQty,
      claimQty,
      inputCurrency,
      inputUnitCost,
      invoiceTotal: Number(formToBuild.invoiceTotal || 0),
      paidAmount: Number((paymentMode === "prepaid" ? formToBuild.invoiceTotal : 0) || 0),
      unitCost: unitCostUsd,
      unitCostUsd,
      unitCostKhr,
      unitCostBase,
      lineTotal: lineTotalUsd,
      lineTotalUsd,
      lineTotalKhr,
      expiredDate: formToBuild.expiredDate || "",
    };
  };

  const handleSaveItem = (submittedValues = null) => {
    const effectiveItemForm = submittedValues ? { ...itemForm, ...submittedValues } : itemForm;
    setItemForm(effectiveItemForm);
    if (!validatePurchaseItem(effectiveItemForm)) return;

    const item = buildPurchaseItemFromForm(effectiveItemForm);
    if (!item) {
      setItemErrors({ variantUnitId: "Invalid purchase item." });
      return;
    }

    const newItems = itemEditIndex !== null
      ? purchaseItems.map((row, index) => (index === itemEditIndex ? { ...item, id: row.id } : row))
      : [...purchaseItems, item];

    setPurchaseItems(newItems);

    const itemCurrency = String(item.inputCurrency || "").toUpperCase();
    const shouldAutoPaidCurrency =
      !paidCurrencyTouched &&
      purchaseForm.paymentMode !== "pay_after_check" &&
      ["USD", "KHR"].includes(itemCurrency);

    if (shouldAutoPaidCurrency) {
      setPurchaseForm((prev) => normalizePurchaseFormAmounts({ ...prev, paidCurrency: itemCurrency }, newItems));
    } else {
      setPurchaseForm((prev) => normalizePurchaseFormAmounts(prev, newItems));
    }

    closeItemModal();
  };

  const handleRemoveItem = (index) => {
    const newItems = purchaseItems.filter((_, itemIndex) => itemIndex !== index);
    setPurchaseItems(newItems);
    setPurchaseErrors((previous) => ({ ...previous, items: "" }));

    if (purchaseForm.paymentMode !== "pay_after_check" && !paidCurrencyTouched && newItems.length > 0) {
      const autoCurrency = String(newItems[0]?.inputCurrency || purchaseForm.paidCurrency || "USD").toUpperCase();
      if (["USD", "KHR"].includes(autoCurrency)) {
        setPurchaseForm((prev) => normalizePurchaseFormAmounts({ ...prev, paidCurrency: autoCurrency }, newItems));
        return;
      }
    }

    setPurchaseForm((prev) => normalizePurchaseFormAmounts(prev, newItems));
  };

  const validatePurchaseForm = () => {
    const nextErrors = {};
    const requiresPaymentInfo = purchaseForm.paymentMode !== "pay_after_check";
    if (!purchaseForm.purchaseNo.trim()) nextErrors.purchaseNo = "សូមបញ្ចូលលេខការទិញ។";
    if (!purchaseForm.supplierId) nextErrors.supplierId = "សូមជ្រើសអ្នកផ្គត់ផ្គង់។";
    if (!purchaseForm.purchaseDate) nextErrors.purchaseDate = "សូមជ្រើសកាលបរិច្ឆេទទិញ។";
    if (requiresPaymentInfo && (!purchaseForm.exchangeRateUsed || Number(purchaseForm.exchangeRateUsed) <= 0)) nextErrors.exchangeRateUsed = "អត្រាប្ដូររូបិយប័ណ្ណត្រូវតែធំជាង 0។";
    if (!purchaseForm.paymentMode) nextErrors.paymentMode = "សូមជ្រើសរបៀបទូទាត់។";
    if (requiresPaymentInfo && !purchaseForm.paymentStatus) nextErrors.paymentStatus = "សូមជ្រើសស្ថានភាពទូទាត់។";
    if (!purchaseForm.deliveryOption) nextErrors.deliveryOption = "សូមជ្រើសជម្រើសដឹក។";
    if (Number(purchaseForm.discountTotal || 0) < 0) nextErrors.discountTotal = "ចំនួនបញ្ចុះតម្លៃមិនអាចតិចជាង 0។";
    if (Number(purchaseForm.deliveryFee || 0) < 0) nextErrors.deliveryFee = "ថ្លៃដឹកមិនអាចតិចជាង 0។";
    if (requiresPaymentInfo && Number(purchaseForm.paidAmount || 0) < 0) nextErrors.paidAmount = purchaseForm.paymentMode === "partial_prepaid" ? "ចំនួនបង់មុនមិនអាចតិចជាង 0។" : "ចំនួនបានបង់មិនអាចតិចជាង 0។";
    if (purchaseItems.length === 0) nextErrors.items = "សូមបន្ថែមទំនិញយ៉ាងហោចណាស់មួយ។";

    const totals = calculateCurrencyPreview({
      items: purchaseItems,
      form: purchaseForm,
    });
    const discountCurrency = String(purchaseForm.discountCurrency || purchaseItems[0]?.inputCurrency || purchaseForm.inputCurrency || "USD").toUpperCase();
    const discountMax = discountCurrency === "KHR" ? totals.subtotalKhr : totals.subtotalUsd;
    if ((purchaseForm.discountType || "amount") === "percent" && Number(purchaseForm.discountPercent || 0) > 100) {
      nextErrors.discountPercent = "ភាគរយបញ្ចុះមិនអាចលើស 100%។";
    }
    if ((purchaseForm.discountType || "amount") === "amount" && Number(purchaseForm.discountTotal || 0) > discountMax) {
      nextErrors.discountTotal = "ចំនួនបញ្ចុះមិនអាចលើសតម្លៃមុនបញ្ចុះ។";
    }
    // Same shape as the discount check above — a delivery fee larger than the goods themselves
    // (e.g. $10,000 delivery on a $160 order) is always a typo, not a real charge.
    const deliveryFeeCurrency = String(purchaseForm.deliveryFeeCurrency || discountCurrency || "USD").toUpperCase();
    const deliveryFeeMax = deliveryFeeCurrency === "KHR" ? totals.subtotalKhr : totals.subtotalUsd;
    if (Number(purchaseForm.deliveryFee || 0) > deliveryFeeMax) {
      nextErrors.deliveryFee = "ថ្លៃដឹកមិនអាចលើសតម្លៃទំនិញ។";
    }
    // Defense-in-depth alongside PurchaseFormModal's live checkbox-disabling (same pattern as
    // discount/delivery fee above) — catches a stale supplierCreditBalance at typing time.
    if (Number(purchaseForm.creditApplied || 0) > getCreditAppliedMaxUsd()) {
      nextErrors.creditApplied = "ចំនួនកាត់លុយលើកក្រោយ ដែលប្រើ លើសពីកាត់លុយលើកក្រោយ ដែលមាន ឬចំនួននៅសល់ត្រូវបង់នៃការទិញនេះ។";
    }
    const paidAmount = Number(purchaseForm.paidAmount || 0);
    const paidOverTotal =
      totals.paidAmountUsd > totals.grandTotalUsd + 0.0001 ||
      totals.paidAmountKhr > totals.grandTotalKhr + 1;
    const paidCoversTotal =
      totals.grandTotalUsd > 0 &&
      (totals.paidAmountUsd >= totals.grandTotalUsd - 0.0001 ||
        totals.paidAmountKhr >= totals.grandTotalKhr - 1);

    if (requiresPaymentInfo && purchaseForm.paymentStatus !== "paid" && paidOverTotal) {
      nextErrors.paidAmount = purchaseForm.paymentMode === "partial_prepaid" ? "ចំនួនបង់មុនមិនអាចលើសតម្លៃសរុប។" : "ចំនួនបានបង់មិនអាចលើសតម្លៃសរុប។";
    }

    if (purchaseForm.paymentMode === "partial_prepaid" && purchaseForm.paymentStatus === "partial") {
      if (paidAmount <= 0) {
        nextErrors.paidAmount = "សូមបញ្ចូលចំនួនបង់មុន។";
      } else if (!paidOverTotal && paidCoversTotal) {
        nextErrors.paidAmount = "បើបង់គ្រប់តម្លៃសរុប សូមជ្រើសបង់ប្រាក់ជាមុន។";
      }
    }

    setPurchaseErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPurchasePayload = (statusOverride = null) => {
    const supplier = suppliers.find((item) => String(item.id) === String(purchaseForm.supplierId));
    const subtotal = calculateSubtotal(purchaseItems);
    const grandTotal = calculateGrandTotal(purchaseItems, purchaseForm);
    const totals = calculateCurrencyPreview({
      items: purchaseItems,
      form: purchaseForm,
    });
    const paidAmount =
      purchaseForm.paymentMode === "pay_after_check"
        ? 0
        : purchaseForm.paymentStatus === "paid"
          ? grandTotal
          : Number(purchaseForm.paidAmount || 0);
    const balanceAmount = totals.balanceUsd;
    const totalClaimQty = purchaseItems.reduce((total, item) => total + Number(item.claimQty || 0), 0);

    let nextStatus = statusOverride || purchaseForm.status;
    if (nextStatus !== STATUS.DRAFT && nextStatus !== STATUS.CANCELLED) {
      if (purchaseForm.paymentMode === "prepaid" || purchaseForm.paymentMode === "partial_prepaid") {
        const hasReceived = purchaseItems.some((item) => Number(item.receivedQty || 0) > 0);
        if (!hasReceived) nextStatus = STATUS.PENDING_RECEIVE;
        else if (totalClaimQty > 0) nextStatus = STATUS.PENDING_CLAIM;
        else nextStatus = STATUS.PENDING_STOCK_IN;
      }

      if (purchaseForm.paymentMode === "pay_after_check") nextStatus = STATUS.PENDING_STOCK_IN;
    }

    const now = new Date().toISOString().slice(0, 10);
    const purchaseCurrency = purchaseItems[0]?.inputCurrency || purchaseForm.paidCurrency || purchaseForm.inputCurrency || "USD";
    const usesDeliveryFee = Boolean(purchaseForm.deliveryOption) && purchaseForm.deliveryOption !== "none" && purchaseForm.deliveryOption !== "self_pickup";

    return {
      id: selectedPurchase?.id || Date.now(),
      purchaseNo: purchaseForm.purchaseNo.trim(),
      supplierId: supplier?.id || "",
      supplierName: supplier?.name || "",
      createdBy: "Admin",
      purchaseDate: purchaseForm.purchaseDate,
      inputCurrency: purchaseCurrency,
      exchangeRateUsed: Number(purchaseForm.exchangeRateUsed || activeExchangeRate || 0),
      paymentMode: purchaseForm.paymentMode,
      paymentStatus: purchaseForm.paymentStatus,
      subtotal,
      discountTotal: Number(purchaseForm.discountTotal || 0),
      deliveryOption: purchaseForm.deliveryOption,
      deliveryFee: usesDeliveryFee ? Number(purchaseForm.deliveryFee || 0) : 0,
      deliveryFeeCurrency: usesDeliveryFee ? purchaseForm.deliveryFeeCurrency : "KHR",
      deliveryPaidBy: purchaseForm.deliveryPaidBy,
      grandTotal,
      paidAmount,
      balanceAmount,
      note: purchaseForm.note.trim(),
      status: nextStatus,
      createdAt: selectedPurchase?.createdAt || now,
      updatedAt: now,
      items: purchaseItems,
    };
  };

  const buildBackendPurchaseItemPayload = (item, options = {}) => {
    const inputCurrency = item.inputCurrency || "USD";
    const inputUnitCost = Number(item.inputUnitCost ?? item.unitCost ?? item.unitCostUsd ?? 0);
    const exchangeRate = Number(options.exchangeRate ?? purchaseForm.exchangeRateUsed ?? activeExchangeRate ?? 0);
    const paymentMode = options.paymentMode || purchaseForm.paymentMode;
    const expiredDate = formatDateOnly(item.expiredDate);
    const converted = convertCost({
      inputCurrency,
      inputUnitCost,
      exchangeRate,
    });
    const unitCostUsd = Number(item.unitCostUsd ?? item.unitCost ?? converted.unitCostUsd ?? 0);
    const unitCostKhr = Number(item.unitCostKhr ?? converted.unitCostKhr ?? 0);
    // Same "before anything's been checked, fall back to invoiced qty" rule as
    // calculateLineTotalsByPaymentMode below (mirrors the backend's resolvePayableQty) — this
    // local payableQty is only ever used as a last-resort fallback when lineTotals somehow comes
    // back nullish, but keep it consistent so it isn't a second, differently-wrong source of $0.
    const hasCheckedQtyForFallback = Number(item.receivedQty || 0) > 0 || Number(item.acceptedQty || 0) > 0 || Number(item.damagedQty || 0) > 0;
    const payableQty =
      paymentMode === "pay_after_check"
        ? (hasCheckedQtyForFallback ? Number(item.acceptedQty || 0) : Number(item.invoicedQty || 0))
        : Number(item.paidQty ?? item.invoicedQty ?? 0);
    const lineTotals = calculateLineTotalsByPaymentMode({
      paymentMode,
      inputCurrency,
      inputUnitCost,
      invoiceTotal: item.invoiceTotal,
      paidAmount: item.paidAmount,
      invoicedQty: item.invoicedQty,
      acceptedQty: item.acceptedQty,
      receivedQty: item.receivedQty,
      damagedQty: item.damagedQty,
      paidQty: item.paidQty ?? item.invoicedQty,
      exchangeRate,
    });

    return {
      id: item.id,
      product_variant_unit_id: item.variantUnitId,
      invoiced_qty: Number(item.invoicedQty || 0),
      paid_qty: Number(item.paidQty || 0),
      received_qty: Number(item.receivedQty || 0),
      accepted_qty: Number(item.acceptedQty || 0),
      stocked_in_qty: Number(item.stockedInQty || 0),
      damaged_qty: Number(item.damagedQty || 0),
      claim_qty: Number(item.claimQty || 0),
      input_currency: currencyToApi(inputCurrency),
      input_unit_cost: inputUnitCost,
      unit_cost_usd: unitCostUsd,
      unit_cost_khr: unitCostKhr,
      line_total_usd: Number(lineTotals.lineTotalUsd ?? item.lineTotalUsd ?? item.lineTotal ?? payableQty * unitCostUsd),
      line_total_khr: Number(lineTotals.lineTotalKhr ?? item.lineTotalKhr ?? payableQty * unitCostKhr),
      expired_date: expiredDate === "-" ? null : expiredDate,
      expiry_date: expiredDate === "-" ? null : expiredDate,
    };
  };

  const buildBackendPurchasePayload = (statusOverride = null) => {
    const localPayload = buildPurchasePayload(statusOverride);
    const previewForm = {
      ...purchaseForm,
      deliveryFee: localPayload.deliveryFee,
      deliveryFeeCurrency: localPayload.deliveryFeeCurrency,
    };
    const totals = calculateCurrencyPreview({
      items: purchaseItems,
      form: previewForm,
    });
    const exchangeRateForApi = Number(purchaseForm.exchangeRateUsed || activeExchangeRate || 0);
    const purchaseCurrency = purchaseItems[0]?.inputCurrency || purchaseForm.paidCurrency || purchaseForm.inputCurrency || "USD";

    return {
      purchase_no: modalMode === "add" ? null : localPayload.purchaseNo,
      supplier_id: localPayload.supplierId,
      purchase_date: localPayload.purchaseDate,
      input_currency: currencyToApi(purchaseCurrency),
      exchange_rate_used: exchangeRateForApi > 0 ? exchangeRateForApi : null,
      khr_rounding: purchaseForm.khrRounding || "floor",
      exchange_rate_source: purchaseForm.exchangeRateSource || "manual",
      exchange_rate_note: purchaseForm.exchangeRateNote || null,
      payment_mode: localPayload.paymentMode,
      payment_status: localPayload.paymentStatus,
      status: statusToApi(localPayload.status),
      subtotal_usd: Number(totals.subtotalUsd || 0),
      subtotal_khr: Number(totals.subtotalKhr || 0),
      discount_currency: currencyToApi(totals.discountInputCurrency || purchaseForm.discountCurrency || "USD"),
      discount_amount_input: Number(totals.discountInputAmount ?? purchaseForm.discountTotal ?? 0),
      discount_total_usd: Number(totals.discountUsd || 0),
      discount_total_khr: Number(totals.discountKhr || 0),
      delivery_option: normalizeDeliveryOption(localPayload.deliveryOption),
      delivery_fee_currency: currencyToApi(localPayload.deliveryFeeCurrency || "KHR"),
      delivery_fee_input: Number(localPayload.deliveryFee || 0),
      delivery_fee_usd: Number(totals.deliveryUsd || 0),
      delivery_fee_khr: Number(totals.deliveryKhr || 0),
      delivery_paid_by: normalizeDeliveryPaidBy(localPayload.deliveryPaidBy),
      grand_total_usd: Number(totals.grandTotalUsd || 0),
      grand_total_khr: Number(totals.grandTotalKhr || 0),
      paid_currency: currencyToApi(purchaseForm.paidCurrency || "USD"),
      // pay_after_check never has money paid upfront — "paid" only becomes meaningful once goods
      // are checked and a payment is separately recorded, so this must never send the full grand
      // total as paid regardless of what purchaseForm.paymentStatus happens to hold (that field's
      // own UI control is hidden entirely during pay_after_check, per PurchaseFormModal.jsx, so it
      // can carry a stale "paid" value from before the payment mode was set/switched). Matches the
      // same guard buildPurchasePayload (the local/demo-mode twin of this function) already has.
      // "paid in full" subtracts creditAppliedUsd/Khr here too — otherwise this would send the
      // full grand total as cash paid even when part of it was actually covered by supplier
      // credit (applied separately, right after this purchase is created), overstating how much
      // cash actually changed hands. Mirrors the same fix in calculateCurrencyPreview.
      paid_amount_input: Number(
        purchaseForm.paymentMode === "pay_after_check"
          ? purchaseForm.paidAmount || 0
          : purchaseForm.paymentStatus === "paid"
            ? purchaseForm.paidCurrency === "KHR"
              ? Math.max(0, totals.grandTotalKhr - (totals.creditAppliedKhr || 0))
              : Math.max(0, totals.grandTotalUsd - (totals.creditAppliedUsd || 0))
            : purchaseForm.paidAmount || 0
      ),
      paid_amount_usd: Number(totals.paidAmountUsd || 0),
      paid_amount_khr: Number(totals.paidAmountKhr || 0),
      balance_amount_usd: Number(totals.balanceUsd || 0),
      balance_amount_khr: Number(totals.balanceKhr || 0),
      note: localPayload.note,
      items: purchaseItems.map(buildBackendPurchaseItemPayload),
    };
  };

  const buildBackendPurchasePayloadFromDetail = (purchase, items) => {
    const normalizedItems = items.map((item) => {
      const unitCost = convertCost({
        inputCurrency: item.inputCurrency || "USD",
        inputUnitCost: Number(item.inputUnitCost ?? item.unitCost ?? item.unitCostUsd ?? 0),
        exchangeRate: Number(purchase.exchangeRateUsed || activeExchangeRate || 0),
      });
      const unitCostUsd = Number(item.unitCostUsd ?? item.unitCost ?? unitCost.unitCostUsd ?? 0);
      const unitCostKhr = Number(item.unitCostKhr ?? unitCost.unitCostKhr ?? 0);
      const payableQty =
        purchase.paymentMode === "pay_after_check"
          ? Number(item.acceptedQty || 0)
          : Number(item.paidQty ?? item.invoicedQty ?? 0);
      const lineTotals = calculateLineTotalsByPaymentMode({
        paymentMode: purchase.paymentMode,
        inputCurrency: item.inputCurrency || "USD",
        inputUnitCost: Number(item.inputUnitCost ?? item.unitCost ?? item.unitCostUsd ?? 0),
        invoiceTotal: item.invoiceTotal,
        paidAmount: item.paidAmount,
        invoicedQty: item.invoicedQty,
        acceptedQty: item.acceptedQty,
        paidQty: item.paidQty ?? item.invoicedQty,
        exchangeRate: Number(purchase.exchangeRateUsed || activeExchangeRate || 0),
      });

      return {
        ...item,
        unitCost: unitCostUsd,
        unitCostUsd,
        unitCostKhr,
        lineTotal: lineTotals.lineTotalUsd || payableQty * unitCostUsd,
        lineTotalUsd: lineTotals.lineTotalUsd || payableQty * unitCostUsd,
        lineTotalKhr: lineTotals.lineTotalKhr || payableQty * unitCostKhr,
      };
    });

    const form = {
      ...purchase,
      exchangeRateUsed: Number(purchase.exchangeRateUsed || activeExchangeRate || 0),
      discountCurrency: purchase.discountCurrency || "USD",
      discountTotal: purchase.discountTotal ?? 0,
      deliveryFeeCurrency: purchase.deliveryFeeCurrency || "USD",
      deliveryFee: purchase.deliveryFee ?? 0,
      paidCurrency: purchase.paidCurrency || "USD",
      paidAmount: purchase.paymentStatus === "paid" ? purchase.paidAmount : purchase.paidAmount ?? 0,
    };
    const totals = calculateCurrencyPreview({ items: normalizedItems, form });

    return {
      purchase_no: purchase.purchaseNo,
      supplier_id: purchase.supplierId,
      purchase_date: formatDateOnly(purchase.purchaseDate),
      input_currency: currencyToApi(purchase.inputCurrency || "USD"),
      exchange_rate_used: Number(purchase.exchangeRateUsed || activeExchangeRate || 0),
      khr_rounding: purchase.khrRounding || "floor",
      exchange_rate_source: purchase.exchangeRateSource || "manual",
      exchange_rate_note: purchase.exchangeRateNote || null,
      payment_mode: purchase.paymentMode,
      payment_status: purchase.paymentStatus,
      status: statusToApi(STATUS.PENDING_STOCK_IN),
      subtotal_usd: Number(totals.subtotalUsd || 0),
      subtotal_khr: Number(totals.subtotalKhr || 0),
      discount_currency: currencyToApi(purchase.discountCurrency || "USD"),
      discount_amount_input: Number(purchase.discountTotal || 0),
      discount_total_usd: Number(totals.discountUsd || 0),
      discount_total_khr: Number(totals.discountKhr || 0),
      delivery_option: normalizeDeliveryOption(purchase.deliveryOption || "none"),
      delivery_fee_currency: currencyToApi(purchase.deliveryFeeCurrency || "USD"),
      delivery_fee_input: Number(purchase.deliveryFee || 0),
      delivery_fee_usd: Number(totals.deliveryUsd || 0),
      delivery_fee_khr: Number(totals.deliveryKhr || 0),
      delivery_paid_by: normalizeDeliveryPaidBy(purchase.deliveryPaidBy || "buyer"),
      grand_total_usd: Number(totals.grandTotalUsd || 0),
      grand_total_khr: Number(totals.grandTotalKhr || 0),
      paid_currency: currencyToApi(purchase.paidCurrency || "USD"),
      paid_amount_input: Number(purchase.paidAmount || 0),
      paid_amount_usd: Number(totals.paidAmountUsd || 0),
      paid_amount_khr: Number(totals.paidAmountKhr || 0),
      balance_amount_usd: Number(totals.balanceUsd || 0),
      balance_amount_khr: Number(totals.balanceKhr || 0),
      note: purchase.note || "",
      items: normalizedItems.map((item) =>
        buildBackendPurchaseItemPayload(item, {
          exchangeRate: Number(purchase.exchangeRateUsed || activeExchangeRate || 0),
          paymentMode: purchase.paymentMode,
        })
      ),
    };
  };

  const handleSavePurchase = (statusOverride = null) => {
    if (!validatePurchaseForm()) return;

    const payload = buildPurchasePayload(statusOverride);
    const backendPayload = buildBackendPurchasePayload(statusOverride);

    if (modalMode === "add") {
      if (purchasesQuery.data) {
        // Captured now (this render's closure) rather than read inside onSuccess later —
        // the mutation-level onSuccess/closeModal may run against a purchaseForm that's
        // already been reset by the time this async call actually resolves.
        // Captured now (this render's closure), same reasoning as the comment above — the
        // backend independently re-sums each selected row's OWN remaining_usd/khr from the
        // ledger when applying, so this list of ids is the actual source of truth, not an
        // amount computed here.
        const selectedCreditIds = Array.isArray(purchaseForm.selectedCreditIds) ? purchaseForm.selectedCreditIds : [];

        createPurchaseMutation.mutate(backendPayload, {
          onSuccess: (result) => {
            const createdPurchaseId = result?.data?.id;
            if (!createdPurchaseId || selectedCreditIds.length === 0) return;

            applyPurchaseCreditApi({
              id: createdPurchaseId,
              payload: { credit_ids: selectedCreditIds },
            })
              .then(() => {
                invalidatePurchaseQueries();
                queryClient.invalidateQueries({ queryKey: ["supplier-credit-balance"] });
              })
              .catch((error) => {
                notify.error(
                  "ការទិញបានបង្កើតរួច ប៉ុន្តែអនុវត្តកាត់លុយលើកក្រោយ បរាជ័យ",
                  getErrorMessage(error)
                );
              });
          },
        });
        return;
      }

      setLocalPurchases((previous) => [payload, ...previous]);
      notify.success("បានបង្កើតការទិញ", "វិក្កយបត្រការទិញបានរក្សាទុករួចហើយ។");
      closeModal();
      return;
    }

    if ((modalMode === "edit" || modalMode === "receive_goods") && selectedPurchase) {
      if (purchasesQuery.data && !String(selectedPurchase.id).startsWith("local-")) {
        updatePurchaseMutation.mutate({
          id: selectedPurchase.id,
          payload: backendPayload,
        });
        return;
      }

      setLocalPurchases((previous) => previous.map((item) => (item.id === selectedPurchase.id ? payload : item)));
      notify.success("បានធ្វើបច្ចុប្បន្នភាពការទិញ", "វិក្កយបត្រការទិញបានធ្វើបច្ចុប្បន្នភាពរួចហើយ។");
      closeModal();
    }
  };

  const handleConfirmStockIn = (purchase) => {
    const effectiveStatus = getEffectivePurchaseStatus(purchase);
    const purchaseLines = getPurchaseLines(purchase);
    const hasRemainingStock = hasRemainingStockInQty(purchase);
    const hasReplacementStockIn = hasPendingReplacementStockIn(purchase);
    const hasStockedIn = hasAnyStockedInQty(purchase);
    const canOpenInventory =
      hasReplacementStockIn ||
      (effectiveStatus === STATUS.PENDING_STOCK_IN && (hasRemainingStock || hasReplacementStockIn || purchaseLines.length === 0)) ||
      (effectiveStatus === STATUS.PENDING_CLAIM && hasRemainingStock && !hasStockedIn);

    if (!canOpenInventory) return;

    // IMPORTANT UX / DATA-SAFETY RULE:
    // Purchases prepares a purchase for stock-in only.
    // The actual inventory update must happen one time in the ស្តុក module.
    // This prevents double stock-in when the user also confirms from ស្តុក.
    navigate(`/home/inventory?stockInPurchaseId=${purchase.id}&purchaseNo=${encodeURIComponent(purchase.purchaseNo)}`);
  };

  const getReturnItemReplacementQty = (item) =>
    Number(item.replacement_qty ?? item.replacementQty ?? item.qty_returned ?? item.qtyReturned ?? item.qty ?? 0);

  const getReturnItemBaseQty = (item) =>
    Number(item.base_qty_returned ?? item.baseQtyReturned ?? item.base_qty ?? item.baseQty ?? 0);

  const getReturnItems = (purchaseReturn) =>
    Array.isArray(purchaseReturn?.items)
      ? purchaseReturn.items
      : Array.isArray(purchaseReturn?.purchase_return_items)
        ? purchaseReturn.purchase_return_items
        : [];

  const getReturnItemPurchaseItemId = (item) =>
    item.purchase_item_id || item.purchaseItemId || item.purchaseItem?.id || item.purchase_item?.id || "";

  const isPurchaseAlreadyStocked = (purchase) =>
    purchase?.status === STATUS.RECEIVED || (purchase?.items || []).some((item) => Number(item.stockedInQty || 0) > 0);

  const buildReplacementItemFromPurchaseItem = (purchaseItem, qty, returnItem = null, claimedQtyForLine = null) => {
    const replacementQty = Number(qty || purchaseItem.claimQty || purchaseItem.damagedQty || 0);
    const originalExpiry = formatDateOnly(purchaseItem.expiredDate);
    // Total originally claimed/damaged for this line vs. how much of that has already been
    // received in an earlier partial receipt — kept as separate fields so the modal can show
    // "ខូច 2 / ទទួលរួច 1 / នៅសល់ 1" instead of only the remaining number.
    const claimedQty = Number(claimedQtyForLine ?? replacementQty);
    const receivedSoFarQty = Math.max(0, claimedQty - replacementQty);

    return {
      purchaseItemId: purchaseItem.id,
      returnItemId: returnItem?.id,
      variantUnitId: purchaseItem.variantUnitId,
      variantName: purchaseItem.variantName,
      variantCode: purchaseItem.variantCode,
      unitName: purchaseItem.unitName,
      baseUnit: purchaseItem.baseUnit,
      conversionQty: Number(purchaseItem.conversionQty || 1),
      qty: replacementQty,
      claimedQty,
      receivedSoFarQty,
      // Ceiling for the editable "received this time" qty below — how much of this line is
      // still outstanding (claimed minus whatever was already received in an earlier partial
      // receipt). Supplier can send replacements in batches (e.g. out of stock, ships the rest
      // later), so this must not always default to the full original claim.
      maxQty: replacementQty,
      baseQty: getReturnItemBaseQty(returnItem || {}) || replacementQty * Number(purchaseItem.conversionQty || 1),
      originalExpiry,
      expiryDate: originalExpiry === "-" ? "" : originalExpiry,
      unitCostUsd: Number(returnItem?.unit_cost_usd ?? returnItem?.unitCostUsd ?? purchaseItem.unitCostUsd ?? purchaseItem.unitCost ?? 0),
      unitCostKhr: Number(returnItem?.unit_cost_khr ?? returnItem?.unitCostKhr ?? purchaseItem.unitCostKhr ?? 0),
      lineTotalUsd: Number(
        returnItem?.line_total_usd ??
          returnItem?.lineTotalUsd ??
          replacementQty * Number(purchaseItem.unitCostUsd ?? purchaseItem.unitCost ?? 0)
      ),
      lineTotalKhr: Number(returnItem?.line_total_khr ?? returnItem?.lineTotalKhr ?? replacementQty * Number(purchaseItem.unitCostKhr ?? 0)),
      lotNo: returnItem?.lot_no || returnItem?.lotNo || "",
    };
  };

  const closeReplacementModal = () => {
    setReplacementModalOpen(false);
    setReplacementPurchase(null);
    setReplacementReturn(null);
    setReplacementItems([]);
    setReplacementErrors({});
  };

  const buildReplacementItems = (purchase, purchaseReturn) => {
    // Only this return's REPLACEMENT-type items — a claim can now mix resolution types, so a
    // refund/credit_note line in the same return must never be offered here.
    const returnItems = getReturnItems(purchaseReturn).filter(
      (returnItem) => normalizeReturnResolutionType(returnItem.resolutionType || returnItem.resolution_type) === "replacement"
    );
    const claimItems = (purchase.items || []).filter((item) => Number(item.claimQty || 0) > 0);

    if (returnItems.length === 0) {
      // Legacy fallback for old data with no per-item resolution recorded at all.
      const fallbackQty = Number(
        purchaseReturn?.replacement_qty ??
          purchaseReturn?.replacementQty ??
          claimItems.reduce((total, item) => total + Number(item.claimQty || 0), 0)
      );
      const receivedQty = Number(purchaseReturn?.replacementReceivedQty ?? purchaseReturn?.replacement_received_qty ?? 0);
      const remainingQty = Math.max(0, fallbackQty - receivedQty);
      const purchaseItem = claimItems[0];
      if (!purchaseItem || remainingQty <= 0) return [];
      return [buildReplacementItemFromPurchaseItem(purchaseItem, remainingQty, null, fallbackQty)];
    }

    // Each return item now tracks its own replacement_received_qty directly (no more implicit
    // sequential-allocation-by-item-order guessing needed) — read it straight off the item.
    return returnItems
      .map((returnItem) => {
        const purchaseItemId = getReturnItemPurchaseItemId(returnItem);
        const purchaseItem =
          (purchase.items || []).find((item) => String(item.id) === String(purchaseItemId)) ||
          (claimItems.length === 1 ? claimItems[0] : null);
        if (!purchaseItem) return null;

        const claimQtyForLine = getReturnItemReplacementQty(returnItem) || Number(purchaseItem.claimQty || 0);
        const receivedQty = Number(returnItem.replacementReceivedQty ?? returnItem.replacement_received_qty ?? 0);
        const remainingQty = Math.max(0, claimQtyForLine - receivedQty);
        if (remainingQty <= 0) return null;
        return buildReplacementItemFromPurchaseItem(purchaseItem, remainingQty, returnItem, claimQtyForLine);
      })
      .filter(Boolean)
      .filter((item) => Number(item.qty || 0) > 0);
  };

  const handleReceiveReplacement = async (purchase, purchaseReturn = null) => {
    const detail = await loadPurchaseDetail(purchase);
    // Prefer the freshly-loaded copy of this same return (by id) over whatever reference was
    // passed in — a stale `purchaseReturn` (e.g. from a list row rendered before the last
    // partial receipt) would carry an outdated replacementReceivedQty and make
    // buildReplacementItems re-offer already-received quantity.
    const freshReturn = purchaseReturn
      ? (detail.returns || []).find((item) => String(item.id) === String(purchaseReturn.id))
      : null;
    const activeReturn = freshReturn || purchaseReturn || getOpenReplacementClaim(detail) || getOpenReplacementClaim(purchase);
    if (!activeReturn) return;

    const items = buildReplacementItems(detail, activeReturn);
    if (items.length === 0) {
      notify.error("បរាជ័យក្នុងការទទួលជំនួស", "គ្មានទំនិញជំនួសសម្រាប់ការទាមទារ អ្នកផ្គត់ផ្គង់ នេះ។");
      return;
    }

    setReplacementPurchase(detail);
    setReplacementReturn(activeReturn);
    setReplacementItems(items);
    setReplacementErrors({});
    setReplacementModalOpen(true);
  };

  const handleReplacementItemChange = (index, field, value) => {
    setReplacementItems((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
    setReplacementErrors((previous) => ({
      ...previous,
      items: {
        ...(previous.items || {}),
        [index]: {
          ...(previous.items?.[index] || {}),
          [field]: "",
        },
      },
    }));
  };

  const validateReplacementItems = () => {
    const itemErrors = {};
    replacementItems.forEach((item, index) => {
      if (!item.expiryDate) {
        itemErrors[index] = { expiryDate: "ថ្ងៃផុតកំណត់ជំនួសត្រូវបំពេញ។" };
      }
      if (Number(item.qty || 0) <= 0) {
        itemErrors[index] = { ...(itemErrors[index] || {}), qty: "ចំនួនជំនួសត្រូវតែធំជាង 0។" };
      } else if (Number(item.qty) > Number(item.maxQty ?? item.qty)) {
        itemErrors[index] = { ...(itemErrors[index] || {}), qty: `ចំនួនទទួលមិនអាចលើសចំនួននៅសល់ (${item.maxQty})។` };
      }
    });

    const nextErrors = Object.keys(itemErrors).length > 0 ? { items: itemErrors } : {};
    setReplacementErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildItemsAfterReplacement = (purchase, receivedItems) => {
    const nextItems = (purchase.items || []).map((item) => ({ ...item }));

    receivedItems.forEach((receivedItem) => {
      const index = nextItems.findIndex((item) => String(item.id) === String(receivedItem.purchaseItemId));
      if (index < 0) return;

      const current = nextItems[index];
      const qty = Number(receivedItem.qty || 0);
      const sameExpiry = formatDateOnly(current.expiredDate) === formatDateOnly(receivedItem.expiryDate);

      if (sameExpiry) {
        nextItems[index] = {
          ...current,
          acceptedQty: Number(current.acceptedQty || 0) + qty,
          damagedQty: Math.max(0, Number(current.damagedQty || 0) - qty),
          claimQty: Math.max(0, Number(current.claimQty || 0) - qty),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        return;
      }

      nextItems[index] = {
        ...current,
        invoicedQty: Math.max(Number(current.acceptedQty || 0), Number(current.invoicedQty || 0) - qty),
        paidQty: Math.max(0, Number(current.paidQty || 0) - qty),
        receivedQty: Math.max(Number(current.acceptedQty || 0), Number(current.receivedQty || 0) - qty),
        damagedQty: Math.max(0, Number(current.damagedQty || 0) - qty),
        claimQty: Math.max(0, Number(current.claimQty || 0) - qty),
        updatedAt: new Date().toISOString().slice(0, 10),
      };

      nextItems.push({
        ...current,
        id: undefined,
        invoicedQty: qty,
        paidQty: qty,
        receivedQty: qty,
        acceptedQty: qty,
        stockedInQty: 0,
        damagedQty: 0,
        claimQty: 0,
        expiredDate: receivedItem.expiryDate,
        lineTotal: qty * Number(current.unitCostUsd ?? current.unitCost ?? 0),
        lineTotalUsd: qty * Number(current.unitCostUsd ?? current.unitCost ?? 0),
        lineTotalKhr: qty * Number(current.unitCostKhr || 0),
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
      });
    });

    return nextItems;
  };

  const buildReplacementReturnPayload = ({ purchase, purchaseReturn, items, stockInReplacement }) => {
    const now = new Date().toISOString().slice(0, 10);
    const replacementQty = items.reduce((total, item) => total + Number(item.qty || 0), 0);
    const replacementReceivedQty = replacementQty;

    return {
      purchase_id: purchaseReturn.purchaseId || purchaseReturn.purchase_id || purchase.id,
      supplier_id: purchaseReturn.supplierId || purchaseReturn.supplier_id || purchase.supplierId,
      purchase_return_no: purchaseReturn.purchaseReturnNo || purchaseReturn.purchase_return_no,
      return_date: purchaseReturn.returnDate || purchaseReturn.return_date || now,
      return_type: purchaseReturn.returnType || purchaseReturn.return_type || "partial_return",
      return_reason: purchaseReturn.returnReason || purchaseReturn.return_reason || "damaged",
      resolution_type: "replacement",
      resolution_status: "resolved",
      input_currency: currencyToApi(purchase.inputCurrency || "USD"),
      exchange_rate_used: Number(purchase.exchangeRateUsed || purchaseReturn.exchange_rate_used || 0),
      khr_rounding: purchase.khrRounding || purchaseReturn.khr_rounding || "floor",
      subtotal_usd: Number(purchaseReturn.subtotalUsd ?? purchaseReturn.subtotal ?? purchaseReturn.total_amount_usd ?? 0),
      subtotal_khr: Number(purchaseReturn.subtotalKhr ?? purchaseReturn.total_amount_khr ?? 0),
      total_amount_usd: Number(purchaseReturn.subtotalUsd ?? purchaseReturn.subtotal ?? purchaseReturn.total_amount_usd ?? 0),
      total_amount_khr: Number(purchaseReturn.subtotalKhr ?? purchaseReturn.total_amount_khr ?? 0),
      refund_status: "none",
      refund_amount_usd: 0,
      refund_amount_khr: 0,
      replacement_qty: replacementQty,
      replacement_received_qty: replacementReceivedQty,
      defer_replacement_stock_in: true,
      credit_status: "none",
      credit_amount_usd: 0,
      credit_amount_khr: 0,
      note:
        purchaseReturn.note ||
        `ទទួលបានទំនិញជំនួសសម្រាប់ការទាមទារ ${purchaseReturn.purchaseReturnNo || purchaseReturn.purchase_return_no || ""} ពីការទិញ ${purchase.purchaseNo || purchase.purchase_no || ""} ។`,
      resolved_at: now,
      replacement_items: items.map((item) => ({
        purchase_return_item_id: item.returnItemId || null,
        purchase_item_id: item.purchaseItemId,
        lot_no: item.lotNo || null,
        expired_date: formatDateOnly(item.expiryDate) || null,
        // How much of THIS item is being received this pass — the backend now applies this as an
        // explicit per-item increment to replacement_received_qty (PurchaseReturnService::
        // applyReplacementReceipt) instead of inferring it from a return-level aggregate delta.
        // Omitting this meant every "ទទួលជំនួស" save silently recorded 0 received.
        qty: Number(item.qty || 0),
      })),
      items: getReturnItems(purchaseReturn).map((returnItem) => {
        const receivedItem = items.find((item) => String(item.returnItemId || "") === String(returnItem.id || ""));
        const itemReplacementQty = getReturnItemReplacementQty(returnItem);
        return {
          id: returnItem.id,
          purchase_item_id: getReturnItemPurchaseItemId(returnItem),
          product_variant_unit_id: returnItem.product_variant_unit_id || returnItem.productVariantUnitId || receivedItem?.variantUnitId,
          qty: Number(returnItem.qty ?? returnItem.qty_returned ?? returnItem.qtyReturned ?? itemReplacementQty),
          qty_returned: Number(returnItem.qty_returned ?? returnItem.qtyReturned ?? returnItem.qty ?? itemReplacementQty),
          base_qty: Number(returnItem.base_qty ?? returnItem.baseQty ?? returnItem.base_qty_returned ?? returnItem.baseQtyReturned ?? 0),
          base_qty_returned: Number(returnItem.base_qty_returned ?? returnItem.baseQtyReturned ?? returnItem.base_qty ?? returnItem.baseQty ?? 0),
          input_currency: currencyToApi(returnItem.input_currency || returnItem.inputCurrency || purchase.inputCurrency || "USD"),
          input_unit_cost: Number(returnItem.input_unit_cost ?? returnItem.inputUnitCost ?? returnItem.unit_cost_usd ?? receivedItem?.unitCostUsd ?? 0),
          exchange_rate_used: Number(returnItem.exchange_rate_used ?? returnItem.exchangeRateUsed ?? purchase.exchangeRateUsed ?? 0),
          khr_rounding: returnItem.khr_rounding || returnItem.khrRounding || purchase.khrRounding || "floor",
          unit_cost_usd: Number(returnItem.unit_cost_usd ?? returnItem.unitCostUsd ?? receivedItem?.unitCostUsd ?? 0),
          unit_cost_khr: Number(returnItem.unit_cost_khr ?? returnItem.unitCostKhr ?? receivedItem?.unitCostKhr ?? 0),
          line_total_usd: Number(returnItem.line_total_usd ?? returnItem.lineTotalUsd ?? receivedItem?.lineTotalUsd ?? 0),
          line_total_khr: Number(returnItem.line_total_khr ?? returnItem.lineTotalKhr ?? receivedItem?.lineTotalKhr ?? 0),
          replacement_qty: itemReplacementQty,
          replacement_received_qty: Number(receivedItem?.qty || itemReplacementQty),
          refund_amount_usd: 0,
          refund_amount_khr: 0,
          credit_amount_usd: 0,
          credit_amount_khr: 0,
          condition: returnItem.condition || "damaged",
          stock_action: stockInReplacement ? "stock_in" : returnItem.stock_action || returnItem.stockAction || "no_stock_change",
          note: returnItem.note || returnItem.reason || "",
          reason: returnItem.reason || returnItem.note || "",
        };
      }),
    };
  };

  const handleSaveReceiveReplacement = () => {
    if (!replacementPurchase || !replacementReturn || !validateReplacementItems()) return;

    const stockInReplacement = false;
    const returnPayload = buildReplacementReturnPayload({
      purchase: replacementPurchase,
      purchaseReturn: replacementReturn,
      items: replacementItems,
      stockInReplacement,
    });
    const nextItems = buildItemsAfterReplacement(replacementPurchase, replacementItems);
    const purchasePayload = null;

    if (purchasesQuery.data && !String(replacementReturn.id).startsWith("local-")) {
      receiveReplacementMutation.mutate({
        purchaseReturn: replacementReturn,
        payload: returnPayload,
        purchasePayload,
        purchaseId: replacementPurchase.id,
      });
      return;
    }

    setPurchaseReturns((previous) =>
      previous.map((item) =>
        item.id === replacementReturn.id
          ? {
              ...item,
              status: RETURN_STATUS.COMPLETED,
              resolutionStatus: "resolved",
              replacementReceivedQty: stockInReplacement
                ? replacementItems.reduce((total, current) => total + Number(current.qty || 0), 0)
                : 0,
              resolvedAt: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );
    if (!stockInReplacement) {
      setLocalPurchases((previous) =>
        previous.map((item) =>
          item.id === replacementPurchase.id
            ? { ...item, status: STATUS.PENDING_STOCK_IN, items: nextItems, updatedAt: new Date().toISOString().slice(0, 10) }
            : item
        )
      );
    }
    notify.success("បានទទួលជំនួស", "ការជំនួស អ្នកផ្គត់ផ្គង់ បានកត់ទុកថាបានទទួលរួចហើយ។");
    closeReplacementModal();
    closeModal();
  };

  // `item` scopes the modal (and, via handleConfirmMoneyResolution below, the actual resolve
  // action) to exactly that one item — required once a claim can have several independent
  // refund/credit_note items paid at different times. Without an explicit item, falls back to
  // whichever open money item is found first, matching the old whole-claim behavior for legacy
  // callers/data with only one money item anyway.
  const handleResolveSupplierClaim = (purchase, claim, item = null) => {
    if (!claim) return;
    const claimItems = Array.isArray(claim.items) ? claim.items : [];
    const targetItem = item || claimItems.find((candidate) => {
      const type = normalizeReturnResolutionType(candidate.resolutionType || candidate.resolution_type);
      const status = normalizeReturnStatusLabel(candidate.resolutionStatus || candidate.resolution_status);
      return ["refund", "credit_note"].includes(type) && status !== RETURN_STATUS.COMPLETED && status !== RETURN_STATUS.CANCELLED;
    });
    setResolveMoneyPurchase(purchase);
    setResolveMoneyReturn(targetItem ? { ...claim, items: [targetItem] } : claim);
    setResolveMoneyModalOpen(true);
  };

  const handleConfirmMoneyResolution = () => {
    const claim = resolveMoneyReturn;
    const purchase = resolveMoneyPurchase;
    if (!claim) return;

    // A claim's return-level resolutionType reads "mixed" once its items don't all share one
    // type — resolve every one of THIS return's still-open money-type items (refund/credit_note)
    // individually via item_resolutions, instead of assuming the whole return is one money type.
    // For the common (non-mixed) case this still resolves the return's one money item exactly as
    // before.
    const claimItems = Array.isArray(claim.items) ? claim.items : [];
    const openMoneyItems = claimItems.filter((item) => {
      const itemType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
      const itemStatus = normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status);
      return ["refund", "credit_note"].includes(itemType) && itemStatus !== RETURN_STATUS.COMPLETED && itemStatus !== RETURN_STATUS.CANCELLED;
    });
    // Fallback for older data with no per-item resolution recorded: resolve the whole return as
    // its own single resolutionType, matching the pre-mixed-claim behavior exactly.
    const resolutionType = normalizeReturnResolutionType(claim.resolutionType || claim.resolution_type || "");
    const now = new Date().toISOString().slice(0, 10);
    const isRefund = resolutionType === "refund";
    const isCredit = resolutionType === "credit_note";

    const payload = {
      note: claim.note || "",
    };

    if (openMoneyItems.length > 0) {
      payload.item_resolutions = openMoneyItems.map((item) => {
        const itemType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
        return {
          id: item.id,
          resolution_status: "resolved",
          refund_status: itemType === "refund" ? "received" : undefined,
          credit_status: itemType === "credit_note" ? "issued" : undefined,
        };
      });
    } else {
      payload.resolution_type = resolutionType;
      payload.resolution_status = "resolved";
      payload.status = "resolved";
      payload.resolved_at = now;

      if (isRefund) {
        const amount = getClampedClaimAmount(claim, "refund");
        payload.refund_status = "received";
        payload.refund_amount_usd = amount.usd;
        payload.refund_amount_khr = amount.khr;
        payload.refunded_at = now;
      }

      if (isCredit) {
        const amount = getClampedClaimAmount(claim, "credit_note");
        payload.credit_status = "issued";
        payload.credit_amount_usd = amount.usd;
        payload.credit_amount_khr = amount.khr;
      }
    }

    setResolveMoneyModalOpen(false);

    if (purchasesQuery.data && !String(claim.id).startsWith("local-")) {
      resolveSupplierClaimMutation.mutate({ claim, payload });
      return;
    }

    setPurchaseReturns((previous) =>
      previous.map((item) =>
        String(item.id) === String(claim.id)
          ? {
              ...item,
              status: RETURN_STATUS.COMPLETED,
              resolutionStatus: "resolved",
              refundStatus: isRefund ? "received" : item.refundStatus,
              refundAmountUsd: isRefund ? payload.refund_amount_usd : item.refundAmountUsd,
              refundAmountKhr: isRefund ? payload.refund_amount_khr : item.refundAmountKhr,
              refundedAt: isRefund ? now : item.refundedAt,
              creditStatus: isCredit ? "issued" : item.creditStatus,
              creditAmountUsd: isCredit ? payload.credit_amount_usd : item.creditAmountUsd,
              creditAmountKhr: isCredit ? payload.credit_amount_khr : item.creditAmountKhr,
              resolvedAt: now,
            }
          : item
      )
    );
    notify.success("ការទាមទារ អ្នកផ្គត់ផ្គង់ បានដោះស្រាយ", "ការសង ឬ កាត់លុយលើកក្រោយ បានកត់ទុកថាបានបញ្ចប់រួចហើយ។");
    closeModal();
  };

  const handleCancelPurchase = async (purchase) => {
    const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុបចោល ${purchase.purchaseNo}?`);
    if (!ok) return;

    if (purchasesQuery.data && !String(purchase.id).startsWith("local-")) {
      updatePurchaseMutation.mutate({
        id: purchase.id,
        payload: {
          status: statusToApi(STATUS.CANCELLED),
        },
      });
      return;
    }

    setLocalPurchases((previous) =>
      previous.map((item) =>
        item.id === purchase.id ? { ...item, status: STATUS.CANCELLED, updatedAt: new Date().toISOString().slice(0, 10) } : item
      )
    );
  };

  const getSavedReturnQtyForPurchaseItem = (purchaseItem, purchaseContext = selectedPurchase) => {
    const relatedReturns = purchaseContext ? getRelatedPurchaseReturns(purchaseContext) : [];
    return relatedReturns
      .filter((ret) => ![RETURN_STATUS.CANCELLED, RETURN_STATUS.REJECTED].includes(normalizeReturnStatusLabel(ret.status || ret.resolutionStatus || ret.resolution_status)))
      .flatMap((ret) => ret.items || ret.purchase_return_items || [])
      .filter((item) => String(item.purchaseItemId ?? item.purchase_item_id) === String(purchaseItem.id))
      .reduce((total, item) => total + Number(item.qtyReturned ?? item.qty_returned ?? item.qty ?? 0), 0);
  };

  const getAvailableReturnQty = (purchaseItem, { purchaseContext = selectedPurchase, draftItems = purchaseReturnItems } = {}) => {
    const draftReturnedQty = draftItems
      .filter((item) => item.purchaseItemId === purchaseItem.id)
      .reduce((total, item) => total + Number(item.qtyReturned || 0), 0);
    const alreadyReturnedQty = getSavedReturnQtyForPurchaseItem(purchaseItem, purchaseContext) + draftReturnedQty;

    if (Number(purchaseItem.claimQty || 0) > 0) return Math.max(0, Number(purchaseItem.claimQty || 0) - alreadyReturnedQty);
    if (Number(purchaseItem.damagedQty || 0) > 0) return Math.max(0, Number(purchaseItem.damagedQty || 0) - alreadyReturnedQty);
    return Math.max(0, Number(purchaseItem.acceptedQty || 0) - alreadyReturnedQty);
  };

  const getDefaultStockAction = (purchaseItem, condition) => {
    if (condition === "damaged" && (Number(purchaseItem.claimQty || 0) > 0 || Number(purchaseItem.damagedQty || 0) > 0)) {
      return "no_stock_change";
    }
    if (selectedPurchase?.status === STATUS.RECEIVED) return "stock_out";
    return "no_stock_change";
  };

  const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

  // Each item in a claim can carry its own resolutionType (mixed refund/credit_note/replacement
  // in one submission) — settlement is computed per item from that item's own line amount, with a
  // running "how much of the shared partial_prepaid unpaid balance an earlier item already
  // consumed" accumulator threaded across items in list order (mirrors the backend's
  // PurchaseReturnService::calculateMoneySettlement by-ref accumulator, and
  // PurchaseReturnModal.jsx's own copy of this same logic for live preview). Replacement/none
  // items never touch the offset pool.
  const getPerItemSettlements = (purchase = {}, items = []) => {
    const unpaid = getUnpaidItemAmountBeforeClaim(purchase);
    const isPartialPrepaid = (purchase.paymentMode || "").toLowerCase() === "partial_prepaid";
    let offsetUsedUsd = 0;
    let offsetUsedKhr = 0;

    return items.map((item) => {
      const resolutionType = normalizeReturnResolutionType(item.resolutionType);
      const amount = getItemOnlyAmount(item, item.qtyReturned ?? item.qty_returned);
      const isMoneyType = resolutionType === "refund" || resolutionType === "credit_note";

      // credit_note ALWAYS gets the full claim amount and never touches the shared offset pool
      // below — its whole point is to become a portable credit for a DIFFERENT, later purchase,
      // not to offset THIS purchase's own unpaid balance (mirrors
      // PurchaseReturnService::applyItemSettlement, which only ever runs "refund" through
      // calculateMoneySettlement — credit_note's credit_amount is always the full line_total).
      if (!isMoneyType || !isPartialPrepaid || resolutionType === "credit_note") {
        return {
          resolutionType,
          usd: isMoneyType ? roundCurrency(amount.usd) : 0,
          khr: isMoneyType ? Math.round(amount.khr) : 0,
        };
      }

      const remainingUsd = Math.max(unpaid.usd - offsetUsedUsd, 0);
      const remainingKhr = Math.max(unpaid.khr - offsetUsedKhr, 0);
      const offsetUsd = Math.min(amount.usd, remainingUsd);
      const offsetKhr = Math.min(amount.khr, remainingKhr);
      offsetUsedUsd += offsetUsd;
      offsetUsedKhr += offsetKhr;

      return {
        resolutionType,
        usd: roundCurrency(Math.max(0, amount.usd - offsetUsd)),
        khr: Math.round(Math.max(0, amount.khr - offsetKhr)),
      };
    });
  };

  const buildPurchaseReturnItemFromPurchaseItem = (
    purchaseItem,
    {
      purchaseContext = selectedPurchase,
      qtyReturned = 0,
      condition = "damaged",
      reason = "",
      resolutionType = purchaseReturnForm.resolutionType,
      resolutionStatus = "submitted",
    } = {}
  ) => {
    const qty = Number(qtyReturned || 0);
    const itemResolutionType = normalizeReturnResolutionType(resolutionType);
    const baseQtyReturned = qty * Number(purchaseItem.conversionQty || 1);
    const unitCostUsd = Number(purchaseItem.unitCostUsd ?? purchaseItem.unitCost ?? 0);
    const unitCostKhr = Number(purchaseItem.unitCostKhr || 0);
    const lineTotalUsd = qty * unitCostUsd;
    const lineTotalKhr = qty * unitCostKhr;
    const stockAction =
      condition === "damaged" && (Number(purchaseItem.claimQty || 0) > 0 || Number(purchaseItem.damagedQty || 0) > 0)
        ? "no_stock_change"
        : purchaseContext?.status === STATUS.RECEIVED
          ? "stock_out"
          : "no_stock_change";

    return {
      id: Date.now() + Number(purchaseItem.id || 0),
      purchaseReturnId: null,
      purchaseItemId: purchaseItem.id,
      variantUnitId: purchaseItem.variantUnitId,
      productName: purchaseItem.productName,
      variantName: purchaseItem.variantName,
      variantCode: purchaseItem.variantCode,
      unitName: purchaseItem.unitName,
      baseUnit: purchaseItem.baseUnit,
      conversionQty: purchaseItem.conversionQty,
      qtyReturned: qty,
      baseQtyReturned,
      inputCurrency: purchaseItem.inputCurrency || purchaseContext?.inputCurrency || "USD",
      inputUnitCost: purchaseItem.inputUnitCost ?? purchaseItem.unitCostUsd ?? purchaseItem.unitCost ?? 0,
      exchangeRateUsed: purchaseItem.exchangeRateUsed || purchaseContext?.exchangeRateUsed || 0,
      khrRounding: purchaseItem.khrRounding || purchaseContext?.khrRounding || "floor",
      unitCost: purchaseItem.unitCost,
      unitCostUsd,
      unitCostKhr,
      unitCostBase: purchaseItem.unitCostBase,
      lineTotal: lineTotalUsd,
      lineTotalUsd,
      lineTotalKhr,
      resolutionType: itemResolutionType,
      resolutionStatus: resolutionStatus || "submitted",
      replacementQty: itemResolutionType === "replacement" ? qty : 0,
      replacementReceivedQty: 0,
      refundAmountUsd: itemResolutionType === "refund" ? lineTotalUsd : 0,
      refundAmountKhr: itemResolutionType === "refund" ? lineTotalKhr : 0,
      creditAmountUsd: itemResolutionType === "credit_note" ? lineTotalUsd : 0,
      creditAmountKhr: itemResolutionType === "credit_note" ? lineTotalKhr : 0,
      condition,
      stockAction,
      reason: reason || "អ្នកផ្គត់ផ្គង់ claim item.",
    };
  };

  const handlePurchaseReturnFormChange = (field, value) => {
    setPurchaseReturnForm((previous) => {
      const next = { ...previous, [field]: value };
      if (field === "resolutionStatus") {
        const map = {
          submitted: RETURN_STATUS.SUBMITTED,
          approved: RETURN_STATUS.APPROVED,
          rejected: RETURN_STATUS.REJECTED,
          resolved: RETURN_STATUS.COMPLETED,
          cancelled: RETURN_STATUS.CANCELLED,
        };
        next.status = map[value] || RETURN_STATUS.SUBMITTED;
      }
      if (field === "resolutionType") {
        next.resolutionType = normalizeReturnResolutionType(value);
      }
      return next;
    });
    // No longer overwrites every already-added item's resolution/settlement fields here — each
    // item now carries its own independent resolutionType (editable inline in the modal), so this
    // form-level field is only the default applied to the NEXT item added, not a blanket retroactive
    // change to items already in the draft.
    setPurchaseReturnErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const handlePurchaseReturnItemFormChange = (field, value) => {
    setPurchaseReturnItemForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "purchaseItemId") {
        const purchaseItem = selectedPurchase?.items.find((item) => String(item.id) === String(value));
        if (purchaseItem) {
          const hasClaim = Number(purchaseItem.claimQty || 0) > 0;
          const hasDamage = Number(purchaseItem.damagedQty || 0) > 0;
          next.condition = hasClaim || hasDamage ? "damaged" : "wrong_item";
          next.qtyReturned = hasClaim ? purchaseItem.claimQty : hasDamage ? purchaseItem.damagedQty : "";
          next.reason = hasClaim || hasDamage ? "ទំនិញខូចបានទាមទារទៅអ្នកផ្គត់ផ្គង់ ។" : "ទំនិញខុសបានដឹកមក ។";
        }
      }

      if (field === "condition") {
        const reasons = {
          damaged:       "ទំនិញខូចបានទាមទារទៅអ្នកផ្គត់ផ្គង់ ។",
          wrong_item:    "ទំនិញខុសបានដឹកមក ។",
          over_supplied: "អ្នកផ្គត់ផ្គង់ដឹកទំនិញលើសចំនួន ។",
          expired:       "ទំនិញផុតកំណត់ ឬជិតផុតកំណត់ ។",
          other:         "បញ្ហាអ្នកផ្គត់ផ្គង់ផ្សេងទៀត ។",
        };
        next.reason = reasons[value] || next.reason;
      }

      return next;
    });
    setPurchaseReturnItemErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const validatePurchaseReturnItemForm = () => {
    const nextErrors = {};
    const purchaseItem = selectedPurchase?.items.find((item) => String(item.id) === String(purchaseReturnItemForm.purchaseItemId));
    const qtyReturned = Number(purchaseReturnItemForm.qtyReturned || 0);

    if (!purchaseReturnItemForm.purchaseItemId) nextErrors.purchaseItemId = "សូមជ្រើសទំនិញដើម្បីទាមទារ / ត្រឡប់។";
    if (!purchaseItem) nextErrors.purchaseItemId = "ទំនិញការទិញមិនត្រឹមត្រូវ។";
    if (!purchaseReturnItemForm.qtyReturned || qtyReturned <= 0) nextErrors.qtyReturned = "ចំនួនទាមទារ / ត្រឡប់ត្រូវតែធំជាង 0។";

    if (purchaseItem) {
      const availableQty = getAvailableReturnQty(purchaseItem);
      if (qtyReturned > availableQty) nextErrors.qtyReturned = `ចំនួនមិនអាចលើស ${availableQty} ${purchaseItem.unitName}។`;
    }

    if (!purchaseReturnItemForm.condition) nextErrors.condition = "សូមជ្រើសមូលហេតុ។";
    if (!purchaseReturnItemForm.reason.trim()) nextErrors.reason = "ចំណាំមូលហេតុត្រូវបំពេញ។";

    setPurchaseReturnItemErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddPurchaseReturnItem = () => {
    if (!validatePurchaseReturnItemForm()) return;

    const purchaseItem = selectedPurchase.items.find((item) => String(item.id) === String(purchaseReturnItemForm.purchaseItemId));
    if (!purchaseItem) return;

    const item = buildPurchaseReturnItemFromPurchaseItem(purchaseItem, {
      qtyReturned: Number(purchaseReturnItemForm.qtyReturned || 0),
      condition: purchaseReturnItemForm.condition,
      reason: purchaseReturnItemForm.reason.trim(),
      resolutionType: purchaseReturnItemForm.resolutionType,
      resolutionStatus: purchaseReturnItemForm.resolutionStatus,
    });

    setPurchaseReturnItems((previous) => [...previous, item]);
    setPurchaseReturnItemForm(emptyPurchaseReturnItemForm);
    setPurchaseReturnItemErrors({});
    setPurchaseReturnErrors((previous) => ({ ...previous, items: "" }));
  };

  const validatePurchaseReturnForm = () => {
    const nextErrors = {};
    if (!purchaseReturnForm.purchaseReturnNo.trim()) nextErrors.purchaseReturnNo = "លេខការត្រឡប់ត្រូវបំពេញ។";
    if (!purchaseReturnForm.returnDate) nextErrors.returnDate = "កាលបរិច្ឆេទត្រឡប់ត្រូវបំពេញ។";
    // No form-level resolutionType check here — each item now carries its own resolutionType
    // (set via the add-item row, defaulted by emptyPurchaseReturnItemForm), so there's no
    // corresponding UI field left for a user to fix this error against.
    if (purchaseReturnItems.length === 0) nextErrors.items = "សូមបន្ថែមទំនិញបញ្ហាយ៉ាងហោចណាស់មួយ។";
    setPurchaseReturnErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSavePurchaseReturn = () => {
    if (!selectedPurchase || !validatePurchaseReturnForm()) return;

    const now = new Date().toISOString().slice(0, 10);
    // Each item resolves independently — settlements[i] lines up with purchaseReturnItems[i].
    const itemSettlements = getPerItemSettlements(selectedPurchase, purchaseReturnItems);
    const subtotal = roundCurrency(itemSettlements.reduce((total, s) => total + s.usd, 0));
    const subtotalKhr = Math.round(itemSettlements.reduce((total, s) => total + s.khr, 0));
    // Return-level resolutionType is only a best-effort hint now — the server derives the real
    // rollup (single type, or "mixed") from each item's own resolutionType.
    const distinctTypes = Array.from(new Set(itemSettlements.map((s) => s.resolutionType)));
    const rollupResolutionType = distinctTypes.length === 1 ? distinctTypes[0] : "mixed";
    // Same idea for return_reason: no form-level "return reason" field anymore, since items can
    // each have their own condition (one damaged, another expired) — this is just a best-effort
    // rollup hint for the return-level column.
    const distinctConditions = Array.from(new Set(purchaseReturnItems.map((item) => item.condition || "damaged")));
    const rollupReturnReason = distinctConditions.length === 1 ? distinctConditions[0] : "other";
    const newReturnId = Date.now();

    const payload = {
      id: newReturnId,
      purchaseReturnNo: purchaseReturnForm.purchaseReturnNo.trim(),
      purchaseId: selectedPurchase.id,
      purchaseNo: selectedPurchase.purchaseNo,
      supplierId: selectedPurchase.supplierId,
      supplierName: selectedPurchase.supplierName,
      returnDate: purchaseReturnForm.returnDate,
      returnType: purchaseReturnForm.returnType,
      returnReason: rollupReturnReason,
      resolutionType: rollupResolutionType,
      resolutionStatus: purchaseReturnForm.resolutionStatus,
      subtotal,
      subtotalUsd: subtotal,
      subtotalKhr,
      note: purchaseReturnForm.note.trim(),
      status: purchaseReturnForm.status,
      createdBy: "Admin",
      createdAt: now,
      updatedAt: now,
      resolvedAt: purchaseReturnForm.status === RETURN_STATUS.COMPLETED ? now : null,
      items: purchaseReturnItems.map((item, index) => {
        const settlement = itemSettlements[index];
        return {
          ...item,
          purchaseReturnId: newReturnId,
          refundAmountUsd: settlement.resolutionType === "refund" ? settlement.usd : 0,
          refundAmountKhr: settlement.resolutionType === "refund" ? settlement.khr : 0,
          creditAmountUsd: settlement.resolutionType === "credit_note" ? settlement.usd : 0,
          creditAmountKhr: settlement.resolutionType === "credit_note" ? settlement.khr : 0,
        };
      }),
    };

    if (purchasesQuery.data && !String(selectedPurchase.id).startsWith("local-")) {
      createPurchaseReturnMutation.mutate({
        purchase_return_no: null,
        purchase_id: payload.purchaseId,
        supplier_id: payload.supplierId,
        return_date: payload.returnDate,
        return_type: payload.returnType,
        return_reason: payload.returnReason,
        // Return-level resolution_type/resolution_status/settlement totals are a hint only — the
        // backend recomputes the authoritative rollup from each item's own resolution_type.
        resolution_type: rollupResolutionType === "mixed" ? "replacement" : rollupResolutionType,
        resolution_status: payload.resolutionStatus,
        status: String(payload.status || RETURN_STATUS.SUBMITTED).toLowerCase().replaceAll(" ", "_"),
        input_currency: currencyToApi(selectedPurchase.inputCurrency || "USD"),
        exchange_rate_used: Number(selectedPurchase.exchangeRateUsed || 0),
        khr_rounding: selectedPurchase.khrRounding || "floor",
        subtotal_usd: Number(subtotal || 0),
        subtotal_khr: Number(subtotalKhr || 0),
        total_amount_usd: Number(subtotal || 0),
        total_amount_khr: Number(subtotalKhr || 0),
        note: payload.note,
        resolved_at: null,
        items: purchaseReturnItems.map((item, index) => {
          const settlement = itemSettlements[index];
          const isRefund = settlement.resolutionType === "refund";
          const isCredit = settlement.resolutionType === "credit_note";
          const isReplacement = settlement.resolutionType === "replacement";
          // At creation time, a replacement item has no separate "received" action yet to have run —
          // the ONLY way its own resolutionStatus can already read "resolved" here is if the user
          // explicitly chose that in the per-item dropdown to mean "the supplier already handed the
          // replacement over on the spot". Treating that as anything other than "received in full"
          // left a genuinely inconsistent record (resolution_status: "resolved" but
          // replacement_received_qty: 0), which then still showed as an open/waiting claim
          // everywhere despite the user having explicitly marked it done. Checked against THIS
          // item's own resolutionStatus (per-item now, like resolutionType) — a different item left
          // at "submitted" must not get its replacement marked received just because some other item
          // in the same claim was resolved.
          const itemResolutionStatus = item.resolutionStatus || "submitted";
          const replacementReceivedImmediately = isReplacement && itemResolutionStatus === "resolved";

          return {
            purchase_item_id: item.purchaseItemId,
            product_variant_unit_id: item.variantUnitId,
            qty: Number(item.qtyReturned || 0),
            qty_returned: Number(item.qtyReturned || 0),
            base_qty: Number(item.baseQtyReturned || 0),
            base_qty_returned: Number(item.baseQtyReturned || 0),
            input_currency: currencyToApi(item.inputCurrency || "USD"),
            input_unit_cost: Number(item.inputUnitCost || item.unitCostUsd || item.unitCost || 0),
            exchange_rate_used: Number(item.exchangeRateUsed || selectedPurchase.exchangeRateUsed || 0),
            khr_rounding: item.khrRounding || selectedPurchase.khrRounding || "floor",
            unit_cost_usd: Number(item.unitCostUsd ?? item.unitCost ?? 0),
            unit_cost_khr: Number(item.unitCostKhr || 0),
            line_total_usd: Number(item.lineTotalUsd ?? item.lineTotal ?? 0),
            line_total_khr: Number(item.lineTotalKhr || 0),
            resolution_type: settlement.resolutionType,
            resolution_status: itemResolutionStatus,
            refund_status: isRefund ? "pending" : "none",
            refund_amount_usd: isRefund ? settlement.usd : 0,
            refund_amount_khr: isRefund ? settlement.khr : 0,
            credit_amount_usd: isCredit ? settlement.usd : 0,
            credit_amount_khr: isCredit ? settlement.khr : 0,
            credit_status: isCredit ? "issued" : "none",
            replacement_received_qty: replacementReceivedImmediately ? Number(item.qtyReturned || 0) : 0,
            condition: item.condition,
            stock_action: item.stockAction,
            note: item.reason,
            reason: item.reason,
          };
        }),
      });
      return;
    }

    setPurchaseReturns((previous) => [payload, ...previous]);

    if (selectedPurchase.status === STATUS.PENDING_CLAIM) {
      setLocalPurchases((previous) =>
        previous.map((purchase) =>
          purchase.id === selectedPurchase.id ? { ...purchase, status: STATUS.PENDING_STOCK_IN, updatedAt: now } : purchase
        )
      );
    }

    closeModal();
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <SummaryCard theme={theme} title={invoiceTotalTitle} value={fmtUsd(isDateFiltered ? filteredTotalUsd : totalGrandUsd)} subValue={`${isDateFiltered ? filteredCount : totalPurchasesCount} ការទិញ`} subValueColor="text-violet-500" icon={<FiShoppingCart className="text-[34px] text-violet-500" />} iconBg="bg-violet-500/10" />
        <SummaryCard theme={theme} title="រង់ចាំទទួល" value={pendingReceiveCount + pendingStockInCount} subValue={pendingReceiveCount > 0 ? `${pendingReceiveCount} រង់ចាំ · ${pendingStockInCount} ស្តុកចូល` : "ទទួលរួចទាំងអស់"} subValueColor={pendingReceiveCount + pendingStockInCount > 0 ? "text-amber-500" : "text-emerald-500"} icon={<FiTruck className="text-[34px] text-blue-500" />} iconBg="bg-blue-500/10" />
        <SummaryCard theme={theme} title="ប្រាក់មិនទាន់បង់" value={fmtUsd(totalOutstandingUsd)} subValue={unpaidCount > 0 ? `${unpaidCount} ការទិញមិនទាន់បង់` : "បានទូទាត់ទាំងអស់"} subValueColor={unpaidCount > 0 ? "text-amber-500" : "text-emerald-500"} icon={<FiCreditCard className="text-[34px] text-amber-500" />} iconBg="bg-amber-500/10" />
        <SummaryCard theme={theme} title="ទាមទារការខូចខាត" value={pendingClaimsCount} subValue={openReturnsCount > 0 ? `${openReturnsCount} ទាមទារនៅសល់` : "ទាមទាររួចរាល់ទាំងអស់"} subValueColor={openReturnsCount > 0 ? "text-red-500" : "text-emerald-500"} icon={<FiRotateCcw className="text-[34px] text-red-500" />} iconBg="bg-red-500/10" />
      </div>

      <div className={`rounded-2xl border px-4 py-3 shadow-sm ${theme.tableWrap}`}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className={`text-sm font-bold ${theme.pageTitle}`}>សង្ខេបចំណាយ</p>
            <p className={`mt-1 text-xs ${theme.muted}`}>ចំណាយពិតដកតែតម្លៃសងដែលដោះស្រាយរួច។</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:min-w-[480px]">
            <div className={`rounded-xl border px-3 py-2 ${theme.card}`}>
              <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                <FiRotateCcw />
                <span>តម្លៃសង</span>
              </div>
              <p className="mt-1 text-base font-black text-red-500">
                {formatCurrencyPair(summaryClaimDeduction.usd, summaryClaimDeductionKhr)}
              </p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${
              isDark
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-emerald-300 bg-emerald-50 text-emerald-700"
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <FiDollarSign />
                <span>ចំណាយពិត</span>
              </div>
              <p className="mt-1 text-lg font-black">{formatCurrencyPair(summaryNetUsd, summaryNetKhr)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Card ── */}
      <div className={`mx-auto w-full max-w-[1280px] overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>

        {/* Tab bar */}
        <div className={`grid grid-cols-2 border-b px-2 sm:grid-cols-4 sm:px-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
          {[
            { key: "orders",   label: "បញ្ជាទិញ",    count: totalPurchasesCount,                        icon: <FiShoppingCart /> },
            { key: "receive",  label: "ទទួលទំនិញ",  count: pendingReceiveCount + pendingStockInCount,   icon: <FiTruck /> },
            { key: "returns",  label: "ការទាមទារ",   count: openReturnsCount,                           icon: <FiRotateCcw /> },
            { key: "payments", label: "ការទូទាត់",  count: unpaidCount,                                icon: <FiCreditCard /> },
          ].map((tab) => {
            const isAlert = (tab.key === "receive" && pendingReceiveCount + pendingStockInCount > 0)
              || (tab.key === "returns" && openReturnsCount > 0)
              || (tab.key === "payments" && unpaidCount > 0);
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className={`-mb-px flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-2 py-3.5 text-xs font-bold transition sm:px-3 ${
                  activeTab === tab.key
                    ? "border-red-500 text-red-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}>
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isAlert ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                  }`}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Orders Tab ── */}
        {activeTab === "orders" && (
          <>
            <div className={`flex flex-col gap-3 border-b px-4 py-4 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
              <div className="grid flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_200px_200px_160px_160px]">
                <div className="relative">
                  <FiSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`} />
                  <input type="text" placeholder="ស្វែងរកការទិញ អ្នកផ្គត់ផ្គង់ ទំនិញ..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`h-11 w-full rounded-xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
                </div>
                <FilterSelect value={statusFilter} setValue={setStatusFilter} theme={theme} icon={<FiFilter />}
                  options={[{ value: "All", label: "ស្ថានភាពទាំងអស់" }, ...Object.values(STATUS).map((s) => ({ value: s, label: STATUS_LABEL[s] ?? s }))]} />
                <FilterSelect value={paymentStatusFilter} setValue={setPaymentStatusFilter} theme={theme} icon={<FiCreditCard />}
                  options={[
                    { value: "All", label: "ការទូទាត់ទាំងអស់" },
                    { value: "unpaid", label: "មិនទាន់បង់" },
                    { value: "partial", label: "មួយផ្នែក" },
                    { value: "paid", label: "បានបង់" },
                  ]} />
                <FilterSelect value={dateFilter} setValue={setDateFilter} theme={theme} icon={<FiCalendar />}
                  options={[
                    { value: "all", label: "កាលបរិច្ឆេទទាំងអស់" },
                    { value: "today", label: "ថ្ងៃនេះ" },
                    { value: "week", label: "អាទិត្យនេះ" },
                    { value: "month", label: "ខែនេះ" },
                    { value: "custom", label: "កំណត់ដោយខ្លួនឯង" },
                  ]} />
                <FilterSelect value={perPage} setValue={(v) => setPerPage(Number(v))} theme={theme} icon={<FiHash />}
                  options={[10, 25, 50, 100].map((v) => ({ value: v, label: `${v} / ទំព័រ` }))} />
              </div>
              <PermissionGate permission="purchases.create">
                <button type="button" onClick={openAddModal}
                  className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0 xl:shrink-0">
                  <FiPlusCircle className="text-lg" /> បន្ថែមការទិញ
                </button>
              </PermissionGate>
            </div>
            {dateFilter === "custom" && (
              <div className={`flex flex-wrap items-center gap-2 border-b px-4 py-3 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <span className={`text-xs font-semibold ${theme.muted}`}>ចាប់ពី</span>
                <input type="date" value={dateFrom} max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`h-10 rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
                <span className={`text-xs font-semibold ${theme.muted}`}>ដល់</span>
                <input type="date" value={dateTo} min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`h-10 rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
              </div>
            )}

            <div className="flex items-center justify-between px-5 py-3">
              <p className={`text-xs ${theme.muted}`}>បង្ហាញ {pagination.from || 0}–{pagination.to || filteredPurchases.length} នៃ {pagination.total || purchases.length} ការទិញ</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${theme.muted}`}>ចំនួនទាមទារ: {formatMoney(totalPurchaseReturnAmount)}</span>
                <div className="relative">
                  <button
                    type="button"
                    disabled={exportPurchases.length === 0}
                    onClick={() => exportPurchases.length > 0 && setExportMenuOpen((open) => !open)}
                    className={`table-icon-3d inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${theme.badge} hover:border-red-400 hover:text-red-500`}
                  >
                    <FiDownload />
                    Export
                    <FiChevronDown className={`transition ${exportMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {exportMenuOpen && (
                    <div className={`absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-xl border py-1 shadow-xl ${
                      isDark ? "border-white/10 bg-zinc-900" : "border-zinc-200 bg-white"
                    }`}>
                      {[
                        ["pdf", "PDF"],
                        ["csv", "CSV"],
                        ["excel", "Excel"],
                      ].map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleExport(type)}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold transition ${
                            isDark ? "text-zinc-100 hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <FiFileText />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden xl:block">
              {allPurchasesQuery.isLoading ? (
                <table className="w-full"><tbody><Purchase3DLoading theme={theme} colSpan={5} /></tbody></table>
              ) : (
                <PurchaseTable purchases={filteredPurchases} purchaseReturns={purchaseReturns} theme={theme}
                  getEffectivePurchaseStatus={getEffectivePurchaseStatus}
                  getPurchaseProblemLabel={getPurchaseProblemLabel}
                  getPurchaseStatusBadge={getPurchaseStatusBadge}
                  getClaimRequiredCount={getClaimRequiredCount}
                  hasUnresolvedClaimDecision={hasUnresolvedClaimDecision}
                  getOpenSupplierClaim={getOpenSupplierClaim}
                  getDamagedCount={getDamagedCount}
                  getNextActionLabel={getNextActionLabel}
                  getStatusClass={getStatusClass}
                  getStatusIcon={getStatusIcon}
                  openViewModal={openViewModal}
                  openEditModal={openEditModal}
                  openReceiveGoodsModal={openReceiveGoodsModal}
                  openPurchaseReturnModal={openPurchaseReturnModal}
                  handleReceiveReplacement={handleReceiveReplacement}
                  handleResolveSupplierClaim={handleResolveSupplierClaim}
                  handleConfirmStockIn={handleConfirmStockIn}
                  handleCancelPurchase={handleCancelPurchase}
                  onContinuePayment={goToPaymentTab}
                  simplified
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 xl:hidden">
              {allPurchasesQuery.isLoading ? (
                <table className="w-full"><tbody><Purchase3DLoading theme={theme} colSpan={1} /></tbody></table>
              ) : filteredPurchases.length === 0 ? (
                <EmptyState theme={theme} icon={<FiSearch />} title="រកមិនឃើញការទិញ" description="ព្យាយាមប្តូរការស្វែងរក ឬតម្រង។" />
              ) : (
                filteredPurchases.map((purchase) => (
                  <PurchaseMobileCard key={purchase.id} purchase={purchase} purchaseReturns={purchaseReturns} theme={theme}
                    effectiveStatus={getEffectivePurchaseStatus(purchase)}
                    statusBadge={getPurchaseStatusBadge(purchase)}
                    problemLabel={getPurchaseStatusBadge(purchase).overrode ? "" : getPurchaseProblemLabel(purchase)}
                    nextActionLabel={getNextActionLabel(purchase)} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon}
                    openViewModal={openViewModal} openEditModal={openEditModal} openReceiveGoodsModal={openReceiveGoodsModal}
                    openPurchaseReturnModal={openPurchaseReturnModal} handleReceiveReplacement={handleReceiveReplacement}
                    handleResolveSupplierClaim={handleResolveSupplierClaim} handleConfirmStockIn={handleConfirmStockIn}
                    handleCancelPurchase={handleCancelPurchase}
                    onContinuePayment={goToPaymentTab}
                    simplified
                  />
                ))
              )}
            </div>

            {!allPurchasesQuery.isLoading && pagination.lastPage > 1 && (
              <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
                <p className={`text-xs ${theme.muted}`}>ទំព័រ {pagination.currentPage} នៃ {pagination.lastPage}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" disabled={page <= 1}
                    onClick={() => setPage((c) => Math.max(1, c - 1))}
                    className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
                    <FiChevronLeft /> មុន
                  </button>
                  {pageNumbers.map((item) => item === "..." ? (
                    <span key={item} className={`px-2 text-sm font-semibold ${theme.muted}`}>...</span>
                  ) : (
                    <button key={item} type="button" onClick={() => setPage(item)}
                      className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                        item === pagination.currentPage ? "quick-action-icon-3d bg-red-600 text-white" : "table-icon-3d border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                      }`}>{item}
                    </button>
                  ))}
                  <button type="button" disabled={page >= pagination.lastPage}
                    onClick={() => setPage((c) => Math.min(pagination.lastPage, c + 1))}
                    className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
                    បន្ទាប់ <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Receive Tab ── */}
        {activeTab === "receive" && (
          <div className="p-4">
            {/* Search/count header lives OUTSIDE the loading/empty/results branches below —
                previously it only rendered inside the "has results" branch, so a search term
                that matched nothing made the search box itself disappear along with the table,
                leaving no way to see or clear what was typed. */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <FiTruck /> {pendingReceiveCount} រង់ចាំដឹក
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <FiCheckCircle /> {pendingStockInCount} រួចរាល់ស្តុក
                </span>
                {pendingClaimWithStock > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <FiAlertTriangle /> {pendingClaimWithStock} រង់ចាំការទាមទារ
                  </span>
                )}
              </div>
              <div className="relative w-full sm:w-72">
                <FiSearch className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme.muted}`} />
                <input type="text" placeholder="ស្វែងរកលេខការទិញ អ្នកផ្គត់ផ្គង់..."
                  value={receiveSearchTerm} onChange={(e) => setReceiveSearchTerm(e.target.value)}
                  className={`h-9 w-full rounded-xl border pl-9 pr-3 text-xs outline-none transition focus:ring-2 ${theme.input}`} />
              </div>
            </div>
            {allPurchasesQuery.isLoading ? (
              <table className="w-full"><tbody><Purchase3DLoading theme={theme} colSpan={7} /></tbody></table>
            ) : receiveFilteredList.length === 0 ? (
              receiveSearchTerm.trim() ? (
                <EmptyState theme={theme} icon={<FiSearch />} title={`រកមិនឃើញ "${receiveSearchTerm}"`} description="សាកល្បងស្វែងរកពាក្យផ្សេង ឬលុបចេញដើម្បីមើលទាំងអស់។" />
              ) : (
                <EmptyState theme={theme} icon={<FiTruck />} title="គ្មានការដឹករង់ចាំ" description="ការទិញទាំងអស់បានទទួលហើយ និងស្តុករួចហើយ។" />
              )
            ) : (
              <>
                <div className={`overflow-hidden rounded-xl border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                  <table className="responsive-card-table w-full min-w-200 text-sm">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">លេខការទិញ</th>
                        <th className="px-4 py-3 text-left">អ្នកផ្គត់ផ្គង់</th>
                        <th className="px-4 py-3 text-left">កាលបរិច្ឆេទ</th>
                        <th className="px-4 py-3 text-left">សរុប</th>
                        <th className="px-4 py-3 text-left">ទំនិញ / ខូច</th>
                        <th className="px-4 py-3 text-left">ស្ថានភាព</th>
                        <th className="px-4 py-3 text-center">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiveFilteredList.length === 0 ? (
                        <tr><td colSpan={7} className={`px-4 py-10 text-center text-sm ${theme.muted}`}>រកមិនឃើញ "{receiveSearchTerm}"</td></tr>
                      ) : receivePageItems.map((purchase) => {
                          const damagedQty = getDamagedCount(purchase);
                          const itemsCount = purchase.itemsCount || getPurchaseLines(purchase).length;
                          const paidUsd = Number(purchase.paidAmountUsd ?? purchase.paidAmount ?? 0);
                          const paidKhr = Number(purchase.paidAmountKhr ?? 0);
                          const balance = getPurchasePaymentBalance(purchase);
                          const balanceUsd = balance.usd;
                          const balanceKhr = balance.khr;
                          const hasPaymentContext = paidUsd > 0 || paidKhr > 0 || balanceUsd > 0 || balanceKhr > 0;
                          // "បានបង់មុន" (paid IN ADVANCE) describes WHEN money moved (ahead of receiving),
                          // not how much — accurate for pure "prepaid" no matter what, since the whole
                          // amount is always paid upfront there by definition. For pay_after_check it's
                          // never accurate (money only ever moves via a separate, deliberate ការទូទាត់
                          // action, after checking, never upfront). For partial_prepaid it's accurate
                          // ONLY while a balance remains — once fully paid, the remainder was settled via
                          // a later, separate payment (often after receiving/claims), not "in advance"
                          // of anything anymore, so it should read the same as a completed payment.
                          const isPayAfterCheck = purchase.paymentMode === "pay_after_check";
                          const isPartialPrepaid = purchase.paymentMode === "partial_prepaid";
                          const isFullyPaid = balanceUsd <= 0.01 && balanceKhr <= 1;
                          const paidLabel =
                            (isPayAfterCheck || isPartialPrepaid) && isFullyPaid
                              ? "បានបង់ប្រាក់ពេញតម្លៃ"
                              : isPayAfterCheck
                                ? "បានបង់"
                                : "បានបង់មុន";
                          return (
                            <tr key={purchase.id} className={`border-t transition ${isDark ? "border-white/[0.06] hover:bg-white/[0.025]" : "border-zinc-200 hover:bg-zinc-50"} ${theme.row}`}>
                              <td data-label="លេខការទិញ" className="px-4 py-3 font-semibold">{purchase.purchaseNo}</td>
                              <td data-label="អ្នកផ្គត់ផ្គង់" className="px-4 py-3">{purchase.supplierName}</td>
                              <td data-label="កាលបរិច្ឆេទ" className="px-4 py-3">{purchase.purchaseDate}</td>
                              <td data-label="សរុប" className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold">{formatCurrencyPair(purchase.grandTotalUsd || 0, purchase.grandTotalKhr || 0)}</span>
                                  {hasPaymentContext && paidUsd > 0 && (
                                    <span className="text-xs font-semibold text-emerald-600">{paidLabel} {formatCurrencyPair(paidUsd, paidKhr)}</span>
                                  )}
                                  {hasPaymentContext && balanceUsd > 0 && (
                                    <span className="text-xs font-semibold text-amber-600">នៅសល់ {formatCurrencyPair(balanceUsd, balanceKhr)}</span>
                                  )}
                                </div>
                              </td>
                              <td data-label="ទំនិញ / ខូច" className="px-4 py-3">
                                {(() => {
                                  // Just the plain damaged count here — the status column already shows a
                                  // specific badge/sub-line for the claim's own progress, so an extra
                                  // "· ទាមទារ" suffix here was duplicate info (and inconsistent besides,
                                  // since claim_qty resets to 0 for resolved refund/credit_note claims but
                                  // not replacement ones, making this pill's wording depend on claim type
                                  // for no good reason).
                                  const claimQty = getClaimRequiredCount(purchase);
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <span className={`text-xs ${theme.muted}`}>{itemsCount} មុខទំនិញ</span>
                                      {damagedQty > 0 ? (
                                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                                          <FiAlertTriangle size={9} /> {damagedQty} ខូច
                                        </span>
                                      ) : claimQty > 0 ? (
                                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                          <FiAlertTriangle size={9} /> {claimQty} ទាមទារ
                                        </span>
                                      ) : null}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td data-label="ស្ថានភាព" className="px-4 py-3">
                                {(() => {
                                  const statusBadge = getPurchaseStatusBadge(purchase);
                                  // Narrower than getPurchaseProblemLabel: this row already has its own separate
                                  // ខូច/claim pill (previous column) and its own status badge, so only the
                                  // replacement-progress nuance is worth a sub-line here — the generic claim-count/
                                  // pending-receive branches would just repeat what's already shown in this row.
                                  // Skip it entirely when the badge itself already carries that same text.
                                  const problemLabel = statusBadge.overrode ? "" : getReplacementProgressLabel(purchase);
                                  // Same "resolved, only stock-in left" case as the Purchases-tab list and
                                  // the detail view — effectiveStatus has already moved off PENDING_CLAIM by
                                  // this point, so statusBadge.overrode is false and this text would
                                  // otherwise show as plain red text under a generic badge instead of the
                                  // purple pill used everywhere else for it.
                                  // Broader than "ចាំបញ្ជាក់ស្តុកចូល" alone — also matches the replacement-
                                  // already-stocked-in fallback label ("ទំនិញជំនួសថ្មីបញ្ជាក់ស្តុកចូលរួចរាល់"),
                                  // which shares "បញ្ជាក់ស្តុកចូល" but not the leading "ចាំ".
                                  const isPendingStockInAfterResolution = !statusBadge.overrode && problemLabel.includes("បញ្ជាក់ស្តុកចូល");
                                  // A still-open claim (money or replacement) is about a DIFFERENT product
                                  // line than the accepted/usable portion of this same purchase — that
                                  // usable portion can independently still be waiting on its own stock-in
                                  // confirmation the whole time, but problemLabel is forced to "" whenever
                                  // statusBadge.overrode is true (the claim badge already "wins" the slot),
                                  // so this fact was going unmentioned here entirely.
                                  // A THIRD case, distinct from both above: no claim exists at all yet
                                  // (statusBadge shows the plain "រង់ចាំការទាមទារ" status label, problemLabel
                                  // is "" since getReplacementProgressLabel has nothing to report) — the
                                  // accepted/usable portion can still independently be waiting on its own
                                  // stock-in confirmation even before any claim gets created for the damaged
                                  // portion. Same as the Purchases-tab list's own equivalent fix.
                                  const effectiveStatus = getEffectivePurchaseStatus(purchase);
                                  const hasSeparatePendingStockIn =
                                    (statusBadge.overrode || effectiveStatus === STATUS.PENDING_CLAIM) &&
                                    !isPendingStockInAfterResolution &&
                                    hasRemainingStockInQty(purchase);
                                  // Mirror of the above for the opposite, equally common case: the
                                  // accepted/usable portion has ALREADY been stocked in while a claim for
                                  // a DIFFERENT item (or a claim that genuinely still needs creating —
                                  // e.g. prepaid, which never gets partial_prepaid's silent-absorption
                                  // shortcut, so it stays at PENDING_CLAIM for as long as unclaimed damage
                                  // exists) is still outstanding. Without this, confirming stock-in here
                                  // left no visible trace at all once done, while the main badge still
                                  // correctly (and separately) says "រង់ចាំការទាមទារ" for the claim side.
                                  // Not payment-mode-gated — same general fact regardless of mode.
                                  const hasSeparateStockConfirmed =
                                    (statusBadge.overrode || effectiveStatus === STATUS.PENDING_CLAIM) &&
                                    !isPendingStockInAfterResolution &&
                                    !hasRemainingStockInQty(purchase) &&
                                    getPurchaseLines(purchase).some((line) => Number(line.acceptedQty ?? line.accepted_qty ?? 0) > 0);
                                  // The claim-create button below (getClaimRequiredCount > 0 &&
                                  // !hasUnresolvedClaimDecision) stays clickable even once the purchase
                                  // reaches RECEIVED — creating a claim now could still mean replacement
                                  // (which keeps the full remaining balance owed, unlike refund/credit
                                  // which deducts it — see the confirmed partial_prepaid flows). Once the
                                  // status badge itself says "done", that live option is easy to forget
                                  // exists — so this reminder persists for as long as the button does,
                                  // not just while still PENDING_STOCK_IN like isPartialPrepaidUnclaimedDamage
                                  // above (whose only job is the label-swap right below, not this pill).
                                  // Excludes effectiveStatus === PENDING_CLAIM: when the damage value
                                  // exceeds the unpaid balance, isSupplierClaimNeeded does NOT take the
                                  // silent-absorption shortcut, so this purchase genuinely stays at
                                  // PENDING_CLAIM and the main status badge itself already reads plain
                                  // "រង់ចាំការទាមទារ" — stacking this pill on top of that repeated the
                                  // exact same text twice.
                                  const hasClaimableDamageForPartialPrepaid =
                                    purchase.paymentMode === "partial_prepaid" &&
                                    effectiveStatus !== STATUS.PENDING_CLAIM &&
                                    getClaimRequiredCount(purchase) > 0 &&
                                    !hasUnresolvedClaimDecision(purchase);
                                  // Broader sibling of the above: a claim CREATED after this purchase
                                  // already reached RECEIVED doesn't roll purchase.status back to
                                  // Pending Claim, so statusBadge.overrode never becomes true here either
                                  // — without this, the badge would keep reading the plain "ស្តុកចូលរួច
                                  // រាល់អស់" ("fully done") for as long as that claim sits open/
                                  // unresolved, or a resolved replacement hasn't actually been received/
                                  // stocked yet. getOpenSupplierClaim already covers both those claim-
                                  // exists sub-states correctly (unlike claim_qty, which doesn't reliably
                                  // reset for replacement claims — see the confirmed partial_prepaid
                                  // flows notes).
                                  const hasOutstandingDamageFollowUpForPartialPrepaid =
                                    purchase.paymentMode === "partial_prepaid" &&
                                    !statusBadge.overrode &&
                                    (hasClaimableDamageForPartialPrepaid || Boolean(getOpenSupplierClaim(purchase)));
                                  // Confirming stock-in can move purchase.status all the way to RECEIVED
                                  // here (no claim was ever required), whose plain label "ស្តុកចូលរួចរាល់អស់"
                                  // ("fully stocked in / done") overstates it while a claim is still a live
                                  // option, or open, or a resolved replacement hasn't been received/stocked
                                  // yet — the damaged units were never actually finalized. Use the same
                                  // accepted-qty check as the PENDING_STOCK_IN case (this used to only fire
                                  // there) so every stage before genuine completion reads "usable qty
                                  // stocked in" instead of a premature "done" — matches PurchaseTable.jsx's
                                  // hasAcceptedStockConfirmed signal.
                                  const isPartialPrepaidStockConfirmed =
                                    hasOutstandingDamageFollowUpForPartialPrepaid &&
                                    !hasRemainingStockInQty(purchase) &&
                                    getPurchaseLines(purchase).some((line) => Number(line.acceptedQty ?? line.accepted_qty ?? 0) > 0);
                                  // Same promotion as isPendingStockInAfterResolution above, for the
                                  // sibling case where a claim exists but purchase.status stayed at
                                  // RECEIVED regardless (see hasOutstandingDamageFollowUpForPartialPrepaid's
                                  // own comment) — getReplacementProgressLabel's text (e.g. "រង់ចាំដំណោះ
                                  // ស្រាយ") would otherwise sit as plain red text below a main badge that
                                  // already claims "done" (green). Same fix as PurchaseTable.jsx.
                                  const promoteProblemLabelToPurplePill =
                                    isPendingStockInAfterResolution || (isPartialPrepaidStockConfirmed && Boolean(problemLabel));
                                  return (
                                    <div className="flex flex-col gap-1">
                                      {hasClaimableDamageForPartialPrepaid && (
                                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                          <FiAlertTriangle /> រង់ចាំការទាមទារ
                                        </span>
                                      )}
                                      {promoteProblemLabelToPurplePill && (
                                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                          {/* The badge right below already reads "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន",
                                              so the money-claim label drops the redundant suffix — but the
                                              replacement label ("ដោះស្រាយរួច ...") keeps it, since "ដោះស្រាយរួច"
                                              alone reads as fully done, misleadingly, while stock-in is still
                                              outstanding. */}
                                          <FiCheckCircle />{" "}
                                          {problemLabel.startsWith("ដោះស្រាយរួច") ? problemLabel : problemLabel.replace(/ ចាំបញ្ជាក់ស្តុកចូល$/, "")}
                                        </span>
                                      )}
                                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        isPartialPrepaidStockConfirmed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : statusBadge.className
                                      }`}>
                                        {isPartialPrepaidStockConfirmed ? <FiCheckCircle /> : statusBadge.icon}
                                        {isPartialPrepaidStockConfirmed
                                          ? "ចំនួនប្រើបានចូលស្តុករួច"
                                          : isPendingStockInAfterResolution
                                            ? "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន"
                                            : statusBadge.label}
                                      </span>
                                      {hasSeparatePendingStockIn && (
                                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                          <FiClock /> រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន
                                        </span>
                                      )}
                                      {hasSeparateStockConfirmed && (
                                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                          <FiCheckCircle /> ចំនួនប្រើបានចូលស្តុករួច
                                        </span>
                                      )}
                                      {problemLabel && !promoteProblemLabelToPurplePill && (
                                        <p className={`text-[11px] font-semibold ${
                                          problemLabel.includes("បានដោះស្រាយ")
                                            ? "text-emerald-500"
                                            : problemLabel.includes("រង់ចាំបញ្ចូលស្តុក")
                                              ? "text-blue-500"
                                              : "text-red-500"
                                        }`}>
                                          {problemLabel}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td data-label="សកម្មភាព" className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  {getEffectivePurchaseStatus(purchase) === STATUS.PENDING_RECEIVE && (
                                    <Tooltip label="ទទួលទំនិញ">
                                      <button type="button" onClick={() => openReceiveGoodsModal(purchase)}
                                        className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.receive}`}>
                                        <FiTruck size={17} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {((getEffectivePurchaseStatus(purchase) === STATUS.PENDING_STOCK_IN && purchase.status !== STATUS.PENDING_CLAIM) ||
                                    (purchase.status === STATUS.PENDING_CLAIM && (hasRemainingStockInQty(purchase) && !hasAnyStockedInQty(purchase))) ||
                                    // Replacement goods can be received without being stocked in yet, even after the
                                    // overall purchase status has already moved on to RECEIVED — keep this reachable.
                                    hasPendingReplacementStockIn(purchase)) && (
                                    <Tooltip label="បញ្ជាក់ស្តុកចូល">
                                      <button type="button" onClick={() => handleConfirmStockIn(purchase)}
                                        className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.confirm}`}>
                                        <FiCheckCircle size={17} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {/* Don't also require !hasResolvedSupplierClaim — a purchase can have several
                                      claims over its lifetime (one per damaged item/batch), so an earlier claim
                                      already being resolved must not permanently hide this button while another
                                      item still genuinely needs its own separate claim. Use hasUnresolvedClaimDecision
                                      (not getOpenSupplierClaim) so a resolved-but-not-yet-stocked-in replacement
                                      claim on item A doesn't block starting a fresh claim for item B — those are
                                      unrelated once the decision itself is made. */}
                                  {getClaimRequiredCount(purchase) > 0 && !hasUnresolvedClaimDecision(purchase) && (
                                    <Tooltip label="បង្កើតការទាមទារ">
                                      <button type="button" onClick={() => openPurchaseReturnModal(purchase)}
                                        className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.claim}`}>
                                        <FiRotateCcw size={17} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {shouldShowInPaymentFlow(purchase) && isPaymentReady(purchase) && (
                                    <Tooltip label="ទៅការទូទាត់">
                                      <button type="button" onClick={() => goToPaymentTab(purchase)}
                                        className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.payment}`}>
                                        <FiArrowRightCircle size={17} />
                                      </button>
                                    </Tooltip>
                                  )}
                                  <Tooltip label="មើលការទិញ">
                                    <button type="button" onClick={() => openViewModal(purchase)}
                                      className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.view}`}>
                                      <FiEye size={17} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <ListPagination theme={theme} currentPage={receivePage} lastPage={receiveLastPage} onPageChange={setReceivePage} />
              </>
            )}
          </div>
        )}

        {/* ── Returns Tab ── */}
        {activeTab === "returns" && (
          <div className="p-4 space-y-4">
            {/* Filter bar + New Return button */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {[
                  { key: "open", label: "បើក", count: openReturnsCount },
                  { key: "resolved", label: "បានដោះស្រាយ", count: resolvedReturnsCount },
                  { key: "all", label: "ទាំងអស់", count: purchaseReturns.length },
                ].map((f) => (
                  <button key={f.key} type="button" onClick={() => setReturnStatusFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      returnStatusFilter === f.key
                        ? "bg-red-600 text-white"
                        : `${theme.badge} hover:opacity-80`
                    }`}>
                    {f.label}
                    {f.count != null && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${returnStatusFilter === f.key ? "bg-white/20 text-white" : "bg-red-500/15 text-red-500"}`}>
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <FiSearch className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme.muted}`} />
                  <input type="text" placeholder="ស្វែងរកលេខ ឬអ្នកផ្គត់ផ្គង់..."
                    value={returnSearchTerm} onChange={(e) => setReturnSearchTerm(e.target.value)}
                    className={`h-9 w-full rounded-xl border pl-9 pr-3 text-xs outline-none transition focus:ring-2 ${theme.input}`} />
                </div>
                <p className={`text-xs ${theme.muted}`}>{returnFilteredList.length} លទ្ធផល</p>
                <button type="button"
                  onClick={() => { setNewReturnPanelOpen((v) => !v); setNewReturnSearchTerm(""); }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${newReturnPanelOpen ? "bg-red-700 text-white" : "bg-red-600 text-white hover:bg-red-700"}`}>
                  <FiPlus className="text-xs" /> ត្រឡប់ថ្មី
                </button>
              </div>
            </div>

            {/* Inline New Return panel */}
            {newReturnPanelOpen && (
              <div className={`overflow-hidden rounded-xl border ${theme.tableWrap}`}>
                {/* Header: icon + search + count + close in one row */}
                <div className={`flex items-center gap-3 border-b px-4 py-2.5 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    <FiRotateCcw size={13} />
                  </div>
                  <div className="relative flex-1">
                    <FiSearch className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${theme.muted}`} />
                    <input autoFocus type="text" placeholder="ស្វែងរកការទិញដើម្បីត្រឡប់..."
                      value={newReturnSearchTerm}
                      onChange={(e) => setNewReturnSearchTerm(e.target.value)}
                      className={`h-8 w-full rounded-lg border pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-red-400 ${theme.input}`} />
                  </div>
                  <span className={`shrink-0 text-[11px] ${theme.muted}`}>{newReturnEligible.length} អាច</span>
                  <button type="button" onClick={() => { setNewReturnPanelOpen(false); setNewReturnSearchTerm(""); }}
                    className={`shrink-0 rounded-lg p-1 transition hover:bg-zinc-500/10 ${theme.muted}`}>
                    <FiX size={14} />
                  </button>
                </div>
                {/* Purchase list */}
                <div className="max-h-56 overflow-y-auto">
                  {allPurchasesQuery.isLoading ? (
                    <p className={`p-5 text-center text-xs ${theme.muted}`}>រង់ចាំបន្តិច...</p>
                  ) : newReturnEligible.length === 0 ? (
                    <p className={`px-4 py-5 text-center text-xs ${theme.muted}`}>
                      {newReturnSearchTerm ? "រកមិនឃើញ។" : "គ្មានការទិញដែលអាចត្រឡប់បាន។"}
                    </p>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-white/5">
                      {newReturnEligible.map((p) => {
                        const claimCount = getClaimRequiredCount(p);
                        const damagedCount = getDamagedCount(p);
                        const effStatus = getEffectivePurchaseStatus(p);
                        return (
                          <button key={p.id} type="button"
                            onClick={() => { setNewReturnPanelOpen(false); setNewReturnSearchTerm(""); openPurchaseReturnModal(p); }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-red-500/5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                              <FiShoppingCart size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold">{p.purchaseNo}</p>
                              <p className={`truncate text-[11px] ${theme.muted}`}>{p.supplierName} · {p.purchaseDate}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusClass(effStatus)}`}>
                                {STATUS_LABEL[effStatus] ?? effStatus}
                              </span>
                              {(claimCount > 0 || damagedCount > 0) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                  <FiAlertTriangle size={9} />
                                  {claimCount > 0 ? `${claimCount} ទាមទារ` : `${damagedCount} ខូច`}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {purchaseReturnsQuery.isLoading ? (
              <table className="w-full"><tbody><Purchase3DLoading theme={theme} colSpan={8} /></tbody></table>
            ) : returnFilteredList.length === 0 ? (
              <EmptyState theme={theme} icon={<FiRotateCcw />}
                title={returnStatusFilter === "open" ? "គ្មានការត្រឡប់បើក" : returnStatusFilter === "resolved" ? "គ្មានការត្រឡប់ដោះស្រាយ" : "គ្មានការត្រឡប់"}
                description={returnStatusFilter === "open" ? "ការត្រឡប់ទាំងអស់បានដោះស្រាយ។ ចុច + ត្រឡប់ថ្មីដើម្បីបង្កើត។" : "គ្មានការត្រឡប់ អ្នកផ្គត់ផ្គង់ ត្រូវបានកត់ទុករឿន។"} />
            ) : (
              <div className={`overflow-hidden rounded-xl border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <table className="responsive-card-table w-full min-w-4xl text-sm">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="w-8 px-3 py-3" />
                      <th className="px-4 py-3 text-left">លេខត្រឡប់</th>
                      <th className="px-4 py-3 text-left">លេខការទិញ</th>
                      <th className="px-4 py-3 text-left">អ្នកផ្គត់ផ្គង់</th>
                      <th className="px-4 py-3 text-left">កាលបរិច្ឆេទ</th>
                      <th className="px-4 py-3 text-left">ដំណោះស្រាយ</th>
                      <th className="px-4 py-3 text-left">ស្ថានភាព</th>
                      <th className="px-4 py-3 text-left">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnPageItems.map((ret) => {
                      const retStatus = normalizeReturnStatusLabel(ret.status || ret.resolutionStatus);
                      const retIsIncompleteReplacement = isReplacementClaimIncomplete(ret);
                      const retIsOpen = ![RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(retStatus) || retIsIncompleteReplacement;
                      const retPurchase = allPurchases.find((p) => String(p.id) === String(ret.purchaseId));
                      const retItems = Array.isArray(ret.items) ? ret.items : [];
                      // Gate on THIS return's own items, not the return-level rollup's resolutionType —
                      // a mixed claim's rollup type reads "mixed", which never equals "replacement" or
                      // ["refund","credit_note"] on its own and used to hide every action button below.
                      const hasReplacementItem = retItems.length > 0
                        ? retItems.some((item) => normalizeReturnResolutionType(item.resolutionType || item.resolution_type) === "replacement")
                        : ret.resolutionType === "replacement";
                      const isExpanded = expandedReturnId === ret.id;
                      const purchaseNo = ret.purchaseNo || retPurchase?.purchaseNo || "-";
                      // "resolved" only means the supplier agreed to replace — it does not mean the
                      // goods have physically arrived, so a genuinely-zero received_qty must not be
                      // treated as "fully received" just because the claim status looks complete.
                      // Both replacement_received_qty/replacement_stocked_in_qty are already scoped to
                      // replacement-type items only by the backend rollup (recomputeReturnRollup), so
                      // they stay correct as-is even for a mixed claim.
                      const replacementReceivedQty = Number(ret.replacementReceivedQty ?? ret.replacement_received_qty ?? 0);
                      const replacementStockedInQty = Number(ret.replacementStockedInQty ?? ret.replacement_stocked_in_qty ?? 0);
                      // Only replacement-type items count toward the claimed replacement qty — summing
                      // every item regardless of type overcounts as soon as a claim mixes in a
                      // refund/credit_note item alongside a replacement one.
                      const claimedReplacementQty = retItems
                        .filter((item) => normalizeReturnResolutionType(item.resolutionType || item.resolution_type) === "replacement")
                        .reduce(
                          (total, item) => total + Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? item.replacement_qty ?? item.replacementQty ?? 0),
                          0
                        );
                      const hasOpenReplacementItem = retItems.length > 0 ? returnHasOpenReplacementItem(ret) : hasReplacementItem;
                      // Resolving money claims is per-item now — a claim can have two separate
                      // refund/credit_note items (e.g. two different damaged products) that the
                      // supplier pays at different times, so one "confirm" click must not always
                      // mean "resolve everything in this return". When there's exactly one open
                      // money item, the row-level shortcut button below still resolves it directly
                      // (no ambiguity, same one click as before); once there are 2+, that shortcut
                      // hides and each item gets its own confirm action in the expanded row instead.
                      const openMoneyItemsForRow = retItems.filter((item) => {
                        const type = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
                        const status = normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status);
                        return ["refund", "credit_note"].includes(type) && status !== RETURN_STATUS.COMPLETED && status !== RETURN_STATUS.CANCELLED;
                      });
                      const canReceiveReplacement = retIsOpen && retPurchase && hasOpenReplacementItem && replacementReceivedQty < claimedReplacementQty;
                      const canStockInReplacement = retPurchase && hasReplacementItem && replacementReceivedQty > replacementStockedInQty;
                      const retPurchaseHasBalance = retPurchase && hasPurchasePaymentBalance(retPurchase);
                      const canContinueReturnPayment = hasReplacementItem && retPurchaseHasBalance && isPaymentReady(retPurchase);
                      return (
                        <React.Fragment key={ret.id}>
                          <tr
                            className={`cursor-pointer border-t transition ${isDark ? "border-white/[0.06] hover:bg-white/[0.025]" : "border-zinc-200 hover:bg-zinc-50"} ${theme.row} ${isExpanded ? (isDark ? "bg-white/[0.04]" : "bg-zinc-50") : ""}`}
                            onClick={() => setExpandedReturnId(isExpanded ? null : ret.id)}
                          >
                            <td data-label="" className="px-3 py-3 text-center">
                              <FiChevronRight className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-90" : ""} ${theme.muted}`} />
                            </td>
                            <td data-label="លេខត្រឡប់" className="px-4 py-3 font-semibold">{ret.purchaseReturnNo || "-"}</td>
                            <td data-label="លេខការទិញ" className="px-4 py-3">{purchaseNo}</td>
                            <td data-label="អ្នកផ្គត់ផ្គង់" className="px-4 py-3">{ret.supplierName || "-"}</td>
                            <td data-label="កាលបរិច្ឆេទ" className="px-4 py-3">{ret.returnDate || "-"}</td>
                            <td data-label="ដំណោះស្រាយ" className="px-4 py-3">{{ replacement: "ជំនួសទំនិញថ្មី", refund: "សងលុយ", credit_note: "កាត់លុយលើវិក្កយបត្រក្រោយ", none: "លះបង់ការទាមទារ", mixed: "ចម្រុះ" }[ret.resolutionType] ?? (ret.resolutionType || "-")}</td>
                            <td data-label="ស្ថានភាព" className="px-4 py-3">
                              <div className="flex flex-col items-start gap-1.5">
                                {/* retStatus is "completed" as soon as the supplier agrees to replace — that's the
                                    resolution *decision*, not physical receipt, so an incomplete replacement gets
                                    its own styling here instead of falling through to the generic badge below.
                                    Once the full claimed qty has actually been received, this reads as done
                                    ("ដោះស្រាយរួច") even if the stock-in step (separate action button) hasn't run
                                    yet. Always just "រង់ចាំដំណោះស្រាយ" while still open, whether nothing or only
                                    part has been received — the adjacent "N ខូច · សង M" pill already spells out
                                    the exact quantities, so a separate "សល់ N ទៀត" wording here was redundant. */}
                                {retIsIncompleteReplacement ? (
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    !canReceiveReplacement
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                  }`}>
                                    {!canReceiveReplacement ? <FiCheckCircle /> : <FiClock />}
                                    {canReceiveReplacement ? "រង់ចាំដំណោះស្រាយ" : "ដោះស្រាយរួច"}
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getPurchaseReturnStatusClass(retStatus)}`}>
                                    {getPurchaseReturnStatusIcon(retStatus)} {RETURN_STATUS_LABEL[retStatus] ?? retStatus}
                                  </span>
                                )}
                                {/* Same "N ខូច · សង M" breakdown as the Purchases tab's own pill, scoped to just
                                    THIS return's own items (qty is the return item's own claimed qty, which unlike
                                    claim_qty on the purchase item never resets) — resolvedQty counts actual progress
                                    per item: a replacement item's own replacement_received_qty (partial receipt counts
                                    immediately, not gated on resolution_status reaching "resolved" only once the FULL
                                    claimed qty arrives), a money item's full qty once resolved (refund/credit have no
                                    partial-quantity concept of their own, only submitted vs resolved). */}
                                {(() => {
                                  const totalDamagedQty = retItems.reduce(
                                    (total, item) => total + Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? 0),
                                    0
                                  );
                                  const resolvedQty = retItems.reduce((total, item) => {
                                    const qty = Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? 0);
                                    const itemType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
                                    if (itemType === "replacement") {
                                      const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
                                      return total + Math.min(qty, receivedQty);
                                    }
                                    const itemStatus = normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status);
                                    return itemStatus === RETURN_STATUS.COMPLETED ? total + qty : total;
                                  }, 0);
                                  if (totalDamagedQty <= 0) return null;
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-500">
                                      <FiAlertTriangle size={10} /> {totalDamagedQty} ខូច
                                      {resolvedQty > 0 && <span className="text-emerald-500">{" "}· សង {resolvedQty}</span>}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td data-label="សកម្មភាព" className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {canReceiveReplacement && (
                                  <Tooltip label="ទទួលជំនួស">
                                    <button type="button" onClick={() => handleReceiveReplacement(retPurchase, ret)}
                                      className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.receive}`}>
                                      <FiTruck size={17} />
                                    </button>
                                  </Tooltip>
                                )}
                                {canStockInReplacement && (
                                  <Tooltip label="បញ្ចូលក្នុងស្តុក">
                                    <button type="button" onClick={() => handleConfirmStockIn(retPurchase)}
                                      className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.confirm}`}>
                                      <FiCheckCircle size={17} />
                                    </button>
                                  </Tooltip>
                                )}
                                {canContinueReturnPayment && (
                                  <Tooltip label="ទៅបង់ប្រាក់នៅសល់">
                                    <button type="button" onClick={() => goToPaymentTab(retPurchase)}
                                      className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.payment}`}>
                                      <FiArrowRightCircle size={17} />
                                    </button>
                                  </Tooltip>
                                )}
                                {/* Only the unambiguous case: exactly one open money item, so this
                                    shortcut resolves precisely that one item with no guesswork. With
                                    2+ open money items, this hides — expand the row and use each
                                    item's own confirm button instead (see the items table below). */}
                                {retPurchase && openMoneyItemsForRow.length === 1 && (
                                  <Tooltip label={
                                    normalizeReturnResolutionType(openMoneyItemsForRow[0].resolutionType || openMoneyItemsForRow[0].resolution_type) === "refund"
                                      ? "ប្រាក់ត្រូវបានសង" : "ដោះស្រាយកាត់លុយលើកក្រោយ"
                                  }>
                                    <button type="button" onClick={() => handleResolveSupplierClaim(retPurchase, ret, openMoneyItemsForRow[0])}
                                      className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.confirm}`}>
                                      <FiCheckCircle size={17} />
                                    </button>
                                  </Tooltip>
                                )}
                                {retPurchase && (
                                  <Tooltip label="មើលការទិញ">
                                    <button type="button" onClick={() => openViewModal(retPurchase)}
                                      className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.view}`}>
                                      <FiEye size={17} />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className={`border-t ${theme.pageTitle} ${isDark ? "border-white/[0.06] bg-white/[0.035]" : "border-zinc-200 bg-zinc-50"}`}>
                              <td colSpan={8} className="px-6 pb-5 pt-2">
                                <div className={`rounded-xl border p-4 ${theme.tableWrap}`}>
                                  {/* Return meta */}
                                  <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                                    {ret.returnReason && (
                                      <span className={theme.muted}>
                                        មូលហេតុ: <span className="font-semibold text-current">{formatCondition(ret.returnReason)}</span>
                                      </span>
                                    )}
                                    {ret.subtotalUsd > 0 && (
                                      <span className={theme.muted}>
                                        ចំនួន: <span className="font-semibold text-red-500">${ret.subtotalUsd.toFixed(2)}</span>
                                      </span>
                                    )}
                                    {ret.note && (
                                      <span className={theme.muted}>
                                        កំណត់ចំណាំ: <span className="font-semibold text-current">{ret.note}</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Items table */}
                                  {retItems.length > 0 ? (
                                    <table className={`w-full text-xs ${theme.pageTitle}`}>
                                      <thead>
                                        <tr className={`border-b text-left ${theme.muted} ${isDark ? "border-white/[0.06]" : "border-zinc-200"}`}>
                                          <th className="pb-2 font-semibold pr-4">ផលិតផល</th>
                                          <th className="pb-2 font-semibold pr-4">ចំនួនត្រឡប់</th>
                                          <th className="pb-2 font-semibold pr-4">មូលហេតុ</th>
                                          <th className="pb-2 font-semibold pr-4">ស្ថានភាព</th>
                                          <th className="pb-2 font-semibold">សកម្មភាព</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {retItems.map((item, idx) => {
                                          const name = item.variant_name || item.variantName || item.product_name || "-";
                                          const unit = item.unit_name || item.unitName || "";
                                          const qty = Number(item.qty_returned || item.qtyReturned || item.qty || 0);
                                          const condition = formatCondition(item.condition);
                                          // Each item carries its own resolution type in a mixed claim — the
                                          // return-level ret.resolutionType reads "mixed" and would make every
                                          // item's detail fall into the same (wrong) branch below.
                                          const itemResolutionType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type) || ret.resolutionType;
                                          const resDetail = getReturnItemResolution(item, itemResolutionType, ret);
                                          // Confirm action lives per item here once a claim has 2+ open money
                                          // items (the row-level shortcut only covers the unambiguous single-item
                                          // case) — lets the supplier pay for one product now and another later
                                          // without the "confirm" click accidentally settling both at once.
                                          const itemStatus = normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status);
                                          const isOpenMoneyItem =
                                            ["refund", "credit_note"].includes(itemResolutionType) &&
                                            itemStatus !== RETURN_STATUS.COMPLETED &&
                                            itemStatus !== RETURN_STATUS.CANCELLED;
                                          return (
                                            <tr key={idx} className={`border-t ${isDark ? "border-white/[0.05]" : "border-zinc-200/60"}`}>
                                              <td className="py-2 pr-4 font-medium">{name}</td>
                                              <td className="py-2 pr-4">{qty} {unit}</td>
                                              <td className="py-2 pr-4">{condition || "-"}</td>
                                              <td className="py-2 pr-4">{resDetail}</td>
                                              <td className="py-2">
                                                {isOpenMoneyItem && retPurchase && openMoneyItemsForRow.length > 1 && (
                                                  <Tooltip label={itemResolutionType === "refund" ? "ប្រាក់ត្រូវបានសង" : "ដោះស្រាយកាត់លុយលើកក្រោយ"}>
                                                    <button
                                                      type="button"
                                                      onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleResolveSupplierClaim(retPurchase, ret, item);
                                                      }}
                                                      className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.confirm} h-8 w-8`}
                                                    >
                                                      <FiCheckCircle size={15} />
                                                    </button>
                                                  </Tooltip>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className={`text-xs ${theme.muted}`}>គ្មានទំនិញកត់ត្រាសម្រាប់ការត្រឡប់នេះ។</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <ListPagination theme={theme} currentPage={returnsPage} lastPage={returnsLastPage} onPageChange={setReturnsPage} />
          </div>
        )}

        {/* ── Payments Tab ── */}
        {activeTab === "payments" && (
          <div className="p-4 space-y-4">
            {/* Outstanding banner */}
            {totalOutstandingUsd > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-500/8 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/8">
                <div className="flex items-center gap-3">
                  <div className="table-icon-3d flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
                    <FiCreditCard className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">សរុបជំពាក់</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{fmtUsd(totalOutstandingUsd)}</p>
                  </div>
                </div>
                <p className={`text-xs ${theme.muted}`}>{unpaidCount} ការទិញមិនទាន់បង់</p>
              </div>
            )}

            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1.5">
                {[
                  { key: "outstanding", label: "ជំពាក់", count: unpaidCount },
                  { key: "paid", label: "បានបង់" },
                  { key: "all", label: "ទាំងអស់" },
                ].map((f) => (
                  <button key={f.key} type="button" onClick={() => setPaymentViewFilter(f.key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      paymentViewFilter === f.key
                        ? "bg-amber-500 text-white"
                        : `${theme.badge} hover:opacity-80`
                    }`}>
                    {f.label}
                    {f.count != null && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${paymentViewFilter === f.key ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-500"}`}>
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <FiSearch className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme.muted}`} />
                  <input type="text" placeholder="ស្វែងរកលេខ ឬអ្នកផ្គត់ផ្គង់..."
                    value={paymentSearchTerm} onChange={(e) => setPaymentSearchTerm(e.target.value)}
                    className={`h-9 w-full rounded-xl border pl-9 pr-3 text-xs outline-none transition focus:ring-2 ${theme.input}`} />
                </div>
                <p className={`text-xs ${theme.muted}`}>{paymentFilteredList.length} លទ្ធផល</p>
              </div>
            </div>

            {allPurchasesQuery.isLoading ? (
              <table className="w-full"><tbody><Purchase3DLoading theme={theme} colSpan={8} /></tbody></table>
            ) : paymentFilteredList.length === 0 ? (
              <EmptyState theme={theme} icon={<FiCheckCircle />}
                title={paymentViewFilter === "outstanding" ? "ការទូទាត់ទាំងអស់បានបញ្ចប់" : paymentViewFilter === "paid" ? "គ្មានការទិញបានបង់" : "គ្មានការទិញ"}
                description={paymentViewFilter === "outstanding" ? "គ្មានសមតុល្យជំពាក់លើការទិញណាមួយ។" : "រកមិនឃើញទំនាក់ទំនង។"} />
            ) : (
              <div className={`overflow-hidden rounded-xl border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                <table className="responsive-card-table w-full min-w-200 text-sm">
                  <thead className="bg-amber-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">លេខការទិញ</th>
                      <th className="px-4 py-3 text-left">អ្នកផ្គត់ផ្គង់</th>
                      <th className="px-4 py-3 text-left">កាលបរិច្ឆេទ</th>
                      <th className="px-4 py-3 text-left">សរុប</th>
                      <th className="px-4 py-3 text-left">បានបង់</th>
                      <th className="px-4 py-3 text-left">នៅសល់</th>
                      <th className="px-4 py-3 text-left">របៀប</th>
                      <th className="px-4 py-3 text-center">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentPageItems.map((purchase) => {
                      const balance = getPurchasePaymentBalance(purchase);
                      const hasBalance = hasPurchasePaymentBalance(purchase);
                      return (
                        <tr key={purchase.id} className={`border-t transition ${isDark ? "border-white/[0.06] hover:bg-white/[0.025]" : "border-zinc-200 hover:bg-zinc-50"} ${theme.row}`}>
                          <td data-label="លេខការទិញ" className="px-4 py-3 font-semibold">{purchase.purchaseNo}</td>
                          <td data-label="អ្នកផ្គត់ផ្គង់" className="px-4 py-3">{purchase.supplierName}</td>
                          <td data-label="កាលបរិច្ឆេទ" className="px-4 py-3">{purchase.purchaseDate || "-"}</td>
                          <td data-label="សរុប" className="px-4 py-3">{fmtUsd(purchase.grandTotalUsd || 0)}</td>
                          <td data-label="បានបង់" className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{fmtUsd(purchase.paidAmountUsd || 0)}</td>
                          <td data-label="នៅសល់" className={`px-4 py-3 font-semibold ${hasBalance ? "text-amber-500" : "text-emerald-500"}`}>
                            {fmtUsd(balance.usd)}
                          </td>
                          <td data-label="របៀប" className="px-4 py-3">{paymentModeOptions.find(o => o.value === purchase.paymentMode)?.label ?? (purchase.paymentMode || "-")}</td>
                          <td data-label="សកម្មភាព" className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {hasBalance && isPaymentReady(purchase) && (
                                <Tooltip label="កត់ការទូទាត់">
                                  <button
                                    type="button"
                                    onClick={async () => setRecordPaymentPurchase(await loadPurchaseDetail(purchase))}
                                    className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.confirm}`}
                                  >
                                    <FiCreditCard size={17} />
                                  </button>
                                </Tooltip>
                              )}
                              <Tooltip label="មើលការទិញ">
                                <button type="button" onClick={() => openViewModal(purchase)}
                                  className={`${PURCHASE_ACTION_ICON_CLASS} ${PURCHASE_ACTION_TONE.view}`}>
                                  <FiEye size={17} />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <ListPagination theme={theme} currentPage={paymentsPage} lastPage={paymentsLastPage} onPageChange={setPaymentsPage} />
          </div>
        )}

      </div>

      {modalMode === "view" && selectedPurchase && (
        <ViewPurchaseModal
          purchase={selectedPurchase}
          purchaseReturns={purchaseReturns}
          stockMovements={stockMovements}
          theme={theme}
          getStatusClass={getStatusClass}
          getStatusIcon={getStatusIcon}
          effectiveStatus={getEffectivePurchaseStatus(selectedPurchase)}
          problemLabel={(() => {
            const label = getPurchaseProblemLabel(selectedPurchase);
            // This modal's own payment summary already spells out the damaged-unit exclusion in
            // detail (see hasPayAfterCheckDamage in ViewPurchaseModal.jsx) — the short "N ខូចដកចេញ"
            // sub-line is only kept in the list/table views, where that detail isn't shown.
            return /ខូចដកចេញ$/.test(label) ? "" : label;
          })()}
          statusBadge={getPurchaseStatusBadge(selectedPurchase)}
          getPurchaseReturnStatusClass={getPurchaseReturnStatusClass}
          getPurchaseReturnStatusIcon={getPurchaseReturnStatusIcon}
          onClose={closeModal}
          onReturn={() => openPurchaseReturnModal(selectedPurchase)}
          onReceiveReplacement={(purchaseReturn) => handleReceiveReplacement(selectedPurchase, purchaseReturn)}
          onResolveClaim={(purchaseReturn, item) => handleResolveSupplierClaim(selectedPurchase, purchaseReturn, item)}
          onConfirmStockIn={() => handleConfirmStockIn(selectedPurchase)}
          onRecordPayment={() => setRecordPaymentPurchase(selectedPurchase)}
        />
      )}

      {recordPaymentPurchase && (
        <RecordPaymentModal
          purchase={recordPaymentPurchase}
          theme={theme}
          onClose={() => setRecordPaymentPurchase(null)}
          onSubmit={(payload) => recordPaymentMutation.mutate({ id: recordPaymentPurchase.id, payload })}
          isSaving={recordPaymentMutation.isPending}
        />
      )}

      {(modalMode === "add" || modalMode === "edit" || modalMode === "receive_goods") && (
        <PurchaseFormModal
          mode={modalMode}
          form={purchaseForm}
          errors={purchaseErrors}
          items={purchaseItems}
          suppliers={suppliers}
          theme={theme}
          onChange={handlePurchaseFormChange}
          onAddItem={openAddItemModal}
          onEditItem={openEditItemModal}
          onRemoveItem={handleRemoveItem}
          onClose={closeModal}
          onSavePrimary={() => handleSavePurchase(STATUS.PENDING_STOCK_IN)}
          primarySaveLabel={getPrimarySaveLabel()}
          isSaving={createPurchaseMutation.isPending || updatePurchaseMutation.isPending}
          supplierCreditBalance={modalMode === "add" ? supplierCreditBalance : null}
          creditAppliedMaxUsd={modalMode === "add" ? getCreditAppliedMaxUsd() : 0}
        />
      )}

      {modalMode === "purchase_return" && selectedPurchase && (
        <PurchaseReturnModal
          purchase={selectedPurchase}
          form={purchaseReturnForm}
          items={purchaseReturnItems}
          itemForm={purchaseReturnItemForm}
          errors={purchaseReturnErrors}
          itemErrors={purchaseReturnItemErrors}
          theme={theme}
          onChange={handlePurchaseReturnFormChange}
          onItemChange={handlePurchaseReturnItemFormChange}
          onAddItem={handleAddPurchaseReturnItem}
          onRemoveItem={(index) => setPurchaseReturnItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
          onUpdateItemField={(index, field, value) =>
            setPurchaseReturnItems((previous) =>
              previous.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
            )
          }
          getAvailableReturnQty={getAvailableReturnQty}
          onClose={closeModal}
          onSave={handleSavePurchaseReturn}
        />
      )}

      {resolveMoneyModalOpen && resolveMoneyReturn && (
        <ResolveMoneyClaimModal
          purchase={resolveMoneyPurchase}
          purchaseReturn={resolveMoneyReturn}
          theme={theme}
          onClose={() => setResolveMoneyModalOpen(false)}
          onSave={handleConfirmMoneyResolution}
          isSaving={resolveSupplierClaimMutation.isPending}
        />
      )}

      {replacementModalOpen && replacementPurchase && replacementReturn && (
        <ReceiveReplacementModal
          purchase={replacementPurchase}
          purchaseReturn={replacementReturn}
          items={replacementItems}
          errors={replacementErrors}
          theme={theme}
          onChangeItem={handleReplacementItemChange}
          onClose={closeReplacementModal}
          onSave={handleSaveReceiveReplacement}
          isSaving={receiveReplacementMutation.isPending}
        />
      )}

      {itemModalOpen && (
        <PurchaseItemModal
          mode={modalMode === "receive_goods" ? "receive" : itemEditIndex === null ? "add" : "edit"}
          form={itemForm}
          errors={itemErrors}
          variantUnits={variantUnits}
          exchangeRateUsed={Number(purchaseForm.exchangeRateUsed || activeExchangeRate || 0)}
          paymentMode={purchaseForm.paymentMode}
          theme={theme}
          onChange={handleItemFormChange}
          onClose={closeItemModal}
          onSave={handleSaveItem}
        />
      )}
    </section>
  );
}

function Purchase3DLoading({ theme, colSpan }) {
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
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-blue-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-blue-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-sky-300 border-r-indigo-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(30, 64, 175, 0.3), inset 4px 4px 10px rgba(255,255,255,0.38), inset -5px -7px 12px rgba(49,46,129,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiShoppingCart className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[11px] font-black text-emerald-950 shadow-lg shadow-emerald-400/40">
                +
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.pageTitle}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំបញ្ជីការទិញ
          </p>
        </div>
      </td>
    </tr>
  );
}

function getPageNumbers(currentPage, totalPages) {
  const current = Number(currentPage || 1);
  const total = Number(totalPages || 1);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [
      1,
      "...",
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}

// Client-side pagination footer for the ទទួលទំនិញ/ការទាមទារ/ការទូទាត់ tabs, which slice an
// already-fully-fetched list in memory rather than paginating server-side like the "បញ្ជាទិញ"
// tab — same visual style as that tab's own footer, just without a fetching/loading state to
// disable buttons against.
function ListPagination({ theme, currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;
  const pageNumbers = getPageNumbers(currentPage, lastPage);

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
      <p className={`text-xs ${theme.muted}`}>ទំព័រ {currentPage} នៃ {lastPage}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
          <FiChevronLeft /> មុន
        </button>
        {pageNumbers.map((item) => item === "..." ? (
          <span key={item} className={`px-2 text-sm font-semibold ${theme.muted}`}>...</span>
        ) : (
          <button key={item} type="button" onClick={() => onPageChange(item)}
            className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition hover:-translate-y-0.5 ${
              item === currentPage ? "quick-action-icon-3d bg-red-600 text-white" : "table-icon-3d border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            }`}>{item}
          </button>
        ))}
        <button type="button" disabled={currentPage >= lastPage}
          onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
          className="table-icon-3d inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
          បន្ទាប់ <FiChevronRight />
        </button>
      </div>
    </div>
  );
}
