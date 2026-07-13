import { extractApiData, formatDateTimeLocal } from "../../Purcheases/utils/purchaseUtils";

export function normalizeStockAdjustment(item = {}) {
  const rawItems = extractApiData(item.items || item.stock_adjustment_items || item.stockAdjustmentItems || []);

  return {
    id: item.id,
    adjustmentNo: item.adjustment_no || item.adjustmentNo || "",
    adjustmentType: item.adjustment_type || item.adjustmentType || "decrease",
    reason: item.reason || "other",
    note: item.note || "",
    createdBy: item.created_by || item.createdBy || "",
    createdAt: formatDateTimeLocal(item.created_at || item.createdAt || ""),
    status: item.status || "draft",
    items: rawItems.map(normalizeStockAdjustmentItem),
    raw: item,
  };
}

export function normalizeStockAdjustmentItem(item = {}) {
  const variantUnit = item.product_variant_unit || item.productVariantUnit || {};
  const variant = item.product_variant || item.productVariant || variantUnit.product_variant || variantUnit.productVariant || {};
  const product = variant.product || {};
  const unit = variantUnit.unit || {};

  return {
    id: item.id,
    stockAdjustmentId: item.stock_adjustment_id || item.stockAdjustmentId || "",
    productVariantId: item.product_variant_id || item.productVariantId || "",
    productVariantUnitId: item.product_variant_unit_id || item.productVariantUnitId || "",
    inventoryBatchId: item.inventory_batch_id || item.inventoryBatchId || "",
    productName: product.name || item.product_name || item.productName || "-",
    variantName: variant.variant_name || variant.variantName || item.variant_name || item.variantName || "-",
    variantCode: variant.variant_code || variant.variantCode || item.variant_code || item.variantCode || "",
    unitName: unit.unit_name || unit.unitName || item.unit_name || item.unitName || "-",
    qty: Number(item.qty || 0),
    baseQty: Number(item.base_qty ?? item.baseQty ?? 0),
    movementType: item.movement_type || item.movementType || "",
    unitCostBase: Number(item.unit_cost_base ?? item.unitCostBase ?? 0),
    lineCost: Number(item.line_cost ?? item.lineCost ?? 0),
    note: item.note || "",
    createdAt: formatDateTimeLocal(item.created_at || item.createdAt || ""),
    raw: item,
  };
}
