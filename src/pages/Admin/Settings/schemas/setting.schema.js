import { z } from "zod";

export const settingDefaults = {
  shop: {
    shopName: "Hak Ly Mart",
    ownerName: "Admin",
    phone: "012345678",
    email: "admin@haklymart.com",
    address: "Phnom Penh, Cambodia",
    receiptFooter: "Thank you for shopping with us!",
  },

  sales: {
    defaultSaleType: "retail",
    allowWholesale: true,
    allowSplitPayment: true,
    allowSalesReturn: true,
    autoPrintReceipt: false,
    stockOutMethod: "fefo",
  },

  purchases: {
    defaultPaymentMode: "pay_after_check",
    allowPrepaid: true,
    allowPartialPrepaid: true,
    requireStockInConfirm: true,
    allowSupplierClaim: true,
  },

  inventory: {
    lowStockAlert: true,
    expiryAlert: true,
    expiryAlertDays: 30,
    allowNegativeStock: false,
    requireBatchForExpiryProduct: true,
    stockAdjustmentApproval: true,
  },
};

export const settingSchema = z.object({
  shop: z.object({
    shopName: z.string().trim().min(1, "Shop name is required."),
    ownerName: z.string().trim().min(1, "Owner name is required."),
    phone: z.string().trim().min(1, "Phone is required."),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email.")
      .or(z.literal("")),
    address: z.string().trim().optional(),
    receiptFooter: z.string().trim().optional(),
  }),
  sales: z.object({
    defaultSaleType: z.enum(["retail", "wholesale"]),
    allowWholesale: z.boolean(),
    allowSplitPayment: z.boolean(),
    allowSalesReturn: z.boolean(),
    autoPrintReceipt: z.boolean(),
    stockOutMethod: z.enum(["fefo", "fifo"]),
  }),
  purchases: z.object({
    defaultPaymentMode: z.enum([
      "pay_after_check",
      "prepaid",
      "partial_prepaid",
    ]),
    allowPrepaid: z.boolean(),
    allowPartialPrepaid: z.boolean(),
    requireStockInConfirm: z.boolean(),
    allowSupplierClaim: z.boolean(),
  }),
  inventory: z.object({
    lowStockAlert: z.boolean(),
    expiryAlert: z.boolean(),
    expiryAlertDays: z.coerce
      .number()
      .int("Expiry alert days must be a whole number.")
      .min(0, "Expiry alert days cannot be negative."),
    allowNegativeStock: z.boolean(),
    requireBatchForExpiryProduct: z.boolean(),
    stockAdjustmentApproval: z.boolean(),
  }),
});
