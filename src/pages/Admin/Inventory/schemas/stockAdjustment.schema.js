import { z } from "zod";

export const stockAdjustmentFormSchema = z.object({
  inventoryId: z.union([
    z.string().trim().min(1, "Please select inventory item."),
    z.coerce.number().positive("Please select inventory item."),
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
  qty: z.coerce.number().positive("Quantity must be greater than 0."),
  unitName: z.string().trim().min(1, "Please select unit."),
  inventoryBatchId: z.union([z.string(), z.number()]).optional(),
  note: z.string().optional(),
});
