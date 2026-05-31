import { createProductApi } from "./product.service";
import { createProductVariantApi } from "./productVariant.service";
import { createProductVariantUnitApi } from "./productVariantUnit.service";
import { createPriceRuleApi } from "./priceRule.service";

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

// គណនា USD <-> KHR ពី active exchange rate + rounding mode
const roundKhr = (amount, mode = "ceil") => {
  const value = Number(amount || 0);
  if (value <= 0) return 0;
  switch (mode) {
    case "round":
      return Math.round(value / 100) * 100;
    case "floor":
      return Math.floor(value / 100) * 100;
    case "none":
      return Number(value.toFixed(2));
    default:
      return Math.ceil(value / 100) * 100;
  }
};

const computePrices = (inputCurrency, inputPrice, rate, mode = "ceil") => {
  const currency = String(inputCurrency || "USD").toUpperCase();
  const price = Number(inputPrice || 0);
  const r = Number(rate || 0);

  if (!r) {
    return { unit_price_usd: 0, unit_price_khr: 0 };
  }

  if (currency === "USD") {
    return {
      unit_price_usd: Number(price.toFixed(2)),
      unit_price_khr: roundKhr(price * r, mode),
    };
  }

  // KHR
  return {
    unit_price_khr: roundKhr(price, mode),
    unit_price_usd: Number((price / r).toFixed(2)),
  };
};

// payload.exchangeRate = active rate (usd_to_khr_rate) ដែលត្រូវ pass មកពី component
export const createProductSetupApi = async (payload) => {
  try {
    const activeRate = Number(payload.exchangeRate || 0);
    const khrRounding = payload.khrRounding || "ceil";

    const createdProductResponse = await createProductApi(payload.product);
    const createdProduct = getCreatedData(createdProductResponse);

    if (!createdProduct?.id) {
      throw new Error("Product was created but product id was not found.");
    }

    const productId = createdProduct.id;
    const createdVariants = [];

    for (const variant of payload.variants) {
      const createdVariantResponse = await createProductVariantApi({
        product_id: productId,
        variant_code: variant.variant_code,
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

        const rulesForThisUnit = variant.priceRules.filter(
          (rule) => rule.local_unit_key === unit.local_key
        );

        const createdRules = [];

        for (const rule of rulesForThisUnit) {
          // ផ្ញើតែ input — backend គណនា unit_price_usd/khr + exchange_rate_used + rounding
          // (ដូច Edit path; កុំឱ្យ frontend calc ខុសពី backend)
          const createdRuleResponse = await createPriceRuleApi({
            product_variant_unit_id: productVariantUnitId,
            applies_to: rule.applies_to,
            min_qty: rule.min_qty,
            input_currency: rule.input_currency,
            input_price: rule.input_price,
            status: rule.status,
          });

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
    throw new Error(getErrorMessage(error));
  }
};