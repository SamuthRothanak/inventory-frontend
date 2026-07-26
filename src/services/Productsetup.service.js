import api from "../lib/axios";
import { createProductApi, deleteProductApi } from "./product.service";
import {
  createProductVariantApi,
  deleteProductVariantApi,
} from "./productVariant.service";
import {
  createProductVariantUnitApi,
  deleteProductVariantUnitApi,
} from "./productVariantUnit.service";
import { createPriceRuleApi, deletePriceRuleApi } from "./priceRule.service";

const getCreatedData = (response) => {
  if (response?.data?.id) return response.data;
  if (response?.data?.data?.id) return response.data.data;
  if (response?.id) return response;
  return null;
};

const getErrorMessage = (error) => {
  const response = error?.response?.data;

  if (response?.message && response?.errors) {
    const firstError = Object.values(response.errors)?.[0]?.[0];
    return firstError || response.message;
  }

  if (response?.message) return response.message;

  return error?.message || "Something went wrong.";
};

const makeSetupVariantCode = (code, productId, variantIndex) => {
  const baseCode = String(code || `PV-${productId}-${variantIndex + 1}`)
    .trim()
    .replace(/-P\d+$/i, "");

  return `${baseCode}-P${productId}`;
};

const hasFileUpload = (payload) => {
  if (typeof File === "undefined") return false;
  if (payload?.product?.imageFile instanceof File) return true;

  return (payload?.variants || []).some(
    (variant) => variant.imageFile instanceof File
  );
};

const hasPriceRules = (payload) =>
  (payload?.variants || []).some((variant) => (variant.priceRules || []).length > 0);

const buildSetupPayload = (payload) => ({
  product: {
    name: payload.product?.name,
    category_id: payload.product?.category_id,
    description: payload.product?.description || "",
    status: payload.product?.status || "active",
  },
  variants: (payload.variants || []).map((variant) => ({
    variant_code: variant.variant_code,
    variant_name: variant.variant_name,
    package_type: variant.package_type,
    color: variant.color || "",
    size_value: variant.size_value || "",
    size_unit: variant.size_unit || "",
    low_stock_threshold: Number(variant.low_stock_threshold || 0),
    status: Boolean(variant.status),
    units: (variant.units || []).map((unit) => ({
      local_key: unit.local_key,
      unit_id: Number(unit.unit_id),
      conversion_qty: Number(unit.conversion_qty || 1),
      is_base_unit: Boolean(unit.is_base_unit),
      is_default_sale_unit: Boolean(unit.is_default_sale_unit),
      is_default_purchase_unit: Boolean(unit.is_default_purchase_unit),
      status: Boolean(unit.status),
    })),
    priceRules: (variant.priceRules || []).map((rule) => ({
      local_unit_key: rule.local_unit_key,
      applies_to: rule.applies_to,
      min_qty: Number(rule.min_qty || 1),
      input_currency: (rule.input_currency || "USD").toUpperCase(),
      input_price: Number(rule.input_price || 0),
      unit_price_usd: Number(rule.unit_price_usd || 0),
      unit_price_khr: Number(rule.unit_price_khr || 0),
      exchange_rate_used: Number(payload.exchangeRate || 0),
      status: rule.status || "active",
    })),
  })),
});

const cleanupCreatedSetup = async ({ priceRuleIds, variantUnitIds, variantIds, productId }) => {
  for (const id of [...priceRuleIds].reverse()) {
    try {
      await deletePriceRuleApi(id);
    } catch (error) {
      console.warn("Cleanup price rule failed:", id, error);
    }
  }

  for (const id of [...variantUnitIds].reverse()) {
    try {
      await deleteProductVariantUnitApi(id);
    } catch (error) {
      console.warn("Cleanup variant unit failed:", id, error);
    }
  }

  for (const id of [...variantIds].reverse()) {
    try {
      await deleteProductVariantApi(id);
    } catch (error) {
      console.warn("Cleanup variant failed:", id, error);
    }
  }

  if (productId) {
    try {
      await deleteProductApi(productId);
    } catch (error) {
      console.warn("Cleanup product failed:", productId, error);
    }
  }
};

