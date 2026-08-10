import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import { RETURN_STATUS, STATUS } from "./purchaseConstants";

// Pure helpers extracted from Purchases.jsx — none of these close over component state
// (purchaseReturns, filters, etc.), they only take the purchase/item/value passed in. Moved out
// to shrink that file; behavior is unchanged (verbatim bodies), so callers keep using the same
// names/signatures as before.

export const calculateSubtotal = (items) => items.reduce((total, item) => total + Number(item.lineTotal || 0), 0);

export const calculateGrandTotal = (items, form) => {
  const subtotal = calculateSubtotal(items);
  return Number(subtotal || 0) - Number(form.discountTotal || 0) + Number(form.deliveryFee || 0);
};

export const calculateLineTotalsByPaymentMode = ({
  paymentMode,
  inputCurrency,
  inputUnitCost,
  invoiceTotal,
  paidAmount,
  invoicedQty,
  acceptedQty,
  receivedQty,
  damagedQty,
  paidQty,
  exchangeRate,
}) => {
  const rate = Number(exchangeRate || 0);
  const unitCost = Number(inputUnitCost || 0);
  // Mirrors PurchaseService::resolvePayableQty() on the backend exactly — before anything on
  // this line has actually been checked (received/accepted/damaged all still 0, i.e. a purchase
  // that hasn't been through receive-goods yet), the payable qty for pay_after_check must fall
  // back to the FULL invoiced qty, not 0. Previously this used acceptedQty unconditionally, so
  // every freshly-created pay_after_check purchase showed a $0 grand total (a real invoice value
  // silently discarded) until goods were received — the backend's own calculation is correct
  // here, but only gets applied once hasCheckedQty flips true; before that it trusts whatever the
  // client sends, which was this $0.
  const hasCheckedQty = Number(receivedQty || 0) > 0 || Number(acceptedQty || 0) > 0 || Number(damagedQty || 0) > 0;
  const payableQty = paymentMode === "pay_after_check"
    ? (hasCheckedQty ? Number(acceptedQty || 0) : Number(invoicedQty || 0))
    : Number(invoicedQty || 0);
  const fullQty = Number(invoicedQty || 0);
  const exactInvoiceTotal = Number(invoiceTotal || 0);
  const exactPaidAmount = Number(paidAmount || 0);
  const currency = String(inputCurrency || "USD").toUpperCase();

  let inputLineTotal = payableQty * unitCost;
  if (paymentMode === "pay_after_check" && exactInvoiceTotal > 0 && fullQty > 0) {
    inputLineTotal = (exactInvoiceTotal / fullQty) * payableQty;
  } else if (exactInvoiceTotal > 0 && fullQty > 0 && Math.abs(payableQty - fullQty) < 0.0001) {
    inputLineTotal = exactInvoiceTotal;
  }

  if (!rate || rate <= 0) return { lineTotalUsd: 0, lineTotalKhr: 0 };

  if (currency === "KHR") {
    return {
      lineTotalUsd: Number((inputLineTotal / rate).toFixed(2)),
      lineTotalKhr: Number(inputLineTotal.toFixed(2)),
    };
  }

  return {
    lineTotalUsd: Number(inputLineTotal.toFixed(2)),
    lineTotalKhr: Number((inputLineTotal * rate).toFixed(2)),
  };
};

export const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

export const getItemUnitCostAmounts = (item = {}) => ({
  usd: Number(item.unitCostUsd ?? item.unit_cost_usd ?? item.unitCost ?? item.unit_cost ?? 0),
  khr: Number(item.unitCostKhr ?? item.unit_cost_khr ?? 0),
});

export const getItemOnlyAmount = (item = {}, qty) => {
  const useQty = Number(qty ?? item.qtyReturned ?? item.qty_returned ?? item.claimQty ?? item.claim_qty ?? item.damagedQty ?? item.damaged_qty ?? item.invoicedQty ?? item.invoiced_qty ?? item.quantity ?? 0);
  const unitCost = getItemUnitCostAmounts(item);

  if (useQty > 0 && (unitCost.usd > 0 || unitCost.khr > 0)) {
    return {
      usd: roundMoney(useQty * unitCost.usd),
      khr: Math.round(useQty * unitCost.khr),
    };
  }

  return {
    usd: Number(item.itemTotalUsd ?? item.item_total_usd ?? item.lineSubtotalUsd ?? item.line_subtotal_usd ?? item.lineTotalUsd ?? item.line_total_usd ?? item.lineTotal ?? 0),
    khr: Number(item.itemTotalKhr ?? item.item_total_khr ?? item.lineSubtotalKhr ?? item.line_subtotal_khr ?? item.lineTotalKhr ?? item.line_total_khr ?? 0),
  };
};

