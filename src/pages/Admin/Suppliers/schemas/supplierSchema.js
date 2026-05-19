import { z } from "zod";

export const supplierSchema = z.object({
  supplierCode: z.string().optional(),

  name: z.string().min(1, "Supplier name is required."),

  contactPerson: z.string().optional(),

  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[0-9+\-\s()]{6,20}$/.test(value),
      "Please enter a valid phone number."
    ),

  email: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Please enter a valid email address."
    ),

  address: z.string().optional(),

  note: z.string().optional(),

  status: z.enum(["Active", "Inactive"]),
});

export const defaultSupplierValues = {
  supplierCode: "",
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  note: "",
  status: "Active",
};