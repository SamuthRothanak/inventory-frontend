import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiHash, FiInfo, FiLayers, FiSave } from "react-icons/fi";

import ModalShell from "./ModalShell";
import {
  productVariantUnitDefaultValues,
  productVariantUnitSchema,
} from "../schemas/productVariantUnit.schema";

function onlyPositiveNumber(value, allowDecimal = true) {
  let nextValue = String(value || "");
  nextValue = nextValue.replace(/-/g, "").replace(/\+/g, "").replace(/e/gi, "");
  if (allowDecimal) {
    nextValue = nextValue.replace(/[^0-9.]/g, "");
    const parts = nextValue.split(".");
    if (parts.length > 2) nextValue = `${parts[0]}.${parts.slice(1).join("")}`;
    return nextValue;
  }
  return nextValue.replace(/[^0-9]/g, "");
}

function preventInvalidNumberKey(event, allowDecimal = true) {
  const invalidKeys = ["-", "+", "e", "E"];
  if (!allowDecimal) invalidKeys.push(".");
  if (invalidKeys.includes(event.key)) event.preventDefault();
}

export default function ProductVariantUnitFormModal({
  mode,
  variant,
  variantUnit,
  units,
  theme,
  isSaving,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productVariantUnitSchema),
    defaultValues: productVariantUnitDefaultValues,
  });

  useEffect(() => {
    if (isEdit && variantUnit) {
      reset({
        product_variant_id: String(variantUnit.productVariantId || variant?.id || ""),
        unit_id: String(variantUnit.unitId || ""),
        conversion_qty: Number(variantUnit.conversionQty || 1),
        is_base_unit: Boolean(variantUnit.isBaseUnit),
        is_default_sale_unit: Boolean(variantUnit.isDefaultSaleUnit),
        is_default_purchase_unit: Boolean(variantUnit.isDefaultPurchaseUnit),
        status: true,
      });
      return;
    }
    reset({
      ...productVariantUnitDefaultValues,
      product_variant_id: String(variant?.id || ""),
    });
  }, [isEdit, variant, variantUnit, reset]);

  const submitForm = (values) => {
    onSave({ ...values, conversion_qty: Number(values.conversion_qty || 1) });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Variant Unit" : "Add Variant Unit"}
      subtitle={`Variant: ${variant?.variantName || "-"} · Define base unit and conversion.`}
      theme={theme}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <>
          <button type="button" onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
            Cancel
          </button>
          <button type="submit" form="variant-unit-form" disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave />
            {isSaving ? "Saving..." : "Save Unit"}
          </button>
        </>
      }
    >
      <form id="variant-unit-form" onSubmit={handleSubmit(submitForm)}
        className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
        <input type="hidden" {...register("product_variant_id")} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormSelect label="Unit" required error={errors.unit_id?.message} theme={theme} icon={<FiLayers />}
            inputProps={register("unit_id")}
            options={[
              { value: "", label: "Select unit" },
              ...units.map((u) => ({
                value: String(u.id),
                label: `${u.unit_name || u.unitName || u.unit_code || u.id}`,
              })),
            ]} />
          <FormInput label="Conversion Qty" required sanitize="number" allowDecimal={true}
            error={errors.conversion_qty?.message} theme={theme} icon={<FiHash />}
            inputProps={register("conversion_qty")} />
        </div>

        <p className={`mb-2 mt-5 flex items-center gap-1.5 text-xs font-semibold ${theme.muted}`}>
          <FiInfo /> Unit Options (tap to toggle)
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CheckRow label="Base Unit" helper="Smallest stock unit, e.g. Can"
            checked={watch("is_base_unit")}
            onChange={(c) => setValue("is_base_unit", c, { shouldValidate: true })} />
          <CheckRow label="Default Sale Unit" helper="Default unit for selling"
            checked={watch("is_default_sale_unit")}
            onChange={(c) => setValue("is_default_sale_unit", c, { shouldValidate: true })} />
          <CheckRow label="Default Purchase Unit" helper="Default unit for buying"
            checked={watch("is_default_purchase_unit")}
            onChange={(c) => setValue("is_default_purchase_unit", c, { shouldValidate: true })} />
          <CheckRow label="Active" helper="Can use this unit"
            checked={watch("status")}
            onChange={(c) => setValue("status", c, { shouldValidate: true })} />
        </div>

        <p className={`mt-4 text-xs ${theme.muted}`}>
          Example: Base Unit = Can, Case conversion = 24. Meaning 1 Case = 24 Cans.
        </p>
      </form>
    </ModalShell>
  );
}

function CheckRow({ label, helper, checked, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
        checked
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
      }`}
    >
      <input type="checkbox" checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-emerald-500" />
      <span className="min-w-0">
        <span className="block text-xs font-bold">{label}</span>
        {helper && <span className="mt-0.5 block text-[11px] leading-4 opacity-75">{helper}</span>}
      </span>
    </label>
  );
}

function FormInput({
  label, required = false, error = "", theme, icon, inputProps,
  type = "text", sanitize = "none", allowDecimal = true,
}) {
  const isNumberInput = sanitize === "number" || type === "number";
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div className="relative">
        {icon && (
          <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>
            {icon}
          </span>
        )}
        <input
          type={isNumberInput ? "text" : type}
          inputMode={isNumberInput ? (allowDecimal ? "decimal" : "numeric") : undefined}
          min={isNumberInput ? 0 : undefined}
          {...inputProps}
          onKeyDown={(e) => { if (isNumberInput) preventInvalidNumberKey(e, allowDecimal); inputProps?.onKeyDown?.(e); }}
          onPaste={(e) => {
            if (isNumberInput) {
              e.preventDefault();
              const t = e.clipboardData.getData("text");
              const cleaned = onlyPositiveNumber(t, allowDecimal);
              e.currentTarget.value = cleaned;
              inputProps?.onChange?.({ target: { name: inputProps.name, value: cleaned } });
              return;
            }
            inputProps?.onPaste?.(e);
          }}
          onChange={(e) => {
            let v = e.target.value;
            if (isNumberInput) v = onlyPositiveNumber(v, allowDecimal);
            e.target.value = v;
            inputProps?.onChange?.(e);
          }}
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormSelect({ label, required = false, error = "", theme, icon, inputProps, options }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div className="relative">
        {icon && (
          <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>
            {icon}
          </span>
        )}
        <select {...inputProps}
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}>
          {options.map((o) => (
            <option key={String(o.value)} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}