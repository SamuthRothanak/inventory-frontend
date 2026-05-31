import { z } from "zod";

export const priceRuleSchema = z.object({
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