export const getClaimRequiredCount = (purchase = {}) => {
  const lines = Array.isArray(purchase.items) && purchase.items.length > 0 ? purchase.items : (purchase.summaryItems || []);
  return lines.reduce((total, item) => total + Number(item.claimQty ?? item.claim_qty ?? 0), 0);
};

export const getDamagedCount = (purchase) => purchase.items.reduce((total, item) => total + Number(item.damagedQty || 0), 0);

export const getPurchaseClaimLines = (purchase = {}) => {
  const items = Array.isArray(purchase.items) ? purchase.items : [];
  return items.length > 0 ? items : (Array.isArray(purchase.summaryItems) ? purchase.summaryItems : []);
};

export const getPurchaseLines = (purchase = {}) => {
  const items = Array.isArray(purchase.items) ? purchase.items : [];
  if (items.length > 0) return items;
  return Array.isArray(purchase.summaryItems) ? purchase.summaryItems : [];
};

export const getRemainingStockInQty = (item = {}) => {
  // A server-provided remaining qty of exactly 0 (fully stocked in) is valid and must not
  // fall through to the base-qty fallback below — stocked_in_base_qty is never sent by the
  // API, so that fallback always reads as "nothing stocked in yet" once triggered.
  if (item.remainingStockInQty != null || item.remaining_stock_in_qty != null) {
    return Number(item.remainingStockInQty ?? item.remaining_stock_in_qty ?? 0);
  }

  const conversionQty = Number(item.conversionQty ?? item.conversion_qty ?? 1) || 1;
  const acceptedBaseQty = Number(item.acceptedBaseQty ?? item.accepted_base_qty ?? 0);
  const stockedInBaseQty = Number(item.stockedInBaseQty ?? item.stocked_in_base_qty ?? 0);
  if (acceptedBaseQty > 0 || stockedInBaseQty > 0) return Math.max(0, acceptedBaseQty - stockedInBaseQty);

  const acceptedQty = Number(item.acceptedQty ?? item.accepted_qty ?? 0);
  const stockedInQty = Number(item.stockedInQty ?? item.stocked_in_qty ?? 0);
  return Math.max(0, (acceptedQty - stockedInQty) * conversionQty);
};

export const hasRemainingStockInQty = (purchase) =>
  getPurchaseLines(purchase).some((item) => getRemainingStockInQty(item) > 0);

export const hasAnyStockedInQty = (purchase) =>
  getPurchaseLines(purchase).some((item) => Number(item.stockedInQty ?? item.stocked_in_qty ?? 0) > 0);

export const getStatusClass = (status) => {
  if (status === STATUS.RECEIVED) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (status === STATUS.PENDING_STOCK_IN) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  if (status === STATUS.PENDING_RECEIVE) return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
  if (status === STATUS.PENDING_CLAIM) return "bg-red-500/10 text-red-600 dark:text-red-400";
  if (status === STATUS.DRAFT) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400";
};

export const getStatusIcon = (status) => {
  if (status === STATUS.RECEIVED) return <FiCheckCircle />;
  if (status === STATUS.PENDING_STOCK_IN) return <FiClock />;
  if (status === STATUS.PENDING_RECEIVE) return <FiTruck />;
  if (status === STATUS.PENDING_CLAIM) return <FiAlertTriangle />;
  if (status === STATUS.DRAFT) return <FiFileText />;
  return <FiXCircle />;
};

export const getPurchaseReturnStatusClass = (status) => {
  if (status === RETURN_STATUS.COMPLETED) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (status === RETURN_STATUS.SUBMITTED || status === RETURN_STATUS.APPROVED) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  if (status === RETURN_STATUS.WAITING_REPLACEMENT) return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
  if (status === RETURN_STATUS.DRAFT) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (status === RETURN_STATUS.REJECTED) return "bg-red-500/10 text-red-600 dark:text-red-400";
  return "bg-red-500/10 text-red-500 dark:text-red-400";
};

