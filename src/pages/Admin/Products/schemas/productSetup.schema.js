import { z } from "zod";

const priceRuleSchema = z.object({
  local_unit_key: z.string().min(1, "សូមបញ្ជាក់ ខ្នាតទំនិញ ។"),
  applies_to: z.enum(["retail", "wholesale", "both"], {
    message: "សូមជ្រើស ប្រើសម្រាប់ ។",
  }),
  min_qty: z.coerce.number().min(1, "លក់ចាប់ពីចំនួន ត្រូវ ≥ 1 ។"),
  unit_price_usd: z.coerce.number().min(0, "តម្លៃ USD មិនអាចអវិជ្ជមាន ។"),
  unit_price_khr: z.coerce.number().min(0, "តម្លៃ KHR មិនអាចអវិជ្ជមាន ។"),
  input_currency: z.enum(["USD", "KHR"], { message: "សូមជ្រើសរូបិយប័ណ្ណ ។" }),
  input_price: z.coerce.number().min(0.01, "សូមបំពេញតម្លៃ (> 0) ។"),
  status: z.enum(["active", "inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ ។" }),
});

const variantUnitSchema = z.object({
  local_key: z.string().min(1),
  unit_id: z.string().min(1, "សូមជ្រើសខ្នាតទំនិញ ។"),
  conversion_qty: z.coerce
    .number()
    .min(1, "ចំនួនក្នុងមួយខ្នាត ត្រូវ ≥ 1 ។")
    .max(10000, "ចំនួនក្នុងមួយខ្នាត ខ្ពស់ពេក ។"),
  is_base_unit: z.boolean(),
  is_default_sale_unit: z.boolean(),
  is_default_purchase_unit: z.boolean(),
  status: z.boolean(),
});

const variantSchema = z.object({
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
  units: z
    .array(variantUnitSchema)
    .min(1, "ត្រូវការខ្នាតទំនិញ យ៉ាងតិច ១ ។"),
  priceRules: z
    .array(priceRuleSchema)
    .min(1, "ត្រូវការតម្លៃ យ៉ាងតិច ១ ។"),
});

export const productSetupSchema = z.object({
  product: z.object({
    name: z.string().min(1, "សូមបញ្ចូលឈ្មោះផលិតផល ។"),
    category_id: z.string().min(1, "សូមជ្រើសរើសប្រភេទ ។"),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ ។" }),
    imageFile: z.any().optional(),
  }),
  variants: z.array(variantSchema).min(1, "សូមបន្ថែម មុខទំនិញ យ៉ាងតិច ១ ។"),
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
