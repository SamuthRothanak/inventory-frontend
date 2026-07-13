import React, { useState } from "react";
import {
  BadgeDollarSign, X, CheckCircle, Printer, ShoppingCart,
  Hash, Clock, AlertCircle,
} from "./posIcons";
import { usd, khr, generateInvoiceNo, cn } from "./posData";
import { PaymentRow, Divider } from "./ui";
import { createSaleApi } from "../../../services/sale.service";
import SalePrintModal from "../../Admin/Sales/components/SalePrintModal";

function buildSaleForPrint(data) {
  return {
    saleNo:               data.invoiceNo,
    displayDate:          data.saleDate,
    customerName:         data.customerName,
    cashierName:          data.cashierName,
    saleType:             data.saleMode === "wholesale" ? "wholesale" : "retail",
    saleChannel:          data.saleChannel,
    invoiceCurrency:      "USD",
    exchangeRateKhrPerUsd: data.exchangeRate,
    paymentStatus:        data.isCredit ? "unpaid" : "paid",
    saleStatus:           "completed",
    items: (data.items ?? []).map((item) => ({
      id:                   item.id,
      variantNameSnapshot:  item.variantName,
      productNameSnapshot:  item.productName,
      unitNameSnapshot:     item.unitName,
      qty:                  item.qty,
      unitPrice:            item.unitPrice,
      lineTotal:            item.lineTotal,
      discountAmount:       0,
    })),
    payments: (data.payments ?? []).map((p) => ({
      paymentMethod:  p.paymentMethod,
      providerName:   p.providerName !== "Cash" ? p.providerName : null,
      currencyCode:   p.currencyCode,
      amountReceived: p.amountReceived,
      changeAmount:   p.changeAmount ?? 0,
      changeCurrency: p.changeCurrency,
      paidAt:         null,
    })),
    subtotal:        data.subtotal,
    discountTotal:   data.discountAmount,
    deliveryRequired: data.deliveryFeeUsd > 0,
    deliveryFee:     data.deliveryFeeUsd,
    grandTotal:      data.total,
    returnsCount:    0,
    returnsTotalUsd: 0,
    note:            data.note ?? null,
    balanceTotal:    data.isCredit ? data.total : 0,
    paidTotal:       data.isCredit ? 0 : data.total,
  };
}

const BASE_TABS = [
  { id: "cash",     label: "សាច់ប្រាក់" },
  { id: "transfer", label: "ធនាគារ / QR" },
  { id: "split",    label: "បំបែក" },
];

const OTHER_PROVIDER = "ផ្សេងៗ";
const PROVIDERS = ["ABA", "Wing", "ACLEDA", "Bakong", OTHER_PROVIDER];

const sanitizeMoneyInput = (value, currency = "USD") => {
  const decimalPlaces = currency === "KHR" ? 0 : 2;
  let nextValue = String(value || "").replace(/-/g, "").replace(/[^0-9.]/g, "");
  const parts = nextValue.split(".");
  const integerPart = (parts[0] || "").replace(/^0+(?=\d)/, "") || (nextValue.startsWith(".") ? "0" : parts[0]);
  if (decimalPlaces === 0 || parts.length === 1) return integerPart || "";
  const decimalPart = parts.slice(1).join("").slice(0, decimalPlaces);
  return `${integerPart || "0"}.${decimalPart}`;
};

