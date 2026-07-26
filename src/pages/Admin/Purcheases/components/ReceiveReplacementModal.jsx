import React from "react";
import { FiArrowRight, FiCalendar, FiCheckCircle, FiHash, FiPackage, FiRotateCcw, FiSave } from "react-icons/fi";
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
      title="ទទួលទំនិញជំនួស អ្នកផ្គត់ផ្គង់"
      subtitle={`បញ្ជាក់ Lot និងថ្ងៃផុតកំណត់សម្រាប់ទំនិញជំនួស ${purchaseReturn?.purchaseReturnNo || ""}`}
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
            បោះបង់
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave /> {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទំនិញជំនួស"}
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
                <p className={`text-xs font-semibold ${theme.muted}`}>ការទាមទារ អ្នកផ្គត់ផ្គង់</p>
                <p className="mt-1 font-bold">{purchaseReturn?.purchaseReturnNo || purchaseReturn?.purchase_return_no || "-"}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>ការទិញដើម</p>
                <p className="mt-1 font-bold">{purchase?.purchaseNo || purchase?.purchase_no || "-"}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>ដំណោះស្រាយ</p>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <FiPackage size={12} />
                  ទំនិញ
                  <FiArrowRight size={11} />
                  ទំនិញ
                </div>
              </div>
            </div>
          </div>
        </div>

<FormSection
          title="ទំនិញជំនួស"
          subtitle="កំណត់ Lot និងថ្ងៃផុតកំណត់សម្រាប់ទំនិញទទួល។"
          icon={<FiPackage />}
          theme={theme}
        >
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={`${item.purchaseItemId}-${index}`} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                {/* Info row — read-only context about this line, at a glance */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-white/10">
                  <div>
                    <p className="text-sm font-bold">{item.variantName}</p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      ថ្ងៃផុតកំណត់ដើម {formatDateOnly(item.originalExpiry)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                        ខូច/ទាមទារ {item.claimedQty ?? item.maxQty ?? item.qty} {item.unitName}
                      </span>
                      {Number(item.receivedSoFarQty) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ទទួលរួច {item.receivedSoFarQty} {item.unitName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        នៅសល់ត្រូវទទួល {item.maxQty ?? item.qty} {item.unitName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className={`text-xs font-semibold ${theme.muted}`}>តម្លៃទាមទារ</p>
                      <p className="mt-0.5 text-sm font-semibold">{formatCurrencyPair(item.lineTotalUsd, item.lineTotalKhr)}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${theme.muted}`}>ការគ្រប់គ្រង</p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {formatDateOnly(item.originalExpiry) === formatDateOnly(item.expiryDate) ? "បញ្ចូលរួម" : "Batch ថ្មី"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action row — what actually needs to be filled in for this receipt */}
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormInput
                    label="ចំនួនទទួលបានលើកនេះ"
                    type="number"
                    value={item.qty}
                    error={errors?.items?.[index]?.qty}
                    onChange={(value) => {
                      const maxQty = Number(item.maxQty ?? item.qty ?? 0);
                      const numericValue = Number(value);
                      const nextValue = maxQty > 0 && Number.isFinite(numericValue) && numericValue > maxQty ? maxQty : value;
                      onChangeItem(index, "qty", nextValue);
                    }}
                    theme={theme}
                    icon={<FiPackage />}
                    decimalPlaces={4}
                    helper={`អតិបរមា ${item.maxQty ?? item.qty} ${item.unitName}`}
                  />
                  <FormInput
                    label="លេខ Lot ជំនួស"
                    value={item.lotNo || ""}
                    error={errors?.items?.[index]?.lotNo}
                    onChange={(value) => onChangeItem(index, "lotNo", value)}
                    theme={theme}
                    icon={<FiHash />}
                    placeholder="ស្រេចចិត្ត"
                  />
                  <FormInput
                    label="ថ្ងៃផុតកំណត់ជំនួស"
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
              <p className="text-sm font-bold">វិធាន ស្តុក</p>
              <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
                ថ្ងៃផុតកំណត់ដូចគ្នា → បញ្ចូលរួម · ថ្ងៃផុតកំណត់ខុស → Batch ថ្មី
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
