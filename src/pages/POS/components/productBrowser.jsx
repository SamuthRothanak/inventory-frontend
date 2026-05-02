import React from "react";
import { Search, Grid3X3, Package2 } from "./posIcons";
import { Badge, SectionCard } from "./ui";
import { getAppliedRule, usd } from "./posData";

function stockTone(stock, threshold) {
  if (stock <= 0) return "red";
  if (stock <= threshold) return "yellow";
  return "green";
}

function stockLabel(stock, threshold) {
  if (stock <= 0) return "Out";
  if (stock <= threshold) return "Low";
  return "In";
}

export default function ProductBrowser({
  categories,
  category,
  setCategory,
  search,
  setSearch,
  filteredProducts,
  onOpenQuickAdd,
}) {
  return (
    <SectionCard className="overflow-hidden p-0">
      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-4 xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Grid3X3 className="h-4 w-4 text-red-500" /> Categories
          </div>
          <div className="space-y-2">
            {categories.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${
                  category === tab ? "bg-red-500 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{tab}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="sticky top-0 z-10 mb-4 rounded-3xl bg-white/95 pb-1 backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by product, variant, category, code..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-red-300"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                <Package2 className="h-4 w-4 text-red-500" />
                <span>{filteredProducts.length} products</span>
              </div>
            </div>
          </div>

          <div className="max-h-[720px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((item) => {
                const defaultUnit = item.units[0];
                const publicRule = getAppliedRule(defaultUnit, 1, "public");

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenQuickAdd(item)}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
                  >
                    <div className="aspect-[1/0.9] overflow-hidden bg-slate-100">
                      <img src={item.image} alt={item.variantName} className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-1.5 p-3">
                      <div className="line-clamp-1 text-sm font-semibold text-slate-900">{item.productName}</div>
                      <div className="line-clamp-1 text-xs text-slate-500">{item.variantName}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold text-slate-900">{usd(publicRule.usd)}</span>
                        <Badge tone={stockTone(item.stockBaseQty, item.lowStockThreshold)}>
                          {stockLabel(item.stockBaseQty, item.lowStockThreshold)}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-400">{item.stockBaseQty} pcs</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}