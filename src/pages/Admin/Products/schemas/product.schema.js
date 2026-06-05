import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  category_id: z.string().min(1, "Category is required."),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  imageFile: z.any().optional(),
});

export const productDefaultValues = {
  name: "",
  category_id: "",
  description: "",
  status: "active",
  imageFile: null,
};
