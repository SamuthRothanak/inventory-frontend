import { z } from "zod";

export const productVariantUnitSchema = z.object({
  product_variant_id: z.string().min(1, "Variant is required."),
  unit_id: z.string().min(1, "Unit is required."),
  conversion_qty: z.coerce
    .number()
    .min(1, "Conversion qty must be greater than 0."),
  is_base_unit: z.boolean(),
  is_default_sale_unit: z.boolean(),
  is_default_purchase_unit: z.boolean(),
  status: z.boolean(),
});

export const productVariantUnitDefaultValues = {
  product_variant_id: "",
  unit_id: "",
  conversion_qty: 1,
  is_base_unit: true,
  is_default_sale_unit: true,
  is_default_purchase_unit: false,
  status: true,
};