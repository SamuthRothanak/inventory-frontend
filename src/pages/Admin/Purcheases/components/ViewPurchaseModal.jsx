import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiInfo,
  FiPackage,
  FiRotateCcw,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";
import { getStockMovementsApi } from "../../../../services/inventory.service";
import { STATUS, STATUS_LABEL } from "../utils/purchaseConstants";
import { extractApiData, formatAmountInCurrency, formatCondition, formatCreditAppliedAmount, formatCurrencyPair, formatDateOnly, formatDateTimeLocal, formatDeliveryOption, formatPaymentMode, formatResolutionType } from "../utils/purchaseUtils";
import { EmptyState, FormSection, ModalShell, StatusBadge, SummaryMiniBox } from "./PurchaseCommon";

export function ViewPurchaseModal({
  purchase,
  purchaseReturns,
  theme,
  getStatusClass,
  getStatusIcon,
  effectiveStatus = purchase.status,
  problemLabel = "",
  statusBadge = null,
  getPurchaseReturnStatusClass,
  getPurchaseReturnStatusIcon,
  onClose,
  onReturn,
  onReceiveReplacement,
  onResolveClaim,
  onConfirmStockIn,
  onRecordPayment,
}) {
  const relatedReturns = [
    ...(Array.isArray(purchase.returns) ? purchase.returns : []),
    ...purchaseReturns.filter((item) => item.purchaseId === purchase.id),
  ];

  const movementsQuery = useQuery({
    queryKey: ["stock-movements", "purchase", purchase.id],
    queryFn: () => getStockMovementsApi({ ref_type: "purchase", ref_id: purchase.id, per_page: 100 }),
    enabled: Boolean(purchase.id),
    staleTime: 1000 * 30,
  });
  const relatedMovements = extractApiData(movementsQuery.data).map((item) => ({
    id: item.id,
    variantName: item.product_variant?.variant_name || item.product_variant?.name || "-",
    qtyBase: Number(item.qty_base || 0),
    note: item.note || "",
  }));
  const PAYMENT_STATUS_KH = { paid: "បានបង់", unpaid: "មិនទាន់បង់", partial: "បង់មួយផ្នែក" };
  const claimItems = purchase.items.filter((item) => Number(item.claimQty || 0) > 0);
  const totalClaimQty = claimItems.reduce((total, item) => total + Number(item.claimQty || 0), 0);
  const claimUnit = claimItems[0]?.unitName || "unit";
  const remainingStockInBaseQty = purchase.items.reduce(
    (total, item) =>
      total +
      Math.max(0, Number(item.acceptedQty || 0) - Number(item.stockedInQty || 0)) *
        Number(item.conversionQty || 1),
    0
  );
  // One item's base unit (e.g. sheets) is meaningless applied to another's (e.g. bottles) —
  // list each product's own pending base quantity/unit separately instead of summing them
  // into a single mislabeled number.
  const pendingStockInItems = purchase.items
    .map((item) => ({
      variantName: item.variantName,
      baseUnit: item.baseUnit,
      baseQty: Math.round(Math.max(0, Number(item.acceptedQty || 0) - Number(item.stockedInQty || 0)) * Number(item.conversionQty || 1) * 10000) / 10000,
    }))
    .filter((entry) => entry.baseQty > 0);
  const normalizeReturnStatus = (value = "") => {
    const status = String(value || "").trim().toLowerCase().replaceAll(" ", "_");
    if (status === "resolved" || status === "completed") return "completed";
    if (status === "cancelled" || status === "canceled") return "cancelled";
    return status;
  };
  const normalizeResolutionType = (value = "") => {
    const type = String(value || "").trim().toLowerCase();
    return type === "credit" ? "credit_note" : type;
  };
  // A replacement return's `status` reads "completed" as soon as the supplier *agrees* to
  // replace — that's the resolution decision, not physical receipt. Actions/badges that only
  // check raw status would incorrectly treat "agreed but not yet received" as fully done.
  const getReplacementReceiveProgress = (ret = {}) => {
    const items = Array.isArray(ret.items) ? ret.items : [];
    const claimedQty = items.reduce(
      (total, returnItem) =>
        total + Number(returnItem.qty ?? returnItem.qty_returned ?? returnItem.qtyReturned ?? returnItem.replacement_qty ?? returnItem.replacementQty ?? 0),
      0
    );
    const receivedQty = Number(ret.replacementReceivedQty ?? ret.replacement_received_qty ?? 0);
    return { claimedQty, receivedQty, remainingQty: Math.max(0, claimedQty - receivedQty) };
  };
  const RESOLUTION_TYPE_LABEL_KH = {
    replacement: "ជំនួសទំនិញថ្មី",
    refund: "សងលុយ",
    credit_note: "កាត់លុយលើកក្រោយ",
    none: "លះបង់ការទាមទារ",
  };
  const getItemClaimResolution = (item = {}) => {
    // Don't gate this on claimQty > 0: once a refund/credit_note claim resolves, claim_qty
    // is reset to 0 on the purchase item (replacement claims keep it) — so a resolved refund
    // item would otherwise silently lose its "this item was refunded" label right when it
    // becomes true. Look up the item's own return record directly instead.
    let matchedReturnItem = null;
    const claimReturn = relatedReturns.find((ret) =>
      (Array.isArray(ret.items) ? ret.items : []).some((returnItem) => {
        const returnItemPurchaseItemId =
          returnItem.purchase_item_id ?? returnItem.purchaseItemId ?? returnItem.purchaseItem?.id ?? returnItem.purchase_item?.id ?? "";
        const isMatch = String(returnItemPurchaseItemId) === String(item.id);
        if (isMatch) matchedReturnItem = returnItem;
        return isMatch;
      })
    );
    if (!claimReturn) {
      if (Number(item.claimQty || 0) <= 0) return null;
      return { label: "មិនទាន់ទាមទារ", isResolved: false, resolutionType: null, qty: Number(item.claimQty || 0) };
    }
    // Read the MATCHED ITEM's own type/status first — claimReturn's own resolutionType/status are
    // the return-level rollup, which reads "mixed"/least-progressed-status once this return has
    // more than one item, and would otherwise show every item on a mixed claim identically (e.g.
    // both an already-resolved refund item and a still-open replacement item labeled "mixed
    // (រង់ចាំ)"). Falls back to claimReturn's own fields for legacy data with no per-item
    // resolution recorded at all.
    const resolutionType = normalizeResolutionType(
      matchedReturnItem?.resolutionType || matchedReturnItem?.resolution_type || claimReturn.resolutionType || claimReturn.resolution_type
    );
    const status = normalizeReturnStatus(
      matchedReturnItem?.resolutionStatus || matchedReturnItem?.resolution_status || claimReturn.status || claimReturn.resolutionStatus || claimReturn.resolution_status
    );
    const isResolved = status === "completed";
    const label = RESOLUTION_TYPE_LABEL_KH[resolutionType] || resolutionType || "-";
    // claim_qty on the purchase item is reset to 0 once a refund/credit_note claim resolves —
    // fall back to the return item's own qty so the displayed count doesn't read as "0 → refunded".
    const qty = Number(item.claimQty || 0) > 0
      ? Number(item.claimQty || 0)
      : Number(matchedReturnItem?.qty ?? matchedReturnItem?.qty_returned ?? matchedReturnItem?.qtyReturned ?? 0);
    return { label: isResolved ? label : `${label} (រង់ចាំ)`, isResolved, resolutionType, qty };
  };
  const getClaimAmount = (item = {}, type = "refund") => {
    const usdKey = type === "credit_note" ? "creditAmountUsd" : "refundAmountUsd";
    const usdApiKey = type === "credit_note" ? "credit_amount_usd" : "refund_amount_usd";
    const khrKey = type === "credit_note" ? "creditAmountKhr" : "refundAmountKhr";
    const khrApiKey = type === "credit_note" ? "credit_amount_khr" : "refund_amount_khr";
    const rawUsd = Number(item[usdKey] ?? item[usdApiKey] ?? 0);
    const rawKhr = Number(item[khrKey] ?? item[khrApiKey] ?? 0);
    const claimUsd = Number(item.subtotalUsd ?? item.totalAmountUsd ?? item.total_amount_usd ?? item.subtotal_usd ?? item.subtotal ?? 0);
    const claimKhr = Number(item.subtotalKhr ?? item.totalAmountKhr ?? item.total_amount_khr ?? item.subtotal_khr ?? 0);
    return {
      usd: claimUsd > 0 ? Math.min(rawUsd || claimUsd, claimUsd) : rawUsd,
      khr: claimKhr > 0 ? Math.min(rawKhr || claimKhr, claimKhr) : rawKhr,
    };
  };
  // Checked per ITEM within a return, not the return's own aggregate status/resolutionType — a
  // claim can now mix resolution types across its items (return-level resolutionType then reads
  // "mixed"), so an aggregate-only check would miss a mixed return's still-open items entirely.
  const returnHasOpenItem = (ret, predicate) => {
    const items = Array.isArray(ret.items) ? ret.items : [];
    if (items.length > 0) return items.some(predicate);
    // Legacy fallback: no per-item data at all, fall back to the return's own aggregate fields.
    return predicate(ret);
  };
  const activeReturn = relatedReturns.find((ret) =>
    returnHasOpenItem(ret, (item) => !["completed", "cancelled"].includes(normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status)))
  );
  const hasRemainingStockIn = remainingStockInBaseQty > 0;
  const isFullyStocked = purchase.status === STATUS.RECEIVED || (purchase.items.length > 0 && !hasRemainingStockIn);
  const replacementReturn = relatedReturns.find((ret) =>
    returnHasOpenItem(ret, (item) => {
      const status = normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status);
      const isReplacement = normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement";
      return isReplacement && !["completed", "cancelled", "canceled"].includes(status);
    })
  );
  const moneyReturn = relatedReturns.find((ret) =>
    returnHasOpenItem(ret, (item) => {
      const status = normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status);
      const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
      return ["refund", "credit_note"].includes(resolutionType) && !["completed", "cancelled"].includes(status);
    })
  );
  // A claim can have 2+ independent open money items now (e.g. two different damaged products,
  // each a separate refund the supplier pays on its own schedule) — this quick-action button only
  // resolves ONE item per click, so it must stay hidden once there's more than one open money item
  // to avoid silently resolving just the first one found while the user thinks it resolved all of
  // them. With 2+, use the ការទាមទារ tab instead, where each item gets its own button.
  const openMoneyItemsInReturn = moneyReturn
    ? (Array.isArray(moneyReturn.items) && moneyReturn.items.length > 0 ? moneyReturn.items : [moneyReturn]).filter((item) => {
        const status = normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status);
        const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
        return ["refund", "credit_note"].includes(resolutionType) && !["completed", "cancelled"].includes(status);
      })
    : [];
  // Overall purchase status can already read RECEIVED once the originally-accepted units are
  // stocked in, even while replacement units have been received but not yet stocked in — the
  // flow timeline below must not claim the purchase is fully done while that's still pending.
  // Summed per ITEM (not the return's own aggregate replacement_received/stocked_in_qty) so a
  // mixed claim's replacement items are counted correctly regardless of its other items' types.
  const pendingReplacementQty = relatedReturns.reduce((total, ret) => {
    const items = Array.isArray(ret.items) && ret.items.length > 0 ? ret.items : [ret];
    return total + items.reduce((subtotal, item) => {
      const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
      if (resolutionType !== "replacement") return subtotal;
      const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
      const stockedQty = Number(item.replacementStockedInQty ?? item.replacement_stocked_in_qty ?? 0);
      return subtotal + Math.max(0, receivedQty - stockedQty);
    }, 0);
  }, 0);
  const canOpenInventory =
    pendingReplacementQty > 0 ||
    (hasRemainingStockIn && [STATUS.PENDING_STOCK_IN, STATUS.PENDING_CLAIM].includes(effectiveStatus));
  // Not gated on effectiveStatus === PENDING_CLAIM: once an earlier claim on this same purchase
  // resolves, effectiveStatus correctly advances to PENDING_STOCK_IN — but a different item can
  // still have its own unclaimed damage (totalClaimQty > 0) needing a separate claim.
  const canCreateClaim = !activeReturn && totalClaimQty > 0 && !isFullyStocked;
  // A return's own resolutionType reads "mixed" once its items don't all share one type — check
  // per ITEM whether a matching resolved refund/credit_note line exists (rollup refund_amount_usd/
  // credit_amount_usd on the return are already scoped to just that type's items, so
  // getClaimAmount(return, type) stays correct once this per-item existence check passes).
  const returnHasResolvedItemOfType = (ret, resolutionType) => {
    const items = Array.isArray(ret.items) ? ret.items : [ret];
    return items.some(
      (item) =>
        normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status) === "completed" &&
        normalizeResolutionType(item.resolutionType || item.resolution_type) === resolutionType
    );
  };
  const resolvedRefundUsd = relatedReturns
    .filter((ret) => returnHasResolvedItemOfType(ret, "refund"))
    .reduce((sum, item) => sum + getClaimAmount(item, "refund").usd, 0);
  const resolvedRefundKhr = relatedReturns
    .filter((ret) => returnHasResolvedItemOfType(ret, "refund"))
    .reduce((sum, item) => sum + getClaimAmount(item, "refund").khr, 0);
  const resolvedCreditUsd = relatedReturns
    .filter((ret) => returnHasResolvedItemOfType(ret, "credit_note"))
    .reduce((sum, item) => sum + getClaimAmount(item, "credit_note").usd, 0);
  const resolvedCreditKhr = relatedReturns
    .filter((ret) => returnHasResolvedItemOfType(ret, "credit_note"))
    .reduce((sum, item) => sum + getClaimAmount(item, "credit_note").khr, 0);
  const grandTotalUsd = Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0);
  const grandTotalKhr = Number(purchase.grandTotalKhr ?? 0);
  // credit_note deliberately excluded from netCost/"ចំណាយពិត": it creates a PORTABLE credit for a
  // DIFFERENT, later purchase (see Supplier Credit Balance), not an immediate reduction to THIS
  // purchase's own true cost — that only happens once/if the credit is actually applied elsewhere
  // (shown there via creditAppliedUsd/khr instead). Only a resolved refund is a genuine reduction
  // to what THIS purchase cost. Shown as its own separate, informational box below instead of
  // folded into the same deduction total — see hasResolvedCreditNote.
  const netCostUsd = Math.max(0, grandTotalUsd - resolvedRefundUsd);
  const netCostKhr = Math.max(0, grandTotalKhr - resolvedRefundKhr);
  const hasSupplierDeduction = resolvedRefundUsd > 0 || resolvedRefundKhr > 0;
  const hasResolvedCreditNote = resolvedCreditUsd > 0 || resolvedCreditKhr > 0;
  const deductionLabel = "ការសងពី អ្នកផ្គត់ផ្គង់";
  // Adapt which summary boxes actually apply to this purchase's payment mode, instead of
  // always showing every box regardless of relevance:
  // - Discount/delivery boxes are only worth a slot when non-zero.
  // - "នៅសល់" (remaining) is always 0 for full "prepaid" (paid in full up front) — not
  //   informative there, but still meaningful for pay_after_check and partial_prepaid.
  // - The supplier-deduction/"actual cost" pair only makes sense where a formal money claim
  //   (refund/credit_note) can exist against an already-paid amount — pay_after_check simply
  //   never bills for damaged units in the first place, so there's nothing to deduct here.
  const hasDiscount = Number(purchase.discountTotalUsd ?? purchase.discountTotal ?? 0) > 0 || Number(purchase.discountTotalKhr ?? 0) > 0;
  const hasDeliveryFee = Number(purchase.deliveryFeeUsd ?? purchase.deliveryFee ?? 0) > 0 || Number(purchase.deliveryFeeKhr ?? 0) > 0;
  // Supplier credit applied at creation (from an earlier, different purchase's resolved
  // credit_note claim — see Supplier Credit Balance) — reduces how much cash was actually paid
  // here, distinct from discount/delivery which change the grand total itself.
  const hasCreditApplied = Number(purchase.creditAppliedUsd ?? 0) > 0 || Number(purchase.creditAppliedKhr ?? 0) > 0;
  // pay_after_check never bills damaged units at all (grand total is computed off acceptedQty,
  // not invoicedQty, once goods are checked), so there's no refund/credit claim to show in the
  // deduction box above — but that silence reads as if the damage was never accounted for. Show
  // what was excluded explicitly instead of leaving "តម្លៃសរុប" looking unexplained.
  const damagedItems = purchase.items.filter((item) => Number(item.damagedQty || 0) > 0);
  const totalDamagedQty = damagedItems.reduce((total, item) => total + Number(item.damagedQty || 0), 0);
  // claimUnit (derived from claimItems, i.e. claimQty > 0) is empty here — pay_after_check has no
  // formal claim to file over damaged units, so it falls back to the English placeholder "unit".
  // Use the damaged item's own unitName instead so this stays in Khmer like the rest of the modal.
  const damagedUnit = damagedItems[0]?.unitName || "";
  const totalDamagedValueUsd = purchase.items.reduce(
    (total, item) => total + Number(item.damagedQty || 0) * Number(item.unitCost ?? item.unitCostUsd ?? 0),
    0
  );
  const totalDamagedValueKhr = purchase.items.reduce(
    (total, item) => total + Number(item.damagedQty || 0) * Number(item.unitCostKhr ?? 0),
    0
  );
  const hasPayAfterCheckDamage = purchase.paymentMode === "pay_after_check" && totalDamagedQty > 0;
  const hasOutstandingBalance = Number(purchase.balanceAmountUsd ?? purchase.balanceAmount ?? 0) > 0.001 || Number(purchase.balanceAmountKhr ?? 0) > 1;
  const showRemainingBalance = purchase.paymentMode !== "prepaid" || hasOutstandingBalance;

  return (
    <ModalShell
      title={`ព័ត៌មានការទិញ: ${purchase.purchaseNo}`}
      subtitle="មើលព័ត៌មានការទិញ, ទំនិញ, ការទាមទារ អ្នកផ្គត់ផ្គង់ និងការចូលស្តុក។"
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បិទ
          </button>
          {canCreateClaim && (
            <button
              type="button"
              onClick={onReturn}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <FiRotateCcw /> ការទាមទារ / ត្រឡប់ទំនិញ
            </button>
          )}
          {replacementReturn && (
            <button
              type="button"
              onClick={() => onReceiveReplacement?.(replacementReturn)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <FiTruck /> ទទួលទំនិញជំនួស
            </button>
          )}
          {moneyReturn && openMoneyItemsInReturn.length === 1 && (
            <button
              type="button"
              onClick={() => onResolveClaim?.(moneyReturn, openMoneyItemsInReturn[0])}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <FiDollarSign />
              {normalizeResolutionType(openMoneyItemsInReturn[0].resolutionType || openMoneyItemsInReturn[0].resolution_type) === "refund"
                ? "បញ្ជាក់ការសង"
                : "បញ្ចប់កាត់លុយលើកក្រោយ"}
            </button>
          )}
          {(purchase.paymentMode === "pay_after_check" || purchase.paymentMode === "partial_prepaid") && purchase.paymentStatus !== "paid" && effectiveStatus !== STATUS.CANCELLED && (
            <button
              type="button"
              onClick={onRecordPayment}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
            >
              <FiCreditCard /> កត់ការទូទាត់
            </button>
          )}
          <button
            type="button"
            onClick={onConfirmStockIn}
            disabled={!canOpenInventory}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheckCircle /> បើក ស្តុក
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormSection title="ទិដ្ឋភាពទូទៅ" subtitle="អ្នកផ្គត់ផ្គង់, កាលបរិច្ឆេទ, ស្ថានភាព និងរបៀបទូទាត់។" icon={<FiShoppingCart />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(() => {
                // A field list rendered into a 2-column grid leaves the last cell alone (with
                // an awkward empty gap next to it) whenever the count is odd. Compute that
                // per-render instead of hand-fixing it each time a field is added or removed.
                const overviewFields = [
                  { key: "purchaseNo", label: "លេខការទិញ", content: purchase.purchaseNo },
                  {
                    key: "status",
                    // Raw status can still read PENDING_CLAIM ("រង់ចាំការទាមទារ") even after the claim
                    // has already been agreed and the replacement fully received but not yet stocked
                    // in — problemLabel surfaces that true sub-state instead of implying the claim
                    // decision itself is still outstanding. Mirrors the Receive tab's row treatment.
                    label: "ស្ថានភាព",
                    content: (() => {
                      // Once a claim is fully resolved with only stock-in left pending,
                      // effectiveStatus moves off PENDING_CLAIM entirely, so statusBadge never
                      // reaches its "overrode" (purple) branch — problemLabel then carries this
                      // exact "ដោះស្រាយរួច ចាំបញ្ជាក់ស្តុកចូល" text instead, previously shown as plain
                      // red text below a generic blue badge. Match the same purple-pill-above-badge
                      // treatment used in the Purchases-tab list for this identical state.
                      // Broader than "ចាំបញ្ជាក់ស្តុកចូល" alone — also matches the replacement-already-
                      // stocked-in fallback label ("ទំនិញជំនួសថ្មីបញ្ជាក់ស្តុកចូលរួចរាល់"), which shares
                      // "បញ្ជាក់ស្តុកចូល" but not the leading "ចាំ".
                      const isPendingStockInAfterResolution = !statusBadge?.overrode && problemLabel.includes("បញ្ជាក់ស្តុកចូល");
                      return (
                        <div className="flex flex-col items-start gap-1">
                          {isPendingStockInAfterResolution && (
                            <span className="flex w-fit items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                              {/* The badge right below already reads "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន", so
                                  the money-claim label drops the redundant suffix — but the
                                  replacement label ("ដោះស្រាយរួច ...") keeps it, since "ដោះស្រាយរួច"
                                  alone reads as fully done, misleadingly, while stock-in is still
                                  outstanding. */}
                              <FiCheckCircle />{" "}
                              {problemLabel.startsWith("ដោះស្រាយរួច") ? problemLabel : problemLabel.replace(/ ចាំបញ្ជាក់ស្តុកចូល$/, "")}
                            </span>
                          )}
                          {statusBadge ? (
                            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                              {statusBadge.icon}
                              {isPendingStockInAfterResolution ? "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន" : statusBadge.label}
                            </span>
                          ) : (
                            <StatusBadge status={effectiveStatus} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
                          )}
                          {/* A claim (money or replacement) can already be resolved/in-progress
                              (statusBadge.overrode true, e.g. "Credit Note ចប់ស្រេច") while the
                              accepted/usable portion of this same purchase independently still
                              waits on its own stock-in confirmation. Mirrors PurchaseTable's
                              hasSeparatePendingStockIn pill — without it, this view silently
                              dropped the blue badge the Purchase Orders list already shows. */}
                          {statusBadge?.overrode && hasRemainingStockIn && (
                            <span className="flex w-fit items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                              <FiClock /> រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន
                            </span>
                          )}
                          {!statusBadge?.overrode && problemLabel && !isPendingStockInAfterResolution && (
                            <p className={`text-xs font-semibold ${
                              problemLabel.includes("បានដោះស្រាយ")
                                ? "text-emerald-500"
                                : problemLabel.includes("រង់ចាំបញ្ចូលស្តុក")
                                  ? "text-blue-500"
                                  : "text-red-500"
                            }`}>
                              {problemLabel}
                            </p>
                          )}
                        </div>
                      );
                    })(),
                  },
                  { key: "supplier", label: "អ្នកផ្គត់ផ្គង់", content: purchase.supplierName },
                  { key: "purchaseDate", label: "កាលបរិច្ឆេទទិញ", content: purchase.purchaseDate },
                  // Only shown once a delivery method is actually recorded — older purchases with
                  // no deliveryOption saved would otherwise show an empty/misleading pill here.
                  // Previously this info existed only inside the Add-Purchase form itself; the
                  // view-detail screen showed nothing but a bare "ថ្លៃដឹក $X" figure with no
                  // indication of who delivers or whether a fee even applies.
                  ...(formatDeliveryOption(purchase.deliveryOption)
                    ? [
                        {
                          key: "delivery",
                          label: "ការដឹកទំនិញ",
                          content: (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                <FiTruck />
                                {formatDeliveryOption(purchase.deliveryOption)}
                              </span>
                              <span className={`text-xs font-semibold ${hasDeliveryFee ? "text-amber-600" : "text-emerald-600"}`}>
                                {hasDeliveryFee
                                  ? `គិតថ្លៃដឹក ${formatCurrencyPair(purchase.deliveryFeeUsd ?? purchase.deliveryFee, purchase.deliveryFeeKhr)}`
                                  : "ឥតគិតថ្លៃដឹក"}
                              </span>
                            </div>
                          ),
                        },
                      ]
                    : []),
                  {
                    key: "paymentMode",
                    label: "របៀបទូទាត់",
                    content: (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        <FiCreditCard />
                        {formatPaymentMode(purchase.paymentMode)}
                      </span>
                    ),
                  },
                  {
                    key: "paymentStatus",
                    label: "ស្ថានភាពទូទាត់",
                    content: (
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          purchase.paymentStatus === "paid"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : purchase.paymentStatus === "partial"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {purchase.paymentStatus === "paid" ? <FiCheckCircle /> : purchase.paymentStatus === "partial" ? <FiClock /> : <FiAlertTriangle />}
                        {PAYMENT_STATUS_KH[purchase.paymentStatus] || purchase.paymentStatus}
                      </span>
                    ),
                  },
                  { key: "exchangeRate", label: "អត្រាប្ដូររូបិយប័ណ្ណ", content: `1 USD = KHR ${Number(purchase.exchangeRateUsed || 0).toLocaleString()}` },
                ];
                const isLastAlone = overviewFields.length % 2 === 1;

                return overviewFields.map((field, index) => {
                  // The status field's problemLabel sub-line is a full sentence — in the normal
                  // half-width cell it wraps awkwardly (e.g. breaking right before the last word).
                  // Give it the full row width instead of trying to fit it in half.
                  const spanFull = (isLastAlone && index === overviewFields.length - 1) || (field.key === "status" && Boolean(problemLabel));
                  return (
                    <div key={field.key} className={spanFull ? "sm:col-span-2" : undefined}>
                      <p className="text-xs font-semibold text-zinc-500">{field.label}</p>
                      <div className="mt-1 text-sm">{field.content || "-"}</div>
                    </div>
                  );
                });
              })()}
            </div>
          </FormSection>

          <FormSection
            title="សង្ខេបការទូទាត់"
            subtitle={
              purchase.paymentMode === "pay_after_check"
                ? "បង់តែចំនួនទទួលយក បន្ទាប់ពីពិនិត្យ។"
                : purchase.paymentMode === "partial_prepaid"
                  ? "បង់ជាមុនមួយផ្នែក — សមតុល្យនៅសល់គណនាបន្ទាប់ពីកាត់ការទាមទារ។"
                  : "ចំនួនកម្មង់ និងប្រាក់នៅសល់។"
            }
            icon={<FiDollarSign />}
            theme={theme}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(hasDiscount || hasDeliveryFee) && (
                <SummaryMiniBox theme={theme} label="តម្លៃមុនបញ្ចុះ" value={formatCurrencyPair(purchase.subtotalUsd ?? purchase.subtotal, purchase.subtotalKhr)} />
              )}
              {hasDiscount && (
                <SummaryMiniBox theme={theme} label="បញ្ចុះតម្លៃ" value={`-${formatCurrencyPair(purchase.discountTotalUsd ?? purchase.discountTotal, purchase.discountTotalKhr)}`} colorClass="text-amber-500" />
              )}
              {hasDeliveryFee && (
                <SummaryMiniBox theme={theme} label="ថ្លៃដឹក" value={formatCurrencyPair(purchase.deliveryFeeUsd ?? purchase.deliveryFee, purchase.deliveryFeeKhr)} />
              )}
              {/* Built inline instead of SummaryMiniBox — the source-purchase breakdown needs to
                  nest INSIDE this same half-width box, not sit as a separate full-width sibling
                  row below it (that used to leave an empty gap next to the box, and the long
                  breakdown line stuck out awkwardly on its own). */}
              {hasCreditApplied && (
                <div className={`rounded-xl border p-4 ${theme.softCard}`}>
                  <p className={`text-xs font-semibold ${theme.muted}`}>លុយកាត់លើកក្រោយបានប្រើ</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-500">{formatCreditAppliedAmount(purchase)}</p>
                  {Array.isArray(purchase.usedCredits) && purchase.usedCredits.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-dashed border-zinc-200 pt-2 dark:border-white/10">
                      {purchase.usedCredits.map((credit) => (
                        <p key={credit.id} className={`text-xs ${theme.muted}`}>
                          ចេញពីការទិញ #{credit.sourcePurchaseNo || "-"}
                          {/* Amount only shown when there's more than one source — with just one,
                              it would just repeat the exact same figure shown right above. */}
                          {purchase.usedCredits.length > 1 && ` · ${formatAmountInCurrency(credit.amountUsd, credit.amountKhr, purchase.creditAppliedCurrency)}`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <SummaryMiniBox theme={theme} label="តម្លៃសរុប" value={formatCurrencyPair(purchase.grandTotalUsd ?? purchase.grandTotal, purchase.grandTotalKhr)} />
              <SummaryMiniBox theme={theme} label="បានបង់" value={formatCurrencyPair(purchase.paidAmountUsd ?? purchase.paidAmount, purchase.paidAmountKhr)} colorClass="text-emerald-500" />
              {showRemainingBalance && (
                <div className="col-span-2">
                  <SummaryMiniBox
                    theme={theme}
                    label="នៅសល់"
                    value={formatCurrencyPair(purchase.balanceAmountUsd ?? purchase.balanceAmount, purchase.balanceAmountKhr)}
                    strong
                    colorClass={hasOutstandingBalance ? "text-amber-500" : "text-emerald-500"}
                  />
                </div>
              )}
              {hasPayAfterCheckDamage && (
                <>
                  <div className="col-span-2 border-t border-dashed border-zinc-200 dark:border-white/10" />
                  <div className="col-span-2">
                    <SummaryMiniBox
                      theme={theme}
                      label={`ខូចខាតដកចេញពីវិក្កយបត្រ (${totalDamagedQty} ${damagedUnit})`}
                      value={`-${formatCurrencyPair(totalDamagedValueUsd, totalDamagedValueKhr)}`}
                      colorClass="text-amber-500"
                    />
                  </div>
                </>
              )}
              {hasSupplierDeduction && purchase.paymentMode !== "pay_after_check" && (
                <>
                  <div className="col-span-2 border-t border-dashed border-zinc-200 dark:border-white/10" />
                  <SummaryMiniBox
                    theme={theme}
                    label={deductionLabel}
                    value={`-${formatCurrencyPair(resolvedRefundUsd, resolvedRefundKhr)}`}
                    colorClass="text-amber-500"
                  />
                  <SummaryMiniBox
                    theme={theme}
                    label="ចំណាយពិត"
                    value={formatCurrencyPair(netCostUsd, netCostKhr)}
                    colorClass="text-emerald-500"
                  />
                </>
              )}
              {hasResolvedCreditNote && purchase.paymentMode !== "pay_after_check" && (
                <>
                  <div className="col-span-2 border-t border-dashed border-zinc-200 dark:border-white/10" />
                  <div className="col-span-2">
                    {/* Informational only — deliberately NOT subtracted from "ចំណាយពិត" above, since
                        this credit is reserved for a DIFFERENT, later purchase (see Supplier
                        Credit Balance), not a reduction to this purchase's own cost. */}
                    <SummaryMiniBox
                      theme={theme}
                      label="លុយកាត់លើកក្រោយចេញ (មិនទាន់ប្រើ)"
                      value={formatCurrencyPair(resolvedCreditUsd, resolvedCreditKhr)}
                      colorClass="text-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </FormSection>

          {Array.isArray(purchase.payments) && purchase.payments.length > 0 && (
            <FormSection
              title="ប្រវត្តិទូទាត់"
              subtitle="ការទូទាត់នីមួយៗដែលបានកត់ត្រាសម្រាប់ការទិញនេះ។"
              icon={<FiCreditCard />}
              theme={theme}
            >
              <div className="space-y-2">
                {purchase.payments.map((payment) => (
                  <div key={payment.id} className={`flex items-center justify-between rounded-xl border p-3 ${theme.softCard}`}>
                    <div className="flex items-center gap-3">
                      <div className="table-icon-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <FiCreditCard size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{formatDateTimeLocal(payment.paidAt)}</p>
                        {payment.receiverName && (
                          <p className={`text-xs ${theme.muted}`}>{payment.receiverName}</p>
                        )}
                        {payment.note && (
                          <p className={`text-xs ${theme.muted}`}>{payment.note}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-500">
                      {formatAmountInCurrency(payment.amountUsd, payment.amountKhr, payment.paidCurrency)}
                    </p>
                  </div>
                ))}
              </div>
            </FormSection>
          )}

          <FormSection title="ស្ថានភាពលំហូរ" subtitle="សកម្មភាពណែនាំ។" icon={<FiInfo />} theme={theme}>
            <FlowTimeline
              status={effectiveStatus}
              theme={theme}
              paymentMode={purchase.paymentMode}
              hasClaimStep={totalClaimQty > 0 || effectiveStatus === STATUS.PENDING_CLAIM}
              pendingReplacementQty={pendingReplacementQty}
            />
            <div
              className={`mt-4 rounded-xl p-4 text-sm leading-6 ${
                effectiveStatus === STATUS.RECEIVED
                  ? pendingReplacementQty > 0
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : effectiveStatus === STATUS.CANCELLED
                    ? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {effectiveStatus === STATUS.PENDING_RECEIVE && "បន្ទាប់: ទទួលទំនិញ និងបំពេញចំនួនខូច / ទទួលយក។"}
              {effectiveStatus === STATUS.PENDING_CLAIM && (hasRemainingStockIn ? "បន្ទាប់: បញ្ជាក់ចំនួនទទួលយកក្នុង ស្តុក, និងបង្កើតការទាមទារ អ្នកផ្គត់ផ្គង់ សម្រាប់ទំនិញខូច។" : "បន្ទាប់: បង្កើតការទាមទារ អ្នកផ្គត់ផ្គង់ សម្រាប់ទំនិញខូចដែលបានបង់ជាមុន ។")}
              {effectiveStatus === STATUS.PENDING_STOCK_IN && (purchase.paymentMode === "partial_prepaid" && purchase.paymentStatus !== "paid"
                ? "បន្ទាប់: បើកការទិញក្នុងស្តុក និងកត់ការទូទាត់ balance ដែលនៅសល់។"
                : "បន្ទាប់: បើកការទិញនេះក្នុង ស្តុក ហើយបញ្ជាក់ចូលស្តុកម្ដង — តែចំនួនទទួលយកប៉ុណ្ណោះ។")}
              {effectiveStatus === STATUS.RECEIVED && (
                pendingReplacementQty > 0
                  ? `បន្ទាប់: ទំនិញដើមចូលស្តុករួច ប៉ុន្តែនៅមានទំនិញជំនួស ${pendingReplacementQty} ឯកតា ដែលទទួលរួចហើយ ត្រូវបញ្ជាក់ចូលស្តុកបន្ថែម។`
                  : "បានបញ្ចប់: ការទិញនេះបានចូលស្តុករួចហើយ។"
              )}
              {effectiveStatus === STATUS.DRAFT && "បន្ទាប់: បន្តកែ ហើយរក្សាទុកការទិញ។"}
              {effectiveStatus === STATUS.CANCELLED && "ការទិញនេះត្រូវបានលុបចោល។"}
            </div>
          </FormSection>
        </div>

        <FormSection title="ទំនិញការទិញ" subtitle="ចំនួនកម្មង់, បង់, ទទួល, ខូច, ទទួលយក, ទាមទារ និងផុតកំណត់។" icon={<FiPackage />} theme={theme}>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-3 py-3 text-left">ទំនិញ</th>
                  <th className="px-3 py-3 text-left">តម្លៃដើម</th>
                  <th className="px-3 py-3 text-left">វិក្កយបត្រ</th>
                  <th className="px-3 py-3 text-left">បង់</th>
                  <th className="px-3 py-3 text-left">ទទួល</th>
                  <th className="px-3 py-3 text-left">ទទួលយក</th>
                  <th className="px-3 py-3 text-left">ខូចខាត</th>
                  <th className="min-w-[140px] px-3 py-3 text-left">ទាមទារ</th>
                  {purchase.paymentMode === "partial_prepaid" && (
                    <th className="px-3 py-3 text-left">ទឹកប្រាក់នៅខ្វះ</th>
                  )}
                  <th className="px-3 py-3 text-left">ស្តុកចូល</th>
                  <th className="px-3 py-3 text-left">ផុតកំណត់</th>
                  <th className="px-3 py-3 text-left">សរុប</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item) => {
                  const acceptedQty = Number(item.acceptedQty || 0);
                  const stockedInQty = Number(item.stockedInQty || 0);
                  const isFullyStockedIn = acceptedQty > 0 && stockedInQty >= acceptedQty;
                  const claimResolution = getItemClaimResolution(item);
                  return (
                  <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                    <td className="px-3 py-3">
                      <p className="font-semibold">{item.variantName}</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        {item.variantCode} - {item.unitName} = {item.conversionQty} {item.baseUnit}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">${Number(item.unitCost ?? item.unitCostUsd ?? 0).toFixed(2)}</p>
                      <p className={`text-xs ${theme.muted}`}>ក្នុងមួយ{item.unitName}</p>
                    </td>
                    <td className="px-3 py-3">{item.invoicedQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.paidQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.receivedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-emerald-500">{item.acceptedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-amber-500">{item.damagedQty} {item.unitName}</td>
                    <td className="px-3 py-3">
                      <p className="whitespace-nowrap font-semibold text-red-500">
                        {claimResolution?.qty ?? item.claimQty} {item.unitName}
                      </p>
                      {claimResolution && (
                        <span
                          className={`mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                            claimResolution.isResolved
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {claimResolution.label}
                        </span>
                      )}
                    </td>
                    {purchase.paymentMode === "partial_prepaid" && (() => {
                      const purchaseGrandUsd = Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0);
                      const purchaseBalUsd = Number(purchase.balanceAmountUsd ?? purchase.balanceAmount ?? purchaseGrandUsd);
                      const purchaseBalKhr = Number(purchase.balanceAmountKhr ?? 0);
                      const itemTotalUsd = Number(item.lineTotalUsd ?? item.lineTotal ?? 0);
                      const ratio = purchaseGrandUsd > 0 ? itemTotalUsd / purchaseGrandUsd : 0;
                      const balUsd = Math.max(0, ratio * purchaseBalUsd);
                      const balKhr = Math.max(0, ratio * purchaseBalKhr);
                      return (
                        <td className={`px-3 py-3 font-semibold ${balUsd > 0.001 ? "text-amber-500" : "text-emerald-500"}`}>
                          {formatCurrencyPair(balUsd, balKhr)}
                        </td>
                      );
                    })()}
                    <td className="px-3 py-3">
                      {acceptedQty > 0 ? (
                        <>
                          <p className={`font-semibold ${isFullyStockedIn ? "text-emerald-500" : "text-amber-500"}`}>
                            {stockedInQty}/{acceptedQty} {item.unitName}
                          </p>
                          <p className={`text-xs ${theme.muted}`}>{isFullyStockedIn ? "ស្តុកចូលរួចរាល់អស់" : "រង់ចាំស្តុកចូល"}</p>
                        </>
                      ) : (
                        <span className={theme.muted}>-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{formatDateOnly(item.expiredDate)}</td>
                    <td className="px-3 py-3 font-semibold">{formatCurrencyPair(item.lineTotalUsd ?? item.lineTotal, item.lineTotalKhr)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FormSection>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FormSection title="ការទាមទារ / ត្រឡប់ទំនិញ" subtitle="ការដោះស្រាយ — ជំនួស, ការសង, ឬ កាត់លុយលើកក្រោយ ពីអ្នកផ្គត់ផ្គង់ ។" icon={<FiRotateCcw />} theme={theme}>
            {relatedReturns.length === 0 ? (
              <EmptyState
                theme={theme}
                icon={<FiRotateCcw />}
                title={totalClaimQty > 0 ? `ត្រូវការទាមទារ: ${totalClaimQty} ${claimUnit}` : "គ្មានការទាមទារ"}
                description={
                  totalClaimQty > 0
                    ? "បង្កើតការទាមទារ អ្នកផ្គត់ផ្គង់ សម្រាប់ជំនួស, ការសង, ឬ កាត់លុយលើកក្រោយ — ការទិញនេះមិនទាន់ដោះស្រាយ។"
                    : "គ្មានការត្រឡប់ ឬការទាមទារ អ្នកផ្គត់ផ្គង់ សម្រាប់ការទិញនេះ។"
                }
              />
            ) : (
              <div className="space-y-3">
                {relatedReturns.map((item) => {
                  const isReplacementItem = normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement";
                  const { receivedQty, remainingQty } = getReplacementReceiveProgress(item);
                  const isReplacementIncomplete = isReplacementItem && remainingQty > 0;
                  // item.resolutionType is this card's own RETURN-level rollup — reads "mixed" for
                  // a mixed claim and would hide the resolve button entirely below (the old check
                  // gated directly on item.resolutionType === "refund"/"credit_note", which never
                  // matched "mixed"). Compute the return's own still-open money items instead.
                  const cardItems = Array.isArray(item.items) ? item.items : [];
                  const openMoneyItemsInCard = cardItems.filter((subItem) => {
                    const status = normalizeReturnStatus(subItem.status || subItem.resolutionStatus || subItem.resolution_status);
                    const type = normalizeResolutionType(subItem.resolutionType || subItem.resolution_type);
                    return ["refund", "credit_note"].includes(type) && !["completed", "cancelled"].includes(status);
                  });
                  // Color/icon per resolution type, matching the palette already used for this same
                  // distinction elsewhere (ResolveMoneyClaimModal's refund/credit badges, the purple
                  // used for replacement's "receive" button below) — so this card reads as a badge
                  // pair at a glance instead of a plain "ខូចខាត · សងលុយ" text line.
                  const cardResolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
                  const resolutionBadgeStyleFor = (type) =>
                    ({
                      replacement: { icon: <FiTruck size={10} />, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                      refund: { icon: <FiDollarSign size={10} />, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                      credit_note: { icon: <FiCreditCard size={10} />, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                    })[type] || { icon: <FiPackage size={10} />, color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" };
                  // "mixed" is the return-level rollup for "this return's items don't all share one
                  // resolution type" — showing that word itself explains nothing. Break it back down
                  // into the actual distinct types it's mixing (e.g. ជំនួសទំនិញថ្មី + សងលុយ), one
                  // badge each, instead of one opaque "mixed" pill.
                  const cardResolutionTypes =
                    cardResolutionType === "mixed"
                      ? Array.from(
                          new Set(
                            cardItems
                              .map((subItem) => normalizeResolutionType(subItem.resolutionType || subItem.resolution_type))
                              .filter((type) => ["replacement", "refund", "credit_note"].includes(type))
                          )
                        )
                      : [cardResolutionType];
                  return (
                  <div key={item.id} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold">{item.purchaseReturnNo}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                            <FiAlertTriangle size={10} /> {formatCondition(item.returnReason)}
                          </span>
                          {cardResolutionTypes.map((type) => {
                            const style = resolutionBadgeStyleFor(type);
                            return (
                              <span key={type} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.color}`}>
                                {style.icon} {formatResolutionType(type)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      {isReplacementIncomplete ? (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                          <FiTruck />
                          {receivedQty > 0 ? `នៅសល់ត្រូវទទួល ${remainingQty}` : "រង់ចាំដំណោះស្រាយ"}
                        </span>
                      ) : (
                        <StatusBadge status={item.status} getStatusClass={getPurchaseReturnStatusClass} getStatusIcon={getPurchaseReturnStatusIcon} />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold">{formatCurrencyPair(item.subtotalUsd ?? item.subtotal, item.subtotalKhr)}</p>
                    {Array.isArray(item.items) && item.items.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {item.items.map((returnItem, index) => {
                          const returnItemPurchaseItemId =
                            returnItem.purchase_item_id ?? returnItem.purchaseItemId ?? returnItem.purchaseItem?.id ?? returnItem.purchase_item?.id ?? "";
                          const matchedPurchaseItem = purchase.items.find((pi) => String(pi.id) === String(returnItemPurchaseItemId));
                          const qty = Number(returnItem.qty ?? returnItem.qty_returned ?? returnItem.qtyReturned ?? 0);
                          return (
                            <li key={returnItem.id ?? index} className={`flex items-center justify-between gap-2 ${theme.muted}`}>
                              <span className="truncate">{matchedPurchaseItem?.variantName || "-"}</span>
                              <span className="shrink-0 font-semibold">{qty} {matchedPurchaseItem?.unitName || ""}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>{item.note || "-"}</p>
                    {isReplacementItem &&
                      normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status) !== "cancelled" &&
                      remainingQty > 0 && (
                        <button
                          type="button"
                          onClick={() => onReceiveReplacement?.(item)}
                          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                        >
                          <FiTruck /> ទទួលទំនិញជំនួស
                        </button>
                      )}
                    {openMoneyItemsInCard.length === 1 && (
                      <button
                        type="button"
                        onClick={() => onResolveClaim?.(item, openMoneyItemsInCard[0])}
                        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                      >
                        <FiDollarSign />
                        {normalizeResolutionType(openMoneyItemsInCard[0].resolutionType || openMoneyItemsInCard[0].resolution_type) === "refund"
                          ? "បញ្ជាក់ការសង"
                          : "បញ្ចប់កាត់លុយលើកក្រោយ"}
                      </button>
                    )}
                    {openMoneyItemsInCard.length > 1 && (
                      <p className={`mt-4 text-xs leading-5 ${theme.muted}`}>
                        មានទំនិញ {openMoneyItemsInCard.length} កំពុងរង់ចាំសង/កាត់លុយលើកក្រោយ ដាច់ដោយឡែក — ចូល Tab
                        "ការទាមទារ" ដើម្បីដោះស្រាយម្តងមួយៗ។
                      </p>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </FormSection>

          <FormSection title="ចលនាស្តុក" subtitle="បង្កើតបន្ទាប់ពីបញ្ជាក់ ស្តុក។" icon={<FiPackage />} theme={theme}>
            {relatedMovements.length === 0 ? (
              pendingStockInItems.length > 0 ? (
                <div className={`rounded-2xl border border-dashed p-4 ${theme.softCard}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl text-red-500"><FiPackage /></div>
                    <div>
                      <p className="text-sm font-semibold">រង់ចាំបញ្ជាក់ស្តុកចូល</p>
                      <p className={`text-xs ${theme.muted}`}>ចំនួនទទួលយករួចរាល់, ប៉ុន្តែចលនាស្តុកនឹងបង្កើតតែបន្ទាប់ពីបញ្ជាក់ ស្តុក ប៉ុណ្ណោះ។</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {pendingStockInItems.map((entry, index) => (
                      <li key={index} className="flex items-center justify-between gap-2">
                        <span className="truncate">{entry.variantName}</span>
                        <span className="shrink-0 font-semibold text-amber-500">{entry.baseQty} {entry.baseUnit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyState
                  theme={theme}
                  icon={<FiPackage />}
                  title="គ្មានចលនាស្តុក"
                  description="ចលនាស្តុកនឹងបង្ហាញបន្ទាប់ពីបញ្ជាក់ ស្តុក។"
                />
              )
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left">ផលិតផល</th>
                      <th className="px-3 py-3 text-left">ចំនួន</th>
                      <th className="px-3 py-3 text-left">កំណត់ចំណាំ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedMovements.map((item) => (
                      <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                        <td className="px-3 py-3 font-semibold">{item.variantName}</td>
                        <td className="px-3 py-3 font-semibold text-emerald-500">+{item.qtyBase}</td>
                        <td className={`px-3 py-3 ${theme.muted}`}>{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FormSection>
        </div>
      </div>
    </ModalShell>
  );
}

export function FlowTimeline({ status, theme, paymentMode = "", hasClaimStep = false, pendingReplacementQty = 0 }) {
  const isPayAfterCheck = paymentMode === "pay_after_check";
  // Stock-in of accepted qty and claim creation for damaged qty happen in parallel in
  // practice (shop sells the good units immediately, claims the rest later) — show them
  // as one combined step instead of a strict claim-then-stock-in sequence.
  const steps = [
    { key: STATUS.DRAFT, statuses: [STATUS.DRAFT], label: STATUS_LABEL[STATUS.DRAFT] },
    ...(isPayAfterCheck ? [] : [{ key: STATUS.PENDING_RECEIVE, statuses: [STATUS.PENDING_RECEIVE], label: STATUS_LABEL[STATUS.PENDING_RECEIVE] }]),
    hasClaimStep
      ? { key: "stock_in_claim", statuses: [STATUS.PENDING_CLAIM, STATUS.PENDING_STOCK_IN], label: "បញ្ចូលស្តុក / ដោះស្រាយការទាមទារ" }
      : { key: STATUS.PENDING_STOCK_IN, statuses: [STATUS.PENDING_STOCK_IN], label: STATUS_LABEL[STATUS.PENDING_STOCK_IN] },
    { key: STATUS.RECEIVED, statuses: [STATUS.RECEIVED], label: STATUS_LABEL[STATUS.RECEIVED] },
  ];
  const currentIndex = steps.findIndex((step) => step.statuses.includes(status));

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const active = step.statuses.includes(status);
        const done = currentIndex > index;
        // Overall status can already read RECEIVED while replacement units received via a
        // claim are still waiting to be stocked in — don't show the last step as fully done.
        const isReceivedStepPending = step.key === STATUS.RECEIVED && active && pendingReplacementQty > 0;
        const isCompletedStep = active && step.key === STATUS.RECEIVED && !isReceivedStepPending;

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                isCompletedStep
                  ? "bg-emerald-500 text-white"
                  : isReceivedStepPending
                    ? "bg-amber-500 text-white"
                    : active
                  ? "bg-red-500 text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"
              }`}
            >
              {done ? <FiCheckCircle /> : index + 1}
            </div>
            <div>
              <p className={`text-sm ${isCompletedStep ? "font-bold text-emerald-500" : isReceivedStepPending ? "font-bold text-amber-500" : active ? "font-bold text-red-500" : theme.muted}`}>{step.label}</p>
              {isReceivedStepPending && (
                <p className="text-xs text-amber-500">រង់ចាំបញ្ជាក់ស្តុកចូល {pendingReplacementQty} ទំនិញជំនួស</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
