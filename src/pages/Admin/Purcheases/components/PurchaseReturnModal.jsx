import React, { useState } from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiFileText,
  FiHash,
  FiPackage,
  FiPlus,
  FiRotateCcw,
  FiSave,
  FiShoppingCart,
  FiTrash,
} from "react-icons/fi";
import { formatCondition, formatCurrencyPair, formatPaymentMode } from "../utils/purchaseUtils";
import { CompactSelect, EmptyState, FormInput, FormSection, FormSelect, FormTextarea, ModalShell, SummaryMiniBox } from "./PurchaseCommon";

const conditionOptions = [
  { value: "damaged", label: "ខូចខាត" },
  { value: "expired", label: "ផុតកំណត់" },
  { value: "wrong_item", label: "ទំនិញខុស" },
  { value: "good", label: "ល្អ" },
  { value: "other", label: "ផ្សេងទៀត" },
];

const itemResolutionOptions = [
  { value: "replacement", label: "ជំនួសទំនិញថ្មី" },
  { value: "refund", label: "សងលុយ" },
  { value: "credit_note", label: "កាត់លុយលើវិក្កយបត្រក្រោយ" },
  { value: "none", label: "មិនដោះស្រាយ" },
];

const itemStatusOptions = [
  { value: "submitted", label: "រង់ចាំដំណោះស្រាយ" },
  { value: "resolved", label: "ដោះស្រាយរួច" },
];

function getOptionLabel(options, value, fallback) {
  return options.find((option) => option.value === value)?.label || fallback;
}

function getResolutionDetail(item) {
  const resolutionType = item.resolutionType === "credit" ? "credit_note" : item.resolutionType;
  const settlementUsd = Number(item.settlementUsd ?? item.refundAmountUsd ?? item.creditAmountUsd ?? 0);
  const settlementKhr = Number(item.settlementKhr ?? item.refundAmountKhr ?? item.creditAmountKhr ?? 0);

  if (resolutionType === "refund") {
    return `អ្នកផ្គត់ផ្គង់ សង ${formatCurrencyPair(settlementUsd, settlementKhr)}`;
  }
  if (resolutionType === "credit_note") {
    return `អ្នកផ្គត់ផ្គង់ ឲ កាត់លុយលើកក្រោយ ${formatCurrencyPair(settlementUsd, settlementKhr)}`;
  }
  if (resolutionType === "none") {
    return "មិនដោះស្រាយ";
  }
  return `អ្នកផ្គត់ផ្គង់ ជំនួស ${item.replacementQty || item.qtyReturned || 0} ${item.unitName}`;
}

function getPurchaseBalance(purchase = {}) {
  const grandUsd = Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0);
  const grandKhr = Number(purchase.grandTotalKhr || 0);
  const paidUsd = Number(purchase.paidAmountUsd ?? purchase.paidAmount ?? 0);
  const paidKhr = Number(purchase.paidAmountKhr || 0);

  return {
    usd: Math.max(0, grandUsd - paidUsd),
    khr: Math.max(0, grandKhr - paidKhr),
  };
}

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

function getItemUnitCostAmounts(item = {}) {
  return {
    usd: Number(item.unitCostUsd ?? item.unit_cost_usd ?? item.unitCost ?? item.unit_cost ?? 0),
    khr: Number(item.unitCostKhr ?? item.unit_cost_khr ?? 0),
  };
}

function getItemOnlyAmount(item = {}, qty) {
  const useQty = Number(
    qty ??
      item.qtyReturned ??
      item.qty_returned ??
      item.claimQty ??
      item.claim_qty ??
      item.damagedQty ??
      item.damaged_qty ??
      item.invoicedQty ??
      item.invoiced_qty ??
      item.quantity ??
      0
  );
  const unitCost = getItemUnitCostAmounts(item);

  if (useQty > 0 && (unitCost.usd > 0 || unitCost.khr > 0)) {
    return {
      usd: roundMoney(useQty * unitCost.usd),
      khr: Math.round(useQty * unitCost.khr),
    };
  }

  return {
    usd: Number(item.itemTotalUsd ?? item.item_total_usd ?? item.lineSubtotalUsd ?? item.line_subtotal_usd ?? item.lineTotalUsd ?? item.line_total_usd ?? item.lineTotal ?? 0),
    khr: Number(item.itemTotalKhr ?? item.item_total_khr ?? item.lineSubtotalKhr ?? item.line_subtotal_khr ?? item.lineTotalKhr ?? item.line_total_khr ?? 0),
  };
}

