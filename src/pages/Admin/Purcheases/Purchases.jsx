import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiHash,
  FiInfo,
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

const STATUS = {
  DRAFT: "Draft",
  PENDING_RECEIVE: "Pending Receive",
  PENDING_STOCK_IN: "Pending Stock In",
  PENDING_CLAIM: "Pending Claim",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

const RETURN_STATUS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  WAITING_REPLACEMENT: "Waiting Replacement",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const paymentModeOptions = [
  { value: "pay_after_check", label: "Pay After Check" },
  { value: "prepaid", label: "Prepaid" },
  { value: "partial_prepaid", label: "Partial Prepaid" },
];

const paymentStatusOptions = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

const deliveryOptions = [
  { value: "none", label: "None" },
  { value: "supplier_delivery", label: "Supplier Delivery" },
  { value: "shop_pickup", label: "Shop Pickup" },
  { value: "third_party_delivery", label: "Third Party Delivery" },
];

const deliveryPaidByOptions = [
  { value: "shop", label: "Shop" },
  { value: "supplier", label: "Supplier" },
  { value: "included_in_invoice", label: "Included in Invoice" },
];

const initialSuppliers = [
  {
    id: 1,
    supplierCode: "SUP-001",
    name: "Thai Huot Trading",
    contactPerson: "Sok Dara",
    phone: "0887193924",
    trustMode: "pay_after_check",
    note: "High-trust supplier. Pay after checking goods.",
  },
  {
    id: 2,
    supplierCode: "SUP-002",
    name: "Mengly Wholesale",
    contactPerson: "Mengly",
    phone: "0887193925",
    trustMode: "prepaid",
    note: "Low-trust supplier. Prepayment required.",
  },
];

const initialVariantUnits = [
  {
    id: 1,
    productName: "Coca-Cola",
    variantName: "Coca-Cola Can 330ml",
    variantCode: "COKE-CAN-330",
    unitName: "Case",
    baseUnit: "Can",
    conversionQty: 24,
    defaultCost: 7.2,
    isExpirable: true,
  },
  {
    id: 2,
    productName: "Coca-Cola",
    variantName: "Coca-Cola Big Bottle 1.5L",
    variantCode: "COKE-BTL-1500",
    unitName: "Case",
    baseUnit: "Bottle",
    conversionQty: 6,
    defaultCost: 5.1,
    isExpirable: true,
  },
  {
    id: 3,
    productName: "Face Mask",
    variantName: "Face Mask Box",
    variantCode: "MASK-BOX",
    unitName: "Set",
    baseUnit: "Box",
    conversionQty: 6,
    defaultCost: 2.7,
    isExpirable: true,
  },
  {
    id: 4,
    productName: "Sugar",
    variantName: "Sugar Loose",
    variantCode: "SUGAR-LOOSE",
    unitName: "Kg",
    baseUnit: "Gram",
    conversionQty: 1000,
    defaultCost: 0.75,
    isExpirable: false,
  },
  {
    id: 5,
    productName: "Dove Shampoo",
    variantName: "Dove Shampoo 250ml",
    variantCode: "DOVE-250",
    unitName: "Box",
    baseUnit: "Bottle",
    conversionQty: 12,
    defaultCost: 18,
    isExpirable: true,
  },
  {
    id: 6,
    productName: "Instant Noodle",
    variantName: "Instant Noodle Chicken Box",
    variantCode: "NOODLE-CHICKEN-BOX",
    unitName: "Box",
    baseUnit: "Pack",
    conversionQty: 30,
    defaultCost: 9.5,
    isExpirable: true,
  },
];

const initialPurchases = [
  {
    id: 1,
    purchaseNo: "PUR-001",
    supplierId: 1,
    supplierName: "Thai Huot Trading",
    createdBy: "Admin",
    purchaseDate: "2026-05-01",
    paymentMode: "pay_after_check",
    paymentStatus: "unpaid",
    subtotal: 1368,
    discountTotal: 0,
    deliveryOption: "supplier_delivery",
    deliveryFee: 2,
    deliveryFeeCurrency: "USD",
    deliveryPaidBy: "shop",
    grandTotal: 1370,
    paidAmount: 0,
    balanceAmount: 1370,
    note: "Pay after check. Supplier brought 200 Case, 10 damaged, shop accepts and pays only 190 Case.",
    status: STATUS.PENDING_STOCK_IN,
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
    items: [
      {
        id: 101,
        variantUnitId: 1,
        productName: "Coca-Cola",
        variantName: "Coca-Cola Can 330ml",
        variantCode: "COKE-CAN-330",
        unitName: "Case",
        baseUnit: "Can",
        conversionQty: 24,
        invoicedQty: 200,
        paidQty: 190,
        receivedQty: 200,
        acceptedQty: 190,
        damagedQty: 10,
        claimQty: 0,
        unitCost: 7.2,
        unitCostBase: 0.3,
        lineTotal: 1368,
        expiredDate: "2026-12-31",
      },
    ],
  },
  {
    id: 2,
    purchaseNo: "PUR-002",
    supplierId: 2,
    supplierName: "Mengly Wholesale",
    createdBy: "Admin",
    purchaseDate: "2026-05-02",
    paymentMode: "prepaid",
    paymentStatus: "paid",
    subtotal: 270,
    discountTotal: 0,
    deliveryOption: "shop_pickup",
    deliveryFee: 0,
    deliveryFeeCurrency: "USD",
    deliveryPaidBy: "shop",
    grandTotal: 270,
    paidAmount: 270,
    balanceAmount: 0,
    note: "Prepaid purchase. Paid for 100 Set, 10 Set arrived damaged, supplier claim required.",
    status: STATUS.PENDING_CLAIM,
    createdAt: "2026-05-02",
    updatedAt: "2026-05-02",
    items: [
      {
        id: 201,
        variantUnitId: 3,
        productName: "Face Mask",
        variantName: "Face Mask Box",
        variantCode: "MASK-BOX",
        unitName: "Set",
        baseUnit: "Box",
        conversionQty: 6,
        invoicedQty: 100,
        paidQty: 100,
        receivedQty: 100,
        acceptedQty: 90,
        damagedQty: 10,
        claimQty: 10,
        unitCost: 2.7,
        unitCostBase: 0.45,
        lineTotal: 270,
        expiredDate: "2026-10-10",
      },
    ],
  },
  {
    id: 3,
    purchaseNo: "PUR-003",
    supplierId: 2,
    supplierName: "Mengly Wholesale",
    createdBy: "Admin",
    purchaseDate: "2026-05-04",
    paymentMode: "prepaid",
    paymentStatus: "paid",
    subtotal: 37.5,
    discountTotal: 0,
    deliveryOption: "third_party_delivery",
    deliveryFee: 1.5,
    deliveryFeeCurrency: "USD",
    deliveryPaidBy: "shop",
    grandTotal: 39,
    paidAmount: 39,
    balanceAmount: 0,
    note: "Prepaid before goods arrive. Waiting for supplier delivery.",
    status: STATUS.PENDING_RECEIVE,
    createdAt: "2026-05-04",
    updatedAt: "2026-05-04",
    items: [
      {
        id: 301,
        variantUnitId: 4,
        productName: "Sugar",
        variantName: "Sugar Loose",
        variantCode: "SUGAR-LOOSE",
        unitName: "Kg",
        baseUnit: "Gram",
        conversionQty: 1000,
        invoicedQty: 50,
        paidQty: 50,
        receivedQty: 0,
        acceptedQty: 0,
        damagedQty: 0,
        claimQty: 0,
        unitCost: 0.75,
        unitCostBase: 0.00075,
        lineTotal: 37.5,
        expiredDate: "",
      },
    ],
  },
];

const initialPurchaseReturns = [
  {
    id: 1,
    purchaseReturnNo: "PRET-001",
    purchaseId: 2,
    purchaseNo: "PUR-002",
    supplierId: 2,
    supplierName: "Mengly Wholesale",
    returnDate: "2026-05-03",
    returnType: "partial_return",
    returnReason: "damaged",
    resolutionType: "replacement",
    resolutionStatus: "submitted",
    subtotal: 27,
    note: "10 Set Face Mask arrived damaged after prepaid purchase. Request replacement from supplier.",
    status: RETURN_STATUS.SUBMITTED,
    createdBy: "Admin",
    createdAt: "2026-05-03",
    updatedAt: "2026-05-03",
    resolvedAt: null,
    items: [
      {
        id: 1001,
        purchaseReturnId: 1,
        purchaseItemId: 201,
        variantUnitId: 3,
        productName: "Face Mask",
        variantName: "Face Mask Box",
        variantCode: "MASK-BOX",
        unitName: "Set",
        baseUnit: "Box",
        conversionQty: 6,
        qtyReturned: 10,
        baseQtyReturned: 60,
        unitCost: 2.7,
        unitCostBase: 0.45,
        lineTotal: 27,
        condition: "damaged",
        stockAction: "no_stock_change",
        reason: "Damaged before stock in. No stock deduction because only accepted quantity entered inventory.",
      },
    ],
  },
];

const emptyPurchaseForm = {
  purchaseNo: "",
  supplierId: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  paymentMode: "pay_after_check",
  paymentStatus: "unpaid",
  discountTotal: 0,
  deliveryOption: "none",
  deliveryFee: 0,
  deliveryFeeCurrency: "USD",
  deliveryPaidBy: "shop",
  paidAmount: 0,
  note: "",
  status: STATUS.DRAFT,
};

const emptyItemForm = {
  variantUnitId: "",
  invoicedQty: "",
  paidQty: "",
  receivedQty: "",
  acceptedQty: "",
  damagedQty: 0,
  claimQty: 0,
  unitCost: "",
  expiredDate: "",
};

const emptyPurchaseReturnForm = {
  purchaseReturnNo: "",
  purchaseId: "",
  supplierId: "",
  returnDate: new Date().toISOString().slice(0, 10),
  returnType: "partial_return",
  returnReason: "damaged",
  resolutionType: "replacement",
  resolutionStatus: "draft",
  note: "",
  status: RETURN_STATUS.DRAFT,
};

const emptyPurchaseReturnItemForm = {
  purchaseItemId: "",
  qtyReturned: "",
  condition: "damaged",
  reason: "",
};

function useLockBodyScroll(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
}

function formatSnake(value = "") {
  return String(value || "-").replaceAll("_", " ");
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatPaymentMode(value = "") {
  const found = paymentModeOptions.find((item) => item.value === value);
  return found?.label || value || "-";
}

function buildTheme(isDark) {
  return {
    pageTitle: isDark ? "text-white" : "text-zinc-900",
    card: isDark ? "border-white/10 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-900",
    modal: isDark ? "border-white/10 bg-[#111113] text-white" : "border-zinc-200 bg-white text-zinc-900",
    modalHeader: isDark ? "border-white/10 bg-[#111113]" : "border-zinc-200 bg-white",
    modalBody: isDark ? "bg-[#151518]" : "bg-zinc-50/70",
    muted: isDark ? "text-zinc-400" : "text-zinc-500",
    input: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",
    select: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",
    tableWrap: isDark ? "border-white/10 bg-zinc-900" : "border-zinc-200 bg-white",
    row: isDark ? "border-white/10 text-zinc-200 hover:bg-white/[0.04]" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    badge: isDark ? "border-white/10 bg-white/5 text-zinc-200" : "border-zinc-200 bg-zinc-100 text-zinc-700",
    softCard: isDark ? "border-white/10 bg-white/[0.04]" : "border-zinc-200 bg-white",
    section: isDark ? "border-white/10 bg-[#18181b]" : "border-zinc-200 bg-white",
  };
}

export default function Purchases() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const theme = buildTheme(isDark);

  const [purchases, setPurchases] = useState(initialPurchases);
  const [purchaseReturns, setPurchaseReturns] = useState(initialPurchaseReturns);
  const [stockMovements, setStockMovements] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentModeFilter, setPaymentModeFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

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

  useLockBodyScroll(Boolean(modalMode || itemModalOpen));

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

  const getNearestExpiryItem = (purchase) => {
    const expiryItems = purchase.items.filter((item) => item.expiredDate && String(item.expiredDate).trim() !== "");
    if (expiryItems.length === 0) return null;
    return expiryItems.reduce((nearest, item) => {
      if (!nearest) return item;
      return new Date(item.expiredDate) < new Date(nearest.expiredDate) ? item : nearest;
    }, null);
  };

  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateString);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpirySummary = (purchase) => {
    const nearest = getNearestExpiryItem(purchase);
    if (!nearest) {
      return {
        label: "No expiry tracking",
        detail: "Non-expiry item or not received yet",
        pill: "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
      };
    }

    const days = getDaysUntilExpiry(nearest.expiredDate);
    if (days < 0) {
      return {
        label: `Expired ${Math.abs(days)}d ago`,
        detail: `${nearest.variantName} · ${nearest.expiredDate}`,
        pill: "bg-red-500/10 text-red-600 dark:text-red-400",
      };
    }
    if (days <= 30) {
      return {
        label: `Expires in ${days}d`,
        detail: `${nearest.variantName} · ${nearest.expiredDate}`,
        pill: "bg-red-500/10 text-red-600 dark:text-red-400",
      };
    }
    if (days <= 90) {
      return {
        label: "Expiring soon",
        detail: `${nearest.variantName} · ${nearest.expiredDate}`,
        pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    }
    return {
      label: `Nearest exp: ${nearest.expiredDate}`,
      detail: nearest.variantName,
      pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    };
  };

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

  const pendingReceive = purchases.filter((item) => item.status === STATUS.PENDING_RECEIVE).length;
  const pendingStockIn = purchases.filter((item) => item.status === STATUS.PENDING_STOCK_IN).length;
  const pendingClaims = purchases.filter((item) => item.status === STATUS.PENDING_CLAIM).length;
  const expiryAlerts = purchases.filter((purchase) => {
    const nearest = getNearestExpiryItem(purchase);
    if (!nearest) return false;
    return getDaysUntilExpiry(nearest.expiredDate) <= 90;
  }).length;

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
    return "bg-red-500/10 text-red-500 dark:text-red-400";
  };

  const getPurchaseReturnStatusIcon = (status) => {
    if (status === RETURN_STATUS.COMPLETED) return <FiCheckCircle />;
    if (status === RETURN_STATUS.SUBMITTED || status === RETURN_STATUS.APPROVED) return <FiClock />;
    if (status === RETURN_STATUS.WAITING_REPLACEMENT) return <FiTruck />;
    if (status === RETURN_STATUS.DRAFT) return <FiFileText />;
    return <FiXCircle />;
  };

  const getPurchaseProblemLabel = (purchase) => {
    const claimQty = getClaimRequiredCount(purchase);
    const damagedQty = getDamagedCount(purchase);
    if ((purchase.paymentMode === "prepaid" || purchase.paymentMode === "partial_prepaid") && claimQty > 0) return `${claimQty} claim required`;
    if (purchase.paymentMode === "pay_after_check" && damagedQty > 0) return `${damagedQty} damaged excluded`;
    if (purchase.status === STATUS.PENDING_RECEIVE) return "Waiting goods";
    if (purchase.status === STATUS.RECEIVED) return "Stocked in";
    return "No issue";
  };

  const getNextActionLabel = (purchase) => {
    if (purchase.status === STATUS.DRAFT) return "Continue editing";
    if (purchase.status === STATUS.PENDING_RECEIVE) return "Receive goods";
    if (purchase.status === STATUS.PENDING_CLAIM) return "Create supplier claim";
    if (purchase.status === STATUS.PENDING_STOCK_IN) return "Open Inventory";
    if (purchase.status === STATUS.RECEIVED) return "Completed";
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

  const openAddModal = () => {
    setSelectedPurchase(null);
    setPurchaseErrors({});
    setPurchaseForm({
      ...emptyPurchaseForm,
      purchaseNo: `PUR-${String(purchases.length + 1).padStart(3, "0")}`,
    });
    setPurchaseItems([]);
    setModalMode("add");
  };

  const openViewModal = (purchase) => {
    setSelectedPurchase(purchase);
    setModalMode("view");
  };

  const openEditModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPurchaseErrors({});
    setPurchaseForm({
      purchaseNo: purchase.purchaseNo,
      supplierId: purchase.supplierId,
      purchaseDate: purchase.purchaseDate,
      paymentMode: purchase.paymentMode || "pay_after_check",
      paymentStatus: purchase.paymentStatus || "unpaid",
      discountTotal: purchase.discountTotal,
      deliveryOption: purchase.deliveryOption,
      deliveryFee: purchase.deliveryFee,
      deliveryFeeCurrency: purchase.deliveryFeeCurrency,
      deliveryPaidBy: purchase.deliveryPaidBy,
      paidAmount: purchase.paidAmount || 0,
      note: purchase.note,
      status: purchase.status,
    });
    setPurchaseItems(purchase.items);
    setModalMode("edit");
  };

  const openReceiveGoodsModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPurchaseForm({
      purchaseNo: purchase.purchaseNo,
      supplierId: purchase.supplierId,
      purchaseDate: purchase.purchaseDate,
      paymentMode: purchase.paymentMode || "prepaid",
      paymentStatus: purchase.paymentStatus || "paid",
      discountTotal: purchase.discountTotal,
      deliveryOption: purchase.deliveryOption,
      deliveryFee: purchase.deliveryFee,
      deliveryFeeCurrency: purchase.deliveryFeeCurrency,
      deliveryPaidBy: purchase.deliveryPaidBy,
      paidAmount: purchase.paidAmount || 0,
      note: purchase.note,
      status: purchase.status,
    });
    setPurchaseItems(purchase.items);
    setModalMode("receive_goods");
  };

  const openPurchaseReturnModal = (purchase) => {
    setSelectedPurchase(purchase);
    setPurchaseReturnErrors({});
    setPurchaseReturnItemErrors({});
    setPurchaseReturnForm({
      ...emptyPurchaseReturnForm,
      purchaseReturnNo: `PRET-${String(purchaseReturns.length + 1).padStart(3, "0")}`,
      purchaseId: purchase.id,
      supplierId: purchase.supplierId,
      returnDate: new Date().toISOString().slice(0, 10),
      returnReason: getClaimRequiredCount(purchase) > 0 ? "damaged" : "other",
    });
    setPurchaseReturnItems([]);
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
    setItemForm(emptyItemForm);
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
      unitCost: item.unitCost,
      expiredDate: item.expiredDate,
    });
    setItemModalOpen(true);
  };

  const handleItemFormChange = (field, value) => {
    setItemForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "variantUnitId") {
        const selected = initialVariantUnits.find((unit) => String(unit.id) === String(value));
        if (selected) {
          next.unitCost = selected.defaultCost;
          next.expiredDate = selected.isExpirable ? next.expiredDate || "" : "";
        }
      }

      if (field === "invoicedQty") {
        next.receivedQty = next.receivedQty || value;
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
    const selectedUnit = initialVariantUnits.find((unit) => String(unit.id) === String(itemForm.variantUnitId));

    if (!itemForm.variantUnitId) nextErrors.variantUnitId = "Please select product variant.";
    if (!itemForm.invoicedQty || Number(itemForm.invoicedQty) <= 0) nextErrors.invoicedQty = "Invoiced quantity must be greater than 0.";
    if (itemForm.receivedQty === "" || Number(itemForm.receivedQty) < 0) nextErrors.receivedQty = "Received quantity cannot be negative.";
    if (itemForm.acceptedQty === "" || Number(itemForm.acceptedQty) < 0) nextErrors.acceptedQty = "Accepted quantity cannot be negative.";
    if (Number(itemForm.acceptedQty || 0) > Number(itemForm.receivedQty || 0)) nextErrors.acceptedQty = "Accepted quantity cannot exceed received qty.";
    if (Number(itemForm.damagedQty || 0) < 0) nextErrors.damagedQty = "Damaged quantity cannot be negative.";
    if (!itemForm.unitCost || Number(itemForm.unitCost) <= 0) nextErrors.unitCost = "Unit cost must be greater than 0.";
    if (selectedUnit?.isExpirable && Number(itemForm.receivedQty || 0) > 0 && !itemForm.expiredDate) {
      nextErrors.expiredDate = "Expiry date is required after goods are received.";
    }

    setItemErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPurchaseItemFromForm = () => {
    const selectedUnit = initialVariantUnits.find((unit) => String(unit.id) === String(itemForm.variantUnitId));
    if (!selectedUnit) return null;

    const paymentMode = purchaseForm.paymentMode;
    const invoicedQty = Number(itemForm.invoicedQty || 0);
    const receivedQty = Number(itemForm.receivedQty || 0);
    const acceptedQty = Number(itemForm.acceptedQty || 0);
    const damagedQty = Number(itemForm.damagedQty || 0);
    const unitCost = Number(itemForm.unitCost || 0);

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

    const lineTotal = calculateLineTotalByPaymentMode({ paymentMode, acceptedQty, paidQty, unitCost });
    const unitCostBase = unitCost / Number(selectedUnit.conversionQty || 1);

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
      unitCost,
      unitCostBase,
      lineTotal,
      expiredDate: selectedUnit.isExpirable ? itemForm.expiredDate : "",
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
    if (!purchaseForm.purchaseNo.trim()) nextErrors.purchaseNo = "Purchase number is required.";
    if (!purchaseForm.supplierId) nextErrors.supplierId = "Please select supplier.";
    if (!purchaseForm.purchaseDate) nextErrors.purchaseDate = "Purchase date is required.";
    if (!purchaseForm.paymentMode) nextErrors.paymentMode = "Payment mode is required.";
    if (!purchaseForm.paymentStatus) nextErrors.paymentStatus = "Payment status is required.";
    if (Number(purchaseForm.discountTotal || 0) < 0) nextErrors.discountTotal = "Discount cannot be negative.";
    if (Number(purchaseForm.deliveryFee || 0) < 0) nextErrors.deliveryFee = "Delivery fee cannot be negative.";
    if (purchaseItems.length === 0) nextErrors.items = "Please add at least one purchase item.";

    setPurchaseErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPurchasePayload = (statusOverride = null) => {
    const supplier = initialSuppliers.find((item) => String(item.id) === String(purchaseForm.supplierId));
    const subtotal = calculateSubtotal(purchaseItems);
    const grandTotal = calculateGrandTotal(purchaseItems, purchaseForm);
    const paidAmount = purchaseForm.paymentStatus === "paid" ? grandTotal : Number(purchaseForm.paidAmount || 0);
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

  const handleSavePurchase = (statusOverride = null) => {
    if (!validatePurchaseForm()) return;

    const payload = buildPurchasePayload(statusOverride);

    if (modalMode === "add") {
      setPurchases((previous) => [payload, ...previous]);
      closeModal();
      return;
    }

    if ((modalMode === "edit" || modalMode === "receive_goods") && selectedPurchase) {
      setPurchases((previous) => previous.map((item) => (item.id === selectedPurchase.id ? payload : item)));
      closeModal();
    }
  };

  const handleConfirmStockIn = (purchase) => {
    if (purchase.status !== STATUS.PENDING_STOCK_IN) return;

    // IMPORTANT UX / DATA-SAFETY RULE:
    // Purchases prepares a purchase for stock-in only.
    // The actual inventory update must happen one time in the Inventory module.
    // This prevents double stock-in when the user also confirms from Inventory.
    navigate(`/home/inventory?stockInPurchaseId=${purchase.id}&purchaseNo=${encodeURIComponent(purchase.purchaseNo)}`);
  };

  const handleCancelPurchase = (purchase) => {
    const ok = window.confirm(`Cancel ${purchase.purchaseNo}?`);
    if (!ok) return;
    setPurchases((previous) =>
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
    if (selectedPurchase?.status === STATUS.RECEIVED) return "deduct_from_stock";
    return "no_stock_change";
  };

  const handlePurchaseReturnFormChange = (field, value) => {
    setPurchaseReturnForm((previous) => {
      const next = { ...previous, [field]: value };
      if (field === "resolutionStatus") {
        const map = {
          draft: RETURN_STATUS.DRAFT,
          submitted: RETURN_STATUS.SUBMITTED,
          approved: RETURN_STATUS.APPROVED,
          waiting_replacement: RETURN_STATUS.WAITING_REPLACEMENT,
          completed: RETURN_STATUS.COMPLETED,
          cancelled: RETURN_STATUS.CANCELLED,
        };
        next.status = map[value] || RETURN_STATUS.DRAFT;
      }
      return next;
    });
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

    const qtyReturned = Number(purchaseReturnItemForm.qtyReturned || 0);
    const baseQtyReturned = qtyReturned * Number(purchaseItem.conversionQty || 1);
    const lineTotal = qtyReturned * Number(purchaseItem.unitCost || 0);
    const stockAction = getDefaultStockAction(purchaseItem, purchaseReturnItemForm.condition);

    const item = {
      id: Date.now() + purchaseItem.id,
      purchaseReturnId: null,
      purchaseItemId: purchaseItem.id,
      variantUnitId: purchaseItem.variantUnitId,
      productName: purchaseItem.productName,
      variantName: purchaseItem.variantName,
      variantCode: purchaseItem.variantCode,
      unitName: purchaseItem.unitName,
      baseUnit: purchaseItem.baseUnit,
      conversionQty: purchaseItem.conversionQty,
      qtyReturned,
      baseQtyReturned,
      unitCost: purchaseItem.unitCost,
      unitCostBase: purchaseItem.unitCostBase,
      lineTotal,
      condition: purchaseReturnItemForm.condition,
      stockAction,
      reason: purchaseReturnItemForm.reason.trim(),
    };

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
      note: purchaseReturnForm.note.trim(),
      status: purchaseReturnForm.status,
      createdBy: "Admin",
      createdAt: now,
      updatedAt: now,
      resolvedAt: purchaseReturnForm.status === RETURN_STATUS.COMPLETED ? now : null,
      items: purchaseReturnItems.map((item) => ({ ...item, purchaseReturnId: newReturnId })),
    };

    setPurchaseReturns((previous) => [payload, ...previous]);

    if (selectedPurchase.status === STATUS.PENDING_CLAIM) {
      setPurchases((previous) =>
        previous.map((purchase) =>
          purchase.id === selectedPurchase.id ? { ...purchase, status: STATUS.PENDING_STOCK_IN, updatedAt: now } : purchase
        )
      );
    }

    closeModal();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme.pageTitle}`}>Purchases</h1>
          <p className={`mt-1 text-sm ${theme.muted}`}>Manage supplier invoices, receiving, stock-in, damaged goods, and supplier claims.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <FiPlusCircle className="text-lg" />
          Add Purchase
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard theme={theme} title="Total Purchases" value={purchases.length} icon={<FiShoppingCart className="text-[34px] text-red-500" />} iconBg="bg-red-500/10" />
        <SummaryCard theme={theme} title="Pending Receive" value={pendingReceive} icon={<FiTruck className="text-[34px] text-indigo-500" />} iconBg="bg-indigo-500/10" />
        <SummaryCard theme={theme} title="Pending Stock In" value={pendingStockIn} icon={<FiClock className="text-[34px] text-blue-500" />} iconBg="bg-blue-500/10" />
        <SummaryCard theme={theme} title="Supplier Claims" value={pendingClaims} icon={<FiRotateCcw className="text-[34px] text-red-500" />} iconBg="bg-red-500/10" />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:max-w-6xl xl:grid-cols-[1fr_220px_220px]">
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
        </div>
      </div>

      {(pendingReceive > 0 || pendingStockIn > 0 || pendingClaims > 0 || expiryAlerts > 0) && (
        <div className={`grid grid-cols-1 gap-4 rounded-2xl border p-5 shadow-sm xl:grid-cols-4 ${theme.card}`}>
          <AlertMiniCard icon={<FiTruck />} title="Pending Receive" value={pendingReceive} description="Prepaid purchases waiting for goods arrival." colorClass="text-indigo-500" onClick={() => setStatusFilter(STATUS.PENDING_RECEIVE)} />
          <AlertMiniCard icon={<FiClock />} title="Pending Stock In" value={pendingStockIn} description="Goods checked. Confirm stock one time from Inventory." colorClass="text-blue-500" onClick={() => setStatusFilter(STATUS.PENDING_STOCK_IN)} />
          <AlertMiniCard icon={<FiAlertTriangle />} title="Pending Claim" value={pendingClaims} description="Prepaid damaged goods need supplier resolution." colorClass="text-red-500" onClick={() => setStatusFilter(STATUS.PENDING_CLAIM)} />
          <AlertMiniCard icon={<FiCalendar />} title="Expiry Watch" value={expiryAlerts} description="Purchases with expired or soon-expiring batches." colorClass="text-amber-500" onClick={() => setSearchTerm("")} />
        </div>
      )}

      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}>
        <div className="flex flex-col gap-2 border-b border-zinc-200 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>Purchase List</h2>
            <p className={`mt-1 text-xs ${theme.muted}`}>Showing {filteredPurchases.length} of {purchases.length} purchases</p>
          </div>
          <div className={`flex flex-wrap gap-3 text-xs ${theme.muted}`}>
            <span>Claim amount: {formatMoney(totalPurchaseReturnAmount)}</span>
            <span>Local stock movements: {stockMovements.length}</span>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <PurchaseTable
            purchases={filteredPurchases}
            theme={theme}
            getExpirySummary={getExpirySummary}
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
            handleConfirmStockIn={handleConfirmStockIn}
            handleCancelPurchase={handleCancelPurchase}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 xl:hidden">
          {filteredPurchases.length === 0 ? (
            <EmptyState theme={theme} icon={<FiSearch />} title="No purchases found" description="Try changing your search keyword or filters." />
          ) : (
            filteredPurchases.map((purchase) => (
              <PurchaseMobileCard
                key={purchase.id}
                purchase={purchase}
                theme={theme}
                expiry={getExpirySummary(purchase)}
                problemLabel={getPurchaseProblemLabel(purchase)}
                nextActionLabel={getNextActionLabel(purchase)}
                getStatusClass={getStatusClass}
                getStatusIcon={getStatusIcon}
                openViewModal={openViewModal}
                openEditModal={openEditModal}
                openReceiveGoodsModal={openReceiveGoodsModal}
                openPurchaseReturnModal={openPurchaseReturnModal}
                handleConfirmStockIn={handleConfirmStockIn}
                handleCancelPurchase={handleCancelPurchase}
              />
            ))
          )}
        </div>
      </div>

      {modalMode === "view" && selectedPurchase && (
        <ViewPurchaseModal
          purchase={selectedPurchase}
          purchaseReturns={purchaseReturns}
          stockMovements={stockMovements}
          theme={theme}
          getStatusClass={getStatusClass}
          getStatusIcon={getStatusIcon}
          getPurchaseReturnStatusClass={getPurchaseReturnStatusClass}
          getPurchaseReturnStatusIcon={getPurchaseReturnStatusIcon}
          onClose={closeModal}
          onReturn={() => openPurchaseReturnModal(selectedPurchase)}
          onConfirmStockIn={() => handleConfirmStockIn(selectedPurchase)}
        />
      )}

      {(modalMode === "add" || modalMode === "edit" || modalMode === "receive_goods") && (
        <PurchaseFormModal
          mode={modalMode}
          form={purchaseForm}
          errors={purchaseErrors}
          items={purchaseItems}
          suppliers={initialSuppliers}
          theme={theme}
          onChange={handlePurchaseFormChange}
          onAddItem={openAddItemModal}
          onEditItem={openEditItemModal}
          onRemoveItem={handleRemoveItem}
          onClose={closeModal}
          onSaveDraft={() => handleSavePurchase(STATUS.DRAFT)}
          onSavePrimary={() => handleSavePurchase(STATUS.PENDING_STOCK_IN)}
          primarySaveLabel={getPrimarySaveLabel()}
          calculateSubtotal={calculateSubtotal}
          calculateGrandTotal={calculateGrandTotal}
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

      {itemModalOpen && (
        <PurchaseItemModal
          mode={itemEditIndex === null ? "add" : "edit"}
          form={itemForm}
          errors={itemErrors}
          variantUnits={initialVariantUnits}
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

function PurchaseTable({
  purchases,
  theme,
  getExpirySummary,
  getPurchaseProblemLabel,
  getClaimRequiredCount,
  getDamagedCount,
  getNextActionLabel,
  getStatusClass,
  getStatusIcon,
  openViewModal,
  openEditModal,
  openReceiveGoodsModal,
  openPurchaseReturnModal,
  handleConfirmStockIn,
  handleCancelPurchase,
}) {
  return (
    <table className="w-full min-w-[1420px]">
      <thead className="bg-red-600 text-white">
        <tr>
          <th className="px-5 py-3 text-left text-sm font-semibold">Purchase</th>
          <th className="px-5 py-3 text-left text-sm font-semibold">Supplier</th>
          <th className="px-5 py-3 text-left text-sm font-semibold">Payment</th>
          <th className="px-5 py-3 text-left text-sm font-semibold">Items / Expiry</th>
          <th className="px-5 py-3 text-left text-sm font-semibold">Damage / Claim</th>
          <th className="px-5 py-3 text-left text-sm font-semibold">Next Action</th>
          <th className="px-5 py-3 text-left text-sm font-semibold">Total</th>
          <th className="px-5 py-3 text-center text-sm font-semibold">Status</th>
          <th className="px-5 py-3 text-center text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {purchases.map((purchase) => {
          const expiry = getExpirySummary(purchase);
          return (
            <tr key={purchase.id} className={`border-t transition ${theme.row}`}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                    <FiShoppingCart size={21} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-5">{purchase.purchaseNo}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}>{purchase.purchaseDate}</span>
                      <span className={`text-xs ${theme.muted}`}>By {purchase.createdBy}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-semibold">{purchase.supplierName}</p>
                <p className={`mt-1 text-xs ${theme.muted}`}>Supplier purchase invoice</p>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-semibold">{formatPaymentMode(purchase.paymentMode)}</p>
                <p className={`mt-1 text-xs capitalize ${theme.muted}`}>{purchase.paymentStatus} · Paid {formatMoney(purchase.paidAmount)}</p>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-semibold">
                  {purchase.items.length} item{purchase.items.length > 1 ? "s" : ""}
                </p>
                <p className={`mt-1 max-w-[260px] truncate text-xs ${theme.muted}`}>{purchase.items.map((item) => item.variantName).join(", ")}</p>
                <div className="mt-2 max-w-[280px]">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${expiry.pill}`}>{expiry.label}</span>
                  <p className={`mt-1 truncate text-[11px] ${theme.muted}`}>{expiry.detail}</p>
                </div>
              </td>
              <td className="px-5 py-4">
                <p className={`text-sm font-semibold ${getClaimRequiredCount(purchase) > 0 ? "text-red-500" : getDamagedCount(purchase) > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                  {getPurchaseProblemLabel(purchase)}
                </p>
                <p className={`mt-1 text-xs ${theme.muted}`}>Balance {formatMoney(purchase.balanceAmount)}</p>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}>{getNextActionLabel(purchase)}</span>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-bold">{formatMoney(purchase.grandTotal)}</p>
                <p className={`mt-1 text-xs ${theme.muted}`}>Subtotal {formatMoney(purchase.subtotal)}</p>
              </td>
              <td className="px-5 py-4 text-center">
                <StatusBadge status={purchase.status} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
              </td>
              <td className="px-5 py-4">
                <ActionButtons
                  purchase={purchase}
                  openViewModal={openViewModal}
                  openEditModal={openEditModal}
                  openReceiveGoodsModal={openReceiveGoodsModal}
                  openPurchaseReturnModal={openPurchaseReturnModal}
                  handleConfirmStockIn={handleConfirmStockIn}
                  handleCancelPurchase={handleCancelPurchase}
                  compact
                />
              </td>
            </tr>
          );
        })}
        {purchases.length === 0 && (
          <tr className={`border-t ${theme.row}`}>
            <td colSpan="9" className="px-4 py-14 text-center">
              <EmptyState theme={theme} icon={<FiSearch />} title="No purchases found" description="Try changing your search keyword or filters." />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function PurchaseMobileCard({
  purchase,
  theme,
  expiry,
  problemLabel,
  nextActionLabel,
  getStatusClass,
  getStatusIcon,
  openViewModal,
  openEditModal,
  openReceiveGoodsModal,
  openPurchaseReturnModal,
  handleConfirmStockIn,
  handleCancelPurchase,
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${theme.softCard}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold">{purchase.purchaseNo}</p>
          <p className={`mt-1 text-xs ${theme.muted}`}>{purchase.supplierName} · {purchase.purchaseDate}</p>
        </div>
        <StatusBadge status={purchase.status} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <SummaryMiniBox theme={theme} label="Payment" value={formatPaymentMode(purchase.paymentMode)} />
        <SummaryMiniBox theme={theme} label="Total" value={formatMoney(purchase.grandTotal)} strong />
        <SummaryMiniBox theme={theme} label="Issue" value={problemLabel} />
        <SummaryMiniBox theme={theme} label="Next" value={nextActionLabel} />
      </div>

      <div className="mt-4 rounded-xl bg-zinc-500/10 p-3">
        <p className="text-xs font-semibold">Items</p>
        <p className={`mt-1 text-xs ${theme.muted}`}>{purchase.items.map((item) => item.variantName).join(", ")}</p>
        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${expiry.pill}`}>{expiry.label}</span>
      </div>

      <div className="mt-4">
        <ActionButtons
          purchase={purchase}
          openViewModal={openViewModal}
          openEditModal={openEditModal}
          openReceiveGoodsModal={openReceiveGoodsModal}
          openPurchaseReturnModal={openPurchaseReturnModal}
          handleConfirmStockIn={handleConfirmStockIn}
          handleCancelPurchase={handleCancelPurchase}
        />
      </div>
    </div>
  );
}

