import { z } from "zod";

export const productVariantSchema = z.object({
  product_id: z.string().min(1, "Product is required."),
  variant_code: z.string().min(1, "Variant code is required."),
  variant_name: z.string().min(1, "Variant name is required."),
  package_type: z.string().min(1, "Package type is required."),
  color: z.string().optional(),
  size_value: z.string().optional(),
  size_unit: z.string().optional(),
  low_stock_threshold: z.coerce
    .number()
    .min(0, "Low stock threshold cannot be negative."),
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