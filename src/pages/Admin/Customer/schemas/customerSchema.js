import { z } from "zod";

export const customerSchema = z.object({
  customerCode: z.string().optional(),

  shopName: z
    .string()
    .min(1, "សូមបញ្ចូលឈ្មោះហាង។"),

  contactName: z.string().min(1, "សូមបញ្ចូលឈ្មោះអ្នកទំនាក់ទំនង។"),

  phone: z
    .string()
    .min(1, "លេខទូរស័ព្ទចាំបាច់ត្រូវតែបំពេញ។")
    .regex(/^[0-9+\-\s()/,]{6,40}$/, "សូមបញ្ចូលលេខទូរស័ព្ទឲត្រឹមត្រូវ។"),

  address: z.string().optional(),

  note: z.string().optional(),

  status: z.enum(["Active", "Inactive"], { message: "ស្ថានភាព មិនត្រឹមត្រូវ។" }),
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
