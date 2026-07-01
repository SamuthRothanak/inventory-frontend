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
import PermissionGate from "../../../../components/PermissionGate";

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
  simplified = false,
}) {
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
          const problemColor = problemLabel?.includes("បានដោះស្រាយ")
            ? "text-emerald-500"
            : getClaimRequiredCount(purchase) > 0
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
                    បានបង់ {formatCurrencyPair(purchase.paidAmountUsd ?? purchase.paidAmount, purchase.paidAmountKhr)}
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
                    ស្តុកបានទទួលស្គាល់ហើយ
                  </p>
                )}
                {claimStillOpen && (
                  <p className="mt-1 text-xs font-semibold text-red-500">
                    ការទាមទារត្រូវការឆ្លើយតបពី អ្នកផ្គត់ផ្គង់
                  </p>
                )}
                {problemLabel && <p className={`mt-2 text-sm font-semibold ${problemColor}`}>{problemLabel}</p>}
                {hasBalance && (
                  <p className={`mt-1 break-words text-xs ${theme.muted}`}>
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
                    រង {formatCurrencyPair(purchase.subtotalUsd ?? purchase.subtotal, purchase.subtotalKhr)}
                  </p>
                )}
                {netCostInfo && (
                  <p className="mt-1 break-words text-xs font-semibold text-emerald-500">
                    សុទ្ធ {formatCurrencyPair(netCostInfo.netUsd, netCostInfo.netKhr)}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={effectiveStatus} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
                  {!simplified && (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                      {getNextActionLabel(purchase)}
                    </span>
                  )}
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

        <StatusBadge status={effectiveStatus || purchase.status} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
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
  compact = false,
  simplified = false,
}) {
  const iconButton = "inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-4 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40";
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
      <Tooltip label="មើលការទិញ">
        <button type="button" onClick={() => openViewModal(purchase)} className={`${iconButton} bg-gradient-to-b from-amber-400 to-orange-500 shadow-orange-500/20 hover:from-amber-500 hover:to-orange-600 hover:shadow-orange-500/25 focus:ring-orange-500/20`}>
          <FiEye size={17} />
        </button>
      </Tooltip>

      {canEdit && (
        <PermissionGate permission="purchases.update">
          <Tooltip label="កែការទិញ">
            <button type="button" onClick={() => openEditModal(purchase)} className={`${iconButton} bg-gradient-to-b from-blue-500 to-blue-700 shadow-blue-600/20 hover:from-blue-600 hover:to-blue-800 hover:shadow-blue-600/25 focus:ring-blue-500/20`}>
              <FiEdit2 size={17} />
            </button>
          </Tooltip>
        </PermissionGate>
      )}

      {!simplified && effectiveStatus === STATUS.PENDING_RECEIVE && (
        <Tooltip label="ទទួលទំនិញ">
          <button type="button" onClick={() => openReceiveGoodsModal(purchase)} className={`${iconButton} bg-gradient-to-b from-indigo-500 to-indigo-700 shadow-indigo-600/20 hover:from-indigo-600 hover:to-indigo-800 hover:shadow-indigo-600/25 focus:ring-indigo-500/20`}>
            <FiTruck size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && canOpenInventory && (
        <Tooltip label="បញ្ជាក់ស្តុកចូល">
          <button type="button" onClick={() => handleConfirmStockIn(purchase)} className={`${iconButton} bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-emerald-600/20 hover:from-emerald-500 hover:to-emerald-700 hover:shadow-emerald-600/25 focus:ring-emerald-500/20`}>
            <FiCheckCircle size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && replacementClaim && (
        <Tooltip label="ទទួលជំនួស អ្នកផ្គត់ផ្គង់">
          <button type="button" onClick={() => handleReceiveReplacement?.(purchase, replacementClaim)} className={`${iconButton} bg-gradient-to-b from-indigo-500 to-indigo-700 shadow-indigo-600/20 hover:from-indigo-600 hover:to-indigo-800 hover:shadow-indigo-600/25 focus:ring-indigo-500/20`}>
            <FiTruck size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && moneyClaim && (
        <Tooltip label={normalizeResolutionType(moneyClaim.resolutionType || moneyClaim.resolution_type) === "refund" ? "កត់ការសងបានទទួល" : "ដោះស្រាយ Credit Note"}>
          <button type="button" onClick={() => handleResolveSupplierClaim?.(purchase, moneyClaim)} className={`${iconButton} bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-emerald-600/20 hover:from-emerald-600 hover:to-emerald-800 hover:shadow-emerald-600/25 focus:ring-emerald-500/20`}>
            <FiDollarSign size={17} />
          </button>
        </Tooltip>
      )}

      {!simplified && canClaim && effectiveStatus !== STATUS.PENDING_STOCK_IN && (
        <Tooltip label="បង្កើតការទាមទារ អ្នកផ្គត់ផ្គង់">
          <button type="button" onClick={() => openPurchaseReturnModal(purchase)} className={`${iconButton} bg-gradient-to-b from-purple-500 to-purple-700 shadow-purple-600/20 hover:from-purple-600 hover:to-purple-800 hover:shadow-purple-600/25 focus:ring-purple-500/20`}>
            <FiRotateCcw size={17} />
          </button>
        </Tooltip>
      )}

      {canCancel && (
        <Tooltip label="លុបការទិញ">
          <button type="button" onClick={() => handleCancelPurchase(purchase)} className={`${iconButton} bg-gradient-to-b from-red-500 to-red-700 shadow-red-600/20 hover:from-red-600 hover:to-red-800 hover:shadow-red-600/25 focus:ring-red-500/20`}>
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
