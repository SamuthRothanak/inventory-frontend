import React from "react";
import {
  FiCheckCircle,
  FiDollarSign,
  FiInfo,
  FiPackage,
  FiRotateCcw,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";
import { STATUS } from "../utils/purchaseConstants";
import { formatCurrencyPair, formatDateOnly, formatPaymentMode, formatSnake } from "../utils/purchaseUtils";
import { EmptyState, FormSection, InfoLine, ModalShell, StatusBadge, SummaryMiniBox } from "./PurchaseCommon";

export function ViewPurchaseModal({
  purchase,
  purchaseReturns,
  stockMovements,
  theme,
  getStatusClass,
  getStatusIcon,
  effectiveStatus = purchase.status,
  getPurchaseReturnStatusClass,
  getPurchaseReturnStatusIcon,
  onClose,
  onReturn,
  onReceiveReplacement,
  onConfirmStockIn,
}) {
  const relatedReturns = [
    ...(Array.isArray(purchase.returns) ? purchase.returns : []),
    ...purchaseReturns.filter((item) => item.purchaseId === purchase.id),
  ];
  const relatedMovements = stockMovements.filter((item) => item.purchaseId === purchase.id);
  const claimItems = purchase.items.filter((item) => Number(item.claimQty || 0) > 0);
  const totalClaimQty = claimItems.reduce((total, item) => total + Number(item.claimQty || 0), 0);
  const claimUnit = claimItems[0]?.unitName || "unit";
  const acceptedBaseQty = purchase.items.reduce(
    (total, item) => total + Number(item.acceptedQty || 0) * Number(item.conversionQty || 1),
    0
  );
  const acceptedBaseUnit = purchase.items.find((item) => Number(item.acceptedQty || 0) > 0)?.baseUnit || "base unit";
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
  const activeReturn = relatedReturns.find((item) => !["completed", "cancelled"].includes(normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status)));
  const hasUnappliedClaimQty = claimItems.length > 0;
  const isAlreadyStocked = purchase.status === STATUS.RECEIVED || purchase.items.some((item) => Number(item.stockedInQty || 0) > 0);
  const replacementReturn = relatedReturns.find((item) => {
    const status = normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status);
    const isReplacement = normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement";
    const isOpen = !["completed", "cancelled", "canceled"].includes(status);
    const isResolvedButNotApplied = status === "completed" && hasUnappliedClaimQty && !isAlreadyStocked;
    return isReplacement && (isOpen || isResolvedButNotApplied);
  });
  const canCreateClaim =
    !activeReturn &&
    totalClaimQty > 0 &&
    effectiveStatus !== STATUS.PENDING_RECEIVE &&
    effectiveStatus !== STATUS.CANCELLED;

  return (
    <ModalShell
      title={`Purchase Detail: ${purchase.purchaseNo}`}
      subtitle="View purchase information, items, supplier claims, and inventory handoff."
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Close
          </button>
          {canCreateClaim && (
            <button
              type="button"
              onClick={onReturn}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <FiRotateCcw /> Supplier Claim / Return
            </button>
          )}
          {replacementReturn && (
            <button
              type="button"
              onClick={() => onReceiveReplacement?.(replacementReturn)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <FiTruck /> Receive Replacement
            </button>
          )}
          <button
            type="button"
            onClick={onConfirmStockIn}
            disabled={effectiveStatus !== STATUS.PENDING_STOCK_IN}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheckCircle /> Open in Inventory
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormSection title="Purchase Overview" subtitle="Supplier, invoice date, status and payment mode." icon={<FiShoppingCart />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoLine label="Purchase No" value={purchase.purchaseNo} />
              <div>
                <p className="text-xs font-semibold text-zinc-500">Status</p>
                <div className="mt-1">
                <StatusBadge status={effectiveStatus} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
                </div>
              </div>
              <InfoLine label="Supplier" value={purchase.supplierName} />
              <InfoLine label="Purchase Date" value={purchase.purchaseDate} />
              <InfoLine label="Payment Mode" value={formatPaymentMode(purchase.paymentMode)} />
              <InfoLine label="Payment Status" value={purchase.paymentStatus} />
              <InfoLine label="Exchange Rate Used" value={`1 USD = KHR ${Number(purchase.exchangeRateUsed || 0).toLocaleString()}`} />
            </div>
          </FormSection>

          <FormSection title="Payment Summary" subtitle="Invoice total and balance." icon={<FiDollarSign />} theme={theme}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryMiniBox theme={theme} label="Subtotal" value={formatCurrencyPair(purchase.subtotalUsd ?? purchase.subtotal, purchase.subtotalKhr)} />
              <SummaryMiniBox theme={theme} label="Discount" value={formatCurrencyPair(purchase.discountTotalUsd ?? purchase.discountTotal, purchase.discountTotalKhr)} />
              <SummaryMiniBox theme={theme} label="Delivery Fee" value={formatCurrencyPair(purchase.deliveryFeeUsd ?? purchase.deliveryFee, purchase.deliveryFeeKhr)} />
              <SummaryMiniBox theme={theme} label="Paid" value={formatCurrencyPair(purchase.paidAmountUsd ?? purchase.paidAmount, purchase.paidAmountKhr)} />
              <SummaryMiniBox theme={theme} label="Balance" value={formatCurrencyPair(purchase.balanceAmountUsd ?? purchase.balanceAmount, purchase.balanceAmountKhr)} strong />
              <SummaryMiniBox theme={theme} label="Grand Total" value={formatCurrencyPair(purchase.grandTotalUsd ?? purchase.grandTotal, purchase.grandTotalKhr)} strong />
            </div>
          </FormSection>

          <FormSection title="Flow Status" subtitle="Recommended user action." icon={<FiInfo />} theme={theme}>
            <FlowTimeline status={effectiveStatus} theme={theme} />
            <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-400">
              {effectiveStatus === STATUS.PENDING_RECEIVE && "Next: receive goods and enter damaged / accepted quantity."}
              {effectiveStatus === STATUS.PENDING_CLAIM && "Next: create supplier claim for damaged prepaid goods."}
              {effectiveStatus === STATUS.PENDING_STOCK_IN && "Next: open this purchase in Inventory and confirm stock in one time. Only accepted quantity enters inventory."}
              {effectiveStatus === STATUS.RECEIVED && "Completed: this purchase already entered stock."}
              {effectiveStatus === STATUS.DRAFT && "Next: continue editing and save purchase."}
              {effectiveStatus === STATUS.CANCELLED && "This purchase was cancelled."}
            </div>
          </FormSection>
        </div>

        <FormSection title="Purchase Items" subtitle="Invoiced, paid, received, damaged, accepted, claim and expiry quantity." icon={<FiPackage />} theme={theme}>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-3 py-3 text-left">Product</th>
                  <th className="px-3 py-3 text-left">Invoiced</th>
                  <th className="px-3 py-3 text-left">Paid</th>
                  <th className="px-3 py-3 text-left">Received</th>
                  <th className="px-3 py-3 text-left">Accepted</th>
                  <th className="px-3 py-3 text-left">Damaged</th>
                  <th className="px-3 py-3 text-left">Claim</th>
                  <th className="px-3 py-3 text-left">Inventory Qty</th>
                  <th className="px-3 py-3 text-left">Expiry</th>
                  <th className="px-3 py-3 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                    <td className="px-3 py-3">
                      <p className="font-semibold">{item.variantName}</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        {item.variantCode} - {item.unitName} = {item.conversionQty} {item.baseUnit}
                      </p>
                    </td>
                    <td className="px-3 py-3">{item.invoicedQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.paidQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.receivedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-emerald-500">{item.acceptedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-amber-500">{item.damagedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-red-500">{item.claimQty} {item.unitName}</td>
                    <td className="px-3 py-3">{Number(item.acceptedQty || 0) * Number(item.conversionQty || 1)} {item.baseUnit}</td>
                    <td className="px-3 py-3">{formatDateOnly(item.expiredDate)}</td>
                    <td className="px-3 py-3 font-semibold">{formatCurrencyPair(item.lineTotalUsd ?? item.lineTotal, item.lineTotalKhr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FormSection title="Supplier Claims / Purchase Returns" subtitle="Replacement, refund, or credit workflow for damaged prepaid goods." icon={<FiRotateCcw />} theme={theme}>
            {relatedReturns.length === 0 ? (
              <EmptyState
                theme={theme}
                icon={<FiRotateCcw />}
                title={totalClaimQty > 0 ? `Claim needed: ${totalClaimQty} ${claimUnit}` : "No supplier claim"}
                description={
                  totalClaimQty > 0
                    ? "Create a supplier claim/return for replacement, refund, or credit. This purchase is not resolved yet."
                    : "No purchase return or supplier claim has been created for this purchase."
                }
              />
            ) : (
              <div className="space-y-3">
                {relatedReturns.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold">{item.purchaseReturnNo}</p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>{formatSnake(item.returnReason)} - {formatSnake(item.resolutionType)}</p>
                      </div>
                      <StatusBadge status={item.status} getStatusClass={getPurchaseReturnStatusClass} getStatusIcon={getPurchaseReturnStatusIcon} />
                    </div>
                    <p className="mt-3 text-sm">{formatCurrencyPair(item.subtotalUsd ?? item.subtotal, item.subtotalKhr)}</p>
                    <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>{item.note || "-"}</p>
                    {normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement" &&
                      (!["completed", "cancelled"].includes(normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status)) ||
                        (normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status) === "completed" &&
                          hasUnappliedClaimQty &&
                          !isAlreadyStocked)) && (
                        <button
                          type="button"
                          onClick={() => onReceiveReplacement?.(item)}
                          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                        >
                          <FiTruck /> Receive Replacement
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          <FormSection title="Stock Movements" subtitle="Generated after Inventory confirmation." icon={<FiPackage />} theme={theme}>
            {relatedMovements.length === 0 ? (
              <EmptyState
                theme={theme}
                icon={<FiPackage />}
                title={acceptedBaseQty > 0 ? `Waiting Inventory: ${acceptedBaseQty} ${acceptedBaseUnit}` : "No stock movement"}
                description={
                  acceptedBaseQty > 0
                    ? "Accepted quantity is ready, but stock movement is generated only after Inventory confirmation."
                    : "Stock movement will appear after Inventory confirmation."
                }
              />
            ) : (
              <div className="space-y-3">
                {relatedMovements.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                    <p className="text-sm font-bold">{item.variantName}</p>
                    <p className="mt-1 text-sm text-emerald-500">+{item.qtyBase} {item.baseUnit}</p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>{item.note}</p>
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        </div>
      </div>
    </ModalShell>
  );
}

export function FlowTimeline({ status, theme }) {
  const steps = [STATUS.DRAFT, STATUS.PENDING_RECEIVE, STATUS.PENDING_CLAIM, STATUS.PENDING_STOCK_IN, STATUS.RECEIVED];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const active = step === status;
        const done = currentIndex > index;

        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                active
                  ? "bg-red-500 text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"
              }`}
            >
              {done ? <FiCheckCircle /> : index + 1}
            </div>
            <p className={`text-sm ${active ? "font-bold text-red-500" : theme.muted}`}>{step}</p>
          </div>
        );
      })}
    </div>
  );
}
