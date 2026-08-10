import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiArrowRight,
  FiDollarSign,
  FiHash,
  FiRepeat,
  FiSave,
  FiTag,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
import SearchableDropdown from "./SearchableDropdown";
import { standalonePriceRuleSchema } from "../schemas/priceRule.schema";

const DEFAULT_EXCHANGE_RATE = 0;

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

function preventInvalidNumberKey(event, allowDecimal = true) {
  const invalidKeys = ["-", "+", "e", "E"];

  if (!allowDecimal) {
    invalidKeys.push(".");
  }

  if (allowDecimal && event.key === "." && event.currentTarget.value.includes(".")) {
    event.preventDefault();
    return;
  }

  if (invalidKeys.includes(event.key)) {
    event.preventDefault();
  }
}

// round 2 ខ្ទង់ សម្រាប់ USD
function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

// round KHR ឡើងលេខ 100 តាម mode — ត្រូវនឹង backend
function roundKhr(value, mode = "ceil") {
  const amount = Number(value || 0);
  if (amount <= 0) return 0;

  switch (mode) {
    case "round":
      return Math.round(amount / 100) * 100;
    case "floor":
      return Math.floor(amount / 100) * 100;
    case "none":
      return Number(amount.toFixed(2));
    case "ceil":
    default:
      return Math.ceil(amount / 100) * 100;
  }
}

// USD input -> khr = usd * rate ; KHR input -> usd = khr / rate
function convertPrice(inputPrice, inputCurrency, exchangeRate, khrMode = "ceil") {
  const price = Number(inputPrice || 0);
  const rate = Number(exchangeRate || 0);

  if (!price || !rate) {
    return { unit_price_usd: 0, unit_price_khr: 0 };
  }

  if (inputCurrency === "KHR") {
    return {
      unit_price_usd: round2(price / rate),
      unit_price_khr: roundKhr(price, khrMode),
    };
  }

  return {
    unit_price_usd: round2(price),
    unit_price_khr: roundKhr(price * rate, khrMode),
  };
}

function getVariantUnitId(variantUnit) {
  return (
    variantUnit?.id ||
    variantUnit?.productVariantUnitId ||
    variantUnit?.product_variant_unit_id ||
    variantUnit?.variantUnitId ||
    variantUnit?.variant_unit_id ||
    ""
  );
}

function getUnitName(variantUnit) {
  return (
    variantUnit?.unitName ||
    variantUnit?.unit_name ||
    variantUnit?.unit?.unit_name ||
    variantUnit?.unit?.unitName ||
    "-"
  );
}

const formatKhr = (value) => Number(value || 0).toLocaleString();
const formatUsd = (value) => Number(value || 0).toFixed(2);

