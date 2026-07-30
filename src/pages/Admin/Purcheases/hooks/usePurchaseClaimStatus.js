import { useMemo } from "react";

import { RETURN_STATUS, STATUS } from "../utils/purchaseConstants";
import {
  hasPurchasePaymentBalance,
  isReplacementClaimIncomplete,
  isReplacementNotFullyReceived,
  isSupplierClaimNeeded,
  normalizeClaimResolutionType,
  normalizeReturnStatusLabel,
  returnHasOpenMoneyItem,
  returnHasOpenReplacementItem,
} from "../utils/purchaseStatusHelpers";

// Extracted from Purchases.jsx — this is the one piece of that file's status/claim logic that
// DOES close over live data (purchaseReturns), unlike the pure helpers in purchaseStatusHelpers.jsx.
// Grouped into a hook so the O(1) purchaseReturns-by-id index (see comment below) and everything
// built on top of it lives in one place instead of being spread across ~300 lines of the page
// component. Behavior is unchanged — bodies are moved verbatim; callers in Purchases.jsx destructure
// these same names from this hook instead of defining them locally.
export function usePurchaseClaimStatus(purchaseReturns) {
  // Indexed once per purchaseReturns change instead of re-filtering the full array on every
  // getRelatedPurchaseReturns call — that used to make every status/claim check below an O(P×R)
  // scan (P purchases × R returns) on EVERY render, since none of this section was memoized and a
  // single component holds all page state, so any unrelated keystroke re-ran the whole thing.
  const purchaseReturnsByPurchaseId = useMemo(() => {
    const map = new Map();
    for (const item of purchaseReturns) {
      const key = String(item.purchaseId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return map;
  }, [purchaseReturns]);

  const getRelatedPurchaseReturns = (purchase) => {
    if (!purchase?.id) return [];
    const fromPurchase = Array.isArray(purchase.returns) ? purchase.returns : [];
    const fromQuery = purchaseReturnsByPurchaseId.get(String(purchase.id)) || [];
    const merged = [...fromPurchase, ...fromQuery];
    return merged.filter((item, index, list) => list.findIndex((current) => String(current.id) === String(item.id)) === index);
  };

  const getOpenSupplierClaim = (purchase) => {
    return getRelatedPurchaseReturns(purchase).find((item) => {
      const status = normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status);
      // "Resolved" (agreed) is not the same as "fully received/stocked in" for a replacement —
      // keep treating it as open until the physical goods are actually accounted for.
      return ![RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(status) || isReplacementClaimIncomplete(item);
    });
  };

  // Narrower than getOpenSupplierClaim above: only cares whether the claim *decision* is still
  // pending (status not completed/cancelled) — not whether replacement goods have been fully
  // received/stocked in. Once the supplier has agreed to a resolution, a *different* item's claim
  // shouldn't have to wait for the first item's physical stock-in to finish; those are unrelated.
  // Use this (not getOpenSupplierClaim) to gate "can a new claim be created" — matches how
  // ViewPurchaseModal.jsx's activeReturn / PurchaseTable.jsx's activeClaim already do it.
  const hasUnresolvedClaimDecision = (purchase) =>
    getRelatedPurchaseReturns(purchase).some((item) =>
      ![RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED].includes(
        normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status)
      )
    );

  const hasResolvedSupplierClaim = (purchase) => {
    return getRelatedPurchaseReturns(purchase).some((item) =>
      normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status) === RETURN_STATUS.COMPLETED &&
      !isReplacementClaimIncomplete(item)
    );
  };

  // Once a claim's resolution decision is made (status completed) and, for a replacement, the
  // goods have actually been received, there's nothing left requiring the supplier — only an
  // internal stock-in action remains. getOpenSupplierClaim (used below) deliberately stays
  // "open" until stock-in too, which is right for gating claim-related buttons, but wrong for
  // deciding whether the purchase should still read "waiting for claim" vs "waiting to stock in".
  const hasOutstandingSupplierAction = (purchase) => {
    const returns = getRelatedPurchaseReturns(purchase);
    // No claim/return record created yet at all — trust isSupplierClaimNeeded (claimQty is a
    // fresh, accurate signal here). Once a return exists, don't also consult isSupplierClaimNeeded:
    // claim_qty never resets for replacement claims even after they're fully resolved/received/
    // stocked in, so it would wrongly read "still needed" forever — the per-return status below
    // is the reliable source once a return actually exists.
    if (returns.length === 0) return isSupplierClaimNeeded(purchase);
    return returns.some((item) => {
      const status = normalizeReturnStatusLabel(item.status || item.resolutionStatus || item.resolution_status);
      if (status === RETURN_STATUS.CANCELLED) return false;
      if (status !== RETURN_STATUS.COMPLETED) return true;
      return isReplacementNotFullyReceived(item);
    });
  };

  const getEffectivePurchaseStatus = (purchase) => {
    if (purchase.status === STATUS.PENDING_CLAIM && !hasOutstandingSupplierAction(purchase)) {
      return STATUS.PENDING_STOCK_IN;
    }
    if (purchase.status === STATUS.PENDING_CLAIM && !getOpenSupplierClaim(purchase) && !isSupplierClaimNeeded(purchase)) {
      return STATUS.PENDING_STOCK_IN;
    }
    return purchase.status;
  };

  const hasPendingReplacementStockIn = (purchase) =>
    getRelatedPurchaseReturns(purchase).some((item) => {
      // A "resolved" claim only means the supplier agreed to replace — it does not mean the
      // goods have physically arrived, so a genuinely-zero received_qty must not be treated
      // as "fully received" just because the claim status looks complete.
      // No resolutionType gate here: replacementReceivedQty/replacementStockedInQty are already
      // scoped to replacement-type items only by the backend rollup (recomputeReturnRollup), so
      // they're both 0 for a return with no replacement items regardless of its rollup type
      // (which reads "mixed" once a claim also has a refund/credit_note item — gating on
      // resolutionType === "replacement" here used to hide a mixed claim's pending stock-in).
      const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
      const stockedQty = Number(item.replacementStockedInQty ?? item.replacement_stocked_in_qty ?? 0);
      return receivedQty > stockedQty;
    });

  const getOpenReplacementClaim = (purchase) => getRelatedPurchaseReturns(purchase).find(returnHasOpenReplacementItem);

  const getOpenMoneyClaim = (purchase) => getRelatedPurchaseReturns(purchase).find(returnHasOpenMoneyItem);

  const isPaymentReady = (p) => {
    if ((p.paymentMode || "").toLowerCase() === "pay_after_check") {
      return [STATUS.PENDING_STOCK_IN, STATUS.PENDING_CLAIM, STATUS.RECEIVED].includes(
        getEffectivePurchaseStatus(p)
      );
    }
    return true;
  };

  // Both functions below check EACH RETURN ITEM's own resolutionType/status, not the return's own
  // rollup fields — a mixed claim's rollup resolutionType reads "mixed" and would never match
  // "refund"/"credit_note", silently hiding a still-outstanding money item on a mixed claim from
  // partial_prepaid balance/payment-flow logic. Falls back to the return's own aggregate fields
  // when `items` is empty (old data with no per-item resolution recorded).
  const hasPartialPrepaidMoneyClaimReceivable = (purchase = {}) => {
    if (String(purchase.paymentMode || "").toLowerCase() !== "partial_prepaid") return false;

    return getRelatedPurchaseReturns(purchase).some((ret) => {
      const items = Array.isArray(ret.items) ? ret.items : [];
      const checkOne = (source) => {
        const status = normalizeReturnStatusLabel(source.status || source.resolutionStatus || source.resolution_status);
        if ([RETURN_STATUS.CANCELLED, RETURN_STATUS.REJECTED].includes(status)) return false;

        const resolutionType = normalizeClaimResolutionType(source.resolutionType || source.resolution_type || "");
        if (!["refund", "credit_note"].includes(resolutionType)) return false;

        const usdKey = resolutionType === "credit_note" ? "creditAmountUsd" : "refundAmountUsd";
        const usdApiKey = resolutionType === "credit_note" ? "credit_amount_usd" : "refund_amount_usd";
        const khrKey = resolutionType === "credit_note" ? "creditAmountKhr" : "refundAmountKhr";
        const khrApiKey = resolutionType === "credit_note" ? "credit_amount_khr" : "refund_amount_khr";

        return Number(source[usdKey] ?? source[usdApiKey] ?? 0) > 0.01 ||
          Number(source[khrKey] ?? source[khrApiKey] ?? 0) > 1;
      };
      return items.length > 0 ? items.some((item) => checkOne(item)) : checkOne(ret);
    });
  };

  const hasActivePartialPrepaidMoneyClaim = (purchase = {}) => {
    if (String(purchase.paymentMode || "").toLowerCase() !== "partial_prepaid") return false;

    return getRelatedPurchaseReturns(purchase).some((ret) => {
      const items = Array.isArray(ret.items) ? ret.items : [];
      const checkOne = (source) => {
        const status = normalizeReturnStatusLabel(source.status || source.resolutionStatus || source.resolution_status);
        if ([RETURN_STATUS.COMPLETED, RETURN_STATUS.CANCELLED, RETURN_STATUS.REJECTED, "resolved", "completed", "cancelled", "canceled", "rejected"].includes(status)) return false;

        const resolutionType = normalizeClaimResolutionType(source.resolutionType || source.resolution_type || "");
        return ["refund", "credit_note"].includes(resolutionType);
      };
      return items.length > 0 ? items.some((item) => checkOne(item)) : checkOne(ret);
    });
  };

  const shouldShowInPaymentFlow = (purchase = {}) =>
    hasPurchasePaymentBalance(purchase) &&
    !hasActivePartialPrepaidMoneyClaim(purchase) &&
    !hasPartialPrepaidMoneyClaimReceivable(purchase);

  return {
    purchaseReturnsByPurchaseId,
    getRelatedPurchaseReturns,
    getOpenSupplierClaim,
    hasUnresolvedClaimDecision,
    hasResolvedSupplierClaim,
    hasOutstandingSupplierAction,
    getEffectivePurchaseStatus,
    hasPendingReplacementStockIn,
    getOpenReplacementClaim,
    getOpenMoneyClaim,
    isPaymentReady,
    hasPartialPrepaidMoneyClaimReceivable,
    hasActivePartialPrepaidMoneyClaim,
    shouldShowInPaymentFlow,
  };
}
