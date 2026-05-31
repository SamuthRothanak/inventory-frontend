import React, { useState } from "react";
import {
  FiBox,
  FiCheckCircle,
  FiDollarSign,
  FiHash,
  FiImage,
  FiInfo,
  FiLayers,
  FiPackage,
  FiPlus,
  FiSave,
  FiTag,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
import SearchableDropdown from "./SearchableDropdown";

const DEFAULT_EXCHANGE_RATE = 4000;
const makeLocalKey = (prefix) => `${prefix}_${Date.now()}_${Math.random()}`;

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

function onlyText(value) {
  return String(value || "").replace(/[0-9]/g, "");
}

function preventInvalidNumberKey(event, allowDecimal = true) {
  const invalidKeys = ["-", "+", "e", "E"];
  if (!allowDecimal) invalidKeys.push(".");
  if (invalidKeys.includes(event.key)) event.preventDefault();
}

function generateVariantCode(productName, index = 1) {
  const cleanName = String(productName || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const unique = Date.now().toString().slice(-5);
  return `PV-${cleanName}-${unique}-${index}`;
}

function roundUsd(value) {
  return Number(Number(value || 0).toFixed(2));
}

function roundKhr(value, mode = "ceil") {
  const amount = Number(value || 0);
  if (amount <= 0) return 0;
  switch (mode) {
    case "round": return Math.round(amount / 100) * 100;
    case "floor": return Math.floor(amount / 100) * 100;
    case "none":  return Number(amount.toFixed(2));
    default:      return Math.ceil(amount / 100) * 100;
  }
}

function convertPrice(inputPrice, inputCurrency, exchangeRate, khrMode = "ceil") {
  const price = Number(inputPrice || 0);
  const rate = Number(exchangeRate || DEFAULT_EXCHANGE_RATE);
  if (!price || !rate) return { unit_price_usd: 0, unit_price_khr: 0 };
  if (inputCurrency === "KHR") {
    return {
      unit_price_usd: roundUsd(price / rate),
      unit_price_khr: roundKhr(price, khrMode),
    };
  }
  return {
    unit_price_usd: roundUsd(price),
    unit_price_khr: roundKhr(price * rate, khrMode),
  };
}

function makeUnit(isFirst = false) {
  return {
    local_key: makeLocalKey("unit"),
    unit_id: "",
    conversion_qty: 1,
    is_base_unit: isFirst,
    is_default_sale_unit: isFirst,
    is_default_purchase_unit: false,
    status: true,
  };
}

function makePriceRule(unitLocalKey) {
  return {
    local_unit_key: unitLocalKey,
    applies_to: "retail",
    min_qty: 1,
    input_currency: "USD",
    input_price: "",
    unit_price_usd: 0,
    unit_price_khr: 0,
    status: "active",
  };
}

export default function VariantSetupFormModal({
  product,
  units = [],
  theme,
  activeExchangeRate = DEFAULT_EXCHANGE_RATE,
  activeKhrRounding = "ceil",
  isSaving = false,
  onClose,
  onSave,
}) {
  const initialUnitKey = React.useMemo(() => makeLocalKey("unit"), []);

  const [variantForm, setVariantForm] = useState({
    product_id: product?.id || "",
    variant_code: generateVariantCode(product?.name || product?.productName),
    variant_name: product?.name || product?.productName || "",
    package_type: "",
    color: "",
    size_value: "",
    size_unit: "",
    low_stock_threshold: 0,
    status: true,
    imageFile: null,
  });

  const [unitRows, setUnitRows] = useState([
    {
      local_key: initialUnitKey,
      unit_id: "",
      conversion_qty: 1,
      is_base_unit: true,
      is_default_sale_unit: true,
      is_default_purchase_unit: false,
      status: true,
    },
  ]);

  const [priceRules, setPriceRules] = useState([makePriceRule(initialUnitKey)]);
  const [formError, setFormError] = useState("");

  const selectedImage = variantForm.imageFile;

  const updateVariant = (field, value) => {
    setVariantForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateUnit = (unitIndex, field, value) => {
    setUnitRows((prev) =>
      prev.map((u, i) => (i === unitIndex ? { ...u, [field]: value } : u)),
    );
  };

  const addUnit = () => setUnitRows((prev) => [...prev, makeUnit(false)]);

  const removeUnit = (unitIndex) => {
    const unitKey = unitRows[unitIndex]?.local_key;
    setUnitRows((prev) => prev.filter((_, i) => i !== unitIndex));
    // លុប price rules របស់ unit នេះ ដែរ
    setPriceRules((prev) => prev.filter((r) => r.local_unit_key !== unitKey));
  };

  const addPriceForUnit = (unitLocalKey) => {
    setPriceRules((prev) => [...prev, makePriceRule(unitLocalKey)]);
  };

  const removePriceRule = (ruleIndex) => {
    setPriceRules((prev) => prev.filter((_, i) => i !== ruleIndex));
  };

  const updatePriceRule = (ruleIndex, field, value) => {
    setPriceRules((prev) =>
      prev.map((rule, i) => {
        if (i !== ruleIndex) return rule;
        const nextRule = { ...rule, [field]: value };
        const converted = convertPrice(
          field === "input_price" ? value : nextRule.input_price,
          field === "input_currency" ? value : nextRule.input_currency,
          activeExchangeRate,
          activeKhrRounding,
        );
        return {
          ...nextRule,
          unit_price_usd: converted.unit_price_usd,
          unit_price_khr: converted.unit_price_khr,
        };
      }),
    );
  };

  const unitLabel = (unit, index) => {
    const u = units.find((item) => String(item.id) === String(unit?.unit_id));
    const name = u?.unit_name || u?.unitName || u?.unit_code;
    return name ? `${name} (×${unit?.conversion_qty || 1})` : `Unit #${index + 1}`;
  };

  const validateForm = () => {
    if (!variantForm.variant_code.trim()) return "Variant code is required.";
    if (!variantForm.variant_name.trim()) return "Variant name is required.";
    if (!variantForm.package_type.trim()) return "Package type is required.";
    if (unitRows.length === 0) return "At least one unit is required.";
    for (const unit of unitRows) {
      if (!unit.unit_id) return "Each unit must select a Unit.";
      if (Number(unit.conversion_qty) <= 0)
        return "Conversion qty must be greater than 0.";
    }
    if (priceRules.length === 0) return "At least one price rule is required.";
    for (const rule of priceRules) {
      if (!rule.applies_to) return "Applies To is required.";
      if (Number(rule.min_qty) <= 0) return "Min qty must be greater than 0.";
      if (Number(rule.input_price) <= 0)
        return "Input price must be greater than 0.";
    }
    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    onSave?.({
      variant: {
        ...variantForm,
        product_id: product?.id || variantForm.product_id,
        low_stock_threshold: Number(variantForm.low_stock_threshold || 0),
        status: Boolean(variantForm.status),
      },
      units: unitRows.map((u) => ({
        local_key: u.local_key,
        unit_id: Number(u.unit_id),
        conversion_qty: Number(u.conversion_qty || 1),
        is_base_unit: Boolean(u.is_base_unit),
        is_default_sale_unit: Boolean(u.is_default_sale_unit),
        is_default_purchase_unit: Boolean(u.is_default_purchase_unit),
        status: Boolean(u.status),
      })),
      priceRules: priceRules.map((rule) => ({
        local_unit_key: rule.local_unit_key,
        applies_to: rule.applies_to,
        min_qty: Number(rule.min_qty || 1),
        input_currency: rule.input_currency,
        input_price: Number(rule.input_price || 0),
        status: rule.status || "active",
      })),
    });
  };

  return (
    <ModalShell
      title="Add Variant Setup"
      subtitle={`Product: ${
        product?.name || product?.productName || "-"
      } · Create variant, units, and price rules.`}
      theme={theme}
      onClose={onClose}
      width="max-w-6xl"
      footer={
        <>
          <button type="button" onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
            Cancel
          </button>
          <button type="submit" form="variant-setup-form" disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave />
            {isSaving ? "Saving..." : "Save Variant Setup"}
          </button>
        </>
      }
    >
      <form id="variant-setup-form" onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
            {formError}
          </div>
        )}

        <Section theme={theme} icon={<FiPackage />} title="1. Variant Information"
          subtitle="Example: Beer Can 330ml, Beer Bottle 330ml, Coca Cola Case.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Variant Code" required theme={theme} icon={<FiHash />}
              value={variantForm.variant_code} onChange={(v) => updateVariant("variant_code", v)}
              placeholder="PV-BEER-330ML-CAN" />
            <FormInput label="Variant Name" required theme={theme} icon={<FiPackage />}
              value={variantForm.variant_name} onChange={(v) => updateVariant("variant_name", v)}
              placeholder="Beer 330ml Can" />
            <FormInput label="Package Type" required theme={theme} icon={<FiBox />}
              value={variantForm.package_type} onChange={(v) => updateVariant("package_type", v)}
              placeholder="can, bottle, case, box" />
            <FormInput label="Color" sanitize="text" theme={theme} icon={<FiTag />}
              value={variantForm.color} onChange={(v) => updateVariant("color", v)} placeholder="red" />
            <FormInput label="Size Value" sanitize="number" allowDecimal={true} theme={theme} icon={<FiHash />}
              value={variantForm.size_value} onChange={(v) => updateVariant("size_value", v)} placeholder="330" />
            <FormInput label="Size Unit" sanitize="text" theme={theme} icon={<FiTag />}
              value={variantForm.size_unit} onChange={(v) => updateVariant("size_unit", v)} placeholder="ml" />
            <FormInput label="Low Stock Threshold" sanitize="number" allowDecimal={false} theme={theme} icon={<FiHash />}
              value={variantForm.low_stock_threshold} onChange={(v) => updateVariant("low_stock_threshold", v)} />
            <FormSelect label="Status" theme={theme}
              icon={variantForm.status ? <FiCheckCircle /> : <FiXCircle />}
              value={variantForm.status ? "1" : "0"}
              onChange={(v) => updateVariant("status", v === "1")}
              options={[{ value: "1", label: "Active" }, { value: "0", label: "Inactive" }]} />
          </div>
          <div className="mt-4">
            <ImageInput label="Variant Image" theme={theme} previewFile={selectedImage}
              onChange={(file) => updateVariant("imageFile", file)} />
          </div>
        </Section>

        <Section theme={theme} icon={<FiLayers />} title="2. Units & Prices"
          subtitle="Each unit (Can, Case...) has its own prices. Example: 1 Case = 24 Can.">
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={addUnit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
              <FiPlus />
              Add Unit Row
            </button>
          </div>

          <div className="space-y-4">
            {unitRows.map((unit, unitIndex) => {
              const rulesForUnit = priceRules
                .map((r, idx) => ({ r, idx }))
                .filter(({ r }) => r.local_unit_key === unit.local_key);

              return (
                <div key={unit.local_key} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold">{unitLabel(unit, unitIndex)}</p>
                    {unitRows.length > 1 && (
                      <button type="button" onClick={() => removeUnit(unitIndex)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white hover:bg-red-600">
                        <FiTrash2 />
                        Remove Unit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <SearchableDropdown label="Unit" required theme={theme} icon={<FiLayers />}
                      value={unit.unit_id}
                      onChange={(v) => updateUnit(unitIndex, "unit_id", v)}
                      placeholder="Select unit"
                      options={[
                        ...units.map((u) => ({
                          value: String(u.id),
                          label: u.unit_name || u.unitName || u.unit_code || `Unit #${u.id}`,
                        })),
                      ]} />
                    <FormInput label="Conversion Qty" required sanitize="number" allowDecimal={true} theme={theme} icon={<FiHash />}
                      value={unit.conversion_qty}
                      onChange={(v) => updateUnit(unitIndex, "conversion_qty", v)}
                      placeholder="1" />
                  </div>

                  <p className={`mb-2 mt-3 flex items-center gap-1.5 text-xs font-semibold ${theme.muted}`}>
                    <FiInfo /> Unit Options (tap to toggle)
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <CheckBoxCard label="Base Unit" helper="Smallest stock unit, e.g. Can"
                      checked={unit.is_base_unit}
                      onChange={(c) => updateUnit(unitIndex, "is_base_unit", c)} />
                    <CheckBoxCard label="Default Sale" helper="Default unit for selling"
                      checked={unit.is_default_sale_unit}
                      onChange={(c) => updateUnit(unitIndex, "is_default_sale_unit", c)} />
                    <CheckBoxCard label="Default Purchase" helper="Default unit for buying"
                      checked={unit.is_default_purchase_unit}
                      onChange={(c) => updateUnit(unitIndex, "is_default_purchase_unit", c)} />
                    <CheckBoxCard label="Active" helper="Can use this unit"
                      checked={unit.status}
                      onChange={(c) => updateUnit(unitIndex, "status", c)} />
                  </div>

                  {/* NESTED PRICES */}
                  <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-white/10">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold">Prices for {unitLabel(unit, unitIndex)}</p>
                      <button type="button" onClick={() => addPriceForUnit(unit.local_key)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600">
                        <FiPlus />
                        Add Price
                      </button>
                    </div>

                    {rulesForUnit.length === 0 && (
                      <p className={`rounded-lg border border-dashed px-3 py-3 text-center text-xs ${theme.muted}`}>
                        No price for this unit yet. Click "Add Price".
                      </p>
                    )}

                    <div className="space-y-3">
                      {rulesForUnit.map(({ r: rule, idx }) => (
                        <div key={idx} className={`rounded-lg border p-3 ${theme.section}`}>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <FormSelect label="Applies To" required theme={theme} icon={<FiTag />}
                              value={rule.applies_to}
                              onChange={(v) => updatePriceRule(idx, "applies_to", v)}
                              options={[
                                { value: "retail", label: "Retail" },
                                { value: "wholesale", label: "Wholesale" },
                                { value: "both", label: "Both" },
                              ]} />
                            <FormInput label="Min Qty" required sanitize="number" allowDecimal={false} theme={theme} icon={<FiHash />}
                              value={rule.min_qty}
                              onChange={(v) => updatePriceRule(idx, "min_qty", v)} />
                            <FormSelect label="Currency" required theme={theme} icon={<FiDollarSign />}
                              value={rule.input_currency}
                              onChange={(v) => updatePriceRule(idx, "input_currency", v)}
                              options={[
                                { value: "USD", label: "USD ($)" },
                                { value: "KHR", label: "KHR (៛)" },
                              ]} />
                            <FormInput
                              label={`Input ${rule.input_currency}`}
                              required sanitize="number" allowDecimal={true} theme={theme}
                              icon={rule.input_currency === "KHR"
                                ? <span className="text-base font-bold">៛</span>
                                : <FiDollarSign />}
                              value={rule.input_price}
                              onChange={(v) => updatePriceRule(idx, "input_price", v)}
                              placeholder={rule.input_currency === "KHR" ? "2000" : "0.50"} />
                            <PreviewBox theme={theme} label="USD (auto)"
                              value={`$${Number(rule.unit_price_usd || 0).toFixed(2)}`}
                              highlight={rule.input_currency !== "USD"} />
                            <PreviewBox theme={theme} label="KHR (auto)"
                              value={`${Number(rule.unit_price_khr || 0).toLocaleString()}៛`}
                              highlight={rule.input_currency !== "KHR"} />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className={`text-[11px] ${theme.muted}`}>
                              Rate: 1 USD = {Number(activeExchangeRate || 4000).toLocaleString()}៛ · {activeKhrRounding}
                            </p>
                            <button type="button" onClick={() => removePriceRule(idx)}
                              className="inline-flex h-7 items-center gap-1 rounded-lg bg-red-500 px-2.5 text-[11px] font-semibold text-white hover:bg-red-600">
                              <FiTrash2 />
                              Remove Price
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </form>
    </ModalShell>
  );
}

function Section({ theme, icon, title, subtitle, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {subtitle && <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function FormInput({
  label, required = false, type = "text", theme, icon, value, onChange,
  placeholder = "", sanitize = "none", allowDecimal = true,
}) {
  const isNumberInput = sanitize === "number" || type === "number";
  const isTextOnly = sanitize === "text";
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}
        <input
          type={isNumberInput ? "text" : type}
          inputMode={isNumberInput ? (allowDecimal ? "decimal" : "numeric") : undefined}
          min={isNumberInput ? 0 : undefined}
          value={value ?? ""}
          placeholder={placeholder}
          onKeyDown={(e) => { if (isNumberInput) preventInvalidNumberKey(e, allowDecimal); }}
          onPaste={(e) => {
            if (isNumberInput || isTextOnly) {
              e.preventDefault();
              const t = e.clipboardData.getData("text");
              onChange(isNumberInput ? onlyPositiveNumber(t, allowDecimal) : onlyText(t));
            }
          }}
          onChange={(e) => {
            let v = e.target.value;
            if (isNumberInput) v = onlyPositiveNumber(v, allowDecimal);
            if (isTextOnly) v = onlyText(v);
            onChange(v);
          }}
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>
    </label>
  );
}

function FormSelect({ label, required = false, theme, icon, value, onChange, options }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.select}`}>
          {options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </label>
  );
}

function ImageInput({ label, theme, previewFile, onChange }) {
  const inputId = `${label.replace(/\s+/g, "-").toLowerCase()}-input`;
  const fileName = previewFile instanceof File ? previewFile.name : "";
  const previewUrl = previewFile instanceof File ? URL.createObjectURL(previewFile) : "";
  const handleRemoveImage = () => {
    onChange(null);
    const fileInput = document.getElementById(inputId);
    if (fileInput) fileInput.value = "";
  };
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="rounded-2xl border border-dashed border-red-400/40 bg-red-500/[0.03] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
            {previewUrl ? <img src={previewUrl} alt="Selected variant" className="h-full w-full object-cover" /> : <FiImage className="text-3xl text-red-500" />}
          </div>
          <div className="min-w-0 flex-1">
            <input id={inputId} type="file" accept="image/*" className="hidden"
              onChange={(e) => onChange(e.target.files?.[0] || null)} />
            <div className="flex flex-wrap gap-2">
              <label htmlFor={inputId}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700">
                Choose Image
              </label>
              {previewUrl && (
                <button type="button" onClick={handleRemoveImage}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20">
                  Remove Image
                </button>
              )}
            </div>
            <p className={`mt-3 text-sm ${theme.muted}`}>PNG, JPG, JPEG up to your backend limit.</p>
            {fileName && <p className="mt-2 truncate text-xs font-semibold text-emerald-500">Selected: {fileName}</p>}
          </div>
        </div>
      </div>
    </label>
  );
}

function CheckBoxCard({ label, helper, checked, onChange }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition ${
      checked ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
    }`}>
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-emerald-500" />
      <span className="min-w-0">
        <span className="block text-xs font-bold">{label}</span>
        {helper && <span className="mt-0.5 block text-[11px] leading-4 opacity-75">{helper}</span>}
      </span>
    </label>
  );
}

function PreviewBox({ label, value, theme, highlight = false }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-emerald-500/40 bg-emerald-500/[0.06]" : theme.softCard}`}>
      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      <p className="mt-1.5 font-bold">{value}</p>
    </div>
  );
}