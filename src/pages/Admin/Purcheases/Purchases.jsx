import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiDollarSign,
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
  createPurchaseApi,
  createPurchaseReturnApi,
  getPurchaseByIdApi,
  getPurchaseReturnsApi,
  getPurchaseStatsApi,
  getPurchasesApi,
  recordPurchasePaymentApi,
  syncPurchaseItemsApi,
  updatePurchaseApi,
  updatePurchaseReturnApi,
} from "../../../services/purchase.service";
import { getActiveSuppliersApi } from "../../../services/supplier.service";
import { getActiveExchangeRateApi } from "../../../services/exchangeRate.service";
import { getProductVariantUnitsApi } from "../../../services/productVariantUnit.service";
import { useNotification } from "../../../components/AppNotification";
import TableLoading from "../../../components/TableLoading";

import {
  EmptyState,
  FilterSelect,
  PurchaseFormModal,
  PurchaseItemModal,
  PurchaseMobileCard,
  PurchaseReturnModal,
  ReceiveReplacementModal,
  RecordPaymentModal,
  PurchaseTable,
  SummaryCard,
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
  STATUS,
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
  formatSnake,
  getErrorMessage,
  getPaginationMeta,
  normalizePurchase,
  normalizeDeliveryOption,
  normalizeDeliveryPaidBy,
  normalizeSupplier,
  normalizeVariantUnit,
  statusToApi,
  useLockBodyScroll,
} from "./utils/purchaseUtils";

