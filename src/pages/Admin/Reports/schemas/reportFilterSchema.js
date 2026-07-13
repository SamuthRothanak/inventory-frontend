import { z } from "zod";

export const reportFilterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reportType: z.enum(["all", "sales", "purchases", "inventory", "returns", "payments"]),
  search: z.string().optional(),
});
