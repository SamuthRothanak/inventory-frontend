import { useEffect } from "react";

import { paymentModeOptions, STATUS } from "./purchaseConstants";

export function useLockBodyScroll(isOpen) {

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



export function formatSnake(value = "") {

  return String(value || "-").replaceAll("_", " ");

}



export function formatMoney(value) {

  return `$${Number(value || 0).toFixed(2)}`;

}



export function extractApiData(response) {

  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;

  if (Array.isArray(response?.data?.data)) return response.data.data;

  if (Array.isArray(response?.data?.items)) return response.data.items;

  return [];

}



export function extractApiObject(response) {

  return response?.data?.data || response?.data || response || null;

}



export function getPaginationMeta(response, fallbackLength = 0) {

  const data = response?.data;

  const meta = data?.meta || response?.meta || null;



  return {

    currentPage: Number(meta?.current_page || meta?.currentPage || data?.current_page || 1),

    perPage: Number(meta?.per_page || meta?.perPage || data?.per_page || 10),

    total: Number(meta?.total || data?.total || fallbackLength),

    lastPage: Number(meta?.last_page || meta?.lastPage || data?.last_page || 1),

    from: Number(meta?.from || data?.from || (fallbackLength > 0 ? 1 : 0)),

    to: Number(meta?.to || data?.to || fallbackLength),

  };

}



export function getErrorMessage(error, fallback = "Something went wrong.") {

  const response = error?.response?.data;



  if (response?.message && response?.errors) {

    const firstError = Object.values(response.errors)?.[0]?.[0];

    return firstError || response.message;

  }



  return response?.message || error?.message || fallback;

}



export function formatCurrencyPair(usd, khr) {
  return `$${Number(usd || 0).toFixed(2)} / \u17db${Number(khr || 0).toLocaleString()}`;


}

export function formatDateOnly(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.includes("T")) return text.split("T")[0];
  return text.slice(0, 10);
}

export function formatDateTimeLocal(value, timeZone = "Asia/Phnom_Penh") {
  if (!value) return "-";

  const text = String(value).trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const isoText = text.includes("T") ? text : text.replace(" ", "T");
  const date = new Date(hasTimezone ? isoText : `${isoText}Z`);

  if (Number.isNaN(date.getTime())) return text;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;
}



export function normalizeCurrency(value = "USD") {

  const currency = String(value || "USD").trim().toUpperCase();

  return currency === "KHR" ? "KHR" : "USD";

}

export function currencyToApi(value = "USD") {

  return normalizeCurrency(value).toLowerCase();

}

export function normalizeDeliveryOption(value = "none") {
  const option = String(value || "none").trim();
  const map = {
    supplier: "supplier_delivery",
    shop: "self_pickup",
    shop_pickup: "self_pickup",
    third_party_delivery: "third_party",
  };
  return map[option] || option || "none";
}

export function normalizeDeliveryPaidBy(value = "buyer") {
  const paidBy = String(value || "buyer").trim();
  const map = {
    shop: "buyer",
    included_in_invoice: "buyer",
  };
  return map[paidBy] || paidBy || "buyer";
}

export function convertCost({ inputCurrency, inputUnitCost, exchangeRate }) {

  const cost = Number(inputUnitCost || 0);

  const rate = Number(exchangeRate || 0);
  const currency = normalizeCurrency(inputCurrency);



  if (!rate || rate <= 0) {

    return {

      unitCostUsd: 0,

      unitCostKhr: 0,

    };

  }



  if (currency === "KHR") {

    return {

      unitCostUsd: cost / rate,

      unitCostKhr: cost,

    };

  }



  return {

    unitCostUsd: cost,

    unitCostKhr: cost * rate,

  };

}



