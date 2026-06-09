import React, { useState } from "react";
import {
  BadgeDollarSign, X, CheckCircle, Printer, ShoppingCart,
  Hash, Clock, AlertCircle,
} from "./posIcons";
import { EXCHANGE_RATE, usd, khr, generateInvoiceNo, cn } from "./posData";
import { PaymentRow, Divider } from "./ui";

const PAYMENT_TABS = [
  { id: "cash",     label: "Cash" },
  { id: "transfer", label: "ABA / Wing" },
  { id: "split",    label: "Split" },
];

const PROVIDERS = ["ABA", "Wing", "ACLEDA", "Bakong"];

// ─── Receipt overlay ──────────────────────────────────────────────
function ReceiptView({ receiptData, onClose, onNewSale }) {
  const {
    invoiceNo, saleDate, saleMode, customerName, cashierName,
    saleChannel, items, subtotal, discountAmount, deliveryFeeUsd,
    total, payments, exchangeRate,
  } = receiptData;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="font-bold text-slate-900">Sale Completed</span>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Invoice header */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Hash className="h-4 w-4 text-red-400" />
            <span className="text-xl font-bold text-slate-900">{invoiceNo}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3" />{saleDate}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
            <span>Customer: <strong className="text-slate-800">{customerName}</strong></span>
            <span>·</span>
            <span>Cashier: <strong className="text-slate-800">{cashierName}</strong></span>
            <span>·</span>
            <span>Mode: <strong className="text-slate-800 capitalize">{saleMode}</strong></span>
            <span>·</span>
            <span>Channel: <strong className="text-slate-800 capitalize">{saleChannel.replace("_", " ")}</strong></span>
          </div>
        </div>

        {/* Items */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Items</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-400">{item.variantName} · {item.qty} {item.unitName} × {usd(item.unitPrice)}</p>
                </div>
                <span className="ml-3 shrink-0 text-sm font-bold text-slate-900">{usd(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm space-y-2">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{usd(subtotal)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{usd(discountAmount)}</span></div>}
          {deliveryFeeUsd > 0 && <div className="flex justify-between text-slate-500"><span>Delivery</span><span>+{usd(deliveryFeeUsd)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
            <span>Grand Total</span>
            <div className="text-right">
              <p>{usd(total)}</p>
              <p className="text-[11px] font-normal text-slate-400">{khr(total * exchangeRate)}</p>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Payments</p>
          <div className="space-y-2">
            {payments.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{p.providerName}</p>
                  <p className="text-xs text-slate-400">{p.currencyCode} · Rate: {p.exchangeRateUsed.toLocaleString()} KHR/USD</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {p.currencyCode === "KHR" ? khr(p.amountReceived) : usd(p.amountReceived)}
                  </p>
                  {p.changeAmount > 0 && (
                    <p className="text-xs text-emerald-600">Change: {p.currencyCode === "KHR" ? khr(p.changeAmount) : usd(p.changeAmount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Exchange rate snapshot: 1 USD = {exchangeRate.toLocaleString()} KHR
        </p>
      </div>

      <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
        <button
          type="button"
          className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" /> Print Receipt
        </button>
        <button
          type="button"
          onClick={onNewSale}
          className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm hover:bg-red-600"
        >
          <ShoppingCart className="h-4 w-4" /> New Sale
        </button>
      </div>
    </div>
  );
}

// ─── Main Payment Modal ───────────────────────────────────────────
export default function PaymentModal({
  open,
  onClose,
  total,
  saleMode,
  selectedCustomer,
  saleChannel,
  cartItems,
  subtotal,
  discountAmount,
  deliveryFeeUsd,
  onCompleteSale,
}) {
  const [tab,               setTab]               = useState("cash");
  const [cashCurrency,      setCashCurrency]       = useState("USD");
  const [cashAmount,        setCashAmount]         = useState("");
  const [transferProvider,  setTransferProvider]   = useState("ABA");
  const [transferAmount,    setTransferAmount]     = useState("");
  const [splitProvider,     setSplitProvider]      = useState("ABA");
  const [splitTransfer,     setSplitTransfer]      = useState("");
  const [splitCashCurrency, setSplitCashCurrency]  = useState("USD");
  const [splitCash,         setSplitCash]          = useState("");
  const [receipt,           setReceipt]            = useState(null);

  if (!open) return null;

  // ── Cash calculations ──
  const cashReceived    = Number(cashAmount || 0);
  const cashReceivedUsd = cashCurrency === "USD" ? cashReceived : cashReceived / EXCHANGE_RATE;
  const cashApplied     = Math.min(cashReceivedUsd, total);
  const cashChange      = Math.max(cashReceivedUsd - total, 0);
  const cashChangeDisp  = cashCurrency === "USD" ? cashChange : cashChange * EXCHANGE_RATE;
  const canCompleteCash = total > 0 && cashApplied >= total;

  // ── Transfer calculations ──
  const transferReceived = Number(transferAmount || 0);
  const transferApplied  = Math.min(transferReceived, total);
  const transferChange   = Math.max(transferReceived - total, 0);
  const canCompleteTransfer = total > 0 && transferApplied >= total;

  // ── Split calculations ──
  const splitTransferAmt     = Number(splitTransfer || 0);
  const splitTransferApplied = Math.min(splitTransferAmt, total);
  const remainingAfter       = Math.max(total - splitTransferApplied, 0);
  const splitCashAmt         = Number(splitCash || 0);
  const splitCashUsd         = splitCashCurrency === "USD" ? splitCashAmt : splitCashAmt / EXCHANGE_RATE;
  const splitCashApplied     = Math.min(splitCashUsd, remainingAfter);
  const splitTotal           = splitTransferApplied + splitCashApplied;
  const splitCashChange      = Math.max(splitCashUsd - remainingAfter, 0);
  const splitCashChangeDisp  = splitCashCurrency === "USD" ? splitCashChange : splitCashChange * EXCHANGE_RATE;
  const canCompleteSplit     = total > 0 && splitTotal >= total;

  // ── Build payment objects (aligned with flow: payments.exchange_rate_used) ──
  function buildPayments() {
    const now = new Date().toLocaleTimeString("en-US", { hour12: false });

    if (tab === "cash") {
      return [{
        paymentMethod: "cash",
        providerName: "Cash",
        currencyCode: cashCurrency,
        amountReceived: cashReceived,
        exchangeRateUsed: EXCHANGE_RATE,
        amountAppliedInvoiceCurrency: cashApplied,
        changeAmount: cashCurrency === "USD" ? cashChange : cashChangeDisp,
        changeCurrency: cashCurrency,
        paidAt: now,
      }];
    }
    if (tab === "transfer") {
      return [{
        paymentMethod: "mobile_payment",
        providerName: transferProvider,
        currencyCode: "USD",
        amountReceived: transferReceived,
        exchangeRateUsed: EXCHANGE_RATE,
        amountAppliedInvoiceCurrency: transferApplied,
        changeAmount: transferChange,
        changeCurrency: "USD",
        paidAt: now,
      }];
    }
    // split
    return [
      {
        paymentMethod: "mobile_payment",
        providerName: splitProvider,
        currencyCode: "USD",
        amountReceived: splitTransferAmt,
        exchangeRateUsed: EXCHANGE_RATE,
        amountAppliedInvoiceCurrency: splitTransferApplied,
        changeAmount: 0,
        changeCurrency: "USD",
        paidAt: now,
      },
      {
        paymentMethod: "cash",
        providerName: "Cash",
        currencyCode: splitCashCurrency,
        amountReceived: splitCashAmt,
        exchangeRateUsed: EXCHANGE_RATE,
        amountAppliedInvoiceCurrency: splitCashApplied,
        changeAmount: splitCashCurrency === "USD" ? splitCashChange : splitCashChangeDisp,
        changeCurrency: splitCashCurrency,
        paidAt: now,
      },
    ];
  }

  function handleComplete() {
    const payments = buildPayments();
    const invoiceNo = generateInvoiceNo();
    const now = new Date().toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const receiptData = {
      invoiceNo,
      saleDate: now,
      saleMode,
      customerName: selectedCustomer?.shopName ?? "Walk-in",
      cashierName: "Cashier",
      saleChannel,
      items: cartItems,
      subtotal,
      discountAmount,
      deliveryFeeUsd,
      total,
      payments,
      exchangeRate: EXCHANGE_RATE,
    };

    setReceipt(receiptData);
    onCompleteSale?.(receiptData);
  }

  function handleNewSale() {
    setReceipt(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "92vh" }}>

        {/* ── Receipt overlay ── */}
        {receipt && (
          <div className="absolute inset-0 z-10 bg-white flex flex-col" style={{ maxHeight: "92vh" }}>
            <ReceiptView receiptData={receipt} onClose={handleNewSale} onNewSale={handleNewSale} />
          </div>
        )}

        {/* ── Payment UI ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Payment</p>
              <p className="text-xs text-slate-400">Grand total: {usd(total)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]" style={{ maxHeight: "calc(92vh - 72px)", overflow: "hidden" }}>

          {/* ── Left: Invoice summary ── */}
          <div className="overflow-y-auto border-r border-slate-100 p-5 space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{usd(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span><span>−{usd(discountAmount)}</span>
                </div>
              )}
              {deliveryFeeUsd > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Delivery</span><span>+{usd(deliveryFeeUsd)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-900">Grand Total</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{usd(total)}</p>
                  <p className="text-xs text-slate-400">{khr(total * EXCHANGE_RATE)}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Invoice currency</span><span className="font-medium text-slate-700">USD</span>
              </div>
              <div className="flex justify-between">
                <span>Exchange rate snapshot</span>
                <span className="font-medium text-slate-700">1 USD = {EXCHANGE_RATE.toLocaleString()} KHR</span>
              </div>
            </div>

            {/* Payment method tabs */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Payment method</p>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {PAYMENT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "rounded-lg px-2 py-2.5 text-xs font-bold transition-all",
                      tab === t.id
                        ? "bg-white text-red-500 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Supported flows</p>
              <p>· Cash in USD or KHR</p>
              <p>· ABA / Wing / ACLEDA / Bakong in USD</p>
              <p>· Split: Transfer + Cash (USD or KHR)</p>
            </div>
          </div>

          {/* ── Right: Payment input ── */}
          <div className="overflow-y-auto p-5">

            {/* ── Cash ── */}
            {tab === "cash" && (
              <div className="space-y-4">
                <p className="font-bold text-slate-900">Cash Payment</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Currency</label>
                    <select
                      value={cashCurrency}
                      onChange={(e) => { setCashCurrency(e.target.value); setCashAmount(""); }}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Amount Received {cashCurrency === "KHR" ? "(KHR)" : "(USD)"}
                    </label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder={cashCurrency === "USD" ? usd(total).replace("$", "") : Math.ceil(total * EXCHANGE_RATE)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                    />
                  </div>
                </div>

                <PaymentRow
                  label="Cash"
                  currency={cashCurrency}
                  received={cashReceived}
                  applied={cashApplied}
                  change={cashChangeDisp}
                />

                <button
                  type="button"
                  disabled={!canCompleteCash}
                  onClick={handleComplete}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle className="h-4 w-4" /> Complete — {usd(total)}
                </button>
              </div>
            )}

            {/* ── Transfer ── */}
            {tab === "transfer" && (
              <div className="space-y-4">
                <p className="font-bold text-slate-900">ABA / Wing Payment</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Provider</label>
                    <select
                      value={transferProvider}
                      onChange={(e) => setTransferProvider(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                    >
                      {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Amount (USD)</label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder={usd(total).replace("$", "")}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                    />
                  </div>
                </div>

                <PaymentRow label={transferProvider} currency="USD" received={transferReceived} applied={transferApplied} change={transferChange} />

                <button
                  type="button"
                  disabled={!canCompleteTransfer}
                  onClick={handleComplete}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle className="h-4 w-4" /> Complete — {usd(total)}
                </button>
              </div>
            )}

            {/* ── Split ── */}
            {tab === "split" && (
              <div className="space-y-4">
                <p className="font-bold text-slate-900">Split Payment</p>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Transfer portion</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">Provider</label>
                      <select
                        value={splitProvider}
                        onChange={(e) => setSplitProvider(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                      >
                        {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">Amount (USD)</label>
                      <input
                        type="number"
                        value={splitTransfer}
                        onChange={(e) => setSplitTransfer(e.target.value)}
                        placeholder="10.00"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash portion</p>
                    <span className="text-xs text-slate-500">Remaining: <strong>{usd(remainingAfter)}</strong></span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">Currency</label>
                      <select
                        value={splitCashCurrency}
                        onChange={(e) => { setSplitCashCurrency(e.target.value); setSplitCash(""); }}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                      >
                        <option value="USD">USD</option>
                        <option value="KHR">KHR</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">Amount</label>
                      <input
                        type="number"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        placeholder={splitCashCurrency === "USD" ? usd(remainingAfter).replace("$", "") : Math.ceil(remainingAfter * EXCHANGE_RATE)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <PaymentRow label={splitProvider} currency="USD" received={splitTransferAmt} applied={splitTransferApplied} change={0} />
                  <PaymentRow label="Cash" currency={splitCashCurrency} received={splitCashAmt} applied={splitCashApplied} change={splitCashChangeDisp} />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total applied</span>
                    <span className="font-bold text-slate-900">{usd(splitTotal)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Remaining</span>
                    <span className={cn("font-bold", Math.max(total - splitTotal, 0) > 0 ? "text-red-500" : "text-emerald-600")}>
                      {usd(Math.max(total - splitTotal, 0))}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canCompleteSplit}
                  onClick={handleComplete}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle className="h-4 w-4" /> Complete — {usd(total)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}