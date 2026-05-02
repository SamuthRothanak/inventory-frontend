import React from "react";
import { ShoppingCart, Minus, Plus, X } from "./posIcons";
import { usd, khr } from "./posData";

export default function QuickAddModal({
  selectedProduct,
  selectedUnitId,
  setSelectedUnitId,
  qty,
  setQty,
  appliedRule,
  availableUnits,
  unitPrice,
  lineTotal,
  onClose,
  onAddToCart,
}) {
  if (!selectedProduct || !appliedRule) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="text-lg font-semibold text-slate-900">Quick Add</div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
              <img src={selectedProduct.image} alt={selectedProduct.variantName} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{selectedProduct.productName}</div>
              <div className="text-sm text-slate-500">{selectedProduct.variantName}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-600">Unit</label>
              <select
                value={selectedUnitId}
                onChange={(event) => setSelectedUnitId(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none"
              >
                {selectedProduct.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Quantity</label>
              <div className="flex h-11 items-center justify-between rounded-2xl border border-slate-200 px-2">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} className="rounded-xl p-2 hover:bg-slate-100">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-slate-900">{qty}</span>
                <button type="button" onClick={() => setQty((value) => value + 1)} className="rounded-xl p-2 hover:bg-slate-100">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Applied price rule</span>
              <span className="font-medium text-slate-900">{appliedRule.label}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">Available stock</span>
              <span className="font-medium text-slate-900">{availableUnits}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">Unit price</span>
              <span className="font-medium text-slate-900">{usd(unitPrice)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">KHR display</span>
              <span className="font-medium text-slate-900">{khr(appliedRule.khr)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Line total</span>
              <span className="font-semibold text-slate-900">{usd(lineTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddToCart}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-red-500 px-4 text-sm font-medium text-white transition hover:bg-red-600"
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}