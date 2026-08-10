import { z } from "zod";

export const defaultReturnForm = {
  resolutionType: "refund",
  reason: "",
  totalAmount: "",
  status: "pending_approval",
  verificationType: "system_lookup",
};

export const saleReturnSchema = z.object({
  resolutionType: z.enum(["refund", "replacement"]),
  reason: z.string().trim(),
  status: z.enum(["pending_approval", "approved", "completed", "rejected"]),
  verificationType: z.enum(["receipt", "system_lookup", "verbal", "photo"]),
});

export const validateSaleReturn = (form, maxAmount) => {
  const parsed = saleReturnSchema.safeParse(form);
  const errors = {};

  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0];
      if (key) errors[key] = issue.message;
    });
  }

  if (form.totalAmount) {
    const amount = Number(form.totalAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.totalAmount = "Return amount must be greater than 0.";
    } else {
      const limit = Number(maxAmount);
      if (Number.isFinite(limit) && amount > limit) {
        errors.totalAmount = "Return amount cannot exceed sale grand total.";
      }
    }
  }

  return errors;
};
