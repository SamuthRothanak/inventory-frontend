import React from "react";
import { FiCalendar, FiCheckCircle, FiHash, FiPackage, FiRotateCcw, FiSave } from "react-icons/fi";
import { formatCurrencyPair, formatDateOnly } from "../utils/purchaseUtils";
import { FormInput, FormSection, ModalShell } from "./PurchaseCommon";

export function ReceiveReplacementModal({
  purchase,
  purchaseReturn,
  items,
  errors,
  theme,
  onChangeItem,
  onClose,
  onSave,
  isSaving = false,
}) {
  return (
    <ModalShell
      title="Receive Supplier Replacement"
      subtitle={`Receive replacement from ${purchaseReturn?.purchaseReturnNo || "supplier claim"} before or after inventory confirmation.`}
      theme={theme}
      onClose={onClose}
      width="max-w-5xl"
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
            disabled={isSaving}
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave /> {isSaving ? "Saving..." : "Save Replacement"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <FiRotateCcw />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>Supplier Claim</p>
                <p className="mt-1 font-bold">{purchaseReturn?.purchaseReturnNo || purchaseReturn?.purchase_return_no || "-"}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>Original Purchase</p>
                <p className="mt-1 font-bold">{purchase?.purchaseNo || purchase?.purchase_no || "-"}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>Resolution</p>
                <p className="mt-1 font-bold">Supplier replacement</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 text-sm leading-6 ${theme.softCard}`}>
          {purchase.status === "Received"
            ? "This purchase is already stocked in. Replacement will create a new purchase-return stock movement."
            : "This purchase is not stocked in yet. Replacement will be folded into receiving quantities, then Inventory will stock in once."}
        </div>

        <FormSection
          title="Replacement Items"
          subtitle="Set the expiry date for the goods received from supplier."
          icon={<FiPackage />}
          theme={theme}
        >
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${item.purchaseItemId}-${index}`} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr_1fr] lg:items-end">
                  <div>
                    <p className="text-sm font-bold">{item.variantName}</p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Claim {item.qty} {item.unitName} = {item.baseQty} {item.baseUnit}
                    </p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Original expiry: {formatDateOnly(item.originalExpiry)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${theme.muted}`}>Claim value</p>
                    <p className="mt-2 text-sm font-semibold">{formatCurrencyPair(item.lineTotalUsd, item.lineTotalKhr)}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${theme.muted}`}>Handling</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatDateOnly(item.originalExpiry) === formatDateOnly(item.expiryDate) ? "Merge same expiry" : "Create separate batch"}
                    </p>
                  </div>
                  <FormInput
                    label="Replacement Lot No"
                    value={item.lotNo || ""}
                    error={errors?.items?.[index]?.lotNo}
                    onChange={(value) => onChangeItem(index, "lotNo", value)}
                    theme={theme}
                    icon={<FiHash />}
                    placeholder="Optional"
                  />
                  <FormInput
                    label="Replacement Expiry"
                    type="date"
                    value={item.expiryDate}
                    error={errors?.items?.[index]?.expiryDate}
                    onChange={(value) => onChangeItem(index, "expiryDate", value)}
                    theme={theme}
                    icon={<FiCalendar />}
                  />
                </div>
              </div>
            ))}
          </div>
          {errors?.form && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{errors.form}</div>}
        </FormSection>

        <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <FiCheckCircle />
            </div>
            <div>
              <p className="text-sm font-bold">Inventory rule</p>
              <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
                Same expiry is merged into the original purchase line. Different expiry is kept as a separate receiving line so Inventory can create a separate batch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
