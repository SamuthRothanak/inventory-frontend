  import React, { useEffect, useMemo, useState } from "react";
  import { useOutletContext } from "react-router-dom";
  import {
    FiBox,
    FiSearch,
    FiPlusCircle,
    FiEye,
    FiCheckCircle,
    FiXCircle,
    FiAlertTriangle,
    FiPackage,
    FiTrendingUp,
    FiTrendingDown,
    FiFilter,
    FiX,
    FiSave,
    FiLayers,
    FiList,
    FiClock,
    FiDollarSign,
    FiTruck,
    FiClipboard,
    FiEdit2,
    FiChevronDown,
    FiHash,
    FiInfo,
    FiFileText,
    FiTag,
  } from "react-icons/fi";

  const getToday = () => new Date().toISOString().slice(0, 10);
  const getNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

  const initialInventory = [
    {
      id: 1,
      productName: "Coca-Cola",
      variantName: "Coca-Cola Can 330ml",
      variantCode: "COKE-CAN-330",
      category: "Beverage",
      imagePath: "",
      baseUnit: "Can",
      stockBaseQty: 0,
      lowStockThreshold: 20,
      unitCostBase: 0.3,
      status: "Out of Stock",
      units: [
        { id: 1, unitName: "Can", conversionQty: 1, isBaseUnit: true },
        { id: 2, unitName: "Case", conversionQty: 24, isBaseUnit: false },
      ],
      batches: [],
      movements: [],
    },
    {
      id: 2,
      productName: "Coca-Cola",
      variantName: "Coca-Cola Big Bottle 1.5L",
      variantCode: "COKE-BTL-1500",
      category: "Beverage",
      imagePath: "",
      baseUnit: "Bottle",
      stockBaseQty: 0,
      lowStockThreshold: 10,
      unitCostBase: 0.85,
      status: "Out of Stock",
      units: [
        { id: 5, unitName: "Bottle", conversionQty: 1, isBaseUnit: true },
        { id: 6, unitName: "Case", conversionQty: 6, isBaseUnit: false },
      ],
      batches: [],
      movements: [],
    },
    {
      id: 3,
      productName: "Face Mask",
      variantName: "Face Mask Box",
      variantCode: "MASK-BOX",
      category: "Cosmetic",
      imagePath: "",
      baseUnit: "Box",
      stockBaseQty: 8,
      lowStockThreshold: 10,
      unitCostBase: 0.45,
      status: "Low Stock",
      units: [
        { id: 11, unitName: "Box", conversionQty: 1, isBaseUnit: true },
        { id: 12, unitName: "Set", conversionQty: 6, isBaseUnit: false },
      ],
      batches: [
        {
          id: 1,
          batchNo: "BATCH-003",
          lotNo: "LOT-MASK-001",
          expiredDate: "2026-10-10",
          qtyReceivedBase: 60,
          qtyRemainingBase: 8,
          unitCostBase: 0.45,
          receivedAt: "2026-04-30",
          status: "active",
        },
      ],
      movements: [
        {
          type: "purchase_in",
          qtyBase: 60,
          refType: "purchase",
          refId: 1,
          note: "Purchase stock",
          createdAt: "2026-04-30",
        },
        {
          type: "sale_out",
          qtyBase: -52,
          refType: "sale",
          refId: 1,
          note: "POS sales",
          createdAt: "2026-05-01",
        },
      ],
    },
    {
      id: 4,
      productName: "Sugar",
      variantName: "Sugar Loose",
      variantCode: "SUGAR-LOOSE",
      category: "Food",
      imagePath: "",
      baseUnit: "Gram",
      stockBaseQty: 0,
      lowStockThreshold: 5000,
      unitCostBase: 0.001,
      status: "Out of Stock",
      units: [
        { id: 13, unitName: "Gram", conversionQty: 1, isBaseUnit: true },
        { id: 14, unitName: "Kg", conversionQty: 1000, isBaseUnit: false },
      ],
      batches: [],
      movements: [
        {
          type: "sale_out",
          qtyBase: -25000,
          refType: "sale",
          refId: 1,
          note: "Sold out",
          createdAt: "2026-05-01",
        },
      ],
    },
  ];

  const initialPendingPurchases = [
    {
      id: 1,
      purchaseNo: "PUR-001",
      supplierName: "Thai Huot Trading",
      purchaseDate: "2026-05-01",
      status: "Pending Stock In",
      totalItems: 2,
      note: "Products received from supplier and waiting stock confirmation.",
      items: [
        {
          inventoryId: 1,
          productVariantUnitId: 2,
          variantName: "Coca-Cola Can 330ml",
          qty: 180,
          unitName: "Case",
          conversionQty: 24,
          baseQty: 4320,
          unitCostBase: 0.3,
          expiredDate: "2026-12-31",
        },
        {
          inventoryId: 2,
          productVariantUnitId: 6,
          variantName: "Coca-Cola Big Bottle 1.5L",
          qty: 20,
          unitName: "Case",
          conversionQty: 6,
          baseQty: 120,
          unitCostBase: 0.85,
          expiredDate: "2026-12-31",
        },
      ],
    },
    {
      id: 2,
      purchaseNo: "PUR-002",
      supplierName: "Mengly Wholesale",
      purchaseDate: "2026-05-02",
      status: "Pending Stock In",
      totalItems: 1,
      note: "Face mask replacement stock.",
      items: [
        {
          inventoryId: 3,
          productVariantUnitId: 12,
          variantName: "Face Mask Box",
          qty: 10,
          unitName: "Set",
          conversionQty: 6,
          baseQty: 60,
          unitCostBase: 0.45,
          expiredDate: "2026-10-10",
        },
      ],
    },
  ];

  const initialStockAdjustments = [];

  const emptyAdjustmentForm = {
    inventoryId: "",
    adjustmentType: "decrease",
    reason: "damaged",
    qty: "",
    unitName: "",
    inventoryBatchId: "",
    note: "",
  };

  const adjustmentReasons = [
    { value: "damaged", label: "Damaged" },
    { value: "expired", label: "Expired" },
    { value: "internal_use", label: "Internal Use" },
    { value: "lost", label: "Lost" },
    { value: "stock_count", label: "Stock Count" },
    { value: "correction", label: "Correction" },
    { value: "other", label: "Other" },
  ];

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

  export default function Inventory() {
    const outlet = useOutletContext();
    const isDark = outlet?.isDark ?? false;

    const [inventory, setInventory] = useState(initialInventory);
    const [pendingPurchases, setPendingPurchases] = useState(
      initialPendingPurchases
    );
    const [stockAdjustments, setStockAdjustments] = useState(
      initialStockAdjustments
    );

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedItem, setSelectedItem] = useState(null);
    const [modalMode, setModalMode] = useState(null);
    const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm);
    const [errors, setErrors] = useState({});

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

    const getStockStatus = (stockQty, threshold) => {
      if (Number(stockQty) <= 0) return "Out of Stock";
      if (Number(stockQty) <= Number(threshold)) return "Low Stock";
      return "In Stock";
    };

    const getMovementTypeFromAdjustment = (adjustmentType, reason) => {
      if (adjustmentType === "increase") return "adjustment_in";

      const movementMap = {
        damaged: "damage_out",
        expired: "expired_out",
        internal_use: "internal_use_out",
        lost: "lost_out",
        stock_count: "adjustment_out",
        correction: "adjustment_out",
        other: "adjustment_out",
      };

      return movementMap[reason] || "adjustment_out";
    };

    const filteredInventory = useMemo(() => {
      const search = searchTerm.toLowerCase();

      return inventory.filter((item) => {
        const matchesSearch =
          item.productName.toLowerCase().includes(search) ||
          item.variantName.toLowerCase().includes(search) ||
          item.variantCode.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search);

        const matchesStatus =
          statusFilter === "All" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
      });
    }, [inventory, searchTerm, statusFilter]);

    const totalStockItems = inventory.length;

    const lowStockItems = inventory.filter(
      (item) =>
        Number(item.stockBaseQty) > 0 &&
        Number(item.stockBaseQty) <= Number(item.lowStockThreshold)
    ).length;

    const stockValue = inventory.reduce(
      (total, item) =>
        total + Number(item.stockBaseQty || 0) * Number(item.unitCostBase || 0),
      0
    );

    const lowStockList = inventory.filter(
      (item) => item.status === "Low Stock" || item.status === "Out of Stock"
    );

    const getStatusClass = (status) => {
      if (status === "In Stock") {
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      }

      if (status === "Low Stock") {
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      }

      return "bg-red-500/10 text-red-500 dark:text-red-400";
    };

    const getVariantStockBreakdown = (item) => {
      const baseText = `${Number(item.stockBaseQty).toLocaleString()} ${
        item.baseUnit
      }`;

      const convertedTexts = item.units
        .filter((unit) => !unit.isBaseUnit && Number(unit.conversionQty) > 0)
        .map((unit) => {
          const convertedQty =
            Number(item.stockBaseQty || 0) / Number(unit.conversionQty || 1);

          return {
            unitName: unit.unitName,
            text: `${Number(convertedQty).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })} ${unit.unitName}`,
          };
        });

      return { baseText, convertedTexts };
    };

    const openConfirmStockInModal = () => {
      setErrors({});
      setModalMode("confirm_stock_in");
    };

    const openViewModal = (item) => {
      setErrors({});
      setSelectedItem(item);
      setModalMode("view");
    };

    const openAdjustmentModal = (type, item = null) => {
      setErrors({});
      setSelectedItem(item);

      const isIn = type === "adjustment_in";

      setAdjustmentForm({
        inventoryId: item?.id || "",
        adjustmentType: isIn ? "increase" : "decrease",
        reason: isIn ? "correction" : "damaged",
        qty: "",
        unitName: item?.baseUnit || "",
        inventoryBatchId: "",
        note: "",
      });

      setModalMode(isIn ? "adjustment_in" : "adjustment_out");
    };

    const closeModal = () => {
      setSelectedItem(null);
      setModalMode(null);
      setAdjustmentForm(emptyAdjustmentForm);
      setErrors({});
    };

    const handleAdjustmentFormChange = (field, value) => {
      setAdjustmentForm((previous) => ({
        ...previous,
        [field]: value,
      }));

      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    };

    const handleConfirmStockIn = (purchase) => {
      const nowDate = getToday();

      setInventory((previous) =>
        previous.map((inventoryItem) => {
          const purchaseItem = purchase.items.find(
            (item) => item.inventoryId === inventoryItem.id
          );

          if (!purchaseItem) return inventoryItem;

          const nextQty =
            Number(inventoryItem.stockBaseQty || 0) +
            Number(purchaseItem.baseQty || 0);

          const newBatchId = Date.now() + inventoryItem.id;

          return {
            ...inventoryItem,
            stockBaseQty: nextQty,
            unitCostBase: purchaseItem.unitCostBase,
            status: getStockStatus(nextQty, inventoryItem.lowStockThreshold),
            batches: [
              {
                id: newBatchId,
                batchNo: `BATCH-${purchase.purchaseNo}-${inventoryItem.id}`,
                lotNo: `LOT-${purchase.purchaseNo}`,
                expiredDate: purchaseItem.expiredDate,
                qtyReceivedBase: purchaseItem.baseQty,
                qtyRemainingBase: purchaseItem.baseQty,
                unitCostBase: purchaseItem.unitCostBase,
                receivedAt: nowDate,
                status: "active",
              },
              ...inventoryItem.batches,
            ],
            movements: [
              {
                type: "purchase_in",
                qtyBase: Number(purchaseItem.baseQty || 0),
                refType: "purchase",
                refId: purchase.id,
                note: `Stock in confirmed from ${purchase.purchaseNo}`,
                createdAt: nowDate,
              },
              ...inventoryItem.movements,
            ],
          };
        })
      );

      setPendingPurchases((previous) =>
        previous.filter((item) => item.id !== purchase.id)
      );

      closeModal();
    };

    const validateAdjustment = () => {
      const nextErrors = {};

      const item = inventory.find(
        (inventoryItem) =>
          String(inventoryItem.id) === String(adjustmentForm.inventoryId)
      );

      if (!item) {
        nextErrors.inventoryId = "Please select inventory item.";
      }

      if (!adjustmentForm.reason) {
        nextErrors.reason = "Please select reason.";
      }

      if (!adjustmentForm.unitName) {
        nextErrors.unitName = "Please select unit.";
      }

      if (!adjustmentForm.qty || Number(adjustmentForm.qty) <= 0) {
        nextErrors.qty = "Quantity must be greater than 0.";
      }

      if (item && adjustmentForm.adjustmentType === "decrease") {
        const selectedUnit =
          item.units.find((unit) => unit.unitName === adjustmentForm.unitName) ||
          item.units.find((unit) => unit.isBaseUnit) ||
          item.units[0];

        const baseQty =
          Number(adjustmentForm.qty || 0) *
          Number(selectedUnit?.conversionQty || 1);

        if (baseQty > Number(item.stockBaseQty || 0)) {
          nextErrors.qty = `Cannot stock out more than ${Number(
            item.stockBaseQty || 0
          ).toLocaleString()} ${item.baseUnit}.`;
        }

        if (adjustmentForm.inventoryBatchId) {
          const selectedBatch = item.batches.find(
            (batch) => String(batch.id) === String(adjustmentForm.inventoryBatchId)
          );

          if (selectedBatch && baseQty > Number(selectedBatch.qtyRemainingBase || 0)) {
            nextErrors.qty = `Selected batch only has ${Number(
              selectedBatch.qtyRemainingBase || 0
            ).toLocaleString()} ${item.baseUnit}.`;
          }
        }
      }

      setErrors(nextErrors);

      return Object.keys(nextErrors).length === 0;
    };

    const handleSaveAdjustment = () => {
      if (!validateAdjustment()) return;

      const item = inventory.find(
        (inventoryItem) =>
          String(inventoryItem.id) === String(adjustmentForm.inventoryId)
      );

      const selectedUnit =
        item.units.find((unit) => unit.unitName === adjustmentForm.unitName) ||
        item.units.find((unit) => unit.isBaseUnit) ||
        item.units[0];

      const baseQty =
        Number(adjustmentForm.qty || 0) *
        Number(selectedUnit.conversionQty || 1);

      const isStockIn = adjustmentForm.adjustmentType === "increase";
      const signedQtyBase = isStockIn ? baseQty : -baseQty;

      const nextQty = Number(item.stockBaseQty || 0) + signedQtyBase;
      const nextStatus = getStockStatus(nextQty, item.lowStockThreshold);
      const nowDate = getToday();
      const now = getNow();
      const adjustmentId = Date.now();
      const movementType = getMovementTypeFromAdjustment(
        adjustmentForm.adjustmentType,
        adjustmentForm.reason
      );
      const unitCostBase = Number(item.unitCostBase || 0);
      const lineCost = baseQty * unitCostBase;

      const selectedBatch = item.batches.find(
        (batch) => String(batch.id) === String(adjustmentForm.inventoryBatchId)
      );

      const adjustment = {
        id: adjustmentId,
        adjustmentNo: `ADJ-${String(stockAdjustments.length + 1).padStart(3, "0")}`,
        adjustmentType: adjustmentForm.adjustmentType,
        reason: adjustmentForm.reason,
        note: adjustmentForm.note || "Manual stock adjustment",
        createdBy: 1,
        createdAt: now,
        status: "approved",
        items: [
          {
            id: adjustmentId + 1,
            stockAdjustmentId: adjustmentId,
            productVariantId: item.id,
            productVariantUnitId: selectedUnit.id || null,
            inventoryBatchId: selectedBatch?.id || null,
            qty: Number(adjustmentForm.qty || 0),
            baseQty,
            movementType,
            unitCostBase,
            lineCost,
            note: adjustmentForm.note || "Manual stock adjustment",
            createdAt: now,
          },
        ],
      };

      setStockAdjustments((previous) => [adjustment, ...previous]);

      setInventory((previous) =>
        previous.map((inventoryItem) => {
          if (inventoryItem.id !== item.id) return inventoryItem;

          const updatedBatches = inventoryItem.batches.map((batch) => {
            if (String(batch.id) !== String(adjustmentForm.inventoryBatchId)) {
              return batch;
            }

            const nextBatchQty = Math.max(
              0,
              Number(batch.qtyRemainingBase || 0) + signedQtyBase
            );

            return {
              ...batch,
              qtyRemainingBase: nextBatchQty,
              status: nextBatchQty <= 0 ? "depleted" : batch.status,
            };
          });

          return {
            ...inventoryItem,
            stockBaseQty: nextQty,
            status: nextStatus,
            batches: updatedBatches,
            movements: [
              {
                type: movementType,
                qtyBase: signedQtyBase,
                refType: "adjustment",
                refId: adjustmentId,
                note: adjustmentForm.note || "Manual stock adjustment",
                createdAt: nowDate,
              },
              ...inventoryItem.movements,
            ],
          };
        })
      );

      closeModal();
    };

    return (
      <section className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            theme={theme}
            title="Total Stock Items"
            value={totalStockItems}
            icon={<FiBox className="text-[34px] text-red-500" />}
            iconBg="bg-red-500/10"
          />

          <SummaryCard
            theme={theme}
            title="Pending Stock In"
            value={pendingPurchases.length}
            icon={<FiClipboard className="text-[34px] text-blue-500" />}
            iconBg="bg-blue-500/10"
          />

          <SummaryCard
            theme={theme}
            title="Low Stock Items"
            value={lowStockItems}
            icon={<FiAlertTriangle className="text-[34px] text-amber-500" />}
            iconBg="bg-amber-500/10"
          />

          <SummaryCard
            theme={theme}
            title="Stock Value"
            value={`$${stockValue.toFixed(2)}`}
            icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
            iconBg="bg-emerald-500/10"
          />
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 xl:max-w-4xl xl:grid-cols-[1fr_230px]">
            <div className="relative">
              <FiSearch
                className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
              />

              <input
                id="inventory-search"
                type="text"
                placeholder="Search inventory, product, variant, code..."
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
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <FiChevronDown
                className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={openConfirmStockInModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <FiCheckCircle className="text-lg" />
            Confirm Stock In
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            theme={theme}
            icon={<FiTruck className="text-4xl text-emerald-500" />}
            title="Stock In"
            subtitle="Confirm received purchases"
            buttonText="Confirm Stock In"
            buttonClass="bg-emerald-500 hover:bg-emerald-600"
            onClick={openConfirmStockInModal}
          />

          <ActionCard
            theme={theme}
            icon={<FiEdit2 className="text-4xl text-blue-500" />}
            title="Adjustment In"
            subtitle="Admin correction only"
            buttonText="Adjustment In"
            buttonClass="bg-blue-600 hover:bg-blue-700"
            onClick={() => openAdjustmentModal("adjustment_in")}
          />

          <ActionCard
            theme={theme}
            icon={<FiTrendingDown className="text-4xl text-red-500" />}
            title="Stock Out"
            subtitle="Damage / expired / internal use"
            buttonText="Stock Out"
            buttonClass="bg-red-500 hover:bg-red-600"
            onClick={() => openAdjustmentModal("adjustment_out")}
          />

          <ActionCard
            theme={theme}
            icon={<FiLayers className="text-4xl text-amber-500" />}
            title="Stock Tracking"
            subtitle="Current stock by variant"
            buttonText="View Stock"
            buttonClass="bg-amber-500 hover:bg-amber-600"
            onClick={() => setStatusFilter("All")}
          />
        </div>

        {pendingPurchases.length > 0 && (
          <div
            className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between ${theme.card}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                <FiClipboard className="text-4xl text-emerald-500" />
              </div>

              <div>
                <h3 className="text-base font-bold">
                  Pending Purchase Stock In
                </h3>

                <p className={`mt-1 text-sm ${theme.muted}`}>
                  {pendingPurchases.length} purchase
                  {pendingPurchases.length > 1 ? "s" : ""} waiting for stock
                  confirmation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openConfirmStockInModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <FiCheckCircle />
              Review & Confirm
            </button>
          </div>
        )}

        {lowStockList.length > 0 && (
          <div
            className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between ${theme.card}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
                <FiAlertTriangle className="text-4xl text-amber-500" />
              </div>

              <div>
                <h3 className="text-base font-bold">Low Stock Notification</h3>

                <p className={`mt-1 text-sm ${theme.muted}`}>
                  {lowStockList.length} item
                  {lowStockList.length > 1 ? "s" : ""} need attention.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter("Low Stock")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white hover:bg-amber-600"
            >
              <FiList />
              View Low Stock
            </button>
          </div>
        )}

        <InventoryTable
          theme={theme}
          inventory={inventory}
          filteredInventory={filteredInventory}
          getVariantStockBreakdown={getVariantStockBreakdown}
          getStatusClass={getStatusClass}
          openViewModal={openViewModal}
          openAdjustmentModal={openAdjustmentModal}
        />

        {modalMode === "confirm_stock_in" && (
          <ConfirmStockInModal
            pendingPurchases={pendingPurchases}
            theme={theme}
            onClose={closeModal}
            onConfirm={handleConfirmStockIn}
          />
        )}

        {modalMode === "view" && selectedItem && (
          <ViewInventoryModal
            item={selectedItem}
            theme={theme}
            getStatusClass={getStatusClass}
            getVariantStockBreakdown={getVariantStockBreakdown}
            onClose={closeModal}
          />
        )}

        {(modalMode === "adjustment_in" || modalMode === "adjustment_out") && (
          <StockAdjustmentModal
            mode={modalMode}
            inventory={inventory}
            selectedItem={selectedItem}
            form={adjustmentForm}
            errors={errors}
            theme={theme}
            onChange={handleAdjustmentFormChange}
            onClose={closeModal}
            onSave={handleSaveAdjustment}
          />
        )}
      </section>
    );
  }

  function InventoryTable({
    theme,
    inventory,
    filteredInventory,
    getVariantStockBreakdown,
    getStatusClass,
    openViewModal,
    openAdjustmentModal,
  }) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
              Inventory List
            </h2>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Showing {filteredInventory.length} of {inventory.length} stock items
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Product / Variant
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Category
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Current Stock
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Low Stock Alert
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Cost / Value
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
              {filteredInventory.map((item) => {
                const stockBreakdown = getVariantStockBreakdown(item);

                return (
                  <tr key={item.id} className={`border-t transition ${theme.row}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <InventoryThumb item={item} />

                        <div>
                          <p className="text-sm font-semibold leading-5">
                            {item.variantName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                            >
                              {item.variantCode}
                            </span>

                            <span className={`text-xs ${theme.muted}`}>
                              {item.productName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                      >
                        {item.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold">{stockBreakdown.baseText}</p>

                      {stockBreakdown.convertedTexts.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {stockBreakdown.convertedTexts.map((converted) => (
                            <span
                              key={converted.unitName}
                              className={`rounded-full border px-2.5 py-0.5 text-xs ${theme.badge}`}
                            >
                              ≈ {converted.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className={`text-sm font-semibold ${theme.pageTitle}`}>
                        {Number(item.lowStockThreshold).toLocaleString()} {item.baseUnit}
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Alert when equal or below
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">
                        ${Number(item.unitCostBase).toFixed(3)} / {item.baseUnit}
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Value: $
                        {(
                          Number(item.stockBaseQty || 0) *
                          Number(item.unitCostBase || 0)
                        ).toFixed(2)}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StockStatusBadge
                        status={item.status}
                        getStatusClass={getStatusClass}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(item)}
                          title="View stock"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                        >
                          <FiEye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAdjustmentModal("adjustment_in", item)}
                          title="Manual adjustment in"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                        >
                          <FiTrendingUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openAdjustmentModal("adjustment_out", item)}
                          title="Stock out"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                        >
                          <FiTrendingDown size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="7" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                      >
                        <FiSearch className={`text-3xl ${theme.muted}`} />
                      </div>

                      <p className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}>
                        No inventory found
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

  function ActionCard({
    theme,
    icon,
    title,
    subtitle,
    buttonText,
    buttonClass,
    onClick,
  }) {
    return (
      <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
            {icon}
          </div>

          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className={`mt-1 text-xs ${theme.muted}`}>{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClick}
          className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition ${buttonClass}`}
        >
          <FiPlusCircle />
          {buttonText}
        </button>
      </div>
    );
  }

  function InventoryThumb({ item, size = "normal" }) {
    const sizeClass =
      size === "large"
        ? "h-40 w-full rounded-2xl"
        : "h-12 w-12 rounded-2xl";

    if (item.imagePath) {
      return (
        <img
          src={item.imagePath}
          alt={item.variantName}
          className={`${sizeClass} object-cover`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      );
    }

    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-red-500/10 ${sizeClass}`}
      >
        <FiPackage
          className={
            size === "large" ? "text-5xl text-red-500" : "text-xl text-red-500"
          }
        />
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
    width = "max-w-5xl",
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

  function ConfirmStockInModal({
    pendingPurchases,
    theme,
    onClose,
    onConfirm,
  }) {
    return (
      <ModalShell
        title="Confirm Stock In"
        subtitle="Confirm accepted purchase items before adding them to inventory batches, stock movements, and balances."
        theme={theme}
        onClose={onClose}
        width="max-w-6xl"
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
        {pendingPurchases.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${theme.section}`}>
            <FiCheckCircle className="mx-auto text-5xl text-emerald-500" />

            <p className="mt-4 text-sm font-semibold">
              No pending purchases for stock in
            </p>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              When a purchase is ready to receive, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">
                        {purchase.purchaseNo}
                      </h3>

                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {purchase.status}
                      </span>
                    </div>

                    <p className={`mt-1 text-sm ${theme.muted}`}>
                      {purchase.supplierName} · {purchase.purchaseDate} ·{" "}
                      {purchase.totalItems} items
                    </p>

                    {purchase.note && (
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        {purchase.note}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm(
                        `Confirm stock in for ${purchase.purchaseNo}?`
                      );

                      if (ok) onConfirm(purchase);
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    <FiCheckCircle />
                    Confirm Stock In
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                  <table className="w-full min-w-[780px] text-sm">
                    <thead className="bg-red-600 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left">Product Variant</th>
                        <th className="px-3 py-3 text-left">Accepted Qty</th>
                        <th className="px-3 py-3 text-left">Base Qty</th>
                        <th className="px-3 py-3 text-left">Unit Cost</th>
                        <th className="px-3 py-3 text-left">Expiry</th>
                      </tr>
                    </thead>

                    <tbody>
                      {purchase.items.map((item) => (
                        <tr
                          key={`${purchase.id}-${item.variantName}`}
                          className="border-t border-zinc-200 dark:border-white/10"
                        >
                          <td className="px-3 py-3 font-semibold">
                            {item.variantName}
                          </td>

                          <td className="px-3 py-3">
                            {Number(item.qty).toLocaleString()} {item.unitName}
                          </td>

                          <td className="px-3 py-3">
                            {Number(item.baseQty).toLocaleString()} base units
                          </td>

                          <td className="px-3 py-3">
                            ${Number(item.unitCostBase).toFixed(3)}
                          </td>

                          <td className="px-3 py-3">
                            {item.expiredDate || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalShell>
    );
  }

  function ViewInventoryModal({
    item,
    theme,
    getStatusClass,
    getVariantStockBreakdown,
    onClose,
  }) {
    const stockBreakdown = getVariantStockBreakdown(item);

    return (
      <ModalShell
        title={item.variantName}
        subtitle={`${item.variantCode} · ${item.productName} · ${item.category}`}
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
          <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
            <InventoryThumb item={item} size="large" />

            <div className="mt-4 space-y-3 text-sm">
              <InfoLine label="Product" value={item.productName} />
              <InfoLine label="Variant Code" value={item.variantCode} />
              <InfoLine label="Category" value={item.category} />
              <InfoLine label="Base Unit" value={item.baseUnit} />
              <InfoLine
                label="Low Stock Alert"
                value={`${item.lowStockThreshold} ${item.baseUnit}`}
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-bold">Current Stock</h3>

                  <p className={`mt-1 text-sm ${theme.muted}`}>
                    Stock is stored by base unit.
                  </p>
                </div>

                <StockStatusBadge
                  status={item.status}
                  getStatusClass={getStatusClass}
                />
              </div>

              <p className="mt-4 text-3xl font-bold">
                {stockBreakdown.baseText}
              </p>

              {stockBreakdown.convertedTexts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {stockBreakdown.convertedTexts.map((converted) => (
                    <span
                      key={converted.unitName}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      ≈ {converted.text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiLayers />}
                title="Units"
                subtitle="Conversion units for this inventory item."
                theme={theme}
              />

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {item.units.map((unit) => (
                  <div
                    key={unit.unitName}
                    className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                  >
                    <p className="font-semibold">
                      {unit.unitName} = {unit.conversionQty} {item.baseUnit}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {unit.isBaseUnit ? "Base unit" : "Converted unit"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiPackage />}
                title="Inventory Batches"
                subtitle="Stock batch and expiry tracking."
                theme={theme}
              />

              <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left">Batch</th>
                      <th className="px-3 py-3 text-left">Lot No</th>
                      <th className="px-3 py-3 text-left">Expiry</th>
                      <th className="px-3 py-3 text-left">Remaining</th>
                      <th className="px-3 py-3 text-left">Cost</th>
                      <th className="px-3 py-3 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {item.batches.length > 0 ? (
                      item.batches.map((batch) => (
                        <tr
                          key={batch.id || batch.batchNo}
                          className="border-t border-zinc-200 dark:border-white/10"
                        >
                          <td className="px-3 py-3">{batch.batchNo}</td>
                          <td className="px-3 py-3">{batch.lotNo || "-"}</td>
                          <td className="px-3 py-3">
                            {batch.expiredDate || "-"}
                          </td>
                          <td className="px-3 py-3">
                            {Number(batch.qtyRemainingBase).toLocaleString()} {item.baseUnit}
                          </td>
                          <td className="px-3 py-3">
                            ${Number(batch.unitCostBase).toFixed(3)}
                          </td>
                          <td className="px-3 py-3 capitalize">{batch.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-3 py-8 text-center text-zinc-500">
                          No active batch.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
              <SectionTitle
                icon={<FiClock />}
                title="Recent Stock Movements"
                subtitle="Latest stock in, stock out, and adjustments."
                theme={theme}
              />

              <div className="mt-4 space-y-3">
                {item.movements.length > 0 ? (
                  item.movements.map((movement, index) => (
                    <div
                      key={`${movement.type}-${index}`}
                      className={`flex items-start justify-between gap-4 rounded-xl border p-3 ${theme.softCard}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                          <FiClock />
                        </div>

                        <div>
                          <p className="text-sm font-semibold capitalize">
                            {movement.type.replaceAll("_", " ")}
                          </p>

                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            {movement.note || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {Number(movement.qtyBase).toLocaleString()} {item.baseUnit}
                        </p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {movement.createdAt}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${theme.muted}`}>
                    No stock movement yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }

  function StockAdjustmentModal({
    mode,
    inventory,
    selectedItem,
    form,
    errors,
    theme,
    onChange,
    onClose,
    onSave,
  }) {
    const isStockIn = mode === "adjustment_in";
    const title = isStockIn ? "Manual Adjustment In" : "Stock Out Adjustment";
    const subtitle = isStockIn
      ? "Use this only for stock count or correction, not normal purchase stock in."
      : "Use this for damaged, expired, internal use, lost item, or correction.";

    const activeItem =
      selectedItem ||
      inventory.find((item) => String(item.id) === String(form.inventoryId));

    const selectedUnit = activeItem?.units.find(
      (unit) => unit.unitName === form.unitName
    );

    const previewBaseQty =
      Number(form.qty || 0) * Number(selectedUnit?.conversionQty || 1);

    const batchOptions = [
      { value: "", label: "No batch selected" },
      ...(activeItem?.batches || [])
        .filter((batch) => Number(batch.qtyRemainingBase || 0) > 0)
        .map((batch) => ({
          value: batch.id,
          label: `${batch.batchNo} · ${Number(batch.qtyRemainingBase).toLocaleString()} ${activeItem.baseUnit} · Exp: ${batch.expiredDate || "-"}`,
        })),
    ];

    return (
      <ModalShell
        title={title}
        subtitle={subtitle}
        theme={theme}
        onClose={onClose}
        width="max-w-3xl"
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
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm ${
                isStockIn
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <FiSave />
              Save Adjustment
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SectionTitle
            icon={isStockIn ? <FiTrendingUp /> : <FiTrendingDown />}
            title="Adjustment Information"
            subtitle="This creates stock_adjustments, stock_adjustment_items, and stock_movements."
            theme={theme}
          />

          <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Inventory Item"
                value={form.inventoryId}
                error={errors.inventoryId}
                onChange={(value) => {
                  const item = inventory.find(
                    (inventoryItem) => String(inventoryItem.id) === String(value)
                  );

                  onChange("inventoryId", value);
                  onChange("unitName", item?.baseUnit || "");
                  onChange("inventoryBatchId", "");
                }}
                theme={theme}
                icon={<FiPackage />}
                options={[
                  { value: "", label: "Select inventory item" },
                  ...inventory.map((item) => ({
                    value: item.id,
                    label: item.variantName,
                  })),
                ]}
                disabled={Boolean(selectedItem)}
              />

              <FormSelect
                label="Reason"
                value={form.reason}
                error={errors.reason}
                onChange={(value) => onChange("reason", value)}
                theme={theme}
                icon={<FiTag />}
                options={adjustmentReasons}
              />

              <FormSelect
                label="Unit"
                value={form.unitName}
                error={errors.unitName}
                onChange={(value) => onChange("unitName", value)}
                theme={theme}
                icon={<FiLayers />}
                options={
                  activeItem
                    ? activeItem.units.map((unit) => ({
                        value: unit.unitName,
                        label: unit.unitName,
                      }))
                    : [{ value: "", label: "Select unit" }]
                }
              />

              <FormInput
                label="Quantity"
                type="number"
                value={form.qty}
                error={errors.qty}
                onChange={(value) => onChange("qty", value)}
                theme={theme}
                placeholder="Enter qty"
                icon={<FiHash />}
              />

              <FormSelect
                label="Batch / Lot"
                value={form.inventoryBatchId}
                onChange={(value) => onChange("inventoryBatchId", value)}
                theme={theme}
                icon={<FiClipboard />}
                options={batchOptions}
              />

              <div className={`rounded-xl border p-3 text-sm ${theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>
                  Base Qty Preview
                </p>
                <p className="mt-1 text-lg font-bold">
                  {Number(previewBaseQty || 0).toLocaleString()} {activeItem?.baseUnit || "base units"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <FormTextarea
                label="Note"
                value={form.note}
                onChange={(value) => onChange("note", value)}
                theme={theme}
                placeholder="Reason or note..."
                icon={<FiFileText />}
              />
            </div>
          </div>

          {activeItem && (
            <>
              <SectionTitle
                icon={<FiInfo />}
                title="Current Stock Preview"
                subtitle="Preview before saving this adjustment."
                theme={theme}
              />

              <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
                <p className="text-sm font-semibold">{activeItem.variantName}</p>

                <p className="mt-2 text-3xl font-bold">
                  {Number(activeItem.stockBaseQty).toLocaleString()} {activeItem.baseUnit}
                </p>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  Current status: {activeItem.status}
                </p>
              </div>
            </>
          )}
        </div>
      </ModalShell>
    );
  }

  function SectionTitle({ icon, title, subtitle, theme }) {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold">{title}</h3>

          <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
            {subtitle}
          </p>
        </div>
      </div>
    );
  }

  function StockStatusBadge({ status, getStatusClass }) {
    return (
      <span
        className={`inline-flex w-fit items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
          status
        )}`}
      >
        {status === "In Stock" ? (
          <FiCheckCircle />
        ) : status === "Low Stock" ? (
          <FiAlertTriangle />
        ) : (
          <FiXCircle />
        )}
        {status}
      </span>
    );
  }

  function FormInput({
    label,
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
            } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
          />
        </div>
      </label>
    );
  }

  function FormSelect({
    label,
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

  function InfoLine({ label, value }) {
    return (
      <div>
        <p className="text-xs font-semibold text-zinc-500">{label}</p>
        <p className="mt-1">{value || "-"}</p>
      </div>
    );
  }
