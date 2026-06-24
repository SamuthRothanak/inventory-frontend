import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiCheckCircle,
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
import { extractApiData, formatCondition, formatCurrencyPair, formatDateOnly, formatPaymentMode, formatResolutionType } from "../utils/purchaseUtils";
import { EmptyState, FormSection, InfoLine, ModalShell, StatusBadge, SummaryMiniBox } from "./PurchaseCommon";

export function ViewPurchaseModal({
  purchase,
  purchaseReturns,
  theme,
  getStatusClass,
  getStatusIcon,
  effectiveStatus = purchase.status,
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
  const acceptedBaseQty = purchase.items.reduce(
    (total, item) => total + Number(item.acceptedQty || 0) * Number(item.conversionQty || 1),
    0
  );
  const remainingStockInBaseQty = purchase.items.reduce(
    (total, item) =>
      total +
      Math.max(0, Number(item.acceptedQty || 0) - Number(item.stockedInQty || 0)) *
        Number(item.conversionQty || 1),
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
    return type === "credit" ? "credit_note" : type;
  };
  const activeReturn = relatedReturns.find((item) => !["completed", "cancelled"].includes(normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status)));
  const hasRemainingStockIn = remainingStockInBaseQty > 0;
  const isFullyStocked = purchase.status === STATUS.RECEIVED || (purchase.items.length > 0 && !hasRemainingStockIn);
  const replacementReturn = relatedReturns.find((item) => {
    const status = normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status);
    const isReplacement = normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement";
    return isReplacement && !["completed", "cancelled", "canceled"].includes(status);
  });
  const moneyReturn = relatedReturns.find((item) => {
    const status = normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status);
    const resolutionType = normalizeResolutionType(item.resolutionType || item.resolution_type);
    return ["refund", "credit_note"].includes(resolutionType) && !["completed", "cancelled"].includes(status);
  });
  const canOpenInventory =
    hasRemainingStockIn &&
    [STATUS.PENDING_STOCK_IN, STATUS.PENDING_CLAIM].includes(effectiveStatus);
  const canCreateClaim =
    !activeReturn &&
    totalClaimQty > 0 &&
    effectiveStatus === STATUS.PENDING_CLAIM &&
    !isFullyStocked;
  const resolvedRefundUsd = relatedReturns
    .filter((item) => normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status) === "completed" && normalizeResolutionType(item.resolutionType || item.resolution_type) === "refund")
    .reduce((sum, item) => sum + Number(item.refundAmountUsd ?? item.refund_amount_usd ?? 0), 0);
  const resolvedRefundKhr = relatedReturns
    .filter((item) => normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status) === "completed" && normalizeResolutionType(item.resolutionType || item.resolution_type) === "refund")
    .reduce((sum, item) => sum + Number(item.refundAmountKhr ?? item.refund_amount_khr ?? 0), 0);
  const resolvedCreditUsd = relatedReturns
    .filter((item) => normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status) === "completed" && normalizeResolutionType(item.resolutionType || item.resolution_type) === "credit_note")
    .reduce((sum, item) => sum + Number(item.creditAmountUsd ?? item.credit_amount_usd ?? 0), 0);
  const resolvedCreditKhr = relatedReturns
    .filter((item) => normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status) === "completed" && normalizeResolutionType(item.resolutionType || item.resolution_type) === "credit_note")
    .reduce((sum, item) => sum + Number(item.creditAmountKhr ?? item.credit_amount_khr ?? 0), 0);
  const totalDeductionUsd = resolvedRefundUsd + resolvedCreditUsd;
  const totalDeductionKhr = resolvedRefundKhr + resolvedCreditKhr;
  const grandTotalUsd = Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0);
  const grandTotalKhr = Number(purchase.grandTotalKhr ?? 0);
  const netCostUsd = Math.max(0, grandTotalUsd - totalDeductionUsd);
  const netCostKhr = Math.max(0, grandTotalKhr - totalDeductionKhr);
  const hasSupplierDeduction = totalDeductionUsd > 0 || totalDeductionKhr > 0;
  const deductionLabel =
    (resolvedCreditUsd > 0 || resolvedCreditKhr > 0) && (resolvedRefundUsd > 0 || resolvedRefundKhr > 0)
      ? "ការសង + ការបញ្ចុះ Credit"
      : resolvedCreditUsd > 0 || resolvedCreditKhr > 0
        ? "ការបញ្ចុះ Credit"
        : "ការសងពី អ្នកផ្គត់ផ្គង់";

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
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
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
          {moneyReturn && (
            <button
              type="button"
              onClick={() => onResolveClaim?.(moneyReturn)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <FiDollarSign />
              {normalizeResolutionType(moneyReturn.resolutionType || moneyReturn.resolution_type) === "refund"
                ? "បញ្ជាក់ការសង"
                : "បញ្ចប់ Credit Note"}
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
              <InfoLine label="លេខការទិញ" value={purchase.purchaseNo} />
              <div>
                <p className="text-xs font-semibold text-zinc-500">ស្ថានភាព</p>
                <div className="mt-1">
                <StatusBadge status={effectiveStatus} getStatusClass={getStatusClass} getStatusIcon={getStatusIcon} />
                </div>
              </div>
              <InfoLine label="អ្នកផ្គត់ផ្គង់" value={purchase.supplierName} />
              <InfoLine label="កាលបរិច្ឆេទទិញ" value={purchase.purchaseDate} />
              <InfoLine label="របៀបទូទាត់" value={formatPaymentMode(purchase.paymentMode)} />
              <InfoLine label="ស្ថានភាពទូទាត់" value={PAYMENT_STATUS_KH[purchase.paymentStatus] || purchase.paymentStatus} />
              <InfoLine label="អត្រាប្ដូររូបិយប័ណ្ណ" value={`1 USD = KHR ${Number(purchase.exchangeRateUsed || 0).toLocaleString()}`} />
            </div>
          </FormSection>

          <FormSection title="សង្ខេបការទូទាត់" subtitle="ចំនួនកម្មង់ និងប្រាក់នៅសល់។" icon={<FiDollarSign />} theme={theme}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryMiniBox theme={theme} label="តម្លៃមុនបញ្ចុះ" value={formatCurrencyPair(purchase.subtotalUsd ?? purchase.subtotal, purchase.subtotalKhr)} />
              <SummaryMiniBox theme={theme} label="បញ្ចុះតម្លៃ" value={formatCurrencyPair(purchase.discountTotalUsd ?? purchase.discountTotal, purchase.discountTotalKhr)} />
              <SummaryMiniBox theme={theme} label="ថ្លៃដឹក" value={formatCurrencyPair(purchase.deliveryFeeUsd ?? purchase.deliveryFee, purchase.deliveryFeeKhr)} />
              <SummaryMiniBox theme={theme} label="បានបង់" value={formatCurrencyPair(purchase.paidAmountUsd ?? purchase.paidAmount, purchase.paidAmountKhr)} />
              <SummaryMiniBox theme={theme} label="នៅសល់" value={formatCurrencyPair(purchase.balanceAmountUsd ?? purchase.balanceAmount, purchase.balanceAmountKhr)} strong />
              <SummaryMiniBox theme={theme} label="តម្លៃសរុប" value={formatCurrencyPair(purchase.grandTotalUsd ?? purchase.grandTotal, purchase.grandTotalKhr)} strong />
              {hasSupplierDeduction && (
                <>
                  <div className="col-span-2 border-t border-dashed border-zinc-200 dark:border-white/10" />
                  <SummaryMiniBox
                    theme={theme}
                    label={deductionLabel}
                    value={`-${formatCurrencyPair(totalDeductionUsd, totalDeductionKhr)}`}
                    colorClass="text-amber-500"
                  />
                  <SummaryMiniBox
                    theme={theme}
                    label="តម្លៃសុទ្ធ"
                    value={formatCurrencyPair(netCostUsd, netCostKhr)}
                    strong
                    colorClass="text-emerald-500"
                  />
                </>
              )}
            </div>
          </FormSection>

          <FormSection title="ស្ថានភាពលំហូរ" subtitle="សកម្មភាពណែនាំ។" icon={<FiInfo />} theme={theme}>
            <FlowTimeline status={effectiveStatus} theme={theme} paymentMode={purchase.paymentMode} hasClaimStep={totalClaimQty > 0 || effectiveStatus === STATUS.PENDING_CLAIM} />
            <div
              className={`mt-4 rounded-xl p-4 text-sm leading-6 ${
                effectiveStatus === STATUS.RECEIVED
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
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
              {effectiveStatus === STATUS.RECEIVED && "បានបញ្ចប់: ការទិញនេះបានចូលស្តុករួចហើយ។"}
              {effectiveStatus === STATUS.DRAFT && "បន្ទាប់: បន្តកែ ហើយរក្សាទុកការទិញ។"}
              {effectiveStatus === STATUS.CANCELLED && "ការទិញនេះត្រូវបានលុបចោល។"}
            </div>
          </FormSection>
        </div>

        <FormSection title="ទំនិញការទិញ" subtitle="ចំនួនកម្មង់, បង់, ទទួល, ខូច, ទទួលយក, ទាមទារ និងផុតកំណត់។" icon={<FiPackage />} theme={theme}>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-3 py-3 text-left">ទំនិញ</th>
                  <th className="px-3 py-3 text-left">តម្លៃដើម</th>
                  <th className="px-3 py-3 text-left">វិក្កយបត្រ</th>
                  <th className="px-3 py-3 text-left">បង់</th>
                  <th className="px-3 py-3 text-left">ទទួល</th>
                  <th className="px-3 py-3 text-left">ទទួលយក</th>
                  <th className="px-3 py-3 text-left">ខូចខាត</th>
                  <th className="px-3 py-3 text-left">ទាមទារ</th>
                  {purchase.paymentMode === "partial_prepaid" && (
                    <th className="px-3 py-3 text-left">ទឹកប្រាក់នៅខ្វះ</th>
                  )}
                  <th className="px-3 py-3 text-left">ចំនួន ស្តុក</th>
                  <th className="px-3 py-3 text-left">ផុតកំណត់</th>
                  <th className="px-3 py-3 text-left">សរុប</th>
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
                    <td className="px-3 py-3">
                      <p className="font-semibold">${Number(item.unitCost ?? item.unitCostUsd ?? 0).toFixed(2)}</p>
                      <p className={`text-xs ${theme.muted}`}>ក្នុង {item.unitName}</p>
                    </td>
                    <td className="px-3 py-3">{item.invoicedQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.paidQty} {item.unitName}</td>
                    <td className="px-3 py-3">{item.receivedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-emerald-500">{item.acceptedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-amber-500">{item.damagedQty} {item.unitName}</td>
                    <td className="px-3 py-3 text-red-500">{item.claimQty} {item.unitName}</td>
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
          <FormSection title="ការទាមទារ / ត្រឡប់ទំនិញ" subtitle="ការដោះស្រាយ — ជំនួស, ការសង, ឬ Credit Note ពីអ្នកផ្គត់ផ្គង់ ។" icon={<FiRotateCcw />} theme={theme}>
            {relatedReturns.length === 0 ? (
              <EmptyState
                theme={theme}
                icon={<FiRotateCcw />}
                title={totalClaimQty > 0 ? `ត្រូវការទាមទារ: ${totalClaimQty} ${claimUnit}` : "គ្មានការទាមទារ"}
                description={
                  totalClaimQty > 0
                    ? "បង្កើតការទាមទារ អ្នកផ្គត់ផ្គង់ សម្រាប់ជំនួស, ការសង, ឬ Credit — ការទិញនេះមិនទាន់ដោះស្រាយ។"
                    : "គ្មានការត្រឡប់ ឬការទាមទារ អ្នកផ្គត់ផ្គង់ សម្រាប់ការទិញនេះ។"
                }
              />
            ) : (
              <div className="space-y-3">
                {relatedReturns.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold">{item.purchaseReturnNo}</p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>{formatCondition(item.returnReason)} · {formatResolutionType(item.resolutionType)}</p>
                      </div>
                      <StatusBadge status={item.status} getStatusClass={getPurchaseReturnStatusClass} getStatusIcon={getPurchaseReturnStatusIcon} />
                    </div>
                    <p className="mt-3 text-sm">{formatCurrencyPair(item.subtotalUsd ?? item.subtotal, item.subtotalKhr)}</p>
                    <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>{item.note || "-"}</p>
                    {normalizeResolutionType(item.resolutionType || item.resolution_type) === "replacement" &&
                      !["completed", "cancelled"].includes(normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status)) && (
                        <button
                          type="button"
                          onClick={() => onReceiveReplacement?.(item)}
                          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                        >
                          <FiTruck /> ទទួលទំនិញជំនួស
                        </button>
                      )}
                    {["refund", "credit_note"].includes(normalizeResolutionType(item.resolutionType || item.resolution_type)) &&
                      !["completed", "cancelled"].includes(normalizeReturnStatus(item.status || item.resolutionStatus || item.resolution_status)) && (
                        <button
                          type="button"
                          onClick={() => onResolveClaim?.(item)}
                          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                          <FiDollarSign />
                          {normalizeResolutionType(item.resolutionType || item.resolution_type) === "refund"
                            ? "បញ្ជាក់ការសង"
                            : "បញ្ចប់ Credit Note"}
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          <FormSection title="ចលនាស្តុក" subtitle="បង្កើតបន្ទាប់ពីបញ្ជាក់ ស្តុក។" icon={<FiPackage />} theme={theme}>
            {relatedMovements.length === 0 ? (
              <EmptyState
                theme={theme}
                icon={<FiPackage />}
                title={acceptedBaseQty > 0 ? `រង់ចាំ ស្តុក: ${acceptedBaseQty} ${acceptedBaseUnit}` : "គ្មានចលនាស្តុក"}
                description={
                  acceptedBaseQty > 0
                    ? "ចំនួនទទួលយករួចរាល់, ប៉ុន្តែចលនាស្តុកនឹងបង្កើតតែបន្ទាប់ពីបញ្ជាក់ ស្តុក ប៉ុណ្ណោះ។"
                    : "ចលនាស្តុកនឹងបង្ហាញបន្ទាប់ពីបញ្ជាក់ ស្តុក។"
                }
              />
            ) : (
              <div className="space-y-3">
                {relatedMovements.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                    <p className="text-sm font-bold">{item.variantName}</p>
                    <p className="mt-1 text-sm text-emerald-500">+{item.qtyBase}</p>
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

export function FlowTimeline({ status, theme, paymentMode = "", hasClaimStep = false }) {
  const isPayAfterCheck = paymentMode === "pay_after_check";
  const steps = [
    STATUS.DRAFT,
    ...(isPayAfterCheck ? [] : [STATUS.PENDING_RECEIVE]),
    ...(hasClaimStep ? [STATUS.PENDING_CLAIM] : []),
    STATUS.PENDING_STOCK_IN,
    STATUS.RECEIVED,
  ];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const active = step === status;
        const done = currentIndex > index;
        const isCompletedStep = active && step === STATUS.RECEIVED;

        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                isCompletedStep
                  ? "bg-emerald-500 text-white"
                  : active
                  ? "bg-red-500 text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-400"
              }`}
            >
              {done ? <FiCheckCircle /> : index + 1}
            </div>
            <p className={`text-sm ${isCompletedStep ? "font-bold text-emerald-500" : active ? "font-bold text-red-500" : theme.muted}`}>{STATUS_LABEL[step] ?? step}</p>
          </div>
        );
      })}
    </div>
  );
}
