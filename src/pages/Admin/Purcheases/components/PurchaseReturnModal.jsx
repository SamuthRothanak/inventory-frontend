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
  { value: "damaged", label: "ខូចខាត" },
  { value: "expired", label: "ផុតកំណត់" },
  { value: "wrong_item", label: "ទំនិញខុស" },
  { value: "good", label: "ល្អ" },
  { value: "other", label: "ផ្សេងទៀត" },
];

const returnReasonOptions = [
  { value: "damaged", label: "ខូចខាត" },
  { value: "expired", label: "ផុតកំណត់" },
  { value: "wrong_item", label: "ទំនិញខុស" },
  { value: "over_supplied", label: "ដឹកលើស" },
  { value: "quality_issue", label: "បញ្ហាគុណភាព" },
  { value: "other", label: "ផ្សេងទៀត" },
];

function getResolutionDetail(item, resolutionType) {
  if (resolutionType === "refund") {
    return `អ្នកផ្គត់ផ្គង់ សង ${formatCurrencyPair(item.refundAmountUsd, item.refundAmountKhr)}`;
  }
  if (resolutionType === "credit" || resolutionType === "credit_note") {
    return `អ្នកផ្គត់ផ្គង់ ឲ Credit ${formatCurrencyPair(item.creditAmountUsd, item.creditAmountKhr)}`;
  }
  return `អ្នកផ្គត់ផ្គង់ ជំនួស ${item.replacementQty || item.qtyReturned || 0} ${item.unitName}; ទទួល ${item.replacementReceivedQty || 0}`;
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
      title="ការទាមទារ អ្នកផ្គត់ផ្គង់ / ត្រឡប់ទំនិញ"
      subtitle={`បង្កើតដំណោះស្រាយ អ្នកផ្គត់ផ្គង់ សម្រាប់ទំនិញខូចពី ${purchase.purchaseNo}។`}
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
            បោះបង់
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
          >
            <FiSave /> រក្សាទុកការទាមទារ
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold">មុខងារ</p>
              <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
                មិនបន្ថែមស្តុកទេ — វាកត់ចំនួនខូច និងរបៀបដែល អ្នកផ្គត់ផ្គង់ នឹងដោះស្រាយ: ជំនួស, សង, ឬ Credit។
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-300">
              តម្លៃទាមទារបច្ចុប្បន្ន: {formatCurrencyPair(subtotalUsd, subtotalKhr)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FormSection title="ដំណោះស្រាយ អ្នកផ្គត់ផ្គង់" subtitle="ជ្រើសរបៀបដែល អ្នកផ្គត់ផ្គង់ នឹងដោះស្រាយចំនួនខូច។" icon={<FiRotateCcw />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="លេខការទាមទារ" required value={form.purchaseReturnNo} error={errors.purchaseReturnNo} onChange={(value) => onChange("purchaseReturnNo", value)} theme={theme} icon={<FiHash />} />
              <FormInput label="កាលបរិច្ឆេទត្រឡប់" required type="date" value={form.returnDate} error={errors.returnDate} onChange={(value) => onChange("returnDate", value)} theme={theme} icon={<FiCalendar />} />
              <FormSelect label="មូលហេតុត្រឡប់" value={form.returnReason} onChange={(value) => onChange("returnReason", value)} theme={theme} icon={<FiAlertTriangle />} options={returnReasonOptions} />
              <FormSelect
                label="ប្រភេទដំណោះស្រាយ"
                required
                value={form.resolutionType}
                error={errors.resolutionType}
                onChange={(value) => onChange("resolutionType", value)}
                theme={theme}
                icon={<FiCheckCircle />}
                options={[
                  { value: "replacement", label: "ជំនួស" },
                  { value: "refund", label: "ការសង" },
                  { value: "credit_note", label: "Credit Note" },
                  { value: "none", label: "គ្មាន" },
                ]}
              />
              <FormSelect
                label="ស្ថានភាពដំណោះស្រាយ"
                value={form.resolutionStatus}
                onChange={(value) => onChange("resolutionStatus", value)}
                theme={theme}
                icon={<FiClock />}
                options={[
                  { value: "submitted", label: "បានដាក់ស្នើ" },
                  { value: "approved", label: "បានអនុម័ត" },
                  { value: "resolved", label: "បានដោះស្រាយ" },
                  { value: "rejected", label: "បានបដិសេធ" },
                  { value: "cancelled", label: "បានលុបចោល" },
                ]}
              />
            </div>
            <div className="mt-4">
              <FormTextarea label="កំណត់ចំណាំ" value={form.note} onChange={(value) => onChange("note", value)} theme={theme} placeholder="ពិពណ៌នាការទាមទារ អ្នកផ្គត់ផ្គង់..." icon={<FiFileText />} />
            </div>
          </FormSection>

          <FormSection title="ព័ត៌មានការទិញ" subtitle="ព័ត៌មានអានតែ — ការទិញដើម។" icon={<FiShoppingCart />} theme={theme}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryMiniBox theme={theme} label="លេខការទិញ" value={purchase.purchaseNo} />
              <SummaryMiniBox theme={theme} label="អ្នកផ្គត់ផ្គង់" value={purchase.supplierName} />
              <SummaryMiniBox theme={theme} label="របៀបទូទាត់" value={formatPaymentMode(purchase.paymentMode)} />
              <SummaryMiniBox theme={theme} label="តម្លៃទាមទារ" value={formatCurrencyPair(subtotalUsd, subtotalKhr)} strong />
            </div>
          </FormSection>
        </div>

        <FormSection
          title={availableItems.length > 0 ? "បន្ថែមទំនិញខូចផ្សេងទៀត" : "ទំនិញខូចរួចរាល់"}
          subtitle={availableItems.length > 0 ? "បន្ថែមបន្ទាត់ថ្មីតែបើការទាមទារនេះមានទំនិញខូចផ្សេងទៀត។" : "ចំនួនខូចពីការទិញនេះត្រូវបានរៀបចំខាងក្រោម។"}
          icon={<FiPackage />}
          theme={theme}
        >
          {availableItems.length === 0 ? (
            <div className={`rounded-2xl border p-4 text-sm ${theme.softCard}`}>
              {hasPreparedItems ? "គ្មានចំនួនខូចទៀតដែលអាចបន្ថែម។ ពិនិត្យទំនិញខាងក្រោម ហើយរក្សាទុកការទាមទារ អ្នកផ្គត់ផ្គង់។" : "គ្មានចំនួនខូចឬទាមទារសម្រាប់ការទិញនេះ។"}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr_auto]">
              <FormSelect
                label="ទំនិញការទិញ"
                required
                value={itemForm.purchaseItemId}
                error={itemErrors.purchaseItemId}
                onChange={(value) => onItemChange("purchaseItemId", value)}
                theme={theme}
                icon={<FiPackage />}
                options={[
                  { value: "", label: "ជ្រើសទំនិញ" },
                  ...availableItems.map((item) => ({
                    value: item.id,
                    label: `${item.variantName} - នៅ ${item.availableQty} ${item.unitName}`,
                  })),
                ]}
                searchable
              />
              <FormInput label="ចំនួនទាមទារ" required type="number" value={itemForm.qtyReturned} error={itemErrors.qtyReturned} onChange={(value) => onItemChange("qtyReturned", value)} theme={theme} icon={<FiHash />} />
              <FormSelect label="លក្ខខណ្ឌ" required value={itemForm.condition} error={itemErrors.condition} onChange={(value) => onItemChange("condition", value)} theme={theme} icon={<FiAlertTriangle />} options={conditionOptions} />
              <FormInput label="មូលហេតុ" required value={itemForm.reason} error={itemErrors.reason} onChange={(value) => onItemChange("reason", value)} theme={theme} icon={<FiFileText />} />
              <div className="flex items-end">
                <button type="button" onClick={onAddItem} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
                  <FiPlus /> បន្ថែម
                </button>
              </div>
            </div>
          )}

          {errors.items && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">{errors.items}</div>}
        </FormSection>

        <FormSection title="ទំនិញបានផ្ញើ អ្នកផ្គត់ផ្គង់" subtitle="ចំនួនខូចដែលរួមបញ្ចូលក្នុងការទាមទារ អ្នកផ្គត់ផ្គង់ នេះ។" icon={<FiFileText />} theme={theme}>
          {items.length === 0 ? (
            <EmptyState theme={theme} icon={<FiPackage />} title="គ្មានទំនិញទាមទារ" description="បន្ថែមទំនិញយ៉ាងហោចណាស់មួយ មុនពេលរក្សាទុកការទាមទារ អ្នកផ្គត់ផ្គង់។" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">ផលិតផល</th>
                    <th className="px-3 py-3 text-left">ចំនួនខូច</th>
                    <th className="px-3 py-3 text-left">ចំនួនស្តុក</th>
                    <th className="px-3 py-3 text-left">លក្ខខណ្ឌ</th>
                    <th className="px-3 py-3 text-left">សកម្មភាព អ្នកផ្គត់ផ្គង់</th>
                    <th className="px-3 py-3 text-left">តម្លៃទាមទារ</th>
                    <th className="px-3 py-3 text-center">សកម្មភាព</th>
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
                          <FiTrash size={15} /> លុប
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