export function calculateCurrencyPreview({ items = [], form = {} }) {

  const rate = Number(form.exchangeRateUsed || 0);

  const discount = convertCost({

    inputCurrency: form.discountCurrency || "USD",

    inputUnitCost: form.discountTotal || 0,

    exchangeRate: rate,

  });

  const delivery = convertCost({

    inputCurrency: form.deliveryFeeCurrency || "USD",

    inputUnitCost: form.deliveryFee || 0,

    exchangeRate: rate,

  });

  const paid = convertCost({

    inputCurrency: form.paidCurrency || "USD",

    inputUnitCost: form.paidAmount || 0,

    exchangeRate: rate,

  });



  const subtotalUsd = items.reduce((total, item) => total + Number(item.lineTotalUsd ?? item.lineTotal ?? 0), 0);

  const subtotalKhr = items.reduce((total, item) => total + Number(item.lineTotalKhr || 0), 0);

  const discountUsd = discount.unitCostUsd;

  const discountKhr = discount.unitCostKhr;

  const deliveryUsd = delivery.unitCostUsd;

  const deliveryKhr = delivery.unitCostKhr;

  const grandTotalUsd = Math.max(0, subtotalUsd - discountUsd + deliveryUsd);

  const grandTotalKhr = Math.max(0, subtotalKhr - discountKhr + deliveryKhr);

  const paidAmountUsd = form.paymentStatus === "paid" ? grandTotalUsd : paid.unitCostUsd;

  const paidAmountKhr = form.paymentStatus === "paid" ? grandTotalKhr : paid.unitCostKhr;



  return {

    subtotalUsd,

    subtotalKhr,

    discountUsd,

    discountKhr,

    deliveryUsd,

    deliveryKhr,

    grandTotalUsd,

    grandTotalKhr,

    paidAmountUsd,

    paidAmountKhr,

    balanceUsd: Math.max(0, grandTotalUsd - paidAmountUsd),

    balanceKhr: Math.max(0, grandTotalKhr - paidAmountKhr),

  };

}



export function formatPaymentMode(value = "") {

  const found = paymentModeOptions.find((item) => item.value === value);

  return found?.label || value || "-";

}

export function getPurchaseItemSummary(purchase = {}) {
  const loadedItems = Array.isArray(purchase.items) ? purchase.items : [];
  const summaryItems = Array.isArray(purchase.summaryItems) ? purchase.summaryItems : [];
  const items = loadedItems.length > 0 ? loadedItems : summaryItems;
  const productsCount = Number(purchase.productsCount || 0);
  const purchaseLinesCount = Number(purchase.purchaseLinesCount || purchase.itemsCount || 0);

  if (purchase.productSummary) {
    return {
      title: purchase.productSummary,
      detail: purchaseLinesCount > 0 ? `${purchaseLinesCount} purchase line${purchaseLinesCount > 1 ? "s" : ""}` : "",
      hasDetail: true,
    };
  }

      if (items.length === 0) {
        return {
          title: "",
        detail: "",
        hasDetail: false,
      };
  }

  const grouped = items.reduce((summary, item) => {
    const productName = item.productName || item.product_name || item.variantName || item.variant_name || "Unknown product";
    const variantName = item.variantName || item.variant_name || item.variantCode || item.variant_code || productName;
    const qty = Number(item.invoicedQty ?? item.invoiced_qty ?? item.qty ?? item.quantity ?? item.paidQty ?? item.paid_qty ?? 0);
    const unit = item.unitName || item.unit_name || "";
    const current = summary.get(productName) || {
      name: productName,
      qty: 0,
      unit,
      variants: new Set(),
      lines: 0,
    };

    current.qty += qty;
    current.unit = current.unit || unit;
    current.variants.add(variantName);
    current.lines += 1;
    summary.set(productName, current);
    return summary;
  }, new Map());

  const products = Array.from(grouped.values());
  const lineCount = items.length || purchaseLinesCount;
  const totalQty = products.reduce((total, item) => total + item.qty, 0);
  const primaryUnit = products.length === 1 ? products[0].unit : "";
  const qtyText = totalQty ? ` - ${totalQty}${primaryUnit ? ` ${primaryUnit}` : ""}` : "";

  return {
    title: `${products.length} product${products.length > 1 ? "s" : ""}${qtyText}`,
    detail: products
      .slice(0, 2)
      .map((item) => {
        const variants = Array.from(item.variants).filter(Boolean);
        const variantText = variants.length > 1 ? ` (${variants.length} variants)` : "";
        const lineText = item.lines > 1 ? ` - ${item.lines} lines` : "";
        return `${item.name}${variantText}${lineText}`;
      })
      .join(", ")
      .concat(products.length > 2 ? ` +${products.length - 2} more` : lineCount > products.length ? "" : ""),
    hasDetail: true,
  };
}



