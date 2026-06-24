import { z } from "zod";

export const productVariantUnitSchema = z.object({
  product_variant_id: z.string().min(1, "សូមបញ្ជាក់ មុខទំនិញ ។"),
  unit_id: z.string().min(1, "សូមជ្រើសខ្នាតទំនិញ ។"),
  conversion_qty: z.coerce
    .number()
    .min(1, "ចំនួនបម្លែង ត្រូវ ≥ 1 ។")
    .max(10000, "ចំនួនបម្លែង ខ្ពស់ពេក ។"),
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
