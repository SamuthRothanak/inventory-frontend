import { z } from "zod";

export const productVariantSchema = z.object({
  product_id: z.string().min(1, "សូមជ្រើសរើសផលិតផល ។"),
  variant_code: z.string().min(1, "សូមបំពេញលេខកូដ មុខទំនិញ ។"),
  variant_name: z.string().min(1, "សូមបំពេញឈ្មោះ មុខទំនិញ ។"),
  package_type: z.string().min(1, "សូមជ្រើសសណ្ឋានទំនិញ ។"),
  color: z.string().optional(),
  size_value: z.string().optional(),
  size_unit: z.string().optional(),
  low_stock_threshold: z.coerce
    .number()
    .min(0, "ចំនួន low stock មិនអាចអវិជ្ជមាន ។")
    .max(999999, "ចំនួន low stock ខ្ពស់ពេក ។"),
  status: z.boolean(),
  imageFile: z.any().optional(),
});

export const productVariantDefaultValues = {
  product_id: "",
  variant_code: "",
  variant_name: "",
  package_type: "",
  color: "",
  size_value: "",
  size_unit: "",
  low_stock_threshold: 0,
  status: true,
  imageFile: null,
};