export function buildTheme(isDark) {

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

    softCardHover: isDark ? "hover:bg-white/[0.06]" : "hover:bg-zinc-50",

    section: isDark ? "border-white/10 bg-[#18181b]" : "border-zinc-200 bg-white",

  };

}



export function normalizeSupplier(item) {

  return {

    id: item.id,

    supplierCode: item.supplier_code || item.supplierCode || "",

    name: item.name || item.supplier_name || item.supplierName || "-",

    contactPerson: item.contact_person || item.contactPerson || "",

    phone: item.phone || "",

    trustMode: item.trust_mode || item.trustMode || "pay_after_check",

    note: item.note || "",

  };

}



export function normalizeVariantUnit(item) {

  const variant = item.product_variant || item.productVariant || item.variant || {};

  const product = variant.product || item.product || {};
  const category = product.category || variant.category || item.category || {};

  const unit = item.unit || {};
  const variantPackageUnit = variant.package_type || variant.packageType || "";



  return {

    id: item.id,

    productVariantId:
      item.product_variant_id ||
      item.productVariantId ||
      variant.id ||
      "",

    productName: product.name || item.product_name || item.productName || "-",

    category:
      product.category_name ||
      product.categoryName ||
      category.name ||
      item.category_name ||
      item.categoryName ||
      (typeof item.category === "string" ? item.category : "") ||
      "-",

    variantName:

      variant.variant_name ||

      variant.variantName ||

      item.variant_name ||

      item.variantName ||

      "-",

    variantCode:

      variant.variant_code ||

      variant.variantCode ||

      item.variant_code ||

      item.variantCode ||

      "",

    unitName: unit.unit_name || item.unit_name || item.unitName || "-",

    unitCode: unit.unit_code || item.unit_code || item.unitCode || "",

    baseUnit: variantPackageUnit || item.base_unit || item.baseUnit || unit.base_unit || unit.baseUnit || unit.unit_code || unit.unitCode || "-",

    lowStockThreshold: Number(
      variant.low_stock_threshold ??
        variant.lowStockThreshold ??
        item.low_stock_threshold ??
        item.lowStockThreshold ??
        0
    ),

    conversionQty: Number(item.conversion_qty || item.conversionQty || 1),

    defaultCost: Number(item.default_cost || item.defaultCost || item.unit_cost_usd || 0),

    isBaseUnit: Boolean(item.is_base_unit ?? item.isBaseUnit ?? false),

    isDefaultSaleUnit: Boolean(item.is_default_sale_unit ?? item.isDefaultSaleUnit ?? false),

    isDefaultPurchaseUnit: Boolean(item.is_default_purchase_unit ?? item.isDefaultPurchaseUnit ?? false),

    isExpirable: Boolean(item.is_expirable ?? item.isExpirable ?? false),

  };

}



export function normalizePurchaseStatus(value) {

  const status = String(value || "").trim().toLowerCase();

  const map = {

    draft: STATUS.DRAFT,

    pending_receive: STATUS.PENDING_RECEIVE,

    "pending receive": STATUS.PENDING_RECEIVE,

    pending_stock_in: STATUS.PENDING_STOCK_IN,

    "pending stock in": STATUS.PENDING_STOCK_IN,

    pending_claim: STATUS.PENDING_CLAIM,

    "pending claim": STATUS.PENDING_CLAIM,

    received: STATUS.RECEIVED,

    cancelled: STATUS.CANCELLED,

    canceled: STATUS.CANCELLED,

  };



  return map[status] || value || STATUS.DRAFT;

}



export function statusToApi(value) {

  const map = {

    [STATUS.DRAFT]: "draft",

    [STATUS.PENDING_RECEIVE]: "pending_receive",

    [STATUS.PENDING_STOCK_IN]: "pending_stock_in",

    [STATUS.PENDING_CLAIM]: "pending_claim",

    [STATUS.RECEIVED]: "received",

    [STATUS.CANCELLED]: "cancelled",

  };



  return map[value] || String(value || "").toLowerCase().replaceAll(" ", "_");

}



