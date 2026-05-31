import { z } from "zod";

const priceRuleSchema = z.object({
  local_unit_key: z.string().min(1, "Unit reference is required."),
  applies_to: z.enum(["retail", "wholesale", "both"], {
    message: "Applies to must be retail, wholesale, or both.",
  }),
  min_qty: z.coerce.number().min(1, "Min qty must be at least 1."),
  unit_price_usd: z.coerce.number().min(0, "USD price cannot be negative."),
  unit_price_khr: z.coerce.number().min(0, "KHR price cannot be negative."),
  input_currency: z.enum(["USD", "KHR"]),
  input_price: z.coerce.number().min(0, "Input price cannot be negative."),
  status: z.enum(["active", "inactive"]),
});

const variantUnitSchema = z.object({
  local_key: z.string().min(1),
  unit_id: z.string().min(1, "Unit is required."),
  conversion_qty: z.coerce
    .number()
    .min(1, "Conversion qty must be greater than 0."),
  is_base_unit: z.boolean(),
  is_default_sale_unit: z.boolean(),
  is_default_purchase_unit: z.boolean(),
  status: z.boolean(),
});

const variantSchema = z.object({
  variant_code: z.string().min(1, "Variant code is required."),
  variant_name: z.string().min(1, "Variant name is required."),
  package_type: z.string().min(1, "Package type is required."),
  color: z.string().optional(),
  size_value: z.string().optional(),
  size_unit: z.string().optional(),
  low_stock_threshold: z.coerce
    .number()
    .min(0, "Low stock cannot be negative."),
  status: z.boolean(),
  imageFile: z.any().optional(),
  units: z
    .array(variantUnitSchema)
    .min(1, "Each variant must have at least one unit."),
  priceRules: z
    .array(priceRuleSchema)
    .min(1, "Each variant must have at least one price rule."),
});

export const productSetupSchema = z.object({
  product: z.object({
    name: z.string().min(1, "Product name is required."),
    category_id: z.string().min(1, "Category is required."),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"]),
    imageFile: z.any().optional(),
  }),
  variants: z.array(variantSchema).min(1, "Please add at least one variant."),
});

export const productSetupDefaultValues = {
  product: {
    name: "",
    category_id: "",
    description: "",
    status: "active",
    imageFile: null,
  },
  variants: [],
};