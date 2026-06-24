import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "សូមបញ្ចូលឈ្មោះផលិតផល ។"),
  category_id: z.string().min(1, "សូមជ្រើសរើសប្រភេទ ។"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ ។" }),
  imageFile: z.any().optional(),
});

export const productDefaultValues = {
  name: "",
  category_id: "",
  description: "",
  status: "active",
  imageFile: null,
};
