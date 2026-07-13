import React, { useState } from "react";
import {
  ShoppingCart, Trash2, Minus, Plus, Receipt,
  Wallet, Percent, Truck, Tag, Phone, Globe, Pencil,
} from "./posIcons";
import { EmptyState } from "./ui";
import { usd, khr, SALE_CHANNELS, DELIVERY_OPTIONS, cn } from "./posData";

export default function CurrentSalePanel({
  saleMode, selectedCustomer, totalItems, cart, subtotal,
  discountType, setDiscountType, discountValue, setDiscountValue, discountAmount,
  deliveryRequired, setDeliveryRequired, deliveryOption, setDeliveryOption,
  deliveryFee, setDeliveryFee, deliveryFeeCurrency, setDeliveryFeeCurrency,
  saleChannel, setSaleChannel,
  deliveryFeeUsd, total,
  onUpdateQty, onRemove, onClear, onHold, onOpenPayment,
  requiresCustomer,
  exchangeRate,
  note, onNoteChange,
}) {
  const [showNote, setShowNote] = useState(false);
  const channelIcon = {
    pos:         <Tag className="h-3 w-3" />,
    phone_order: <Phone className="h-3 w-3" />,
    online:      <Globe className="h-3 w-3" />,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm shadow-red-200">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-900 text-sm">ការលក់បច្ចុប្បន្ន</span>
            {totalItems > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-red-200">
                {totalItems}
              </span>
            )}
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
        <p className="mt-1 truncate text-[10px] text-slate-400 pl-9">
          {saleMode === "wholesale" && selectedCustomer
            ? `${selectedCustomer.shopName} · ${selectedCustomer.phone}`
            : "ភ្ញៀវដើរចូល"}
        </p>
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
              {/* Index number */}
              <span className="hidden shrink-0 text-[10px] font-bold text-slate-300 xl:block w-3 text-center">
                {index + 1}
              </span>

              {/* Thumbnail */}
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
              </div>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold leading-tight text-slate-900">{item.productName}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="rounded bg-slate-200 px-1 py-0.5 text-[9px] font-semibold text-slate-600 leading-none">
                    {item.unitName}
                  </span>
                  <span className="truncate text-[9px] text-slate-400">{usd(item.unitPrice)}</span>
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
                <span className="min-w-5 text-center text-xs font-extrabold text-slate-900">{item.qty}</span>
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
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Bottom fixed section ── */}
      <div className="shrink-0 border-t border-slate-100">

        {/* Discount */}
        <div className="px-3 pt-3 pb-2">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Percent className="h-3 w-3" /> បញ្ចុះតម្លៃ
          </div>
          {/* Type chips */}
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
                  "h-8 flex-1 rounded-lg text-xs font-bold transition-all",
                  discountType === opt.value
                    ? "bg-red-500 text-white shadow-sm shadow-red-200"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Amount input */}
          {discountType !== "none" && (
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {discountType === "percent" ? "%" : discountType === "khr" ? "៛" : "$"}
                </span>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "5" : discountType === "khr" ? "4000" : "1.00"}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-sm outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
                />
              </div>
              {discountAmount > 0 && (
                <span className="shrink-0 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-600">
                  −{usd(discountAmount)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mx-3 h-px bg-slate-100" />

        {/* Delivery */}
        <div className="px-3 py-2">
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
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <select
                value={deliveryOption}
                onChange={(e) => setDeliveryOption(e.target.value)}
                className="col-span-2 h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
              >
                {DELIVERY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={deliveryFeeCurrency}
                onChange={(e) => setDeliveryFeeCurrency(e.target.value)}
                className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
              >
                <option value="USD">USD ($)</option>
                <option value="KHR">KHR (៛)</option>
              </select>
              <input
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="2.00"
                className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-red-300"
              />
            </div>
          )}
        </div>

        <div className="mx-3 h-px bg-slate-100" />

        {/* Totals */}
        <div className="px-3 py-2.5">
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
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-sm font-bold text-slate-700">សរុបទាំងអស់</span>
            <div className="text-right">
              <p className="text-xl font-extrabold text-slate-900">{usd(total)}</p>
              <p className="text-[10px] text-slate-400">{khr(total * exchangeRate)}</p>
            </div>
          </div>
        </div>

        <div className="mx-3 h-px bg-slate-100" />

        {/* Action buttons */}
        <div className="px-3 pb-3 pt-2.5 space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onHold}
              disabled={cart.length === 0}
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Receipt className="h-3.5 w-3.5" /> ផ្អាក
            </button>
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className={cn(
                "flex h-9 items-center justify-center gap-1 rounded-xl border text-[11px] font-semibold transition",
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
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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

          {requiresCustomer && cart.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <span className="text-[10px] font-semibold text-amber-700">
                ការលក់ដុំត្រូវការអតិថិជន — សូមជ្រើសរើសខាងលើ
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={cart.length === 0 || requiresCustomer}
            onClick={onOpenPayment}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-500 to-rose-500 text-sm font-extrabold text-white shadow-md shadow-red-200 transition hover:from-red-600 hover:to-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <Wallet className="h-4 w-4" />
            បង់ថ្លៃ — {usd(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
