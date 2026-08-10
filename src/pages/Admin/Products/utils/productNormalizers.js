export function isActiveStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();

  return (
    value === 1 ||
    value === "1" ||
    value === true ||
    status === "active"
  );
}

export function normalizeStatus(value) {
  const status = String(value ?? "").toLowerCase();

  if (status === "active" || status === "1" || value === 1 || value === true) {
    return "active";
  }

  return "inactive";
}

export function getSingleProductFromResponse(response) {
  return response?.data?.data || response?.data || response || null;
}

export function normalizeProduct(product, categories = []) {
  const category = categories.find(
    (item) => Number(item.id) === Number(product.category_id ?? product.categoryId)
  );

  const variantsCount = Number(
    product.variants_count ??
      product.variantsCount ??
      product.variants?.length ??
      0
  );

  const priceRulesCount = Number(
    product.price_rules_count ??
      product.priceRulesCount ??
      0
  );

  const minPrice =
    product.min_price_usd ??
    product.minPriceUsd ??
    product.minPrice ??
    null;

  const maxPrice =
    product.max_price_usd ??
    product.maxPriceUsd ??
    product.maxPrice ??
    null;

  return {
    ...product,

    id: product.id,
    name: product.name || "",

    category_id: product.category_id ?? product.categoryId ?? null,
    categoryId: product.categoryId ?? product.category_id ?? null,

    category_name:
      product.category_name ||
      product.categoryName ||
      product.category?.name ||
      category?.name ||
      "-",

    categoryName:
      product.categoryName ||
      product.category_name ||
      product.category?.name ||
      category?.name ||
      "-",

    images: product.images || null,
    imagePath: product.imagePath || product.images || null,

    description: product.description || "",

    status: normalizeStatus(product.status),

    variants_count: variantsCount,
    variantsCount,

    units_text: product.units_text ?? product.unitsText ?? "",
    unitsText: product.unitsText ?? product.units_text ?? "",

    price_rules_count: priceRulesCount,
    priceRulesCount,

    min_price_usd: minPrice !== null ? Number(minPrice) : null,
    minPriceUsd: minPrice !== null ? Number(minPrice) : null,

    max_price_usd: maxPrice !== null ? Number(maxPrice) : null,
    maxPriceUsd: maxPrice !== null ? Number(maxPrice) : null,

    variants: Array.isArray(product.variants)
      ? product.variants.map(normalizeVariant)
      : [],
  };
}

export function normalizeVariant(variant) {
  return {
    ...variant,

    id: variant.id,

    product_id: variant.product_id ?? variant.productId ?? null,
    productId: variant.productId ?? variant.product_id ?? null,

    variant_code: variant.variant_code ?? variant.variantCode ?? "",
    variantCode: variant.variantCode ?? variant.variant_code ?? "",

    variant_name: variant.variant_name ?? variant.variantName ?? "",
    variantName: variant.variantName ?? variant.variant_name ?? "",

    package_type: variant.package_type ?? variant.packageType ?? "",
    packageType: variant.packageType ?? variant.package_type ?? "",

    color: variant.color ?? "",

    size_value: variant.size_value ?? variant.sizeValue ?? "",
    sizeValue: variant.sizeValue ?? variant.size_value ?? "",

    size_unit: variant.size_unit ?? variant.sizeUnit ?? "",
    sizeUnit: variant.sizeUnit ?? variant.size_unit ?? "",

    images: variant.images || null,
    imagePath: variant.imagePath || variant.images || null,

    low_stock_threshold:
      variant.low_stock_threshold ?? variant.lowStockThreshold ?? 0,
    lowStockThreshold:
      variant.lowStockThreshold ?? variant.low_stock_threshold ?? 0,

    status: normalizeStatus(variant.status),

    units: Array.isArray(variant.units)
      ? variant.units.map(normalizeVariantUnit)
      : [],

    priceRules: Array.isArray(variant.priceRules)
      ? variant.priceRules.map(normalizePriceRule)
      : Array.isArray(variant.price_rules)
        ? variant.price_rules.map(normalizePriceRule)
        : [],
  };
}

