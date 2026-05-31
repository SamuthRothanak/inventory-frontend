export function extractApiData(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  // object តែមួយ (show endpoint) -> wrap ជា array
  if (response?.data && typeof response.data === "object" && response.data.id) {
    return [response.data];
  }
  return [];
}

export function normalizeProducts(items = [], categories = []) {
  return items.map((item) => {
    const category = categories.find(
      (categoryItem) => Number(categoryItem.id) === Number(item.category_id)
    );

    return {
      id: item.id,
      name: item.name || "Unnamed Product",
      categoryId: item.category_id,
      categoryName:
        item.category?.name ||
        category?.name ||
        (item.category_id ? `Category #${item.category_id}` : "-"),
      description: item.description || "",
      imagePath: item.images || "",
      // products table គ្មាន expiry_date -> តែងតែ "" (column expiry បានលុបចេញ)
      status:
        item.status === "active" || item.status === true || item.status === 1
          ? "Active"
          : "Inactive",
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      raw: item,
      variants: [],
    };
  });
}

export function normalizeVariants(items = []) {
  return items.map((item) => ({
    id: item.id,
    productId: item.product?.id || item.product_id,
    variantCode: item.variant_code || "",
    variantName: item.variant_name || "Unnamed Variant",
    packageType: item.package_type || "",
    color: item.color || "",
    sizeValue: item.size?.value || item.size_value || "",
    sizeUnit: item.size?.unit || item.size_unit || "",
    imagePath: item.images || "",
    lowStockThreshold: Number(item.low_stock_threshold || 0),
    status:
      item.status === true || item.status === 1 || item.status === "active"
        ? "Active"
        : "Inactive",
    units: [],
    priceRules: [],
  }));
}

export function normalizeVariantUnits(items = []) {
  return items.map((item) => ({
    id: item.id,
    productVariantId: item.product_variant_id || item.product_variant?.id,
    unitId: item.unit_id || item.unit?.id,
    unitName: item.unit?.unit_name || item.unit_name || `Unit #${item.unit_id}`,
    unitCode: item.unit?.unit_code || item.unit_code || "",
    conversionQty: Number(item.conversion_qty || 1),
    isBaseUnit: Boolean(item.is_base_unit),
    isDefaultSaleUnit: Boolean(item.is_default_sale_unit),
    isDefaultPurchaseUnit: Boolean(item.is_default_purchase_unit),
  }));
}

export function normalizePriceRules(items = []) {
  return items.map((item) => ({
    id: item.id,
    productVariantUnitId:
      item.product_variant_unit_id || item.product_variant_unit?.id,
    appliesTo: item.applies_to || "retail",
    minQty: Number(item.min_qty || 1),
    usd: Number(item.unit_price_usd || 0),
    khr: Number(item.unit_price_khr || 0),
    inputCurrency: item.input_currency || "USD",
    inputPrice: Number(item.input_price || 0),
    // capture rate snapshot ដែល backend គណនា (អាច null សម្រាប់ record ចាស់)
    exchangeRateUsed:
      item.exchange_rate_used !== null && item.exchange_rate_used !== undefined
        ? Number(item.exchange_rate_used)
        : null,
    status:
      item.status === "active" || item.status === true
        ? "Active"
        : "Inactive",
  }));
}

export function attachProductChildren({
  products = [],
  variants = [],
  variantUnits = [],
  priceRules = [],
}) {
  const variantUnitMap = new Map();

  variantUnits.forEach((unit) => {
    if (!variantUnitMap.has(unit.productVariantId)) {
      variantUnitMap.set(unit.productVariantId, []);
    }

    variantUnitMap.get(unit.productVariantId).push(unit);
  });

  const priceRuleMap = new Map();

  priceRules.forEach((rule) => {
    const variantUnit = variantUnits.find(
      (unit) => Number(unit.id) === Number(rule.productVariantUnitId)
    );

    if (!variantUnit) return;

    const variantId = variantUnit.productVariantId;

    if (!priceRuleMap.has(variantId)) {
      priceRuleMap.set(variantId, []);
    }

    priceRuleMap.get(variantId).push({
      ...rule,
      unitName: variantUnit.unitName,
    });
  });

  const variantsWithChildren = variants.map((variant) => ({
    ...variant,
    units: variantUnitMap.get(variant.id) || [],
    priceRules: priceRuleMap.get(variant.id) || [],
  }));

  return products.map((product) => ({
    ...product,
    variants: variantsWithChildren.filter(
      (variant) => Number(variant.productId) === Number(product.id)
    ),
  }));
}

export function getUnitsText(product) {
  const units = new Set();

  product.variants.forEach((variant) => {
    variant.units.forEach((unit) => units.add(unit.unitName));
  });

  const result = Array.from(units).filter(Boolean);
  return result.length ? result.join(", ") : "-";
}

export function getPriceRuleCount(product) {
  return product.variants.reduce(
    (total, variant) => total + variant.priceRules.length,
    0
  );
}

export function getPriceRange(product) {
  const prices = product.variants.flatMap((variant) =>
    variant.priceRules.map((rule) => Number(rule.usd || 0)).filter(Boolean)
  );

  if (!prices.length) return "No price";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return `$${min.toFixed(2)}`;

  return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
}