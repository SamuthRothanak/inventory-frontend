import React from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHash,
  FiPackage,
  FiPlus,
  FiRotateCcw,
  FiSave,
  FiShoppingCart,
  FiTrash,
} from "react-icons/fi";
import { formatCurrencyPair, formatPaymentMode, formatSnake } from "../utils/purchaseUtils";
import { EmptyState, FormInput, FormSection, FormSelect, FormTextarea, ModalShell, SummaryMiniBox } from "./PurchaseCommon";

const conditionOptions = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "wrong_item", label: "Wrong Item" },
  { value: "good", label: "Good" },
  { value: "other", label: "Other" },
];

const returnReasonOptions = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "wrong_item", label: "Wrong Item" },
  { value: "over_supplied", label: "Over Supplied" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

function getResolutionDetail(item, resolutionType) {
  if (resolutionType === "refund") {
    return `Supplier refunds ${formatCurrencyPair(item.refundAmountUsd, item.refundAmountKhr)}`;
  }
  if (resolutionType === "credit" || resolutionType === "credit_note") {
    return `Supplier gives credit ${formatCurrencyPair(item.creditAmountUsd, item.creditAmountKhr)}`;
  }
  if (resolutionType === "discount") {
    return `Supplier gives discount ${formatCurrencyPair(item.creditAmountUsd, item.creditAmountKhr)}`;
  }
  return `Supplier replaces ${item.replacementQty || item.qtyReturned || 0} ${item.unitName}; received ${item.replacementReceivedQty || 0}`;
}

export function PurchaseReturnModal({
  purchase,
  form,
  items,
  itemForm,
  errors,
  itemErrors,
  theme,
  onChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  getAvailableReturnQty,
  onClose,
  onSave,
}) {
  const subtotalUsd = items.reduce((total, item) => total + Number(item.lineTotalUsd ?? item.lineTotal ?? 0), 0);
  const subtotalKhr = items.reduce((total, item) => total + Number(item.lineTotalKhr || 0), 0);
  const availableItems = purchase.items
    .map((item) => ({
      ...item,
      availableQty: getAvailableReturnQty(item),
    }))
    .filter((item) => Number(item.availableQty || 0) > 0);
  const hasPreparedItems = items.length > 0;

  return (
    <ModalShell
      title="Supplier Claim / Purchase Return"
      subtitle={`Create the supplier resolution for damaged goods from ${purchase.purchaseNo}.`}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
          >
            <FiSave /> Save Supplier Claim
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold">What this does</p>
              <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
                This does not add stock. It records the damaged quantity and how the supplier will solve it: replacement, refund, or credit.
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-300">
              Current claim value: {formatCurrencyPair(subtotalUsd, subtotalKhr)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FormSection title="Supplier Resolution" subtitle="Choose how the supplier will solve this damaged quantity." icon={<FiRotateCcw />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="Claim No" required value={form.purchaseReturnNo} error={errors.purchaseReturnNo} onChange={(value) => onChange("purchaseReturnNo", value)} theme={theme} icon={<FiHash />} />
              <FormInput label="Return Date" required type="date" value={form.returnDate} error={errors.returnDate} onChange={(value) => onChange("returnDate", value)} theme={theme} icon={<FiCalendar />} />
              <FormSelect label="Return Reason" value={form.returnReason} onChange={(value) => onChange("returnReason", value)} theme={theme} icon={<FiAlertTriangle />} options={returnReasonOptions} />
              <FormSelect
                label="Resolution Type"
                required
                value={form.resolutionType}
                error={errors.resolutionType}
                onChange={(value) => onChange("resolutionType", value)}
                theme={theme}
                icon={<FiCheckCircle />}
                options={[
                  { value: "replacement", label: "Replacement" },
                  { value: "refund", label: "Refund" },
                  { value: "credit_note", label: "Credit Note" },
                  { value: "discount", label: "Discount" },
                  { value: "none", label: "None" },
                ]}
              />
              <FormSelect
                label="Resolution Status"
                value={form.resolutionStatus}
                onChange={(value) => onChange("resolutionStatus", value)}
                theme={theme}
                icon={<FiClock />}
                options={[
                  { value: "submitted", label: "Submitted" },
                  { value: "approved", label: "Approved" },
                  { value: "resolved", label: "Resolved / Completed" },
                  { value: "rejected", label: "Rejected" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>
            <div className="mt-4">
              <FormTextarea label="Note" value={form.note} onChange={(value) => onChange("note", value)} theme={theme} placeholder="Describe the supplier claim..." icon={<FiFileText />} />
            </div>
          </FormSection>

          <FormSection title="Source Purchase" subtitle="Read-only purchase information for this claim." icon={<FiShoppingCart />} theme={theme}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryMiniBox theme={theme} label="Purchase No" value={purchase.purchaseNo} />
              <SummaryMiniBox theme={theme} label="Supplier" value={purchase.supplierName} />
              <SummaryMiniBox theme={theme} label="Payment Mode" value={formatPaymentMode(purchase.paymentMode)} />
              <SummaryMiniBox theme={theme} label="Claim Value" value={formatCurrencyPair(subtotalUsd, subtotalKhr)} strong />
            </div>
          </FormSection>
        </div>

        <FormSection
          title={availableItems.length > 0 ? "Add Another Damaged Item" : "Damaged Items Ready"}
          subtitle={availableItems.length > 0 ? "Only add more lines if this claim contains another damaged item." : "The damaged quantity from this purchase is already prepared below."}
          icon={<FiPackage />}
          theme={theme}
        >
          {availableItems.length === 0 ? (
            <div className={`rounded-2xl border p-4 text-sm ${theme.softCard}`}>
              {hasPreparedItems ? "No more damaged quantity is available to add. Review the item below and save the supplier claim." : "There is no damaged or claim quantity for this purchase."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr_auto]">
              <FormSelect
                label="Purchase Item"
                required
                value={itemForm.purchaseItemId}
                error={itemErrors.purchaseItemId}
                onChange={(value) => onItemChange("purchaseItemId", value)}
                theme={theme}
                icon={<FiPackage />}
                options={[
                  { value: "", label: "Select item" },
                  ...availableItems.map((item) => ({
                    value: item.id,
                    label: `${item.variantName} - available ${item.availableQty} ${item.unitName}`,
                  })),
                ]}
              />
              <FormInput label="Claim Qty" required type="number" value={itemForm.qtyReturned} error={itemErrors.qtyReturned} onChange={(value) => onItemChange("qtyReturned", value)} theme={theme} icon={<FiHash />} />
              <FormSelect label="Condition" required value={itemForm.condition} error={itemErrors.condition} onChange={(value) => onItemChange("condition", value)} theme={theme} icon={<FiAlertTriangle />} options={conditionOptions} />
              <FormInput label="Reason" required value={itemForm.reason} error={itemErrors.reason} onChange={(value) => onItemChange("reason", value)} theme={theme} icon={<FiFileText />} />
              <div className="flex items-end">
                <button type="button" onClick={onAddItem} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
                  <FiPlus /> Add
                </button>
              </div>
            </div>
          )}

          {errors.items && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">{errors.items}</div>}
        </FormSection>

        <FormSection title="Items Sent To Supplier" subtitle="These are the damaged quantities included in this supplier claim." icon={<FiFileText />} theme={theme}>
          {items.length === 0 ? (
            <EmptyState theme={theme} icon={<FiPackage />} title="No claim items" description="Add at least one problem item before saving supplier claim." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Product</th>
                    <th className="px-3 py-3 text-left">Damaged Qty</th>
                    <th className="px-3 py-3 text-left">Inventory Qty</th>
                    <th className="px-3 py-3 text-left">Condition</th>
                    <th className="px-3 py-3 text-left">Supplier Action</th>
                    <th className="px-3 py-3 text-left">Claim Value</th>
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                      <td className="px-3 py-3">
                        <p className="font-semibold">{item.variantName}</p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>{item.reason}</p>
                      </td>
                      <td className="px-3 py-3">{item.qtyReturned} {item.unitName}</td>
                      <td className="px-3 py-3">{item.baseQtyReturned} {item.baseUnit}</td>
                      <td className="px-3 py-3 capitalize">{formatSnake(item.condition)}</td>
                      <td className="px-3 py-3">{getResolutionDetail(item, form.resolutionType)}</td>
                      <td className="px-3 py-3 font-semibold">{formatCurrencyPair(item.lineTotalUsd ?? item.lineTotal, item.lineTotalKhr)}</td>
                      <td className="px-3 py-3 text-center">
                        <button type="button" onClick={() => onRemoveItem(index)} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600">
                          <FiTrash size={15} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>
      </div>
    </ModalShell>
  );
}