export function normalizeVariantUnit(unit) {
  return {
    ...unit,

    id: unit.id,

    product_variant_unit_id:
      unit.product_variant_unit_id ?? unit.productVariantUnitId ?? unit.id,

    productVariantUnitId:
      unit.productVariantUnitId ?? unit.product_variant_unit_id ?? unit.id,

    product_variant_id: unit.product_variant_id ?? unit.productVariantId ?? null,
    productVariantId: unit.productVariantId ?? unit.product_variant_id ?? null,

    unit_id: unit.unit_id ?? unit.unitId ?? null,
    unitId: unit.unitId ?? unit.unit_id ?? null,

    unitName: unit.unitName ?? unit.unit_name ?? unit.unit?.unit_name ?? "-",
    unitCode: unit.unitCode ?? unit.unit_code ?? unit.unit?.unit_code ?? "",

    conversion_qty: unit.conversion_qty ?? unit.conversionQty ?? 1,
    conversionQty: Number(unit.conversionQty ?? unit.conversion_qty ?? 1),

    is_base_unit: Boolean(unit.is_base_unit ?? unit.isBaseUnit ?? false),
    isBaseUnit: Boolean(unit.isBaseUnit ?? unit.is_base_unit ?? false),

    is_default_sale_unit: Boolean(
      unit.is_default_sale_unit ?? unit.isDefaultSaleUnit ?? false
    ),
    isDefaultSaleUnit: Boolean(
      unit.isDefaultSaleUnit ?? unit.is_default_sale_unit ?? false
    ),

    is_default_purchase_unit: Boolean(
      unit.is_default_purchase_unit ?? unit.isDefaultPurchaseUnit ?? false
    ),
    isDefaultPurchaseUnit: Boolean(
      unit.isDefaultPurchaseUnit ?? unit.is_default_purchase_unit ?? false
    ),

    // product_variant_units.status is a DB boolean (true/false), unlike variant/price-rule
    // status which are string enums ("active"/"inactive") — normalize here too so every
    // consumer can compare against "active" the same way, regardless of the underlying column
    // type. Passing the raw boolean straight through made "អសកម្ម" (inactive) show for every
    // unit, since `true !== "active"` is always true.
    status: normalizeStatus(unit.status),

    barcode: unit.barcode ?? "",
  };
}

export function normalizePriceRule(rule) {
  return {
    ...rule,

    id: rule.id,

    product_variant_unit_id:
      rule.product_variant_unit_id ?? rule.productVariantUnitId ?? null,
    productVariantUnitId:
      rule.productVariantUnitId ?? rule.product_variant_unit_id ?? null,

    applies_to: rule.applies_to ?? rule.appliesTo ?? "",
    appliesTo: rule.appliesTo ?? rule.applies_to ?? "",

    min_qty: rule.min_qty ?? rule.minQty ?? 1,
    minQty: Number(rule.minQty ?? rule.min_qty ?? 1),

    unit_price_usd: rule.unit_price_usd ?? rule.usd ?? 0,
    usd: Number(rule.usd ?? rule.unit_price_usd ?? 0),

    unit_price_khr: rule.unit_price_khr ?? rule.khr ?? 0,
    khr: Number(rule.khr ?? rule.unit_price_khr ?? 0),

    input_currency: rule.input_currency ?? rule.inputCurrency ?? "USD",
    inputCurrency: rule.inputCurrency ?? rule.input_currency ?? "USD",

    input_price: rule.input_price ?? rule.inputPrice ?? 0,
    inputPrice: Number(rule.inputPrice ?? rule.input_price ?? 0),

    exchange_rate_used:
      rule.exchange_rate_used ?? rule.exchangeRateUsed ?? null,
    exchangeRateUsed:
      rule.exchangeRateUsed ?? rule.exchange_rate_used ?? null,

    unitName: rule.unitName ?? rule.unit_name ?? "-",

    status: rule.status,
  };
}
