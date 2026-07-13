import { z } from "zod";

export const profileSchema = z.object({
  name:  z.string().trim().min(1, "ឈ្មោះមិនអាចទទេបាន។"),
  email: z.string().trim().email("អ៊ីម៉ែលមិនត្រឹមត្រូវ។").or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});
