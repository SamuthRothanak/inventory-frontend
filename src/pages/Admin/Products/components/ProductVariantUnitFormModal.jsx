import React, { useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiHash, FiInfo, FiLayers, FiSave } from "react-icons/fi";

import ModalShell from "./ModalShell";
import SearchableDropdown from "./SearchableDropdown";
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

function getVariantUnitUnitId(item = {}) {
  return String(item.unitId || item.unit_id || item.unit?.id || "");
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
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productVariantUnitSchema),
    defaultValues: productVariantUnitDefaultValues,
  });

  const existingUnitIds = useMemo(() => {
    const currentUnitId = isEdit ? getVariantUnitUnitId(variantUnit) : "";
    return new Set(
      (variant?.units || [])
        .map(getVariantUnitUnitId)
        .filter((unitId) => unitId && unitId !== currentUnitId)
    );
  }, [isEdit, variant, variantUnit]);

  const unitOptions = useMemo(() => {
    return units.map((unit) => {
      const unitId = String(unit.id);
      const alreadyAdded = existingUnitIds.has(unitId);

      return {
        value: unitId,
        label: `${unit.unit_name || unit.unitName || unit.unit_code || unit.id}${alreadyAdded ? " (បានបន្ថែមហើយ)" : ""}`,
        disabled: alreadyAdded,
      };
    });
  }, [existingUnitIds, units]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    isInitialMount.current = true;
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
    const hasExistingUnits = (variant?.units || []).length > 0;
    reset({
      ...productVariantUnitDefaultValues,
      product_variant_id: String(variant?.id || ""),
      is_base_unit: !hasExistingUnits,
      is_default_sale_unit: !hasExistingUnits,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, variant?.id, variantUnit?.id, reset]);

  const conversionQty = watch("conversion_qty");

  useEffect(() => {
    if (isEdit) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const qty = Number(conversionQty || 1);
    if (qty === 1) {
      // smallest unit → base + sale
      setValue("is_base_unit", true);
      setValue("is_default_sale_unit", true);
      setValue("is_default_purchase_unit", false);
    } else {
      // larger unit → purchase unit
      setValue("is_base_unit", false);
      setValue("is_default_sale_unit", false);
      setValue("is_default_purchase_unit", true);
    }
  }, [conversionQty, isEdit, setValue]);

  const submitForm = (values) => {
    if (existingUnitIds.has(String(values.unit_id))) {
      setError("unit_id", {
        type: "manual",
        message: "ខ្នាតទំនិញនេះ បានបន្ថែមហើយ ។",
      });
      return;
    }

    onSave({ ...values, conversion_qty: Number(values.conversion_qty || 1) });
  };

  return (
    <ModalShell
      title={isEdit ? "កែខ្នាតទំនិញ" : "បន្ថែមខ្នាតទំនិញ"}
      subtitle={`មុខទំនិញ: ${variant?.variantName || "-"} · កំណត់ខ្នាតមូលដ្ឋាននិងការប្ដូរ ។`}
      theme={theme}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <>
          <button type="button" onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
            បោះបង់
          </button>
          <button type="submit" form="variant-unit-form" disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave />
            {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកខ្នាតទំនិញ"}
          </button>
        </>
      }
    >
      <form id="variant-unit-form" onSubmit={handleSubmit(submitForm)}
        className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
        <input type="hidden" {...register("product_variant_id")} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormSelect label="ខ្នាតទំនិញ" required error={errors.unit_id?.message} theme={theme} icon={<FiLayers />}
            value={watch("unit_id")}
            onChange={(value) => setValue("unit_id", value, { shouldValidate: true })}
            options={[
              { value: "", label: "ជ្រើសខ្នាតទំនិញ" },
              ...unitOptions,
            ]} />
          <FormInput label="ចំនួនបម្លែង" required sanitize="number" allowDecimal={true}
            error={errors.conversion_qty?.message} theme={theme} icon={<FiHash />}
            hint="ឧ. 1 Can = 1 · 1 Case = 24 Cans"
            inputProps={register("conversion_qty")} />
        </div>

        <p className={`mb-2 mt-5 flex items-center gap-1.5 text-xs font-semibold ${theme.muted}`}>
          <FiInfo /> ជម្រើសខ្នាតទំនិញ
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CheckRow label="ខ្នាតទំនិញស្តុក" helper="តាមដានស្តុកក្នុងខ្នាតទំនិញនេះ"
            checked={watch("is_base_unit")}
            onChange={(c) => setValue("is_base_unit", c, { shouldValidate: true })} />
          <CheckRow label="លក់ក្នុង POS" helper="ប្រើស្វ័យប្រវត្ដិពេលលក់ដល់អតិថិជន"
            checked={watch("is_default_sale_unit")}
            onChange={(c) => setValue("is_default_sale_unit", c, { shouldValidate: true })} />
          <CheckRow label="ទិញពីអ្នកផ្គត់ផ្គង់" helper="ប្រើស្វ័យប្រវត្ដិពេលបញ្ជាទិញស្តុក"
            checked={watch("is_default_purchase_unit")}
            onChange={(c) => setValue("is_default_purchase_unit", c, { shouldValidate: true })} />
          <CheckRow label="ដំណើរការ" helper="អាចប្រើខ្នាតទំនិញនេះ"
            checked={watch("status")}
            onChange={(c) => setValue("status", c, { shouldValidate: true })} />
        </div>

        <p className={`mt-4 text-xs ${theme.muted}`}>
          ឧ: ខ្នាតមូលដ្ឋាន = Can (ប្ដូរ=1) ។ Case = 24 Cans (ប្ដូរ=24) ។ Case ជាខ្នាតទំនិញ មិនមែនជាមុខទំនិញផ្សេង ។
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
  type = "text", sanitize = "none", allowDecimal = true, hint,
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
      {hint && <p className={`mt-1 text-xs ${theme.muted}`}>{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormSelect({ label, required = false, error = "", theme, icon, value, onChange, options }) {
  return (
    <SearchableDropdown
      label={label}
      required={required}
      error={error}
      theme={theme}
      icon={icon}
      value={value}
      onChange={onChange}
      options={options}
      searchable={options.length > 6}
    />
  );
}
