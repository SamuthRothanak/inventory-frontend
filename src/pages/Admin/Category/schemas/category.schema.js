import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  description: z.string().optional(),
  status: z.boolean(),
  image: z.any().optional(),
});