export const getPurchaseReturnStatusIcon = (status) => {
  if (status === RETURN_STATUS.COMPLETED) return <FiCheckCircle />;
  if (status === RETURN_STATUS.SUBMITTED || status === RETURN_STATUS.APPROVED) return <FiClock />;
  if (status === RETURN_STATUS.WAITING_REPLACEMENT) return <FiTruck />;
  if (status === RETURN_STATUS.DRAFT) return <FiFileText />;
  if (status === RETURN_STATUS.REJECTED) return <FiXCircle />;
  return <FiXCircle />;
};

export const normalizeReturnStatusLabel = (value = RETURN_STATUS.DRAFT) => {
  const status = String(value || "").trim().toLowerCase();
  const map = {
    draft: RETURN_STATUS.DRAFT,
    submitted: RETURN_STATUS.SUBMITTED,
    approved: RETURN_STATUS.APPROVED,
    waiting_replacement: RETURN_STATUS.WAITING_REPLACEMENT,
    "waiting replacement": RETURN_STATUS.WAITING_REPLACEMENT,
    rejected: RETURN_STATUS.REJECTED,
    resolved: RETURN_STATUS.COMPLETED,
    completed: RETURN_STATUS.COMPLETED,
    cancelled: RETURN_STATUS.CANCELLED,
    canceled: RETURN_STATUS.CANCELLED,
  };
  return map[status] || value || RETURN_STATUS.SUBMITTED;
};

export function normalizeReturnResolutionType(value = "replacement") {
  if (value === "credit") return "credit_note";
  return value || "replacement";
}

export const normalizeClaimResolutionType = (value = "") => {
  const type = String(value || "").trim().toLowerCase();
  if (type === "credit" || type === "credit note") return "credit_note";
  return type;
};

export const getClampedClaimAmount = (item = {}, type = "refund") => {
  const usdKey = type === "credit_note" ? "creditAmountUsd" : "refundAmountUsd";
  const usdApiKey = type === "credit_note" ? "credit_amount_usd" : "refund_amount_usd";
  const khrKey = type === "credit_note" ? "creditAmountKhr" : "refundAmountKhr";
  const khrApiKey = type === "credit_note" ? "credit_amount_khr" : "refund_amount_khr";
  const rawUsd = Number(item[usdKey] ?? item[usdApiKey] ?? 0);
  const rawKhr = Number(item[khrKey] ?? item[khrApiKey] ?? 0);
  const claimUsd = Number(item.subtotalUsd ?? item.totalAmountUsd ?? item.total_amount_usd ?? item.subtotal_usd ?? item.subtotal ?? 0);
  const claimKhr = Number(item.subtotalKhr ?? item.totalAmountKhr ?? item.total_amount_khr ?? item.subtotal_khr ?? 0);
  // rawUsd/Khr (refund_amount_usd/khr) can legitimately be 0 when the claim is fully
  // absorbed into what's still owed instead of paid back in cash — do not fall back to
  // the full claim value in that case, or "actual cost" wrongly drops by the gross claim
  // even though no cash was ever actually refunded.
  return {
    usd: claimUsd > 0 ? Math.min(rawUsd, claimUsd) : rawUsd,
    khr: claimKhr > 0 ? Math.min(rawKhr, claimKhr) : rawKhr,
  };
};

export const getPartialPrepaidClaimDeduction = (purchase = {}) => {
  if ((purchase.paymentMode || "").toLowerCase() !== "partial_prepaid") return { usd: 0, khr: 0 };

  return getPurchaseClaimLines(purchase).reduce(
    (total, item) => {
      const claimQty = Number(item.claimQty ?? item.claim_qty ?? 0);
      if (claimQty <= 0) return total;
      const claimAmount = getItemOnlyAmount(item, claimQty);

      return {
        usd: total.usd + claimAmount.usd,
        khr: total.khr + claimAmount.khr,
      };
    },
    { usd: 0, khr: 0 }
  );
};

