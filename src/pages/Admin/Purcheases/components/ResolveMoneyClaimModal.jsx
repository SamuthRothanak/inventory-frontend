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
  const isRefund = purchaseReturn?.resolutionType === "refund";
  const amountUsd = isRefund
    ? Number(purchaseReturn?.refundAmountUsd ?? purchaseReturn?.subtotalUsd ?? 0)
    : Number(purchaseReturn?.creditAmountUsd ?? purchaseReturn?.subtotalUsd ?? 0);
  const amountKhr = isRefund
    ? Number(purchaseReturn?.refundAmountKhr ?? purchaseReturn?.subtotalKhr ?? 0)
    : Number(purchaseReturn?.creditAmountKhr ?? purchaseReturn?.subtotalKhr ?? 0);

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
      title={isRefund ? "បញ្ជាក់ការសងលុយ" : "បញ្ជាក់ Credit Note"}
      subtitle={`ដំណោះស្រាយការទាមទារ ${purchaseReturn?.purchaseReturnNo || ""} ${isRefund ? "ជាការសងលុយពីអ្នកផ្គត់ផ្គង់" : "ជា Credit Note ពីអ្នកផ្គត់ផ្គង់"}`}
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
            {isSaving ? "កំពុងរក្សាទុក..." : isRefund ? "បញ្ជាក់ការសង" : "បញ្ជាក់ Credit Note"}
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
                  {isRefund ? "លុយ" : "Credit Note"}
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
              <p className={`text-xs font-semibold ${theme.muted}`}>{isRefund ? "ចំនួនសង" : "ចំនួន Credit"}</p>
              <p className={`mt-1 text-xl font-bold ${amountColor}`}>
                {formatCurrencyPair(amountUsd, amountKhr)}
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation note */}
        <div className={`rounded-2xl border p-4 text-sm leading-6 ${theme.softCard}`}>
          {isRefund
            ? "ចុចបញ្ជាក់ដើម្បីកត់ទុកថាបានទទួលលុយសង​ពីអ្នកផ្គត់ផ្គង់ហើយ។ ស្ថានភាពការទាមទារនឹងផ្លាស់ប្តូរជា «បានបញ្ចប់»។"
            : "ចុចបញ្ជាក់ដើម្បីកត់ទុកថា Credit Note បានចេញ​ពីអ្នកផ្គត់ផ្គង់ហើយ។ ស្ថានភាពការទាមទារនឹងផ្លាស់ប្តូរជា «បានបញ្ចប់»។"}
        </div>
      </div>
    </ModalShell>
  );
}