export function normalizePurchaseItem(item) {

  const variantUnit = item.product_variant_unit || item.productVariantUnit || {};

  const variant = variantUnit.product_variant || variantUnit.productVariant || item.product_variant || {};

  const unit = variantUnit.unit || item.unit || {};

  const product = variant.product || item.product || {};
  const variantPackageUnit = variant.package_type || variant.packageType || item.package_type || item.packageType || "";

  const unitCostUsd = Number(item.unit_cost_usd ?? item.unitCostUsd ?? item.unitCost ?? 0);

  const unitCostKhr = Number(item.unit_cost_khr ?? item.unitCostKhr ?? 0);

  const lineTotalUsd = Number(item.line_total_usd ?? item.lineTotalUsd ?? item.lineTotal ?? 0);

  const lineTotalKhr = Number(item.line_total_khr ?? item.lineTotalKhr ?? 0);

  const inputCurrency = normalizeCurrency(item.input_currency || item.inputCurrency || "USD");



  return {

    id: item.id,

    productVariantId:
      item.product_variant_id ||
      item.productVariantId ||
      variant.id ||
      variantUnit.product_variant_id ||
      variantUnit.productVariantId ||
      "",

    variantUnitId:

      item.product_variant_unit_id ||

      item.productVariantUnitId ||

      item.variantUnitId ||

      variantUnit.id ||

      "",

    productName: item.product_name || item.productName || product.name || "-",

    variantName:

      item.variant_name ||

      item.variantName ||

      variant.variant_name ||

      variant.variantName ||

      "-",

    variantCode: item.variant_code || item.variantCode || variant.variant_code || variant.variantCode || "",

    unitName: item.unit_name || item.unitName || unit.unit_name || unit.unitName || "-",

    baseUnit: variantPackageUnit || item.base_unit || item.baseUnit || unit.base_unit || unit.baseUnit || unit.unit_code || unit.unitCode || "-",

    conversionQty: Number(item.conversion_qty || item.conversionQty || variantUnit.conversion_qty || variantUnit.conversionQty || 1),

    invoicedQty: Number(item.invoiced_qty ?? item.invoicedQty ?? 0),

    paidQty: Number(item.paid_qty ?? item.paidQty ?? item.invoiced_qty ?? 0),

    receivedQty: Number(item.received_qty ?? item.receivedQty ?? 0),

    acceptedQty: Number(item.accepted_qty ?? item.acceptedQty ?? 0),

    stockedInQty: Number(item.stocked_in_qty ?? item.stockedInQty ?? 0),

    remainingStockInQty: Number(item.remaining_stock_in_qty ?? item.remainingStockInQty ?? 0),

    acceptedBaseQty: Number(item.accepted_base_qty ?? item.acceptedBaseQty ?? 0),

    stockedInBaseQty: Number(item.stocked_in_base_qty ?? item.stockedInBaseQty ?? 0),

    damagedQty: Number(item.damaged_qty ?? item.damagedQty ?? 0),

    claimQty: Number(item.claim_qty ?? item.claimQty ?? 0),

    inputCurrency,

    inputUnitCost: Number(item.input_unit_cost ?? item.inputUnitCost ?? item.unit_cost_usd ?? item.unitCost ?? 0),

    unitCost: unitCostUsd,

    unitCostUsd,

    unitCostKhr,

    unitCostBase: Number(item.unit_cost_base ?? item.unitCostBase ?? 0),

    lineTotal: lineTotalUsd,

    lineTotalUsd,

    lineTotalKhr,

    expiredDate: item.expired_date || item.expiry_date || item.expiredDate || item.expiryDate || "",

  };

}



