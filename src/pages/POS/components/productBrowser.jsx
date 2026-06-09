import React, { useState } from "react";
import { Search, Package2 } from "./posIcons";
import { EmptyState } from "./ui";
import { getAppliedRule, usd, cn } from "./posData";

const CATEGORY_META = {
  All:   { icon: "🏪", color: "text-slate-600",  activeBg: "bg-red-500   text-white shadow-red-200"   },
  Drink: { icon: "🥤", color: "text-blue-600",   activeBg: "bg-blue-500  text-white shadow-blue-200"  },
  Food:  { icon: "🍱", color: "text-amber-600",  activeBg: "bg-amber-500 text-white shadow-amber-200" },
  Snack: { icon: "🍿", color: "text-purple-600", activeBg: "bg-purple-500 text-white shadow-purple-200"},
  Care:  { icon: "🧴", color: "text-green-600",  activeBg: "bg-green-500 text-white shadow-green-200" },
};

function stockBorderClass(stockBaseQty, lowStockThreshold) {
  if (stockBaseQty <= 0)                 return "border-t-red-400";
  if (stockBaseQty <= lowStockThreshold) return "border-t-amber-400";
  return "border-t-emerald-400";
}

function stockLabel(stockBaseQty, lowStockThreshold) {
  if (stockBaseQty <= 0)                 return { text: "Out",  cls: "bg-red-500/90 text-white" };
  if (stockBaseQty <= lowStockThreshold) return { text: "Low",  cls: "bg-amber-500/90 text-white" };
  return null;
}

// ─── Grid Card ────────────────────────────────────────────────────
function ProductCardGrid({ item, publicRule, isOut, onClick }) {
  const borderTop = stockBorderClass(item.stockBaseQty, item.lowStockThreshold);
  const label     = stockLabel(item.stockBaseQty, item.lowStockThreshold);

  return (
    <button
      type="button"
      disabled={isOut}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 border-t-[3px] bg-white text-left shadow-sm transition-all",
        borderTop,
        isOut
          ? "cursor-not-allowed opacity-40 grayscale"
          : "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg active:scale-[0.97]"
      )}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-slate-100" style={{ paddingBottom: "72%" }}>
        <img
          src={item.image}
          alt={item.variantName}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {label && (
          <span className={cn(
            "absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm",
            label.cls
          )}>
            {label.text}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-1 text-[12px] font-bold leading-tight text-slate-900">{item.productName}</p>
        <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{item.variantName}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-extrabold text-red-500">{usd(publicRule.usd)}</span>
          <span className="text-[10px] font-medium text-slate-400">{item.stockBaseQty}</span>
        </div>
      </div>
    </button>
  );
}

// ─── List Card ────────────────────────────────────────────────────
function ProductCardList({ item, publicRule, isOut, onClick }) {
  const dotColor = item.stockBaseQty <= 0 ? "bg-red-400"
    : item.stockBaseQty <= item.lowStockThreshold ? "bg-amber-400"
    : "bg-emerald-400";

  return (
    <button
      type="button"
      disabled={isOut}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all",
        isOut
          ? "cursor-not-allowed opacity-40 grayscale"
          : "hover:border-red-200 hover:bg-red-50/30 hover:shadow-md active:scale-[0.99]"
      )}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <img src={item.image} alt={item.variantName} className="h-full w-full object-cover" />
        <span className={cn("absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white", dotColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{item.productName}</p>
        <p className="truncate text-xs text-slate-400">{item.variantName} · {item.code}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-extrabold text-red-500">{usd(publicRule.usd)}</p>
        <p className="text-[10px] text-slate-400">{item.stockBaseQty} pcs</p>
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function ProductBrowser({
  categories,
  category,
  setCategory,
  search,
  setSearch,
  filteredProducts,
  onOpenQuickAdd,
}) {
  const [viewMode, setViewMode] = useState("grid");

  // count per category (against ALL products, not filtered by category)
  // We receive filteredProducts which is already filtered by search — so count may reflect search
  // For category counts, show product count within that category (unfiltered by category)
  const countForTab = (tab) =>
    tab === "All"
      ? filteredProducts.length
      : filteredProducts.filter((p) => p.category === tab).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ── Toolbar: search + category tabs + view toggle ── */}
      <div className="shrink-0 border-b border-slate-100 px-4 pt-3 pb-0">

        {/* Row 1: search + controls */}
        <div className="flex items-center gap-2 pb-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, variant, code…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M4.47 4.47a.75.75 0 011.06 0L8 6.94l2.47-2.47a.75.75 0 111.06 1.06L9.06 8l2.47 2.47a.75.75 0 11-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 01-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 010-1.06z" />
                </svg>
              </button>
            )}
          </div>

          {/* Product count */}
          <div className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs">
            <Package2 className="h-3.5 w-3.5 text-red-400" />
            <span className="font-bold text-slate-700">{filteredProducts.length}</span>
          </div>

          {/* View toggle */}
          <div className="flex h-10 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition",
                viewMode === "grid" ? "bg-white shadow text-red-500" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1.5"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition",
                viewMode === "list" ? "bg-white shadow text-red-500" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
                <rect x="1" y="2"   width="14" height="2.5" rx="1"/>
                <rect x="1" y="6.5" width="14" height="2.5" rx="1"/>
                <rect x="1" y="11"  width="14" height="2.5" rx="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Row 2: category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none">
          {categories.map((tab) => {
            const meta    = CATEGORY_META[tab] ?? { icon: "📦", color: "text-slate-600", activeBg: "bg-slate-500 text-white" };
            const count   = countForTab(tab);
            const isActive = category === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                  isActive
                    ? cn("shadow-sm", meta.activeBg)
                    : cn("border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm", meta.color)
                )}
              >
                <span className="text-sm leading-none">{meta.icon}</span>
                {tab}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  isActive ? "bg-white/25" : "bg-slate-200 text-slate-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ── Product area: full width, scrollable ── */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package2 className="h-6 w-6" />}
            title="No products found"
            description="Try a different category or keyword."
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((item) => {
              const publicRule = getAppliedRule(item.units[0], 1, "public");
              return (
                <ProductCardGrid
                  key={item.id}
                  item={item}
                  publicRule={publicRule}
                  isOut={item.stockBaseQty <= 0}
                  onClick={() => onOpenQuickAdd(item)}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((item) => {
              const publicRule = getAppliedRule(item.units[0], 1, "public");
              return (
                <ProductCardList
                  key={item.id}
                  item={item}
                  publicRule={publicRule}
                  isOut={item.stockBaseQty <= 0}
                  onClick={() => onOpenQuickAdd(item)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
