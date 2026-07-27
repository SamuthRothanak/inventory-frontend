import { z } from "zod";

export const productVariantUnitSchema = z.object({
  product_variant_id: z.string().min(1, "សូមបញ្ជាក់ មុខទំនិញ ។"),
  unit_id: z.string().min(1, "សូមជ្រើសខ្នាតទំនិញ ។"),
  conversion_qty: z.coerce
    .number()
    .min(1, "ចំនួនក្នុងមួយខ្នាត ត្រូវ ≥ 1 ។")
    .max(10000, "ចំនួនក្នុងមួយខ្នាត ខ្ពស់ពេក ។"),
  barcode: z.string().optional(),
  is_base_unit: z.boolean(),
  is_default_sale_unit: z.boolean(),
  is_default_purchase_unit: z.boolean(),
  status: z.boolean(),
});

export const productVariantUnitDefaultValues = {
  product_variant_id: "",
  unit_id: "",
  conversion_qty: 1,
  barcode: "",
  is_base_unit: true,
  is_default_sale_unit: true,
  is_default_purchase_unit: false,
  status: true,
};
