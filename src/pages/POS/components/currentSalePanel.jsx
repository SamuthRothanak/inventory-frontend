import React, { useState, useEffect } from "react";
import {
  ShoppingCart, Trash2, Minus, Plus, Receipt,
  Wallet, Percent, Truck, Tag, Phone, Globe, Pencil,
  ChevronDown, X,
} from "./posIcons";
import { EmptyState } from "./ui";
import { usd, khr, SALE_CHANNELS, DELIVERY_OPTIONS, cn } from "./posData";

// Click-to-type qty, alongside the existing +/- stepper. Keeps its own local text while the
// cashier is typing (so "1" mid-typing "12" doesn't immediately clamp/commit), and only calls
// onCommit on blur/Enter — same type="text"+inputMode pattern used by every other numeric input
// in this app (a plain type="number" would silently report an empty value for invalid input).
function QtyInput({ qty, onCommit }) {
  const [text, setText] = useState(String(qty));

  useEffect(() => { setText(String(qty)); }, [qty]);

  const commit = () => {
    const parsed = parseInt(text, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      onCommit(parsed);
    } else {
      setText(String(qty));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
      className="w-8 rounded-md border-none bg-transparent text-center text-xs font-extrabold text-slate-900 outline-none focus:ring-1 focus:ring-red-300"
    />
  );
}

export default function CurrentSalePanel({
  saleMode, selectedCustomer, totalItems, cart, subtotal,
  discountType, setDiscountType, discountValue, setDiscountValue, discountAmount,
  deliveryRequired, setDeliveryRequired, deliveryOption, setDeliveryOption,
  deliveryFee, setDeliveryFee, deliveryFeeCurrency, setDeliveryFeeCurrency,
  saleChannel, setSaleChannel,
  deliveryFeeUsd, total,
  onUpdateQty, onSetQty, onRemove, onClear, onHold, onOpenPayment,
  exchangeRate,
  note, onNoteChange,
}) {
  const [showNote, setShowNote] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const adjustmentLabel =
    discountAmount > 0 && deliveryRequired && deliveryFeeUsd > 0
      ? "មានបញ្ចុះ និងដឹកជញ្ជូន"
      : discountAmount > 0
      ? "មានបញ្ចុះតម្លៃ"
      : deliveryRequired && deliveryFeeUsd > 0
      ? "មានដឹកជញ្ជូន"
      : "គ្មានបញ្ចុះ / គ្មានដឹកជញ្ជូន";
  const cleanDiscountInput = (value) => {
    const raw = String(value || "").replace(/[^\d.]/g, "");
    const parts = raw.split(".");
    if (!raw) return "";

    if (discountType === "khr") {
      const next = Math.min(Number.parseInt(parts[0] || "0", 10) || 0, Math.floor(subtotal * exchangeRate));
      return next ? String(next) : "";
    }

    const hasDot = raw.includes(".");
    const intPart = parts[0] || "0";
    const decimalPart = parts.slice(1).join("").slice(0, 2);
    const fixed = hasDot ? `${intPart}.${decimalPart}` : intPart;
    if (!fixed) return "";

    const max = discountType === "percent" ? 100 : subtotal;
    const numeric = Number.parseFloat(fixed) || 0;
    if (numeric > max) return String(max);
    return fixed;
  };

  const handleDiscountValueChange = (value) => {
    setDiscountValue(cleanDiscountInput(value));
  };

  const cleanDeliveryInput = (value, currency = deliveryFeeCurrency) => {
    const raw = String(value || "").replace(/[^\d.]/g, "");
    if (!raw) return "";

    const parts = raw.split(".");
    if (currency === "KHR") {
      const next = Number.parseInt(parts[0] || "0", 10) || 0;
      return next ? String(next) : "";
    }

    const hasDot = raw.includes(".");
    const intPart = parts[0] || "0";
    const decimalPart = parts.slice(1).join("").slice(0, 2);
    return hasDot ? `${intPart}.${decimalPart}` : intPart;
  };

  const handleDeliveryFeeCurrencyChange = (currency) => {
    setDeliveryFeeCurrency(currency);
    setDeliveryFee(cleanDeliveryInput(deliveryFee, currency));
  };

  const channelIcon = {
    pos:         <Tag className="h-3 w-3" />,
    phone_order: <Phone className="h-3 w-3" />,
    online:      <Globe className="h-3 w-3" />,
  };

  return (
    <>
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm shadow-red-200">
              <ShoppingCart className="h-3.5 w-3.5" />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">
                {saleMode === "wholesale" && selectedCustomer
                  ? selectedCustomer.shopName
                  : "ភ្ញៀវដើរចូល"}
              </p>
              {saleMode === "wholesale" && selectedCustomer && (
                <p className="truncate text-[10px] text-slate-400">{selectedCustomer.phone}</p>
              )}
            </div>
          </div>
          {/* Sale channel tabs */}
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 p-0.5">
            {SALE_CHANNELS.map((ch) => {
              const isPhoneOrder = ch.value === "phone_order";
              const canUsePhoneOrder = saleMode === "wholesale" && selectedCustomer;
              const isDisabled = isPhoneOrder && !canUsePhoneOrder;
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => !isDisabled && setSaleChannel(ch.value)}
                  title={isDisabled ? "Wholesale + customer ត្រូវការ" : ch.label}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition",
                    isDisabled
                      ? "cursor-not-allowed opacity-30"
                      : saleChannel === ch.value
                      ? "bg-white text-red-500 shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  )}
                >
                  {channelIcon[ch.value]}
                  <span className="hidden sm:inline">{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Cart items — compact single-row ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2 space-y-1.5">
        {cart.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-5 w-5" />}
            title="រទេះទំនិញទទេ"
            description="ចុចលើទំនិញដើម្បីបន្ថែម"
          />
        ) : (
          cart.map((item, index) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
            >
              {/* Thumbnail */}
              <button
                type="button"
                onClick={() => setPreviewItem(item)}
                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-red-300 hover:ring-2 hover:ring-red-100"
                // title="មើលរូបភាព"
              >
                <span className="absolute -left-px -top-px z-10 flex h-4 min-w-4 items-center justify-center rounded-br-md bg-white/95 px-1 text-[9px] font-extrabold text-slate-500 shadow-sm">
                  {index + 1}
                </span>
                <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
              </button>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold leading-tight text-slate-900">{item.productName}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-700">
                    {item.unitName}
                  </span>
                  <span className="truncate text-[10px] font-semibold text-slate-500">{usd(item.unitPrice)}</span>
                </div>
              </div>

              {/* Qty controls */}
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-0.5 py-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-red-500"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <QtyInput qty={item.qty} onCommit={(newQty) => onSetQty(item.id, newQty)} />
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Line total */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-extrabold text-slate-900">{usd(item.lineTotal)}</p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Bottom fixed section ── */}
      <div className="shrink-0 border-t border-slate-100">

        {/* Adjustments */}
        <div className="px-3 py-2">
          <button
            type="button"
            onClick={() => setShowAdjustments((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-red-200 hover:bg-white"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <Percent className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">បញ្ចុះតម្លៃ / ដឹកជញ្ជូន</p>
                <p className="truncate text-[10px] text-slate-400">{adjustmentLabel}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {discountAmount > 0 && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600">
                  -{usd(discountAmount)}
                </span>
              )}
              {deliveryRequired && deliveryFeeUsd > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-600">
                  +{usd(deliveryFeeUsd)}
                </span>
              )}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAdjustments && "rotate-180")} />
              </span>
            </div>
          </button>

          {showAdjustments && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <Percent className="h-3 w-3" /> បញ្ចុះតម្លៃ
                </div>
                <div className="flex gap-1.5">
                  {[
                    { value: "none",    label: "គ្មាន" },
                    { value: "percent", label: "%" },
                    { value: "amount",  label: "$" },
                    { value: "khr",     label: "៛" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setDiscountType(opt.value); setDiscountValue(""); }}
                      className={cn(
                        "h-7 flex-1 rounded-lg text-xs font-bold transition-all",
                        discountType === opt.value
                          ? "bg-red-500 text-white shadow-sm shadow-red-200"
                          : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {discountType !== "none" && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {discountType === "percent" ? "%" : discountType === "khr" ? "៛" : "$"}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        min="0"
                        value={discountValue}
                        onChange={(e) => handleDiscountValueChange(e.target.value)}
                        placeholder={discountType === "percent" ? "5" : discountType === "khr" ? "4000" : "1.00"}
                        className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    {discountAmount > 0 && (
                      <span className="shrink-0 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                        -{usd(discountAmount)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="my-2 h-px bg-slate-100" />

              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <Truck className="h-3 w-3" /> ដឹកជញ្ជូន
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeliveryRequired((v) => !v)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                      deliveryRequired ? "bg-red-500" : "bg-slate-200"
                    )}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                      deliveryRequired ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
                {deliveryRequired && (
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <select
                      value={deliveryOption}
                      onChange={(e) => setDeliveryOption(e.target.value)}
                      className="col-span-2 h-7 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                    >
                      {DELIVERY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select
                      value={deliveryFeeCurrency}
                      onChange={(e) => handleDeliveryFeeCurrencyChange(e.target.value)}
                      className="h-7 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                    </select>
                    <input
                      type="text"
                      inputMode={deliveryFeeCurrency === "KHR" ? "numeric" : "decimal"}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(cleanDeliveryInput(e.target.value))}
                      placeholder={deliveryFeeCurrency === "KHR" ? "8000" : "2.00"}
                      className="h-7 rounded-xl border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-red-300"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mx-3 h-px bg-slate-100" />

        {/* Totals */}
        <div className="px-3 py-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>តម្លៃមុនបញ្ចុះ</span>
              <span className="font-semibold text-slate-800">{usd(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>បញ្ចុះ</span>
                <span className="font-semibold">−{usd(discountAmount)}</span>
              </div>
            )}
            {deliveryRequired && deliveryFeeUsd > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>ដឹកជញ្ជូន</span>
                <span className="font-semibold text-slate-800">+{usd(deliveryFeeUsd)}</span>
              </div>
            )}
          </div>
          {/* Grand Total */}
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <span className="text-sm font-bold text-slate-700">សរុបទាំងអស់</span>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
                <p className="text-lg font-extrabold leading-none text-slate-900">{usd(total)}</p>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5">
                <p className="text-lg font-extrabold leading-none text-red-600">{khr(total * exchangeRate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-3 h-px bg-slate-100" />

        {/* Action buttons */}
        <div className="px-3 pb-2.5 pt-2 space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onHold}
              disabled={cart.length === 0}
              className="table-icon-3d flex h-8 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Receipt className="h-3.5 w-3.5" /> ផ្អាក
            </button>
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className={cn(
                "table-icon-3d flex h-8 items-center justify-center gap-1 rounded-xl border text-[11px] font-semibold transition hover:-translate-y-0.5",
                note
                  ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              <Pencil className="h-3.5 w-3.5" /> មតិ{note ? " •" : ""}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={cart.length === 0}
              className="table-icon-3d flex h-8 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" /> សម្អាត
            </button>
          </div>

          {showNote && (
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="បន្ថែមកំណត់ចំណាំ..."
              rows={2}
              className="w-full resize-none rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          )}

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onOpenPayment}
            className="quick-action-icon-3d flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-[13px] font-extrabold text-white shadow-md shadow-red-200 transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Wallet className="h-4 w-4" />
            បង់ថ្លៃ
          </button>
        </div>
      </div>
    </div>
    {previewItem && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
        onClick={() => setPreviewItem(null)}
      >
        <div
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-slate-900">{previewItem.productName}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                  {previewItem.unitName}
                </span>
                <span className="rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-extrabold text-red-600">
                  {usd(previewItem.unitPrice)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-slate-50 p-4">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img
                src={previewItem.image}
                alt={previewItem.productName}
                className="h-full w-full object-contain p-3"
              />
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
