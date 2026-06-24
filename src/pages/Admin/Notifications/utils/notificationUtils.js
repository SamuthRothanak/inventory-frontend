export function extractApiData(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

export function getNestedValue(source, paths, fallback = "") {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
}

export function normalizeStockAlert(item = {}) {
  const variantUnit = item.product_variant_unit || item.productVariantUnit || {};
  const variant =
    item.product_variant ||
    item.productVariant ||
    variantUnit.product_variant ||
    variantUnit.productVariant ||
    {};
  const product = variant.product || item.product || {};
  const unit = variantUnit.unit || item.unit || {};

  const stockQty = Number(
    getNestedValue(
      item,
      [
        "on_hand_base_qty",
        "onHandBaseQty",
        "qty_on_hand_base",
        "qtyOnHandBase",
        "balance_base_qty",
        "balanceBaseQty",
        "qty_base",
        "qtyBase",
        "current_stock",
        "currentStock",
        "current_qty",
        "currentQty",
        "qty_on_hand",
        "qtyOnHand",
        "on_hand_qty",
        "onHandQty",
        "available_qty",
        "availableQty",
        "balance_qty",
        "balanceQty",
        "quantity",
        "stock_qty",
        "stockQty",
      ],
      0
    )
  );

  const threshold = Number(
    item.low_stock_threshold ??
      item.lowStockThreshold ??
      variant.low_stock_threshold ??
      variant.lowStockThreshold ??
      0
  );

  const baseUnit =
    item.base_unit ||
    item.baseUnit ||
    item.unit_name ||
    item.unitName ||
    unit.unit_code ||
    unit.unitCode ||
    unit.unit_name ||
    unit.unitName ||
    variant.package_type ||
    variant.packageType ||
    "unit";

  const variantName =
    variant.variant_name ||
    variant.variantName ||
    item.variant_name ||
    item.variantName ||
    item.product_variant_name ||
    item.productVariantName ||
    product.name ||
    item.product_name ||
    item.productName ||
    "Inventory item";

  return {
    id: item.id || variantUnit.id || variant.id || variantName,
    productName: product.name || item.product_name || item.productName || "-",
    variantName,
    variantCode:
      variant.variant_code ||
      variant.variantCode ||
      item.variant_code ||
      item.variantCode ||
      "",
    stockQty,
    threshold,
    baseUnit,
    status: stockQty <= 0 ? "out" : stockQty <= threshold ? "low" : "ok",
  };
}

export function buildInventoryAlerts(stockBalances = []) {
  return stockBalances
    .map(normalizeStockAlert)
    .filter((item) => item.threshold > 0 && item.stockQty <= item.threshold)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "out" ? -1 : 1;
      return a.stockQty - b.stockQty;
    });
}

export function formatQty(value) {
  return Number(value || 0).toLocaleString();
}