function ActionButtons({
  purchase,
  openViewModal,
  openEditModal,
  openReceiveGoodsModal,
  openPurchaseReturnModal,
  handleConfirmStockIn,
  handleCancelPurchase,
  compact = false,
}) {
  const buttonBase = compact
    ? "inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
    : "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={`flex flex-wrap items-center ${compact ? "justify-center gap-2" : "gap-2"}`}>
      <button type="button" title="View purchase" onClick={() => openViewModal(purchase)} className={`${buttonBase} bg-amber-500 hover:bg-amber-600`}>
        <FiEye size={16} /> {!compact && "View"}
      </button>
      <button type="button" title={purchase.status === STATUS.RECEIVED ? "Received purchase cannot be edited" : "Edit purchase"} onClick={() => openEditModal(purchase)} disabled={purchase.status === STATUS.RECEIVED} className={`${buttonBase} bg-blue-600 hover:bg-blue-700`}>
        <FiEdit2 size={16} /> {!compact && "Edit"}
      </button>
      <button type="button" title="Receive goods" onClick={() => openReceiveGoodsModal(purchase)} disabled={purchase.status !== STATUS.PENDING_RECEIVE} className={`${buttonBase} bg-indigo-600 hover:bg-indigo-700`}>
        <FiTruck size={16} /> {!compact && "Receive"}
      </button>
      <button type="button" title="Create Supplier Claim / Purchase Return" onClick={() => openPurchaseReturnModal(purchase)} disabled={purchase.status === STATUS.CANCELLED || purchase.status === STATUS.PENDING_RECEIVE} className={`${buttonBase} bg-purple-600 hover:bg-purple-700`}>
        <FiRotateCcw size={16} /> {!compact && "Claim"}
      </button>
      <button type="button" title="Open this purchase in Inventory to confirm stock in" onClick={() => handleConfirmStockIn(purchase)} disabled={purchase.status !== STATUS.PENDING_STOCK_IN} className={`${buttonBase} bg-emerald-500 hover:bg-emerald-600`}>
        <FiCheckCircle size={16} /> {!compact && "Inventory"}
      </button>
      <button type="button" title={purchase.status === STATUS.RECEIVED ? "Received purchase cannot be cancelled" : "Cancel purchase"} onClick={() => handleCancelPurchase(purchase)} disabled={purchase.status === STATUS.RECEIVED} className={`${buttonBase} bg-red-500 hover:bg-red-600`}>
        <FiTrash size={16} /> {!compact && "Cancel"}
      </button>
    </div>
  );
}

