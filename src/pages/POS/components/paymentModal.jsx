import React from "react";
import { BadgeDollarSign, X } from "./posIcons";
import { EXCHANGE_RATE, usd } from "./posData";
import { PaymentRow } from "./ui";

export default function PaymentModal({
  open,
  onClose,
  total,
  paymentType,
  setPaymentType,
  cashCurrency,
  setCashCurrency,
  cashAmount,
  setCashAmount,
  transferProvider,
  setTransferProvider,
  transferAmount,
  setTransferAmount,
  splitProvider,
  setSplitProvider,
  splitTransferAmount,
  setSplitTransferAmount,
  splitCashCurrency,
  setSplitCashCurrency,
  splitCashAmount,
  setSplitCashAmount,
}) {
  if (!open) return null;

  const cashReceived = Number(cashAmount || 0);
  const cashReceivedUsd = cashCurrency === "USD" ? cashReceived : cashReceived / EXCHANGE_RATE;
  const cashApplied = Math.min(cashReceivedUsd, total);
  const cashChange = Math.max(cashReceivedUsd - total, 0);
  const cashChangeDisplay = cashCurrency === "USD" ? cashChange : cashChange * EXCHANGE_RATE;

  const transferReceived = Number(transferAmount || 0);
  const transferApplied = Math.min(transferReceived, total);
  const transferChange = Math.max(transferReceived - total, 0);

  const splitTransferReceived = Number(splitTransferAmount || 0);
  const splitTransferApplied = Math.min(splitTransferReceived, total);
  const remainingAfterTransfer = Math.max(total - splitTransferApplied, 0);

  const splitCashReceived = Number(splitCashAmount || 0);
  const splitCashReceivedUsd = splitCashCurrency === "USD" ? splitCashReceived : splitCashReceived / EXCHANGE_RATE;
  const splitCashApplied = Math.min(splitCashReceivedUsd, remainingAfterTransfer);
  const splitAppliedTotal = splitTransferApplied + splitCashApplied;
  const splitCashChange = Math.max(splitCashReceivedUsd - remainingAfterTransfer, 0);
  const splitCashChangeDisplay = splitCashCurrency === "USD" ? splitCashChange : splitCashChange * EXCHANGE_RATE;

  const canCompleteCash = total > 0 && cashApplied >= total;
  const canCompleteTransfer = total > 0 && transferApplied >= total;
  const canCompleteSplit = total > 0 && splitAppliedTotal >= total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <BadgeDollarSign className="h-5 w-5 text-red-500" /> Payment Methods
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Grand Total</span>
              <span className="font-semibold text-slate-900">{usd(total)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-slate-500">Invoice Currency</span>
              <span className="font-medium text-slate-900">USD</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-slate-500">Exchange Rate</span>
              <span className="font-medium text-slate-900">1 USD = {EXCHANGE_RATE.toLocaleString()} KHR</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
              {[
                { id: "cash", label: "Cash" },
                { id: "transfer", label: "ABA / Wing" },
                { id: "split", label: "Split" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentType(option.id)}
                  className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    paymentType === option.id ? "bg-white text-red-500 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-900">Supported payment flow</div>
              <div className="mt-2">1. Cash only</div>
              <div>2. ABA / Wing only</div>
              <div>3. ABA 10 USD + Cash 10 USD or 40000 KHR</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4">
            {paymentType === "cash" && (
              <div className="space-y-4">
                <div className="text-lg font-semibold text-slate-900">Cash Payment</div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Cash Currency</label>
                    <select
                      value={cashCurrency}
                      onChange={(event) => setCashCurrency(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="KHR">KHR</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Amount Received</label>
                    <input
                      value={cashAmount}
                      onChange={(event) => setCashAmount(event.target.value)}
                      placeholder={cashCurrency === "USD" ? "20" : "80000"}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <PaymentRow
                  label="Cash Row"
                  currency={cashCurrency}
                  received={cashReceived}
                  applied={cashApplied}
                  change={cashChangeDisplay}
                />

                <button
                  disabled={!canCompleteCash}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Complete Cash Payment
                </button>
              </div>
            )}

            {paymentType === "transfer" && (
              <div className="space-y-4">
                <div className="text-lg font-semibold text-slate-900">ABA / Wing Payment</div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Provider</label>
                    <select
                      value={transferProvider}
                      onChange={(event) => setTransferProvider(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    >
                      <option value="ABA">ABA</option>
                      <option value="Wing">Wing</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Amount Received (USD)</label>
                    <input
                      value={transferAmount}
                      onChange={(event) => setTransferAmount(event.target.value)}
                      placeholder="20"
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <PaymentRow
                  label={`${transferProvider} Transfer`}
                  currency="USD"
                  received={transferReceived}
                  applied={transferApplied}
                  change={transferChange}
                />

                <button
                  disabled={!canCompleteTransfer}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Complete Transfer Payment
                </button>
              </div>
            )}

            {paymentType === "split" && (
              <div className="space-y-4">
                <div className="text-lg font-semibold text-slate-900">Split Payment</div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Transfer Provider</label>
                    <select
                      value={splitProvider}
                      onChange={(event) => setSplitProvider(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    >
                      <option value="ABA">ABA</option>
                      <option value="Wing">Wing</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Transfer Amount (USD)</label>
                    <input
                      value={splitTransferAmount}
                      onChange={(event) => setSplitTransferAmount(event.target.value)}
                      placeholder="10"
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Cash Currency</label>
                    <select
                      value={splitCashCurrency}
                      onChange={(event) => setSplitCashCurrency(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="KHR">KHR</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-600">Cash Amount</label>
                    <input
                      value={splitCashAmount}
                      onChange={(event) => setSplitCashAmount(event.target.value)}
                      placeholder={splitCashCurrency === "USD" ? "10" : "40000"}
                      className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <PaymentRow
                    label={`${splitProvider} Row`}
                    currency="USD"
                    received={splitTransferReceived}
                    applied={splitTransferApplied}
                    change={0}
                  />
                  <PaymentRow
                    label="Cash Row"
                    currency={splitCashCurrency}
                    received={splitCashReceived}
                    applied={splitCashApplied}
                    change={splitCashChangeDisplay}
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Applied total</span>
                    <span className="font-semibold text-slate-900">{usd(splitAppliedTotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-500">Remaining</span>
                    <span className="font-semibold text-slate-900">{usd(Math.max(total - splitAppliedTotal, 0))}</span>
                  </div>
                </div>

                <button
                  disabled={!canCompleteSplit}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Complete Split Payment
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}