export function normalizePurchase(item) {

  const items = Array.isArray(item.items)

    ? item.items.map(normalizePurchaseItem)

    : Array.isArray(item.purchase_items)

      ? item.purchase_items.map(normalizePurchaseItem)

      : [];
  const summaryItems = Array.isArray(item.items_summary)
    ? item.items_summary.map(normalizePurchaseItem)
    : Array.isArray(item.itemsSummary)
      ? item.itemsSummary.map(normalizePurchaseItem)
      : Array.isArray(item.product_summary_items)
        ? item.product_summary_items.map(normalizePurchaseItem)
        : [];

  const subtotalUsd = Number(item.subtotal_usd ?? item.subtotalUsd ?? item.subtotal ?? 0);

  const subtotalKhr = Number(item.subtotal_khr ?? item.subtotalKhr ?? 0);

  const grandTotalUsd = Number(item.grand_total_usd ?? item.grandTotalUsd ?? item.grandTotal ?? 0);

  const grandTotalKhr = Number(item.grand_total_khr ?? item.grandTotalKhr ?? 0);

  const paidAmountUsd = Number(item.paid_amount_usd ?? item.paidAmountUsd ?? item.paidAmount ?? 0);

  const paidAmountKhr = Number(item.paid_amount_khr ?? item.paidAmountKhr ?? 0);

  const balanceAmountUsd = Number(item.balance_amount_usd ?? item.balanceAmountUsd ?? item.balanceAmount ?? 0);

  const balanceAmountKhr = Number(item.balance_amount_khr ?? item.balanceAmountKhr ?? 0);



  return {

    id: item.id,

    purchaseNo: item.purchase_no || item.purchaseNo || "",

    supplierId: item.supplier_id || item.supplierId || "",

    supplierName: item.supplier_name || item.supplierName || item.supplier?.name || "-",

    createdBy: item.created_by || item.createdBy || "Admin",

    purchaseDate: item.purchase_date || item.purchaseDate || "",

    paymentMode: item.payment_mode || item.paymentMode || "pay_after_check",

    paymentStatus: item.payment_status || item.paymentStatus || "unpaid",

    inputCurrency: normalizeCurrency(item.input_currency || item.inputCurrency || "USD"),

    exchangeRateUsed: Number(item.exchange_rate_used ?? item.exchangeRateUsed ?? 0),

    khrRounding: item.khr_rounding || item.khrRounding || "floor",

    exchangeRateSource: item.exchange_rate_source || item.exchangeRateSource || "manual",

    exchangeRateNote: item.exchange_rate_note || item.exchangeRateNote || "",

    subtotal: subtotalUsd,

    subtotalUsd,

    subtotalKhr,

    discountTotal: Number(item.discount_amount_input ?? item.discount_total_usd ?? item.discountTotal ?? 0),

    discountCurrency: normalizeCurrency(item.discount_currency || item.discountCurrency || "USD"),

    discountTotalUsd: Number(item.discount_total_usd ?? item.discountTotalUsd ?? item.discountTotal ?? 0),

    discountTotalKhr: Number(item.discount_total_khr ?? item.discountTotalKhr ?? 0),

    deliveryOption: normalizeDeliveryOption(item.delivery_option || item.deliveryOption || "none"),

    deliveryFee: Number(item.delivery_fee_input ?? item.delivery_fee_usd ?? item.deliveryFee ?? 0),

    deliveryFeeUsd: Number(item.delivery_fee_usd ?? item.deliveryFeeUsd ?? item.deliveryFee ?? 0),

    deliveryFeeKhr: Number(item.delivery_fee_khr ?? item.deliveryFeeKhr ?? 0),

    deliveryFeeCurrency: normalizeCurrency(item.delivery_fee_currency || item.deliveryFeeCurrency || "USD"),

    deliveryPaidBy: normalizeDeliveryPaidBy(item.delivery_paid_by || item.deliveryPaidBy || "buyer"),

    grandTotal: grandTotalUsd,

    grandTotalUsd,

    grandTotalKhr,

    paidAmount: Number(item.paid_amount_input ?? item.paidAmountInput ?? paidAmountUsd),

    paidCurrency: normalizeCurrency(item.paid_currency || item.paidCurrency || "USD"),

    paidAmountUsd,

    paidAmountKhr,

    balanceAmount: balanceAmountUsd,

    balanceAmountUsd,

    balanceAmountKhr,

    note: item.note || "",

    status: normalizePurchaseStatus(item.status),

    createdAt: item.created_at || item.createdAt || "",

    updatedAt: item.updated_at || item.updatedAt || "",

    itemsCount: Number(item.items_count || item.itemsCount || item.purchase_lines_count || item.purchaseLinesCount || items.length || summaryItems.length || 0),
    productsCount: Number(item.products_count || item.productsCount || 0),
    purchaseLinesCount: Number(item.purchase_lines_count || item.purchaseLinesCount || item.items_count || item.itemsCount || items.length || summaryItems.length || 0),
    productSummary: item.product_summary || item.productSummary || "",
    summaryItems,

    items,

    returns: Array.isArray(item.purchase_returns) ? item.purchase_returns : item.returns || [],

    raw: item,

  };

}