function FilterSelect({ value, setValue, theme, icon, options }) {
  return (
    <div className="relative">
      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}>{icon}</span>
      <select value={value} onChange={(event) => setValue(event.target.value)} className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${theme.select}`}>
        {options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
      </select>
      <FiChevronDown className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`} />
    </div>
  );
}

function AlertMiniCard({ icon, title, value, description, colorClass, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white/60 p-4 text-left transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-current/10 ${colorClass}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-2xl font-bold leading-none">{value}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </button>
  );
}

function SummaryCard({ theme, title, value, icon, iconBg }) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}>{icon}</div>
        <div>
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-1 text-3xl font-bold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, theme, onClose, children, footer, width = "max-w-6xl" }) {
  return (
    <div onMouseDown={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div onMouseDown={(event) => event.stopPropagation()} className={`flex h-auto max-h-[90dvh] w-full ${width} flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}>
        <div className={`shrink-0 border-b px-6 py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              {subtitle && <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Close modal" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white">
              <FiX className="text-lg" />
            </button>
          </div>
        </div>
        <div className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 ${theme.modalBody}`}>{children}</div>
        {footer && <div className={`shrink-0 border-t px-6 py-4 ${theme.modalHeader}`}><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div></div>}
      </div>
    </div>
  );
}

function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">{icon}</div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {subtitle && <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status, getStatusClass, getStatusIcon }) {
  return <span className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>{getStatusIcon(status)}{status}</span>;
}

function FormInput({ label, required = false, value, onChange, theme, error = "", type = "text", placeholder = "", icon, disabled = false }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}{required && <span className="ml-1 text-red-400">*</span>}</span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}
        <input type={type} value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`} />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormTextarea({ label, value, onChange, theme, placeholder = "", icon }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}>{icon}</span>}
        <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={3} className={`w-full resize-none rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
      </div>
    </label>
  );
}

function FormSelect({ label, required = false, value, onChange, options, theme, error = "", icon, disabled = false }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}{required && <span className="ml-1 text-red-400">*</span>}</span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}
        <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full appearance-none rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-10 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}>
          {options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
        </select>
        <FiChevronDown className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`} />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function SummaryMiniBox({ theme, label, value, strong = false }) {
  return (
    <div className={`rounded-xl border p-4 ${theme.softCard}`}>
      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      <p className={`mt-2 ${strong ? "text-xl font-bold" : "text-sm font-semibold"}`}>{value}</p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 capitalize">{value || "-"}</p>
    </div>
  );
}

function PurchaseFormModal({
  mode,
  form,
  errors,
  items,
  suppliers,
  theme,
  onChange,
  onAddItem,
  onEditItem,
  onRemoveItem,
  onClose,
  onSaveDraft,
  onSavePrimary,
  primarySaveLabel,
  calculateSubtotal,
  calculateGrandTotal,
}) {
  const isReceiveMode = mode === "receive_goods";
  const title = mode === "add" ? "Add Purchase" : isReceiveMode ? "Receive Goods" : "Edit Purchase";
  const subtotal = calculateSubtotal(items);
  const grandTotal = calculateGrandTotal(items, form);
  const paidAmount = form.paymentStatus === "paid" ? grandTotal : Number(form.paidAmount || 0);
  const balanceAmount = Math.max(0, grandTotal - paidAmount);

  return (
    <ModalShell
      title={title}
      subtitle={isReceiveMode ? "Update received, damaged, accepted quantity and expiry date." : "Support Pay After Check, Prepaid, damaged goods, and supplier claims."}
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">Cancel</button>
          {!isReceiveMode && <button type="button" onClick={onSaveDraft} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"><FiSave />Save Draft</button>}
          <button type="button" onClick={onSavePrimary} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"><FiCheckCircle />{primarySaveLabel}</button>
        </>
      }
    >
      <div className="space-y-6">
        <FlowHelper mode={form.paymentMode} theme={theme} />

        {!isReceiveMode && (
          <FormSection title="1. Purchase Information" subtitle="Choose supplier and payment workflow." icon={<FiShoppingCart />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Purchase No" required value={form.purchaseNo} error={errors.purchaseNo} onChange={(value) => onChange("purchaseNo", value)} theme={theme} placeholder="PUR-001" icon={<FiHash />} />
              <FormSelect label="Supplier" required value={form.supplierId} error={errors.supplierId} onChange={(value) => onChange("supplierId", value)} theme={theme} icon={<FiUser />} options={[{ value: "", label: "Select supplier" }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]} />
              <FormInput label="Purchase Date" required type="date" value={form.purchaseDate} error={errors.purchaseDate} onChange={(value) => onChange("purchaseDate", value)} theme={theme} icon={<FiCalendar />} />
              <FormSelect label="Payment Mode" required value={form.paymentMode} error={errors.paymentMode} onChange={(value) => onChange("paymentMode", value)} theme={theme} icon={<FiCreditCard />} options={paymentModeOptions} />
              <FormSelect label="Payment Status" required value={form.paymentStatus} error={errors.paymentStatus} onChange={(value) => onChange("paymentStatus", value)} theme={theme} icon={<FiDollarSign />} options={paymentStatusOptions} />
              <FormSelect label="Status" value={form.status} onChange={(value) => onChange("status", value)} theme={theme} icon={<FiClock />} options={[STATUS.DRAFT, STATUS.PENDING_RECEIVE, STATUS.PENDING_STOCK_IN, STATUS.PENDING_CLAIM, STATUS.CANCELLED].map((status) => ({ value: status, label: status }))} />
            </div>
            <PaymentModeHint mode={form.paymentMode} />
            <div className="mt-4">
              <FormTextarea label="Note" value={form.note} onChange={(value) => onChange("note", value)} theme={theme} placeholder="Purchase note..." icon={<FiFileText />} />
            </div>
          </FormSection>
        )}

        <FormSection title={isReceiveMode ? "Receiving Items" : "2. Items & Receiving"} subtitle={isReceiveMode ? "Click edit on each item and enter received, damaged, accepted quantity." : "Add items, received qty, damaged qty, accepted qty, paid qty, and claim qty."} icon={<FiPackage />} theme={theme}>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Items</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>Only accepted quantity enters inventory after Inventory confirmation.</p>
            </div>
            {!isReceiveMode && <button type="button" onClick={onAddItem} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"><FiPlus />Add Item</button>}
          </div>

          {errors.items && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">{errors.items}</div>}

          {items.length === 0 ? (
            <EmptyState theme={theme} icon={<FiPackage />} title="No purchase items" description="Example: Coca-Cola Case, received 200, damaged 10, accepted 190." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[1160px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Product Variant</th>
                    <th className="px-3 py-3 text-left">Invoiced</th>
                    <th className="px-3 py-3 text-left">Paid</th>
                    <th className="px-3 py-3 text-left">Received</th>
                    <th className="px-3 py-3 text-left">Accepted</th>
                    <th className="px-3 py-3 text-left">Damaged</th>
                    <th className="px-3 py-3 text-left">Claim</th>
                    <th className="px-3 py-3 text-left">Expiry</th>
                    <th className="px-3 py-3 text-left">Total</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                      <td className="px-3 py-3"><p className="font-semibold">{item.variantName}</p><p className={`mt-1 text-xs ${theme.muted}`}>{item.variantCode} · {item.unitName} = {item.conversionQty} {item.baseUnit}</p></td>
                      <td className="px-3 py-3">{item.invoicedQty} {item.unitName}</td>
                      <td className="px-3 py-3">{item.paidQty} {item.unitName}</td>
                      <td className="px-3 py-3">{item.receivedQty} {item.unitName}</td>
                      <td className="px-3 py-3 text-emerald-500">{item.acceptedQty} {item.unitName}</td>
                      <td className="px-3 py-3"><span className={Number(item.damagedQty || 0) > 0 ? "font-semibold text-amber-500" : ""}>{item.damagedQty} {item.unitName}</span></td>
                      <td className="px-3 py-3"><span className={Number(item.claimQty || 0) > 0 ? "font-semibold text-red-500" : ""}>{item.claimQty} {item.unitName}</span></td>
                      <td className="px-3 py-3">{item.expiredDate || "-"}</td>
                      <td className="px-3 py-3 font-semibold">{formatMoney(item.lineTotal)}</td>
                      <td className="px-3 py-3"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => onEditItem(item, index)} className="flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white hover:bg-blue-700"><FiEdit2 size={14} />Edit</button>{!isReceiveMode && <button type="button" onClick={() => onRemoveItem(index)} className="flex h-8 items-center justify-center gap-1 rounded-lg bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600"><FiTrash size={14} />Remove</button>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>

        {!isReceiveMode && (
          <FormSection title="3. Payment, Delivery & Summary" subtitle="Delivery information, discount, paid amount, balance, and total amount." icon={<FiTruck />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect label="Delivery Option" value={form.deliveryOption} onChange={(value) => onChange("deliveryOption", value)} theme={theme} icon={<FiTruck />} options={deliveryOptions} />
              <FormSelect label="Delivery Paid By" value={form.deliveryPaidBy} onChange={(value) => onChange("deliveryPaidBy", value)} theme={theme} icon={<FiUser />} options={deliveryPaidByOptions} />
              <FormInput label="Delivery Fee" type="number" value={form.deliveryFee} error={errors.deliveryFee} onChange={(value) => onChange("deliveryFee", value)} theme={theme} icon={<FiDollarSign />} />
              <FormInput label="Discount Total" type="number" value={form.discountTotal} error={errors.discountTotal} onChange={(value) => onChange("discountTotal", value)} theme={theme} icon={<FiCreditCard />} />
              <FormInput label="Paid Amount" type="number" value={form.paymentStatus === "paid" ? grandTotal : form.paidAmount} onChange={(value) => onChange("paidAmount", value)} theme={theme} icon={<FiDollarSign />} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5">
              <SummaryMiniBox theme={theme} label="Subtotal" value={formatMoney(subtotal)} />
              <SummaryMiniBox theme={theme} label="Discount" value={formatMoney(form.discountTotal)} />
              <SummaryMiniBox theme={theme} label="Delivery Fee" value={formatMoney(form.deliveryFee)} />
              <SummaryMiniBox theme={theme} label="Paid Amount" value={formatMoney(paidAmount)} />
              <SummaryMiniBox theme={theme} label="Balance" value={formatMoney(balanceAmount)} strong />
            </div>
            <div className="mt-4"><SummaryMiniBox theme={theme} label="Grand Total" value={formatMoney(grandTotal)} strong /></div>
          </FormSection>
        )}
      </div>
    </ModalShell>
  );
}

function FlowHelper({ mode, theme }) {
  const text = {
    pay_after_check: "Pay After Check flow: Receive goods → exclude damaged quantity → pay accepted quantity → send to Inventory for one-time stock confirmation.",
    prepaid: "Prepaid flow: Pay first → receive goods → damaged quantity becomes supplier claim → accepted quantity waits for Inventory confirmation.",
    partial_prepaid: "Partial Prepaid flow: Enter paid quantity carefully. If paid quantity is greater than accepted quantity, claim may be required before Inventory confirmation.",
  };

  return (
    <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><FiInfo /></div>
        <div>
          <p className="text-sm font-bold">Purchase Workflow Guide</p>
          <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{text[mode]}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentModeHint({ mode }) {
  if (mode === "pay_after_check") {
    return <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-400">Pay After Check: damaged goods are excluded from payment and stock. Payable qty = accepted qty. Claim qty = 0.</div>;
  }
  if (mode === "prepaid") {
    return <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-400">Prepaid: goods are paid before arrival. If goods arrive damaged, claim qty is created for replacement, credit note, or refund.</div>;
  }
  return <div className="mt-4 rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-400">Partial Prepaid: enter paid qty manually. If paid qty is more than accepted qty, claim qty may be required.</div>;
}

function PurchaseItemModal({ mode, form, errors, variantUnits, paymentMode, theme, onChange, onClose, onSave }) {
  const selectedUnit = variantUnits.find((unit) => String(unit.id) === String(form.variantUnitId));
  const invoicedQty = Number(form.invoicedQty || 0);
  const paidQty = paymentMode === "pay_after_check" ? Number(form.acceptedQty || 0) : paymentMode === "prepaid" ? invoicedQty : Number(form.paidQty || 0);
  const acceptedQty = Number(form.acceptedQty || 0);
  const damagedQty = Number(form.damagedQty || 0);
  const claimQty = paymentMode === "prepaid" ? damagedQty : paymentMode === "pay_after_check" ? 0 : Math.max(0, paidQty - acceptedQty);
  const unitCost = Number(form.unitCost || 0);
  const lineTotal = paymentMode === "pay_after_check" ? acceptedQty * unitCost : paidQty * unitCost;

  return (
    <ModalShell
      title={mode === "add" ? "Add Purchase Item" : "Edit Purchase Item"}
      subtitle="Set item quantities based on payment mode."
      theme={theme}
      onClose={onClose}
      width="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">Cancel</button>
          <button type="button" onClick={onSave} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"><FiSave />Save Item</button>
        </>
      }
    >
      <div className="space-y-4">
        <PaymentModeHint mode={paymentMode} />
        <FormSection title="Purchase Item Information" subtitle="Use received, damaged, and accepted qty to calculate stock and claim." icon={<FiPackage />} theme={theme}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect label="Product Variant / Unit" required value={form.variantUnitId} error={errors.variantUnitId} onChange={(value) => onChange("variantUnitId", value)} theme={theme} icon={<FiPackage />} options={[{ value: "", label: "Select product variant" }, ...variantUnits.map((unit) => ({ value: unit.id, label: `${unit.variantName} · ${unit.unitName}` }))]} />
            <FormInput label="Unit Cost" required type="number" value={form.unitCost} error={errors.unitCost} onChange={(value) => onChange("unitCost", value)} theme={theme} placeholder="0.00" icon={<FiDollarSign />} />
            <FormInput label="Invoiced Qty" required type="number" value={form.invoicedQty} error={errors.invoicedQty} onChange={(value) => onChange("invoicedQty", value)} theme={theme} icon={<FiHash />} />
            {paymentMode === "partial_prepaid" && <FormInput label="Paid Qty" required type="number" value={form.paidQty} error={errors.paidQty} onChange={(value) => onChange("paidQty", value)} theme={theme} icon={<FiCreditCard />} />}
            <FormInput label="Received Qty" required type="number" value={form.receivedQty} error={errors.receivedQty} onChange={(value) => onChange("receivedQty", value)} theme={theme} icon={<FiTruck />} />
            <FormInput label="Damaged Qty" type="number" value={form.damagedQty} error={errors.damagedQty} onChange={(value) => onChange("damagedQty", value)} theme={theme} icon={<FiAlertTriangle />} />
            <FormInput label="Accepted Qty" required type="number" value={form.acceptedQty} error={errors.acceptedQty} onChange={(value) => onChange("acceptedQty", value)} theme={theme} icon={<FiCheckCircle />} />
            <FormInput label="Expiry Date" type="date" value={form.expiredDate} error={errors.expiredDate} onChange={(value) => onChange("expiredDate", value)} theme={theme} icon={<FiCalendar />} />
          </div>
        </FormSection>

        {selectedUnit && (
          <FormSection title="Calculation Preview" subtitle={`${selectedUnit.unitName} = ${selectedUnit.conversionQty} ${selectedUnit.baseUnit}`} icon={<FiInfo />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <SummaryMiniBox theme={theme} label="Paid Qty" value={`${paidQty} ${selectedUnit.unitName}`} />
              <SummaryMiniBox theme={theme} label="Stock In Qty" value={`${acceptedQty * Number(selectedUnit.conversionQty || 1)} ${selectedUnit.baseUnit}`} />
              <SummaryMiniBox theme={theme} label="Claim Qty" value={`${claimQty} ${selectedUnit.unitName}`} />
              <SummaryMiniBox theme={theme} label="Line Total" value={formatMoney(lineTotal)} strong />
            </div>
          </FormSection>
        )}
      </div>
    </ModalShell>
  );
}

function ViewPurchaseModal({ purchase, purchaseReturns, stockMovements, theme, getStatusClass, getStatusIcon, getPurchaseReturnStatusClass, getPurchaseReturnStatusIcon, onClose, onReturn, onConfirmStockIn }) {
  const relatedReturns = purchaseReturns.filter((item) => item.purchaseId === purchase.id);
  const relatedMovements = stockMovements.filter((item) => item.purchaseId === purchase.id);

  return (
    <ModalShell
      title={`Purchase Detail: ${purchase.purchaseNo}`}
      subtitle="View purchase information, items, supplier claims, expiry date, and stock movements."
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">Close</button>
          <button type="button" onClick={onReturn} disabled={purchase.status === STATUS.PENDING_RECEIVE || purchase.status === STATUS.CANCELLED} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"><FiRotateCcw />Supplier Claim / Return</button>
          <button type="button" onClick={onConfirmStockIn} disabled={purchase.status !== STATUS.PENDING_STOCK_IN} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"><FiCheckCircle />Open in Inventory</button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormSection title="Purchase Overview" subtitle="Supplier, invoice date, status and payment mode." icon={<FiShoppingCart />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoLine label="Purchase No" value={purchase.purchaseNo} />
              <div><p className="text-xs font-semibold text-zinc-500">Status</p><div className="mt-1"><StatusBadge status={purchase.status} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} /></div></div>
              <InfoLine label="Supplier" value={purchase.supplierName} />
              <InfoLine label="Purchase Date" value={purchase.purchaseDate} />
              <InfoLine label="Payment Mode" value={formatPaymentMode(purchase.paymentMode)} />
              <InfoLine label="Payment Status" value={purchase.paymentStatus} />
            </div>
          </FormSection>

          <FormSection title="Payment Summary" subtitle="Invoice total and balance." icon={<FiDollarSign />} theme={theme}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryMiniBox theme={theme} label="Subtotal" value={formatMoney(purchase.subtotal)} />
              <SummaryMiniBox theme={theme} label="Discount" value={formatMoney(purchase.discountTotal)} />
              <SummaryMiniBox theme={theme} label="Delivery Fee" value={formatMoney(purchase.deliveryFee)} />
              <SummaryMiniBox theme={theme} label="Paid" value={formatMoney(purchase.paidAmount)} />
              <SummaryMiniBox theme={theme} label="Balance" value={formatMoney(purchase.balanceAmount)} strong />
              <SummaryMiniBox theme={theme} label="Grand Total" value={formatMoney(purchase.grandTotal)} strong />
            </div>
          </FormSection>

          <FormSection title="Flow Status" subtitle="Recommended user action." icon={<FiInfo />} theme={theme}>
            <FlowTimeline status={purchase.status} theme={theme} />
            <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-400">
              {purchase.status === STATUS.PENDING_RECEIVE && "Next: receive goods and enter damaged / accepted quantity."}
              {purchase.status === STATUS.PENDING_CLAIM && "Next: create supplier claim for damaged prepaid goods."}
              {purchase.status === STATUS.PENDING_STOCK_IN && "Next: open this purchase in Inventory and confirm stock in one time. Only accepted quantity enters inventory."}
              {purchase.status === STATUS.RECEIVED && "Completed: this purchase already entered stock."}
              {purchase.status === STATUS.DRAFT && "Next: continue editing and save purchase."}
              {purchase.status === STATUS.CANCELLED && "This purchase was cancelled."}
            </div>
          </FormSection>
        </div>

        <FormSection title="Purchase Items" subtitle="Invoiced, paid, received, damaged, accepted, claim and expiry quantity." icon={<FiPackage />} theme={theme}>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-red-600 text-white"><tr><th className="px-3 py-3 text-left">Product</th><th className="px-3 py-3 text-left">Invoiced</th><th className="px-3 py-3 text-left">Paid</th><th className="px-3 py-3 text-left">Received</th><th className="px-3 py-3 text-left">Accepted</th><th className="px-3 py-3 text-left">Damaged</th><th className="px-3 py-3 text-left">Claim</th><th className="px-3 py-3 text-left">Base Stock In</th><th className="px-3 py-3 text-left">Expiry</th><th className="px-3 py-3 text-left">Total</th></tr></thead>
              <tbody>
                {purchase.items.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                    <td className="px-3 py-3"><p className="font-semibold">{item.variantName}</p><p className={`mt-1 text-xs ${theme.muted}`}>{item.variantCode} · {item.unitName} = {item.conversionQty} {item.baseUnit}</p></td>
                    <td className="px-3 py-3">{item.invoicedQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.paidQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.receivedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-emerald-500">{item.acceptedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-amber-500">{item.damagedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-red-500">{item.claimQty} {item.unitName}</td>
                    <td className="px-3 py-3">{Number(item.acceptedQty || 0) * Number(item.conversionQty || 1)} {item.baseUnit}</td>
                    <td className="px-3 py-3">{item.expiredDate || "-"}</td>
                    <td className="px-3 py-3 font-semibold">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FormSection title="Supplier Claims / Purchase Returns" subtitle="Claims created from this purchase." icon={<FiRotateCcw />} theme={theme}>
            {relatedReturns.length === 0 ? <EmptyState theme={theme} icon={<FiRotateCcw />} title="No supplier claim" description="No purchase return or supplier claim has been created for this purchase." /> : (
              <div className="space-y-3">{relatedReturns.map((item) => <div key={item.id} className={`rounded-2xl border p-4 ${theme.softCard}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold">{item.purchaseReturnNo}</p><p className={`mt-1 text-xs ${theme.muted}`}>{formatSnake(item.returnReason)} · {formatSnake(item.resolutionType)}</p></div><StatusBadge status={item.status} getStatusClass={getPurchaseReturnStatusClass} getStatusIcon={getPurchaseReturnStatusIcon} /></div><p className="mt-3 text-sm">{formatMoney(item.subtotal)}</p><p className={`mt-2 text-xs leading-5 ${theme.muted}`}>{item.note || "-"}</p></div>)}</div>
            )}
          </FormSection>

          <FormSection title="Stock Movements" subtitle="Generated after Inventory confirmation." icon={<FiPackage />} theme={theme}>
            {relatedMovements.length === 0 ? <EmptyState theme={theme} icon={<FiPackage />} title="No stock movement" description="Stock movement will appear after Inventory confirmation." /> : (
              <div className="space-y-3">{relatedMovements.map((item) => <div key={item.id} className={`rounded-2xl border p-4 ${theme.softCard}`}><p className="text-sm font-bold">{item.variantName}</p><p className="mt-1 text-sm text-emerald-500">+{item.qtyBase} {item.baseUnit}</p><p className={`mt-1 text-xs ${theme.muted}`}>{item.note}</p></div>)}</div>
            )}
          </FormSection>
        </div>
      </div>
    </ModalShell>
  );
}

function FlowTimeline({ status, theme }) {
  const steps = [STATUS.DRAFT, STATUS.PENDING_RECEIVE, STATUS.PENDING_CLAIM, STATUS.PENDING_STOCK_IN, STATUS.RECEIVED];
  const currentIndex = steps.indexOf(status);
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const active = step === status;
        const done = currentIndex > index;
        return <div key={step} className="flex items-center gap-3"><div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${active ? "bg-red-500 text-white" : done ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"}`}>{done ? <FiCheckCircle /> : index + 1}</div><p className={`text-sm ${active ? "font-bold text-red-500" : theme.muted}`}>{step}</p></div>;
      })}
    </div>
  );
}

function EmptyState({ theme, icon, title, description }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${theme.softCard}`}>
      <div className="text-4xl text-red-500">{icon}</div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>{description}</p>
    </div>
  );
}

function PurchaseReturnModal({ purchase, form, items, itemForm, errors, itemErrors, theme, onChange, onItemChange, onAddItem, onRemoveItem, getAvailableReturnQty, onClose, onSave }) {
  const subtotal = items.reduce((total, item) => total + Number(item.lineTotal || 0), 0);

  return (
    <ModalShell
      title="Supplier Claim / Purchase Return"
      subtitle={`Create claim or return from ${purchase.purchaseNo}.`}
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">Cancel</button>
          <button type="button" onClick={onSave} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"><FiSave />Save Supplier Claim</button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FormSection title="Claim Information" subtitle="Select reason and resolution type." icon={<FiRotateCcw />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Claim No" required value={form.purchaseReturnNo} error={errors.purchaseReturnNo} onChange={(value) => onChange("purchaseReturnNo", value)} theme={theme} icon={<FiHash />} />
              <FormInput label="Return Date" required type="date" value={form.returnDate} error={errors.returnDate} onChange={(value) => onChange("returnDate", value)} theme={theme} icon={<FiCalendar />} />
              <FormSelect label="Return Reason" value={form.returnReason} onChange={(value) => onChange("returnReason", value)} theme={theme} icon={<FiAlertTriangle />} options={[{ value: "damaged", label: "Damaged" }, { value: "wrong_item", label: "Wrong Item" }, { value: "over_supplied", label: "Over Supplied" }, { value: "expired", label: "Expired" }, { value: "other", label: "Other" }]} />
              <FormSelect label="Resolution Type" required value={form.resolutionType} error={errors.resolutionType} onChange={(value) => onChange("resolutionType", value)} theme={theme} icon={<FiCheckCircle />} options={[{ value: "replacement", label: "Replacement" }, { value: "credit_note", label: "Credit Note" }, { value: "refund", label: "Refund" }]} />
              <FormSelect label="Resolution Status" value={form.resolutionStatus} onChange={(value) => onChange("resolutionStatus", value)} theme={theme} icon={<FiClock />} options={[{ value: "draft", label: "Draft" }, { value: "submitted", label: "Submitted" }, { value: "approved", label: "Approved" }, { value: "waiting_replacement", label: "Waiting Replacement" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]} />
            </div>
            <div className="mt-4"><FormTextarea label="Note" value={form.note} onChange={(value) => onChange("note", value)} theme={theme} placeholder="Describe the supplier claim..." icon={<FiFileText />} /></div>
          </FormSection>

          <FormSection title="Source Purchase" subtitle="Claim is linked to this purchase invoice." icon={<FiShoppingCart />} theme={theme}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryMiniBox theme={theme} label="Purchase No" value={purchase.purchaseNo} />
              <SummaryMiniBox theme={theme} label="Supplier" value={purchase.supplierName} />
              <SummaryMiniBox theme={theme} label="Payment Mode" value={formatPaymentMode(purchase.paymentMode)} />
              <SummaryMiniBox theme={theme} label="Claim Total" value={formatMoney(subtotal)} strong />
            </div>
          </FormSection>
        </div>

        <FormSection title="Add Claim Item" subtitle="Choose problem item and quantity to claim / return." icon={<FiPackage />} theme={theme}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr_auto]">
            <FormSelect label="Purchase Item" required value={itemForm.purchaseItemId} error={itemErrors.purchaseItemId} onChange={(value) => onItemChange("purchaseItemId", value)} theme={theme} icon={<FiPackage />} options={[{ value: "", label: "Select item" }, ...purchase.items.map((item) => ({ value: item.id, label: `${item.variantName} · available ${getAvailableReturnQty(item)} ${item.unitName}` }))]} />
            <FormInput label="Claim Qty" required type="number" value={itemForm.qtyReturned} error={itemErrors.qtyReturned} onChange={(value) => onItemChange("qtyReturned", value)} theme={theme} icon={<FiHash />} />
            <FormSelect label="Condition" required value={itemForm.condition} error={itemErrors.condition} onChange={(value) => onItemChange("condition", value)} theme={theme} icon={<FiAlertTriangle />} options={[{ value: "damaged", label: "Damaged" }, { value: "wrong_item", label: "Wrong Item" }, { value: "over_supplied", label: "Over Supplied" }, { value: "expired", label: "Expired" }, { value: "other", label: "Other" }]} />
            <FormInput label="Reason" required value={itemForm.reason} error={itemErrors.reason} onChange={(value) => onItemChange("reason", value)} theme={theme} icon={<FiFileText />} />
            <div className="flex items-end"><button type="button" onClick={onAddItem} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"><FiPlus />Add</button></div>
          </div>
          {errors.items && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">{errors.items}</div>}
        </FormSection>

        <FormSection title="Claim Items" subtitle="Items that will be submitted to supplier." icon={<FiFileText />} theme={theme}>
          {items.length === 0 ? <EmptyState theme={theme} icon={<FiPackage />} title="No claim items" description="Add at least one problem item before saving supplier claim." /> : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-red-600 text-white"><tr><th className="px-3 py-3 text-left">Product</th><th className="px-3 py-3 text-left">Qty</th><th className="px-3 py-3 text-left">Base Qty</th><th className="px-3 py-3 text-left">Condition</th><th className="px-3 py-3 text-left">Stock Action</th><th className="px-3 py-3 text-left">Line Total</th><th className="px-3 py-3 text-center">Action</th></tr></thead>
                <tbody>{items.map((item, index) => <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10"><td className="px-3 py-3"><p className="font-semibold">{item.variantName}</p><p className={`mt-1 text-xs ${theme.muted}`}>{item.reason}</p></td><td className="px-3 py-3">{item.qtyReturned} {item.unitName}</td><td className="px-3 py-3">{item.baseQtyReturned} {item.baseUnit}</td><td className="px-3 py-3 capitalize">{formatSnake(item.condition)}</td><td className="px-3 py-3 capitalize">{formatSnake(item.stockAction)}</td><td className="px-3 py-3 font-semibold">{formatMoney(item.lineTotal)}</td><td className="px-3 py-3 text-center"><button type="button" onClick={() => onRemoveItem(index)} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600"><FiTrash size={15} />Remove</button></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </FormSection>
      </div>
    </ModalShell>
  );
}
