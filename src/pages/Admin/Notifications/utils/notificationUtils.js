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

  // unit_name before unit_code — unit_code is an internal identifier that can be a meaningless
  // auto-generated placeholder (e.g. "UNIT28811") for a real Khmer unit name (e.g. "ដប"). Same
  // fallback-order fix already applied in Inventory.jsx's own unit-label helpers.
  const baseUnit =
    item.base_unit ||
    item.baseUnit ||
    item.unit_name ||
    item.unitName ||
    unit.unit_name ||
    unit.unitName ||
    unit.unit_code ||
    unit.unitCode ||
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
    type: "stock",
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value) {
  if (!value || value === "-") return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getExpiryAlertInfo(expiredDate, warningDays = 30) {
  const expiry = parseDateOnly(expiredDate);
  if (!expiry) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysRemaining < 0) {
    return { daysRemaining, status: "expired", label: "ផុតកំណត់ហើយ" };
  }

  if (daysRemaining === 0) {
    return { daysRemaining, status: "expired", label: "ផុតកំណត់ថ្ងៃនេះ" };
  }

  if (daysRemaining === 1) {
    return { daysRemaining, status: "expiring", label: "ផុតកំណត់ស្អែក" };
  }

  return {
    daysRemaining,
    status: "expiring",
    label: `នៅសល់ ${daysRemaining} ថ្ងៃ`,
  };
}

export function normalizeExpiryAlert(item = {}, warningDays = 30) {
  const variant = item.product_variant || item.productVariant || {};
  const product = variant.product || item.product || {};
  const expiredDate =
    item.expired_date ||
    item.expiry_date ||
    item.expiredDate ||
    item.expiryDate ||
    "";
  const expiryInfo = getExpiryAlertInfo(expiredDate, warningDays);
  const qtyRemaining = Number(item.qty_remaining_base ?? item.qtyRemainingBase ?? item.qty ?? 0);

  if (!expiryInfo || qtyRemaining <= 0 || expiryInfo.daysRemaining > warningDays) {
    return null;
  }

  const variantName =
    variant.variant_name ||
    variant.variantName ||
    item.variant_name ||
    item.variantName ||
    product.name ||
    item.product_name ||
    item.productName ||
    "Inventory item";

  return {
    id: `expiry-${item.id || item.batch_no || item.batchNo || variantName}`,
    type: "expiry",
    productName: product.name || item.product_name || item.productName || "-",
    variantName,
    variantCode:
      variant.variant_code ||
      variant.variantCode ||
      item.variant_code ||
      item.variantCode ||
      "",
    batchNo: item.batch_no || item.batchNo || "",
    lotNo: item.lot_no || item.lotNo || "",
    expiredDate,
    daysRemaining: expiryInfo.daysRemaining,
    expiryLabel: expiryInfo.label,
    qtyRemaining,
    baseUnit:
      item.base_unit ||
      item.baseUnit ||
      variant.package_type ||
      variant.packageType ||
      "unit",
    status: expiryInfo.status,
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

export function buildExpiryAlerts(inventoryBatches = [], warningDays = 30) {
  return inventoryBatches
    .map((item) => normalizeExpiryAlert(item, warningDays))
    .filter(Boolean)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function sortAlerts(alerts = []) {
  const priority = {
    expired: 0,
    out: 1,
    expiring: 2,
    low: 3,
    ok: 4,
  };

  return [...alerts].sort((a, b) => {
    const priorityDiff = (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
    if (priorityDiff !== 0) return priorityDiff;
    if (a.type === "expiry" && b.type === "expiry") {
      return Number(a.daysRemaining || 0) - Number(b.daysRemaining || 0);
    }
    return Number(a.stockQty || 0) - Number(b.stockQty || 0);
  });
}

export function formatQty(value) {
  return Number(value || 0).toLocaleString();
}