// A claim's items can each carry their own resolutionType (mixed refund/credit_note/replacement
// in one submission) — settlement is computed per item using that item's own line amount, with a
// running "how much of the shared partial_prepaid unpaid balance has already been consumed by an
// earlier item" accumulator threaded across items in list order (mirrors the backend's
// PurchaseReturnService::calculateMoneySettlement by-ref accumulator). Replacement/none items
// never touch the offset pool — replacement never deducts from the balance (the buyer still pays
// the original amount and gets goods instead).
function withSettlementAmounts(items = [], purchase = {}) {
  const balance = getPurchaseBalance(purchase);
  const isPartialPrepaid = (purchase.paymentMode || "").toLowerCase() === "partial_prepaid";
  let offsetConsumedUsd = 0;
  let offsetConsumedKhr = 0;

  return items.map((item) => {
    const resolutionType = item.resolutionType === "credit" ? "credit_note" : item.resolutionType;
    const amount = getItemOnlyAmount(item, item.qtyReturned ?? item.qty_returned);
    const isMoneyType = resolutionType === "refund" || resolutionType === "credit_note";

    // credit_note never offsets this purchase's own balance — only "refund" goes through the
    // partial_prepaid offset split below (mirrors Purchases.jsx's getPerItemSettlements /
    // PurchaseReturnService::applyItemSettlement).
    if (!isMoneyType || !isPartialPrepaid || resolutionType === "credit_note") {
      return { ...item, itemUsd: amount.usd, itemKhr: amount.khr, offsetUsd: 0, offsetKhr: 0, settlementUsd: isMoneyType ? amount.usd : 0, settlementKhr: isMoneyType ? amount.khr : 0 };
    }

    const remainingUsd = Math.max(balance.usd - offsetConsumedUsd, 0);
    const remainingKhr = Math.max(balance.khr - offsetConsumedKhr, 0);
    const offsetUsd = Math.min(amount.usd, remainingUsd);
    const offsetKhr = Math.min(amount.khr, remainingKhr);
    offsetConsumedUsd += offsetUsd;
    offsetConsumedKhr += offsetKhr;

    return {
      ...item,
      itemUsd: amount.usd,
      itemKhr: amount.khr,
      offsetUsd,
      offsetKhr,
      settlementUsd: Math.max(0, amount.usd - offsetUsd),
      settlementKhr: Math.max(0, amount.khr - offsetKhr),
    };
  });
}

