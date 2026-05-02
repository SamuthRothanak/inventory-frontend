import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiShoppingCart,
  FiSearch,
  FiPlusCircle,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTruck,
  FiPackage,
  FiDollarSign,
  FiFilter,
  FiX,
  FiSave,
  FiPlus,
  FiTrash,
  FiFileText,
  FiAlertTriangle,
  FiChevronDown,
  FiUser,
  FiHash,
  FiCalendar,
  FiInfo,
  FiCreditCard,
} from "react-icons/fi";

const initialSuppliers = [
  {
    id: 1,
    supplierCode: "SUP-001",
    name: "Thai Huot Trading",
    contactPerson: "Sok Dara",
    phone: "0887193924",
  },
  {
    id: 2,
    supplierCode: "SUP-002",
    name: "Mengly Wholesale",
    contactPerson: "Mengly",
    phone: "0887193925",
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
    unitCostBase: 0.3,
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
    unitCostBase: 0.85,
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
    unitCostBase: 0.45,
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
    unitCostBase: 0.00075,
    isExpirable: false,
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
    subtotal: 1398,
    discountTotal: 0,
    deliveryOption: "supplier_delivery",
    deliveryFee: 2,
    deliveryFeeCurrency: "USD",
    deliveryPaidBy: "shop",
    grandTotal: 1400,
    note: "Products received from supplier and waiting stock confirmation.",
    status: "Pending Stock In",
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
        invoicedQty: 180,
        receivedQty: 180,
        acceptedQty: 180,
        damagedQty: 0,
        unitCost: 7.2,
        unitCostBase: 0.3,
        lineTotal: 1296,
        expiredDate: "2026-12-31",
      },
      {
        id: 102,
        variantUnitId: 2,
        productName: "Coca-Cola",
        variantName: "Coca-Cola Big Bottle 1.5L",
        variantCode: "COKE-BTL-1500",
        unitName: "Case",
        baseUnit: "Bottle",
        conversionQty: 6,
        invoicedQty: 20,
        receivedQty: 20,
        acceptedQty: 20,
        damagedQty: 0,
        unitCost: 5.1,
        unitCostBase: 0.85,
        lineTotal: 102,
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
    subtotal: 27,
    discountTotal: 0,
    deliveryOption: "shop_pickup",
    deliveryFee: 0,
    deliveryFeeCurrency: "USD",
    deliveryPaidBy: "shop",
    grandTotal: 27,
    note: "Face mask replacement stock.",
    status: "Draft",
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
        invoicedQty: 10,
        receivedQty: 10,
        acceptedQty: 10,
        damagedQty: 0,
        unitCost: 2.7,
        unitCostBase: 0.45,
        lineTotal: 27,
        expiredDate: "2026-10-10",
      },
    ],
  },
];

const emptyPurchaseForm = {
  purchaseNo: "",
  supplierId: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  discountTotal: 0,
  deliveryOption: "none",
  deliveryFee: 0,
  deliveryFeeCurrency: "USD",
  deliveryPaidBy: "shop",
  note: "",
  status: "Draft",
};

const emptyItemForm = {
  variantUnitId: "",
  invoicedQty: "",
  receivedQty: "",
  acceptedQty: "",
  damagedQty: 0,
  unitCost: "",
  expiredDate: "",
};

function useLockBodyScroll(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
}

