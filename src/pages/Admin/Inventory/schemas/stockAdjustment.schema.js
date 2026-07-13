import { z } from "zod";

export const stockAdjustmentFormSchema = z.object({
  inventoryId: z.union([
    z.string().trim().min(1, "សូមជ្រើសទំនិញស្តុក"),
    z.coerce.number().positive("សូមជ្រើសទំនិញស្តុក"),
  ]),
  adjustmentType: z.enum(["increase", "decrease"]),
  reason: z.enum([
    "damaged",
    "expired",
    "internal_use",
    "lost",
    "stock_count",
    "correction",
    "other",
  ]),
  qty: z.coerce.number().positive("ចំនួនត្រូវតែធំជាង 0"),
  unitName: z.string().trim().min(1, "សូមជ្រើសខ្នាត"),
  inventoryBatchId: z.union([z.string(), z.number()]).optional(),
  note: z.string().optional(),
});