function getClaimSummary(purchase = {}, items = []) {
  const displayItems = withSettlementAmounts(items, purchase);
  const sum = (key) => displayItems.reduce((total, item) => total + Number(item[key] || 0), 0);
  const balance = getPurchaseBalance(purchase);
  const types = Array.from(
    new Set(displayItems.map((item) => (item.resolutionType === "credit" ? "credit_note" : item.resolutionType || "replacement")))
  );
  const replacementQty = displayItems
    .filter((item) => (item.resolutionType || "replacement") === "replacement")
    .reduce((total, item) => total + Number(item.qtyReturned || 0), 0);

  return {
    displayItems,
    grossUsd: sum("itemUsd"),
    grossKhr: sum("itemKhr"),
    offsetUsd: sum("offsetUsd"),
    offsetKhr: sum("offsetKhr"),
    netUsd: sum("settlementUsd"),
    netKhr: sum("settlementKhr"),
    balanceUsd: balance.usd,
    balanceKhr: balance.khr,
    isMixed: types.length > 1,
    types,
    replacementQty,
  };
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
  onUpdateItemField,
  getAvailableReturnQty,
  onClose,
  onSave,
}) {
  // Which row's resolution type/status is currently open for editing — read-only by default so
  // the table row stays as visually simple as every other column, matching plain text instead of
  // two dropdowns always showing; click the edit icon to reveal them inline for just that row.
  const [editingResolutionIndex, setEditingResolutionIndex] = useState(null);
  // Same idea for លក្ខខណ្ឌ (condition) — it was only ever settable in the add-item form before
  // adding, then frozen as plain text once added, with no way to fix a wrong pick (e.g. picked
  // "ខូចខាត" but meant "ផុតកំណត់") short of deleting and re-adding the whole row.
  const [editingConditionIndex, setEditingConditionIndex] = useState(null);
  const claim = getClaimSummary(purchase, items);
  const displayItems = claim.displayItems;
  const subtotalUsd = claim.netUsd;
  const subtotalKhr = claim.netKhr;
  // "Replacement" / "money" here describe the whole CLAIM only when every item agrees — a mixed
  // claim shows a per-type breakdown instead (see the header banner/summary panel below).
  const hasMoneyItem = items.some((item) => ["refund", "credit_note", "credit"].includes(item.resolutionType));
  const isReplacement = !claim.isMixed && claim.types[0] === "replacement";
  const isMoneyResolution = !claim.isMixed && (claim.types[0] === "refund" || claim.types[0] === "credit_note");
  const moneyActionLabel = claim.types[0] === "credit_note" ? "ត្រូវកាត់លើវិក្កយបត្រក្រោយ" : "ត្រូវសងលុយ";
  // resolutionStatus is now per-item (like resolutionType) — this checks for the SPECIFIC
  // combination the money-resolution UI cares about, instead of one form-wide "is this claim resolved".
  const hasResolvedMoneyItem = items.some(
    (item) => ["refund", "credit_note", "credit"].includes(item.resolutionType) && item.resolutionStatus === "resolved"
  );
  const deductionPreview = hasResolvedMoneyItem ? formatCurrencyPair(subtotalUsd, subtotalKhr) : "មិនទាន់ដក";
  const replacementQty = claim.replacementQty;
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
                មិនបន្ថែមស្តុកទេ — វាកត់ចំនួនខូច និងរបៀបដែល អ្នកផ្គត់ផ្គង់ នឹងដោះស្រាយ: ជំនួស, សង, ឬ កាត់លុយលើកក្រោយ។
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-300">
              {claim.isMixed
                ? `ចម្រុះ — ជំនួស ${replacementQty} ទំនិញ · ត្រូវទាមទារ ${formatCurrencyPair(subtotalUsd, subtotalKhr)}`
                : isReplacement
                  ? `រង់ចាំជំនួស: ${replacementQty} ទំនិញ`
                  : `ត្រូវទាមទារ: ${formatCurrencyPair(subtotalUsd, subtotalKhr)}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FormSection title="ដំណោះស្រាយ អ្នកផ្គត់ផ្គង់" subtitle="ជ្រើសរបៀបដែល អ្នកផ្គត់ផ្គង់ នឹងដោះស្រាយចំនួនខូច។" icon={<FiRotateCcw />} theme={theme}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput label="លេខការទាមទារ" required value={form.purchaseReturnNo} error={errors.purchaseReturnNo} onChange={(value) => onChange("purchaseReturnNo", value)} theme={theme} icon={<FiHash />} />
              <FormInput label="កាលបរិច្ឆេទត្រឡប់" required type="date" value={form.returnDate} error={errors.returnDate} onChange={(value) => onChange("returnDate", value)} theme={theme} icon={<FiCalendar />} />
              {/* No form-level "return reason" field — the per-item "លក្ខខណ្ឌ" select (add-item row,
                  and editable inline per row in the table below) is the same information at the
                  right granularity, since items in one claim can each have their own condition
                  (damaged vs expired vs wrong item etc). Kept as one control instead of two doing
                  overlapping jobs, per explicit user request after trying both. */}
              {/* No form-level "resolution type" or "resolution status" field here — both used to
                  duplicate the add-item row's own selects below (setting the same thing: the
                  values for the NEXT item added), which read as two controls doing one job. Each
                  item now carries its own type AND status, editable inline per row in the table.
                  There's also no separate "ទំនិញជំនួសបានមកដល់ភ្លាមៗ" checkbox anymore — selecting
                  "ដោះស្រាយរួច" for a replacement item's own status IS the signal that it was handed
                  over on the spot; a second, easy-to-miss checkbox requiring both to be set in sync
                  is what caused resolution_status: "resolved" + replacement_received_qty: 0 to ever
                  happen together in the first place. */}
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
              <SummaryMiniBox theme={theme} label="តម្លៃខូច" value={formatCurrencyPair(claim.grossUsd, claim.grossKhr)} />
              {Number(claim.offsetUsd || 0) > 0 || Number(claim.offsetKhr || 0) > 0 ? (
                <SummaryMiniBox theme={theme} label="ដកពីប្រាក់ទំនិញនៅសល់" value={formatCurrencyPair(claim.offsetUsd, claim.offsetKhr)} />
              ) : null}
              {claim.isMixed ? (
                <>
                  <SummaryMiniBox theme={theme} label="រង់ចាំជំនួស" value={`${replacementQty} ទំនិញ`} strong colorClass="text-purple-600 dark:text-purple-300" />
                  <SummaryMiniBox
                    theme={theme}
                    label="ត្រូវសង/កាត់លុយលើកក្រោយ"
                    value={hasMoneyItem ? deductionPreview : "-"}
                    strong={hasResolvedMoneyItem}
                    colorClass={hasResolvedMoneyItem ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
                  />
                </>
              ) : isReplacement ? (
                <>
                  {purchase.paymentMode !== "prepaid" && (
                    <SummaryMiniBox theme={theme} label="ត្រូវបង់នៅសល់" value={formatCurrencyPair(claim.balanceUsd, claim.balanceKhr)} strong />
                  )}
                  <div className={purchase.paymentMode === "prepaid" ? "md:col-span-2" : undefined}>
                    <SummaryMiniBox theme={theme} label="រង់ចាំជំនួស" value={`${replacementQty} ទំនិញ`} strong colorClass="text-purple-600 dark:text-purple-300" />
                  </div>
                </>
              ) : (
                <>
                  <SummaryMiniBox theme={theme} label={moneyActionLabel} value={formatCurrencyPair(subtotalUsd, subtotalKhr)} strong />
                  <SummaryMiniBox
                    theme={theme}
                    label="ដកពីចំណាយពិត"
                    value={isMoneyResolution ? deductionPreview : "មិនប៉ះលុយ"}
                    strong={hasResolvedMoneyItem}
                    colorClass={hasResolvedMoneyItem ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
                  />
                </>
              )}
            </div>
          </FormSection>
        </div>

        {/* Wording deliberately doesn't say "ខូច" (damaged) alone — this list also includes
            fully-good items with zero recorded damage (see getAvailableReturnQty's fallback to
            the full acceptedQty), since a claim can also cover wrong-model/wrong-item or other
            non-damage reasons, not damage exclusively. */}
        <FormSection
          title={availableItems.length > 0 ? "បន្ថែមទំនិញផ្សេងទៀត" : "គ្មានទំនិញផ្សេងទៀតដែលអាចបន្ថែម"}
          subtitle={availableItems.length > 0 ? "បន្ថែមបន្ទាត់ថ្មី សម្រាប់ទំនិញខូច ខុសម៉ូដែល ឬបញ្ហាផ្សេងទៀតក្នុងការទាមទារនេះ។" : "ទំនិញទាំងអស់ដែលអាចទាមទារពីការទិញនេះ ត្រូវបានរៀបចំខាងក្រោមរួចហើយ។"}
          icon={<FiPackage />}
          theme={theme}
        >
          {availableItems.length === 0 ? (
            <div className={`rounded-2xl border p-4 text-sm ${theme.softCard}`}>
              {hasPreparedItems ? "គ្មានទំនិញផ្សេងទៀតដែលអាចបន្ថែម។ ពិនិត្យទំនិញខាងក្រោម ហើយរក្សាទុកការទាមទារ អ្នកផ្គត់ផ្គង់។" : "គ្មានទំនិញដែលអាចទាមទារសម្រាប់ការទិញនេះ។"}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Split into two logical rows instead of cramming all 7 fields into one — "what's
                  damaged" (product/qty/condition) reads top-to-bottom before "how to resolve it"
                  (type/status/reason/add), which also gives the product picker enough width to
                  actually show full variant names + available qty without truncating. */}
              <div className={`grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_0.8fr_1fr]`}>
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
                <FormInput label="ចំនួនទាមទារ" required type="number" value={itemForm.qtyReturned} error={itemErrors.qtyReturned} onChange={(value) => onItemChange("qtyReturned", value)} theme={theme} icon={<FiHash />} decimalPlaces={4} />
                <FormSelect label="មូលហេតុ" required value={itemForm.condition} error={itemErrors.condition} onChange={(value) => onItemChange("condition", value)} theme={theme} icon={<FiAlertTriangle />} options={conditionOptions} />
              </div>
              <div className={`grid grid-cols-1 gap-4 md:grid-cols-[1fr_0.85fr_1.15fr_auto] md:items-end rounded-2xl border p-4 ${theme.softCard}`}>
                <FormSelect
                  label="ដំណោះស្រាយទំនិញនេះ"
                  required
                  value={itemForm.resolutionType}
                  error={itemErrors.resolutionType}
                  onChange={(value) => onItemChange("resolutionType", value)}
                  theme={theme}
                  icon={<FiCheckCircle />}
                  options={itemResolutionOptions}
                />
                <FormSelect
                  label="ស្ថានភាព"
                  value={itemForm.resolutionStatus}
                  onChange={(value) => onItemChange("resolutionStatus", value)}
                  theme={theme}
                  icon={<FiClock />}
                  options={itemStatusOptions}
                />
                <FormInput label="មូលហេតុ" required value={itemForm.reason} error={itemErrors.reason} onChange={(value) => onItemChange("reason", value)} theme={theme} icon={<FiFileText />} />
                <button type="button" onClick={onAddItem} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-600">
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
                    <th className="px-3 py-3 text-left">មូលហេតុ</th>
                    <th className="px-3 py-3 text-left">សកម្មភាព អ្នកផ្គត់ផ្គង់</th>
                    <th className="px-3 py-3 text-left">តម្លៃខូច</th>
                    <th className="px-3 py-3 text-center">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item, index) => (
                    <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          {/* Nothing stops adding the same product as two separate lines (e.g. two
                              damaged batches with different resolutions) — without a visible index,
                              two such rows read as an accidental duplicate at a glance. */}
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${theme.badge}`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-semibold">{item.variantName}</p>
                            <p className={`mt-1 text-xs ${theme.muted}`}>{item.reason}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">{item.qtyReturned} {item.unitName}</td>
                      <td className="px-3 py-3">{item.baseQtyReturned} {item.baseUnit}</td>
                      <td className="px-3 py-3 min-w-32">
                        {editingConditionIndex === index ? (
                          <div className="flex items-center gap-1.5">
                            <CompactSelect
                              value={item.condition || "damaged"}
                              onChange={(value) => onUpdateItemField(index, "condition", value)}
                              options={conditionOptions}
                              theme={theme}
                              className="w-full"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingConditionIndex(null)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                              title="រួចរាល់"
                            >
                              <FiCheck size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span>{formatCondition(item.condition)}</span>
                            <button
                              type="button"
                              onClick={() => setEditingConditionIndex(index)}
                              className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-purple-500/10 hover:text-purple-600 ${theme.input}`}
                              title="កែសម្រួល"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 min-w-64">
                        {editingResolutionIndex === index ? (
                          // Editing this one row only — side-by-side (not stacked) so the row's
                          // height barely changes from its collapsed state; a small icon-only
                          // confirm button instead of a full-width bar keeps it to one line.
                          <div className="flex items-center gap-1.5">
                            <CompactSelect
                              value={item.resolutionType === "credit" ? "credit_note" : item.resolutionType || "replacement"}
                              onChange={(value) => onUpdateItemField(index, "resolutionType", value)}
                              options={itemResolutionOptions}
                              theme={theme}
                              className="w-full"
                            />
                            <CompactSelect
                              value={item.resolutionStatus || "submitted"}
                              onChange={(value) => onUpdateItemField(index, "resolutionStatus", value)}
                              options={itemStatusOptions}
                              theme={theme}
                              className="w-full"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingResolutionIndex(null)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                              title="រួចរាល់"
                            >
                              <FiCheck size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">
                                {getOptionLabel(itemResolutionOptions, item.resolutionType === "credit" ? "credit_note" : item.resolutionType || "replacement", "ជំនួសទំនិញថ្មី")}
                              </p>
                              <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                (item.resolutionStatus || "submitted") === "resolved"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              }`}>
                                {(item.resolutionStatus || "submitted") === "resolved" ? <FiCheckCircle size={10} /> : <FiClock size={10} />}
                                {getOptionLabel(itemStatusOptions, item.resolutionStatus || "submitted", "រង់ចាំដំណោះស្រាយ")}
                              </span>
                              <p className={`mt-1 text-xs ${theme.muted}`}>{getResolutionDetail(item)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingResolutionIndex(index)}
                              className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border transition hover:bg-purple-500/10 hover:text-purple-600 ${theme.input}`}
                              title="កែសម្រួល"
                            >
                              <FiEdit2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
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
