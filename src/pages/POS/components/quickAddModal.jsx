import React from "react";
import { ShoppingCart, X, Tag, AlertCircle } from "./posIcons";
import { usd, khr, cn } from "./posData";

const NUMPAD_KEYS = ["7","8","9","4","5","6","1","2","3","⌫","0","×5"];

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
  if (!selectedProduct) return null;

  const isOutOfStock = selectedProduct.stockBaseQty <= 0;
  const isOverStock  = qty > availableUnits;

  function handleNumpad(key) {
    if (key === "⌫") {
      setQty((v) => Math.max(1, Math.floor(v / 10)));
      return;
    }
    if (key === "×5") {
      setQty((v) => Math.min(v * 5, 9999));
      return;
    }
    setQty((v) => {
      const next = parseInt(`${v === 1 && key !== "0" ? "" : v}${key}`, 10);
      return isNaN(next) || next < 1 ? 1 : Math.min(next, 9999);
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm shadow-red-200">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Add to Cart</p>
              <p className="text-xs text-slate-400">{selectedProduct.productName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product summary */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.variantName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 truncate">{selectedProduct.productName}</p>
              <p className="mt-0.5 text-sm text-slate-500 truncate">{selectedProduct.variantName}</p>
              {selectedProduct.code && (
                <p className="mt-1 text-xs font-mono text-slate-400">{selectedProduct.code}</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-slate-400">In stock</p>
              <p className="text-lg font-extrabold text-slate-900">{selectedProduct.stockBaseQty}</p>
            </div>
          </div>

          {/* Unit selector */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Select Unit</p>
            <div className="flex flex-wrap gap-2">
              {selectedProduct.units.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                    selectedUnitId === unit.id
                      ? "border-red-400 bg-red-500 text-white shadow-sm shadow-red-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {unit.name}
                  <span className={cn(
                    "ml-1.5 text-[10px] font-normal",
                    selectedUnitId === unit.id ? "text-red-100" : "text-slate-400"
                  )}>
                    ×{unit.conversionQty}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Qty + numpad */}
          <div className="grid grid-cols-[1fr_auto] gap-4">
            {/* Left: info */}
            <div className="space-y-3">
              {/* Qty display */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</p>
                <div className={cn(
                  "flex h-14 items-center justify-center rounded-xl border-2 text-3xl font-extrabold transition",
                  isOverStock
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-slate-200 bg-slate-50 text-slate-900"
                )}>
                  {qty}
                </div>
              </div>

              {/* Available */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">Available</p>
                <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                  <span className={cn("text-base font-bold", isOverStock ? "text-red-500" : "text-emerald-600")}>
                    {availableUnits}
                  </span>
                  <span className="ml-1.5 text-xs text-slate-400">units</span>
                </div>
              </div>

              {/* Price rule */}
              {appliedRule && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Tag className="h-3 w-3" /> Price Rule
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rule</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                        {appliedRule.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unit price</span>
                      <div className="text-right">
                        <span className="font-semibold text-slate-900">{usd(unitPrice)}</span>
                        <span className="ml-1.5 text-[10px] text-slate-400">{khr(appliedRule.khr)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5">
                      <span className="font-bold text-slate-700">Line total</span>
                      <span className="text-base font-extrabold text-red-500">{usd(lineTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: numpad */}
            <div className="grid w-36 grid-cols-3 gap-1.5 self-start">
              {NUMPAD_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleNumpad(key)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl border text-sm font-bold transition-all active:scale-95",
                    key === "⌫"
                      ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                      : key === "×5"
                      ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      : "border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-300"
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Over-stock warning */}
          {isOverStock && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Exceeds available stock ({availableUnits} units).</span>
            </div>
          )}

          {/* Add button */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!appliedRule || isOverStock || isOutOfStock}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-500 to-rose-500 text-sm font-extrabold text-white shadow-md shadow-red-200 transition hover:from-red-600 hover:to-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart — {usd(lineTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