export default function PriceRuleFormModal({
  mode = "add",
  variant,
  variantUnit,
  priceRule,
  theme,
  activeExchangeRate = DEFAULT_EXCHANGE_RATE,
  activeKhrRounding = "ceil",
  isSaving = false,
  onClose,
  onSave,
}) {
  const productVariantUnitId = getVariantUnitId(variantUnit);
  const unitName = getUnitName(variantUnit);

  const rate = Number(activeExchangeRate || 0);
  const hasRate = rate > 0;

  const defaultValues = useMemo(() => {
    const inputCurrency =
      priceRule?.inputCurrency || priceRule?.input_currency || "USD";

    const inputPrice =
      priceRule?.inputPrice ??
      priceRule?.input_price ??
      priceRule?.unitPriceUsd ??
      priceRule?.unit_price_usd ??
      priceRule?.usd ??
      0;

    return {
      product_variant_unit_id: productVariantUnitId,
      applies_to: priceRule?.appliesTo || priceRule?.applies_to || "retail",
      min_qty: priceRule?.minQty || priceRule?.min_qty || 1,
      input_currency: inputCurrency,
      input_price: Number(inputPrice || 0),
      status: priceRule?.status || "active",
    };
  }, [priceRule, productVariantUnitId]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(standalonePriceRuleSchema), defaultValues });

  const priceRuleId = priceRule?.id ?? null;
  useEffect(() => {
    reset(defaultValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRuleId, reset]);

  const inputCurrency = watch("input_currency");
  const inputPrice = watch("input_price");
  const appliesTo = watch("applies_to");
  const minQty = watch("min_qty");

  // live calculated values (preview)
  const converted = useMemo(
    () => convertPrice(inputPrice, inputCurrency, rate, activeKhrRounding),
    [inputPrice, inputCurrency, rate, activeKhrRounding]
  );

  const submitForm = (values) => {
    if (!productVariantUnitId) {
      alert("Product variant unit id is missing.");
      return;
    }

    // backend គណនា unit_price_usd/khr + exchange_rate_used auto ពី active rate។
    // frontend ផ្ញើតែ input + (usd/khr ជា hint, backend overwrite)។
    const calc = convertPrice(values.input_price, values.input_currency, rate, activeKhrRounding);

    const payload = {
      product_variant_unit_id: productVariantUnitId,
      applies_to: values.applies_to,
      min_qty: Number(values.min_qty || 1),
      input_currency: values.input_currency,
      input_price: Number(values.input_price || 0),
      unit_price_usd: calc.unit_price_usd,
      unit_price_khr: calc.unit_price_khr,
      status: values.status || "active",
    };

    onSave?.(payload);
  };

  // បង្ហាញ currency ផ្ទុយ (សម្រាប់ preview converted)
  const targetCurrency = inputCurrency === "KHR" ? "USD" : "KHR";

  return (
    <ModalShell
      mobileFullScreen
      title={mode === "edit" ? "កែតម្លៃ" : "បន្ថែមតម្លៃ"}
      subtitle={`${
        variant?.variantName || variant?.variant_name || "-"
      } · ខ្នាតទំនិញ: ${unitName}`}
      theme={theme}
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>

          <button
            type="submit"
            form="price-rule-form"
            disabled={isSaving || !hasRate}
            className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSaving
              ? mode === "edit"
                ? "កំពុងកែ..."
                : "កំពុងរក្សាទុក..."
              : mode === "edit"
              ? "កែតម្លៃ"
              : "រក្សាទុកតម្លៃ"}
          </button>
        </>
      }
    >
      <form
        id="price-rule-form"
        onSubmit={handleSubmit(submitForm)}
        className="space-y-5"
      >
        <input type="hidden" {...register("product_variant_unit_id")} />

        {/* warning បើគ្មាន active rate */}
        {!hasRate && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
            គ្មានអត្រាប្ដូររូបិយប័ណ្ណ ។ សូមដំឡើងអត្រាប្ដូរ មុនពេលបន្ថែមតម្លៃ ។
          </div>
        )}

        {/* ===== LIVE PREVIEW (big, clear) ===== */}
        <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-blue-500/5 p-5 dark:border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <FiRepeat /> មើលជាមុន
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${theme.badge}`}
            >
              1 USD = {formatKhr(rate)}៛
            </span>
          </div>

          <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {/* input side */}
            <div className="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                បញ្ចូល ({inputCurrency || "USD"})
              </p>
              <p className="mt-1 text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                {inputCurrency === "KHR"
                  ? `${formatKhr(inputPrice)}៛`
                  : `$${formatUsd(inputPrice)}`}
              </p>
            </div>

            <FiArrowRight className="mx-auto hidden text-xl text-emerald-500 sm:block" />

            {/* converted side */}
            <div className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                គណនាស្វ័យប្រវត្ដិ ({targetCurrency})
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {targetCurrency === "KHR"
                  ? `${formatKhr(converted.unit_price_khr)}៛`
                  : `$${formatUsd(converted.unit_price_usd)}`}
              </p>
            </div>
          </div>

          <p className={`mt-3 text-center text-xs ${theme.muted}`}>
            សរុប: <strong>${formatUsd(converted.unit_price_usd)}</strong> ·{" "}
            <strong>{formatKhr(converted.unit_price_khr)}៛</strong>
            {appliesTo ? ` · ${appliesTo} · អប្បបរមា ${minQty || 1}` : ""}
          </p>
        </div>

        {/* ===== INPUT FIELDS ===== */}
        <div
          className={`rounded-2xl border p-5 shadow-sm ${theme.softCard} dark:border-white/10`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="ប្រើសម្រាប់"
              required
              icon={<FiTag />}
              theme={theme}
              error={errors.applies_to?.message}
              value={watch("applies_to")}
              inputProps={register("applies_to")}
              options={[
                { value: "retail", label: "លក់រាយ" },
                { value: "wholesale", label: "លក់ដុំ" },
                { value: "both", label: "ទាំងពីរ" },
              ]}
            />

            <FormInput
              label="លក់ចាប់ពីចំនួន"
              required
              sanitize="number"
              allowDecimal={false}
              icon={<FiHash />}
              theme={theme}
              hint="ឧ. តម្លៃនេះប្រើពេលលក់ចាប់ពីចំនួននេះឡើងទៅ"
              error={errors.min_qty?.message}
              inputProps={register("min_qty")}
            />

            <FormSelect
              label="រូបិយប័ណ្ណ"
              required
              icon={<FiDollarSign />}
              theme={theme}
              error={errors.input_currency?.message}
              value={watch("input_currency")}
              inputProps={register("input_currency")}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "KHR", label: "KHR (៛)" },
              ]}
            />

            <FormInput
              label={`តម្លៃ (${inputCurrency || "USD"})`}
              required
              sanitize="number"
              allowDecimal={true}
              icon={
                inputCurrency === "KHR" ? (
                  <span className="text-base font-bold">៛</span>
                ) : (
                  <FiDollarSign />
                )
              }
              theme={theme}
              error={errors.input_price?.message}
              inputProps={register("input_price")}
            />
          </div>

          <p className={`mt-4 text-xs ${theme.muted}`}>
            តម្លៃ USD & KHR ត្រូវបានគណនាស្វ័យប្រវត្ដិ ពីអត្រាប្ដូររូបិយប័ណ្ណ ។ បញ្ចូលតែ ១ រូបិយប័ណ្ណ ។
          </p>
        </div>
      </form>
    </ModalShell>
  );
}

function FormInput({
  label,
  required = false,
  type = "text",
  icon,
  theme,
  inputProps,
  error = "",
  readOnly = false,
  sanitize = "none",
  allowDecimal = true,
  hint,
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
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <input
          type={isNumberInput ? "text" : type}
          inputMode={
            isNumberInput ? (allowDecimal ? "decimal" : "numeric") : undefined
          }
          readOnly={readOnly}
          {...inputProps}
          onKeyDown={(event) => {
            if (isNumberInput && !readOnly) {
              preventInvalidNumberKey(event, allowDecimal);
            }
            inputProps?.onKeyDown?.(event);
          }}
          onPaste={(event) => {
            if (isNumberInput && !readOnly) {
              event.preventDefault();
              const pastedText = event.clipboardData.getData("text");
              const cleanedValue = onlyPositiveNumber(pastedText, allowDecimal);
              event.currentTarget.value = cleanedValue;
              inputProps?.onChange?.({
                target: { name: inputProps.name, value: cleanedValue },
              });
              return;
            }
            inputProps?.onPaste?.(event);
          }}
          onChange={(event) => {
            let value = event.target.value;
            if (isNumberInput && !readOnly) {
              value = onlyPositiveNumber(value, allowDecimal);
            }
            event.target.value = value;
            inputProps?.onChange?.(event);
          }}
          className={`h-12 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            readOnly ? "cursor-not-allowed opacity-80" : ""
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>

      {hint && <p className={`mt-1 text-xs ${theme.muted}`}>{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormSelect({
  label,
  required = false,
  icon,
  theme,
  inputProps,
  value,
  options,
  error = "",
}) {
  const handleChange = (nextValue) => {
    inputProps?.onChange?.({
      target: {
        name: inputProps.name,
        value: nextValue,
      },
    });
  };

  return (
    <SearchableDropdown
      label={label}
      required={required}
      error={error}
      theme={theme}
      icon={icon}
      value={value}
      onChange={handleChange}
      options={options}
      searchable={options.length > 6}
    />
  );
}
