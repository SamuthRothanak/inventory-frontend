import React from "react";
import { FiArrowRight, FiCheckCircle, FiCreditCard, FiDollarSign, FiRotateCcw } from "react-icons/fi";
import { formatCurrencyPair } from "../utils/purchaseUtils";
import { ModalShell } from "./PurchaseCommon";

export function ResolveMoneyClaimModal({
  purchase,
  purchaseReturn,
  theme,
  onClose,
  onSave,
  isSaving = false,
}) {
  // A mixed claim's return-level resolutionType/subtotal/refund_amount aggregate across ALL of the
  // return's items (including a replacement item's own line value, and any other money item) — a
  // return with e.g. a resolved replacement item plus this still-open refund item would otherwise
  // show "mixed" (never === "refund", defaulting this whole modal to Credit Note styling/copy) and
  // an inflated gross value that includes the replacement item's cost. Scope everything here to the
  // actual open refund/credit_note item(s) instead, falling back to the return's own aggregate
  // fields for legacy data with no per-item resolution recorded at all.
  //
  // Sums across ALL open money items (not just the first) — handleConfirmMoneyResolution below
  // resolves every open refund/credit_note item in this return in one click, so a claim with two
  // separate refund items (two different damaged products, both refund) must preview their
  // combined total here too. Previously this used .find() and only ever showed the first item's
  // amount, silently understating what a single "confirm" click was actually about to settle.
  const normalizeItemResolutionType = (value = "") => {
    const type = String(value || "").trim().toLowerCase();
    return type === "credit" ? "credit_note" : type;
  };
  const normalizeItemResolutionStatus = (value = "") => String(value || "").trim().toLowerCase().replaceAll(" ", "_");
  const returnItems = Array.isArray(purchaseReturn?.items) ? purchaseReturn.items : [];
  const openMoneyItems = returnItems.filter((item) => {
    const type = normalizeItemResolutionType(item.resolutionType || item.resolution_type);
    const status = normalizeItemResolutionStatus(item.resolutionStatus || item.resolution_status);
    return ["refund", "credit_note"].includes(type) && !["completed", "resolved", "cancelled", "canceled"].includes(status);
  });
  const resolutionSource = openMoneyItems[0] || purchaseReturn;
  const isRefund = normalizeItemResolutionType(resolutionSource?.resolutionType || resolutionSource?.resolution_type) === "refund";

  let claimUsd = 0;
  let claimKhr = 0;
  let rawAmountUsd = 0;
  let rawAmountKhr = 0;

  if (openMoneyItems.length > 0) {
    for (const item of openMoneyItems) {
      claimUsd += Number(item.lineTotalUsd ?? item.line_total_usd ?? 0);
      claimKhr += Number(item.lineTotalKhr ?? item.line_total_khr ?? 0);
      if (isRefund) {
        rawAmountUsd += Number(item.refundAmountUsd ?? item.refund_amount_usd ?? 0);
        rawAmountKhr += Number(item.refundAmountKhr ?? item.refund_amount_khr ?? 0);
      } else {
        rawAmountUsd += Number(item.creditAmountUsd ?? item.credit_amount_usd ?? 0);
        rawAmountKhr += Number(item.creditAmountKhr ?? item.credit_amount_khr ?? 0);
      }
    }
  } else {
    claimUsd = Number(purchaseReturn?.subtotalUsd ?? purchaseReturn?.totalAmountUsd ?? purchaseReturn?.total_amount_usd ?? purchaseReturn?.subtotal ?? 0);
    claimKhr = Number(purchaseReturn?.subtotalKhr ?? purchaseReturn?.totalAmountKhr ?? purchaseReturn?.total_amount_khr ?? 0);
    rawAmountUsd = isRefund
      ? Number(purchaseReturn?.refundAmountUsd ?? purchaseReturn?.refund_amount_usd ?? 0)
      : Number(purchaseReturn?.creditAmountUsd ?? purchaseReturn?.credit_amount_usd ?? 0);
    rawAmountKhr = isRefund
      ? Number(purchaseReturn?.refundAmountKhr ?? purchaseReturn?.refund_amount_khr ?? 0)
      : Number(purchaseReturn?.creditAmountKhr ?? purchaseReturn?.credit_amount_khr ?? 0);
  }
  // rawAmountUsd/Khr can legitimately be 0 when the claim value is fully absorbed by
  // an unpaid partial_prepaid balance instead of being paid back in cash — do not
  // fall back to claimUsd/Khr in that case, or a $0 cash settlement misdisplays as
  // the full claim amount.
  const amountUsd = claimUsd > 0 ? Math.min(rawAmountUsd, claimUsd) : rawAmountUsd;
  const amountKhr = claimKhr > 0 ? Math.min(rawAmountKhr, claimKhr) : rawAmountKhr;
  const offsetUsd = Math.max(0, claimUsd - amountUsd);
  const offsetKhr = Math.max(0, claimKhr - amountKhr);
  const isFullyOffset = offsetUsd > 0.01 || offsetKhr > 1;

  const badgeColor = isRefund
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : "bg-blue-500/15 text-blue-600 dark:text-blue-400";
  const amountColor = isRefund
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-blue-600 dark:text-blue-400";
  const amountBg = isRefund
    ? "bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30"
    : "bg-blue-500/10 border-blue-300 dark:border-blue-500/30";

  return (
    <ModalShell
      title={isRefund ? "បញ្ជាក់ការសងលុយ" : "បញ្ជាក់កាត់លុយលើកក្រោយ"}
      subtitle={`ដំណោះស្រាយការទាមទារ ${purchaseReturn?.purchaseReturnNo || ""} ${isRefund ? "ជាការសងលុយពីអ្នកផ្គត់ផ្គង់" : "ជាកាត់លុយលើកក្រោយពីអ្នកផ្គត់ផ្គង់"}`}
      theme={theme}
      onClose={onClose}
      width="max-w-lg"
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
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${isRefund ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-500 hover:bg-blue-600"}`}
          >
            <FiCheckCircle />
            {isSaving ? "កំពុងរក្សាទុក..." : isRefund ? "បញ្ជាក់ការសង" : "បញ្ជាក់កាត់លុយលើកក្រោយ"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Return info header */}
        <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isRefund ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"}`}>
              <FiRotateCcw />
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>ការទាមទារ</p>
                <p className="mt-1 font-bold">{purchaseReturn?.purchaseReturnNo || "-"}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>ការទិញដើម</p>
                <p className="mt-1 font-bold">{purchase?.purchaseNo || purchase?.purchase_no || "-"}</p>
              </div>
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>ដំណោះស្រាយ</p>
                <div className={`mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${badgeColor}`}>
                  {isRefund ? <FiDollarSign size={12} /> : <FiCreditCard size={12} />}
                  ទំនិញ
                  <FiArrowRight size={11} />
                  {isRefund ? "លុយ" : "កាត់លុយលើកក្រោយ"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amount display */}
        <div className={`rounded-2xl border p-5 ${amountBg}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isRefund ? "bg-emerald-500/15" : "bg-blue-500/15"}`}>
              {isRefund ? <FiDollarSign className={amountColor} /> : <FiCreditCard className={amountColor} />}
            </div>
            <div>
              <p className={`text-xs font-semibold ${theme.muted}`}>{isRefund ? "ចំនួនសងជាសាច់ប្រាក់" : "ចំនួនកាត់លុយលើកក្រោយជាក់ស្តែង"}</p>
              <p className={`mt-1 text-xl font-bold ${amountColor}`}>
                {formatCurrencyPair(amountUsd, amountKhr)}
              </p>
            </div>
          </div>
          {isFullyOffset && (
            <div className="mt-3 flex items-center gap-3 border-t border-current/10 pt-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <FiArrowRight className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${theme.muted}`}>ដកពីប្រាក់ជំពាក់នៅសល់ (មិនមែនសងជាសាច់ប្រាក់)</p>
                <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrencyPair(offsetUsd, offsetKhr)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation note */}
        <div className={`rounded-2xl border p-4 text-sm leading-6 ${theme.softCard}`}>
          {isFullyOffset
            ? `ចំនួនខូច ${formatCurrencyPair(claimUsd, claimKhr)} ត្រូវបានទុកជាការដកចេញពីប្រាក់ដែលអ្នកនៅជំពាក់អ្នកផ្គត់ផ្គង់ទាំងស្រុង — អ្នកផ្គត់ផ្គង់មិនចាំបាច់សងជាសាច់ប្រាក់ត្រឡប់មកវិញទេ (ត្រូវបង់ថែមត្រឹមតែសមតុល្យដែលកាត់រួច)។ ចុចបញ្ជាក់ដើម្បីកត់ទុកថាការទាមទារនេះបានដោះស្រាយ។`
            : isRefund
              ? "ចុចបញ្ជាក់ដើម្បីកត់ទុកថាបានទទួលលុយសង​ពីអ្នកផ្គត់ផ្គង់ហើយ។ ស្ថានភាពការទាមទារនឹងផ្លាស់ប្តូរជា «បានបញ្ចប់»។"
              : "ចុចបញ្ជាក់ដើម្បីកត់ទុកថាកាត់លុយលើកក្រោយ បានចេញ​ពីអ្នកផ្គត់ផ្គង់ហើយ។ ស្ថានភាពការទាមទារនឹងផ្លាស់ប្តូរជា «បានបញ្ចប់»។"}
        </div>
      </div>
    </ModalShell>
  );
}