export const getPurchaseItemTotals = (purchase = {}) => {
  const lines = getPurchaseClaimLines(purchase);
  if (lines.length === 0) {
    return {
      usd: Number(purchase.itemsTotalUsd ?? purchase.subtotalUsd ?? purchase.subTotalUsd ?? 0),
      khr: Number(purchase.itemsTotalKhr ?? purchase.subtotalKhr ?? purchase.subTotalKhr ?? 0),
    };
  }

  return lines.reduce(
    (total, item) => ({
      usd: total.usd + getItemOnlyAmount(item, item.invoicedQty ?? item.invoiced_qty ?? item.quantity).usd,
      khr: total.khr + getItemOnlyAmount(item, item.invoicedQty ?? item.invoiced_qty ?? item.quantity).khr,
    }),
    { usd: 0, khr: 0 }
  );
};

export const getUnpaidItemAmountBeforeClaim = (purchase = {}) => {
  const itemTotals = getPurchaseItemTotals(purchase);
  const paidUsd = Number(purchase.paidAmountUsd ?? purchase.paidAmount ?? 0);
  const paidKhr = Number(purchase.paidAmountKhr ?? 0);

  return {
    usd: Math.max(0, itemTotals.usd - Math.min(itemTotals.usd, paidUsd)),
    khr: Math.max(0, itemTotals.khr - Math.min(itemTotals.khr, paidKhr)),
  };
};

export const isSupplierClaimNeeded = (purchase = {}) => {
  const claimQty = getClaimRequiredCount(purchase);
  if (claimQty <= 0) return false;
  if ((purchase.paymentMode || "").toLowerCase() !== "partial_prepaid") return true;

  const claimDeduction = getPartialPrepaidClaimDeduction(purchase);
  const unpaidBeforeClaim = getUnpaidItemAmountBeforeClaim(purchase);

  return claimDeduction.usd > unpaidBeforeClaim.usd + 0.01 || claimDeduction.khr > unpaidBeforeClaim.khr + 1;
};

// Checked per ITEM (not the return's own aggregate fields) — a claim can now mix resolution
// types across its items, so a return-level check would either wrongly skip a mixed claim's
// replacement items (return-level resolutionType reads "mixed", never literally "replacement")
// or wrongly treat a resolved refund item as if it were an incomplete replacement.
export function isReplacementClaimIncomplete(r) {
  const items = Array.isArray(r.items) ? r.items : [];
  return items.some((item) => {
    if (normalizeReturnResolutionType(item.resolutionType || item.resolution_type) !== "replacement") return false;
    const claimedQty = Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? item.replacement_qty ?? item.replacementQty ?? 0);
    const stockedQty = Number(item.replacementStockedInQty ?? item.replacement_stocked_in_qty ?? 0);
    return stockedQty < claimedQty;
  });
}

// Narrower than isReplacementClaimIncomplete above: only true while there's still unreceived
// qty (vs. fully received but not yet stocked in, which needs "confirm stock in", not another
// receive pass). Same per-item scoping as isReplacementClaimIncomplete.
export function isReplacementNotFullyReceived(r) {
  const items = Array.isArray(r.items) ? r.items : [];
  return items.some((item) => {
    if (normalizeReturnResolutionType(item.resolutionType || item.resolution_type) !== "replacement") return false;
    const claimedQty = Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? item.replacement_qty ?? item.replacementQty ?? 0);
    const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
    return receivedQty < claimedQty;
  });
}

// Checked per ITEM within the return, not the return's own aggregate resolutionType — a claim
// can now mix resolution types across its items, so the return-level field reads "mixed" and
// would never match either "replacement" or ["refund","credit_note"] on its own. Still returns
// the whole return object (existing callers — ReceiveReplacementModal via buildReplacementItems,
// ResolveMoneyClaimModal — already filter to the relevant items themselves).
export const returnHasOpenReplacementItem = (ret) => {
  const items = Array.isArray(ret.items) ? ret.items : [];
  return items.some((item) => {
    const itemStatus = normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status);
    const resolutionType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
    if (resolutionType !== "replacement" || itemStatus === RETURN_STATUS.CANCELLED) return false;
    // Whether there's still something to physically receive is independent of the decision
    // status — an item whose resolution_status was never explicitly flipped to "resolved"
    // (e.g. left at "submitted" throughout, since receiving doesn't itself change that field)
    // must not be treated as perpetually "open" once it's actually been fully received.
    const claimedQty = Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? 0);
    const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
    return receivedQty < claimedQty;
  });
};

