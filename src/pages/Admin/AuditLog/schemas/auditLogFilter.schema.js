import { z } from "zod";

export const auditLogFilterSchema = z.object({
  search: z.string().optional(),
  module: z.string().default("all"),
  action: z.string().default("all"),
  perPage: z.number().int().positive().default(10),
});

