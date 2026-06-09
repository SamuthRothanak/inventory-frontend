import React from "react";
import {
  FiCheckCircle,
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
import { formatCurrencyPair, formatPaymentMode, getPurchaseItemSummary } from "../utils/purchaseUtils";
import { EmptyState, StatusBadge, SummaryMiniBox } from "./PurchaseCommon";

const getPurchaseLines = (purchase = {}) => {
  const items = Array.isArray(purchase.items) ? purchase.items : [];
  if (items.length > 0) return items;
  return Array.isArray(purchase.summaryItems) ? purchase.summaryItems : [];
};

const getRemainingStockInQty = (item = {}) => {
  const directRemaining = Number(item.remainingStockInQty ?? item.remaining_stock_in_qty ?? 0);
  if (directRemaining > 0) return directRemaining;

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

const hasPendingReplacementStockIn = (returns = []) =>
  returns.some((item) => {
    const type = String(item.resolutionType || item.resolution_type || "").trim().toLowerCase();
    const receivedQty = Number(item.replacementReceivedQty ?? item.replacement_received_qty ?? 0);
    const stockedQty = Number(item.replacementStockedInQty ?? item.replacement_stocked_in_qty ?? 0);
    return type === "replacement" && receivedQty > stockedQty;
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
  let deductionUsd = 0;
  let deductionKhr = 0;
  for (const item of allReturns) {
    const status = normalizeStatus(item.status || item.resolutionStatus || item.resolution_status);
    const type = normalizeType(item.resolutionType || item.resolution_type);
    if (status !== "completed") continue;
    if (type === "refund") {
      deductionUsd += Number(item.refundAmountUsd ?? item.refund_amount_usd ?? 0);
      deductionKhr += Number(item.refundAmountKhr ?? item.refund_amount_khr ?? 0);
    } else if (type === "credit_note") {
      deductionUsd += Number(item.creditAmountUsd ?? item.credit_amount_usd ?? 0);
      deductionKhr += Number(item.creditAmountKhr ?? item.credit_amount_khr ?? 0);
    }
  }
  if (deductionUsd <= 0 && deductionKhr <= 0) return null;
  const gtUsd = Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0);
  const gtKhr = Number(purchase.grandTotalKhr ?? 0);
  return { netUsd: Math.max(0, gtUsd - deductionUsd), netKhr: Math.max(0, gtKhr - deductionKhr) };
};

export function PurchaseTable({
  purchases,
  purchaseReturns = [],
  theme,
  getEffectivePurchaseStatus,
  getPurchaseProblemLabel,
  getClaimRequiredCount,
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
}) {
  if (purchases.length === 0) {
    return (
      <div className={`border-t px-4 py-14 text-center ${theme.row}`}>
        <EmptyState
          theme={theme}
          icon={<FiSearch />}
          title="No purchases found"
          description="Try changing your search keyword or filters."
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1.15fr)_11rem] items-center gap-4 bg-red-600 px-5 py-3 text-sm font-semibold text-white">
        <div>Purchase / Supplier</div>
        <div>Payment</div>
        <div>Claim / Flow</div>
        <div>Total / Status</div>
        <div className="text-center">Actions</div>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-white/10">
        {purchases.map((purchase) => {
          const effectiveStatus = getEffectivePurchaseStatus?.(purchase) || purchase.status;
          const itemSummary = getPurchaseItemSummary(purchase);
          const problemLabel = getPurchaseProblemLabel(purchase);
          const balanceUsd = Number(purchase.balanceAmountUsd ?? purchase.balanceAmount ?? 0);
          const balanceKhr = Number(purchase.balanceAmountKhr ?? 0);
          const hasBalance = balanceUsd > 0 || balanceKhr > 0;
          const hasFlowDetail = Boolean(itemSummary.title || itemSummary.detail || problemLabel || hasBalance);
          const stockConfirmed = hasAcceptedStockConfirmed(purchase);
          const claimStillOpen = effectiveStatus === STATUS.PENDING_CLAIM && hasClaimQty(purchase);
          const netCostInfo = getNetCostAfterDeduction(purchase, purchaseReturns);
          const problemColor =
            getClaimRequiredCount(purchase) > 0
              ? "text-red-500"
              : getDamagedCount(purchase) > 0
                ? "text-amber-500"
                : "text-emerald-500";

          return (
            <div
              key={purchase.id}
              className={`grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1.45fr)_minmax(0,1.15fr)_11rem] items-center gap-4 px-5 py-4 transition ${theme.row}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                  <FiShoppingCart size={21} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-5">{purchase.purchaseNo}</p>
                  <p className="mt-1 truncate text-sm font-semibold">{purchase.supplierName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}>
                      {purchase.purchaseDate}
                    </span>
                    <span className={`text-xs ${theme.muted}`}>By {purchase.createdBy}</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold">{formatPaymentMode(purchase.paymentMode)}</p>
                <p className={`mt-1 text-xs font-semibold capitalize ${
                  purchase.paymentStatus === "paid" ? "text-emerald-500" :
                  purchase.paymentStatus === "partial" ? "text-amber-500" :
                  "text-red-500"
                }`}>{purchase.paymentStatus}</p>
                {purchase.paymentStatus === "partial" && (
                  <p className={`mt-1 break-words text-xs ${theme.muted}`}>
                    Paid {formatCurrencyPair(purchase.paidAmountUsd ?? purchase.paidAmount, purchase.paidAmountKhr)}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {itemSummary.title && <p className="text-sm font-bold">{itemSummary.title}</p>}
                </div>
                {itemSummary.detail && itemSummary.detail !== "-" && <p className={`mt-1 truncate text-xs ${theme.muted}`}>{itemSummary.detail}</p>}
                {stockConfirmed && (
                  <p className="mt-2 text-xs font-semibold text-emerald-500">
                    Accepted stock already confirmed
                  </p>
                )}
                {claimStillOpen && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    Claim still needs supplier resolution
                  </p>
                )}
                {problemLabel && <p className={`mt-2 text-sm font-semibold ${problemColor}`}>{problemLabel}</p>}
                {hasBalance && (
                  <p className={`mt-1 break-words text-xs ${theme.muted}`}>
                    Balance {formatCurrencyPair(balanceUsd, balanceKhr)}
                  </p>
                )}
                {!hasFlowDetail && <p className={`text-xs ${theme.muted}`}>View purchase for product lines</p>}
              </div>

              <div className="min-w-0">
                <p className="break-words text-sm font-bold">
                  {formatCurrencyPair(purchase.grandTotalUsd ?? purchase.grandTotal, purchase.grandTotalKhr)}
                </p>
                {Number(purchase.subtotalUsd ?? purchase.subtotal ?? 0) !== Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0) && (
                  <p className={`mt-1 break-words text-xs ${theme.muted}`}>
                    Subtotal {formatCurrencyPair(purchase.subtotalUsd ?? purchase.subtotal, purchase.subtotalKhr)}
                  </p>
                )}
                {netCostInfo && (
                  <p className="mt-1 break-words text-xs font-semibold text-emerald-500">
                    Net {formatCurrencyPair(netCostInfo.netUsd, netCostInfo.netKhr)}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={effectiveStatus} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                    {getNextActionLabel(purchase)}
                  </span>
                </div>
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
                compact
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

        <StatusBadge status={effectiveStatus || purchase.status} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <SummaryMiniBox theme={theme} label="Payment" value={formatPaymentMode(purchase.paymentMode)} />
        <SummaryMiniBox
          theme={theme}
          label="Total"
          value={formatCurrencyPair(purchase.grandTotalUsd ?? purchase.grandTotal, purchase.grandTotalKhr)}
          strong
        />
        {itemSummary.title && <SummaryMiniBox theme={theme} label="Products" value={itemSummary.title} />}
        <SummaryMiniBox theme={theme} label="Next" value={nextActionLabel} />
      </div>

      {(problemLabel || itemSummary.detail) && (
        <div className="mt-4 rounded-xl bg-zinc-500/10 p-3">
          <p className="text-xs font-semibold">Purchase note</p>
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
  compact = false,
}) {
  const iconButton = compact
    ? "inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
    : "inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40";
  const canEdit = effectiveStatus !== STATUS.RECEIVED;
  const canCancel = effectiveStatus !== STATUS.RECEIVED && effectiveStatus !== STATUS.CANCELLED;
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
  const activeClaim = relatedReturns.find((item) => !["completed", "cancelled"].includes(normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status)));
  const hasRemainingStockIn = hasRemainingStockInQty(purchase);
  const lines = getPurchaseLines(purchase);
  const hasReplacementStockIn = hasPendingReplacementStockIn(relatedReturns);
  const hasStockedIn = hasAnyStockedInQty(purchase);
  const replacementClaim = relatedReturns.find((item) => {
    const status = normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status);
    const isReplacement = normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement";
    return isReplacement && !["completed", "cancelled", "canceled"].includes(status);
  });
  const moneyClaim = relatedReturns.find((item) => {
    const status = normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status);
    const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
    return ["refund", "credit_note"].includes(resolutionType) && !["completed", "cancelled"].includes(status);
  });
  const canOpenInventory =
    ![STATUS.CANCELLED, STATUS.PENDING_RECEIVE, STATUS.RECEIVED].includes(effectiveStatus) &&
    ((effectiveStatus === STATUS.PENDING_STOCK_IN && (hasRemainingStockIn || hasReplacementStockIn || lines.length === 0)) ||
      (effectiveStatus === STATUS.PENDING_CLAIM && hasRemainingStockIn && !hasStockedIn));
  const canClaim =
    effectiveStatus === STATUS.PENDING_CLAIM &&
    !activeClaim &&
    relatedReturns.length === 0;

  return (
    <div className={`flex flex-wrap items-center ${compact ? "justify-end gap-2" : "gap-2"}`}>
      <button type="button" title="View purchase" aria-label="View purchase" onClick={() => openViewModal(purchase)} className={`${iconButton} bg-amber-500 hover:bg-amber-600`}>
        <FiEye size={17} />
      </button>

      {canEdit && (
        <button type="button" title="Edit purchase" aria-label="Edit purchase" onClick={() => openEditModal(purchase)} className={`${iconButton} bg-blue-600 hover:bg-blue-700`}>
          <FiEdit2 size={17} />
        </button>
      )}

      {effectiveStatus === STATUS.PENDING_RECEIVE && (
        <button type="button" title="Receive goods" aria-label="Receive goods" onClick={() => openReceiveGoodsModal(purchase)} className={`${iconButton} bg-indigo-600 hover:bg-indigo-700`}>
          <FiTruck size={17} />
        </button>
      )}

      {canOpenInventory && (
        <button type="button" title="Open Inventory" aria-label="Open Inventory" onClick={() => handleConfirmStockIn(purchase)} className={`${iconButton} bg-emerald-500 hover:bg-emerald-600`}>
          <FiCheckCircle size={17} />
        </button>
      )}

      {replacementClaim && (
        <button type="button" title="Receive Supplier Replacement" aria-label="Receive Supplier Replacement" onClick={() => handleReceiveReplacement?.(purchase, replacementClaim)} className={`${iconButton} bg-indigo-600 hover:bg-indigo-700`}>
          <FiTruck size={17} />
        </button>
      )}

      {moneyClaim && (
        <button
          type="button"
          title={normalizeResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type) === "refund" ? "Mark Refund Received" : "Resolve Credit Note"}
          aria-label={normalizeResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type) === "refund" ? "Mark Refund Received" : "Resolve Credit Note"}
          onClick={() => handleResolveSupplierClaim?.(purchase, moneyClaim)}
          className={`${iconButton} bg-emerald-600 hover:bg-emerald-700`}
        >
          <FiDollarSign size={17} />
        </button>
      )}

      {canClaim && effectiveStatus !== STATUS.PENDING_STOCK_IN && (
        <button type="button" title="Create Supplier Claim" aria-label="Create Supplier Claim" onClick={() => openPurchaseReturnModal(purchase)} className={`${iconButton} bg-purple-600 hover:bg-purple-700`}>
          <FiRotateCcw size={17} />
        </button>
      )}

      {canCancel && (
        <button type="button" title="Cancel purchase" aria-label="Cancel purchase" onClick={() => handleCancelPurchase(purchase)} className={`${iconButton} bg-orange-500 hover:bg-orange-600`}>
          <FiXCircle size={17} />
        </button>
      )}
    </div>
  );
}
