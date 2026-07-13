import React, { useState } from "react";
import { FiCheckCircle, FiCreditCard, FiDollarSign } from "react-icons/fi";
import { formatCurrencyPair } from "../utils/purchaseUtils";
import { FormInput, FormSelect, ModalShell, SummaryMiniBox } from "./PurchaseCommon";

export function RecordPaymentModal({ purchase, theme, onClose, onSubmit, isSaving = false }) {
  const grandTotalUsd = Number(purchase.grandTotalUsd ?? purchase.grandTotal ?? 0);
  const grandTotalKhr = Number(purchase.grandTotalKhr ?? 0);
  const paidUsd = Number(purchase.paidAmountUsd ?? purchase.paidAmount ?? 0);
  const paidKhr = Number(purchase.paidAmountKhr ?? 0);
  const balanceUsd = Number(purchase.balanceAmountUsd ?? purchase.balanceAmount ?? grandTotalUsd);
  const balanceKhr = Number(purchase.balanceAmountKhr ?? grandTotalKhr);
  const exchangeRate = Number(purchase.exchangeRateUsed || 4000);

  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState(String(balanceUsd > 0 ? balanceUsd : grandTotalUsd));
  const [error, setError] = useState("");

  const handlePayInFull = () => {
    if (currency === "USD") {
      setAmount(String(balanceUsd > 0 ? balanceUsd : grandTotalUsd));
    } else {
      setAmount(String(balanceKhr > 0 ? balanceKhr : grandTotalKhr));
    }
    setError("");
  };

  const handleCurrencyChange = (value) => {
    setCurrency(value);
    setError("");
    if (value === "USD") {
      setAmount(String(balanceUsd > 0 ? balanceUsd : grandTotalUsd));
    } else {
      setAmount(String(balanceKhr > 0 ? balanceKhr : grandTotalKhr));
    }
  };

  const handleSubmit = () => {
    const numeric = Number(amount);
    if (!amount || isNaN(numeric) || numeric <= 0) {
      setError("ចំនួនត្រូវតែធំជាង 0។");
      return;
    }
    const maxAllowed = currency === "USD" ? balanceUsd : balanceKhr;
    if (numeric > maxAllowed) {
      setError(`ចំនួនមិនអាចលើស${currency === "USD" ? `$${maxAllowed.toFixed(2)}` : `៛${maxAllowed.toLocaleString()}`} (នៅសល់ត្រូវបង់)។`);
      return;
    }
    onSubmit({
      paid_currency: currency.toLowerCase(),
      paid_amount_input: numeric,
      exchange_rate_used: exchangeRate > 0 ? exchangeRate : 4000,
    });
  };

  const currencyOptions = [
    { value: "USD", label: "USD" },
    { value: "KHR", label: "KHR" },
  ];

  return (
    <ModalShell
      title="កត់ការទូទាត់"
      subtitle={`បង់ប្រាក់ អ្នកផ្គត់ផ្គង់ សម្រាប់ទំនិញទទួលយក — ${purchase.purchaseNo}`}
      theme={theme}
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            បោះបង់
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCheckCircle />
            {isSaving ? "កំពុងរក្សាទុក..." : "កត់ការទូទាត់"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <SummaryMiniBox theme={theme} label="តម្លៃសរុប" value={formatCurrencyPair(grandTotalUsd, grandTotalKhr)} strong />
          <SummaryMiniBox theme={theme} label="បានបង់រួច" value={formatCurrencyPair(paidUsd, paidKhr)} />
          <SummaryMiniBox theme={theme} label="នៅសល់ត្រូវបង់" value={formatCurrencyPair(balanceUsd, balanceKhr)} strong colorClass="text-red-500" />
        </div>

        {exchangeRate > 0 && (
          <p className={`text-xs ${theme.muted}`}>អត្រាប្ដូររូបិយប័ណ្ណ: 1 USD = {Number(exchangeRate).toLocaleString()} KHR</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            label="រូបិយប័ណ្ណ"
            value={currency}
            onChange={handleCurrencyChange}
            options={currencyOptions}
            theme={theme}
            icon={<FiDollarSign />}
          />
          <FormInput
            label="ចំនួន"
            required
            type="number"
            value={amount}
            onChange={(value) => { setAmount(value); setError(""); }}
            theme={theme}
            icon={<FiCreditCard />}
            error={error}
            decimalPlaces={2}
          />
        </div>

        <button
          type="button"
          onClick={handlePayInFull}
          className={`text-sm font-medium underline ${theme.muted} hover:text-emerald-500`}
        >
          បង់ទាំងស្រុង ({currency === "USD" ? `$${(balanceUsd > 0 ? balanceUsd : grandTotalUsd).toFixed(2)}` : `₭${(balanceKhr > 0 ? balanceKhr : grandTotalKhr).toLocaleString()}`})
        </button>
      </div>
    </ModalShell>
  );
}
