import { z } from "zod";
import { RETURN_STATUS, STATUS } from "../utils/purchaseConstants";

const optionalNumber = z.union([z.coerce.number().min(0), z.literal("").transform(() => 0)]).optional();
const requiredPositiveNumber = z.coerce.number().positive("ត្រូវតែធំជាង 0។");
const requiredNonNegativeNumber = z.coerce.number().min(0, "មិនអាចតិចជាង 0។");

export const purchaseFormSchema = z
  .object({
    purchaseNo: z.string().trim().min(1, "Purchase no is required."),
    supplierId: z.union([z.string().trim().min(1, "អ្នកផ្គត់ផ្គង់ is required."), z.coerce.number().positive("អ្នកផ្គត់ផ្គង់ is required.")]),
    purchaseDate: z.string().trim().min(1, "Purchase date is required."),
    inputCurrency: z.enum(["USD", "KHR"]),
    exchangeRateUsed: optionalNumber,
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
    const requiresPaymentInfo = form.paymentMode !== "pay_after_check";

    if (requiresPaymentInfo && Number(form.exchangeRateUsed || 0) <= 0) {
      context.addIssue({
        code: "custom",
        path: ["exchangeRateUsed"],
        message: "Exchange rate must be greater than 0.",
      });
    }

    if (requiresPaymentInfo && form.paymentStatus === "partial" && Number(form.paidAmount || 0) <= 0) {
      context.addIssue({
        code: "custom",
        path: ["paidAmount"],
        message: "ចំនួនទឹកប្រាក់បានបង់ចាំបាច់សម្រាប់ការបង់ប្រាក់មួយផ្នែក។",
      });
    }
  });

export const createPurchaseItemSchema = (paymentMode = "pay_after_check") =>
  z
    .object({
      variantUnitId: z.union([
        z.string().trim().min(1, "សូមជ្រើសប្រភេទផលិតផល"),
        z.coerce.number().positive("សូមជ្រើសប្រភេទផលិតផល"),
      ]),
      inputCurrency: z.enum(["USD", "KHR"]),
      inputUnitCost: optionalNumber,
      invoicedQty: requiredPositiveNumber,
      invoiceTotal: optionalNumber,
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

      if (receivedQty > invoicedQty) {
        context.addIssue({ code: "custom", path: ["receivedQty"], message: "ចំនួនទទួលមិនអាចលើសចំនួនកម្មង់។" });
      }
      if (acceptedQty > invoicedQty) {
        context.addIssue({ code: "custom", path: ["acceptedQty"], message: "ចំនួនទទួលយកមិនអាចលើសចំនួនកម្មង់។" });
      }
      if (acceptedQty + damagedQty > invoicedQty) {
        context.addIssue({ code: "custom", path: ["damagedQty"], message: "ចំនួនទទួលយក + ខូចមិនអាចលើសចំនួនកម្មង់។" });
      }
      if (acceptedQty > receivedQty) {
        context.addIssue({ code: "custom", path: ["acceptedQty"], message: "ចំនួនទទួលយកមិនអាចលើសចំនួនទទួល។" });
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
  invoiceTotal: "",
  paidAmount: "",
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

