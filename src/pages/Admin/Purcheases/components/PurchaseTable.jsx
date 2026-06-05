import React from "react";
import {
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiRotateCcw,
  FiSearch,
  FiShoppingCart,
  FiTrash,
  FiTruck,
} from "react-icons/fi";
import { STATUS } from "../utils/purchaseConstants";
import { formatCurrencyPair, formatPaymentMode, getPurchaseItemSummary } from "../utils/purchaseUtils";
import { EmptyState, StatusBadge, SummaryMiniBox } from "./PurchaseCommon";

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
                <p className={`mt-1 text-xs capitalize ${theme.muted}`}>{purchase.paymentStatus}</p>
                <p className={`mt-1 break-words text-xs ${theme.muted}`}>
                  Paid {formatCurrencyPair(purchase.paidAmountUsd ?? purchase.paidAmount, purchase.paidAmountKhr)}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {itemSummary.title && <p className="text-sm font-bold">{itemSummary.title}</p>}
                </div>
                {itemSummary.detail && <p className={`mt-1 truncate text-xs ${theme.muted}`}>{itemSummary.detail}</p>}
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
                <p className={`mt-1 break-words text-xs ${theme.muted}`}>
                  Subtotal {formatCurrencyPair(purchase.subtotalUsd ?? purchase.subtotal, purchase.subtotalKhr)}
                </p>
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
    return type === "credit_note" ? "credit" : type;
  };
  const activeClaim = relatedReturns.find((item) => !["completed", "cancelled"].includes(normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status)));
  const hasUnappliedClaimQty = (purchase.items || []).some((item) => Number(item.claimQty || 0) > 0);
  const isAlreadyStocked = purchase.status === STATUS.RECEIVED || (purchase.items || []).some((item) => Number(item.stockedInQty || 0) > 0);
  const replacementClaim = relatedReturns.find((item) => {
    const status = normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status);
    const isReplacement = normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement";
    const isOpen = !["completed", "cancelled", "canceled"].includes(status);
    const isResolvedButNotApplied = status === "completed" && hasUnappliedClaimQty && !isAlreadyStocked;
    return isReplacement && (isOpen || isResolvedButNotApplied);
  });
  const canClaim = effectiveStatus !== STATUS.CANCELLED && effectiveStatus !== STATUS.PENDING_RECEIVE && !activeClaim && relatedReturns.length === 0;

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

      {effectiveStatus === STATUS.PENDING_STOCK_IN && (
        <button type="button" title="Open Inventory" aria-label="Open Inventory" onClick={() => handleConfirmStockIn(purchase)} className={`${iconButton} bg-emerald-500 hover:bg-emerald-600`}>
          <FiCheckCircle size={17} />
        </button>
      )}

      {replacementClaim && (
        <button type="button" title="Receive Replacement" aria-label="Receive Replacement" onClick={() => handleReceiveReplacement?.(purchase, replacementClaim)} className={`${iconButton} bg-purple-600 hover:bg-purple-700`}>
          <FiRotateCcw size={17} />
        </button>
      )}

      {canClaim && effectiveStatus !== STATUS.PENDING_STOCK_IN && (
        <button type="button" title="Create Supplier Claim" aria-label="Create Supplier Claim" onClick={() => openPurchaseReturnModal(purchase)} className={`${iconButton} bg-purple-600 hover:bg-purple-700`}>
          <FiRotateCcw size={17} />
        </button>
      )}

      {canCancel && (
        <button type="button" title="Cancel purchase" aria-label="Cancel purchase" onClick={() => handleCancelPurchase(purchase)} className={`${iconButton} bg-red-500 hover:bg-red-600`}>
          <FiTrash size={17} />
        </button>
      )}
    </div>
  );
}
