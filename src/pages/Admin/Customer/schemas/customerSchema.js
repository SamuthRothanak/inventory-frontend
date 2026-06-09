import { z } from "zod";

export const customerSchema = z.object({
  customerCode: z.string().optional(),

  shopName: z
    .string()
    .min(1, "Shop name is required.")
    .regex(/^[\p{L}\s]+$/u, "Shop name can contain letters and spaces only."),

  contactName: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[\p{L}\s]+$/u.test(value),
      "Contact name can contain letters and spaces only."
    ),

  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[0-9+\-\s()]{6,20}$/.test(value),
      "Please enter a valid phone number."
    ),

  address: z.string().optional(),

  note: z.string().optional(),

  status: z.enum(["Active", "Inactive"]),
});

export const defaultCustomerValues = {
  customerCode: "",
  shopName: "",
  contactName: "",
  phone: "",
  address: "",
  note: "",
  status: "Active",
};
