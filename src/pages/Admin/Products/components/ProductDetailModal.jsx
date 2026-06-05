import React from "react";
import { FiAlertTriangle, FiEdit2, FiImage } from "react-icons/fi";

import ModalShell from "./ModalShell";
import ProductThumb from "./ProductThumb";

function VariantThumb({ variant, size = "normal" }) {
  const className =
    size === "small"
      ? "h-12 w-12 rounded-xl object-cover"
      : "h-24 w-24 rounded-2xl object-cover";

  const placeholderClass =
    size === "small" ? "h-12 w-12 rounded-xl" : "h-24 w-24 rounded-2xl";

  if (variant.imagePath) {
    return (
      <img
        src={variant.imagePath}
        alt={variant.variantName}
        className={className}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-red-500/10 ${placeholderClass}`}
    >
      <FiImage
        className={
          size === "small" ? "text-xl text-red-500" : "text-4xl text-red-500"
        }
      />
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function PriceText({ rule }) {
  return (
    <span>
      ${Number(rule.usd || 0).toFixed(2)} /{" "}
      {Number(rule.khr || 0).toLocaleString()}៛
    </span>
  );
}

export default function ProductDetailModal({
  product,
  theme,
  onClose,
  onManageProduct,
}) {
  return (
    <ModalShell
      title={product.name}
      subtitle={`Product ID: ${product.id} · ${product.categoryName}`}
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => onManageProduct?.(product)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiEdit2 />
            Manage Product Setup
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Close
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-red-500/10">
            {product.imagePath ? (
              <img
                src={product.imagePath}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ProductThumb product={product} />
            )}
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <InfoLine label="Product ID" value={product.id} />
            <InfoLine label="Category" value={product.categoryName} />
            <InfoLine label="Status" value={product.status} />
            <InfoLine label="Description" value={product.description || "-"} />
          </div>
        </div>

        <div className="space-y-5">
          <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
            <h3 className="text-base font-bold">
              Variants ({product.variants.length})
            </h3>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              View product variants, units, and price rules.
            </p>
          </div>

          {product.variants.length === 0 && (
            <div
              className={`rounded-2xl border p-8 text-center ${theme.section}`}
            >
              <FiAlertTriangle className="mx-auto text-4xl text-amber-500" />
              <p className="mt-3 text-sm font-semibold">
                No variants for this product
              </p>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                Click Manage Product Setup to add variants.
              </p>
            </div>
          )}

          {product.variants.map((variant) => (
            <div
              key={variant.id}
              className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                <VariantThumb variant={variant} />

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold">
                    {variant.variantName}
                  </h3>

                  <p className={`mt-1 text-xs ${theme.muted}`}>
                    {variant.variantCode || "-"} · Variant ID: {variant.id}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      {variant.packageType || "No Package"}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      Size: {variant.sizeValue || "-"} {variant.sizeUnit || ""}
                    </span>

                    {variant.color && (
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                      >
                        Color: {variant.color}
                      </span>
                    )}

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      Low stock: {variant.lowStockThreshold}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold">Units</h4>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {variant.units.length === 0 && (
                    <div
                      className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                    >
                      <p className="font-semibold">No units configured</p>
                    </div>
                  )}

                  {variant.units.map((unit) => (
                    <div
                      key={unit.id}
                      className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                    >
                      <p className="font-semibold">
                        {unit.unitName} = {unit.conversionQty}
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        {unit.isBaseUnit ? "Base unit" : "Converted unit"}
                        {unit.isDefaultSaleUnit ? " · Default sale" : ""}
                        {unit.isDefaultPurchaseUnit
                          ? " · Default purchase"
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold">Price Rules</h4>

                {variant.priceRules.length === 0 ? (
                  <div
                    className={`mt-2 rounded-xl border p-3 text-sm ${theme.softCard}`}
                  >
                    No price rules configured
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {variant.priceRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold capitalize">
                              {rule.appliesTo}
                            </p>
                            <p className={`mt-1 text-xs ${theme.muted}`}>
                              Unit: {rule.unitName || "-"} · Min Qty:{" "}
                              {rule.minQty}
                            </p>
                          </div>

                          <p className="text-sm font-bold">
                            <PriceText rule={rule} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
