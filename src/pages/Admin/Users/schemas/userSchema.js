import { z } from "zod";

export const userSchema = z
  .object({
    id: z.number().nullable().optional(),
    isEdit: z.boolean().default(false),
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    role: z.enum(["admin", "cashier", "staff"]),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isEdit) {
      if (!data.password || data.password.length < 6) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "Password must be at least 6 characters",
        });
      }

      if (data.password !== data.password_confirmation) {
        ctx.addIssue({
          code: "custom",
          path: ["password_confirmation"],
          message: "Password confirmation does not match",
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
  password: "",
  password_confirmation: "",
};