export default function Purchases() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [purchases, setPurchases] = useState(initialPurchases);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [purchaseItems, setPurchaseItems] = useState([]);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemEditIndex, setItemEditIndex] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);

  const [purchaseErrors, setPurchaseErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});

  useLockBodyScroll(Boolean(modalMode || itemModalOpen));

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

  const filteredPurchases = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return purchases.filter((purchase) => {
      const matchesSearch =
        purchase.purchaseNo.toLowerCase().includes(search) ||
        purchase.supplierName.toLowerCase().includes(search) ||
        purchase.note.toLowerCase().includes(search) ||
        purchase.items.some(
          (item) =>
            item.variantName.toLowerCase().includes(search) ||
            item.variantCode.toLowerCase().includes(search)
        );

      const matchesStatus =
        statusFilter === "All" || purchase.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  const totalPurchases = purchases.length;

  const draftPurchases = purchases.filter(
    (item) => item.status === "Draft"
  ).length;

  const pendingStockIn = purchases.filter(
    (item) => item.status === "Pending Stock In"
  ).length;

  const receivedPurchases = purchases.filter(
    (item) => item.status === "Received"
  ).length;

  const totalPurchaseAmount = purchases.reduce(
    (total, item) => total + Number(item.grandTotal || 0),
    0
  );

  const calculateSubtotal = (items) => {
    return items.reduce((total, item) => total + Number(item.lineTotal || 0), 0);
  };

  const calculateGrandTotal = (items, form) => {
    const subtotal = calculateSubtotal(items);

    return (
      Number(subtotal || 0) -
      Number(form.discountTotal || 0) +
      Number(form.deliveryFee || 0)
    );
  };

  const getStatusClass = (status) => {
    if (status === "Received") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    if (status === "Pending Stock In") {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }

    if (status === "Draft") {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }

    return "bg-red-500/10 text-red-500 dark:text-red-400";
  };

  const getStatusIcon = (status) => {
    if (status === "Received") return <FiCheckCircle />;
    if (status === "Pending Stock In") return <FiClock />;
    if (status === "Draft") return <FiFileText />;
    return <FiXCircle />;
  };

  const openAddModal = () => {
    setSelectedPurchase(null);
    setPurchaseErrors({});
    setItemErrors({});
    setPurchaseForm({
      ...emptyPurchaseForm,
      purchaseNo: `PUR-${String(purchases.length + 1).padStart(3, "0")}`,
    });
    setPurchaseItems([]);
    setModalMode("add");
  };

  const openViewModal = (purchase) => {
    setPurchaseErrors({});
    setItemErrors({});
    setSelectedPurchase(purchase);
    setModalMode("view");
  };

  const openEditModal = (purchase) => {
    setPurchaseErrors({});
    setItemErrors({});
    setSelectedPurchase(purchase);

    setPurchaseForm({
      purchaseNo: purchase.purchaseNo,
      supplierId: purchase.supplierId,
      purchaseDate: purchase.purchaseDate,
      discountTotal: purchase.discountTotal,
      deliveryOption: purchase.deliveryOption,
      deliveryFee: purchase.deliveryFee,
      deliveryFeeCurrency: purchase.deliveryFeeCurrency,
      deliveryPaidBy: purchase.deliveryPaidBy,
      note: purchase.note,
      status: purchase.status,
    });

    setPurchaseItems(purchase.items);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedPurchase(null);
    setPurchaseForm(emptyPurchaseForm);
    setPurchaseItems([]);
    setPurchaseErrors({});
    setItemErrors({});
    closeItemModal();
  };

  const handlePurchaseFormChange = (field, value) => {
    setPurchaseForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setPurchaseErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
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
      receivedQty: item.receivedQty,
      acceptedQty: item.acceptedQty,
      damagedQty: item.damagedQty,
      unitCost: item.unitCost,
      expiredDate: item.expiredDate,
    });
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setItemEditIndex(null);
    setItemForm(emptyItemForm);
    setItemErrors({});
  };

  const handleItemFormChange = (field, value) => {
    setItemForm((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };

      if (field === "variantUnitId") {
        const selected = initialVariantUnits.find(
          (unit) => String(unit.id) === String(value)
        );

        if (selected) {
          next.unitCost = selected.defaultCost;
          next.expiredDate = selected.isExpirable
            ? next.expiredDate || ""
            : "";
        }
      }

      if (field === "invoicedQty") {
        next.receivedQty = next.receivedQty || value;
        next.acceptedQty = next.acceptedQty || value;
      }

      if (field === "receivedQty") {
        next.acceptedQty = next.acceptedQty || value;
      }

      return next;
    });

    setItemErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const buildPurchaseItemFromForm = () => {
    const selectedUnit = initialVariantUnits.find(
      (unit) => String(unit.id) === String(itemForm.variantUnitId)
    );

    if (!selectedUnit) return null;

    const acceptedQty = Number(itemForm.acceptedQty || 0);
    const unitCost = Number(itemForm.unitCost || 0);
    const lineTotal = acceptedQty * unitCost;
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
      invoicedQty: Number(itemForm.invoicedQty || 0),
      receivedQty: Number(itemForm.receivedQty || 0),
      acceptedQty,
      damagedQty: Number(itemForm.damagedQty || 0),
      unitCost,
      unitCostBase,
      lineTotal,
      expiredDate: selectedUnit.isExpirable ? itemForm.expiredDate : "",
    };
  };

  const validatePurchaseItem = () => {
    const nextErrors = {};
    const selectedUnit = initialVariantUnits.find(
      (unit) => String(unit.id) === String(itemForm.variantUnitId)
    );

    if (!itemForm.variantUnitId) {
      nextErrors.variantUnitId = "Please select product variant.";
    }

    if (!itemForm.invoicedQty || Number(itemForm.invoicedQty) <= 0) {
      nextErrors.invoicedQty = "Invoiced quantity must be greater than 0.";
    }

    if (!itemForm.receivedQty || Number(itemForm.receivedQty) < 0) {
      nextErrors.receivedQty = "Received quantity is required.";
    }

    if (itemForm.acceptedQty === "" || Number(itemForm.acceptedQty) < 0) {
      nextErrors.acceptedQty = "Accepted quantity cannot be negative.";
    }

    if (Number(itemForm.acceptedQty || 0) > Number(itemForm.receivedQty || 0)) {
      nextErrors.acceptedQty = "Accepted quantity cannot exceed received qty.";
    }

    if (Number(itemForm.damagedQty || 0) < 0) {
      nextErrors.damagedQty = "Damaged quantity cannot be negative.";
    }

    if (!itemForm.unitCost || Number(itemForm.unitCost) <= 0) {
      nextErrors.unitCost = "Unit cost must be greater than 0.";
    }

    if (selectedUnit?.isExpirable && !itemForm.expiredDate) {
      nextErrors.expiredDate = "Expiry date is required for this item.";
    }

    setItemErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveItem = () => {
    if (!validatePurchaseItem()) return;

    const item = buildPurchaseItemFromForm();

    if (!item) {
      setItemErrors({ variantUnitId: "Invalid purchase item." });
      return;
    }

    if (itemEditIndex !== null) {
      setPurchaseItems((previous) =>
        previous.map((row, index) =>
          index === itemEditIndex ? { ...item, id: row.id } : row
        )
      );
    } else {
      setPurchaseItems((previous) => [...previous, item]);
    }

    closeItemModal();
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );

    setPurchaseErrors((previous) => ({
      ...previous,
      items: "",
    }));
  };

  const buildPurchasePayload = (statusOverride = null) => {
    const supplier = initialSuppliers.find(
      (item) => String(item.id) === String(purchaseForm.supplierId)
    );

    const subtotal = calculateSubtotal(purchaseItems);
    const grandTotal = calculateGrandTotal(purchaseItems, purchaseForm);
    const now = new Date().toISOString().slice(0, 10);

    return {
      id: selectedPurchase?.id || Date.now(),
      purchaseNo: purchaseForm.purchaseNo.trim(),
      supplierId: supplier?.id || "",
      supplierName: supplier?.name || "",
      createdBy: "Admin",
      purchaseDate: purchaseForm.purchaseDate,
      subtotal,
      discountTotal: Number(purchaseForm.discountTotal || 0),
      deliveryOption: purchaseForm.deliveryOption,
      deliveryFee: Number(purchaseForm.deliveryFee || 0),
      deliveryFeeCurrency: purchaseForm.deliveryFeeCurrency,
      deliveryPaidBy: purchaseForm.deliveryPaidBy,
      grandTotal,
      note: purchaseForm.note.trim(),
      status: statusOverride || purchaseForm.status,
      createdAt: selectedPurchase?.createdAt || now,
      updatedAt: now,
      items: purchaseItems,
    };
  };

  const validatePurchaseForm = () => {
    const nextErrors = {};

    if (!purchaseForm.purchaseNo.trim()) {
      nextErrors.purchaseNo = "Purchase number is required.";
    }

    if (!purchaseForm.supplierId) {
      nextErrors.supplierId = "Please select supplier.";
    }

    if (!purchaseForm.purchaseDate) {
      nextErrors.purchaseDate = "Purchase date is required.";
    }

    if (Number(purchaseForm.discountTotal || 0) < 0) {
      nextErrors.discountTotal = "Discount cannot be negative.";
    }

    if (Number(purchaseForm.deliveryFee || 0) < 0) {
      nextErrors.deliveryFee = "Delivery fee cannot be negative.";
    }

    if (purchaseItems.length === 0) {
      nextErrors.items = "Please add at least one purchase item.";
    }

    setPurchaseErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSavePurchase = (statusOverride = null) => {
    if (!validatePurchaseForm()) return;

    const payload = buildPurchasePayload(statusOverride);

    if (modalMode === "add") {
      setPurchases((previous) => [payload, ...previous]);
      closeModal();
      return;
    }

    if (modalMode === "edit" && selectedPurchase) {
      setPurchases((previous) =>
        previous.map((item) => (item.id === selectedPurchase.id ? payload : item))
      );

      closeModal();
    }
  };

  const handleCancelPurchase = (purchase) => {
    const ok = window.confirm(`Cancel ${purchase.purchaseNo}?`);
    if (!ok) return;

    setPurchases((previous) =>
      previous.map((item) =>
        item.id === purchase.id
          ? {
              ...item,
              status: "Cancelled",
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          theme={theme}
          title="Total Purchases"
          value={totalPurchases}
          icon={<FiShoppingCart className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Draft"
          value={draftPurchases}
          icon={<FiFileText className="text-[34px] text-amber-500" />}
          iconBg="bg-amber-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Pending Stock In"
          value={pendingStockIn}
          icon={<FiClock className="text-[34px] text-blue-500" />}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Total Amount"
          value={`$${totalPurchaseAmount.toFixed(2)}`}
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:max-w-4xl xl:grid-cols-[1fr_220px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="Search purchase, supplier, product, variant..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <div className="relative">
            <FiFilter
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${theme.select}`}
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending Stock In">Pending Stock In</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <FiChevronDown
              className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />
          </div>
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

      {pendingStockIn > 0 && (
        <div
          className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between ${theme.card}`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
              <FiTruck className="text-4xl text-blue-500" />
            </div>

            <div>
              <h3 className="text-base font-bold">Pending Stock In</h3>

              <p className={`mt-1 text-sm ${theme.muted}`}>
                {pendingStockIn} purchase
                {pendingStockIn > 1 ? "s are" : " is"} ready for inventory
                confirmation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStatusFilter("Pending Stock In")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <FiClock />
            View Pending
          </button>
        </div>
      )}

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
              Purchase List
            </h2>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Showing {filteredPurchases.length} of {purchases.length} purchases
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Purchase
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Supplier
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Items
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Delivery
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Total
                </th>
                <th className="px-5 py-3 text-center text-sm font-semibold">
                  Status
                </th>
                <th className="px-5 py-3 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className={`border-t transition ${theme.row}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiShoppingCart size={21} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {purchase.purchaseNo}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                          >
                            {purchase.purchaseDate}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            By {purchase.createdBy}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">
                      {purchase.supplierName}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Supplier purchase invoice
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">
                      {purchase.items.length} item
                      {purchase.items.length > 1 ? "s" : ""}
                    </p>

                    <p
                      className={`mt-1 max-w-[280px] truncate text-xs ${theme.muted}`}
                    >
                      {purchase.items.map((item) => item.variantName).join(", ")}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold capitalize">
                      {purchase.deliveryOption.replaceAll("_", " ")}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Fee: ${Number(purchase.deliveryFee || 0).toFixed(2)} · Paid
                      by {purchase.deliveryPaidBy}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">
                      ${Number(purchase.grandTotal || 0).toFixed(2)}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Subtotal ${Number(purchase.subtotal || 0).toFixed(2)}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <StatusBadge
                      status={purchase.status}
                      getStatusClass={getStatusClass}
                      getStatusIcon={getStatusIcon}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openViewModal(purchase)}
                        title="View purchase"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(purchase)}
                        disabled={purchase.status === "Received"}
                        title={
                          purchase.status === "Received"
                            ? "Received purchase cannot be edited"
                            : "Edit purchase"
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelPurchase(purchase)}
                        disabled={purchase.status === "Received"}
                        title={
                          purchase.status === "Received"
                            ? "Received purchase cannot be cancelled"
                            : "Cancel purchase"
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPurchases.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="7" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                      >
                        <FiSearch className={`text-3xl ${theme.muted}`} />
                      </div>

                      <p
                        className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                      >
                        No purchases found
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Try changing your search keyword or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode === "view" && selectedPurchase && (
        <ViewPurchaseModal
          purchase={selectedPurchase}
          theme={theme}
          getStatusClass={getStatusClass}
          getStatusIcon={getStatusIcon}
          onClose={closeModal}
        />
      )}

      {(modalMode === "add" || modalMode === "edit") && (
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
          onSaveDraft={() => handleSavePurchase("Draft")}
          onReadyStockIn={() => handleSavePurchase("Pending Stock In")}
          calculateSubtotal={calculateSubtotal}
          calculateGrandTotal={calculateGrandTotal}
        />
      )}

      {itemModalOpen && (
        <PurchaseItemModal
          mode={itemEditIndex === null ? "add" : "edit"}
          form={itemForm}
          errors={itemErrors}
          variantUnits={initialVariantUnits}
          theme={theme}
          onChange={handleItemFormChange}
          onClose={closeItemModal}
          onSave={handleSaveItem}
        />
      )}
    </section>
  );
}

function SummaryCard({ theme, title, value, icon, iconBg }) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div>
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-1 text-3xl font-bold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  theme,
  onClose,
  children,
  footer,
  width = "max-w-6xl",
}) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex h-auto max-h-[90dvh] w-full ${width} flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
      >
        <div className={`shrink-0 border-b px-6 py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>

              {subtitle && (
                <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        <div
          className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 ${theme.modalBody}`}
        >
          {children}
        </div>

        {footer && (
          <div className={`shrink-0 border-t px-6 py-4 ${theme.modalHeader}`}>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
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
  onReadyStockIn,
  calculateSubtotal,
  calculateGrandTotal,
}) {
  const title = mode === "add" ? "Add Purchase" : "Edit Purchase";
  const subtotal = calculateSubtotal(items);
  const grandTotal = calculateGrandTotal(items, form);

  return (
    <ModalShell
      title={title}
      subtitle="Create purchase invoice and send it to Inventory for stock-in confirmation."
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
          >
            <FiSave />
            Save Draft
          </button>

          <button
            type="button"
            onClick={onReadyStockIn}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            <FiCheckCircle />
            Ready for Stock In
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <FormSection
          title="1. Purchase Information"
          subtitle="Supplier, invoice number, date, and purchase status."
          icon={<FiShoppingCart />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Purchase No"
              required
              value={form.purchaseNo}
              error={errors.purchaseNo}
              onChange={(value) => onChange("purchaseNo", value)}
              theme={theme}
              placeholder="PUR-001"
              icon={<FiHash />}
            />

            <FormSelect
              label="Supplier"
              required
              value={form.supplierId}
              error={errors.supplierId}
              onChange={(value) => onChange("supplierId", value)}
              theme={theme}
              icon={<FiUser />}
              options={[
                { value: "", label: "Select supplier" },
                ...suppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.name,
                })),
              ]}
            />

            <FormInput
              label="Purchase Date"
              required
              type="date"
              value={form.purchaseDate}
              error={errors.purchaseDate}
              onChange={(value) => onChange("purchaseDate", value)}
              theme={theme}
              icon={<FiCalendar />}
            />

            <FormSelect
              label="Status"
              value={form.status}
              onChange={(value) => onChange("status", value)}
              theme={theme}
              icon={<FiClock />}
              options={[
                { value: "Draft", label: "Draft" },
                { value: "Pending Stock In", label: "Pending Stock In" },
                { value: "Cancelled", label: "Cancelled" },
              ]}
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Note"
              value={form.note}
              onChange={(value) => onChange("note", value)}
              theme={theme}
              placeholder="Purchase note..."
              icon={<FiFileText />}
            />
          </div>
        </FormSection>

        <FormSection
          title="2. Purchase Items"
          subtitle="Add product variants, quantity, cost, damage, and expiry."
          icon={<FiPackage />}
          theme={theme}
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Items</p>

              <p className={`mt-1 text-xs ${theme.muted}`}>
                Add all items from supplier invoice.
              </p>
            </div>

            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <FiPlus />
              Add Item
            </button>
          </div>

          {errors.items && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">
              {errors.items}
            </div>
          )}

          {items.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${theme.softCard}`}
            >
              <FiPackage className="text-4xl text-red-500" />

              <p className="mt-3 text-sm font-semibold">No purchase items</p>

              <p className={`mt-1 text-xs ${theme.muted}`}>
                Example: Coca-Cola Can 330ml, Case, 180 cases.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Product Variant</th>
                    <th className="px-3 py-3 text-left">Qty</th>
                    <th className="px-3 py-3 text-left">Accepted</th>
                    <th className="px-3 py-3 text-left">Damaged</th>
                    <th className="px-3 py-3 text-left">Cost</th>
                    <th className="px-3 py-3 text-left">Expiry</th>
                    <th className="px-3 py-3 text-left">Line Total</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-200 dark:border-white/10"
                    >
                      <td className="px-3 py-3">
                        <p className="font-semibold">{item.variantName}</p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {item.variantCode} · {item.unitName} ={" "}
                          {item.conversionQty} {item.baseUnit}
                        </p>
                      </td>

                      <td className="px-3 py-3">
                        {Number(item.invoicedQty).toLocaleString()}{" "}
                        {item.unitName}
                      </td>

                      <td className="px-3 py-3">
                        {Number(item.acceptedQty).toLocaleString()}{" "}
                        {item.unitName}
                      </td>

                      <td className="px-3 py-3">
                        {Number(item.damagedQty).toLocaleString()}{" "}
                        {item.unitName}
                      </td>

                      <td className="px-3 py-3">
                        ${Number(item.unitCost).toFixed(2)}
                      </td>

                      <td className="px-3 py-3">{item.expiredDate || "-"}</td>

                      <td className="px-3 py-3 font-semibold">
                        ${Number(item.lineTotal).toFixed(2)}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditItem(item, index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <FiEdit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600"
                          >
                            <FiTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>

        <FormSection
          title="3. Delivery & Summary"
          subtitle="Delivery information, discount, fee, and total amount."
          icon={<FiTruck />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Delivery Option"
              value={form.deliveryOption}
              onChange={(value) => onChange("deliveryOption", value)}
              theme={theme}
              icon={<FiTruck />}
              options={[
                { value: "none", label: "None" },
                { value: "supplier_delivery", label: "Supplier Delivery" },
                { value: "shop_pickup", label: "Shop Pickup" },
                { value: "third_party_delivery", label: "Third Party Delivery" },
              ]}
            />

            <FormSelect
              label="Delivery Paid By"
              value={form.deliveryPaidBy}
              onChange={(value) => onChange("deliveryPaidBy", value)}
              theme={theme}
              icon={<FiUser />}
              options={[
                { value: "shop", label: "Shop" },
                { value: "supplier", label: "Supplier" },
                {
                  value: "included_in_invoice",
                  label: "Included in Invoice",
                },
              ]}
            />

            <FormInput
              label="Delivery Fee"
              type="number"
              value={form.deliveryFee}
              error={errors.deliveryFee}
              onChange={(value) => onChange("deliveryFee", value)}
              theme={theme}
              icon={<FiDollarSign />}
            />

            <FormInput
              label="Discount Total"
              type="number"
              value={form.discountTotal}
              error={errors.discountTotal}
              onChange={(value) => onChange("discountTotal", value)}
              theme={theme}
              icon={<FiCreditCard />}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryMiniBox
              theme={theme}
              label="Subtotal"
              value={`$${subtotal.toFixed(2)}`}
            />

            <SummaryMiniBox
              theme={theme}
              label="Delivery Fee"
              value={`$${Number(form.deliveryFee || 0).toFixed(2)}`}
            />

            <SummaryMiniBox
              theme={theme}
              label="Grand Total"
              value={`$${grandTotal.toFixed(2)}`}
              strong
            />
          </div>
        </FormSection>
      </div>
    </ModalShell>
  );
}

function PurchaseItemModal({
  mode,
  form,
  errors,
  variantUnits,
  theme,
  onChange,
  onClose,
  onSave,
}) {
  const selectedUnit = variantUnits.find(
    (unit) => String(unit.id) === String(form.variantUnitId)
  );

  const acceptedQty = Number(form.acceptedQty || 0);
  const unitCost = Number(form.unitCost || 0);
  const lineTotal = acceptedQty * unitCost;

  return (
    <ModalShell
      title={mode === "add" ? "Add Purchase Item" : "Edit Purchase Item"}
      subtitle="Set purchased variant, quantity, accepted quantity, damage, cost, and expiry."
      theme={theme}
      onClose={onClose}
      width="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            <FiSave />
            Save Item
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <FormSection
          title="Purchase Item Information"
          subtitle="Select product variant, quantity, accepted quantity, damage, cost, and expiry."
          icon={<FiPackage />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Product Variant / Unit"
              required
              value={form.variantUnitId}
              error={errors.variantUnitId}
              onChange={(value) => onChange("variantUnitId", value)}
              theme={theme}
              icon={<FiPackage />}
              options={[
                { value: "", label: "Select product variant" },
                ...variantUnits.map((unit) => ({
                  value: unit.id,
                  label: `${unit.variantName} · ${unit.unitName}`,
                })),
              ]}
            />

            <FormInput
              label="Unit Cost"
              required
              type="number"
              value={form.unitCost}
              error={errors.unitCost}
              onChange={(value) => onChange("unitCost", value)}
              theme={theme}
              placeholder="0.00"
              icon={<FiDollarSign />}
            />

            <FormInput
              label="Invoiced Qty"
              required
              type="number"
              value={form.invoicedQty}
              error={errors.invoicedQty}
              onChange={(value) => onChange("invoicedQty", value)}
              theme={theme}
              icon={<FiHash />}
            />

            <FormInput
              label="Received Qty"
              required
              type="number"
              value={form.receivedQty}
              error={errors.receivedQty}
              onChange={(value) => onChange("receivedQty", value)}
              theme={theme}
              icon={<FiTruck />}
            />

            <FormInput
              label="Accepted Qty"
              required
              type="number"
              value={form.acceptedQty}
              error={errors.acceptedQty}
              onChange={(value) => onChange("acceptedQty", value)}
              theme={theme}
              icon={<FiCheckCircle />}
            />

            <FormInput
              label="Damaged Qty"
              type="number"
              value={form.damagedQty}
              error={errors.damagedQty}
              onChange={(value) => onChange("damagedQty", value)}
              theme={theme}
              icon={<FiAlertTriangle />}
            />

            <FormInput
              label="Expiry Date"
              type="date"
              value={form.expiredDate}
              error={errors.expiredDate}
              onChange={(value) => onChange("expiredDate", value)}
              theme={theme}
              icon={<FiCalendar />}
            />
          </div>
        </FormSection>

        {selectedUnit && (
          <FormSection
            title="Conversion Preview"
            subtitle={`${selectedUnit.unitName} = ${selectedUnit.conversionQty} ${selectedUnit.baseUnit}`}
            icon={<FiInfo />}
            theme={theme}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryMiniBox
                theme={theme}
                label="Accepted Base Qty"
                value={`${(
                  acceptedQty * Number(selectedUnit.conversionQty || 1)
                ).toLocaleString()} ${selectedUnit.baseUnit}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Unit Cost Base"
                value={`$${(
                  unitCost / Number(selectedUnit.conversionQty || 1)
                ).toFixed(4)}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Line Total"
                value={`$${lineTotal.toFixed(2)}`}
                strong
              />
            </div>

            {Number(form.damagedQty || 0) > 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
                <FiAlertTriangle className="mt-0.5 shrink-0" />

                <span>
                  Damaged quantity should not enter stock. It can be handled by
                  purchase return later.
                </span>
              </div>
            )}
          </FormSection>
        )}
      </div>
    </ModalShell>
  );
}

function ViewPurchaseModal({
  purchase,
  theme,
  getStatusClass,
  getStatusIcon,
  onClose,
}) {
  return (
    <ModalShell
      title={purchase.purchaseNo}
      subtitle={`${purchase.supplierName} · ${purchase.purchaseDate}`}
      theme={theme}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Close
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <FiShoppingCart size={38} />
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <InfoLine label="Purchase No" value={purchase.purchaseNo} />
            <InfoLine label="Supplier" value={purchase.supplierName} />
            <InfoLine label="Purchase Date" value={purchase.purchaseDate} />
            <InfoLine label="Created By" value={purchase.createdBy} />
            <InfoLine
              label="Delivery"
              value={purchase.deliveryOption.replaceAll("_", " ")}
            />

            <div>
              <p className="text-xs font-semibold text-zinc-500">Status</p>

              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                  purchase.status
                )}`}
              >
                {getStatusIcon(purchase.status)}
                {purchase.status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <FormSection
            title="Purchase Items"
            subtitle="All variants included in this purchase invoice."
            icon={<FiPackage />}
            theme={theme}
          >
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Variant</th>
                    <th className="px-3 py-3 text-left">Qty</th>
                    <th className="px-3 py-3 text-left">Accepted</th>
                    <th className="px-3 py-3 text-left">Damaged</th>
                    <th className="px-3 py-3 text-left">Cost</th>
                    <th className="px-3 py-3 text-left">Expiry</th>
                    <th className="px-3 py-3 text-left">Line Total</th>
                  </tr>
                </thead>

                <tbody>
                  {purchase.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-200 dark:border-white/10"
                    >
                      <td className="px-3 py-3">
                        <p className="font-semibold">{item.variantName}</p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {item.variantCode} · {item.unitName} ={" "}
                          {item.conversionQty} {item.baseUnit}
                        </p>
                      </td>

                      <td className="px-3 py-3">
                        {item.invoicedQty} {item.unitName}
                      </td>

                      <td className="px-3 py-3">
                        {item.acceptedQty} {item.unitName}
                      </td>

                      <td className="px-3 py-3">
                        {item.damagedQty} {item.unitName}
                      </td>

                      <td className="px-3 py-3">
                        ${Number(item.unitCost).toFixed(2)}
                      </td>

                      <td className="px-3 py-3">{item.expiredDate || "-"}</td>

                      <td className="px-3 py-3 font-semibold">
                        ${Number(item.lineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>

          <FormSection
            title="Summary"
            subtitle="Purchase cost, delivery, discount, and note."
            icon={<FiDollarSign />}
            theme={theme}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <SummaryMiniBox
                theme={theme}
                label="Subtotal"
                value={`$${Number(purchase.subtotal).toFixed(2)}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Discount"
                value={`$${Number(purchase.discountTotal).toFixed(2)}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Delivery"
                value={`$${Number(purchase.deliveryFee).toFixed(2)}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Grand Total"
                value={`$${Number(purchase.grandTotal).toFixed(2)}`}
                strong
              />
            </div>

            <div className="mt-5">
              <p className={`text-xs font-semibold ${theme.muted}`}>Note</p>

              <p className="mt-2 text-sm leading-6">{purchase.note || "-"}</p>
            </div>
          </FormSection>
        </div>
      </div>
    </ModalShell>
  );
}

function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold">{title}</h3>

          {subtitle && (
            <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function StatusBadge({ status, getStatusClass, getStatusIcon }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
        status
      )}`}
    >
      {getStatusIcon(status)}
      {status}
    </span>
  );
}

function FormInput({
  label,
  required = false,
  value,
  onChange,
  theme,
  error = "",
  type = "text",
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  theme,
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`w-full resize-none rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${
            theme.input
          }`}
        />
      </div>
    </label>
  );
}

function FormSelect({
  label,
  required = false,
  value,
  onChange,
  options,
  theme,
  error = "",
  icon,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${
            theme.select
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FiChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function SummaryMiniBox({ theme, label, value, strong = false }) {
  return (
    <div className={`rounded-xl border p-4 ${theme.softCard}`}>
      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>

      <p
        className={`mt-2 ${
          strong ? "text-xl font-bold" : "text-sm font-semibold"
        }`}
      >
        {value}
      </p>
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