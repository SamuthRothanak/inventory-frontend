import { z } from "zod";

export const userSchema = z
  .object({
    id: z.number().nullable().optional(),
    isEdit: z.boolean().default(false),
    name: z.string().min(1, "សូមបញ្ចូលឈ្មោះពេញ ។"),
    username: z.string().min(1, "សូមបញ្ចូលឈ្មោះអ្នកប្រើ ។"),
    email: z.string().email("សូមបញ្ចូលអ៊ីម៉ែលឲត្រឹមត្រូវ ។"),
    phone: z
      .string()
      .optional()
      .refine(
        (value) => !value || /^[0-9+\-\s()/,]{6,40}$/.test(value),
        "សូមបញ្ចូលលេខទូរស័ព្ទឲត្រឹមត្រូវ ។"
      ),
    role: z.enum(["admin", "cashier", "staff"], { message: "សូមជ្រើសតួនាទី ។" }),
    status: z.enum(["active", "inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ ។" }).default("active"),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isEdit) {
      if (!data.password || data.password.length < 6) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "លេខសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួអក្សរ ។",
        });
      }
      if (data.password !== data.password_confirmation) {
        ctx.addIssue({
          code: "custom",
          path: ["password_confirmation"],
          message: "លេខសម្ងាត់មិនត្រូវគ្នា ។",
        });
      }
    } else {
      if (data.password && data.password.length < 6) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "លេខសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួអក្សរ ។",
        });
      }
      if (data.password && data.password !== data.password_confirmation) {
        ctx.addIssue({
          code: "custom",
          path: ["password_confirmation"],
          message: "លេខសម្ងាត់មិនត្រូវគ្នា ។",
        });
      }
    }
  });

export const defaultValues = {
  id: null,
  isEdit: false,
  name: "",
  username: "",
  email: "",
  phone: "",
  role: "staff",
  status: "active",
  password: "",
  password_confirmation: "",
};
