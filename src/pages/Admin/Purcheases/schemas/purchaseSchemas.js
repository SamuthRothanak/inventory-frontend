import { z } from "zod";
import { RETURN_STATUS, STATUS } from "../utils/purchaseConstants";

const optionalNumber = z.union([z.coerce.number().min(0), z.literal("").transform(() => 0)]).optional();
const requiredPositiveNumber = z.coerce.number().positive("Must be greater than 0.");
const requiredNonNegativeNumber = z.coerce.number().min(0, "Cannot be negative.");

export const purchaseFormSchema = z
  .object({
    purchaseNo: z.string().trim().min(1, "Purchase no is required."),
    supplierId: z.union([z.string().trim().min(1, "Supplier is required."), z.coerce.number().positive("Supplier is required.")]),
    purchaseDate: z.string().trim().min(1, "Purchase date is required."),
    inputCurrency: z.enum(["USD", "KHR"]),
    exchangeRateUsed: requiredPositiveNumber,
    paymentMode: z.enum(["pay_after_check", "prepaid", "partial_prepaid"]),
    paymentStatus: z.enum(["unpaid", "partial", "paid"]),
    status: z.string().trim().min(1, "Status is required."),
    discountTotal: optionalNumber,
    deliveryFee: optionalNumber,
    paidAmount: optionalNumber,
    discountCurrency: z.enum(["USD", "KHR"]),
    deliveryFeeCurrency: z.enum(["USD", "KHR"]),
    deliveryPaidBy: z.string().optional(),
    deliveryOption: z.string().optional(),
    paidCurrency: z.enum(["USD", "KHR"]),
    note: z.string().optional(),
  })
  .superRefine((form, context) => {
    if (form.paymentStatus === "partial" && Number(form.paidAmount || 0) <= 0) {
      context.addIssue({
        code: "custom",
        path: ["paidAmount"],
        message: "Paid amount is required for partial payment.",
      });
    }
  });

export const createPurchaseItemSchema = (paymentMode = "pay_after_check") =>
  z
    .object({
      variantUnitId: z.union([
        z.string().trim().min(1, "Please select product variant."),
        z.coerce.number().positive("Please select product variant."),
      ]),
      inputCurrency: z.enum(["USD", "KHR"]),
      inputUnitCost: requiredPositiveNumber,
      invoicedQty: requiredPositiveNumber,
      paidQty: optionalNumber,
      receivedQty: requiredNonNegativeNumber,
      acceptedQty: requiredNonNegativeNumber,
      damagedQty: requiredNonNegativeNumber,
      expiredDate: z.string().optional(),
    })
    .superRefine((item, context) => {
      const invoicedQty = Number(item.invoicedQty || 0);
      const paidQty = Number(item.paidQty || 0);
      const receivedQty = Number(item.receivedQty || 0);
      const acceptedQty = Number(item.acceptedQty || 0);
      const damagedQty = Number(item.damagedQty || 0);

      if (paymentMode === "partial_prepaid" && paidQty < 0) {
        context.addIssue({ code: "custom", path: ["paidQty"], message: "Paid quantity is required." });
      }
      if (paidQty > invoicedQty) {
        context.addIssue({ code: "custom", path: ["paidQty"], message: "Paid quantity cannot exceed invoiced qty." });
      }
      if (acceptedQty > invoicedQty) {
        context.addIssue({ code: "custom", path: ["acceptedQty"], message: "Accepted quantity cannot exceed invoiced qty." });
      }
      if (acceptedQty + damagedQty > invoicedQty) {
        context.addIssue({ code: "custom", path: ["damagedQty"], message: "Accepted plus damaged qty cannot exceed invoiced qty." });
      }
      if (acceptedQty > receivedQty) {
        context.addIssue({ code: "custom", path: ["acceptedQty"], message: "Accepted quantity cannot exceed received qty." });
      }
    });

export const emptyPurchaseForm = {
  purchaseNo: "",
  supplierId: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  inputCurrency: "USD",
  exchangeRateUsed: 0,
  khrRounding: "floor",
  exchangeRateSource: "manual",
  exchangeRateNote: "",
  paymentMode: "pay_after_check",
  paymentStatus: "unpaid",
  discountTotal: 0,
  discountCurrency: "USD",
  deliveryOption: "none",
  deliveryFee: 0,
  deliveryFeeCurrency: "USD",
  deliveryPaidBy: "buyer",
  paidAmount: 0,
  paidCurrency: "USD",
  note: "",
  status: STATUS.DRAFT,
};

export const emptyItemForm = {
  variantUnitId: "",
  invoicedQty: "",
  inputCurrency: "USD",
  inputUnitCost: "",
  paidQty: "",
  receivedQty: "",
  acceptedQty: "",
  damagedQty: 0,
  claimQty: 0,
  unitCost: "",
  expiredDate: "",
};

export const emptyPurchaseReturnForm = {
  purchaseReturnNo: "",
  purchaseId: "",
  supplierId: "",
  returnDate: new Date().toISOString().slice(0, 10),
  returnType: "partial_return",
  returnReason: "damaged",
  resolutionType: "replacement",
  resolutionStatus: "submitted",
  note: "",
  status: RETURN_STATUS.SUBMITTED,
};

export const emptyPurchaseReturnItemForm = {
  purchaseItemId: "",
  qtyReturned: "",
  condition: "damaged",
  reason: "",
};

