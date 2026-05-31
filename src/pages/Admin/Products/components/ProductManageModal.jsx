import React from "react";
import {
  FiAlertTriangle,
  FiEdit2,
  FiImage,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

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

function SmallActionButton({
  type = "button",
  variant = "blue",
  children,
  onClick,
  disabled = false,
}) {
  const colorClass =
    variant === "green"
      ? "bg-emerald-500 hover:bg-emerald-600"
      : variant === "red"
      ? "bg-red-500 hover:bg-red-600"
      : variant === "amber"
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${colorClass}`}
    >
      {children}
    </button>
  );
}

function getVariantUnitId(unit) {
  return (
    unit?.id ||
    unit?.productVariantUnitId ||
    unit?.product_variant_unit_id ||
    unit?.variantUnitId ||
    unit?.variant_unit_id ||
    null
  );
}

function getRuleVariantUnitId(rule) {
  return (
    rule?.productVariantUnitId ||
    rule?.product_variant_unit_id ||
    rule?.variantUnitId ||
    rule?.variant_unit_id ||
    null
  );
}

function formatInputPrice(rule) {
  const currency = rule.inputCurrency || rule.input_currency || "USD";
  const price = Number(rule.inputPrice ?? rule.input_price ?? 0);

  if (currency === "KHR") {
    return `${price.toLocaleString()}៛`;
  }

  return `$${price.toFixed(2)}`;
}

export default function ProductManageModal({
  product,
  theme,
  onClose,

  onEditProduct,

  onAddVariant,
  onEditVariant,
  onDeleteVariant,

  onAddVariantUnit,
  onEditVariantUnit,
  onDeleteVariantUnit,

  onAddPriceRule,
  onEditPriceRule,
  onDeletePriceRule,
}) {
  return (
    <ModalShell
      title={`Manage Product Setup: ${product.name}`}
      subtitle={`Product ID: ${product.id} · ${product.categoryName}`}
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button
            type="button"
            onClick={() => onEditProduct?.(product)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiEdit2 />
            Edit Product Info
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Variants ({product.variants.length})
                </h3>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  Manage variants, unit rows, and price rules here.
                </p>
              </div>

              <SmallActionButton
                variant="green"
                onClick={() => onAddVariant?.(product)}
              >
                <FiPlus />
                Add Variant
              </SmallActionButton>
            </div>
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
                Add variants such as Can, Bottle, Case, or Box.
              </p>

              <div className="mt-4">
                <SmallActionButton
                  variant="green"
                  onClick={() => onAddVariant?.(product)}
                >
                  <FiPlus />
                  Add First Variant
                </SmallActionButton>
              </div>
            </div>
          )}

          {product.variants.map((variant) => (
            <div
              key={variant.id}
              className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex gap-4">
                  <VariantThumb variant={variant} />

                  <div>
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
                        Size: {variant.sizeValue || "-"}{" "}
                        {variant.sizeUnit || ""}
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

                    <div className="mt-4 flex flex-wrap gap-2">
                      <SmallActionButton
                        variant="blue"
                        onClick={() => onEditVariant?.(product, variant)}
                      >
                        <FiEdit2 />
                        Edit Variant
                      </SmallActionButton>

                      <SmallActionButton
                        variant="red"
                        onClick={() => onDeleteVariant?.(variant)}
                      >
                        <FiTrash2 />
                        Delete Variant
                      </SmallActionButton>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Units</h4>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Define base unit, sale unit, purchase unit and conversion.
                    </p>
                  </div>

                  <SmallActionButton
                    variant="green"
                    onClick={() => onAddVariantUnit?.(variant)}
                  >
                    <FiPlus />
                    Add Unit Row
                  </SmallActionButton>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {variant.units.length === 0 && (
                    <div
                      className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                    >
                      <p className="font-semibold">No units configured</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Add at least one unit row before adding price rules.
                      </p>
                    </div>
                  )}

                  {variant.units.map((unit) => {
                    const unitId = getVariantUnitId(unit);

                    return (
                      <div
                        key={unitId || unit.id}
                        className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
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

                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                onEditVariantUnit?.(variant, {
                                  ...unit,
                                  id: unitId,
                                })
                              }
                              className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onDeleteVariantUnit?.({
                                  ...unit,
                                  id: unitId,
                                })
                              }
                              className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <SmallActionButton
                            variant="green"
                            disabled={!unitId}
                            onClick={() => {
                              if (!unitId) {
                                alert("Product variant unit id is missing.");
                                return;
                              }

                              onAddPriceRule?.(variant, {
                                ...unit,
                                id: unitId,
                              });
                            }}
                          >
                            <FiPlus />
                            Add Price
                          </SmallActionButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold">Price Rules</h4>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  Each price rule belongs to one variant unit.
                </p>

                <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-red-600 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left">Applies To</th>
                        <th className="px-3 py-3 text-left">Unit</th>
                        <th className="px-3 py-3 text-left">Min Qty</th>
                        <th className="px-3 py-3 text-left">USD</th>
                        <th className="px-3 py-3 text-left">KHR</th>
                        <th className="px-3 py-3 text-left">Input</th>
                        <th className="px-3 py-3 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {variant.priceRules.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-3 py-6 text-center">
                            No price rules configured
                          </td>
                        </tr>
                      )}

                      {variant.priceRules.map((rule) => {
                        const ruleUnitId = getRuleVariantUnitId(rule);

                        const relatedUnit = variant.units.find((unit) => {
                          const unitId = getVariantUnitId(unit);
                          return Number(unitId) === Number(ruleUnitId);
                        });

                        const safeRelatedUnit = relatedUnit
                          ? {
                              ...relatedUnit,
                              id: getVariantUnitId(relatedUnit),
                            }
                          : null;

                        return (
                          <tr
                            key={rule.id}
                            className="border-t border-zinc-200 dark:border-white/10"
                          >
                            <td className="px-3 py-3 capitalize">
                              {rule.appliesTo}
                            </td>

                            <td className="px-3 py-3">
                              {rule.unitName || safeRelatedUnit?.unitName || "-"}
                            </td>

                            <td className="px-3 py-3">{rule.minQty}</td>

                            <td className="px-3 py-3">
                              ${Number(rule.usd || 0).toFixed(2)}
                            </td>

                            <td className="px-3 py-3">
                              {Number(rule.khr || 0).toLocaleString()}៛
                            </td>

                            <td className="px-3 py-3">
                              {formatInputPrice(rule)}
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  disabled={!safeRelatedUnit}
                                  onClick={() => {
                                    if (!safeRelatedUnit) {
                                      alert(
                                        "Cannot find related unit for this price rule."
                                      );
                                      return;
                                    }

                                    onEditPriceRule?.(
                                      variant,
                                      safeRelatedUnit,
                                      rule
                                    );
                                  }}
                                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDeletePriceRule?.(rule)}
                                  className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {variant.units.length === 0 && (
                  <p className="mt-2 text-xs text-amber-500">
                    Add a unit first before adding price rules.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}