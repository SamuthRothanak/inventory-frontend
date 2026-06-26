import React, { useState } from "react";
import {
  FiAlertTriangle,
  FiEdit2,
  FiImage,
  FiPlus,
  FiSettings,
  FiTrash2,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
import ProductThumb from "./ProductThumb";
import { QuickCreateUnitBox } from "./ProductSetupFormModal";

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

  units = [],
  isCreatingUnit = false,
  isUpdatingUnit = false,
  isDeletingUnit = false,
  onCreateUnit,
  onUpdateUnit,
  onDeleteUnit,
}) {
  const [variantTabs, setVariantTabs] = useState({});
  const getVariantTab = (id) => variantTabs[id] ?? "units";
  const setVariantTab = (id, tab) =>
    setVariantTabs((prev) => ({ ...prev, [id]: tab }));

  const [quickUnitOpen, setQuickUnitOpen] = useState(false);
  const [quickUnit, setQuickUnit] = useState({
    unit_code: "",
    unit_name: "",
    unit_type: "piece",
    allow_decimal: false,
    status: "active",
  });

  return (
    <ModalShell
      title={`គ្រប់គ្រងផលិតផល: ${product.name}`}
      subtitle={`${product.categoryName || "គ្មានប្រភេទ"} · ${product.variants?.length || 0} មុខទំនិញ`}
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
            កែព័ត៌មានផលិតផល
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បិទ
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
            <InfoLine label="ប្រភេទ" value={product.categoryName} />
            <InfoLine label="ស្ថានភាព" value={product.status === "active" ? "ដំណើរការ" : "មិនដំណើរការ"} />
            <InfoLine label="ការពិពណ៌នា" value={product.description || "-"} />
          </div>
        </div>

        <div className="space-y-5">
          <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-bold">
                  មុខទំនិញ ({product.variants.length})
                </h3>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  គ្រប់គ្រងមុខទំនិញ, ខ្នាតទំនិញ, និងតម្លៃនៅទីនេះ ។
                </p>
              </div>

              <SmallActionButton
                variant="green"
                onClick={() => onAddVariant?.(product)}
              >
                <FiPlus />
                បន្ថែមមុខទំនិញ
              </SmallActionButton>
            </div>
          </div>

          {product.variants.length === 0 && (
            <div
              className={`rounded-2xl border p-8 text-center ${theme.section}`}
            >
              <FiAlertTriangle className="mx-auto text-4xl text-amber-500" />
              <p className="mt-3 text-sm font-semibold">
                គ្មានមុខទំនិញសម្រាប់ផលិតផលនេះ
              </p>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                បន្ថែមមុខទំនិញដូចជា Can, Bottle, Case, ឬ Box។
              </p>

              <div className="mt-4">
                <SmallActionButton
                  variant="green"
                  onClick={() => onAddVariant?.(product)}
                >
                  <FiPlus />
                  បន្ថែមមុខទំនិញដំបូង
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
                      {variant.variantCode || "-"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                      >
                        {variant.packageType || "គ្មានខ្ចប់"}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                      >
                        ទំហំ: {variant.sizeValue || "-"}{" "}
                        {variant.sizeUnit || ""}
                      </span>

                      {variant.color && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                        >
                          ពណ៌: {variant.color}
                        </span>
                      )}

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                      >
                        ស្តុកក្រោម: {variant.lowStockThreshold}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <SmallActionButton
                        variant="blue"
                        onClick={() => onEditVariant?.(product, variant)}
                      >
                        <FiEdit2 />
                        កែមុខទំនិញ
                      </SmallActionButton>

                      <SmallActionButton
                        variant="red"
                        onClick={() => onDeleteVariant?.(variant)}
                      >
                        <FiTrash2 />
                        លុបមុខទំនិញ
                      </SmallActionButton>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tab bar ── */}
              <div className="mt-5 flex items-center gap-1 border-b border-zinc-200 dark:border-white/10">
                {["units", "prices"].map((tab) => {
                  const label = tab === "units"
                    ? `ខ្នាតទំនិញ (${variant.units.length})`
                    : `តម្លៃ (${variant.priceRules.length})`;
                  const active = getVariantTab(variant.id) === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setVariantTab(variant.id, tab)}
                      className={`rounded-t-lg px-4 py-2 text-xs font-bold transition -mb-px border-b-2 ${
                        active
                          ? "border-red-500 text-red-500"
                          : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* ── Units tab ── */}
              {getVariantTab(variant.id) === "units" && (
                <div className="mt-4">
                  <div className="flex flex-wrap justify-end gap-2 mb-3">
                    <SmallActionButton
                      variant="amber"
                      onClick={() => setQuickUnitOpen((v) => !v)}
                    >
                      <FiSettings />
                      ប្រភេទខ្នាតទំនិញ
                    </SmallActionButton>
                    <SmallActionButton
                      variant="green"
                      onClick={() => onAddVariantUnit?.(variant)}
                    >
                      <FiPlus />
                      បន្ថែមខ្នាតទំនិញ
                    </SmallActionButton>
                  </div>

                  {quickUnitOpen && (
                    <div className="mb-3">
                      <QuickCreateUnitBox
                        theme={theme}
                        units={units}
                        quickUnit={quickUnit}
                        setQuickUnit={setQuickUnit}
                        isCreatingUnit={isCreatingUnit}
                        isUpdatingUnit={isUpdatingUnit}
                        isDeletingUnit={isDeletingUnit}
                        onCreateUnit={onCreateUnit}
                        onUpdateUnit={onUpdateUnit}
                        onDeleteUnit={onDeleteUnit}
                        onClose={() => setQuickUnitOpen(false)}
                        onCreated={() => setQuickUnit({
                          unit_code: "", unit_name: "", unit_type: "piece",
                          allow_decimal: false, status: "active",
                        })}
                      />
                    </div>
                  )}

                  {variant.units.length === 0 ? (
                    <div className={`rounded-xl border p-4 text-sm ${theme.softCard}`}>
                      <p className="font-semibold">គ្មានខ្នាតទំនិញ</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        បន្ថែមខ្នាតទំនិញ យ៉ាងតិច ១ មុនពេលបន្ថែមតម្លៃ ។
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {variant.units.map((unit) => {
                        const unitId = getVariantUnitId(unit);
                        return (
                          <div key={unitId || unit.id}
                            className={`rounded-xl border p-3 text-sm ${theme.softCard}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{unit.unitName} = {unit.conversionQty}</p>
                                <p className={`mt-1 text-xs ${theme.muted}`}>
                                  {unit.isBaseUnit ? "ខ្នាតស្តុក" : "ខ្នាតដូរ"}
                                  {unit.isDefaultSaleUnit ? " · លក់ក្នុង POS" : ""}
                                  {unit.isDefaultPurchaseUnit ? " · ទិញពីអ្នកលក់" : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <button type="button"
                                  onClick={() => onEditVariantUnit?.(variant, { ...unit, id: unitId })}
                                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-700">
                                  កែ
                                </button>
                                <button type="button"
                                  onClick={() => onDeleteVariantUnit?.({ ...unit, id: unitId })}
                                  className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600">
                                  លុប
                                </button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <SmallActionButton variant="green" disabled={!unitId}
                                onClick={() => unitId && onAddPriceRule?.(variant, { ...unit, id: unitId })}>
                                <FiPlus /> បន្ថែមតម្លៃ
                              </SmallActionButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Price Rules tab ── */}
              {getVariantTab(variant.id) === "prices" && (
                <div className="mt-4">
                  {variant.units.length === 0 && (
                    <p className="mb-2 text-xs text-amber-500">
                      បន្ថែមខ្នាតទំនិញ មុនពេលបន្ថែមតម្លៃ ។
                    </p>
                  )}
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                    <table className="w-full min-w-225 text-sm">
                      <thead className="bg-red-600 text-white">
                        <tr>
                          <th className="px-3 py-3 text-left">ប្រភេទតម្លៃ</th>
                          <th className="px-3 py-3 text-left">ខ្នាតទំនិញ</th>
                          <th className="px-3 py-3 text-left">ចំនួនយ៉ាងតិច</th>
                          <th className="px-3 py-3 text-left">USD</th>
                          <th className="px-3 py-3 text-left">KHR</th>
                          <th className="px-3 py-3 text-center">សកម្មភាព</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variant.priceRules.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-3 py-6 text-center">
                              គ្មានតម្លៃដែលបានដំឡើង
                            </td>
                          </tr>
                        )}
                        {variant.priceRules.map((rule) => {
                          const ruleUnitId = getRuleVariantUnitId(rule);
                          const relatedUnit = variant.units.find((u) =>
                            Number(getVariantUnitId(u)) === Number(ruleUnitId)
                          );
                          const safeRelatedUnit = relatedUnit
                            ? { ...relatedUnit, id: getVariantUnitId(relatedUnit) }
                            : null;
                          return (
                            <tr key={rule.id} className="border-t border-zinc-200 dark:border-white/10">
                              <td className="px-3 py-3">
                                {rule.appliesTo === "retail" ? "លក់រាយ"
                                  : rule.appliesTo === "wholesale" ? "លក់ដុំ"
                                  : rule.appliesTo === "both" ? "ទាំងពីរ"
                                  : rule.appliesTo}
                              </td>
                              <td className="px-3 py-3">{rule.unitName || safeRelatedUnit?.unitName || "-"}</td>
                              <td className="px-3 py-3">{rule.minQty}</td>
                              <td className="px-3 py-3">${Number(rule.usd || 0).toFixed(2)}</td>
                              <td className="px-3 py-3">{Number(rule.khr || 0).toLocaleString()}៛</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button type="button" disabled={!safeRelatedUnit}
                                    onClick={() => safeRelatedUnit && onEditPriceRule?.(variant, safeRelatedUnit, rule)}
                                    className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                                    កែ
                                  </button>
                                  <button type="button"
                                    onClick={() => onDeletePriceRule?.(rule)}
                                    className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600">
                                    លុប
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
