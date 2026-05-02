import React from "react";
import { ShoppingCart, Trash2, Minus, Plus, Receipt, Printer, ArrowRightLeft, Wallet } from "./posIcons";
import { Badge, SectionCard } from "./ui";
import { usd } from "./posData";

export default function CurrentSalePanel({
  saleMode,
  selectedCustomer,
  totalItems,
  cart,
  subtotal,
  total,
  onUpdateQty,
  onRemove,
  onClear,
  onOpenPayment,
}) {
  return (
    <SectionCard className="flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <ShoppingCart className="h-5 w-5 text-red-500" /> Current Sale
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {saleMode === "wholesale" && selectedCustomer
                ? `${selectedCustomer.shopName} • ${selectedCustomer.phone}`
                : "Walk-in customer"}
            </div>
          </div>
          <Badge>{totalItems} items</Badge>
        </div>
      </div>

      <div className="max-h-[640px] flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {cart.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Search fast, click product, choose unit and quantity, then add to cart.
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                  <img src={item.image} alt={item.variantName} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-medium text-slate-900">{item.productName}</div>
                  <div className="line-clamp-1 text-sm text-slate-500">{item.variantName}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge>{item.unitName}</Badge>
                    <span className="text-xs text-slate-500">{item.appliedRuleLabel}</span>
                  </div>
                </div>
                <button type="button" onClick={() => onRemove(item.id)} className="rounded-xl p-2 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-2 py-1">
                  <button type="button" onClick={() => onUpdateQty(item.id, -1)} className="rounded-xl p-2 hover:bg-slate-100">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[28px] text-center font-semibold text-slate-900">{item.qty}</span>
                  <button type="button" onClick={() => onUpdateQty(item.id, 1)} className="rounded-xl p-2 hover:bg-slate-100">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-500">{usd(item.unitPrice)} / {item.unitName}</div>
                  <div className="font-semibold text-slate-900">{usd(item.lineTotal)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 p-5">
        <div className="rounded-3xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-900">{usd(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Discount</span>
            <span className="font-medium text-slate-900">$0.00</span>
          </div>
          <div className="mt-2 border-t border-slate-200 pt-2">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{usd(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Receipt className="mr-2 h-4 w-4" /> Hold
          </button>
          <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Printer className="mr-2 h-4 w-4" /> Print
          </button>
          <button className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Return
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </button>
        </div>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={onOpenPayment}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-500 px-4 text-base font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Wallet className="mr-2 h-5 w-5" /> Pay Now
        </button>
      </div>
    </SectionCard>
  );
}