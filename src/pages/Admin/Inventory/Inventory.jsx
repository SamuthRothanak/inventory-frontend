  import React, { useEffect, useMemo, useState } from "react";
  import { useOutletContext, useSearchParams } from "react-router-dom";
  import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
  import { useConfirm } from "../../../components/ConfirmDialog";
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
    FiChevronLeft,
    FiChevronRight,
    FiHash,
    FiInfo,
    FiFileText,
    FiTag,
  } from "react-icons/fi";
  import {
    confirmPurchaseStockInApi,
    getPurchaseByIdApi,
    getPurchaseReturnsApi,
    getPurchasesApi,
    updatePurchaseReturnApi,
  } from "../../../services/purchase.service";
  import { getProductVariantUnitsApi } from "../../../services/productVariantUnit.service";
  import {
    createStockAdjustmentApi,
    getInventoryBatchesApi,
    getStockAdjustmentByIdApi,
    getStockAdjustmentsApi,
    getStockBalancesApi,
    getStockMovementsApi,
    updateStockAdjustmentApi,
  } from "../../../services/inventory.service";
  import { useNotification } from "../../../components/AppNotification";
  import TableLoading from "../../../components/TableLoading";
  import {
    extractApiData,
    extractApiObject,
    formatDateTimeLocal,
    formatDateOnly,
    normalizePurchase,
    normalizeVariantUnit,
  } from "../Purcheases/utils/purchaseUtils";
  import useLockBodyScroll from "./hooks/useLockBodyScroll";
  import {
    ActionCard,
    InventoryDropdown,
    SummaryCard,
  } from "./components/InventoryCommon";
  import ConfirmStockInModal from "./components/ConfirmStockInModal";
  import InventoryDetailModal from "./components/InventoryDetailModal";
  import InventoryTable from "./components/InventoryTable";
  import StockAdjustmentDetailModal from "./components/StockAdjustmentDetailModal";
  import StockAdjustmentModal from "./components/StockAdjustmentModal";
  import StockAdjustmentTable from "./components/StockAdjustmentTable";
  import StockMovementTable, { formatMovementTypeKh } from "./components/StockMovementTable";
  import { stockAdjustmentFormSchema } from "./schemas/stockAdjustment.schema";
  import { normalizeStockAdjustment } from "./utils/inventoryNormalizers";
  import {
    adjustmentReasons,
    emptyAdjustmentForm,
    getNow,
    getPageNumbers,
    getToday,
  } from "./utils/inventoryConstants";

  export default function Inventory() {
    const outlet = useOutletContext();
    const isDark = outlet?.isDark ?? false;
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const notify = useNotification();
    const confirm = useConfirm();
    const stockInPurchaseId = searchParams.get("stockInPurchaseId");
    const stockInPurchaseNo = searchParams.get("purchaseNo");

    const [inventory, setInventory] = useState([]);
    const [pendingPurchases, setPendingPurchases] = useState([]);
    const [stockAdjustments, setStockAdjustments] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState("stock");
    const [adjustmentSearchTerm, setAdjustmentSearchTerm] = useState("");
    const [adjustmentStatusFilter, setAdjustmentStatusFilter] = useState("All");
    const [adjustmentTypeFilter, setAdjustmentTypeFilter] = useState("All");
    const [adjustmentReasonFilter, setAdjustmentReasonFilter] = useState("All");
    const [adjustmentPage, setAdjustmentPage] = useState(1);
    const [adjustmentPerPage, setAdjustmentPerPage] = useState(10);
    const [movementSearchTerm, setMovementSearchTerm] = useState("");
    const [movementDirectionFilter, setMovementDirectionFilter] = useState("All");
    const [movementTypeFilter, setMovementTypeFilter] = useState("All");
    const [movementPage, setMovementPage] = useState(1);
    const [movementPerPage, setMovementPerPage] = useState(10);

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedAdjustment, setSelectedAdjustment] = useState(null);
    const [modalMode, setModalMode] = useState(null);
    const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustmentForm);
    const [errors, setErrors] = useState({});

    useLockBodyScroll(Boolean(modalMode));

    useEffect(() => {
      setPage(1);
    }, [searchTerm, statusFilter, perPage]);

    useEffect(() => {
      setAdjustmentPage(1);
    }, [
      adjustmentSearchTerm,
      adjustmentStatusFilter,
      adjustmentTypeFilter,
      adjustmentReasonFilter,
      adjustmentPerPage,
    ]);

    useEffect(() => {
      setMovementPage(1);
    }, [movementSearchTerm, movementDirectionFilter, movementTypeFilter, movementPerPage]);

    const stockBalancesQuery = useQuery({
      queryKey: ["stock-balances", "inventory-page"],
      queryFn: () => getStockBalancesApi({ per_page: 1000 }),
      staleTime: 1000 * 30,
    });

    const inventoryBatchesQuery = useQuery({
      queryKey: ["inventory-batches", "inventory-page"],
      queryFn: () => getInventoryBatchesApi({ per_page: 1000 }),
      staleTime: 1000 * 30,
    });

    const stockMovementsQuery = useQuery({
      queryKey: ["stock-movements", "inventory-page"],
      queryFn: () => getStockMovementsApi({ per_page: 1000 }),
      staleTime: 1000 * 30,
    });

    const stockAdjustmentsQuery = useQuery({
      queryKey: ["stock-adjustments", "inventory-page"],
      queryFn: () => getStockAdjustmentsApi({ per_page: 1000 }),
      staleTime: 1000 * 30,
    });

    const variantUnitsQuery = useQuery({
      queryKey: ["product-variant-units", "inventory-page"],
      queryFn: () => getProductVariantUnitsApi({ per_page: 1000, status: "active" }),
      staleTime: 1000 * 60,
    });

    const pendingPurchasesQuery = useQuery({
      queryKey: ["purchases", "pending-stock-in-or-claim", "inventory-page", stockInPurchaseId || "all"],
      queryFn: async () => {
        const purchaseReturnParams = stockInPurchaseId
          ? { purchase_id: stockInPurchaseId, per_page: 100 }
          : { per_page: 100 };
        const responses = await Promise.all([
          getPurchasesApi({ status: "pending_stock_in", per_page: 100 }),
          getPurchasesApi({ status: "pending_claim", per_page: 100 }),
          getPurchaseReturnsApi(purchaseReturnParams),
        ]);
        const purchases = responses
          .slice(0, 2)
          .flatMap((response) => extractApiData(response))
          .map(normalizePurchase)
          .filter(
            (purchase, index, list) =>
              list.findIndex((item) => String(item.id) === String(purchase.id)) === index
          );

        const detailed = await Promise.all(
          purchases.map(async (purchase) => {
            try {
              const detailResponse = await getPurchaseByIdApi(purchase.id);
              return normalizePurchase(extractApiObject(detailResponse));
            } catch {
              return purchase;
            }
          })
        );

        const replacementReturns = extractApiData(responses[2])
          .filter((item) => {
            const resolutionType = String(item.resolution_type || item.resolutionType || "").toLowerCase();
            const receivedQty = Number(item.replacement_received_qty ?? item.replacementReceivedQty ?? 0);
            const stockedQty = Number(item.replacement_stocked_in_qty ?? item.replacementStockedInQty ?? 0);
            return resolutionType === "replacement" && receivedQty > stockedQty;
          });

        return [...detailed, ...replacementReturns.map(normalizePendingReplacementReturnForStockIn)];
      },
      staleTime: 0,
      refetchOnMount: true,
    });

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

    const getVariantUnitId = (item = {}) =>
      item.product_variant_unit_id ||
      item.productVariantUnitId ||
      item.variant_unit_id ||
      item.variantUnitId ||
      item.product_variant_unit?.id ||
      item.productVariantUnit?.id;

    const getVariantId = (item = {}) =>
      item.product_variant_id ||
      item.productVariantId ||
      item.variant_id ||
      item.variantId ||
      item.product_variant?.id ||
      item.productVariant?.id ||
      item.product_variant_unit?.product_variant_id ||
      item.productVariantUnit?.productVariantId ||
      item.product_variant_unit?.product_variant?.id ||
      item.productVariantUnit?.productVariant?.id;

    const normalizeInventoryBatch = (item = {}) => ({
      id: item.id,
      batchNo: item.batch_no || item.batchNo || `BATCH-${item.id || ""}`,
      lotNo: item.lot_no || item.lotNo || "-",
      expiredDate: formatDateOnly(
        item.expired_date ||
          item.expiry_date ||
          item.expiration_date ||
          item.expire_date ||
          item.expires_at ||
          item.expiredDate ||
          item.expiryDate ||
          item.expirationDate ||
          item.expireDate ||
          item.expiresAt
      ),
      qtyReceivedBase: Number(item.qty_received_base ?? item.qtyReceivedBase ?? item.base_qty ?? item.baseQty ?? item.qty ?? 0),
      qtyRemainingBase: Number(item.qty_remaining_base ?? item.qtyRemainingBase ?? item.remaining_qty ?? item.remainingQty ?? item.qty ?? 0),
      unitCostBase: Number(item.unit_cost_base ?? item.unitCostBase ?? item.unit_cost_usd ?? item.unitCostUsd ?? 0),
      receivedAt: formatDateOnly(item.received_at || item.receivedAt || item.created_at || item.createdAt),
      status: item.status || "active",
      productVariantUnitId: getVariantUnitId(item),
      productVariantId: getVariantId(item),
    });

    const normalizeStockMovement = (item = {}) => {
      const purchaseReturn = item.purchase_return || item.purchaseReturn || {};
      const sourcePurchase = purchaseReturn.purchase || purchaseReturn.source_purchase || purchaseReturn.sourcePurchase || {};
      const refType = item.reference_type || item.ref_type || item.refType || item.source_type || item.sourceType || "-";
      const refId = item.reference_id || item.ref_id || item.refId || item.source_id || item.sourceId || "";
      const purchaseReturnNo = purchaseReturn.purchase_return_no || purchaseReturn.purchaseReturnNo || "";
      const sourcePurchaseNo = sourcePurchase.purchase_no || sourcePurchase.purchaseNo || "";

      return {
        id: item.id,
        type: item.movement_type || item.type || item.stock_movement_type || item.stockMovementType || "stock",
        qtyBase: Number(item.qty_base ?? item.qtyBase ?? item.base_qty ?? item.baseQty ?? item.qty ?? 0),
        refType,
        refId,
        referenceLabel:
          refType === "purchase_return" && purchaseReturnNo
            ? `Claim ${purchaseReturnNo}`
            : `${String(refType || "-").replaceAll("_", " ")}${refId ? ` #${refId}` : ""}`,
        sourcePurchaseNo,
        note: item.note || item.description || "-",
        createdAt: formatDateTimeLocal(item.created_at || item.createdAt || item.movement_date || item.movementDate || ""),
        productVariantUnitId: getVariantUnitId(item),
        productVariantId: getVariantId(item),
        productName:
          item.product_variant?.product?.name ||
          item.productVariant?.product?.name ||
          item.product_name ||
          item.productName ||
          "-",
        variantName:
          item.product_variant?.variant_name ||
          item.productVariant?.variantName ||
          item.variant_name ||
          item.variantName ||
          "-",
        variantCode:
          item.product_variant?.variant_code ||
          item.productVariant?.variantCode ||
          item.variant_code ||
          item.variantCode ||
          "",
        batchNo:
          item.inventory_batch?.batch_no ||
          item.inventoryBatch?.batchNo ||
          item.batch_no ||
          item.batchNo ||
          "",
        lotNo:
          item.inventory_batch?.lot_no ||
          item.inventoryBatch?.lotNo ||
          item.lot_no ||
          item.lotNo ||
          "",
        creatorName:
          item.creator?.name ||
          item.created_by_name ||
          item.createdByName ||
          "",
      };
    };

    const getStockBalanceVariantUnitId = (item = {}) =>
      item.product_variant_unit_id ||
      item.productVariantUnitId ||
      item.variant_unit_id ||
      item.variantUnitId ||
      item.product_variant_unit?.id ||
      item.productVariantUnit?.id ||
      item.product_variant_unit?.product_variant_unit_id ||
      item.productVariantUnit?.productVariantUnitId;

    const normalizeStockBalance = (item = {}, batches = [], movements = [], variantUnitMeta = {}) => {
      const variantUnit = item.product_variant_unit || item.productVariantUnit || item.variant_unit || {};
      const variant = variantUnit.product_variant || variantUnit.productVariant || item.product_variant || item.productVariant || {};
      const product = variant.product || item.product || {};
      const unit = variantUnit.unit || item.unit || {};
      const productVariantId = getVariantId(item) || variant.id;
      const variantUnitId = getStockBalanceVariantUnitId(item) || getVariantUnitId(item) || item.id;
      const meta =
        variantUnitMeta[String(variantUnitId)] ||
        Object.values(variantUnitMeta).find((entry) => String(entry.productVariantId || "") === String(productVariantId || "")) ||
        {};
      const stockBaseQty = Number(
        item.stock_base_qty ??
          item.stockBaseQty ??
          item.current_stock_base ??
          item.currentStockBase ??
          item.stock_qty_base ??
          item.stockQtyBase ??
          item.quantity_base ??
          item.quantityBase ??
          item.available_base_qty ??
          item.availableBaseQty ??
          item.on_hand_base_qty ??
          item.onHandBaseQty ??
          item.qty_on_hand_base ??
          item.qtyOnHandBase ??
          item.balance_base_qty ??
          item.balanceBaseQty ??
          item.qty_base ??
          item.qtyBase ??
          item.current_stock ??
          item.currentStock ??
          item.current_qty ??
          item.currentQty ??
          item.qty_on_hand ??
          item.qtyOnHand ??
          item.on_hand_qty ??
          item.onHandQty ??
          item.available_qty ??
          item.availableQty ??
          item.balance_qty ??
          item.balanceQty ??
          item.quantity ??
          item.stock_qty ??
          item.stockQty ??
          0
      );
      const lowStockThreshold = Number(
        item.low_stock_threshold ??
          item.lowStockThreshold ??
          variant.low_stock_threshold ??
          variant.lowStockThreshold ??
          meta.lowStockThreshold ??
          meta.low_stock_threshold ??
          0
      );
      const baseUnit =
        item.base_unit ||
        item.baseUnit ||
        item.unit_name ||
        item.unitName ||
        meta.baseUnit ||
        unit.unit_code ||
        unit.unitCode ||
        unit.unit_name ||
        unit.unitName ||
        variant.package_type ||
        variant.packageType ||
        "unit";
      const variantUnitRows =
        variantUnitMeta[`variantUnits:${productVariantId || meta.productVariantId || ""}`] ||
        [];
      const units = variantUnitRows.length > 0
        ? variantUnitRows.map((variantUnitRow) => ({
            id: variantUnitRow.id,
            unitName: variantUnitRow.unitName || variantUnitRow.unit_name || baseUnit,
            conversionQty: Number(variantUnitRow.conversionQty || variantUnitRow.conversion_qty || 1),
            isBaseUnit: Boolean(
              variantUnitRow.isBaseUnit ??
                variantUnitRow.is_base_unit ??
                Number(variantUnitRow.conversionQty || variantUnitRow.conversion_qty || 1) === 1
            ),
          }))
        : [
            {
              id: unit.id || variantUnitId,
              unitName: unit.unit_name || unit.unitName || meta.unitName || baseUnit,
              conversionQty: Number(variantUnit.conversion_qty || variantUnit.conversionQty || meta.conversionQty || 1),
              isBaseUnit: true,
            },
          ];

      return {
        id: item.id || variantUnitId,
        productVariantUnitId: variantUnitId,
        productVariantId: productVariantId || meta.productVariantId || "",
        productName: product.name || item.product_name || item.productName || item.name || meta.productName || "-",
        variantName:
          variant.variant_name ||
          variant.variantName ||
          item.variant_name ||
          item.variantName ||
          item.product_variant_name ||
          item.productVariantName ||
          meta.variantName ||
          product.name ||
          item.product_name ||
          item.productName ||
          "-",
        variantCode: variant.variant_code || variant.variantCode || item.variant_code || item.variantCode || meta.variantCode || "",
        category:
          product.category?.name ||
          product.category_name ||
          product.categoryName ||
          variant.category?.name ||
          variant.category_name ||
          variant.categoryName ||
          item.category_name ||
          item.categoryName ||
          (typeof item.category === "string" ? item.category : item.category?.name) ||
          meta.category ||
          "-",
        imagePath: variant.images || variant.image_path || variant.imagePath || item.image_path || item.imagePath || meta.imagePath || "",
        baseUnit,
        stockBaseQty,
        lowStockThreshold,
        unitCostBase: Number(item.unit_cost_base ?? item.unitCostBase ?? item.average_cost_usd ?? item.averageCostUsd ?? item.unit_cost_usd ?? 0),
        status: getStockStatus(stockBaseQty, lowStockThreshold),
        units,
        batches: batches.filter(
          (batch) =>
            (batch.productVariantUnitId && String(batch.productVariantUnitId) === String(variantUnitId)) ||
            (batch.productVariantId && String(batch.productVariantId) === String(productVariantId || meta.productVariantId || ""))
        ),
        movements: movements.filter(
          (movement) =>
            (movement.productVariantUnitId && String(movement.productVariantUnitId) === String(variantUnitId)) ||
            (movement.productVariantId && String(movement.productVariantId) === String(productVariantId || meta.productVariantId || ""))
        ),
      };
    };

    const normalizePendingPurchaseForStockIn = (purchase) => ({
      id: purchase.id,
      purchaseNo: purchase.purchaseNo,
      supplierName: purchase.supplierName,
      purchaseDate: formatDateOnly(purchase.purchaseDate),
      status: purchase.status,
      totalItems: purchase.items.filter((item) => Number(item.acceptedQty || 0) > Number(item.stockedInQty || 0)).length,
      note: purchase.note || "Accepted purchase items are waiting for Inventory confirmation.",
      items: purchase.items
        .filter((item) => Number(item.acceptedQty || 0) > Number(item.stockedInQty || 0))
        .map((item) => {
          const qty = Number(item.acceptedQty || 0) - Number(item.stockedInQty || 0);
          const conversionQty = Number(item.conversionQty || 1);
          const unitCostBase =
            Number(item.unitCostBase || 0) ||
            (conversionQty > 0 ? Number(item.unitCostUsd || item.unitCost || 0) / conversionQty : Number(item.unitCostUsd || item.unitCost || 0));

          return {
            purchaseItemId: item.id,
            inventoryId: item.variantUnitId,
            productVariantUnitId: item.variantUnitId,
            productVariantId: item.productVariantId,
            productName: item.productName,
            category: item.category,
            variantName: item.variantName,
            variantCode: item.variantCode,
            qty,
            unitName: item.unitName,
            conversionQty,
            baseUnit: item.baseUnit,
            baseQty: qty * conversionQty,
            unitCostBase,
            expiredDate: formatDateOnly(item.expiredDate),
          };
        }),
    });

    const normalizePendingReplacementReturnForStockIn = (purchaseReturn = {}) => {
      const sourcePurchase = purchaseReturn.purchase || purchaseReturn.source_purchase || {};
      const returnItems = Array.isArray(purchaseReturn.items)
        ? purchaseReturn.items
        : Array.isArray(purchaseReturn.purchase_return_items)
          ? purchaseReturn.purchase_return_items
          : [];
      const sourceItems = Array.isArray(sourcePurchase.items)
        ? sourcePurchase.items
        : Array.isArray(sourcePurchase.purchase_items)
          ? sourcePurchase.purchase_items
          : [];
      const items = returnItems.length > 0
        ? returnItems
        : sourceItems
            .filter((item) => Number(item.claim_qty ?? item.claimQty ?? 0) > 0)
            .map((item) => ({
              ...item,
              purchase_item: item,
              purchase_item_id: item.id,
              product_variant_unit_id: item.product_variant_unit_id || item.productVariantUnitId,
              qty: item.claim_qty ?? item.claimQty ?? 0,
              base_qty:
                Number(item.claim_qty ?? item.claimQty ?? 0) *
                (Number(item.conversion_qty ?? item.conversionQty ?? item.product_variant_unit?.conversion_qty ?? item.productVariantUnit?.conversionQty ?? 1) || 1),
            }));
      const receivedQty = Number(purchaseReturn.replacement_received_qty ?? purchaseReturn.replacementReceivedQty ?? 0);
      const stockedQty = Number(purchaseReturn.replacement_stocked_in_qty ?? purchaseReturn.replacementStockedInQty ?? 0);
      let remainingQty = Math.max(0, receivedQty - stockedQty);

      const normalizedItems = items
        .map((returnItem) => {
          if (remainingQty <= 0) return null;

          const purchaseItem = returnItem.purchase_item || returnItem.purchaseItem || {};
          const variantUnit =
            returnItem.product_variant_unit ||
            returnItem.productVariantUnit ||
            purchaseItem.product_variant_unit ||
            purchaseItem.productVariantUnit ||
            {};
          const variant =
            variantUnit.product_variant ||
            variantUnit.productVariant ||
            returnItem.product_variant ||
            returnItem.productVariant ||
            purchaseItem.product_variant ||
            purchaseItem.productVariant ||
            {};
          const unit = variantUnit.unit || {};
          const qtyAvailable = Math.max(
            0,
            Number(returnItem.replacement_received_qty ?? returnItem.replacementReceivedQty ?? returnItem.qty_returned ?? returnItem.qtyReturned ?? returnItem.qty ?? 0) -
              Number(returnItem.replacement_stocked_in_qty ?? returnItem.replacementStockedInQty ?? 0)
          );
          const qty = Math.min(remainingQty, qtyAvailable || remainingQty);
          remainingQty = Math.max(0, remainingQty - qty);
          const conversionQty =
            Number(
              returnItem.conversion_qty ??
                returnItem.conversionQty ??
                variantUnit.conversion_qty ??
                variantUnit.conversionQty ??
                purchaseItem.conversion_qty ??
                purchaseItem.conversionQty ??
                1
            ) || 1;
          const unitCostBase =
            Number(returnItem.unit_cost_base ?? returnItem.unitCostBase ?? 0) ||
            (conversionQty > 0 ? Number(returnItem.unit_cost_usd ?? returnItem.unitCostUsd ?? 0) / conversionQty : 0);

          return {
            purchaseItemId: returnItem.purchase_item_id || returnItem.purchaseItemId || purchaseItem.id,
            purchaseReturnItemId: returnItem.id,
            inventoryId: returnItem.product_variant_unit_id || returnItem.productVariantUnitId || variantUnit.id,
            productVariantUnitId: returnItem.product_variant_unit_id || returnItem.productVariantUnitId || variantUnit.id,
            productVariantId: returnItem.product_variant_id || returnItem.productVariantId || variantUnit.product_variant_id || variantUnit.productVariantId || variant.id,
            productName: returnItem.product_name || returnItem.productName || variant.product?.name || variant.product_name || purchaseItem.product_name || "-",
            category: variant.product?.category?.name || "-",
            variantName: returnItem.variant_name || returnItem.variantName || variant.variant_name || variant.variantName || purchaseItem.variant_name || "-",
            variantCode: returnItem.variant_code || returnItem.variantCode || variant.variant_code || variant.variantCode || purchaseItem.variant_code || "",
            qty,
            unitName: returnItem.unit_name || returnItem.unitName || unit.unit_name || purchaseItem.unit_name || "unit",
            conversionQty,
            baseUnit: returnItem.base_unit || returnItem.baseUnit || purchaseItem.base_unit || unit.unit_code || unit.unit_name || "base units",
            baseQty: qty * conversionQty,
            unitCostBase,
            expiredDate: formatDateOnly(returnItem.expired_date || returnItem.expiry_date || purchaseItem.expired_date || purchaseItem.expiryDate),
          };
        })
        .filter(Boolean)
        .filter((item) => Number(item.qty || 0) > 0);

      return {
        id: `return-${purchaseReturn.id}`,
        originalPurchaseId: sourcePurchase.id || purchaseReturn.purchase_id || purchaseReturn.purchaseId || "",
        purchaseReturnId: purchaseReturn.id,
        stockInMode: "replacement_return",
        purchaseNo: sourcePurchase.purchase_no || sourcePurchase.purchaseNo || purchaseReturn.purchase_no || `Claim ${purchaseReturn.purchase_return_no || purchaseReturn.purchaseReturnNo}`,
        supplierName: purchaseReturn.supplier?.name || sourcePurchase.supplier?.name || purchaseReturn.supplier_name || "-",
        purchaseDate: formatDateOnly(sourcePurchase.purchase_date || sourcePurchase.purchaseDate || purchaseReturn.resolved_at || purchaseReturn.updated_at),
        status: "Pending Stock In",
        totalItems: normalizedItems.length,
        note: `Supplier replacement from ${purchaseReturn.purchase_return_no || purchaseReturn.purchaseReturnNo || "claim"} is waiting for Inventory confirmation.`,
        items: normalizedItems,
      };
    };

    const serverBatches = useMemo(
      () => extractApiData(inventoryBatchesQuery.data).map(normalizeInventoryBatch),
      [inventoryBatchesQuery.data]
    );

    const serverMovements = useMemo(
      () => extractApiData(stockMovementsQuery.data).map(normalizeStockMovement),
      [stockMovementsQuery.data]
    );

    const variantUnitMeta = useMemo(() => {
      const meta = {};

      extractApiData(variantUnitsQuery.data).map(normalizeVariantUnit).forEach((item) => {
        meta[String(item.id)] = item;
        if (item.productVariantId) {
          meta[`variant:${item.productVariantId}`] = item;
          const groupKey = `variantUnits:${item.productVariantId}`;
          meta[groupKey] = [...(meta[groupKey] || []), item];
        }
      });

      const pending = Array.isArray(pendingPurchasesQuery.data) ? pendingPurchasesQuery.data : [];
      pending.forEach((purchase) => {
        (purchase.items || []).forEach((item) => {
          if (!item.variantUnitId) return;
          meta[String(item.variantUnitId)] = {
            ...(meta[String(item.variantUnitId)] || {}),
            id: item.variantUnitId,
            productVariantId: item.productVariantId,
            productName: item.productName,
            category: item.category,
            variantName: item.variantName,
            variantCode: item.variantCode,
            unitName: item.unitName,
            baseUnit: item.baseUnit,
            conversionQty: item.conversionQty,
            lowStockThreshold: item.lowStockThreshold,
          };

          if (item.productVariantId) {
            const groupKey = `variantUnits:${item.productVariantId}`;
            const existing = meta[groupKey] || [];
            if (!existing.some((unit) => String(unit.id) === String(item.variantUnitId))) {
              meta[groupKey] = [
                ...existing,
                {
                  id: item.variantUnitId,
                  productVariantId: item.productVariantId,
                  unitName: item.unitName,
                  baseUnit: item.baseUnit,
                  conversionQty: item.conversionQty,
                  isBaseUnit: Number(item.conversionQty || 1) === 1,
                },
              ];
            }
          }
        });
      });

      return meta;
    }, [variantUnitsQuery.data, pendingPurchasesQuery.data]);

    const serverInventory = useMemo(() => {
      const balances = extractApiData(stockBalancesQuery.data);
      return balances.map((item) => normalizeStockBalance(item, serverBatches, serverMovements, variantUnitMeta));
    }, [stockBalancesQuery.data, serverBatches, serverMovements, variantUnitMeta]);

    const serverPendingPurchases = useMemo(() => {
      const purchases = Array.isArray(pendingPurchasesQuery.data) ? pendingPurchasesQuery.data : [];

      const regularGroups = purchases
        .filter((p) => p.stockInMode !== "replacement_return")
        .map(normalizePendingPurchaseForStockIn);

      const replacementGroups = purchases.filter((p) => p.stockInMode === "replacement_return");

      return [
        ...regularGroups.filter((g) => g.items.length > 0),
        ...replacementGroups.filter((g) => g.items.length > 0),
      ];
    }, [pendingPurchasesQuery.data]);

    const sortedPendingPurchases = useMemo(() => {
      if (!stockInPurchaseId) return pendingPurchases;
      const matchesRequestedPurchase = (purchase) =>
        String(purchase.id) === String(stockInPurchaseId) ||
        String(purchase.originalPurchaseId || "") === String(stockInPurchaseId) ||
        (stockInPurchaseNo && String(purchase.purchaseNo || "") === String(stockInPurchaseNo));
      const requested = pendingPurchases.filter(matchesRequestedPurchase);
      const others = pendingPurchases.filter((purchase) => !matchesRequestedPurchase(purchase));

      return [...requested, ...others].sort((a, b) => {
        const aMatch = matchesRequestedPurchase(a);
        const bMatch = matchesRequestedPurchase(b);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        if (aMatch && bMatch && a.stockInMode === "replacement_return" && b.stockInMode !== "replacement_return") return -1;
        if (aMatch && bMatch && a.stockInMode !== "replacement_return" && b.stockInMode === "replacement_return") return 1;
        return 0;
      });
    }, [pendingPurchases, stockInPurchaseId, stockInPurchaseNo]);

    useEffect(() => {
      if (stockBalancesQuery.isSuccess) setInventory(serverInventory);
    }, [serverInventory, stockBalancesQuery.isSuccess]);

    useEffect(() => {
      if (pendingPurchasesQuery.isSuccess) setPendingPurchases(serverPendingPurchases);
    }, [pendingPurchasesQuery.isSuccess, serverPendingPurchases]);

    useEffect(() => {
      if (stockAdjustmentsQuery.isSuccess) {
        setStockAdjustments(
          extractApiData(stockAdjustmentsQuery.data).map(normalizeStockAdjustment)
        );
      }
    }, [stockAdjustmentsQuery.isSuccess, stockAdjustmentsQuery.data]);

    useEffect(() => {
      if (!stockInPurchaseId || modalMode) return;
      setModalMode("confirm_stock_in");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stockInPurchaseId]);

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

    const filteredStockAdjustments = useMemo(() => {
      const search = adjustmentSearchTerm.toLowerCase();

      return stockAdjustments.filter((adjustment) => {
        const matchesSearch =
          String(adjustment.adjustmentNo || "").toLowerCase().includes(search) ||
          String(adjustment.reason || "").toLowerCase().includes(search) ||
          String(adjustment.note || "").toLowerCase().includes(search) ||
          adjustment.items.some((item) =>
            [
              item.productName,
              item.variantName,
              item.variantCode,
              item.movementType,
              item.note,
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(search))
          );

        const matchesStatus =
          adjustmentStatusFilter === "All" ||
          adjustment.status === adjustmentStatusFilter;

        const matchesType =
          adjustmentTypeFilter === "All" ||
          adjustment.adjustmentType === adjustmentTypeFilter;

        const matchesReason =
          adjustmentReasonFilter === "All" ||
          adjustment.reason === adjustmentReasonFilter;

        return matchesSearch && matchesStatus && matchesType && matchesReason;
      });
    }, [
      stockAdjustments,
      adjustmentSearchTerm,
      adjustmentStatusFilter,
      adjustmentTypeFilter,
      adjustmentReasonFilter,
    ]);

    const filteredStockMovements = useMemo(() => {
      const search = movementSearchTerm.toLowerCase();

      return serverMovements.filter((movement) => {
        const matchesSearch = [
          movement.productName,
          movement.variantName,
          movement.variantCode,
          movement.type,
          movement.batchNo,
          movement.lotNo,
          movement.refType,
          movement.refId,
          movement.note,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

        const matchesDirection =
          movementDirectionFilter === "All" ||
          (movementDirectionFilter === "in" && Number(movement.qtyBase) > 0) ||
          (movementDirectionFilter === "out" && Number(movement.qtyBase) < 0);

        const matchesType =
          movementTypeFilter === "All" ||
          movement.type === movementTypeFilter;

        return matchesSearch && matchesDirection && matchesType;
      });
    }, [
      serverMovements,
      movementSearchTerm,
      movementDirectionFilter,
      movementTypeFilter,
    ]);

    const inventoryLoading =
      stockBalancesQuery.isLoading ||
      inventoryBatchesQuery.isLoading ||
      stockMovementsQuery.isLoading ||
      variantUnitsQuery.isLoading;

    const inventoryPagination = useMemo(() => {
      const total = filteredInventory.length;
      const lastPage = Math.max(1, Math.ceil(total / perPage));
      const currentPage = Math.min(page, lastPage);
      const from = total > 0 ? (currentPage - 1) * perPage + 1 : 0;
      const to = Math.min(currentPage * perPage, total);

      return {
        currentPage,
        from,
        lastPage,
        perPage,
        to,
        total,
      };
    }, [filteredInventory.length, page, perPage]);

    const paginatedInventory = useMemo(() => {
      const start = (inventoryPagination.currentPage - 1) * perPage;
      return filteredInventory.slice(start, start + perPage);
    }, [filteredInventory, inventoryPagination.currentPage, perPage]);

    const inventoryPageNumbers = useMemo(
      () => getPageNumbers(inventoryPagination.currentPage, inventoryPagination.lastPage),
      [inventoryPagination.currentPage, inventoryPagination.lastPage]
    );

    const adjustmentPagination = useMemo(() => {
      const total = filteredStockAdjustments.length;
      const lastPage = Math.max(1, Math.ceil(total / adjustmentPerPage));
      const currentPage = Math.min(adjustmentPage, lastPage);
      const from = total > 0 ? (currentPage - 1) * adjustmentPerPage + 1 : 0;
      const to = Math.min(currentPage * adjustmentPerPage, total);

      return {
        currentPage,
        from,
        lastPage,
        perPage: adjustmentPerPage,
        to,
        total,
      };
    }, [filteredStockAdjustments.length, adjustmentPage, adjustmentPerPage]);

    const paginatedStockAdjustments = useMemo(() => {
      const start = (adjustmentPagination.currentPage - 1) * adjustmentPerPage;
      return filteredStockAdjustments.slice(start, start + adjustmentPerPage);
    }, [
      filteredStockAdjustments,
      adjustmentPagination.currentPage,
      adjustmentPerPage,
    ]);

    const adjustmentPageNumbers = useMemo(
      () => getPageNumbers(adjustmentPagination.currentPage, adjustmentPagination.lastPage),
      [adjustmentPagination.currentPage, adjustmentPagination.lastPage]
    );

    const movementPagination = useMemo(() => {
      const total = filteredStockMovements.length;
      const lastPage = Math.max(1, Math.ceil(total / movementPerPage));
      const currentPage = Math.min(movementPage, lastPage);
      const from = total > 0 ? (currentPage - 1) * movementPerPage + 1 : 0;
      const to = Math.min(currentPage * movementPerPage, total);

      return {
        currentPage,
        from,
        lastPage,
        perPage: movementPerPage,
        to,
        total,
      };
    }, [filteredStockMovements.length, movementPage, movementPerPage]);

    const paginatedStockMovements = useMemo(() => {
      const start = (movementPagination.currentPage - 1) * movementPerPage;
      return filteredStockMovements.slice(start, start + movementPerPage);
    }, [filteredStockMovements, movementPagination.currentPage, movementPerPage]);

    const movementPageNumbers = useMemo(
      () => getPageNumbers(movementPagination.currentPage, movementPagination.lastPage),
      [movementPagination.currentPage, movementPagination.lastPage]
    );

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
        .filter((unit) => Number(unit.conversionQty) > 1)
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

    const getLowStockThresholdBreakdown = (item) => {
      const threshold = Number(item.lowStockThreshold || 0);
      const baseText = `${threshold.toLocaleString()} ${item.baseUnit}`;
      const convertedTexts = item.units
        .filter((unit) => Number(unit.conversionQty) > 1)
        .map((unit) => {
          const convQty = Number(unit.conversionQty || 1);
          const convertedQty = threshold / convQty;
          const display = Number.isInteger(convertedQty)
            ? convertedQty
            : Number(convertedQty.toFixed(2));
          const text =
            convertedQty < 1
              ? `< 1 ${unit.unitName} (${threshold.toLocaleString()} ${item.baseUnit})`
              : `${display} ${unit.unitName} = ${threshold.toLocaleString()} ${item.baseUnit}`;
          return { unitName: unit.unitName, text };
        });
      return { baseText, convertedTexts };
    };

    const getPendingStockInForInventoryItem = (inventoryItem) => {
      const variantUnitId = String(inventoryItem.productVariantUnitId || inventoryItem.id || "");
      const inventoryVariantCode = String(inventoryItem.variantCode || "").toLowerCase();
      const inventoryVariantName = String(inventoryItem.variantName || "").toLowerCase();
      const inventoryBaseUnit = String(inventoryItem.baseUnit || "").toLowerCase();
      const relatedItems = pendingPurchases.flatMap((purchase) =>
        (purchase.items || []).filter((item) => {
          const itemVariantUnitId = String(item.productVariantUnitId || item.inventoryId || "");
          const itemVariantCode = String(item.variantCode || "").toLowerCase();
          const itemVariantName = String(item.variantName || item.productName || "").toLowerCase();
          const itemBaseUnit = String(item.baseUnit || "").toLowerCase();

          if (itemVariantUnitId && variantUnitId && itemVariantUnitId === variantUnitId) return true;
          if (itemVariantCode && inventoryVariantCode && itemVariantCode === inventoryVariantCode) return true;
          return Boolean(
            itemVariantName &&
              inventoryVariantName &&
              itemVariantName === inventoryVariantName &&
              itemBaseUnit &&
              inventoryBaseUnit &&
              itemBaseUnit === inventoryBaseUnit
          );
        })
      );

      const baseQty = relatedItems.reduce((total, item) => total + Number(item.baseQty || 0), 0);
      const qty = relatedItems.reduce((total, item) => total + Number(item.qty || 0), 0);
      const unitName = relatedItems[0]?.unitName || inventoryItem.baseUnit;
      const baseUnit = relatedItems[0]?.baseUnit || inventoryItem.baseUnit;

      return {
        baseQty,
        qty,
        unitName,
        baseUnit,
      };
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

    const openAdjustmentDetailModal = async (adjustment) => {
      setErrors({});

      if (!adjustment?.id) {
        setSelectedAdjustment(adjustment);
        setModalMode("adjustment_detail");
        return;
      }

      try {
        const response = await queryClient.fetchQuery({
          queryKey: ["stock-adjustments", adjustment.id],
          queryFn: () => getStockAdjustmentByIdApi(adjustment.id),
          staleTime: 1000 * 30,
        });

        setSelectedAdjustment(
          normalizeStockAdjustment(extractApiObject(response))
        );
      } catch {
        setSelectedAdjustment(adjustment);
      }

      setModalMode("adjustment_detail");
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
      setSelectedAdjustment(null);
      setModalMode(null);
      setAdjustmentForm(emptyAdjustmentForm);
      setErrors({});
      if (stockInPurchaseId) {
        setSearchParams({}, { replace: true });
      }
    };

    const invalidateInventoryQueries = () => {
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-batches"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
    };

    const confirmStockInMutation = useMutation({
      mutationFn: ({ purchase, payload }) => {
        if (purchase.stockInMode === "replacement_return") {
          return updatePurchaseReturnApi({
            id: purchase.purchaseReturnId,
            payload: {
              replacement_received_qty: 0,
              replacement_items: payload.items || [],
            },
          });
        }

        return confirmPurchaseStockInApi(purchase.id, payload);
      },
      onSuccess: () => {
        invalidateInventoryQueries();
        notify.success("ស្តុកចូលបានបញ្ជាក់", "ចំនួនការទិញដែលទទួលបានត្រូវបានបន្ថែមទៅស្តុករួចហើយ");
        closeModal();
        if (stockInPurchaseId) {
          setSearchParams({}, { replace: true });
        }
      },
      onError: (error) => {
        const message = error?.response?.data?.message || error?.message || "ការបញ្ជាក់ស្តុកចូលបរាជ័យ";
        notify.error("ស្តុកចូលបរាជ័យ", message);
      },
    });

    const createStockAdjustmentMutation = useMutation({
      mutationFn: createStockAdjustmentApi,
      onSuccess: () => {
        invalidateInventoryQueries();
        notify.success("ការកែតម្រូវស្តុករក្សាទុករួច", "ការកែតម្រូវដែលបានអនុម័តត្រូវបានអនុវត្តទៅស្តុករួចហើយ");
        closeModal();
      },
      onError: (error) => {
        const message = error?.response?.data?.message || error?.message || "ការកែតម្រូវស្តុកបរាជ័យ";
        notify.error("ការកែតម្រូវបរាជ័យ", message);
      },
    });

    const updateStockAdjustmentMutation = useMutation({
      mutationFn: updateStockAdjustmentApi,
      onSuccess: () => {
        invalidateInventoryQueries();
        notify.success("ការកែតម្រូវស្តុកបានកែ", "ការកែតម្រូវសេចក្ដីព្រាងត្រូវបានកែរួចហើយ");
      },
      onError: (error) => {
        const message = error?.response?.data?.message || error?.message || "ការអាប់ដេតការកែតម្រូវបរាជ័យ";
        notify.error("ការអាប់ដេតការកែតម្រូវបរាជ័យ", message);
      },
    });

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

    const handleConfirmStockIn = (purchase, payload = {}) => {
      if (pendingPurchasesQuery.isSuccess && !String(purchase.id).startsWith("local-")) {
        confirmStockInMutation.mutate({ purchase, payload });
        return;
      }

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
          const lotNo = payload.items?.find(
            (payloadItem) =>
              String(payloadItem.purchase_item_id || "") ===
              String(purchaseItem.purchaseItemId || "")
          )?.lot_no;

          return {
            ...inventoryItem,
            stockBaseQty: nextQty,
            unitCostBase: purchaseItem.unitCostBase,
            status: getStockStatus(nextQty, inventoryItem.lowStockThreshold),
            batches: [
              {
                id: newBatchId,
                batchNo: `BATCH-${purchase.purchaseNo}-${inventoryItem.id}`,
                lotNo: lotNo || null,
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
      const parsedForm = stockAdjustmentFormSchema.safeParse(adjustmentForm);

      if (!parsedForm.success) {
        parsedForm.error.issues.forEach((issue) => {
          const field = issue.path[0];
          if (field && !nextErrors[field]) {
            nextErrors[field] = issue.message;
          }
        });
      }

      const item = inventory.find(
        (inventoryItem) =>
          String(inventoryItem.id) === String(adjustmentForm.inventoryId)
      );

      if (!item) {
        nextErrors.inventoryId = "សូមជ្រើសទំនិញស្តុក";
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
          nextErrors.qty = `មិនអាចដកចេញច្រើនជាង ${Number(
            item.stockBaseQty || 0
          ).toLocaleString()} ${item.baseUnit} ទេ`;
        }

        if (adjustmentForm.inventoryBatchId) {
          const selectedBatch = item.batches.find(
            (batch) => String(batch.id) === String(adjustmentForm.inventoryBatchId)
          );

          if (selectedBatch && baseQty > Number(selectedBatch.qtyRemainingBase || 0)) {
            nextErrors.qty = `Batch ដែលជ្រើសមានតែ ${Number(
              selectedBatch.qtyRemainingBase || 0
            ).toLocaleString()} ${item.baseUnit} ប៉ុណ្ណោះ`;
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

      if (stockBalancesQuery.isSuccess && item.productVariantId) {
        createStockAdjustmentMutation.mutate({
          adjustment_type: adjustmentForm.adjustmentType,
          reason: adjustmentForm.reason,
          note: adjustmentForm.note || "Manual stock adjustment",
          created_at: now,
          status: "approved",
          items: [
            {
              product_variant_id: item.productVariantId,
              product_variant_unit_id: selectedUnit.id || item.productVariantUnitId,
              inventory_batch_id: selectedBatch?.id || null,
              qty: Number(adjustmentForm.qty || 0),
              base_qty: baseQty,
              movement_type: movementType,
              unit_cost_base: unitCostBase,
              line_cost: lineCost,
              note: adjustmentForm.note || "Manual stock adjustment",
              created_at: now,
            },
          ],
        });
        return;
      }

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
            productVariantId: item.productVariantId,
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

    const handleCancelAdjustment = async (adjustment) => {
      if (!adjustment?.id || adjustment.status !== "draft") return;
      const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុបការកែតម្រូវ ${adjustment.adjustmentNo || "នេះ"}?`);
      if (!ok) return;
      updateStockAdjustmentMutation.mutate({
        id: adjustment.id,
        payload: { status: "cancelled" },
      });
    };

    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
           
          </div>

        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            theme={theme}
            title="ទំនិញក្នុងស្តុក"
            value={totalStockItems}
            icon={<FiBox className="text-[34px] text-red-500" />}
            iconBg="bg-red-500/10"
          />

          <SummaryCard
            theme={theme}
            title="រង់ចាំទទួលស្តុក"
            value={pendingPurchases.length}
            icon={<FiClipboard className="text-[34px] text-blue-500" />}
            iconBg="bg-blue-500/10"
          />

          <SummaryCard
            theme={theme}
            title="ស្តុកស្ទើរអស់"
            value={lowStockItems}
            icon={<FiAlertTriangle className="text-[34px] text-amber-500" />}
            iconBg="bg-amber-500/10"
          />

          <SummaryCard
            theme={theme}
            title="តម្លៃស្តុក"
            rawValue={stockValue}
            icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
            iconBg="bg-emerald-500/10"
          />
        </div>

        <div className={`flex flex-wrap gap-2 rounded-2xl border p-2 shadow-sm ${theme.card}`}>
          {[
            { id: "stock", label: "បញ្ជីស្តុក", count: inventory.length },
            { id: "adjustments", label: "ការកែតម្រូវស្តុក", count: stockAdjustments.length },
            { id: "movements", label: "ចលនាស្តុក", count: serverMovements.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === "stock" && (
          <>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[1fr_230px_180px_220px]">
            <div className="relative">
              <FiSearch
                className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
              />

              <input
                id="inventory-search"
                type="text"
                placeholder="ស្វែងរកស្តុក ទំនិញ បំពង លេខកូដ..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
              />
            </div>

            <div className="relative">
              <InventoryDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                theme={theme}
                icon={<FiFilter />}
                options={[
                  { value: "All", label: "ស្ថានភាពទាំងអស់" },
                  { value: "In Stock", label: "មានស្តុក" },
                  { value: "Low Stock", label: "ស្តុកស្ទើរអស់" },
                  { value: "Out of Stock", label: "អស់ស្តុក" },
                ]}
                heightClass="h-12"
                roundedClass="rounded-2xl"
              />
            </div>

            <div className="relative">
              <InventoryDropdown
                value={perPage}
                onChange={(value) => setPerPage(Number(value))}
                theme={theme}
                options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} / ទំព័រ` }))}
                heightClass="h-12"
                roundedClass="rounded-2xl"
                fontClass="font-semibold"
              />
            </div>

            <button
              type="button"
              onClick={openConfirmStockInModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <FiCheckCircle className="text-lg" />
              បញ្ជាក់ស្តុកចូល
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            theme={theme}
            icon={<FiTruck className="text-4xl text-emerald-500" />}
            title="ស្តុកចូល"
            subtitle="បញ្ជាក់ការទិញដែលទទួលបាន"
            buttonText="បញ្ជាក់ស្តុកចូល"
            buttonClass="bg-emerald-500 hover:bg-emerald-600"
            onClick={openConfirmStockInModal}
          />

          <ActionCard
            theme={theme}
            icon={<FiEdit2 className="text-4xl text-blue-500" />}
            title="ការកែតម្រូវស្តុក"
            subtitle="សម្រាប់អ្នកគ្រប់គ្រងប៉ុណ្ណោះ"
            buttonText="ការកែតម្រូវស្តុក"
            buttonClass="bg-blue-600 hover:bg-blue-700"
            onClick={() => openAdjustmentModal("adjustment_in")}
          />

          <ActionCard
            theme={theme}
            icon={<FiTrendingDown className="text-4xl text-red-500" />}
            title="ស្តុកចេញ"
            subtitle="ខូចខាត / ផុតកំណត់ / ដកប្រើប្រាស់"
            buttonText="ស្តុកចេញ"
            buttonClass="bg-red-500 hover:bg-red-600"
            onClick={() => openAdjustmentModal("adjustment_out")}
          />

          <ActionCard
            theme={theme}
            icon={<FiLayers className="text-4xl text-amber-500" />}
            title="ចលនាស្តុក"
            subtitle="តាមដានស្តុកចូល/ចេញ"
            buttonText="មើលចលនា"
            buttonClass="bg-amber-500 hover:bg-amber-600"
            onClick={() => setActiveTab("movements")}
          />
        </div>

        <div
          className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between ${theme.card}`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
              <FiClipboard className="text-4xl text-emerald-500" />
            </div>

            <div>
              <h3 className="text-base font-bold">
                ការទិញរង់ចាំទទួលស្តុក
              </h3>

              <p className={`mt-1 text-sm ${theme.muted}`}>
                {pendingPurchases.length > 0
                  ? `${pendingPurchases.length} ការទិញរង់ចាំបញ្ជាក់ស្តុក`
                  : "គ្មានការទិញណាមួយរង់ចាំបញ្ជាក់ស្តុកទេ។"}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={pendingPurchases.length === 0}
            onClick={openConfirmStockInModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheckCircle />
            ពិនិត្យ & បញ្ជាក់
          </button>
        </div>

        {lowStockList.length > 0 && (
          <div
            className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between ${theme.card}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
                <FiAlertTriangle className="text-4xl text-amber-500" />
              </div>

              <div>
                <h3 className="text-base font-bold">ជូនដំណឹងស្តុកស្ទើរអស់</h3>

                <p className={`mt-1 text-sm ${theme.muted}`}>
                  {lowStockList.length} មុខត្រូវការចាត់វិធានការ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter("Low Stock")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white hover:bg-amber-600"
            >
              <FiList />
              មើលស្តុកស្ទើរអស់
            </button>
          </div>
        )}

        <InventoryTable
          theme={theme}
          inventory={inventory}
          filteredInventory={paginatedInventory}
          isLoading={inventoryLoading}
          pagination={inventoryPagination}
          pageNumbers={inventoryPageNumbers}
          onPageChange={setPage}
          getVariantStockBreakdown={getVariantStockBreakdown}
          getLowStockThresholdBreakdown={getLowStockThresholdBreakdown}
          getPendingStockInForInventoryItem={getPendingStockInForInventoryItem}
          getStatusClass={getStatusClass}
          openViewModal={openViewModal}
          openAdjustmentModal={openAdjustmentModal}
        />
          </>
        )}

        {activeTab === "adjustments" && (
          <>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[1fr_190px_190px_220px]">
                <div className="relative">
                  <FiSearch
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
                  />

                  <input
                    type="text"
                    placeholder="ស្វែងរកការកែតម្រូវ មូលហេតុ ទំនិញ..."
                    value={adjustmentSearchTerm}
                    onChange={(event) => setAdjustmentSearchTerm(event.target.value)}
                    className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
                  />
                </div>

                <div className="relative">
                  <InventoryDropdown
                    value={adjustmentStatusFilter}
                    onChange={setAdjustmentStatusFilter}
                    theme={theme}
                    icon={<FiFilter />}
                    options={[
                      { value: "All", label: "ស្ថានភាពទាំងអស់" },
                      { value: "draft", label: "សេចក្តីព្រាង" },
                      { value: "approved", label: "បានអនុម័ត" },
                      { value: "cancelled", label: "បានបោះបង់" },
                    ]}
                    heightClass="h-12"
                    roundedClass="rounded-2xl"
                  />
                </div>

                <div className="relative">
                  <InventoryDropdown
                    value={adjustmentTypeFilter}
                    onChange={setAdjustmentTypeFilter}
                    theme={theme}
                    icon={<FiTrendingUp />}
                    options={[
                      { value: "All", label: "ប្រភេទទាំងអស់" },
                      { value: "increase", label: "បន្ថែម" },
                      { value: "decrease", label: "កាត់" },
                    ]}
                    heightClass="h-12"
                    roundedClass="rounded-2xl"
                  />
                </div>

                <div className="relative">
                  <InventoryDropdown
                    value={adjustmentReasonFilter}
                    onChange={setAdjustmentReasonFilter}
                    theme={theme}
                    icon={<FiTag />}
                    options={[
                      { value: "All", label: "មូលហេតុទាំងអស់" },
                      ...adjustmentReasons.map((reason) => ({ value: reason.value, label: reason.label })),
                    ]}
                    heightClass="h-12"
                    roundedClass="rounded-2xl"
                  />
                </div>
              </div>

              <div className="relative min-w-[13rem]">
                <InventoryDropdown
                  value={adjustmentPerPage}
                  onChange={(value) => setAdjustmentPerPage(Number(value))}
                  theme={theme}
                  options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} / ទំព័រ` }))}
                  heightClass="h-12"
                  roundedClass="rounded-2xl"
                  fontClass="font-semibold"
                />
              </div>
            </div>

            <StockAdjustmentTable
              theme={theme}
              adjustments={paginatedStockAdjustments}
              isLoading={stockAdjustmentsQuery.isLoading}
              pagination={adjustmentPagination}
              pageNumbers={adjustmentPageNumbers}
              onPageChange={setAdjustmentPage}
              onView={openAdjustmentDetailModal}
              onCancel={handleCancelAdjustment}
            />
          </>
        )}

        {activeTab === "movements" && (
          <>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid w-full grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_230px_180px]">
                <div className="relative">
                  <FiSearch
                    className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
                  />

                  <input
                    type="text"
                    placeholder="ស្វែងរកចលនា ទំនិញ បាច់ លេខ..."
                    value={movementSearchTerm}
                    onChange={(event) => setMovementSearchTerm(event.target.value)}
                    className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
                  />
                </div>

                <div className="relative">
                  <InventoryDropdown
                    value={movementDirectionFilter}
                    onChange={setMovementDirectionFilter}
                    theme={theme}
                    icon={<FiFilter />}
                    options={[
                      { value: "All", label: "ទិសដៅទាំងអស់" },
                      { value: "in", label: "ស្តុកចូល" },
                      { value: "out", label: "ស្តុកចេញ" },
                    ]}
                    heightClass="h-12"
                    roundedClass="rounded-2xl"
                  />
                </div>

                <div className="relative">
                  <InventoryDropdown
                    value={movementTypeFilter}
                    onChange={setMovementTypeFilter}
                    theme={theme}
                    icon={<FiLayers />}
                    options={[
                      { value: "All", label: "ចលនាទាំងអស់" },
                      ...[...new Set(serverMovements.map((movement) => movement.type).filter(Boolean))].map((type) => ({
                        value: type,
                        label: formatMovementTypeKh(type),
                      })),
                    ]}
                    searchable={serverMovements.length > 8}
                    heightClass="h-12"
                    roundedClass="rounded-2xl"
                  />
                </div>

                <div className="relative">
                  <InventoryDropdown
                    value={movementPerPage}
                    onChange={(value) => setMovementPerPage(Number(value))}
                    theme={theme}
                    options={[10, 25, 50, 100].map((value) => ({ value, label: `${value} / ទំព័រ` }))}
                    heightClass="h-12"
                    roundedClass="rounded-2xl"
                    fontClass="font-semibold"
                  />
                </div>
              </div>
            </div>

            <StockMovementTable
              theme={theme}
              movements={paginatedStockMovements}
              isLoading={stockMovementsQuery.isLoading}
              pagination={movementPagination}
              pageNumbers={movementPageNumbers}
              onPageChange={setMovementPage}
            />
          </>
        )}

        {modalMode === "confirm_stock_in" && (
          <ConfirmStockInModal
            pendingPurchases={sortedPendingPurchases}
            theme={theme}
            onClose={closeModal}
            onConfirm={handleConfirmStockIn}
            isConfirming={confirmStockInMutation.isPending}
          />
        )}

        {modalMode === "view" && selectedItem && (
          <InventoryDetailModal
            item={selectedItem}
            theme={theme}
            getStatusClass={getStatusClass}
            getVariantStockBreakdown={getVariantStockBreakdown}
            getLowStockThresholdBreakdown={getLowStockThresholdBreakdown}
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
            isSaving={createStockAdjustmentMutation.isPending}
          />
        )}

        {modalMode === "adjustment_detail" && selectedAdjustment && (
          <StockAdjustmentDetailModal
            adjustment={selectedAdjustment}
            theme={theme}
            onClose={closeModal}
          />
        )}
      </section>
    );
  }

