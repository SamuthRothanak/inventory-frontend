import { z } from "zod";

export const priceRuleSchema = z.object({
  local_unit_key: z.string().min(1, "សូមបញ្ជាក់ ខ្នាតទំនិញ ។"),
  applies_to: z.enum(["retail", "wholesale", "both"], {
    message: "សូមជ្រើស ប្រើសម្រាប់ ។",
  }),
  min_qty: z.coerce.number().min(1, "ចំនួនយ៉ាងតិច ត្រូវ ≥ 1 ។"),
  unit_price_usd: z.coerce.number().min(0, "តម្លៃ USD មិនអាចអវិជ្ជមាន ។"),
  unit_price_khr: z.coerce.number().min(0, "តម្លៃ KHR មិនអាចអវិជ្ជមាន ។"),
  input_currency: z.enum(["USD", "KHR"], { message: "សូមជ្រើសរូបិយប័ណ្ណ ។" }),
  input_price: z.coerce.number().min(0.01, "សូមបំពេញតម្លៃ (> 0) ។"),
  status: z.enum(["active", "inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ ។" }),
});

export const standalonePriceRuleSchema = z.object({
  product_variant_unit_id: z.string().min(1, "ខ្នាតទំនិញ ត្រូវការ ។"),
  applies_to: z.enum(["retail", "wholesale", "both"], {
    message: "សូមជ្រើស ប្រើសម្រាប់ ។",
  }),
  min_qty: z.coerce.number().min(1, "ចំនួនយ៉ាងតិច ត្រូវ ≥ 1 ។"),
  input_currency: z.enum(["USD", "KHR"], { message: "សូមជ្រើសរូបិយប័ណ្ណ ។" }),
  input_price: z.coerce.number().min(0.01, "សូមបំពេញតម្លៃ (> 0) ។"),
  status: z.enum(["active", "inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ ។" }),
});

export const priceRuleDefaultValues = {
  product_variant_unit_id: "",
  applies_to: "retail",
  min_qty: 1,
  unit_price_usd: 0,
  unit_price_khr: 0,
  input_currency: "USD",
  input_price: 0,
  status: "active",
};
