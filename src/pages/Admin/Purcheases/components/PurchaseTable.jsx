import React from "react";
import {
  FiAlertTriangle,
  FiArrowRightCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiRotateCcw,
  FiSearch,
  FiShoppingCart,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { STATUS } from "../utils/purchaseConstants";
import { formatActualPaidAmount, formatCurrencyPair, formatPaymentMode, getPurchaseItemSummary } from "../utils/purchaseUtils";
import { EmptyState, StatusBadge, SummaryMiniBox } from "./PurchaseCommon";
import PermissionGate from "../../../../components/PermissionGate";

const getPurchaseLines = (purchase = {}) => {
  const items = Array.isArray(purchase.items) ? purchase.items : [];
  if (items.length > 0) return items;
  return Array.isArray(purchase.summaryItems) ? purchase.summaryItems : [];
};

const getRemainingStockInQty = (item = {}) => {
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

const hasRemainingStockInQty = (purchase = {}) =>
  getPurchaseLines(purchase).some((item) => getRemainingStockInQty(item) > 0);

const hasClaimQty = (purchase = {}) =>
  getPurchaseLines(purchase).some((item) => Number(item.claimQty ?? item.claim_qty ?? 0) > 0);

const hasAnyStockedInQty = (purchase = {}) =>
  getPurchaseLines(purchase).some((item) => Number(item.stockedInQty ?? item.stocked_in_qty ?? 0) > 0);

const hasAcceptedStockConfirmed = (purchase = {}) =>
  getPurchaseLines(purchase).some((item) => Number(item.acceptedQty ?? item.accepted_qty ?? 0) > 0) &&
  !hasRemainingStockInQty(purchase);

// No resolutionType gate: replacementReceivedQty/replacementStockedInQty are already scoped to
// replacement-type items only by the backend rollup (recomputeReturnRollup), so they're both 0
// for a return with no replacement items regardless of its rollup type — checking
// item.resolutionType === "replacement" here used to read "mixed" for a mixed claim and hide its
// pending stock-in entirely.
const hasPendingReplacementStockIn = (returns = []) =>
  returns.some((item) => {
    const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
    const stockedQty = Number(item.replacementStockedInQty ?? item.replacement_stocked_in_qty ?? 0);
    return receivedQty > stockedQty;
  });

const getNetCostAfterDeduction = (purchase = {}, purchaseReturns = []) => {
  const allReturns = [
    ...(Array.isArray(purchase.returns) ? purchase.returns : []),
    ...purchaseReturns.filter((item) => String(item.purchaseId) === String(purchase.id)),
  ].filter((item, index, list) => list.findIndex((c) => String(c.id) === String(item.id)) === index);
  const normalizeStatus = (v = "") => {
    const s = String(v || "").trim().toLowerCase().replaceAll(" ", "_");
    return s === "resolved" || s === "completed" ? "completed" : s;
  };
  const normalizeType = (v = "") => {
    const t = String(v || "").trim().toLowerCase();
    return t === "credit" ? "credit_note" : t;
  };
  const getClaimAmount = (item = {}) => {
    const claimUsd = Number(item.subtotalUsd ?? item.totalAmountUsd ?? item.total_amount_usd ?? item.subtotal_usd ?? item.subtotal ?? 0);
    const claimKhr = Number(item.subtotalKhr ?? item.totalAmountKhr ?? item.total_amount_khr ?? item.subtotal_khr ?? 0);
    // Unlike the dashboard-level "ចំណាយពិត" (cash paid minus cash refunded), this per-purchase
    // metric is grandTotal-based: it represents this purchase's true final cost, which drops by
    // the FULL claim value regardless of whether that value came back as cash or as an invoice
    // offset. Previously blended in refund_amount_usd/credit_amount_usd (the CASH-only portion,
    // via `Math.min(rawUsd || claimUsd, claimUsd)`) — that only fell back to the full claimUsd when
    // rawUsd was exactly 0 (fully absorbed by the unpaid balance, nothing paid in cash). For a
    // PARTIAL cash refund (claim exceeds the unpaid balance, so part is absorbed and the excess is
    // paid in cash — see the confirmed partial_prepaid flows), rawUsd was nonzero but still less
    // than the full claim, so the fallback never triggered and this understated both the deduction
    // shown here and the resulting "ចំណាយពិត" (e.g. a $64 claim with only $4 paid in cash showed
    // as a $4 deduction instead of $64). The cash-only amount belongs in the cash-settlement UI
    // (ResolveMoneyClaimModal), not here — this metric always wants the gross claim value.
    return {
      usd: claimUsd,
      khr: claimKhr,
    };
  };
  let deductionUsd = 0;
  let deductionKhr = 0;
  for (const item of allReturns) {
    const status = normalizeStatus(item.status || item.resolutionStatus || item.resolution_status);
    const type = normalizeType(item.resolutionType || item.resolution_type);
    if (status !== "completed") continue;
    // credit_note deliberately excluded: unlike refund (real cash back, or an immediate offset
    // against THIS purchase's own balance — either way, a genuine reduction to what THIS purchase
    // actually cost), a resolved credit_note only creates a PORTABLE credit balance for a
    // DIFFERENT, later purchase (see Supplier Credit Balance / PurchaseReturnService::
    // applyItemSettlement) — this purchase's own true cost is unaffected until/unless that credit
    // is actually applied elsewhere. Including it here would double-count the same $32 benefit:
    // once as a lower "ចំណាយពិត" on the SOURCE purchase, and again as a lower one on whichever
    // purchase later applies the credit.
    if (type === "refund") {
      const amount = getClaimAmount(item);
      deductionUsd += amount.usd;
      deductionKhr += amount.khr;
    }
  }
  if (deductionUsd <= 0 && deductionKhr <= 0) return null;
  const gtUsd = Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0);
  const gtKhr = Number(purchase.grandTotalKhr ?? 0);
  return { netUsd: Math.max(0, gtUsd - deductionUsd), netKhr: Math.max(0, gtKhr - deductionKhr) };
};

// Counts actual resolved progress per return ITEM (not the return's own aggregate status) across
// every return related to this purchase — a replacement item's own replacement_received_qty counts
// immediately as partial progress arrives (not gated on resolution_status only reaching "resolved"
// once the FULL claimed qty is in), while a money item (refund/credit_note, which has no partial-
// quantity concept of its own) counts its full qty only once resolved.
const getResolvedDamagedQty = (purchase = {}, purchaseReturns = []) => {
  const relatedReturns = [
    ...(Array.isArray(purchase.returns) ? purchase.returns : []),
    ...purchaseReturns.filter((item) => String(item.purchaseId) === String(purchase.id)),
  ].filter((item, index, list) => list.findIndex((c) => String(c.id) === String(item.id)) === index);

  return relatedReturns.reduce((purchaseTotal, ret) => {
    const items = Array.isArray(ret.items) ? ret.items : [];
    return purchaseTotal + items.reduce((total, item) => {
      const qty = Number(item.qty ?? item.qty_returned ?? item.qtyReturned ?? 0);
      const type = String(item.resolutionType || item.resolution_type || "").trim().toLowerCase();
      if (type === "replacement") {
        const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
        return total + Math.min(qty, receivedQty);
      }
      const status = String(item.resolutionStatus || item.resolution_status || "").trim().toLowerCase();
      return ["resolved", "completed"].includes(status) ? total + qty : total;
    }, 0);
  }, 0);
};

export function PurchaseTable({
  purchases,
  purchaseReturns = [],
  theme,
  getEffectivePurchaseStatus,
  getPurchaseProblemLabel,
  getPurchaseStatusBadge,
  getClaimRequiredCount,
  hasUnresolvedClaimDecision,
  getOpenSupplierClaim,
  getDamagedCount,
  getNextActionLabel,
  getStatusClass,
  getStatusIcon,
  openViewModal,
  openEditModal,
  openReceiveGoodsModal,
  openPurchaseReturnModal,
  handleReceiveReplacement,
  handleResolveSupplierClaim,
  handleConfirmStockIn,
  handleCancelPurchase,
  onContinuePayment,
  simplified = false,
}) {
  const isDark = String(theme?.tableWrap || "").includes("bg-zinc-900");

  if (purchases.length === 0) {
    return (
      <div className={`border-t px-4 py-14 text-center ${theme.row}`}>
        <EmptyState
          theme={theme}
          icon={<FiSearch />}
          title="រកមិនឃើញការទិញ"
          description="ព្យាយាមប្តូរការស្វែងរក ឬតម្រង។"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1.15fr)_11rem] items-center gap-4 bg-red-600 px-5 py-3 text-sm font-semibold text-white">
        <div>ការទិញ / អ្នកផ្គត់ផ្គង់</div>
        <div>ការទូទាត់</div>
        <div>ទំនិញ / ខូចខាត</div>
        <div>សរុប / ស្ថានភាព</div>
        <div className="text-center">សកម្មភាព</div>
      </div>

      <div className={`divide-y ${isDark ? "divide-zinc-800" : "divide-zinc-200"}`}>
        {purchases.map((purchase) => {
          const effectiveStatus = getEffectivePurchaseStatus?.(purchase) || purchase.status;
          const itemSummary = getPurchaseItemSummary(purchase);
          const statusBadge = getPurchaseStatusBadge?.(purchase);
          // Skip the sub-line when the status badge itself already carries that same
          // replacement-progress text (getPurchaseStatusBadge's override case) — otherwise it'd
          // just repeat the badge in different words.
          const problemLabel = statusBadge?.overrode ? "" : getPurchaseProblemLabel(purchase);
          // A server balance of exactly 0 (fully paid, or fully offset by a resolved claim) is
          // valid and must not fall back to grandTotal-paid — see canBalanceUsd/Khr in ActionButtons
          // below for the same fix applied to this same falsy-zero mistake.
          const hasServerBalanceUsd = purchase.balanceAmountUsd != null || purchase.balanceAmount != null;
          const hasServerBalanceKhr = purchase.balanceAmountKhr != null;
          const rawBalanceUsd = Number(purchase.balanceAmountUsd ?? purchase.balanceAmount ?? 0);
          const rawBalanceKhr = Number(purchase.balanceAmountKhr ?? 0);
          const fallbackBalanceUsd = Math.max(
            0,
            Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0) - Number(purchase.paidAmountUsd ?? purchase.paidAmount ?? 0)
          );
          const fallbackBalanceKhr = Math.max(0, Number(purchase.grandTotalKhr ?? 0) - Number(purchase.paidAmountKhr ?? 0));
          const balanceUsd = hasServerBalanceUsd ? rawBalanceUsd : fallbackBalanceUsd;
          const balanceKhr = hasServerBalanceKhr ? rawBalanceKhr : fallbackBalanceKhr;
          const hasBalance = balanceUsd > 0 || balanceKhr > 0;
          const hasFlowDetail = Boolean(itemSummary.title || itemSummary.detail || problemLabel || hasBalance);
          const stockConfirmed = hasAcceptedStockConfirmed(purchase);
          // partial_prepaid can skip the formal claim step entirely when the damage value is small
          // enough to just silently deduct from the unpaid balance — but creating a claim (e.g.
          // choosing replacement instead, which keeps the full remaining balance owed) stays a live
          // option via the claim-create button (canClaim, in ActionButtons) for as long as this is
          // true, even once the purchase reaches RECEIVED. Mirrors that button's own condition
          // directly rather than statusBadge.label, which would only catch the PENDING_STOCK_IN
          // window and disappear once "done". Only covers the "no claim created yet" phase — once a
          // claim exists, hasUnresolvedClaimDecision goes true and this correctly turns off (the red
          // reminder pill's job is done; getPurchaseProblemLabel's own "រង់ចាំដំណោះស្រាយ" sub-line
          // takes over communicating claim progress instead). Excludes effectiveStatus === PENDING_CLAIM:
          // when the damage value exceeds the unpaid balance, isSupplierClaimNeeded does NOT take the
          // silent-absorption shortcut, so this purchase genuinely stays at PENDING_CLAIM and the main
          // status badge itself already reads plain "រង់ចាំការទាមទារ" — stacking this pill on top of
          // that repeated the exact same text twice.
          const hasClaimableDamageForPartialPrepaid =
            purchase.paymentMode === "partial_prepaid" &&
            effectiveStatus !== STATUS.PENDING_CLAIM &&
            getClaimRequiredCount(purchase) > 0 &&
            !hasUnresolvedClaimDecision?.(purchase);
          // Broader sibling of the above, for the main badge's green "done" swap specifically: a
          // claim CREATED after this purchase already reached RECEIVED doesn't roll purchase.status
          // back to Pending Claim (so statusBadge.overrode never becomes true here, unlike the normal
          // claim flow) — without this, the badge would keep reading the plain "ស្តុកចូលរួចរាល់អស់"
          // ("fully done") for as long as that claim sits open/unresolved, or a resolved replacement
          // hasn't actually been received/stocked yet. getOpenSupplierClaim already covers both those
          // claim-exists sub-states correctly (unlike claim_qty, which doesn't reliably reset for
          // replacement claims — see the confirmed partial_prepaid flows notes).
          const hasOutstandingDamageFollowUpForPartialPrepaid =
            purchase.paymentMode === "partial_prepaid" &&
            !statusBadge?.overrode &&
            (hasClaimableDamageForPartialPrepaid || Boolean(getOpenSupplierClaim?.(purchase)));
          const netCostInfo = getNetCostAfterDeduction(purchase, purchaseReturns);
          const problemColor = problemLabel?.includes("បានដោះស្រាយ")
            ? "text-emerald-500"
            : problemLabel?.includes("រង់ចាំបញ្ចូលស្តុក")
              ? "text-blue-500"
              : getClaimRequiredCount(purchase) > 0
                ? "text-red-500"
                : getDamagedCount(purchase) > 0
                  ? "text-amber-500"
                  : "text-emerald-500";
          // Once a claim is fully resolved with only stock-in left pending, getEffectivePurchaseStatus
          // moves effectiveStatus off PENDING_CLAIM (to PENDING_STOCK_IN) entirely, so statusBadge
          // never reaches its "overrode" branch here at all — getReplacementProgressLabel's "ដោះស្រាយ
          // រួច ចាំបញ្ជាក់ស្តុកចូល" text then surfaces only via problemLabel instead, in the products
          // column, uncolored (not purple) and not stacked with the status badge like every other
          // "claim in progress" pill in this row. Treat it the same way as the overrode+stockConfirmed
          // case: promote it into the status column, above the badge, in the same purple.
          // Broader than "ចាំបញ្ជាក់ស្តុកចូល" alone — also matches the replacement-already-stocked-in
          // fallback label ("ទំនិញជំនួសថ្មីបញ្ជាក់ស្តុកចូលរួចរាល់"), which shares "បញ្ជាក់ស្តុកចូល" but
          // not the leading "ចាំ".
          const isPendingStockInAfterResolution = !statusBadge?.overrode && (problemLabel || "").includes("បញ្ជាក់ស្តុកចូល");
          // A THIRD promotion case, alongside overrode+stockConfirmed and isPendingStockInAfterResolution
          // above: a claim created for this specific partial_prepaid case (damage silently absorbed
          // by balance, so no claim was ever required) never flips statusBadge.overrode, because
          // purchase.status stays at RECEIVED regardless of the claim's own lifecycle — yet
          // getPurchaseProblemLabel still correctly reports its progress (e.g. "រង់ចាំដំណោះស្រាយ") via
          // problemLabel, same text a normal overrode claim would show. Without this, that text sits
          // as plain uncolored text in the products column while the status column claims "done" —
          // promote it into the same purple pill everywhere else uses for "claim in progress".
          const promoteProblemLabelToPurplePill =
            (statusBadge?.overrode && stockConfirmed) ||
            isPendingStockInAfterResolution ||
            (hasOutstandingDamageFollowUpForPartialPrepaid && stockConfirmed && Boolean(problemLabel));
          // A still-open claim (money or replacement) is about a DIFFERENT product line than the
          // accepted/usable portion of this same purchase — that usable portion can independently
          // still be waiting on its own stock-in confirmation the whole time, but problemLabel is
          // forced to "" whenever statusBadge.overrode is true (the claim badge already "wins" the
          // slot), so this fact was going unmentioned here entirely. Same fix as the Receive tab.
          const hasSeparatePendingStockIn = statusBadge?.overrode && hasRemainingStockInQty(purchase);

          return (
            <div
              key={purchase.id}
              className={`grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1.15fr)_11rem] items-center gap-4 px-5 py-4 transition ${theme.row}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="table-icon-3d flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <FiShoppingCart size={21} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-5">{purchase.purchaseNo}</p>
                  <p className="mt-1 truncate text-sm font-semibold">{purchase.supplierName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}>
                      {purchase.purchaseDate}
                    </span>
                    <span className={`text-xs ${theme.muted}`}>ដោយ {purchase.createdBy}</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold">{formatPaymentMode(purchase.paymentMode)}</p>
                <p className={`mt-1 text-xs font-semibold ${
                  purchase.paymentStatus === "paid" ? "text-emerald-500" :
                  purchase.paymentStatus === "partial" ? "text-amber-500" :
                  "text-red-500"
                }`}>{{ paid: "បានបង់", partial: "បង់មួយផ្នែក", unpaid: "មិនទាន់បង់" }[purchase.paymentStatus] ?? purchase.paymentStatus}</p>
                {purchase.paymentStatus === "partial" && (
                  <p className={`mt-1 break-words text-xs ${theme.muted}`}>
                    បានបង់ {formatActualPaidAmount(purchase)}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {itemSummary.title && <p className="text-sm font-bold">{itemSummary.title}</p>}
                </div>
                {itemSummary.detail && itemSummary.detail !== "-" && <p className={`mt-1 truncate text-xs ${theme.muted}`}>{itemSummary.detail}</p>}
                {/* Shows the ORIGINAL total damaged qty (getDamagedCount — doesn't reset as items
                    resolve), not just what's still outstanding, plus how many of that original
                    total have already been resolved — getResolvedDamagedQty counts actual per-item
                    progress (a replacement item's partial receipt counts immediately, not gated on
                    its resolution_status only reaching "resolved" once the full claimed qty is in).
                    Hidden once resolvedQty reaches the total (compared directly against the same two
                    numbers this pill itself shows) — NOT gated on getClaimRequiredCount reaching 0,
                    since that only happens once stock-in is confirmed on the backend (claim_qty isn't
                    cleared until then), which lags behind "the supplier side is actually done" by one
                    more manual step. At that point the status badge above already reads "ដោះស្រាយរួច
                    ចាំបញ្ជាក់ស្តុកចូល" (or the plain resolved/received badge once stock-in really is
                    confirmed too), so repeating the damaged/resolved breakdown here would be stale,
                    already-settled information instead of something to act on. Styled to match the
                    exact same pill used in the ទទួលទំនិញ tab, kept below the "រង់ចាំដំណោះស្រាយ" pill
                    above. */}
                {["prepaid", "partial_prepaid"].includes(String(purchase.paymentMode || "").toLowerCase()) &&
                  getResolvedDamagedQty(purchase, purchaseReturns) < getDamagedCount(purchase) && (
                    <span className="mt-2 flex w-fit items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                      <FiAlertTriangle size={9} /> {getDamagedCount(purchase)} ខូច
                      {getResolvedDamagedQty(purchase, purchaseReturns) > 0 && (
                        <span className="text-emerald-500">
                          {" "}· សង {getResolvedDamagedQty(purchase, purchaseReturns)}
                        </span>
                      )}
                    </span>
                  )}
                {problemLabel && !promoteProblemLabelToPurplePill && (
                  <p className={`mt-2 text-xs font-semibold ${problemColor}`}>{problemLabel}</p>
                )}
                {hasBalance && (
                  <p className="mt-1 break-words text-xs font-semibold text-amber-600">
                    នៅសល់ {formatCurrencyPair(balanceUsd, balanceKhr)}
                  </p>
                )}
                {!hasFlowDetail && <p className={`text-xs ${theme.muted}`}>បើក ដើម្បីមើលមុខទំនិញ</p>}
              </div>

              <div className="min-w-0">
                <p className="break-words text-sm font-bold">
                  {formatCurrencyPair(purchase.grandTotalUsd ?? purchase.grandTotal, purchase.grandTotalKhr)}
                </p>
                {Number(purchase.subtotalUsd ?? purchase.subtotal ?? 0) !== Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0) && (
                  <p className={`mt-1 break-words text-xs ${theme.muted}`}>
                    ទំនិញ {formatCurrencyPair(purchase.subtotalUsd ?? purchase.subtotal, purchase.subtotalKhr)}
                  </p>
                )}
                {netCostInfo && (
                  <p className="mt-1 break-words text-xs font-semibold text-emerald-500">
                    ចំណាយពិត {formatCurrencyPair(netCostInfo.netUsd, netCostInfo.netKhr)}
                  </p>
                )}
                {/* Surfaces credit usage right in the list — previously only visible after opening
                    ViewPurchaseModal's detail popup, which meant this purchase's own cash-vs-credit
                    breakdown stayed invisible until clicked in. Compact pill (matching the "ខូច"
                    pill above) instead of a plain text line — a bare line read as messy/cluttered
                    next to the amount figures. */}
                {(Number(purchase.creditAppliedUsd || 0) > 0 || Number(purchase.creditAppliedKhr || 0) > 0) && (
                  <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                    <FiDollarSign size={9} /> លុយកាត់លើកក្រោយបានប្រើ
                  </span>
                )}
                {/* The main badge below swaps to green "ចំនួនប្រើបានចូលស្តុករួច" once stockConfirmed —
                    at that point statusBadge.label (e.g. "រង់ចាំដំណោះស្រាយ") no longer appears anywhere,
                    so show it here instead, stacked right above that badge. When NOT stockConfirmed,
                    the main badge below already shows this exact label directly (in the same purple),
                    so this separate pill only needs to exist for the stockConfirmed case — otherwise
                    it would duplicate the badge underneath it. Also covers isPendingStockInAfterResolution
                    (see its own comment above) — same purple pill, stacked above the plain "រង់ចាំបញ្ចូល
                    ក្នុងស្តុក" badge that shows once effectiveStatus has already moved off PENDING_CLAIM. */}
                {hasClaimableDamageForPartialPrepaid && (
                  <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
                    <FiAlertTriangle /> រង់ចាំការទាមទារ
                  </span>
                )}
                {promoteProblemLabelToPurplePill ? (
                  <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {statusBadge?.overrode ? statusBadge.icon : <FiCheckCircle />}
                    {/* The badge right below already reads "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន", so the money-
                        claim label ("សងប្រាក់រួចរាល់ ...") drops the redundant suffix here — but the
                        replacement label ("ដោះស្រាយរួច ...") keeps it: "ដោះស្រាយរួច" alone reads as
                        fully done, which is misleading while stock-in is still outstanding, whereas
                        "សងប្រាក់រួចរាល់" alone stays accurate on its own (the money side really is
                        finished; only the separate stock-in step remains). Detection above still uses
                        the untrimmed problemLabel either way. */}
                    {statusBadge?.overrode
                      ? statusBadge.label
                      : problemLabel.startsWith("ដោះស្រាយរួច")
                        ? problemLabel
                        : problemLabel.replace(/ ចាំបញ្ជាក់ស្តុកចូល$/, "")}
                  </span>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {statusBadge ? (
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      (statusBadge.overrode || hasOutstandingDamageFollowUpForPartialPrepaid) && stockConfirmed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : statusBadge.className
                    }`}>
                      {/* While a claim/replacement is in progress (overrode), this badge used to
                          repeat the same progress text now shown above ចំនួនខូច instead (in purple,
                          matching this badge's original color) — show the accepted-stock-in
                          confirmation here instead, in green like it originally was as a sub-line.
                          Only when stockConfirmed is actually true, or this would falsely claim the
                          accepted portion is already stocked in — in that edge case, fall back to
                          the original icon/label/color untouched. isPendingStockInAfterResolution
                          reuses the same "waiting to confirm usable qty" wording as the no-claim-yet
                          case below, instead of the generic plain-status "រង់ចាំបញ្ចូលក្នុងស្តុក" — the
                          purple pill above already established that the CLAIM itself is done, so this
                          badge should read as specifically about the stock-in step, not a repeat of
                          the generic status. hasOutstandingDamageFollowUpForPartialPrepaid covers the
                          sibling case where overrode never becomes true at all — either no claim was
                          ever required (still claimable), or one exists but purchase.status stayed at
                          RECEIVED regardless (created after the fact) — see that variable's own
                          comment. */}
                      {(statusBadge.overrode || hasOutstandingDamageFollowUpForPartialPrepaid) && stockConfirmed ? <FiCheckCircle /> : statusBadge.icon}
                      {(statusBadge.overrode || hasOutstandingDamageFollowUpForPartialPrepaid) && stockConfirmed
                        ? "ចំនួនប្រើបានចូលស្តុករួច"
                        : isPendingStockInAfterResolution
                          ? "រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន"
                          : statusBadge.label}
                    </span>
                  ) : (
                    <StatusBadge status={effectiveStatus} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
                  )}
                  {!simplified && (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                      {getNextActionLabel(purchase)}
                    </span>
                  )}
                </div>
                {/* Before a claim even exists yet ("រង់ចាំការទាមទារ"), the accepted/usable (non-
                    damaged) portion of this same purchase can still be sitting there waiting for its
                    own separate stock-in confirmation in the ទទួលទំនិញ tab — the badge above only
                    talks about the claim, so this would otherwise go unmentioned here entirely.
                    Styled to match the same blue/FiClock convention already used elsewhere in this
                    file for "pending stock in" (see STATUS.PENDING_STOCK_IN's own badge color/icon).
                    Once that stock-in gets confirmed (stockConfirmed), flips to the same green/
                    FiCheckCircle "ចំនួនប្រើបានចូលស្តុករួច" done state used in the badge slot above for
                    the in-claim case — this purchase has no claim yet, so that badge-slot swap never
                    triggers here, and this would otherwise stay silent forever once actually done. */}
                {effectiveStatus === STATUS.PENDING_CLAIM && !statusBadge?.overrode && (
                  hasRemainingStockInQty(purchase) ? (
                    <span className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <FiClock /> រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន
                    </span>
                  ) : stockConfirmed ? (
                    <span className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <FiCheckCircle /> ចំនួនប្រើបានចូលស្តុករួច
                    </span>
                  ) : null
                )}
                {/* A DIFFERENT case from the one above: here a claim (money or replacement) IS already
                    open (statusBadge.overrode true, e.g. "រង់ចាំការសងប្រាក់"), but that claim is about
                    a different product line than this purchase's accepted/usable portion — which can
                    independently still be waiting on its own stock-in confirmation the whole time.
                    Same blue/FiClock pill as above, just under the different triggering condition. */}
                {hasSeparatePendingStockIn && (
                  <span className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <FiClock /> រង់ចាំបញ្ជាក់ស្តុកចូលចំនួនប្រើបាន
                  </span>
                )}
              </div>

              <ActionButtons
                purchase={purchase}
                purchaseReturns={purchaseReturns}
                effectiveStatus={effectiveStatus}
                openViewModal={openViewModal}
                openEditModal={openEditModal}
                openReceiveGoodsModal={openReceiveGoodsModal}
                openPurchaseReturnModal={openPurchaseReturnModal}
                handleReceiveReplacement={handleReceiveReplacement}
                handleResolveSupplierClaim={handleResolveSupplierClaim}
                handleConfirmStockIn={handleConfirmStockIn}
                handleCancelPurchase={handleCancelPurchase}
                onContinuePayment={onContinuePayment}
                compact
                simplified={simplified}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PurchaseMobileCard({
  purchase,
  purchaseReturns = [],
  theme,
  effectiveStatus,
  statusBadge,
  problemLabel,
  nextActionLabel,
  getStatusClass,
  getStatusIcon,
  openViewModal,
  openEditModal,
  openReceiveGoodsModal,
  openPurchaseReturnModal,
  handleReceiveReplacement,
  handleResolveSupplierClaim,
  handleConfirmStockIn,
  handleCancelPurchase,
  onContinuePayment,
  simplified = false,
}) {
  const itemSummary = getPurchaseItemSummary(purchase);

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${theme.softCard}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold">{purchase.purchaseNo}</p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            {purchase.supplierName} - {purchase.purchaseDate}
          </p>
        </div>

        {statusBadge ? (
          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        ) : (
          <StatusBadge status={effectiveStatus || purchase.status} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <SummaryMiniBox theme={theme} label="ការទូទាត់" value={formatPaymentMode(purchase.paymentMode)} />
        <SummaryMiniBox
          theme={theme}
          label="សរុប"
          value={formatCurrencyPair(purchase.grandTotalUsd ?? purchase.grandTotal, purchase.grandTotalKhr)}
          strong
        />
        {itemSummary.title && <SummaryMiniBox theme={theme} label="ផលិតផល" value={itemSummary.title} />}
        <SummaryMiniBox theme={theme} label="បន្ទាប់" value={nextActionLabel} />
      </div>

      {(problemLabel || itemSummary.detail) && (
        <div className="mt-4 rounded-xl bg-zinc-500/10 p-3">
          <p className="text-xs font-semibold">កំណត់ចំណាំ</p>
          {itemSummary.detail && <p className={`mt-1 text-xs ${theme.muted}`}>{itemSummary.detail}</p>}
          {problemLabel && <p className="mt-2 text-xs font-semibold text-red-500">{problemLabel}</p>}
        </div>
      )}

      <div className="mt-4">
        <ActionButtons
          purchase={purchase}
          purchaseReturns={purchaseReturns}
          effectiveStatus={effectiveStatus || purchase.status}
          openViewModal={openViewModal}
          openEditModal={openEditModal}
          openReceiveGoodsModal={openReceiveGoodsModal}
          openPurchaseReturnModal={openPurchaseReturnModal}
          handleReceiveReplacement={handleReceiveReplacement}
          handleResolveSupplierClaim={handleResolveSupplierClaim}
          handleConfirmStockIn={handleConfirmStockIn}
          handleCancelPurchase={handleCancelPurchase}
          onContinuePayment={onContinuePayment}
          simplified={simplified}
        />
      </div>
    </div>
  );
}

export function ActionButtons({
  purchase,
  purchaseReturns = [],
  effectiveStatus = purchase.status,
  openViewModal,
  openEditModal,
  openReceiveGoodsModal,
  openPurchaseReturnModal,
  handleReceiveReplacement,
  handleResolveSupplierClaim,
  handleConfirmStockIn,
  handleCancelPurchase,
  onContinuePayment,
  compact = false,
  simplified = false,
}) {
  const iconButton = "quick-action-icon-3d inline-flex h-9 w-9 items-center justify-center rounded-xl text-white ring-1 ring-white/30 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40";
  const paymentStatus = String(purchase.paymentStatus || "").toLowerCase();
  const canEdit =
    [STATUS.DRAFT, STATUS.PENDING_RECEIVE].includes(effectiveStatus) &&
    !["paid", "partial"].includes(paymentStatus);
  const canCancel =
    [STATUS.DRAFT, STATUS.PENDING_RECEIVE].includes(effectiveStatus) &&
    !["paid", "partial"].includes(paymentStatus);
  // A server-provided balance of exactly 0 (fully paid, or fully offset by a resolved
  // claim) is valid and must not fall back to grandTotal-paid — that fallback ignores
  // any resolved claim deduction and resurrects an already-settled balance.
  const hasServerBalanceUsd = purchase.balanceAmountUsd != null || purchase.balanceAmount != null;
  const hasServerBalanceKhr = purchase.balanceAmountKhr != null;
  const rawBalanceUsd = Number(purchase.balanceAmountUsd ?? purchase.balanceAmount ?? 0);
  const rawBalanceKhr = Number(purchase.balanceAmountKhr ?? 0);
  const fallbackBalanceUsd = Math.max(
    0,
    Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0) - Number(purchase.paidAmountUsd ?? purchase.paidAmount ?? 0)
  );
  const fallbackBalanceKhr = Math.max(0, Number(purchase.grandTotalKhr ?? 0) - Number(purchase.paidAmountKhr ?? 0));
  const basePaymentBalanceUsd = hasServerBalanceUsd ? rawBalanceUsd : fallbackBalanceUsd;
  const basePaymentBalanceKhr = hasServerBalanceKhr ? rawBalanceKhr : fallbackBalanceKhr;
  const paymentReady =
    String(purchase.paymentMode || "").toLowerCase() === "pay_after_check"
      ? [STATUS.PENDING_STOCK_IN, STATUS.PENDING_CLAIM, STATUS.RECEIVED].includes(effectiveStatus)
      : true;
  const relatedReturns = [
    ...(Array.isArray(purchase.returns) ? purchase.returns : []),
    ...purchaseReturns.filter((item) => String(item.purchaseId) === String(purchase.id)),
  ].filter((item, index, list) => list.findIndex((current) => String(current.id) === String(item.id)) === index);
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
  // Checked per ITEM within a return, not the return's own aggregate status/resolutionType — a
  // claim can now mix resolution types across its items (return-level resolutionType then reads
  // "mixed"), so an aggregate-only check would miss a mixed return's still-open items entirely.
  const returnHasOpenItem = (ret, predicate) => {
    const items = Array.isArray(ret.items) ? ret.items : [];
    if (items.length > 0) return items.some(predicate);
    // Legacy fallback: no per-item data at all, fall back to the return's own aggregate fields.
    return predicate(ret);
  };
  const activeClaim = relatedReturns.find((ret) =>
    returnHasOpenItem(ret, (item) => !["completed", "cancelled"].includes(normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status)))
  );
  const hasRemainingStockIn = hasRemainingStockInQty(purchase);
  const lines = getPurchaseLines(purchase);
  const hasReplacementStockIn = hasPendingReplacementStockIn(relatedReturns);
  const hasStockedIn = hasAnyStockedInQty(purchase);
  const replacementClaim = relatedReturns.find((ret) =>
    returnHasOpenItem(ret, (item) => {
      const status = normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status);
      const isReplacement = normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement";
      return isReplacement && !["completed", "cancelled", "canceled"].includes(status);
    })
  );
  const moneyClaim = relatedReturns.find((ret) =>
    returnHasOpenItem(ret, (item) => {
      const status = normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status);
      const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
      return ["refund", "credit_note"].includes(resolutionType) && !["completed", "cancelled", "canceled", "rejected"].includes(status);
    })
  );
  // A claim can have 2+ independent open money items now (e.g. two different damaged products,
  // each a separate refund the supplier pays on its own schedule) — this row-level shortcut only
  // resolves ONE item per click, so it must stay hidden once there's more than one open money item
  // to avoid silently resolving just the first one found while the user thinks it resolved all of
  // them. With 2+, use the ត្រឡប់ទំនិញ/ការទាមទារ tab instead, where each item gets its own button.
  const openMoneyItemsInClaim = moneyClaim
    ? (Array.isArray(moneyClaim.items) && moneyClaim.items.length > 0 ? moneyClaim.items : [moneyClaim]).filter((item) => {
        const status = normalizeReturnStatus(item.resolutionStatus || item.resolution_status || item.status);
        const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
        return ["refund", "credit_note"].includes(resolutionType) && !["completed", "cancelled", "canceled", "rejected"].includes(status);
      })
    : [];
  const hasActivePartialPrepaidMoneyClaim =
    String(purchase.paymentMode || "").toLowerCase() === "partial_prepaid" &&
    Boolean(moneyClaim);
  // Trust the server-computed balance (basePaymentBalanceUsd/Khr) — it already nets out
  // any resolved refund/credit_note claim deduction (see PurchaseService::recalculateTotals).
  // Do not re-derive the deduction here from claim_qty: it is reset to 0 once a claim is
  // resolved, which previously made this recompute silently undo the deduction.
  const paymentBalanceUsd = basePaymentBalanceUsd;
  const paymentBalanceKhr = basePaymentBalanceKhr;
  const hasPaymentBalance = paymentBalanceUsd > 0.01 || paymentBalanceKhr > 1;
  // Checked per return ITEM (via returnHasOpenItem's legacy-fallback pattern), not the return's own
  // rollup resolutionType — same reasoning as activeClaim/replacementClaim/moneyClaim above.
  const hasPartialPrepaidMoneyClaimReceivable =
    String(purchase.paymentMode || "").toLowerCase() === "partial_prepaid" &&
    relatedReturns.some((ret) =>
      returnHasOpenItem(ret, (item) => {
        const status = normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status);
        if (["cancelled", "canceled", "rejected"].includes(status)) return false;

        const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
        if (!["refund", "credit_note"].includes(resolutionType)) return false;

        const usdKey = resolutionType === "credit_note" ? "creditAmountUsd" : "refundAmountUsd";
        const usdApiKey = resolutionType === "credit_note" ? "credit_amount_usd" : "refund_amount_usd";
        const khrKey = resolutionType === "credit_note" ? "creditAmountKhr" : "refundAmountKhr";
        const khrApiKey = resolutionType === "credit_note" ? "credit_amount_khr" : "refund_amount_khr";
        return Number(item[usdKey] ?? item[usdApiKey] ?? 0) > 0.01 ||
          Number(item[khrKey] ?? item[khrApiKey] ?? 0) > 1;
      })
    );
  const canContinuePayment =
    Boolean(onContinuePayment) &&
    hasPaymentBalance &&
    paymentReady &&
    !hasActivePartialPrepaidMoneyClaim &&
    !hasPartialPrepaidMoneyClaimReceivable;
  const canOpenInventory =
    ![STATUS.CANCELLED, STATUS.PENDING_RECEIVE, STATUS.RECEIVED].includes(effectiveStatus) &&
    ((effectiveStatus === STATUS.PENDING_STOCK_IN && (hasRemainingStockIn || hasReplacementStockIn || lines.length === 0)) ||
      (effectiveStatus === STATUS.PENDING_CLAIM && hasRemainingStockIn && !hasStockedIn));
  // Status can jump straight to RECEIVED once accepted units are stocked in, even when
  // damaged/missing units still have an unclaimed claim_qty (needsSupplierClaim() only
  // forces PENDING_CLAIM when the claim value exceeds the unpaid balance) — so RECEIVED
  // must stay eligible for claim creation too, not just PENDING_CLAIM/PENDING_STOCK_IN.
  // Not gated on relatedReturns.length === 0: a purchase can have several claims over its
  // lifetime (one per damaged item/batch) — requiring zero *ever-existing* returns permanently
  // hid this button after the first claim, even when another item still needs its own separate
  // one. hasClaimQty already reflects genuine remaining need (claim_qty resets once a
  // refund/credit_note claim resolves), and !activeClaim already blocks starting a second claim
  // while one is still open.
  const canClaim =
    [STATUS.PENDING_CLAIM, STATUS.PENDING_STOCK_IN, STATUS.RECEIVED].includes(effectiveStatus) &&
    hasClaimQty(purchase) &&
    !activeClaim;

  return (
    <div className={`flex flex-wrap items-center ${compact ? "justify-end gap-2" : "gap-2"}`}>
      <Tooltip label="មើលការទិញ">
        <button type="button" onClick={() => openViewModal(purchase)} className={`${iconButton} bg-orange-500 shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/25 focus:ring-orange-500/20`}>
          <FiEye size={17} />
        </button>
      </Tooltip>

      {canEdit && (
        <PermissionGate permission="purchases.update">
          <Tooltip label="កែការទិញ">
            <button type="button" onClick={() => openEditModal(purchase)} className={`${iconButton} bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/25 focus:ring-blue-500/20`}>
              <FiEdit2 size={17} />
            </button>
          </Tooltip>
        </PermissionGate>
      )}

      {!simplified && effectiveStatus === STATUS.PENDING_RECEIVE && (
        <Tooltip label="ទទួលទំនិញ">
          <button type="button" onClick={() => openReceiveGoodsModal(purchase)} className={`${iconButton} bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/25 focus:ring-indigo-500/20`}>
            <FiTruck size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && canOpenInventory && (
        <Tooltip label="បញ្ជាក់ស្តុកចូល">
          <button type="button" onClick={() => handleConfirmStockIn(purchase)} className={`${iconButton} bg-emerald-500 shadow-emerald-600/20 hover:bg-emerald-600 hover:shadow-emerald-600/25 focus:ring-emerald-500/20`}>
            <FiCheckCircle size={17} />
          </button>
        </Tooltip>
      )}

      {canContinuePayment && (
        <Tooltip label="ទៅការទូទាត់">
          <button type="button" onClick={() => onContinuePayment(purchase)} className={`${iconButton} bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/25 focus:ring-blue-500/20`}>
            <FiArrowRightCircle size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && replacementClaim && (
        <Tooltip label="ទទួលជំនួស អ្នកផ្គត់ផ្គង់">
          <button type="button" onClick={() => handleReceiveReplacement?.(purchase, replacementClaim)} className={`${iconButton} bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/25 focus:ring-indigo-500/20`}>
            <FiTruck size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && moneyClaim && openMoneyItemsInClaim.length === 1 && (
        <Tooltip label={normalizeResolutionType(openMoneyItemsInClaim[0].resolutionType || openMoneyItemsInClaim[0].resolution_type) === "refund" ? "ប្រាក់ត្រូវបានសង" : "ដោះស្រាយកាត់លុយលើកក្រោយ"}>
          <button type="button" onClick={() => handleResolveSupplierClaim?.(purchase, moneyClaim, openMoneyItemsInClaim[0])} className={`${iconButton} bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/25 focus:ring-emerald-500/20`}>
            <FiDollarSign size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && canClaim && (
        <Tooltip label="បង្កើតការទាមទារ អ្នកផ្គត់ផ្គង់">
          <button type="button" onClick={() => openPurchaseReturnModal(purchase)} className={`${iconButton} bg-purple-600 shadow-purple-600/20 hover:bg-purple-700 hover:shadow-purple-600/25 focus:ring-purple-500/20`}>
            <FiRotateCcw size={17} />
          </button>
        </Tooltip>
      )}

      {canCancel && (
        <Tooltip label="លុបការទិញ">
          <button type="button" onClick={() => handleCancelPurchase(purchase)} className={`${iconButton} bg-red-600 shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/25 focus:ring-red-500/20`}>
            <FiXCircle size={17} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

export function Tooltip({ label, children }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
      </span>
    </div>
  );
}