export const returnHasOpenMoneyItem = (ret) => {
  const items = Array.isArray(ret.items) ? ret.items : [];
  return items.some((item) => {
    const itemStatus = normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status);
    const resolutionType = normalizeReturnResolutionType(item.resolutionType || item.resolution_type);
    return ["refund", "credit_note"].includes(resolutionType) && itemStatus !== RETURN_STATUS.COMPLETED && itemStatus !== RETURN_STATUS.CANCELLED;
  });
};

// Item-level amounts/qty take priority over the return-level rollup — a mixed claim's rollup
// fields aggregate across ALL of the return's same-type items, which would misreport this
// specific item's own figure once a return has more than one item of that type. The `ret.*`
// fallback only matters for legacy data with no per-item resolution recorded at all.
// A nonzero refund_amount_usd/credit_amount_usd only means the settlement has been CALCULATED
// (done immediately at claim creation, before the supplier has actually paid) — it does not by
// itself mean the money has been confirmed received/issued, so a "✓" is only shown once the
// item's own resolution_status is actually complete.
export const getReturnItemResolution = (item, resolutionType, ret = {}) => {
  const itemStatus = normalizeReturnStatusLabel(item.resolutionStatus || item.resolution_status);
  const isMoneyResolved = itemStatus === RETURN_STATUS.COMPLETED;
  if (resolutionType === "refund") {
    const amt = Number(item.refund_amount_usd ?? item.refundAmountUsd ?? ret.refundAmountUsd ?? 0);
    if (amt <= 0) return "រង់ចាំការសង";
    return isMoneyResolved ? `សង $${amt.toFixed(2)} ✓` : `សង $${amt.toFixed(2)} (រង់ចាំបញ្ជាក់)`;
  }
  if (resolutionType === "credit_note") {
    const amt = Number(item.credit_amount_usd ?? item.creditAmountUsd ?? ret.creditAmountUsd ?? 0);
    if (amt <= 0) return "រង់ចាំកាត់លុយលើកក្រោយ";
    return isMoneyResolved ? `កាត់លុយលើកក្រោយ $${amt.toFixed(2)} ✓` : `កាត់លុយលើកក្រោយ $${amt.toFixed(2)} (រង់ចាំបញ្ជាក់)`;
  }
  const received = Number(item.replacement_received_qty ?? item.replacementReceivedQty ?? ret.replacementReceivedQty ?? 0);
  const total = Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? item.replacement_qty ?? item.replacementQty ?? ret.replacementQty ?? 0);
  if (total === 0) return "រង់ចាំ";
  return received >= total ? `${received}/${total} បានទទួល ✓` : `${received}/${total} បានទទួល`;
};

export const getPurchasePaymentBalance = (p = {}) => {
  // Trust the server-computed balance_amount_usd/khr — it already nets out any
  // resolved refund/credit_note claim deduction (see PurchaseService::recalculateTotals).
  // Do not re-derive the deduction here from claim_qty: it is reset to 0 once a claim
  // is resolved, which previously made this recompute silently undo the deduction.
  //
  // A server balance of exactly 0 (fully paid, or fully offset by a resolved claim)
  // is valid and must not fall back to grandTotal-paid — that fallback ignores any
  // resolved claim deduction and resurrects an already-settled balance as unpaid.
  const hasServerBalanceUsd = p.balanceAmountUsd != null || p.balanceAmount != null;
  const hasServerBalanceKhr = p.balanceAmountKhr != null;
  const rawUsd = Number(p.balanceAmountUsd ?? p.balanceAmount ?? 0);
  const rawKhr = Number(p.balanceAmountKhr ?? 0);
  const fallbackUsd = Math.max(
    0,
    Number(p.grandTotalUsd ?? p.grandTotal ?? 0) - Number(p.paidAmountUsd ?? p.paidAmount ?? 0)
  );
  const fallbackKhr = Math.max(0, Number(p.grandTotalKhr ?? 0) - Number(p.paidAmountKhr ?? 0));

  return {
    usd: hasServerBalanceUsd ? rawUsd : fallbackUsd,
    khr: hasServerBalanceKhr ? rawKhr : fallbackKhr,
  };
};

export const hasPurchasePaymentBalance = (p = {}) => {
  const balance = getPurchasePaymentBalance(p);
  return balance.usd > 0.01 || balance.khr > 1;
};

export const fmtUsd = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtKhr = (n) => `៛${Math.round(n).toLocaleString("en-US")}`;
