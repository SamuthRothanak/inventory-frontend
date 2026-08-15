import React, { useState } from "react";
import { Search, Package2, ScanLine, ChevronLeft, ChevronRight } from "./posIcons";
import { EmptyState } from "./ui";
import { getAppliedRule, usd, cn } from "./posData";

const PRODUCTS_PER_PAGE = 24;

// Same "1 2 3 ... N" ellipsis pattern as the Reports page's table pagination, for a consistent
// look across the app.
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function stockBorderClass(stockBaseQty, lowStockThreshold) {
  if (stockBaseQty <= 0)                 return "border-t-red-400";
  if (stockBaseQty <= lowStockThreshold) return "border-t-amber-400";
  return "border-t-emerald-400";
}

function stockLabel(stockBaseQty, lowStockThreshold) {
  if (stockBaseQty <= 0)                 return { text: "អស់", cls: "bg-red-500/90 text-white" };
  if (stockBaseQty <= lowStockThreshold) return { text: "ស្ទើរអស់", cls: "bg-amber-500/90 text-white" };
  return null;
}

// ─── Grid Card ────────────────────────────────────────────────────
function variantSuffix(item) {
  const name = item.variantName || "";
  const prefix = (item.productName || "") + " ";
  if (name.startsWith(prefix)) return name.slice(prefix.length).trim();
  if (name === item.productName) return "";
  return name;
}

function ProductCardGrid({ item, publicRule, isOut, onClick }) {
  const label  = stockLabel(item.stockBaseQty, item.lowStockThreshold);
  const suffix = variantSuffix(item);

  return (
    <button
      type="button"
      disabled={isOut}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all",
        isOut
          ? "cursor-not-allowed opacity-40 grayscale"
          : "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg active:scale-[0.97]"
      )}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-white" style={{ paddingBottom: "65%" }}>
        <img
          src={item.image}
          alt={item.variantName}
          className="absolute inset-0 h-full w-full object-contain p-2"
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
        {suffix && (
          <span className="mt-1.5 inline-flex w-fit items-center rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 ring-1 ring-inset ring-sky-200">
            {suffix}
          </span>
        )}
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
  const suffix = variantSuffix(item);

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
        <div className="mt-0.5 flex items-center gap-1.5">
          {suffix && (
            <span className="shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-600 ring-1 ring-inset ring-sky-200">
              {suffix}
            </span>
          )}
          {item.code && <span className="truncate text-[10px] text-slate-400">{item.code}</span>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-extrabold text-red-500">{usd(publicRule.usd)}</p>
        <p className="text-[10px] text-slate-400">{item.stockBaseQty} ខ្នាតទំនិញ</p>
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
  reservedBaseQtyByProductId = {},
  onOpenQuickAdd,
  onOpenBarcodeCamera,
}) {
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);

  // Jump back to page 1 whenever the visible set changes shape (new search/category/view) —
  // otherwise a cashier filtering down to fewer results can land on a now-empty page. Adjusted
  // during render (React's documented pattern for "reset state when a prop changes") rather
  // than in a useEffect, which would cause an extra visible render of the stale page first.
  const [pageResetKey, setPageResetKey] = useState(`${category}|${search}|${viewMode}`);
  const currentResetKey = `${category}|${search}|${viewMode}`;
  if (pageResetKey !== currentResetKey) {
    setPageResetKey(currentResetKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = filteredProducts.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);
  const pageNumbers = getPageNumbers(safePage, totalPages);

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
              placeholder="ស្វែងរកទំនិញ លេខកូដ..."
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

          {/* Barcode camera scan */}
          <button
            type="button"
            onClick={onOpenBarcodeCamera}
            title="ស្កេនកាមេរ៉ា"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <ScanLine className="h-3.5 w-3.5" />
          </button>

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
            const count    = countForTab(tab);
            const isActive = category === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                  isActive
                    ? "bg-red-500 text-white shadow-sm shadow-red-200"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:shadow-sm"
                )}
              >
                {tab}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  isActive ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"
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
            title="រកមិនឃើញទំនិញ"
            description="ព្យាយាមប្តូរប្រភេទ ឬពាក្យស្វែងរក"
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
            {pageProducts.map((item) => {
              const publicRule = getAppliedRule(item.units[0], 1, "public");
              // Display only — cart's own stock-limit math already accounts for reservations
              // itself, so onOpenQuickAdd still gets the raw `item` (see productBrowser prop
              // comment in Pos.jsx for why double-subtracting must be avoided).
              const displayItem = { ...item, stockBaseQty: Math.max(0, item.stockBaseQty - (reservedBaseQtyByProductId[item.id] || 0)) };
              return (
                <ProductCardGrid
                  key={item.id}
                  item={displayItem}
                  publicRule={publicRule}
                  isOut={displayItem.stockBaseQty <= 0}
                  onClick={() => onOpenQuickAdd(item)}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {pageProducts.map((item) => {
              const publicRule = getAppliedRule(item.units[0], 1, "public");
              const displayItem = { ...item, stockBaseQty: Math.max(0, item.stockBaseQty - (reservedBaseQtyByProductId[item.id] || 0)) };
              return (
                <ProductCardList
                  key={item.id}
                  item={displayItem}
                  publicRule={publicRule}
                  isOut={displayItem.stockBaseQty <= 0}
                  onClick={() => onOpenQuickAdd(item)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-slate-100 px-3 py-3">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage(safePage - 1)}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            មុន
          </button>

          {pageNumbers.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-1 text-xs font-semibold text-slate-400">...</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setCurrentPage(item)}
                className={cn(
                  "h-9 min-w-9 rounded-xl px-3 text-xs font-bold transition",
                  item === safePage
                    ? "bg-red-600 text-white shadow-sm"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                )}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage(safePage + 1)}
            className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            បន្ទាប់
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