export default function Purchases() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const theme = buildTheme(isDark);
  const queryClient = useQueryClient();
  const notify = useNotification();

  const [localPurchases, setLocalPurchases] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentModeFilter, setPaymentModeFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [modalMode, setModalMode] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [recordPaymentPurchase, setRecordPaymentPurchase] = useState(null);

  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [purchaseErrors, setPurchaseErrors] = useState({});

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

  useLockBodyScroll(Boolean(modalMode || itemModalOpen || replacementModalOpen));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, statusFilter, paymentModeFilter, perPage]);

  const purchasesQuery = useQuery({
    queryKey: [
      "purchases",
      {
        page,
        perPage,
        search: debouncedSearchTerm,
        statusFilter,
        paymentModeFilter,
      },
    ],
    queryFn: () =>
      getPurchasesApi({
        page,
        per_page: perPage,
        search: debouncedSearchTerm || undefined,
        status: statusFilter === "All" ? undefined : statusToApi(statusFilter),
        payment_mode:
          paymentModeFilter === "All" ? undefined : paymentModeFilter,
      }),
    keepPreviousData: true,
  });

  const purchaseStatsQuery = useQuery({
    queryKey: ["purchases", "stats"],
    queryFn: getPurchaseStatsApi,
    staleTime: 1000 * 60,
  });

  const purchaseReturnsQuery = useQuery({
    queryKey: ["purchase-returns", "purchase-page"],
    queryFn: () => getPurchaseReturnsApi({ per_page: 500 }),
    staleTime: 1000 * 60,
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "active-for-purchases"],
    queryFn: () => getActiveSuppliersApi({ per_page: 500 }),
    staleTime: 1000 * 60 * 5,
  });

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
      returnDate: item.return_date || item.returnDate || "",
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
  const pagination = useMemo(() => {
    return getPaginationMeta(purchasesQuery.data, purchases.length);
  }, [purchasesQuery.data, purchases.length]);
  const pageNumbers = useMemo(
    () => getPageNumbers(pagination.currentPage, pagination.lastPage),
    [pagination.currentPage, pagination.lastPage]
  );

  const calculateSubtotal = (items) => items.reduce((total, item) => total + Number(item.lineTotal || 0), 0);

  const calculateGrandTotal = (items, form) => {
    const subtotal = calculateSubtotal(items);
    return Number(subtotal || 0) - Number(form.discountTotal || 0) + Number(form.deliveryFee || 0);
  };

  const calculateLineTotalByPaymentMode = ({ paymentMode, acceptedQty, paidQty, unitCost }) => {
    if (paymentMode === "pay_after_check") return Number(acceptedQty || 0) * Number(unitCost || 0);
    return Number(paidQty || 0) * Number(unitCost || 0);
  };

  const calculateBalanceAmount = (grandTotal, paidAmount) => Math.max(0, Number(grandTotal || 0) - Number(paidAmount || 0));

  const getClaimRequiredCount = (purchase) => purchase.items.reduce((total, item) => total + Number(item.claimQty || 0), 0);
  const getDamagedCount = (purchase) => purchase.items.reduce((total, item) => total + Number(item.damagedQty || 0), 0);

  const filteredPurchases = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return purchases.filter((purchase) => {
      const matchesSearch =
        purchase.purchaseNo.toLowerCase().includes(search) ||
        purchase.supplierName.toLowerCase().includes(search) ||
        purchase.note.toLowerCase().includes(search) ||
        purchase.items.some(
          (item) => item.variantName.toLowerCase().includes(search) || item.variantCode.toLowerCase().includes(search)
        );

      const matchesStatus = statusFilter === "All" || purchase.status === statusFilter;
      const matchesPaymentMode = paymentModeFilter === "All" || purchase.paymentMode === paymentModeFilter;
      return matchesSearch && matchesStatus && matchesPaymentMode;
    });
  }, [purchases, searchTerm, statusFilter, paymentModeFilter]);

  const totalPurchaseReturnAmount = purchaseReturns.reduce((total, item) => total + Number(item.subtotal || 0), 0);

  const getStatusClass = (status) => {
    if (status === STATUS.RECEIVED) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (status === STATUS.PENDING_STOCK_IN) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (status === STATUS.PENDING_RECEIVE) return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
    if (status === STATUS.PENDING_CLAIM) return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (status === STATUS.DRAFT) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400";
  };

  const getStatusIcon = (status) => {
    if (status === STATUS.RECEIVED) return <FiCheckCircle />;
    if (status === STATUS.PENDING_STOCK_IN) return <FiClock />;
    if (status === STATUS.PENDING_RECEIVE) return <FiTruck />;
    if (status === STATUS.PENDING_CLAIM) return <FiAlertTriangle />;
    if (status === STATUS.DRAFT) return <FiFileText />;
    return <FiXCircle />;
  };

  const getPurchaseReturnStatusClass = (status) => {
    if (status === RETURN_STATUS.COMPLETED) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (status === RETURN_STATUS.SUBMITTED || status === RETURN_STATUS.APPROVED) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (status === RETURN_STATUS.WAITING_REPLACEMENT) return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
    if (status === RETURN_STATUS.DRAFT) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    if (status === RETURN_STATUS.REJECTED) return "bg-red-500/10 text-red-600 dark:text-red-400";
    return "bg-red-500/10 text-red-500 dark:text-red-400";
  };

  const getPurchaseReturnStatusIcon = (status) => {
    if (status === RETURN_STATUS.COMPLETED) return <FiCheckCircle />;
    if (status === RETURN_STATUS.SUBMITTED || status === RETURN_STATUS.APPROVED) return <FiClock />;
    if (status === RETURN_STATUS.WAITING_REPLACEMENT) return <FiTruck />;
    if (status === RETURN_STATUS.DRAFT) return <FiFileText />;
    if (status === RETURN_STATUS.REJECTED) return <FiXCircle />;
    return <FiXCircle />;
  };

  const normalizeReturnStatusLabel = (value = RETURN_STATUS.DRAFT) => {
    const status = String(value || "").trim().toLowerCase();
    const map = {
      submitted: RETURN_STATUS.SUBMITTED,
      approved: RETURN_STATUS.APPROVED,
      rejected: RETURN_STATUS.REJECTED,
      resolved: RETURN_STATUS.COMPLETED,
      completed: RETURN_STATUS.COMPLETED,
      cancelled: RETURN_STATUS.CANCELLED,
      canceled: RETURN_STATUS.CANCELLED,
    };
    return map[status] || value || RETURN_STATUS.SUBMITTED;
  };

  const getRelatedPurchaseReturns = (purchase) => {
    if (!purchase?.id) return [];
    const fromPurchase = Array.isArray(purchase.returns) ? purchase.returns : [];
    const fromQuery = purchaseReturns.filter((item) => String(item.purchaseId) === String(purchase.id));
    const merged = [...fromPurchase, ...fromQuery];
    return merged.filter((item, index, list) => list.findIndex((current) => String(current.id) === String(item.id)) === index);
  };

  const getOpenSupplierClaim = (purchase) => {
    return getRelatedPurchaseReturns(purchase).find((item) =>
      ![RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(
        normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status)
      )
    );
  };

  const hasResolvedSupplierClaim = (purchase) => {
    return getRelatedPurchaseReturns(purchase).some((item) =>
      normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status) === RETURN_STATUS.COMPLETED
    );
  };

  const getEffectivePurchaseStatus = (purchase) => {
    if (purchase.status === STATUS.PENDING_CLAIM && hasResolvedSupplierClaim(purchase) && !getOpenSupplierClaim(purchase)) {
      return STATUS.PENDING_STOCK_IN;
    }
    return purchase.status;
  };

  const getPurchaseLines = (purchase = {}) => {
    const items = Array.isArray(purchase.items) ? purchase.items : [];
    if (items.length > 0) return items;
    return Array.isArray(purchase.summaryItems) ? purchase.summaryItems : [];
  };

  const getRemainingStockInQty = (item = {}) => {
    const directRemaining = Number(item.remainingStockInQty ?? item.remaining_stock_in_qty ?? 0);
    if (directRemaining > 0) return directRemaining;

    const conversionQty = Number(item.conversionQty ?? item.conversion_qty ?? 1) || 1;
    const acceptedBaseQty = Number(item.acceptedBaseQty ?? item.accepted_base_qty ?? 0);
    const stockedInBaseQty = Number(item.stockedInBaseQty ?? item.stocked_in_base_qty ?? 0);
    if (acceptedBaseQty > 0 || stockedInBaseQty > 0) return Math.max(0, acceptedBaseQty - stockedInBaseQty);

    const acceptedQty = Number(item.acceptedQty ?? item.accepted_qty ?? 0);
    const stockedInQty = Number(item.stockedInQty ?? item.stocked_in_qty ?? 0);
    return Math.max(0, (acceptedQty - stockedInQty) * conversionQty);
  };

  const hasRemainingStockInQty = (purchase) =>
    getPurchaseLines(purchase).some((item) => getRemainingStockInQty(item) > 0);

  const hasAnyStockedInQty = (purchase) =>
    getPurchaseLines(purchase).some((item) => Number(item.stockedInQty ?? item.stocked_in_qty ?? 0) > 0);

  const hasPendingReplacementStockIn = (purchase) =>
    getRelatedPurchaseReturns(purchase).some((item) => {
      const resolutionType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type || "");
      const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
      const stockedQty = Number(item.replacementStockedInQty ?? item.replacement_stocked_in_qty ?? 0);
      return resolutionType === "replacement" && receivedQty > stockedQty;
    });

  const pendingReceive = purchases.filter((item) => getEffectivePurchaseStatus(item) === STATUS.PENDING_RECEIVE).length;
  const pendingStockIn = purchases.filter((item) => getEffectivePurchaseStatus(item) === STATUS.PENDING_STOCK_IN).length;
  const pendingClaims = purchases.filter((item) => getEffectivePurchaseStatus(item) === STATUS.PENDING_CLAIM).length;
  const purchaseStats = extractApiObject(purchaseStatsQuery.data) || {};
  const totalPurchasesCount = Number(purchaseStats.total_purchases ?? purchaseStats.totalPurchases ?? pagination.total ?? purchases.length);
  const pendingReceiveCount = Number(purchaseStats.pending_receive ?? purchaseStats.pendingReceive ?? pendingReceive);
  const pendingStockInCount = Number(purchaseStats.pending_stock_in ?? purchaseStats.pendingStockIn ?? pendingStockIn);
  const pendingClaimsCount = Number(purchaseStats.pending_claim ?? purchaseStats.pendingClaim ?? pendingClaims);
  const totalGrandUsd = Number(purchaseStats.total_grand_usd ?? 0);
  const totalGrandKhr = Number(purchaseStats.total_grand_khr ?? 0);
  const totalBalanceUsd = Number(purchaseStats.total_balance_usd ?? 0);
  const totalBalanceKhr = Number(purchaseStats.total_balance_khr ?? 0);

  const fmtUsd = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtKhr = (n) => `៛${Math.round(n).toLocaleString("en-US")}`;

  const getOpenReplacementClaim = (purchase) => {
    return getRelatedPurchaseReturns(purchase).find((item) => {
      const status = normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status);
      const resolutionType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
      return resolutionType === "replacement" && status !== RETURN_STATUS.COMPLETED && status !== RETURN_STATUS.CANCELLED;
    });
  };

  const getOpenMoneyClaim = (purchase) => {
    return getRelatedPurchaseReturns(purchase).find((item) => {
      const status = normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status);
      const resolutionType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
      return ["refund", "credit_note"].includes(resolutionType) && status !== RETURN_STATUS.COMPLETED && status !== RETURN_STATUS.CANCELLED;
    });
  };

  const getPurchaseProblemLabel = (purchase) => {
    const claimQty = getClaimRequiredCount(purchase);
    const damagedQty = getDamagedCount(purchase);
    const replacementClaim = getOpenReplacementClaim(purchase);
    const moneyClaim = getOpenMoneyClaim(purchase);
    if (replacementClaim) return "Waiting supplier replacement";
    if (moneyClaim) {
      const resolutionType = normalizeReturnResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type);
      return resolutionType === "refund" ? "Waiting refund from supplier" : "Credit note pending";
    }
    if (purchase.status === STATUS.PENDING_CLAIM && hasResolvedSupplierClaim(purchase) && !getOpenSupplierClaim(purchase)) return "Supplier claim resolved";
    if (getOpenSupplierClaim(purchase)) return "Supplier claim created";
    if ((purchase.paymentMode === "prepaid" || purchase.paymentMode === "partial_prepaid") && claimQty > 0) return `${claimQty} claim required`;
    if (purchase.paymentMode === "pay_after_check" && damagedQty > 0) return `${damagedQty} damaged excluded`;
    if (purchase.status === STATUS.PENDING_RECEIVE) return "Waiting goods";
    return "";
  };

  const getNextActionLabel = (purchase) => {
    const effectiveStatus = getEffectivePurchaseStatus(purchase);
    if (effectiveStatus === STATUS.DRAFT) return "Continue editing";
    if (effectiveStatus === STATUS.PENDING_RECEIVE) return "Receive goods";
    if (getOpenReplacementClaim(purchase)) return "Receive replacement";
    const moneyClaim = getOpenMoneyClaim(purchase);
    if (moneyClaim) {
      const resolutionType = normalizeReturnResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type);
      return resolutionType === "refund" ? "Mark refund received" : "Resolve credit note";
    }
    if (getOpenSupplierClaim(purchase)) return "Supplier claim created";
    if (effectiveStatus === STATUS.PENDING_CLAIM) return "Create supplier claim";
    if (effectiveStatus === STATUS.PENDING_STOCK_IN) return "Open Inventory";
    if (effectiveStatus === STATUS.RECEIVED) return "Completed";
    return "No action";
  };

  const getPrimarySaveLabel = () => {
    if (modalMode === "receive_goods") return "Save Receiving";
    if (purchaseForm.paymentMode === "pay_after_check") return "Save as Pending Stock In";
    if (purchaseForm.paymentMode === "prepaid" || purchaseForm.paymentMode === "partial_prepaid") {
      const hasReceived = purchaseItems.some((item) => Number(item.receivedQty || 0) > 0);
      const hasClaim = purchaseItems.some((item) => Number(item.claimQty || 0) > 0);
      if (!hasReceived) return "Save as Pending Receive";
      if (hasClaim) return "Save as Pending Claim";
      return "Save as Pending Stock In";
    }
    return "Save Purchase";
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
      notify.success("Purchase created", "The purchase invoice has been saved.");
      closeModal();
    },
    onError: (error) => {
      notify.error("Create failed", getErrorMessage(error));
    },
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: updatePurchaseApi,
    onSuccess: () => {
      invalidatePurchaseQueries();
      notify.success("Purchase updated", "The purchase invoice has been updated.");
      closeModal();
    },
    onError: (error) => {
      notify.error("Update failed", getErrorMessage(error));
    },
  });

  const createPurchaseReturnMutation = useMutation({
    mutationFn: createPurchaseReturnApi,
    onSuccess: () => {
      invalidatePurchaseQueries();
      notify.success("Supplier claim saved", "The purchase return has been saved.");
      closeModal();
    },
    onError: (error) => {
      notify.error("Claim failed", getErrorMessage(error));
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
      notify.success("Replacement received", "Supplier replacement has been marked as received.");
      closeReplacementModal();
      closeModal();
    },
    onError: (error) => {
      notify.error("Receive replacement failed", getErrorMessage(error));
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
      notify.success("Supplier claim resolved", "The refund or credit note has been marked as completed.");
      closeModal();
    },
    onError: (error) => {
      notify.error("Resolve claim failed", getErrorMessage(error));
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
        notify.success("Payment completed", "Purchase has been fully paid.");
        closeModal();
      } else {
        notify.success("Payment recorded", "Partial payment has been recorded successfully.");
      }
    },
    onError: (error) => {
      notify.error("Record payment failed", getErrorMessage(error));
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
    setPurchaseForm({
      ...emptyPurchaseForm,
      purchaseNo: `PUR-${dateKey}-${String((pagination.total || purchases.length) + 1).padStart(4, "0")}`,
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
      note: detail.note,
      status: detail.status,
    });
    setPurchaseItems(detail.items || []);
    setModalMode("edit");
  };

  const openReceiveGoodsModal = async (purchase) => {
    const detail = await loadPurchaseDetail(purchase);
    setSelectedPurchase(detail);
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
      paymentStatus: detail.paymentStatus || "paid",
      discountTotal: detail.discountTotal,
      discountCurrency: detail.discountCurrency || "USD",
      deliveryOption: detail.deliveryOption,
      deliveryFee: detail.deliveryFee,
      deliveryFeeCurrency: detail.deliveryFeeCurrency,
      deliveryPaidBy: detail.deliveryPaidBy,
      paidAmount: detail.paidAmount || 0,
      paidCurrency: detail.paidCurrency || "USD",
      note: detail.note,
      status: detail.status,
    });
    setPurchaseItems(detail.items || []);
    setModalMode("receive_goods");
  };

  const openPurchaseReturnModal = async (purchase) => {
    const detail = await loadPurchaseDetail(purchase);
    const claimItems = (detail.items || [])
      .filter((item) => Number(item.claimQty || 0) > 0 || Number(item.damagedQty || 0) > 0)
      .map((item) =>
        buildPurchaseReturnItemFromPurchaseItem(item, {
          purchaseContext: detail,
          qtyReturned: Number(item.claimQty || item.damagedQty || 0),
          condition: "damaged",
          reason: "Damaged item claimed to supplier.",
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

  const handlePurchaseFormChange = (field, value) => {
    setPurchaseForm((previous) => {
      const next = { ...previous, [field]: value };

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
        }
      }

      if (field === "paymentStatus" && value === "paid") {
        const grandTotal = calculateGrandTotal(purchaseItems, next);
        next.paidAmount = grandTotal;
      }

      return next;
    });

    setPurchaseErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const openAddItemModal = () => {
    setItemErrors({});
    setItemEditIndex(null);
    setItemForm({
      ...emptyItemForm,
      receivedQty: purchaseForm.paymentMode === "prepaid" ? 0 : "",
      acceptedQty: purchaseForm.paymentMode === "prepaid" ? 0 : "",
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
      inputUnitCost: item.inputUnitCost || item.unitCost,
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

      if (field === "invoicedQty") {
        if (purchaseForm.paymentMode === "pay_after_check" && next.receivedQty === "") {
          next.receivedQty = value;
          next.acceptedQty = value;
        }
        if (purchaseForm.paymentMode === "prepaid") next.paidQty = value;
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

  const validatePurchaseItem = () => {
    const nextErrors = {};
    const selectedUnit = variantUnits.find((unit) => String(unit.id) === String(itemForm.variantUnitId));

    if (!itemForm.variantUnitId) nextErrors.variantUnitId = "Please select product variant.";
    if (!itemForm.inputCurrency) nextErrors.inputCurrency = "Currency is required.";
    if (!itemForm.inputUnitCost || Number(itemForm.inputUnitCost) <= 0) nextErrors.inputUnitCost = "Unit cost must be greater than 0.";
    if (!itemForm.invoicedQty || Number(itemForm.invoicedQty) <= 0) nextErrors.invoicedQty = "Invoiced quantity must be greater than 0.";
    if (purchaseForm.paymentMode === "partial_prepaid" && (itemForm.paidQty === "" || Number(itemForm.paidQty) < 0)) nextErrors.paidQty = "Paid quantity is required.";
    if (Number(itemForm.paidQty || 0) > Number(itemForm.invoicedQty || 0)) nextErrors.paidQty = "Paid quantity cannot exceed invoiced qty.";
    if (itemForm.receivedQty === "" || Number(itemForm.receivedQty) < 0) nextErrors.receivedQty = "Received quantity cannot be negative.";
    if (itemForm.acceptedQty === "" || Number(itemForm.acceptedQty) < 0) nextErrors.acceptedQty = "Accepted quantity cannot be negative.";
    if (Number(itemForm.acceptedQty || 0) > Number(itemForm.invoicedQty || 0)) nextErrors.acceptedQty = "Accepted quantity cannot exceed invoiced qty.";
    if (Number(itemForm.acceptedQty || 0) + Number(itemForm.damagedQty || 0) > Number(itemForm.invoicedQty || 0)) nextErrors.damagedQty = "Accepted plus damaged qty cannot exceed invoiced qty.";
    if (Number(itemForm.acceptedQty || 0) > Number(itemForm.receivedQty || 0)) nextErrors.acceptedQty = "Accepted quantity cannot exceed received qty.";
    if (Number(itemForm.damagedQty || 0) < 0) nextErrors.damagedQty = "Damaged quantity cannot be negative.";
    if (selectedUnit?.isExpirable && Number(itemForm.receivedQty || 0) > 0 && !itemForm.expiredDate) {
      nextErrors.expiredDate = "Expiry date is required after goods are received.";
    }

    setItemErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPurchaseItemFromForm = () => {
    const selectedUnit = variantUnits.find((unit) => String(unit.id) === String(itemForm.variantUnitId));
    if (!selectedUnit) return null;

    const paymentMode = purchaseForm.paymentMode;
    const invoicedQty = Number(itemForm.invoicedQty || 0);
    const receivedQty = Number(itemForm.receivedQty || 0);
    const acceptedQty = Number(itemForm.acceptedQty || 0);
    const damagedQty = Number(itemForm.damagedQty || 0);
    const inputCurrency = itemForm.inputCurrency || "USD";
    const inputUnitCost = Number(itemForm.inputUnitCost || itemForm.unitCost || 0);
    const exchangeRate = Number(purchaseForm.exchangeRateUsed || activeExchangeRate || 0);
    const { unitCostUsd, unitCostKhr } = convertCost({
      inputCurrency,
      inputUnitCost,
      exchangeRate,
    });

    let paidQty = Number(itemForm.paidQty || 0);
    let claimQty = Number(itemForm.claimQty || 0);

    if (paymentMode === "pay_after_check") {
      paidQty = acceptedQty;
      claimQty = 0;
    }

    if (paymentMode === "prepaid") {
      paidQty = invoicedQty;
      claimQty = damagedQty;
    }

    if (paymentMode === "partial_prepaid") {
      claimQty = Math.max(0, paidQty - acceptedQty);
    }

    const lineTotalUsd = calculateLineTotalByPaymentMode({ paymentMode, acceptedQty, paidQty, unitCost: unitCostUsd });
    const lineTotalKhr = calculateLineTotalByPaymentMode({ paymentMode, acceptedQty, paidQty, unitCost: unitCostKhr });
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
      unitCost: unitCostUsd,
      unitCostUsd,
      unitCostKhr,
      unitCostBase,
      lineTotal: lineTotalUsd,
      lineTotalUsd,
      lineTotalKhr,
      expiredDate: itemForm.expiredDate || "",
    };
  };

  const handleSaveItem = () => {
    if (!validatePurchaseItem()) return;

    const item = buildPurchaseItemFromForm();
    if (!item) {
      setItemErrors({ variantUnitId: "Invalid purchase item." });
      return;
    }

    if (itemEditIndex !== null) {
      setPurchaseItems((previous) => previous.map((row, index) => (index === itemEditIndex ? { ...item, id: row.id } : row)));
    } else {
      setPurchaseItems((previous) => [...previous, item]);
    }

    closeItemModal();
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setPurchaseErrors((previous) => ({ ...previous, items: "" }));
  };

  const validatePurchaseForm = () => {
    const nextErrors = {};
    const requiresPaymentInfo = purchaseForm.paymentMode !== "pay_after_check";
    if (!purchaseForm.purchaseNo.trim()) nextErrors.purchaseNo = "Purchase number is required.";
    if (!purchaseForm.supplierId) nextErrors.supplierId = "Please select supplier.";
    if (!purchaseForm.purchaseDate) nextErrors.purchaseDate = "Purchase date is required.";
    if (requiresPaymentInfo && (!purchaseForm.exchangeRateUsed || Number(purchaseForm.exchangeRateUsed) <= 0)) nextErrors.exchangeRateUsed = "Exchange rate must be greater than 0.";
    if (!purchaseForm.paymentMode) nextErrors.paymentMode = "Payment mode is required.";
    if (requiresPaymentInfo && !purchaseForm.paymentStatus) nextErrors.paymentStatus = "Payment status is required.";
    if (Number(purchaseForm.discountTotal || 0) < 0) nextErrors.discountTotal = "Discount cannot be negative.";
    if (Number(purchaseForm.deliveryFee || 0) < 0) nextErrors.deliveryFee = "Delivery fee cannot be negative.";
    if (requiresPaymentInfo && Number(purchaseForm.paidAmount || 0) < 0) nextErrors.paidAmount = "Paid amount cannot be negative.";
    if (purchaseItems.length === 0) nextErrors.items = "Please add at least one purchase item.";

    const totals = calculateCurrencyPreview({
      items: purchaseItems,
      form: purchaseForm,
    });

    if (
      requiresPaymentInfo &&
      purchaseForm.paymentStatus !== "paid" &&
      (totals.paidAmountUsd > totals.grandTotalUsd + 0.0001 ||
        totals.paidAmountKhr > totals.grandTotalKhr + 1)
    ) {
      nextErrors.paidAmount = "Paid amount cannot exceed grand total.";
    }

    setPurchaseErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPurchasePayload = (statusOverride = null) => {
    const supplier = suppliers.find((item) => String(item.id) === String(purchaseForm.supplierId));
    const subtotal = calculateSubtotal(purchaseItems);
    const grandTotal = calculateGrandTotal(purchaseItems, purchaseForm);
    const paidAmount =
      purchaseForm.paymentMode === "pay_after_check"
        ? 0
        : purchaseForm.paymentStatus === "paid"
          ? grandTotal
          : Number(purchaseForm.paidAmount || 0);
    const balanceAmount = calculateBalanceAmount(grandTotal, paidAmount);
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

    return {
      id: selectedPurchase?.id || Date.now(),
      purchaseNo: purchaseForm.purchaseNo.trim(),
      supplierId: supplier?.id || "",
      supplierName: supplier?.name || "",
      createdBy: "Admin",
      purchaseDate: purchaseForm.purchaseDate,
      inputCurrency: purchaseForm.inputCurrency || "USD",
      exchangeRateUsed: Number(purchaseForm.exchangeRateUsed || activeExchangeRate || 0),
      paymentMode: purchaseForm.paymentMode,
      paymentStatus: purchaseForm.paymentStatus,
      subtotal,
      discountTotal: Number(purchaseForm.discountTotal || 0),
      deliveryOption: purchaseForm.deliveryOption,
      deliveryFee: Number(purchaseForm.deliveryFee || 0),
      deliveryFeeCurrency: purchaseForm.deliveryFeeCurrency,
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
    const payableQty =
      paymentMode === "pay_after_check"
        ? Number(item.acceptedQty || 0)
        : Number(item.paidQty ?? item.invoicedQty ?? 0);

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
      line_total_usd: Number(item.lineTotalUsd ?? item.lineTotal ?? payableQty * unitCostUsd),
      line_total_khr: Number(item.lineTotalKhr ?? payableQty * unitCostKhr),
      expired_date: expiredDate === "-" ? null : expiredDate,
      expiry_date: expiredDate === "-" ? null : expiredDate,
    };
  };

  const buildBackendPurchasePayload = (statusOverride = null) => {
    const localPayload = buildPurchasePayload(statusOverride);
    const totals = calculateCurrencyPreview({
      items: purchaseItems,
      form: purchaseForm,
    });
    const exchangeRateForApi = Number(purchaseForm.exchangeRateUsed || activeExchangeRate || 0);

    return {
      purchase_no: localPayload.purchaseNo,
      supplier_id: localPayload.supplierId,
      purchase_date: localPayload.purchaseDate,
      input_currency: currencyToApi(purchaseForm.inputCurrency || "USD"),
      exchange_rate_used: exchangeRateForApi > 0 ? exchangeRateForApi : null,
      khr_rounding: purchaseForm.khrRounding || "floor",
      exchange_rate_source: purchaseForm.exchangeRateSource || "manual",
      exchange_rate_note: purchaseForm.exchangeRateNote || null,
      payment_mode: localPayload.paymentMode,
      payment_status: localPayload.paymentStatus,
      status: statusToApi(localPayload.status),
      subtotal_usd: Number(totals.subtotalUsd || 0),
      subtotal_khr: Number(totals.subtotalKhr || 0),
      discount_currency: currencyToApi(purchaseForm.discountCurrency || "USD"),
      discount_amount_input: Number(purchaseForm.discountTotal || 0),
      discount_total_usd: Number(totals.discountUsd || 0),
      discount_total_khr: Number(totals.discountKhr || 0),
      delivery_option: normalizeDeliveryOption(localPayload.deliveryOption),
      delivery_fee_currency: currencyToApi(localPayload.deliveryFeeCurrency || "USD"),
      delivery_fee_input: Number(purchaseForm.deliveryFee || 0),
      delivery_fee_usd: Number(totals.deliveryUsd || 0),
      delivery_fee_khr: Number(totals.deliveryKhr || 0),
      delivery_paid_by: normalizeDeliveryPaidBy(localPayload.deliveryPaidBy),
      grand_total_usd: Number(totals.grandTotalUsd || 0),
      grand_total_khr: Number(totals.grandTotalKhr || 0),
      paid_currency: currencyToApi(purchaseForm.paidCurrency || "USD"),
      paid_amount_input: Number(
        purchaseForm.paymentStatus === "paid"
          ? purchaseForm.paidCurrency === "KHR"
            ? totals.grandTotalKhr
            : totals.grandTotalUsd
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

      return {
        ...item,
        unitCost: unitCostUsd,
        unitCostUsd,
        unitCostKhr,
        lineTotal: payableQty * unitCostUsd,
        lineTotalUsd: payableQty * unitCostUsd,
        lineTotalKhr: payableQty * unitCostKhr,
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
        createPurchaseMutation.mutate(backendPayload);
        return;
      }

      setLocalPurchases((previous) => [payload, ...previous]);
      notify.success("Purchase created", "The purchase invoice has been saved.");
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
      notify.success("Purchase updated", "The purchase invoice has been updated.");
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
      (effectiveStatus === STATUS.PENDING_STOCK_IN && (hasRemainingStock || hasReplacementStockIn || purchaseLines.length === 0)) ||
      (effectiveStatus === STATUS.PENDING_CLAIM && hasRemainingStock && !hasStockedIn);

    if (!canOpenInventory) return;

    // IMPORTANT UX / DATA-SAFETY RULE:
    // Purchases prepares a purchase for stock-in only.
    // The actual inventory update must happen one time in the Inventory module.
    // This prevents double stock-in when the user also confirms from Inventory.
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

  const buildReplacementItemFromPurchaseItem = (purchaseItem, qty, returnItem = null) => {
    const replacementQty = Number(qty || purchaseItem.claimQty || purchaseItem.damagedQty || 0);
    const originalExpiry = formatDateOnly(purchaseItem.expiredDate);

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
    const returnItems = getReturnItems(purchaseReturn);
    const claimItems = (purchase.items || []).filter((item) => Number(item.claimQty || 0) > 0);
    const fallbackQty = Number(
      purchaseReturn?.replacement_qty ??
        purchaseReturn?.replacementQty ??
        claimItems.reduce((total, item) => total + Number(item.claimQty || 0), 0)
    );

    if (returnItems.length === 0 && fallbackQty > 0) {
      const purchaseItem = claimItems[0];
      if (!purchaseItem) return [];
      return [buildReplacementItemFromPurchaseItem(purchaseItem, fallbackQty)];
    }

    const mappedItems = returnItems
      .map((returnItem) => {
        const purchaseItemId = getReturnItemPurchaseItemId(returnItem);
        const purchaseItem =
          (purchase.items || []).find((item) => String(item.id) === String(purchaseItemId)) ||
          (claimItems.length === 1 ? claimItems[0] : null);
        if (!purchaseItem) return null;

        const qty = getReturnItemReplacementQty(returnItem) || Number(purchaseItem.claimQty || 0);
        return buildReplacementItemFromPurchaseItem(purchaseItem, qty, returnItem);
      })
      .filter(Boolean)
      .filter((item) => Number(item.qty || 0) > 0);

    if (mappedItems.length > 0) return mappedItems;

    if (claimItems.length === 0) return [];
    if (claimItems.length === 1) {
      return [buildReplacementItemFromPurchaseItem(claimItems[0], fallbackQty || claimItems[0].claimQty)];
    }

    return claimItems.map((item) => buildReplacementItemFromPurchaseItem(item, item.claimQty));
  };

  const handleReceiveReplacement = async (purchase, purchaseReturn = null) => {
    const detail = await loadPurchaseDetail(purchase);
    const activeReturn = purchaseReturn || getOpenReplacementClaim(detail) || getOpenReplacementClaim(purchase);
    if (!activeReturn) return;

    const items = buildReplacementItems(detail, activeReturn);
    if (items.length === 0) {
      notify.error("Receive replacement failed", "No replacement item is available for this supplier claim.");
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
        itemErrors[index] = { expiryDate: "Replacement expiry date is required." };
      }
      if (Number(item.qty || 0) <= 0) {
        itemErrors[index] = { ...(itemErrors[index] || {}), qty: "Replacement quantity must be greater than 0." };
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
        `Supplier replacement received for claim ${purchaseReturn.purchaseReturnNo || purchaseReturn.purchase_return_no || ""} from purchase ${purchase.purchaseNo || purchase.purchase_no || ""}.`,
      resolved_at: now,
      replacement_items: items.map((item) => ({
        purchase_return_item_id: item.returnItemId || null,
        purchase_item_id: item.purchaseItemId,
        lot_no: item.lotNo || null,
        expired_date: formatDateOnly(item.expiryDate) || null,
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
    notify.success("Replacement received", "Supplier replacement has been marked as received.");
    closeReplacementModal();
    closeModal();
  };

  const handleResolveSupplierClaim = (purchase, claim) => {
    if (!claim) return;

    const resolutionType = normalizeReturnResolutionType(claim.resolutionType || claim.resolution_type || "");
    const now = new Date().toISOString().slice(0, 10);
    const isRefund = resolutionType === "refund";
    const isCredit = resolutionType === "credit_note";
    const actionLabel = isRefund ? "mark this refund as received" : "mark this credit note as resolved";
    const ok = window.confirm(`Do you want to ${actionLabel} for ${claim.purchaseReturnNo || claim.purchase_return_no || "this supplier claim"}?`);
    if (!ok) return;

    const payload = {
      resolution_type: resolutionType,
      resolution_status: "resolved",
      status: "resolved",
      resolved_at: now,
      note: claim.note || "",
    };

    if (isRefund) {
      payload.refund_status = "received";
      payload.refund_amount_usd = Number(claim.refundAmountUsd ?? claim.refund_amount_usd ?? claim.subtotalUsd ?? claim.subtotal ?? 0);
      payload.refund_amount_khr = Number(claim.refundAmountKhr ?? claim.refund_amount_khr ?? claim.subtotalKhr ?? 0);
      payload.refunded_at = now;
    }

    if (isCredit) {
      payload.credit_status = "issued";
      payload.credit_amount_usd = Number(claim.creditAmountUsd ?? claim.credit_amount_usd ?? claim.subtotalUsd ?? claim.subtotal ?? 0);
      payload.credit_amount_khr = Number(claim.creditAmountKhr ?? claim.credit_amount_khr ?? claim.subtotalKhr ?? 0);
    }

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
              refundedAt: isRefund ? now : item.refundedAt,
              creditStatus: isCredit ? "issued" : item.creditStatus,
              resolvedAt: now,
            }
          : item
      )
    );
    notify.success("Supplier claim resolved", "The refund or credit note has been marked as completed.");
    closeModal();
  };

  const handleCancelPurchase = (purchase) => {
    const ok = window.confirm(`Cancel ${purchase.purchaseNo}?`);
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

  const getAvailableReturnQty = (purchaseItem) => {
    const alreadyReturnedQty = purchaseReturnItems
      .filter((item) => item.purchaseItemId === purchaseItem.id)
      .reduce((total, item) => total + Number(item.qtyReturned || 0), 0);

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

  const normalizeReturnResolutionType = (value = "replacement") => {
    if (value === "credit") return "credit_note";
    return value || "replacement";
  };

  const buildPurchaseReturnItemFromPurchaseItem = (
    purchaseItem,
    {
      purchaseContext = selectedPurchase,
      qtyReturned = 0,
      condition = "damaged",
      reason = "",
    } = {}
  ) => {
    const qty = Number(qtyReturned || 0);
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
      replacementQty: normalizeReturnResolutionType(purchaseReturnForm.resolutionType) === "replacement" ? qty : 0,
      replacementReceivedQty: 0,
      refundAmountUsd: normalizeReturnResolutionType(purchaseReturnForm.resolutionType) === "refund" ? lineTotalUsd : 0,
      refundAmountKhr: normalizeReturnResolutionType(purchaseReturnForm.resolutionType) === "refund" ? lineTotalKhr : 0,
      creditAmountUsd: normalizeReturnResolutionType(purchaseReturnForm.resolutionType) === "credit_note" ? lineTotalUsd : 0,
      creditAmountKhr: normalizeReturnResolutionType(purchaseReturnForm.resolutionType) === "credit_note" ? lineTotalKhr : 0,
      condition,
      stockAction,
      reason: reason || "Supplier claim item.",
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
    if (field === "resolutionType") {
      const nextResolutionType = normalizeReturnResolutionType(value);
      setPurchaseReturnItems((previous) =>
        previous.map((item) => ({
          ...item,
          replacementQty: nextResolutionType === "replacement" ? Number(item.qtyReturned || 0) : 0,
          refundAmountUsd: nextResolutionType === "refund" ? Number(item.lineTotalUsd ?? item.lineTotal ?? 0) : 0,
          refundAmountKhr: nextResolutionType === "refund" ? Number(item.lineTotalKhr || 0) : 0,
          creditAmountUsd: nextResolutionType === "credit_note" ? Number(item.lineTotalUsd ?? item.lineTotal ?? 0) : 0,
          creditAmountKhr: nextResolutionType === "credit_note" ? Number(item.lineTotalKhr || 0) : 0,
        }))
      );
    }
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
          next.reason = hasClaim || hasDamage ? "Damaged item claimed to supplier." : "Wrong item supplied.";
        }
      }

      if (field === "condition") {
        const reasons = {
          damaged: "Damaged item claimed to supplier.",
          wrong_item: "Wrong item supplied.",
          over_supplied: "Supplier delivered more than ordered.",
          expired: "Expired or near-expired item.",
          other: "Other supplier issue.",
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

    if (!purchaseReturnItemForm.purchaseItemId) nextErrors.purchaseItemId = "Please select item to claim / return.";
    if (!purchaseItem) nextErrors.purchaseItemId = "Invalid purchase item.";
    if (!purchaseReturnItemForm.qtyReturned || qtyReturned <= 0) nextErrors.qtyReturned = "Claim / return quantity must be greater than 0.";

    if (purchaseItem) {
      const availableQty = getAvailableReturnQty(purchaseItem);
      if (qtyReturned > availableQty) nextErrors.qtyReturned = `Quantity cannot exceed ${availableQty} ${purchaseItem.unitName}.`;
    }

    if (!purchaseReturnItemForm.condition) nextErrors.condition = "Please select reason.";
    if (!purchaseReturnItemForm.reason.trim()) nextErrors.reason = "Reason note is required.";

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
    });

    setPurchaseReturnItems((previous) => [...previous, item]);
    setPurchaseReturnItemForm(emptyPurchaseReturnItemForm);
    setPurchaseReturnItemErrors({});
    setPurchaseReturnErrors((previous) => ({ ...previous, items: "" }));
  };

  const validatePurchaseReturnForm = () => {
    const nextErrors = {};
    if (!purchaseReturnForm.purchaseReturnNo.trim()) nextErrors.purchaseReturnNo = "Purchase return number is required.";
    if (!purchaseReturnForm.returnDate) nextErrors.returnDate = "Return date is required.";
    if (!purchaseReturnForm.resolutionType) nextErrors.resolutionType = "Resolution type is required.";
    if (purchaseReturnItems.length === 0) nextErrors.items = "Please add at least one problem item.";
    setPurchaseReturnErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSavePurchaseReturn = () => {
    if (!selectedPurchase || !validatePurchaseReturnForm()) return;

    const now = new Date().toISOString().slice(0, 10);
    const subtotal = purchaseReturnItems.reduce((total, item) => total + Number(item.lineTotal || 0), 0);
    const subtotalKhr = purchaseReturnItems.reduce((total, item) => total + Number(item.lineTotalKhr || 0), 0);
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
      returnReason: purchaseReturnForm.returnReason,
      resolutionType: purchaseReturnForm.resolutionType,
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
      items: purchaseReturnItems.map((item) => ({ ...item, purchaseReturnId: newReturnId })),
    };

    if (purchasesQuery.data && !String(selectedPurchase.id).startsWith("local-")) {
      const resolutionType = normalizeReturnResolutionType(payload.resolutionType);
      const apiResolutionType = resolutionType;
      const isRefund = resolutionType === "refund";
      const isCredit = resolutionType === "credit_note";
      const isReplacement = resolutionType === "replacement";

      createPurchaseReturnMutation.mutate({
        purchase_return_no: payload.purchaseReturnNo,
        purchase_id: payload.purchaseId,
        supplier_id: payload.supplierId,
        return_date: payload.returnDate,
        return_type: payload.returnType,
        return_reason: payload.returnReason,
        resolution_type: apiResolutionType,
        resolution_status: payload.resolutionStatus,
        status: String(payload.status || RETURN_STATUS.SUBMITTED).toLowerCase().replaceAll(" ", "_"),
        input_currency: currencyToApi(selectedPurchase.inputCurrency || "USD"),
        exchange_rate_used: Number(selectedPurchase.exchangeRateUsed || 0),
        khr_rounding: selectedPurchase.khrRounding || "floor",
        subtotal_usd: Number(subtotal || 0),
        subtotal_khr: Number(subtotalKhr || 0),
        total_amount_usd: Number(subtotal || 0),
        total_amount_khr: Number(subtotalKhr || 0),
        refund_status: isRefund ? "pending" : "none",
        refund_amount_usd: isRefund ? Number(subtotal || 0) : 0,
        refund_amount_khr: isRefund ? Number(subtotalKhr || 0) : 0,
        replacement_qty: isReplacement ? purchaseReturnItems.reduce((total, item) => total + Number(item.qtyReturned || 0), 0) : 0,
        replacement_received_qty: 0,
        credit_amount_usd: isCredit ? Number(subtotal || 0) : 0,
        credit_amount_khr: isCredit ? Number(subtotalKhr || 0) : 0,
        credit_status: isCredit ? "issued" : "none",
        note: payload.note,
        resolved_at: null,
        items: purchaseReturnItems.map((item) => ({
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
          replacement_qty: isReplacement ? Number(item.qtyReturned || 0) : 0,
          replacement_received_qty: Number(item.replacementReceivedQty || 0),
          refund_amount_usd: isRefund ? Number(item.lineTotalUsd ?? item.lineTotal ?? 0) : 0,
          refund_amount_khr: isRefund ? Number(item.lineTotalKhr || 0) : 0,
          credit_amount_usd: isCredit ? Number(item.lineTotalUsd ?? item.lineTotal ?? 0) : 0,
          credit_amount_khr: isCredit ? Number(item.lineTotalKhr || 0) : 0,
          condition: item.condition,
          stock_action: item.stockAction,
          note: item.reason,
          reason: item.reason,
        })),
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
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard theme={theme} title="Total Purchases" value={totalPurchasesCount} icon={<FiShoppingCart className="text-[34px] text-violet-500" />} iconBg="bg-violet-500/10" />
        <SummaryCard theme={theme} title="Total Amount" value={fmtUsd(totalGrandUsd)} subValue={fmtKhr(totalGrandKhr)} icon={<FiDollarSign className="text-[34px] text-emerald-500" />} iconBg="bg-emerald-500/10" />
        <SummaryCard theme={theme} title="Outstanding Balance" value={fmtUsd(totalBalanceUsd)} subValue={fmtKhr(totalBalanceKhr)} subValueColor={totalBalanceUsd > 0 ? "text-amber-500" : "text-emerald-500"} icon={<FiCreditCard className="text-[34px] text-amber-500" />} iconBg="bg-amber-500/10" />
        <SummaryCard theme={theme} title="Supplier Claims" value={pendingClaimsCount} icon={<FiRotateCcw className="text-[34px] text-red-500" />} iconBg="bg-red-500/10" />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px_auto]">
          <div className="relative">
            <FiSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`} />
            <input
              type="text"
              placeholder="Search purchase, supplier, product, variant..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <FilterSelect
            value={statusFilter}
            setValue={setStatusFilter}
            theme={theme}
            icon={<FiFilter />}
            options={[
              { value: "All", label: "All Status" },
              ...Object.values(STATUS).map((status) => ({ value: status, label: status })),
            ]}
          />

          <FilterSelect
            value={paymentModeFilter}
            setValue={setPaymentModeFilter}
            theme={theme}
            icon={<FiCreditCard />}
            options={[{ value: "All", label: "All Payment" }, ...paymentModeOptions]}
          />

          <FilterSelect
            value={perPage}
            setValue={(value) => setPerPage(Number(value))}
            theme={theme}
            icon={<FiHash />}
            options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} / page` }))}
          />

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <FiPlusCircle className="text-lg" />
            Add Purchase
          </button>
        </div>
      </div>

      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
        <div className="flex flex-col gap-2 border-b border-zinc-200 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>Purchase List</h2>
            <p className={`mt-1 text-xs ${theme.muted}`}>Showing {pagination.from || 0}-{pagination.to || filteredPurchases.length} of {pagination.total || purchases.length} purchases</p>
          </div>
          <div className={`flex flex-wrap gap-3 text-xs ${theme.muted}`}>
            <span>Claim amount: {formatMoney(totalPurchaseReturnAmount)}</span>
          </div>
        </div>

        <div className="hidden xl:block">
          {purchasesQuery.isLoading ? (
            <table className="w-full">
              <tbody>
                <TableLoading theme={theme} colSpan={5} text="Loading purchases..." />
              </tbody>
            </table>
          ) : (
            <PurchaseTable
              purchases={filteredPurchases}
              purchaseReturns={purchaseReturns}
              theme={theme}
              getEffectivePurchaseStatus={getEffectivePurchaseStatus}
              getPurchaseProblemLabel={getPurchaseProblemLabel}
              getClaimRequiredCount={getClaimRequiredCount}
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
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 xl:hidden">
          {purchasesQuery.isLoading ? (
            <table className="w-full">
              <tbody>
                <TableLoading theme={theme} colSpan={1} text="Loading purchases..." />
              </tbody>
            </table>
          ) : filteredPurchases.length === 0 ? (
            <EmptyState theme={theme} icon={<FiSearch />} title="No purchases found" description="Try changing your search keyword or filters." />
          ) : (
            filteredPurchases.map((purchase) => (
              <PurchaseMobileCard
                key={purchase.id}
                purchase={purchase}
                purchaseReturns={purchaseReturns}
                theme={theme}
                effectiveStatus={getEffectivePurchaseStatus(purchase)}
                problemLabel={getPurchaseProblemLabel(purchase)}
                nextActionLabel={getNextActionLabel(purchase)}
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
              />
            ))
          )}
        </div>

        {!purchasesQuery.isLoading && pagination.lastPage > 1 && (
          <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
            <p className={`text-xs ${theme.muted}`}>
              Page {pagination.currentPage} of {pagination.lastPage}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || purchasesQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <FiChevronLeft />
                Previous
              </button>

              {pageNumbers.map((item) =>
                item === "..." ? (
                  <span
                    key={item}
                    className={`px-2 text-sm font-semibold ${theme.muted}`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    disabled={purchasesQuery.isFetching}
                    onClick={() => setPage(item)}
                    className={`h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      item === pagination.currentPage
                        ? "bg-red-600 text-white"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={page >= pagination.lastPage || purchasesQuery.isFetching}
                onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                Next
                <FiChevronRight />
              </button>
            </div>
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
          getPurchaseReturnStatusClass={getPurchaseReturnStatusClass}
          getPurchaseReturnStatusIcon={getPurchaseReturnStatusIcon}
          onClose={closeModal}
          onReturn={() => openPurchaseReturnModal(selectedPurchase)}
          onReceiveReplacement={(purchaseReturn) => handleReceiveReplacement(selectedPurchase, purchaseReturn)}
          onResolveClaim={(purchaseReturn) => handleResolveSupplierClaim(selectedPurchase, purchaseReturn)}
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
          getAvailableReturnQty={getAvailableReturnQty}
          onClose={closeModal}
          onSave={handleSavePurchaseReturn}
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
