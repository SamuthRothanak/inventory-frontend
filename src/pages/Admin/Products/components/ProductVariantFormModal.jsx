import React, { useEffect, useRef, useState } from "react";
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
import { CreatableOptionSelect, SizeUnitSelect } from "./SizeUnitSelect";
import {
  QuickCreateUnitBox,
  generateUnitCode,
  findMatchingUnit,
  detectUnitType,
} from "./ProductSetupFormModal";

const DEFAULT_EXCHANGE_RATE = 0;
const makeLocalKey = (prefix) => `${prefix}_${Date.now()}_${Math.random()}`;

const PACKAGE_TYPES = [
  "ដុំ", "កញ្ចប់", "កញ្ចប់តូច", "ថង់", "ប្រអប់",
  "កេស", "កាតុង", "កំប៉ុង", "ដប", "ដុំរមូរ",
  "ថាស", "ឡូ", "គីឡូក្រាម", "ក្រាម", "លីត្រ", "មីលីលីត្រ",
];

function onlyPositiveNumber(value, allowDecimal = true, maxDecimals = 2) {
  let nextValue = String(value || "")
    .replace(/-/g, "")
    .replace(/\+/g, "")
    .replace(/e/gi, "");

  if (!allowDecimal) {
    return nextValue.replace(/[^0-9]/g, "");
  }

  nextValue = nextValue.replace(/[^0-9.]/g, "");
  const firstDotIndex = nextValue.indexOf(".");
  if (firstDotIndex === -1) return nextValue;

  const integerPart = nextValue.slice(0, firstDotIndex) || "0";
  const decimalPart = nextValue
    .slice(firstDotIndex + 1)
    .replace(/\./g, "")
    .slice(0, maxDecimals);

  return `${integerPart}.${decimalPart}`;
}

function onlyText(value) {
  return String(value || "").replace(/[0-9]/g, "");
}

function cleanNamePart(value) {
  return String(value || "")
    .replace(/\.{2,}/g, ".")
    .replace(/[\s\u00A0\u1680\u180E\u2000-\u200D\u202F\u205F\u3000]+/g, " ");
}