const createProductSetupLegacyApi = async (payload) => {
  const createdIds = {
    productId: null,
    variantIds: [],
    variantUnitIds: [],
    priceRuleIds: [],
  };

  try {
    const exchangeRateUsed = Number(payload.exchangeRate || 0);

    if (hasPriceRules(payload) && !exchangeRateUsed) {
      throw new Error(
        "No active exchange rate found. Please create and activate an exchange rate before saving product prices."
      );
    }

    const createdProductResponse = await createProductApi(payload.product);
    const createdProduct = getCreatedData(createdProductResponse);

    if (!createdProduct?.id) {
      throw new Error("Product was created but product id was not found.");
    }

    const productId = createdProduct.id;
    createdIds.productId = productId;
    const createdVariants = [];

    for (const [variantIndex, variant] of payload.variants.entries()) {
      const createdVariantResponse = await createProductVariantApi({
        product_id: productId,
        variant_code: makeSetupVariantCode(
          variant.variant_code,
          productId,
          variantIndex
        ),
        variant_name: variant.variant_name,
        package_type: variant.package_type,
        color: variant.color || "",
        size_value: variant.size_value || "",
        size_unit: variant.size_unit || "",
        low_stock_threshold: variant.low_stock_threshold || 0,
        status: variant.status,
        imageFile: variant.imageFile,
      });

      const createdVariant = getCreatedData(createdVariantResponse);

      if (!createdVariant?.id) {
        throw new Error(
          `Variant "${variant.variant_name}" was created but variant id was not found.`
        );
      }

      const variantId = createdVariant.id;
      createdIds.variantIds.push(variantId);
      const createdVariantUnits = [];

      for (const unit of variant.units) {
        const createdVariantUnitResponse = await createProductVariantUnitApi({
          product_variant_id: variantId,
          unit_id: unit.unit_id,
          conversion_qty: unit.conversion_qty,
          is_base_unit: unit.is_base_unit,
          is_default_sale_unit: unit.is_default_sale_unit,
          is_default_purchase_unit: unit.is_default_purchase_unit,
          status: unit.status,
        });

        const createdVariantUnit = getCreatedData(createdVariantUnitResponse);

        if (!createdVariantUnit?.id) {
          throw new Error(
            `Unit for variant "${variant.variant_name}" was created but product_variant_unit id was not found.`
          );
        }

        const productVariantUnitId = createdVariantUnit.id;
        createdIds.variantUnitIds.push(productVariantUnitId);
        const rulesForThisUnit = variant.priceRules.filter(
          (rule) => rule.local_unit_key === unit.local_key
        );

        const createdRules = [];

        for (const rule of rulesForThisUnit) {
          const createdRuleResponse = await createPriceRuleApi({
            product_variant_unit_id: productVariantUnitId,
            applies_to: rule.applies_to,
            min_qty: rule.min_qty,
            input_currency: rule.input_currency,
            input_price: rule.input_price,
            unit_price_usd: rule.unit_price_usd,
            unit_price_khr: rule.unit_price_khr,
            exchange_rate_used: exchangeRateUsed,
            status: rule.status,
          });

          const createdRule = getCreatedData(createdRuleResponse);
          if (createdRule?.id) {
            createdIds.priceRuleIds.push(createdRule.id);
          }

          createdRules.push(createdRuleResponse);
        }

        createdVariantUnits.push({
          unit: createdVariantUnitResponse,
          priceRules: createdRules,
        });
      }

      createdVariants.push({
        variant: createdVariantResponse,
        units: createdVariantUnits,
      });
    }

    return {
      product: createdProductResponse,
      variants: createdVariants,
    };
  } catch (error) {
    await cleanupCreatedSetup(createdIds);
    throw new Error(getErrorMessage(error));
  }
};

export const createProductSetupApi = async (payload) => {
  if (hasFileUpload(payload)) {
    return createProductSetupLegacyApi(payload);
  }

  try {
    const response = await api.post("/products/setup", buildSetupPayload(payload));
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
