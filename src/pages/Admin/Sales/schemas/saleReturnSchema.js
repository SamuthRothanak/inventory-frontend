import { z } from "zod";

export const defaultReturnForm = {
  returnType: "full",
  resolutionType: "refund",
  reason: "",
  totalAmount: "",
  status: "pending_approval",
};

export const saleReturnSchema = z.object({
  returnType: z.enum(["full", "partial"]),
  resolutionType: z.enum(["refund", "replacement", "store_credit"]),
  reason: z.string().trim().min(1, "Return reason is required."),
  status: z.enum(["pending_approval", "approved", "completed", "rejected"]),
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