function preventInvalidNumberKey(event, allowDecimal = true) {
  const invalidKeys = ["-", "+", "e", "E"];
  if (!allowDecimal) invalidKeys.push(".");
  if (allowDecimal && event.key === "." && event.currentTarget.value.includes(".")) {
    event.preventDefault();
    return;
  }
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

function buildAutoVariantName(productName, sizeValue, sizeUnit, packageType) {
  const baseName = String(productName || "").trim();
  const size = String(sizeValue || "").trim();
  const unit = String(sizeUnit || "").trim();
  const type = String(packageType || "").trim();
  const suffix = [size ? `${size}${unit}` : "", type].filter(Boolean).join(" ");
  return [baseName, suffix].filter(Boolean).join(" ").trim();
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

function khrRoundingLabel(value) {
  const labels = {
    ceil: "បង្គត់ឡើង",
    round: "បង្គត់ជិតបំផុត",
    floor: "បង្គត់ចុះ",
    none: "តម្លៃពិត (មិនបង្គត់)",
  };
  return labels[value] || labels.ceil;
}

function convertPrice(inputPrice, inputCurrency, exchangeRate, khrMode = "ceil") {
  const price = Number(inputPrice || 0);
  const rate = Number(exchangeRate || 0);
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
    barcode: "",
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
  mode = "add",
  product,
  variant = null,
  units = [],
  theme,
  activeExchangeRate = DEFAULT_EXCHANGE_RATE,
  activeKhrRounding = "ceil",
  isSaving = false,
  onClose,
  onSave,
  isCreatingUnit,
  isUpdatingUnit,
  isDeletingUnit,
  onCreateUnit,
  onUpdateUnit,
  onDeleteUnit,
}) {
  const isEdit = mode === "edit";
  const initialUnitKey = React.useMemo(() => makeLocalKey("unit"), []);

  // "Create matching unit" nudge for a package_type with no unit of the same name yet — same
  // QuickCreateUnitBox + local state pattern already used by ProductManageModal.jsx, so a
  // brand-new unit created here shows up there (and vice versa) via the shared `units` query.
  const [quickUnitOpen, setQuickUnitOpen] = useState(false);
  const [quickUnit, setQuickUnit] = useState({
    unit_code: "",
    unit_name: "",
    unit_type: "piece",
    allow_decimal: false,
    status: "active",
  });
  const quickUnitBoxRef = useRef(null);
  useEffect(() => {
    if (quickUnitOpen) {
      quickUnitBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [quickUnitOpen]);

  const makeVariantForm = (sourceVariant = null) => ({
    product_id: product?.id || sourceVariant?.productId || sourceVariant?.product_id || "",
    variant_code: sourceVariant?.variantCode || sourceVariant?.variant_code || generateVariantCode(product?.name || product?.productName),
    variant_name: sourceVariant?.variantName || sourceVariant?.variant_name || product?.name || product?.productName || "",
    package_type: sourceVariant?.packageType || sourceVariant?.package_type || "",
    color: sourceVariant?.color || "",
    size_value: sourceVariant?.sizeValue || sourceVariant?.size_value || "",
    size_unit: sourceVariant?.sizeUnit || sourceVariant?.size_unit || "",
    low_stock_threshold: sourceVariant?.lowStockThreshold ?? sourceVariant?.low_stock_threshold ?? 0,
    status:
      sourceVariant?.status === undefined
        ? true
        : sourceVariant.status === true ||
          sourceVariant.status === "active" ||
          sourceVariant.status === 1 ||
          sourceVariant.status === "1",
    imageFile: sourceVariant?.imagePath || null,
  });

  const [variantForm, setVariantForm] = useState(() =>
    makeVariantForm(isEdit ? variant : null)
  );
  const [isAutoName, setIsAutoName] = useState(!isEdit);

  const [unitRows, setUnitRows] = useState([
    {
      local_key: initialUnitKey,
      unit_id: "",
      conversion_qty: 1,
      barcode: "",
      is_base_unit: true,
      is_default_sale_unit: true,
      is_default_purchase_unit: false,
      status: true,
    },
  ]);

  const [thresholdUnitKey, setThresholdUnitKey] = useState(null);
  const prevLargestKeyRef = useRef(null);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    const largest = unitRows
      .filter(r => !r.is_base_unit && Number(r.conversion_qty) > 1 && r.unit_id)
      .sort((a, b) => Number(b.conversion_qty) - Number(a.conversion_qty))[0];
    const newKey = largest ? largest.local_key : null;
    if (newKey !== prevLargestKeyRef.current) {
      prevLargestKeyRef.current = newKey;
      setThresholdUnitKey(newKey);
      if (newKey !== null && !isFirstRunRef.current) {
        setVariantForm((prev) => ({ ...prev, low_stock_threshold: 0 }));
      }
    }
    isFirstRunRef.current = false;
  }, [unitRows]);

  const [priceRules, setPriceRules] = useState([makePriceRule(initialUnitKey)]);
  const [formError, setFormError] = useState("");

  const selectedImage = variantForm.imageFile;

  const variantId = variant?.id ?? null;
  useEffect(() => {
    setVariantForm(makeVariantForm(isEdit ? variant : null));
    setIsAutoName(!isEdit);
    setThresholdUnitKey(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, variantId]);

  const productName = product?.name || product?.productName || "";

  const variantNameSuffix = (() => {
    const prefix = productName + " ";
    if (variantForm.variant_name.startsWith(prefix)) return variantForm.variant_name.slice(prefix.length);
    if (variantForm.variant_name.trim() === productName.trim()) return "";
    return variantForm.variant_name;
  })();

  useEffect(() => {
    if (!isAutoName) return;

    setVariantForm((prev) => ({
      ...prev,
      product_id: product?.id || prev.product_id,
      variant_name: buildAutoVariantName(
        productName,
        prev.size_value,
        prev.size_unit,
        prev.package_type,
      ),
    }));
  }, [
    isAutoName,
    product?.id,
    productName,
    variantForm.package_type,
    variantForm.size_unit,
    variantForm.size_value,
  ]);

  const updateVariant = (field, value) => {
    setVariantForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariantNameChange = (value) => {
    setIsAutoName(false);
    updateVariant("variant_name", value);
  };

  const resetAutoVariantName = () => {
    setIsAutoName(true);
    setVariantForm((prev) => ({
      ...prev,
      variant_name: buildAutoVariantName(
        productName,
        prev.size_value,
        prev.size_unit,
        prev.package_type,
      ),
    }));
  };

  const updateUnit = (unitIndex, field, value) => {
    setUnitRows((prev) =>
      prev.map((u, i) => (i === unitIndex ? { ...u, [field]: value } : u)),
    );
    if (field === "conversion_qty") {
      const qty = Number(value || 0);
      const currentThreshold = Number(variantForm.low_stock_threshold || 0);
      if (qty > 1 && currentThreshold === 0) {
        setVariantForm((prev) => ({ ...prev, low_stock_threshold: qty }));
      }
    }
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
    const display = unitDisplay(unit, index);
    return `${display.name} (×${display.qty})`;
  };

  const unitDisplay = (unit, index) => {
    const u = units.find((item) => String(item.id) === String(unit?.unit_id));
    const name = u?.unit_name || u?.unitName || u?.unit_code;
    return {
      name: name || `ខ្នាតទំនិញ #${index + 1}`,
      qty: Number(unit?.conversion_qty || 1),
    };
  };

  const validateForm = () => {
    if (!variantForm.variant_code.trim()) return "សូមបំពេញលេខកូដមុខទំនិញ ។";
    if (!variantForm.variant_name.trim()) return "សូមបំពេញឈ្មោះមុខទំនិញ ។";
    if (!variantForm.package_type.trim()) return "សូមជ្រើសសណ្ឋានទំនិញ ។";
    if (isEdit) return "";
    if (unitRows.length === 0) return "ត្រូវការខ្នាតទំនិញ យ៉ាងតិច ១ ។";
    for (const unit of unitRows) {
      if (!unit.unit_id) return "សូមជ្រើសរើសខ្នាតទំនិញ ។";
      if (Number(unit.conversion_qty) <= 0)
        return "ចំនួនក្នុងមួយខ្នាត ត្រូវ > 0 ។";
    }
    if (priceRules.length === 0) return "ត្រូវការតម្លៃ យ៉ាងតិច ១ ។";
    for (const rule of priceRules) {
      if (!rule.applies_to) return "សូមជ្រើស ប្រើសម្រាប់ ។";
      if (Number(rule.min_qty) <= 0) return "លក់ចាប់ពីចំនួន ត្រូវ > 0 ។";
      if (Number(rule.input_price) <= 0)
        return "សូមបំពេញតម្លៃ ។";
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
    if (isEdit) {
      onSave?.({
        ...variantForm,
        product_id: product?.id || variantForm.product_id,
        low_stock_threshold: Number(variantForm.low_stock_threshold || 0),
        status: Boolean(variantForm.status),
      });
      return;
    }

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
        barcode: u.barcode || "",
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
      mobileFullScreen
      title={isEdit ? "កែមុខទំនិញ" : "បន្ថែមមុខទំនិញ"}
      subtitle={`ផលិតផល: ${product?.name || product?.productName || "-"}`}
      theme={theme}
      onClose={onClose}
      width="max-w-6xl"
      footer={
        <>
          <button type="button" onClick={onClose}
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
            បោះបង់
          </button>
          <button type="submit" form="variant-setup-form" disabled={isSaving}
            className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave />
            {isSaving ? "កំពុងរក្សាទុក..." : isEdit ? "រក្សាទុកមុខទំនិញ" : "រក្សាទុកមុខទំនិញ"}
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

        {!isEdit && Number(activeExchangeRate || 0) <= 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm font-semibold text-amber-500">
            គ្មានអត្រាប្ដូររូបិយប័ណ្ណ ។ សូមបង្កើតនិងធ្វើឲ្យសកម្មមុនពេលរក្សាទុកតម្លៃ ។
          </div>
        )}

        <Section theme={theme} icon={<FiPackage />} title="១. ព័ត៌មានមុខទំនិញ">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-2 flex h-7 items-center text-xs font-semibold ${theme.muted}`}>
                លេខកូដមុខទំនិញ <span className="ml-1 text-red-400">*</span>
              </label>
              <div className="relative">
                <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}><FiHash /></span>
                <input
                  value={variantForm.variant_code}
                  readOnly
                  aria-readonly="true"
                  placeholder="PV-BEER-330ML-CAN"
                  className={`h-11 w-full cursor-default rounded-xl border pl-10 pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} opacity-70`}
                />
              </div>
              <div className="min-h-[1.375rem]">
                <p className={`mt-1.5 text-xs ${theme.muted}`}>
                  លេខកូដបង្កើតស្វ័យប្រវត្តិ។
                </p>
              </div>
            </div>
            <div>
              <div className="mb-2 flex h-7 items-center justify-between gap-3">
                <label className={`block text-xs font-semibold ${theme.muted}`}>
                  ឈ្មោះមុខទំនិញ <span className="ml-1 text-red-400">*</span>
                </label>
                {isAutoName ? (
                  <button
                    type="button"
                    onClick={() => setIsAutoName(false)}
                    className="inline-flex h-7 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 text-[11px] font-bold text-emerald-600 transition hover:bg-emerald-500/15 dark:text-emerald-400"
                  >
                    ស្វ័យប្រវត្តិ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetAutoVariantName}
                    className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-bold transition ${theme.muted} hover:border-emerald-500/40 hover:text-emerald-500`}
                  >
                    ↺ ស្វ័យប្រវត្តិ
                  </button>
                )}
              </div>
              <div className={`flex h-11 overflow-hidden rounded-xl border transition focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20 border-zinc-200 dark:border-white/10`}>
                {productName && (
                  <span className="flex shrink-0 items-center border-r border-zinc-200 bg-zinc-100 px-3 text-xs font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/10 dark:text-zinc-400">
                    {productName}
                  </span>
                )}
                <input
                  placeholder={isAutoName ? "បំពេញសណ្ឋានទំនិញ & ទំហំ" : "ឧ. Can 330ml"}
                  value={variantNameSuffix}
                  readOnly={isAutoName}
                  onChange={(e) => {
                    const suffix = cleanNamePart(e.target.value);
                    handleVariantNameChange(productName ? (suffix ? `${productName} ${suffix}` : productName) : suffix);
                  }}
                  className={`min-w-0 flex-1 bg-transparent px-3 text-sm outline-none ${isAutoName ? "cursor-default text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}
                />
              </div>
              <div className="min-h-[1.375rem]">
                <p className={`mt-1.5 text-xs ${theme.muted}`}>
                  {isAutoName ? "ឈ្មោះបង្កើតស្វ័យប្រវត្តិពី សណ្ឋានទំនិញ និង ទំហំ។" : "កំពុងកែដោយខ្លួនឯង។ ចុច ↺ ស្វ័យប្រវត្តិ ដើម្បីបង្កើតវិញ។"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-white/10">
            <div className="mb-4">
              <h5 className="text-sm font-bold">ព័ត៌មានលម្អិតបន្ថែម</h5>
              <p className={`mt-0.5 text-xs ${theme.muted}`}>សណ្ឋាន ទំហំ ពណ៌ និងរូបភាពសម្រាប់មុខទំនិញនេះ។</p>
            </div>
            <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
            <div>
              <PackageTypeCombobox
                label="សណ្ឋានទំនិញ"
                required
                theme={theme}
                value={variantForm.package_type}
                onChange={(v) => updateVariant("package_type", v)}
              />
              {variantForm.package_type &&
                !findMatchingUnit(units, variantForm.package_type) &&
                !(quickUnitOpen && quickUnit.unit_name.trim().toLowerCase() === variantForm.package_type.trim().toLowerCase()) && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <span>&quot;{variantForm.package_type}&quot; មិនទាន់ជាខ្នាតទំនិញនៅឡើយ</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickUnit({
                        unit_code: generateUnitCode(variantForm.package_type),
                        unit_name: variantForm.package_type,
                        unit_type: detectUnitType(variantForm.package_type),
                        allow_decimal: false,
                        status: "active",
                      });
                      setQuickUnitOpen(true);
                    }}
                    className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-amber-600"
                  >
                    បង្កើតជាខ្នាតទំនិញ
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
                ទំហំ <span className="font-normal">(ស្រេចចិត្ត)</span>
              </label>
              <div className="flex h-11 overflow-visible rounded-xl border border-zinc-200 bg-white transition focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="relative min-w-0 flex-1">
                  <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}><FiHash /></span>
                  <input
                    value={variantForm.size_value}
                    inputMode="decimal"
                    onKeyDown={(e) => preventInvalidNumberKey(e, true)}
                    onPaste={(e) => {
                      e.preventDefault();
                      updateVariant("size_value", onlyPositiveNumber(e.clipboardData.getData("text"), true));
                    }}
                    onChange={(e) => updateVariant("size_value", onlyPositiveNumber(e.target.value, true))}
                    placeholder="330"
                    className="h-full w-full bg-transparent pl-10 pr-3 text-sm outline-none" />
                </div>
                <SizeUnitSelect value={variantForm.size_unit} onChange={(v) => updateVariant("size_unit", v)} theme={theme} embedded />
              </div>
            </div>
            <div>
              <FormInput label="ពណ៌ (ស្រេចចិត្ត)" sanitize="text" theme={theme} icon={<FiTag />}
                value={variantForm.color} onChange={(v) => updateVariant("color", v)} placeholder="ក្រហម" />
            </div>
            <FormSelect label="ស្ថានភាព" theme={theme}
              icon={variantForm.status ? <FiCheckCircle /> : <FiXCircle />}
              value={variantForm.status ? "1" : "0"}
              onChange={(v) => updateVariant("status", v === "1")}
              options={[{ value: "1", label: "ដំណើរការ" }, { value: "0", label: "មិនដំណើរការ" }]} />
            {isEdit && (() => {
              const variantUnits = Array.isArray(variant?.units) ? variant.units : [];
              const stored = Number(variantForm.low_stock_threshold || 0);
              const hasMultipleUnits = variantUnits.length > 1;
              const baseUnit = variantUnits.find((unit) => unit.isBaseUnit || unit.is_base_unit) || variantUnits[0];
              const largestNonBase = variantUnits
                .filter((unit) => !(unit.isBaseUnit || unit.is_base_unit) && Number(unit.conversionQty ?? unit.conversion_qty ?? 1) > 1)
                .sort((a, b) => Number(b.conversionQty ?? b.conversion_qty ?? 1) - Number(a.conversionQty ?? a.conversion_qty ?? 1))[0];
              const defaultUnit = largestNonBase || baseUnit;
              const selectedKey = thresholdUnitKey || String(defaultUnit?.productVariantUnitId ?? defaultUnit?.product_variant_unit_id ?? defaultUnit?.id ?? "");
              const selectedUnit = variantUnits.find((unit) => String(unit.productVariantUnitId ?? unit.product_variant_unit_id ?? unit.id) === String(selectedKey)) || defaultUnit;
              const convQty = Number(selectedUnit?.conversionQty ?? selectedUnit?.conversion_qty ?? 1);
              const displayVal = convQty > 1 ? stored / convQty : stored;
              const displayStr = stored === 0 ? "" : (Number.isInteger(displayVal) ? String(displayVal) : displayVal.toFixed(2));
              const unitName = selectedUnit?.unitName || selectedUnit?.unit_name || selectedUnit?.unitCode || selectedUnit?.unit_code || "ខ្នាត";
              const baseName = baseUnit?.unitName || baseUnit?.unit_name || baseUnit?.unitCode || baseUnit?.unit_code || "ខ្នាតមូលដ្ឋាន";
              const unitOptions = variantUnits.map((unit, index) => {
                const key = String(unit.productVariantUnitId ?? unit.product_variant_unit_id ?? unit.id ?? index);
                const name = unit.unitName || unit.unit_name || unit.unitCode || unit.unit_code || "ខ្នាត";
                const qty = Number(unit.conversionQty ?? unit.conversion_qty ?? 1);
                return { value: key, label: `${name} (×${qty})` };
              });

              return (
                <div>
                  <div className={hasMultipleUnits ? "flex items-end gap-2" : ""}>
                    <div className={hasMultipleUnits ? "min-w-0 flex-1" : ""}>
                      <FormInput
                        label="ជូនដំណឹងស្តុក"
                        sanitize="number"
                        allowDecimal={true}
                        theme={theme}
                        icon={<FiHash />}
                        value={displayStr}
                        onChange={(v) => {
                          const newStored = Math.round(Number(v || 0) * convQty);
                          updateVariant("low_stock_threshold", newStored || 0);
                        }}
                        placeholder="0"
                      />
                    </div>
                    {hasMultipleUnits && (
                      <div className="w-40 shrink-0">
                        <FormSelect
                          label="ខ្នាត"
                          theme={theme}
                          value={selectedKey}
                          onChange={(v) => setThresholdUnitKey(v)}
                          options={unitOptions}
                        />
                      </div>
                    )}
                  </div>
                  {convQty > 1 && displayStr && (
                    <p className={`mt-1.5 text-xs ${theme.muted}`}>
                      = {Number(variantForm.low_stock_threshold || 0).toLocaleString()} {baseName}
                    </p>
                  )}
                  <p className={`mt-1 text-xs ${theme.muted}`}>
                    កំណត់ជូនដំណឹងតាម {unitName}{convQty > 1 ? ` (×${convQty})` : ""}។
                  </p>
                </div>
              );
            })()}
            <div>
              <ImageInput label="រូបភាពមុខទំនិញ" theme={theme} previewFile={selectedImage}
                onChange={(file) => updateVariant("imageFile", file)} />
            </div>
            </div>
          </div>
        </Section>

        {quickUnitOpen && (
          <div ref={quickUnitBoxRef}>
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
              onCreated={() => {
                setQuickUnit({ unit_code: "", unit_name: "", unit_type: "piece", allow_decimal: false, status: "active" });
                setQuickUnitOpen(false);
              }}
            />
          </div>
        )}

        {!isEdit && (
        <Section theme={theme} icon={<FiLayers />} title="២. ខ្នាតទំនិញ & តម្លៃ">
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={addUnit}
              className="quick-action-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600">
              <FiPlus />
              បន្ថែមខ្នាតទំនិញ
            </button>
          </div>

          <div className="space-y-4">
            {unitRows.map((unit, unitIndex) => {
              const rulesForUnit = priceRules
                .map((r, idx) => ({ r, idx }))
                .filter(({ r }) => r.local_unit_key === unit.local_key);
              const display = unitDisplay(unit, unitIndex);

              return (
                <div
                  key={unit.local_key}
                  className={`rounded-2xl border p-4 shadow-sm ${
                    unitIndex % 2 === 0
                      ? "border-emerald-200 bg-emerald-50/35 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]"
                      : "border-sky-200 bg-sky-50/35 dark:border-sky-500/20 dark:bg-sky-500/[0.06]"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between rounded-xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold">
                        <span>{display.name}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                          x{display.qty}
                        </span>
                      </p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        1 {display.name} មាន {display.qty} ចំនួន
                      </p>
                    </div>
                    {unitRows.length > 1 && (
                      <button type="button" onClick={() => removeUnit(unitIndex)}
                        className="quick-action-icon-3d inline-flex h-8 items-center gap-1 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600">
                        <FiTrash2 />
                        លុបខ្នាតទំនិញ
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                    <SearchableDropdown label="ខ្នាតទំនិញ" required theme={theme} icon={<FiLayers />}
                      value={unit.unit_id}
                      onChange={(v) => updateUnit(unitIndex, "unit_id", v)}
                      placeholder="ជ្រើសខ្នាតទំនិញ"
                      options={[
                        ...units.map((u) => ({
                          value: String(u.id),
                          label: u.unit_name || u.unitName || u.unit_code || `ខ្នាតទំនិញ #${u.id}`,
                        })),
                      ]} />
                    <FormInput label="ចំនួនក្នុងមួយខ្នាត" required sanitize="number" allowDecimal={true} theme={theme} icon={<FiHash />}
                      value={unit.conversion_qty}
                      onChange={(v) => updateUnit(unitIndex, "conversion_qty", v)}
                      placeholder="1"
                      hint="ឧ. កេសមួយមាន 24 កំប៉ុង/ដប" />
                    <FormInput label="បាកូដ (Barcode)" theme={theme} icon={<FiHash />}
                      value={unit.barcode}
                      onChange={(v) => updateUnit(unitIndex, "barcode", v)}
                      placeholder="ស្កេន ឬវាយបញ្ចូលបាកូដ"
                      hint="ស្រេចចិត្ត — ខ្នាតនីមួយៗអាចមាន barcode ខុសគ្នា" />
                  </div>

                  <p className={`mb-2 mt-3 flex items-center gap-1.5 text-xs font-semibold ${theme.muted}`}>
                    <FiInfo /> ជម្រើសខ្នាតទំនិញ
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <CheckBoxCard label="ខ្នាតទំនិញស្តុក" helper="តាមដានស្តុកក្នុងខ្នាតទំនិញនេះ"
                      checked={unit.is_base_unit}
                      onChange={(c) => updateUnit(unitIndex, "is_base_unit", c)} />
                    <CheckBoxCard label="លក់ក្នុង POS" helper="ប្រើស្វ័យប្រវត្ដិពេលលក់ដល់អតិថិជន"
                      checked={unit.is_default_sale_unit}
                      onChange={(c) => updateUnit(unitIndex, "is_default_sale_unit", c)} />
                    <CheckBoxCard label="ទិញពីអ្នកផ្គត់ផ្គង់" helper="ប្រើស្វ័យប្រវត្ដិពេលបញ្ជាទិញស្តុក"
                      checked={unit.is_default_purchase_unit}
                      onChange={(c) => updateUnit(unitIndex, "is_default_purchase_unit", c)} />
                    <CheckBoxCard label="ដំណើរការ" helper="អាចប្រើខ្នាតទំនិញនេះ"
                      checked={unit.status}
                      onChange={(c) => updateUnit(unitIndex, "status", c)} />
                  </div>

                  {/* NESTED PRICES */}
                  <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-white/10">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold">តម្លៃសម្រាប់ {unitLabel(unit, unitIndex)}</p>
                      <button type="button" onClick={() => addPriceForUnit(unit.local_key)}
                        className="quick-action-icon-3d inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600">
                        <FiPlus />
                        បន្ថែមតម្លៃ
                      </button>
                    </div>

                    {rulesForUnit.length === 0 && (
                      <p className={`rounded-lg border border-dashed px-3 py-3 text-center text-xs ${theme.muted}`}>
                        គ្មានតម្លៃ ។ ចុច "បន្ថែមតម្លៃ" ។
                      </p>
                    )}

                    <div className="space-y-3">
                      {rulesForUnit.map(({ r: rule, idx }) => (
                        <div key={idx} className={`rounded-lg border p-3 ${theme.section}`}>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <FormSelect label="ប្រើសម្រាប់" required theme={theme} icon={<FiTag />}
                              value={rule.applies_to}
                              onChange={(v) => updatePriceRule(idx, "applies_to", v)}
                              options={[
                                { value: "retail", label: "លក់រាយ" },
                                { value: "wholesale", label: "លក់ដុំ" },
                              ]} />
                            <FormInput label="លក់ចាប់ពីចំនួន" required sanitize="number" allowDecimal={false} theme={theme} icon={<FiHash />}
                              value={rule.min_qty}
                              onChange={(v) => updatePriceRule(idx, "min_qty", v)}
                              hint="ឧ. តម្លៃនេះប្រើពេលលក់ចាប់ពីចំនួននេះឡើងទៅ" />
                            <FormSelect label="រូបិយប័ណ្ណ" required theme={theme} icon={<FiDollarSign />}
                              value={rule.input_currency}
                              onChange={(v) => updatePriceRule(idx, "input_currency", v)}
                              options={[
                                { value: "USD", label: "USD ($)" },
                                { value: "KHR", label: "KHR (៛)" },
                              ]} />
                            <FormInput
                              label={`បញ្ចូល ${rule.input_currency}`}
                              required sanitize="number" allowDecimal={true} theme={theme}
                              icon={rule.input_currency === "KHR"
                                ? <span className="text-base font-bold">៛</span>
                                : <FiDollarSign />}
                              value={rule.input_price}
                              onChange={(v) => updatePriceRule(idx, "input_price", v)}
                              placeholder={rule.input_currency === "KHR" ? "2000" : "0.50"} />
                            <PreviewBox theme={theme} label="USD (ស្វ័យប្រវត្ដិ)"
                              value={`$${Number(rule.unit_price_usd || 0).toFixed(2)}`}
                              highlight={rule.input_currency !== "USD"} />
                            <PreviewBox theme={theme} label="KHR (ស្វ័យប្រវត្ដិ)"
                              value={`${Number(rule.unit_price_khr || 0).toLocaleString()}៛`}
                              highlight={rule.input_currency !== "KHR"} />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className={`text-[11px] ${theme.muted}`}>
                              {Number(activeExchangeRate || 0) > 0
                                ? `អត្រា: 1 USD = ${Number(activeExchangeRate).toLocaleString()}៛ · ${khrRoundingLabel(activeKhrRounding)}`
                                : "គ្មានអត្រាប្ដូររូបិយប័ណ្ណ"}
                            </p>
                            <button type="button" onClick={() => removePriceRule(idx)}
                              className="quick-action-icon-3d inline-flex h-7 items-center gap-1 rounded-lg bg-red-500 px-2.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600">
                              <FiTrash2 />
                              លុបតម្លៃ
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
          <div className="mt-4">
            {(() => {
              const stored = Number(variantForm.low_stock_threshold || 0);
              const filledRows = unitRows.filter(r => r.unit_id);
              const hasMultipleUnits = filledRows.length > 1;

              const baseRow = unitRows.find(r => r.is_base_unit);
              const baseUnitObj = units.find(u => u.id == baseRow?.unit_id);
              const baseUnitName = baseUnitObj?.unit_name || baseUnitObj?.unitName || baseUnitObj?.unit_code || "ខ្នាតមូលដ្ឋាន";

              const largestNonBase = filledRows
                .filter(r => !r.is_base_unit && Number(r.conversion_qty) > 1)
                .sort((a, b) => Number(b.conversion_qty) - Number(a.conversion_qty))[0];
              const selectedKey = thresholdUnitKey || largestNonBase?.local_key || baseRow?.local_key || "";
              const threshRow = unitRows.find(r => r.local_key === selectedKey);
              const convQty = Number(threshRow?.conversion_qty || 1);

              const displayVal = convQty > 1 ? stored / convQty : stored;
              const displayStr = stored === 0 ? "" : (Number.isInteger(displayVal) ? String(displayVal) : displayVal.toFixed(2));

              const unitOptions = filledRows.map(r => {
                const u = units.find(uu => uu.id == r.unit_id);
                const name = u?.unit_name || u?.unitName || u?.unit_code || "ខ្នាត";
                return { value: r.local_key, label: `${name} (×${r.conversion_qty})` };
              });

              return (
                <>
                  <div className={hasMultipleUnits ? "flex items-end gap-2" : ""}>
                    <div className={hasMultipleUnits ? "flex-1" : ""}>
                      <FormInput
                        label="ជូនដំណឹងស្តុក"
                        sanitize="number"
                        allowDecimal={true}
                        theme={theme}
                        icon={<FiHash />}
                        value={displayStr}
                        onChange={(v) => {
                          const newStored = Math.round(Number(v || 0) * convQty);
                          updateVariant("low_stock_threshold", newStored || 0);
                        }}
                      />
                    </div>
                    {hasMultipleUnits && (
                      <div className="w-40 shrink-0">
                        <FormSelect
                          label="ខ្នាត"
                          theme={theme}
                          value={selectedKey}
                          onChange={(v) => setThresholdUnitKey(v)}
                          options={unitOptions}
                        />
                      </div>
                    )}
                  </div>
                  <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
                    {stored > 0 && convQty > 1
                      ? `= ${stored} ${baseUnitName}`
                      : `រាប់ក្នុង${baseUnitName} ។`}
                  </p>
                </>
              );
            })()}
          </div>
        </Section>
        )}
      </form>
    </ModalShell>
  );
}

function Section({ theme, icon, title, subtitle, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="summary-icon-3d mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
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
  placeholder = "", sanitize = "none", allowDecimal = true, hint,
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
      {hint && <p className={`mt-1 text-xs ${theme.muted}`}>{hint}</p>}
    </label>
  );
}

function FormSelect({ label, required = false, theme, icon, value, onChange, options }) {
  return (
    <SearchableDropdown
      label={label}
      required={required}
      theme={theme}
      icon={icon}
      value={value}
      onChange={onChange}
      options={options}
      searchable={options.length > 6}
    />
  );
}

function ImageInput({ label, theme, previewFile, onChange }) {
  const inputId = `${label.replace(/\s+/g, "-").toLowerCase()}-input`;
  const fileName = previewFile instanceof File ? previewFile.name : "";
  const previewUrl = previewFile instanceof File
    ? URL.createObjectURL(previewFile)
    : (typeof previewFile === "string" && previewFile ? previewFile : "");
  const handleRemoveImage = () => {
    onChange(null);
    const fileInput = document.getElementById(inputId);
    if (fileInput) fileInput.value = "";
  };
  return (
    <div className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/0 p-4 transition hover:border-red-400 hover:bg-red-500/[0.03] focus-within:border-red-500 focus-within:bg-red-500/[0.04] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-red-500 dark:focus-within:border-red-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="summary-icon-3d flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
            {previewUrl ? <img src={previewUrl} alt="Selected variant" className="h-full w-full object-cover" /> : <FiImage className="text-3xl text-red-500" />}
          </div>
          <div className="min-w-0 flex-1">
            <input id={inputId} type="file" accept="image/*" className="hidden"
              onChange={(e) => onChange(e.target.files?.[0] || null)} />
            <div className="flex flex-wrap gap-2">
              <label htmlFor={inputId}
                className="quick-action-icon-3d inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-700">
                <FiImage className="text-lg" /> {previewUrl ? "ប្ដូររូបភាព" : "ជ្រើសរូបភាព"}
              </label>
              {previewUrl && (
                <button type="button" onClick={handleRemoveImage}
                  className="table-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
                  <FiXCircle className="text-base" /> លុប
                </button>
              )}
            </div>
            <p className={`mt-3 truncate text-sm ${theme.muted}`}>
              {fileName || "JPG, PNG, WEBP · Max 2 MB"}
            </p>
            {previewFile instanceof File && <p className="mt-1 text-xs text-zinc-400">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
        </div>
      </div>
    </div>
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

function PackageTypeCombobox({ label, required = false, theme, value = "", onChange }) {
  return (
    <div>
      <CreatableOptionSelect
        label={label}
        required={required}
        theme={theme}
        icon={<FiBox />}
        value={value}
        onChange={onChange}
        groups={[{  options: PACKAGE_TYPES }]}
        placeholder="-- រើស --"
        searchPlaceholder="ស្វែងរក ឬបញ្ចូលសណ្ឋានថ្មី"
        hint="មិនឃើញ? វាយសណ្ឋានថ្មី រួចចុចបន្ថែម។"
        createLabel="បន្ថែម"
        existingLabel="ជម្រើសដែលមានស្រាប់"
        widthClass="w-full"
        menuWidthClass="w-full"
      />
    </div>
  );
}