// ─── Print receipt ────────────────────────────────────────────────
function printReceipt(data) {
  const {
    invoiceNo, saleDate, customerName, items,
    subtotal, discountAmount, deliveryFeeUsd, total,
    payments, exchangeRate,
  } = data;

  const itemRows = items.map((item) => `
    <tr>
      <td>${item.productName}<br/><span style="color:#888;font-size:11px">${item.variantName} · ${item.qty} ${item.unitName}</span></td>
      <td style="text-align:right">${usd(item.lineTotal)}</td>
    </tr>`).join("");

  const paymentRows = data.isCredit
    ? `<tr><td style="color:#2563eb;font-weight:bold">មិនទាន់ទូទាត់</td><td style="text-align:right;color:#2563eb;font-weight:bold">${usd(total)}<br/><span style="font-size:11px;font-weight:normal;color:#64748b">${khr(total * exchangeRate)}</span></td></tr>
       <tr><td colspan="2" style="color:#888;font-size:11px">វិធីបង់ប្រាក់ និងរូបិយប័ណ្ណនឹងកត់ត្រាពេលអតិថិជនបង់ប្រាក់</td></tr>`
    : payments.map((p) => `
    <tr>
      <td>${p.providerName} (${p.currencyCode})</td>
      <td style="text-align:right">${p.currencyCode === "KHR" ? khr(p.amountReceived) : usd(p.amountReceived)}</td>
    </tr>
    ${p.changeAmount > 0 ? `<tr><td style="color:#16a34a">អាប់</td><td style="text-align:right;color:#16a34a">${p.currencyCode === "KHR" ? khr(p.changeAmount) : usd(p.changeAmount)}</td></tr>` : ""}`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>វិក្កយបត្រ ${invoiceNo}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; font-size:13px; width:80mm; padding:10px; color:#111; }
    h2 { text-align:center; font-size:16px; letter-spacing:1px; margin-bottom:2px; }
    .center { text-align:center; }
    .muted { color:#888; font-size:11px; }
    .divider { border-top:1px dashed #ccc; margin:8px 0; }
    table { width:100%; border-collapse:collapse; }
    td { padding:3px 0; vertical-align:top; }
    .total-row td { font-weight:bold; font-size:14px; border-top:1px dashed #ccc; padding-top:6px; }
    .footer { text-align:center; margin-top:12px; font-size:11px; color:#888; }
    @media print { body { width:80mm; } }
  </style></head><body>
  <h2>វិក្កយបត្រ</h2>
  <p class="center muted">${invoiceNo}</p>
  <p class="center muted">${saleDate}</p>
  <p class="center muted">អតិថិជន: ${customerName}</p>
  <div class="divider"></div>
  <table>${itemRows}</table>
  <div class="divider"></div>
  <table>
    <tr><td>តម្លៃមុនបញ្ចុះ</td><td style="text-align:right">${usd(subtotal)}</td></tr>
    ${discountAmount > 0 ? `<tr><td style="color:#16a34a">បញ្ចុះ</td><td style="text-align:right;color:#16a34a">-${usd(discountAmount)}</td></tr>` : ""}
    ${deliveryFeeUsd > 0 ? `<tr><td>ដឹកជញ្ជូន</td><td style="text-align:right">+${usd(deliveryFeeUsd)}</td></tr>` : ""}
    <tr class="total-row">
      <td>សរុបទាំងអស់</td>
      <td style="text-align:right">${usd(total)}<br/><span style="font-size:11px;font-weight:normal;color:#888">${khr(total * exchangeRate)}</span></td>
    </tr>
  </table>
  <div class="divider"></div>
  <table>${paymentRows}</table>
  <p class="muted center" style="margin-top:6px">អត្រា: 1 USD = ${exchangeRate.toLocaleString()} KHR</p>
  <div class="footer"><p>សូមអរគុណចំពោះការទិញទំនិញ!</p></div>
  <script>window.onload=function(){window.print();window.close();}</script>
  </body></html>`;

  const win = window.open("", "_blank", "width=400,height=600");
  if (win) { win.document.write(html); win.document.close(); }
}

// ─── Receipt overlay ──────────────────────────────────────────────
function ReceiptView({ receiptData, onClose, onNewSale, onPrint }) {
  const {
    invoiceNo, saleDate, saleMode, customerName, cashierName,
    saleChannel, items, subtotal, discountAmount, deliveryFeeUsd,
    total, payments, exchangeRate, isCredit,
  } = receiptData;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            isCredit ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
          )}>
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-slate-900">{isCredit ? "លក់មិនទាន់ទូទាត់ — ទំនិញបានផ្តល់" : "ការលក់បញ្ចប់"}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">{invoiceNo}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Invoice header */}
        <div className={cn(
          "rounded-2xl border p-5 text-center shadow-sm",
          isCredit ? "border-blue-100 bg-blue-50/70" : "border-emerald-100 bg-emerald-50/70"
        )}>
          <div className="mb-1 flex items-center justify-center gap-2">
            <Hash className={cn("h-4 w-4", isCredit ? "text-blue-500" : "text-emerald-500")} />
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">{invoiceNo}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock className="h-3 w-3" />{saleDate}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs md:grid-cols-4">
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <p className="text-slate-400">អតិថិជន</p>
              <p className="truncate font-bold text-slate-900">{customerName}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <p className="text-slate-400">អ្នកគិតលុយ</p>
              <p className="truncate font-bold text-slate-900">{cashierName}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <p className="text-slate-400">ប្រភេទ</p>
              <p className="font-bold text-slate-900">{saleMode === "wholesale" ? "លក់ដុំ" : "លក់រាយ"}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-3 py-2">
              <p className="text-slate-400">បណ្ដាញ</p>
              <p className="font-bold text-slate-900">{saleChannel === "pos" ? "POS" : saleChannel === "phone_order" ? "ទូរស័ព្ទ" : "អនឡាញ"}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">ទំនិញ</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.variantName} · {item.qty} {item.unitName} × {usd(item.unitPrice)}</p>
                </div>
                <span className="ml-3 shrink-0 text-sm font-bold text-slate-900">{usd(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm shadow-sm space-y-2">
          <div className="flex justify-between text-slate-500"><span>តម្លៃមុនបញ្ចុះ</span><span>{usd(subtotal)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>បញ្ចុះ</span><span>−{usd(discountAmount)}</span></div>}
          {deliveryFeeUsd > 0 && <div className="flex justify-between text-slate-500"><span>ដឹកជញ្ជូន</span><span>+{usd(deliveryFeeUsd)}</span></div>}
          <div className="flex items-end justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
            <span>សរុបទាំងអស់</span>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-slate-950">{usd(total)}</p>
              <p className="text-xs font-semibold text-slate-500">{khr(total * exchangeRate)}</p>
            </div>
          </div>
        </div>

        {/* Payments / Balance Due */}
        <div className="mt-4">
          {isCredit ? (
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-500">មិនទាន់ទូទាត់</p>
                <p className="mt-0.5 text-xs text-blue-500">{customerName} — មិនទាន់កត់ត្រាវិធីបង់ប្រាក់</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-blue-600">{usd(total)}</p>
                <p className="text-xs font-semibold text-blue-500">{khr(total * exchangeRate)}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">ការទូទាត់</p>
              <div className="space-y-2">
                {payments.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{p.providerName}</p>
                      <p className="text-xs text-slate-400">{p.currencyCode} · អត្រា: {p.exchangeRateUsed.toLocaleString()} KHR/USD</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {p.currencyCode === "KHR" ? khr(p.amountReceived) : usd(p.amountReceived)}
                      </p>
                      {p.changeAmount > 0 && (
                        <p className="text-xs text-emerald-600">អាប់: {p.currencyCode === "KHR" ? khr(p.changeAmount) : usd(p.changeAmount)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          អត្រាប្តូរប្រាក់: 1 USD = {exchangeRate.toLocaleString()} KHR
        </p>
      </div>

      <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <button
          type="button"
          onClick={onPrint}
          className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-100"
        >
          <Printer className="h-4 w-4" /> បោះពុម្ព
        </button>
        <button
          type="button"
          onClick={onNewSale}
          className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm hover:bg-red-600"
        >
          <ShoppingCart className="h-4 w-4" /> ចាប់ផ្តើមការលក់ថ្មី
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
  exchangeRate,
  khrRounding,
  cashierName,
  deliveryRequired,
  deliveryOption,
  deliveryFee,
  deliveryFeeCurrency,
  note,
  onCompleteSale,
}) {
  const allTabs = [
    ...BASE_TABS,
    ...(saleMode === "wholesale" && selectedCustomer ? [{ id: "credit", label: "មិនទាន់ទូទាត់" }] : []),
  ];

  const [tab,               setTab]               = useState("cash");
  const [cashCurrency,      setCashCurrency]       = useState("USD");
  const [cashAmount,        setCashAmount]         = useState("");
  const [transferProvider,  setTransferProvider]   = useState("ABA");
  const [transferOther,     setTransferOther]      = useState("");
  const [transferCurrency,  setTransferCurrency]   = useState("USD");
  const [transferAmount,    setTransferAmount]     = useState("");
  const [transferChangeCurrency, setTransferChangeCurrency] = useState("USD");
  const [transferChange,    setTransferChange]     = useState("");
  const [splitProvider,     setSplitProvider]      = useState("ABA");
  const [splitOther,        setSplitOther]         = useState("");
  const [splitTransferCurrency, setSplitTransferCurrency] = useState("USD");
  const [splitTransfer,     setSplitTransfer]      = useState("");
  const [splitCashCurrency, setSplitCashCurrency]  = useState("USD");
  const [splitCash,         setSplitCash]          = useState("");
  const [splitChangeCurrency, setSplitChangeCurrency] = useState("USD");
  const [splitChange,       setSplitChange]        = useState("");
  const [receipt,           setReceipt]            = useState(null);
  const [printSale,         setPrintSale]          = useState(null);
  const [isSubmitting,      setIsSubmitting]       = useState(false);
  const [submitError,       setSubmitError]        = useState(null);

  if (!open) return null;

  // ── Cash calculations ──
  const cashReceived    = cashAmount !== "" ? Number(cashAmount) : (cashCurrency === "USD" ? total : Math.ceil(total * exchangeRate));
  const cashReceivedUsd = cashCurrency === "USD" ? cashReceived : cashReceived / exchangeRate;
  const cashApplied     = Math.min(cashReceivedUsd, total);
  const cashChange      = Math.max(cashReceivedUsd - total, 0);
  const cashChangeDisp  = cashCurrency === "USD" ? cashChange : cashChange * exchangeRate;
  const canCompleteCash = total > 0 && cashApplied >= total;

  // ── Transfer calculations ──
  const resolvedTransferProvider = transferProvider === OTHER_PROVIDER
    ? (transferOther.trim() || OTHER_PROVIDER)
    : transferProvider;
  const transferReceived    = transferAmount !== "" ? Number(transferAmount) : (transferCurrency === "USD" ? total : Math.ceil(total * exchangeRate));
  const transferReceivedUsd = transferCurrency === "USD" ? transferReceived : transferReceived / exchangeRate;
  const transferApplied     = Math.min(transferReceivedUsd, total);
  const transferChangeDueUsd = Math.max(transferReceivedUsd - total, 0);
  const transferChangeAmt   = Number(transferChange || 0);
  const transferChangeUsd   = transferChangeCurrency === "USD" ? transferChangeAmt : transferChangeAmt / exchangeRate;
  const transferExpectedChange = transferChangeCurrency === "USD" ? transferChangeDueUsd.toFixed(2) : Math.ceil(transferChangeDueUsd * exchangeRate);
  const transferChangeValid = transferChangeDueUsd <= 0 || Math.abs(transferChangeUsd - transferChangeDueUsd) < 0.01;
  const canCompleteTransfer = total > 0
    && transferApplied >= total
    && transferChangeValid;

  // ── Split calculations ──
  const resolvedSplitProvider = splitProvider === OTHER_PROVIDER
    ? (splitOther.trim() || OTHER_PROVIDER)
    : splitProvider;
  const splitTransferAmt     = Number(splitTransfer || 0);
  const splitTransferUsd     = splitTransferCurrency === "USD" ? splitTransferAmt : splitTransferAmt / exchangeRate;
  const splitTransferApplied = Math.min(splitTransferUsd, total);
  const remainingAfter       = Math.max(total - splitTransferApplied, 0);
  const splitCashAmt         = Number(splitCash || 0);
  const splitCashUsd         = splitCashCurrency === "USD" ? splitCashAmt : splitCashAmt / exchangeRate;
  const splitCashApplied     = Math.min(splitCashUsd, remainingAfter);
  const splitTotal           = splitTransferApplied + splitCashApplied;
  const splitReceivedUsd     = splitTransferUsd + splitCashUsd;
  const splitChangeDueUsd    = Math.max(splitReceivedUsd - total, 0);
  const splitChangeAmt       = Number(splitChange || 0);
  const splitChangeUsd       = splitChangeCurrency === "USD" ? splitChangeAmt : splitChangeAmt / exchangeRate;
  const splitExpectedChange  = splitChangeCurrency === "USD" ? splitChangeDueUsd.toFixed(2) : Math.ceil(splitChangeDueUsd * exchangeRate);
  const splitChangeValid     = splitChangeDueUsd <= 0 || Math.abs(splitChangeUsd - splitChangeDueUsd) < 0.01;
  const canCompleteSplit     = total > 0
    && splitTotal >= total
    && splitChangeValid;

  // ── Build payment objects (aligned with flow: payments.exchange_rate_used) ──
  function buildPayments() {
    const now = new Date().toLocaleTimeString("en-US", { hour12: false });

    if (tab === "cash") {
      return [{
        paymentMethod: "cash",
        providerName: "Cash",
        currencyCode: cashCurrency,
        amountReceived: cashReceived,
        exchangeRateUsed: exchangeRate,
        amountAppliedInvoiceCurrency: cashApplied,
        changeAmount: cashCurrency === "USD" ? cashChange : cashChangeDisp,
        changeCurrency: cashCurrency,
        paidAt: now,
      }];
    }
    if (tab === "transfer") {
      return [{
        paymentMethod: "mobile_payment",
        providerName: resolvedTransferProvider,
        currencyCode: transferCurrency,
        amountReceived: transferReceived,
        exchangeRateUsed: exchangeRate,
        amountAppliedInvoiceCurrency: transferApplied,
        changeAmount: transferChangeDueUsd > 0 ? transferChangeAmt : 0,
        changeCurrency: transferChangeDueUsd > 0 ? transferChangeCurrency : transferCurrency,
        paidAt: now,
      }];
    }
    // split
    const splitPayments = [
      {
        paymentMethod: "mobile_payment",
        providerName: resolvedSplitProvider,
        currencyCode: splitTransferCurrency,
        amountReceived: splitTransferAmt,
        exchangeRateUsed: exchangeRate,
        amountAppliedInvoiceCurrency: splitTransferApplied,
        changeAmount: 0,
        changeCurrency: splitTransferCurrency,
        paidAt: now,
      },
      {
        paymentMethod: "cash",
        providerName: "Cash",
        currencyCode: splitCashCurrency,
        amountReceived: splitCashAmt,
        exchangeRateUsed: exchangeRate,
        amountAppliedInvoiceCurrency: splitCashApplied,
        changeAmount: 0,
        changeCurrency: splitCashCurrency,
        paidAt: now,
      },
    ].filter((payment) => Number(payment.amountReceived) > 0);

    if (splitChangeDueUsd > 0 && splitPayments.length > 0) {
      const changePayment = splitPayments[splitPayments.length - 1];
      changePayment.changeAmount = splitChangeAmt;
      changePayment.changeCurrency = splitChangeCurrency;
    }

    return splitPayments;
  }

  async function handleComplete() {
    const builtPayments = buildPayments();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const salePayload = {
        sale_type:                 saleMode === "wholesale" ? "wholesale" : "retail",
        sale_channel:              saleChannel === "phone_order" ? "phone" : saleChannel,
        invoice_currency:          "USD",
        exchange_rate_khr_per_usd: exchangeRate,
        khr_rounding:              khrRounding || "ceil",
        customer_id:               selectedCustomer ? Number(selectedCustomer.id) : null,
        customer_name_snapshot:    selectedCustomer?.shopName || "អតិថិជនទូទៅ",
        customer_phone_snapshot:   selectedCustomer?.phone   || null,
        subtotal_usd:              subtotal,
        discount_total_usd:        discountAmount,
        discount_total_khr:        Math.ceil(discountAmount * exchangeRate),
        delivery_option:           deliveryRequired ? "delivery" : "none",
        delivery_fee_currency:     deliveryRequired ? deliveryFeeCurrency : undefined,
        delivery_fee_input:        deliveryRequired ? parseFloat(deliveryFee || 0) : 0,
        delivery_fee_usd:          deliveryFeeUsd > 0 ? deliveryFeeUsd : 0,
        grand_total_usd:           total,
        note:                      note || null,
        sale_status:               "completed",
        items: cartItems.map((item) => ({
          product_variant_unit_id: item.unitId,
          qty:                     item.qty,
          unit_price:              item.unitPrice,
          price_rule_id:           item.appliedRuleId || null,
        })),
        payments: builtPayments.map((p) => ({
          payment_method:     p.paymentMethod === "mobile_payment" ? "bank_transfer" : p.paymentMethod,
          provider_name:      p.providerName !== "Cash" ? p.providerName : null,
          currency_code:      p.currencyCode,
          amount_received:    p.amountReceived,
          exchange_rate_used: exchangeRate,
          change_amount:      p.changeAmount || 0,
          change_currency:    p.changeCurrency || null,
        })),
      };

      const response = await createSaleApi(salePayload);
      const saleData = response?.data ?? response;

      const now = new Date().toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      const receiptData = {
        invoiceNo:     saleData?.sale_no || generateInvoiceNo(),
        saleDate:      now,
        saleMode,
        customerName:  selectedCustomer?.shopName ?? "អតិថិជនទូទៅ",
        cashierName:   cashierName || "Cashier",
        saleChannel,
        items:         cartItems,
        subtotal,
        discountAmount,
        deliveryFeeUsd,
        total,
        payments:      builtPayments,
        exchangeRate,
      };

      setReceipt(receiptData);
      onCompleteSale?.(receiptData);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "មិនអាចបញ្ចប់ការលក់ទេ។ សូមព្យាយាមម្តងទៀត។";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreditComplete() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const salePayload = {
        sale_type:                 "wholesale",
        sale_channel:              saleChannel === "phone_order" ? "phone" : saleChannel,
        invoice_currency:          "USD",
        exchange_rate_khr_per_usd: exchangeRate,
        khr_rounding:              khrRounding || "ceil",
        customer_id:               Number(selectedCustomer.id),
        customer_name_snapshot:    selectedCustomer?.shopName || "អតិថិជនទូទៅ",
        customer_phone_snapshot:   selectedCustomer?.phone   || null,
        subtotal_usd:              subtotal,
        discount_total_usd:        discountAmount,
        discount_total_khr:        Math.ceil(discountAmount * exchangeRate),
        delivery_option:           deliveryRequired ? "delivery" : "none",
        delivery_fee_currency:     deliveryRequired ? deliveryFeeCurrency : undefined,
        delivery_fee_input:        deliveryRequired ? parseFloat(deliveryFee || 0) : 0,
        delivery_fee_usd:          deliveryFeeUsd > 0 ? deliveryFeeUsd : 0,
        grand_total_usd:           total,
        note:                      note || null,
        sale_status:               "completed",
        items: cartItems.map((item) => ({
          product_variant_unit_id: item.unitId,
          qty:                     item.qty,
          unit_price:              item.unitPrice,
          price_rule_id:           item.appliedRuleId || null,
        })),
        payments: [],
      };

      const response = await createSaleApi(salePayload);
      const saleData = response?.data ?? response;
      const now = new Date().toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      const receiptData = {
        invoiceNo:     saleData?.sale_no || generateInvoiceNo(),
        saleDate:      now,
        saleMode,
        customerName:  selectedCustomer?.shopName ?? "អតិថិជនទូទៅ",
        cashierName:   cashierName || "Cashier",
        saleChannel,
        items:         cartItems,
        subtotal,
        discountAmount,
        deliveryFeeUsd,
        total,
        payments:      [],
        exchangeRate,
        isCredit:      true,
      };

      setReceipt(receiptData);
      onCompleteSale?.(receiptData);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "មិនអាចបញ្ចប់ការលក់ទេ។ សូមព្យាយាមម្តងទៀត។";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNewSale() {
    setReceipt(null);
    setSubmitError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ maxHeight: "92vh" }}>

        {/* ── Receipt overlay ── */}
        {receipt && (
          <div className="absolute inset-0 z-10 bg-white flex flex-col" style={{ maxHeight: "92vh" }}>
            <ReceiptView
              receiptData={receipt}
              onClose={handleNewSale}
              onNewSale={handleNewSale}
              onPrint={() => setPrintSale(buildSaleForPrint(receipt))}
            />
          </div>
        )}

        {printSale && (
          <SalePrintModal sale={printSale} onClose={() => setPrintSale(null)} />
        )}

        {/* ── Payment UI ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">ការទូទាត់</p>
              <p className="text-xs text-slate-400">សរុបទាំងអស់: {usd(total)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]" style={{ height: "calc(92vh - 72px)", overflow: "hidden" }}>

          {/* ── Left: Invoice summary ── */}
          <div className="overflow-y-auto border-r border-slate-100 p-5 space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">តម្លៃមុនបញ្ចុះ</span>
                <span className="font-medium">{usd(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>បញ្ចុះ</span><span>−{usd(discountAmount)}</span>
                </div>
              )}
              {deliveryFeeUsd > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>ដឹកជញ្ជូន</span><span>+{usd(deliveryFeeUsd)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-900">សរុបទាំងអស់</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{usd(total)}</p>
                  <p className="text-xs text-slate-400">{khr(total * exchangeRate)}</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>រូបិយប័ណ្ណ</span><span className="font-medium text-slate-700">USD</span>
              </div>
              <div className="flex justify-between">
                <span>អត្រាប្តូរប្រាក់</span>
                <span className="font-medium text-slate-700">1 USD = {exchangeRate.toLocaleString()} KHR</span>
              </div>
            </div>

            {/* Payment method tabs */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">វិធីទូទាត់</p>
              <div className="grid gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1" style={{ gridTemplateColumns: `repeat(${allTabs.length}, 1fr)` }}>
                {allTabs.map((t) => (
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

          </div>

          {/* ── Right: Payment input ── */}
          <div className="h-full overflow-y-auto p-5">

            {/* ── Error bar ── */}
            {submitError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* ── Cash ── */}
            {tab === "cash" && (
              <div className="space-y-4">
                <p className="font-bold text-slate-900">ការទូទាត់ជាសាច់ប្រាក់</p>

                {/* Currency chips */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-500">រូបិយប័ណ្ណ</p>
                  <div className="flex gap-2">
                    {[{ v: "USD", l: "USD ($)" }, { v: "KHR", l: "KHR (៛)" }].map((c) => (
                      <button
                        key={c.v}
                        type="button"
                        onClick={() => { setCashCurrency(c.v); setCashAmount(""); }}
                        className={cn(
                          "flex-1 h-10 rounded-xl text-sm font-bold transition",
                          cashCurrency === c.v
                            ? "bg-red-500 text-white shadow-sm shadow-red-200"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {c.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-500">ចំនួនទទួល</p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(sanitizeMoneyInput(e.target.value, cashCurrency))}
                    placeholder={cashCurrency === "USD" ? total.toFixed(2) : Math.ceil(total * exchangeRate).toString()}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                {/* Quick preset buttons */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-500">ចំនួនរហ័ស</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashAmount(cashCurrency === "USD" ? total.toFixed(2) : Math.ceil(total * exchangeRate).toString())}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100"
                    >
                      ពិតប្រាកដ
                    </button>
                    {(cashCurrency === "USD"
                      ? [1, 2, 5, 10, 20, 50, 100]
                      : [5000, 10000, 20000, 50000, 100000]
                    )
                      .filter((v) => v > (cashCurrency === "USD" ? total : total * exchangeRate))
                      .slice(0, 5)
                      .map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCashAmount(v.toString())}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          {cashCurrency === "USD" ? `$${v}` : `${v.toLocaleString()}៛`}
                        </button>
                      ))}
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
                  disabled={!canCompleteCash || isSubmitting}
                  onClick={handleComplete}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <CheckCircle className="h-4 w-4" />
                  }
                  {isSubmitting ? "កំពុងដំណើរការ..." : `បញ្ចប់ — ${usd(total)}`}
                </button>
              </div>
            )}

            {/* ── Transfer ── */}
            {tab === "transfer" && (
              <div className="space-y-4">
                <p className="font-bold text-slate-900">ការទូទាត់តាមធនាគារ / QR</p>

                {/* Provider chips */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-500">ធនាគារ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTransferProvider(p)}
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-bold transition",
                          transferProvider === p
                            ? "bg-red-500 text-white shadow-sm shadow-red-200"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {transferProvider === OTHER_PROVIDER && (
                    <div className="mt-3">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                        ឈ្មោះធនាគារ ឬសេវាបង់ប្រាក់
                      </label>
                      <input
                        type="text"
                        value={transferOther}
                        onChange={(event) => setTransferOther(event.target.value)}
                        maxLength={255}
                        autoFocus
                        placeholder="ឧ. Canadia, Sathapana, Woori..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        បើមិនដឹង ទុកទទេបាន។ ប្រព័ន្ធនឹងកត់ជា ផ្សេងៗ។
                      </p>
                    </div>
                  )}
                </div>

                {/* Currency selector */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-500">រូបិយប័ណ្ណ</p>
                  <div className="flex gap-2">
                    {[{ v: "USD", l: "USD ($)" }, { v: "KHR", l: "KHR (៛)" }].map((c) => (
                      <button
                        key={c.v}
                        type="button"
                        onClick={() => { setTransferCurrency(c.v); setTransferAmount(""); setTransferChange(""); }}
                        className={cn(
                          "flex-1 h-10 rounded-xl text-sm font-bold transition",
                          transferCurrency === c.v
                            ? "bg-red-500 text-white shadow-sm shadow-red-200"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {c.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">ចំនួនដែលអតិថិជនបាញ់ ({transferCurrency})</p>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(sanitizeMoneyInput(e.target.value, transferCurrency))}
                      placeholder={transferCurrency === "USD" ? total.toFixed(2) : Math.ceil(total * exchangeRate)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                    {transferCurrency === "KHR" && transferReceived > 0 && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        USD equivalent: <span className="font-semibold text-slate-600">{usd(transferReceivedUsd)}</span>
                      </p>
                    )}
                  </div>
                  <div className="border-t border-slate-200 pt-3 text-xs text-slate-400 space-y-1.5">
                    <p>· តាម {resolvedTransferProvider || "មិនទាន់បញ្ជាក់"} · អត្រា: 1 USD = {exchangeRate.toLocaleString()} KHR</p>
                    <p>· ត្រូវទូទាត់: <span className="font-semibold text-slate-600">{usd(total)}</span></p>
                  </div>
                </div>

                {transferChangeDueUsd > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">លុយអាប់</p>
                      <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                        ត្រូវអាប់: {transferChangeCurrency === "USD" ? usd(transferChangeDueUsd) : `${Math.ceil(transferChangeDueUsd * exchangeRate).toLocaleString()} ៛`}
                      </span>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-500">រូបិយប័ណ្ណអាប់</p>
                      <div className="flex gap-2">
                        {[{ v: "USD", l: "USD ($)" }, { v: "KHR", l: "KHR (៛)" }].map((c) => (
                          <button
                            key={c.v}
                            type="button"
                            onClick={() => { setTransferChangeCurrency(c.v); setTransferChange(""); }}
                            className={cn(
                              "flex-1 h-9 rounded-xl text-xs font-bold transition",
                              transferChangeCurrency === c.v
                                ? "bg-red-500 text-white shadow-sm shadow-red-200"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {c.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-500">ចំនួនអាប់ ({transferChangeCurrency})</p>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={transferChange}
                        onChange={(e) => setTransferChange(sanitizeMoneyInput(e.target.value, transferChangeCurrency))}
                        placeholder={String(transferExpectedChange)}
                        className={cn(
                          "h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2",
                          transferChangeValid ? "border-slate-200 focus:border-red-300 focus:ring-red-100" : "border-red-300 focus:border-red-400 focus:ring-red-100"
                        )}
                      />
                    </div>
                  </div>
                )}

                <PaymentRow
                  label={resolvedTransferProvider || "ធនាគារ / QR"}
                  currency={transferCurrency}
                  received={transferReceived}
                  applied={transferApplied}
                  change={transferChangeDueUsd > 0 ? transferChangeAmt : 0}
                  changeCurrency={transferChangeCurrency}
                />

                <button
                  type="button"
                  disabled={!canCompleteTransfer || isSubmitting}
                  onClick={handleComplete}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <CheckCircle className="h-4 w-4" />
                  }
                  {isSubmitting ? "កំពុងដំណើរការ..." : `បញ្ចប់ — ${usd(total)}`}
                </button>
              </div>
            )}

            {/* ── Split ── */}
            {tab === "split" && (
              <div className="space-y-4">
                <p className="font-bold text-slate-900">ការបំបែកទូទាត់</p>

                {/* Transfer portion */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ចំណែក Transfer</p>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">ធនាគារ</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PROVIDERS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSplitProvider(p)}
                          className={cn(
                            "rounded-xl px-3 py-1.5 text-xs font-bold transition",
                            splitProvider === p
                              ? "bg-red-500 text-white shadow-sm shadow-red-200"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {splitProvider === OTHER_PROVIDER && (
                      <div className="mt-3">
                        <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                          ឈ្មោះធនាគារ ឬសេវាបង់ប្រាក់
                        </label>
                        <input
                          type="text"
                          value={splitOther}
                          onChange={(event) => setSplitOther(event.target.value)}
                          maxLength={255}
                          placeholder="ឧ. Canadia, Sathapana, Woori..."
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        />
                        <p className="mt-1.5 text-xs text-slate-400">
                          បើមិនដឹង ទុកទទេបាន។ ប្រព័ន្ធនឹងកត់ជា ផ្សេងៗ។
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">រូបិយប័ណ្ណ</p>
                    <div className="mb-3 flex gap-2">
                      {[{ v: "USD", l: "USD ($)" }, { v: "KHR", l: "KHR (៛)" }].map((c) => (
                        <button
                          key={c.v}
                          type="button"
                          onClick={() => { setSplitTransferCurrency(c.v); setSplitTransfer(""); }}
                          className={cn(
                            "flex-1 h-9 rounded-xl text-xs font-bold transition",
                            splitTransferCurrency === c.v
                              ? "bg-red-500 text-white shadow-sm shadow-red-200"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {c.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">ចំនួន ({splitTransferCurrency})</p>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={splitTransfer}
                      onChange={(e) => setSplitTransfer(sanitizeMoneyInput(e.target.value, splitTransferCurrency))}
                      placeholder={splitTransferCurrency === "USD" ? total.toFixed(2) : Math.ceil(total * exchangeRate)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                    {splitTransferCurrency === "KHR" && splitTransferAmt > 0 && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        USD equivalent: <span className="font-semibold text-slate-600">{usd(splitTransferUsd)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Cash portion */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ចំណែកសាច់ប្រាក់</p>
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                      នៅសល់: {usd(remainingAfter)}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">រូបិយប័ណ្ណ</p>
                    <div className="flex gap-2">
                      {[{ v: "USD", l: "USD ($)" }, { v: "KHR", l: "KHR (៛)" }].map((c) => (
                        <button
                          key={c.v}
                          type="button"
                          onClick={() => { setSplitCashCurrency(c.v); setSplitCash(""); }}
                          className={cn(
                            "flex-1 h-9 rounded-xl text-xs font-bold transition",
                            splitCashCurrency === c.v
                              ? "bg-red-500 text-white shadow-sm shadow-red-200"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {c.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">ចំនួន</p>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={splitCash}
                      onChange={(e) => setSplitCash(sanitizeMoneyInput(e.target.value, splitCashCurrency))}
                      placeholder={splitCashCurrency === "USD" ? usd(remainingAfter).replace("$", "") : Math.ceil(remainingAfter * exchangeRate)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>

                {splitChangeDueUsd > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">លុយអាប់</p>
                      <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                        ត្រូវអាប់: {splitChangeCurrency === "USD" ? usd(splitChangeDueUsd) : `${Math.ceil(splitChangeDueUsd * exchangeRate).toLocaleString()} ៛`}
                      </span>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-500">រូបិយប័ណ្ណអាប់</p>
                      <div className="flex gap-2">
                        {[{ v: "USD", l: "USD ($)" }, { v: "KHR", l: "KHR (៛)" }].map((c) => (
                          <button
                            key={c.v}
                            type="button"
                            onClick={() => { setSplitChangeCurrency(c.v); setSplitChange(""); }}
                            className={cn(
                              "flex-1 h-9 rounded-xl text-xs font-bold transition",
                              splitChangeCurrency === c.v
                                ? "bg-red-500 text-white shadow-sm shadow-red-200"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            )}
                          >
                            {c.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-slate-500">ចំនួនអាប់ ({splitChangeCurrency})</p>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={splitChange}
                        onChange={(e) => setSplitChange(sanitizeMoneyInput(e.target.value, splitChangeCurrency))}
                        placeholder={String(splitExpectedChange)}
                        className={cn(
                          "h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2",
                          splitChangeValid ? "border-slate-200 focus:border-red-300 focus:ring-red-100" : "border-red-300 focus:border-red-400 focus:ring-red-100"
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <PaymentRow label={resolvedSplitProvider || "ធនាគារផ្សេងៗ"} currency={splitTransferCurrency} received={splitTransferAmt} applied={splitTransferApplied} change={0} />
                  <PaymentRow label="Cash" currency={splitCashCurrency} received={splitCashAmt} applied={splitCashApplied} change={splitChangeDueUsd > 0 ? splitChangeAmt : 0} changeCurrency={splitChangeCurrency} />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">បានដាក់</span>
                    <span className="font-bold text-slate-900">{usd(splitTotal)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">នៅសល់</span>
                    <span className={cn("font-bold", Math.max(total - splitTotal, 0) > 0 ? "text-red-500" : "text-emerald-600")}>
                      {usd(Math.max(total - splitTotal, 0))}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canCompleteSplit || isSubmitting}
                  onClick={handleComplete}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <CheckCircle className="h-4 w-4" />
                  }
                  {isSubmitting ? "កំពុងដំណើរការ..." : `បញ្ចប់ — ${usd(total)}`}
                </button>
              </div>
            )}
            {/* ── Credit ── */}
            {tab === "credit" && (
              <div className="space-y-4">
                <p className="font-bold text-slate-900">មិនទាន់ទូទាត់</p>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-blue-800">ទំនិញបានផ្តល់ — មិនទាន់ទូទាត់</p>
                  <p className="text-xs text-blue-600">អតិថិជន: <strong>{selectedCustomer?.shopName}</strong></p>
                  {selectedCustomer?.phone && (
                    <p className="text-xs text-blue-500">ទូរស័ព្ទ: {selectedCustomer.phone}</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>សរុបទាំងអស់</span>
                    <span className="font-bold text-slate-900">{usd(total)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-bold text-blue-700">មិនទាន់ទូទាត់</span>
                    <span className="text-right text-xl font-extrabold text-blue-700">
                      {usd(total)}
                      <span className="mt-0.5 block text-xs font-semibold text-blue-500">{khr(total * exchangeRate)}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  ការលក់នេះនឹងត្រូវកត់ត្រាជា <strong className="text-slate-600">មិនទាន់បង់</strong> ។ វិធីបង់ប្រាក់ និងរូបិយប័ណ្ណនឹងកត់ត្រាពេលអតិថិជនបង់ប្រាក់នៅទំព័រ Sales ។
                </p>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreditComplete}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <CheckCircle className="h-4 w-4" />
                  }
                  {isSubmitting ? "កំពុងដំណើរការ..." : `បញ្ចប់មិនទាន់ទូទាត់ — ${usd(total)} / ${khr(total * exchangeRate)}`}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
