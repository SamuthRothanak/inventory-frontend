import { useQuery } from "@tanstack/react-query";
import { getActiveExchangeRateApi } from "../../services/exchangeRate.service";
import { getCustomersApi } from "../../services/customer.service";
import { getProductsApi } from "../../services/product.service";
import { getCategoriesApi } from "../../services/category.service";
import { getProductVariantsApi } from "../../services/productVariant.service";
import { getProductVariantUnitsApi } from "../../services/productVariantUnit.service";
import { getPriceRulesApi } from "../../services/priceRule.service";
import { getStockBalancesApi } from "../../services/inventory.service";

function extractArray(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function groupById(arr, key) {
  const map = {};
  for (const item of arr) {
    const k = item[key];
    if (k != null) {
      if (!map[k]) map[k] = [];
      map[k].push(item);
    }
  }
  return map;
}

function assemblePosProducts(products, categories, variants, pvus, priceRules, stockBalances) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const productMap  = new Map(products.map((p) => [p.id, p]));
  const pvusByVariant   = groupById(pvus,        "product_variant_id");
  const priceRulesByPvu = groupById(priceRules,  "product_variant_unit_id");

  const basePvuIds = new Set(pvus.filter((p) => p.is_base_unit).map((p) => p.id));

  // Build stock lookup per variant — prefer the base-unit balance record
  const stockByVariant = {};
  for (const sb of stockBalances) {
    const vid = sb.product_variant_id;
    if (!vid) continue;
    const pvuId  = sb.product_variant_unit_id;
    const isBase = pvuId ? basePvuIds.has(pvuId) : true;
    if (isBase || stockByVariant[vid] == null) {
      stockByVariant[vid] = Number(sb.qty_available) || 0;
    }
  }

  return variants
    .filter((v) => v.status)
    .map((variant) => {
      const productId = variant.product?.id;
      const product   = productId ? productMap.get(productId) : null;
      const categoryName =
        product?.category_name ||
        product?.categoryName  ||
        categoryMap.get(product?.category_id) ||
        categoryMap.get(product?.categoryId)  ||
        "Other";

      const pvuList = (pvusByVariant[variant.id] || []).filter((p) => p.status);

      const units = pvuList
        .map((pvu) => {
          const unitName = pvu.unit?.unit_name || pvu.unit?.name || "";
          const rules = (priceRulesByPvu[pvu.id] || [])
            .filter((r) => r.status === "active")
            .map((r) => ({
              id: r.id,
              appliesTo:
                r.applies_to === "retail"     ? "public"
                : r.applies_to === "wholesale" ? "customer"
                : "both",
              minQty: Number(r.min_qty) || 1,
              usd:    Number(r.unit_price_usd) || 0,
              khr:    Number(r.unit_price_khr) || 0,
              label: `${
                r.applies_to === "retail"     ? "ទូទៅ"
                : r.applies_to === "wholesale" ? "អតិថិជន"
                : "ទាំងអស់"
              } · ${unitName}`,
            }));
          return { id: pvu.id, name: unitName, conversionQty: Number(pvu.conversion_qty) || 1, priceRules: rules };
        })
        .filter((u) => u.priceRules.length > 0);

      if (!units.length) return null;

      return {
        id:                variant.id,
        category:          categoryName,
        productName:       product?.name || "",
        variantName:       variant.variant_name || "",
        code:              variant.variant_code || "",
        image:             variant.images || product?.images || null,
        stockBaseQty:      stockByVariant[variant.id] ?? 0,
        lowStockThreshold: Number(variant.low_stock_threshold || 0),
        units,
      };
    })
    .filter(Boolean);
}

export function usePosData() {
  const exchangeRateQuery = useQuery({
    queryKey: ["pos", "exchange-rate"],
    queryFn: getActiveExchangeRateApi,
    staleTime: 5 * 60 * 1000,
  });

  const customersQuery = useQuery({
    queryKey: ["pos", "customers"],
    queryFn: () => getCustomersApi({ per_page: 9999 }),
    staleTime: 2 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ["pos", "products"],
    queryFn: () => getProductsApi({ per_page: 9999 }),
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["pos", "categories"],
    queryFn: () => getCategoriesApi({ per_page: 9999 }),
    staleTime: 10 * 60 * 1000,
  });

  const variantsQuery = useQuery({
    queryKey: ["pos", "product-variants"],
    queryFn: () => getProductVariantsApi({ per_page: 9999 }),
    staleTime: 5 * 60 * 1000,
  });

  const pvusQuery = useQuery({
    queryKey: ["pos", "product-variant-units"],
    queryFn: () => getProductVariantUnitsApi({ per_page: 9999 }),
    staleTime: 5 * 60 * 1000,
  });

  const priceRulesQuery = useQuery({
    queryKey: ["pos", "price-rules"],
    queryFn: () => getPriceRulesApi({ per_page: 9999, status: "active" }),
    staleTime: 5 * 60 * 1000,
  });

  const stockQuery = useQuery({
    queryKey: ["pos", "stock-balances"],
    queryFn: () => getStockBalancesApi({ per_page: 9999 }),
    staleTime: 60 * 1000,
  });

  // Exchange rate
  const rateRaw = exchangeRateQuery.data;
  const rateInner = rateRaw?.data ?? rateRaw;
  const exchangeRate = Number(rateInner?.usd_to_khr_rate || 4100);
  const khrRounding = rateInner?.khr_rounding || "ceil";

  // Customers
  const rawCustomers = extractArray(customersQuery.data);
  const customers = rawCustomers.map((c) => ({
    id: String(c.id),
    code: c.code || `CUS-${String(c.id).padStart(3, "0")}`,
    shopName: c.shop_name || c.shopName || "",
    contactName: c.contact_name || c.contactName || "",
    phone: c.phone || "",
  }));

  // Assembled product cards
  const rawProducts = extractArray(productsQuery.data);
  const rawCategories = extractArray(categoriesQuery.data);
  const rawVariants = extractArray(variantsQuery.data);
  const rawPvus = extractArray(pvusQuery.data);
  const rawPriceRules = extractArray(priceRulesQuery.data);
  const rawStock = extractArray(stockQuery.data);

  const posProducts =
    rawVariants.length > 0 && rawPvus.length > 0
      ? assemblePosProducts(rawProducts, rawCategories, rawVariants, rawPvus, rawPriceRules, rawStock)
      : [];

  const uniqueCategories = [...new Set(posProducts.map((p) => p.category).filter(Boolean))];
  const categories = ["All", ...uniqueCategories];

  const isLoading = [
    exchangeRateQuery,
    customersQuery,
    variantsQuery,
    pvusQuery,
    priceRulesQuery,
  ].some((q) => q.isLoading);

  const isError = [exchangeRateQuery, variantsQuery, pvusQuery].some((q) => q.isError);

  return {
    exchangeRate,
    khrRounding,
    customers,
    categories,
    products: posProducts,
    isLoading,
    isError,
    refetchStock: stockQuery.refetch,
  };
}
