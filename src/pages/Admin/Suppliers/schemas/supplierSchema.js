import { z } from "zod";

export const supplierSchema = z.object({
  supplierCode: z.string().optional(),

  name: z
    .string()
    .min(1, "ឈ្មោះអ្នកផ្គត់ផ្គង់ចាំបាច់ត្រូវតែបំពេញ ។"),

  contactPerson: z.string().min(1, "សូមបញ្ចូលឈ្មោះអ្នកទំនាក់ទំនង ។"),

  phone: z
    .string()
    .min(1, "លេខទូរស័ព្ទចាំបាច់ត្រូវតែបំពេញ ។")
    .regex(/^[0-9+\-\s()/,]{6,40}$/, "សូមបញ្ចូលលេខទូរស័ព្ទឲត្រឹមត្រូវ ។"),

  email: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "សូមបញ្ចូលអ៊ីម៉ែលឲត្រឹមត្រូវ ។"
    ),

  address: z.string().optional(),

  note: z.string().optional(),

  status: z.enum(["Active", "Inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ ។" }),
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
