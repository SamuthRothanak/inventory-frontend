import React, { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiBox,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiGrid,
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
import {
  productSetupDefaultValues,
  productSetupSchema,
} from "../schemas/productSetup.schema";

const makeLocalKey = (prefix) => `${prefix}_${Date.now()}_${Math.random()}`;

function onlyPositiveNumber(value, allowDecimal = true) {
  let nextValue = String(value || "");
  nextValue = nextValue.replace(/-/g, "");
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
  const rate = Number(exchangeRate || 4000);
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

export default function ProductSetupFormModal({
  categories,
  units,
  theme,
  isSaving,
  isCreatingUnit = false,
  isUpdatingUnit = false,
  isDeletingUnit = false,
  activeExchangeRate = 4000,
  activeKhrRounding = "ceil",
  onCreateUnit,
  onUpdateUnit,
  onDeleteUnit,
  onClose,
  onSave,
}) {
  const [formErrorMessage, setFormErrorMessage] = useState("");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSetupSchema),
    defaultValues: productSetupDefaultValues,
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const selectedProductImage = watch("product.imageFile");

  const generateVariantCode = ({ productName, variantIndex }) => {
    const cleanName = String(productName || "PRODUCT")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const uniquePart = Date.now().toString().slice(-5);
    return `PV-${cleanName}-${uniquePart}-${variantIndex + 1}`;
  };

  const handleAddVariant = () => {
    const variantIndex = variantFields.length;
    const baseUnitKey = makeLocalKey("unit");
    const productName = watch("product.name") || "";

    appendVariant({
      variant_code: generateVariantCode({ productName, variantIndex }),
      variant_name: productName ? `${productName} ` : "",
      package_type: "",
      color: "",
      size_value: "",
      size_unit: "",
      low_stock_threshold: 0,
      status: true,
      imageFile: null,
      units: [
        {
          local_key: baseUnitKey,
          unit_id: "",
          conversion_qty: 1,
          is_base_unit: true,
          is_default_sale_unit: true,
          is_default_purchase_unit: false,
          status: true,
        },
      ],
      priceRules: [
        {
          local_unit_key: baseUnitKey,
          applies_to: "retail",
          min_qty: 1,
          unit_price_usd: 0,
          unit_price_khr: 0,
          input_currency: "USD",
          input_price: "",
          status: "active",
        },
      ],
    });
  };

  const submitForm = (values) => {
    setFormErrorMessage("");
    onSave(values);
  };

  const handleInvalidSubmit = () => {
    setFormErrorMessage(
      "Please check Product Information, Variants, Units, and Price Rules. Some required fields are missing.",
    );
  };

  return (
    <ModalShell
      title="Add Product Setup"
      subtitle="Create product, variants, units, and price rules in one flow before using it in Purchases."
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button type="button" onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
            Cancel
          </button>
          <button type="submit" form="product-setup-form" disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave />
            {isSaving ? "Saving..." : "Save Product Setup"}
          </button>
        </>
      }
    >
      <form id="product-setup-form" onSubmit={handleSubmit(submitForm, handleInvalidSubmit)} className="space-y-6">
        {formErrorMessage && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
            {formErrorMessage}
          </div>
        )}

        <FormSection title="1. Product Information" subtitle="Main product data. Example: Coca Cola." icon={<FiBox />} theme={theme}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Product Name" required error={errors.product?.name?.message} theme={theme} icon={<FiPackage />}
              inputProps={register("product.name")} placeholder="Coca Cola" />
            <SearchableDropdown label="Category" required error={errors.product?.category_id?.message} theme={theme} icon={<FiGrid />}
              value={watch("product.category_id")}
              onChange={(v) => setValue("product.category_id", v, { shouldValidate: true })}
              placeholder="Select category"
              options={[
                ...categories.map((c) => ({ value: String(c.id), label: c.name })),
              ]} />
            <input type="hidden" {...register("product.category_id")} />
            <FormSelectRHF label="Status" error={errors.product?.status?.message} theme={theme}
              icon={watch("product.status") === "active" ? <FiCheckCircle /> : <FiXCircle />}
              inputProps={register("product.status")}
              options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </div>
          <div className="mt-4">
            <FormTextarea label="Description" error={errors.product?.description?.message} theme={theme} icon={<FiFileText />}
              inputProps={register("product.description")} placeholder="Coca Cola soft drink" />
          </div>
          <div className="mt-4">
            <ImageInput label="Main Product Image" uniqueId="product-main" theme={theme}
              previewFile={selectedProductImage}
              onChange={(file) => setValue("product.imageFile", file, { shouldValidate: true })} />
          </div>
        </FormSection>

        <FormSection title="2. Product Variants" subtitle="Add can, bottle, box, or other variants. Each variant has units, and each unit has its own price rules." icon={<FiLayers />} theme={theme}>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Variants</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                Example: Coca Cola 330ml Can and Coca Cola 330ml Bottle.
              </p>
            </div>
            <button type="button" onClick={handleAddVariant}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
              <FiPlus />
              Add Variant
            </button>
          </div>

          {errors.variants?.message && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {errors.variants.message}
            </div>
          )}

          {variantFields.length === 0 && (
            <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${theme.softCard}`}>
              <FiPackage className="text-4xl text-red-500" />
              <p className="mt-3 text-sm font-semibold">No variants added</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>Click Add Variant to start product setup.</p>
            </div>
          )}

          <div className="space-y-5">
            {variantFields.map((variantField, variantIndex) => (
              <VariantSetupCard
                key={variantField.id}
                variantIndex={variantIndex}
                register={register}
                control={control}
                setValue={setValue}
                watch={watch}
                errors={errors}
                theme={theme}
                units={units}
                activeExchangeRate={activeExchangeRate}
                activeKhrRounding={activeKhrRounding}
                isCreatingUnit={isCreatingUnit}
                isUpdatingUnit={isUpdatingUnit}
                isDeletingUnit={isDeletingUnit}
                onCreateUnit={onCreateUnit}
                onUpdateUnit={onUpdateUnit}
                onDeleteUnit={onDeleteUnit}
                onRemoveVariant={() => removeVariant(variantIndex)}
              />
            ))}
          </div>
        </FormSection>
      </form>
    </ModalShell>
  );
}

function VariantSetupCard({
  variantIndex,
  register,
  control,
  setValue,
  watch,
  errors,
  theme,
  units,
  activeExchangeRate,
  activeKhrRounding,
  isCreatingUnit,
  isUpdatingUnit,
  isDeletingUnit,
  onCreateUnit,
  onUpdateUnit,
  onDeleteUnit,
  onRemoveVariant,
}) {
  const [quickUnitOpen, setQuickUnitOpen] = useState(false);
  const [quickUnit, setQuickUnit] = useState({
    unit_code: "",
    unit_name: "",
    unit_type: "piece",
    allow_decimal: false,
    status: "active",
  });

  const {
    fields: unitFields,
    append: appendUnit,
    remove: removeUnit,
  } = useFieldArray({ control, name: `variants.${variantIndex}.units` });

  const {
    fields: priceRuleFields,
    append: appendPriceRule,
    remove: removePriceRule,
  } = useFieldArray({ control, name: `variants.${variantIndex}.priceRules` });

  const variantImage = watch(`variants.${variantIndex}.imageFile`);
  const variantUnits = watch(`variants.${variantIndex}.units`) || [];
  const allPriceRules = watch(`variants.${variantIndex}.priceRules`) || [];
  const variantErrors = errors.variants?.[variantIndex];

  const unitLabel = (unitItem, index) => {
    const unit = units.find((u) => String(u.id) === String(unitItem?.unit_id));
    const name = unit?.unit_name || unit?.unitName || unit?.unit_code;
    return name
      ? `${name} (×${unitItem?.conversion_qty || 1})`
      : `Unit Row #${index + 1}`;
  };

  const handleAddUnit = () => {
    appendUnit({
      local_key: makeLocalKey("unit"),
      unit_id: "",
      conversion_qty: 1,
      is_base_unit: false,
      is_default_sale_unit: false,
      is_default_purchase_unit: false,
      status: true,
    });
  };

  const handleRemoveUnit = (unitIndex, unitLocalKey) => {
    // លុប price rules ដែលជាប់នឹង unit នេះ មុនលុប unit
    const indexesToRemove = [];
    allPriceRules.forEach((rule, idx) => {
      if (rule.local_unit_key === unitLocalKey) indexesToRemove.push(idx);
    });
    // remove ពីក្រោយ ទៅមុខ (កុំ shift index)
    indexesToRemove
      .sort((a, b) => b - a)
      .forEach((idx) => removePriceRule(idx));
    removeUnit(unitIndex);
  };

  const handleAddPriceForUnit = (unitLocalKey) => {
    appendPriceRule({
      local_unit_key: unitLocalKey,
      applies_to: "retail",
      min_qty: 1,
      unit_price_usd: 0,
      unit_price_khr: 0,
      input_currency: "USD",
      input_price: "",
      status: "active",
    });
  };

  const handlePriceInputChange = (ruleIndex, field, value) => {
    const cleanedValue =
      field === "input_price" ? onlyPositiveNumber(value, true) : value;

    setValue(
      `variants.${variantIndex}.priceRules.${ruleIndex}.${field}`,
      cleanedValue,
      { shouldValidate: true },
    );

    const inputCurrency =
      field === "input_currency"
        ? cleanedValue
        : watch(`variants.${variantIndex}.priceRules.${ruleIndex}.input_currency`);

    const inputPrice =
      field === "input_price"
        ? cleanedValue
        : watch(`variants.${variantIndex}.priceRules.${ruleIndex}.input_price`);

    const converted = convertPrice(
      inputPrice,
      inputCurrency,
      activeExchangeRate,
      activeKhrRounding,
    );

    setValue(
      `variants.${variantIndex}.priceRules.${ruleIndex}.unit_price_usd`,
      converted.unit_price_usd,
      { shouldValidate: true },
    );
    setValue(
      `variants.${variantIndex}.priceRules.${ruleIndex}.unit_price_khr`,
      converted.unit_price_khr,
      { shouldValidate: true },
    );
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-sm font-bold">Variant #{variantIndex + 1}</h4>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            Configure variant image, units, and price rules per unit.
          </p>
        </div>
        <button type="button" onClick={onRemoveVariant}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-xs font-semibold text-white hover:bg-red-600">
          <FiTrash2 />
          Remove Variant
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput label="Variant Code" required error={variantErrors?.variant_code?.message} theme={theme} icon={<FiHash />}
          inputProps={register(`variants.${variantIndex}.variant_code`)} placeholder="PV-COCA-330ML-CAN" />
        <FormInput label="Variant Name" required error={variantErrors?.variant_name?.message} theme={theme} icon={<FiPackage />}
          inputProps={register(`variants.${variantIndex}.variant_name`)} placeholder="Coca Cola 330ml Can" />
        <FormInput label="Package Type" required error={variantErrors?.package_type?.message} theme={theme} icon={<FiBox />}
          inputProps={register(`variants.${variantIndex}.package_type`)} placeholder="can, bottle" />
        <FormInput label="Color" sanitize="text" error={variantErrors?.color?.message} theme={theme} icon={<FiTag />}
          inputProps={register(`variants.${variantIndex}.color`)} placeholder="red" />
        <FormInput label="Size Value" sanitize="number" allowDecimal={true} error={variantErrors?.size_value?.message} theme={theme} icon={<FiHash />}
          inputProps={register(`variants.${variantIndex}.size_value`)} placeholder="330" />
        <FormInput label="Size Unit" sanitize="text" error={variantErrors?.size_unit?.message} theme={theme} icon={<FiTag />}
          inputProps={register(`variants.${variantIndex}.size_unit`)} placeholder="ml" />
        <FormInput label="Low Stock Threshold" type="number" sanitize="number" allowDecimal={false} error={variantErrors?.low_stock_threshold?.message} theme={theme} icon={<FiHash />}
          inputProps={register(`variants.${variantIndex}.low_stock_threshold`)} />
        <FormSelect label="Status" theme={theme} icon={<FiCheckCircle />}
          value={watch(`variants.${variantIndex}.status`) ? "1" : "0"}
          onChange={(value) => setValue(`variants.${variantIndex}.status`, value === "1", { shouldValidate: true })}
          options={[{ value: "1", label: "Active" }, { value: "0", label: "Inactive" }]} />
      </div>

      <div className="mt-4">
        <ImageInput label="Variant Image" uniqueId={`variant-${variantIndex}`} theme={theme}
          previewFile={variantImage}
          onChange={(file) => setValue(`variants.${variantIndex}.imageFile`, file, { shouldValidate: true })} />
      </div>

      {/* UNITS — each with nested price rules */}
      <div className="mt-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h5 className="text-sm font-bold">Units &amp; Prices</h5>
            <p className={`mt-1 text-xs ${theme.muted}`}>
              Each unit (Can, Case...) has its own prices. Example: 1 Case = 24 Can.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setQuickUnitOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
              <FiPlus />
              Manage Units
            </button>
            <button type="button" onClick={handleAddUnit}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600">
              <FiPlus />
              Add Unit Row
            </button>
          </div>
        </div>

        {quickUnitOpen && (
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
        )}

        {variantErrors?.units?.message && (
          <p className="mb-3 text-xs text-red-400">{variantErrors.units.message}</p>
        )}
        {variantErrors?.priceRules?.message && (
          <p className="mb-3 text-xs text-red-400">{variantErrors.priceRules.message}</p>
        )}

        <div className="space-y-4">
          {unitFields.map((unitField, unitIndex) => {
            const unitErrors = variantErrors?.units?.[unitIndex];
            const unitItem = variantUnits[unitIndex] || {};
            const unitLocalKey = unitItem.local_key || unitField.local_key;

            // price rules ជាប់នឹង unit នេះ (filter តាម local_unit_key)
            const rulesForUnit = priceRuleFields
              .map((rf, idx) => ({ rf, idx }))
              .filter(({ idx }) => allPriceRules[idx]?.local_unit_key === unitLocalKey);

            return (
              <div key={unitField.id} className={`rounded-2xl border p-4 ${theme.softCard}`}>
                <input type="hidden" {...register(`variants.${variantIndex}.units.${unitIndex}.local_key`)} />

                {/* UNIT HEADER */}
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold">
                    {unitLabel(unitItem, unitIndex)}
                  </p>
                  {unitFields.length > 1 && (
                    <button type="button" onClick={() => handleRemoveUnit(unitIndex, unitLocalKey)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white hover:bg-red-600">
                      <FiTrash2 />
                      Remove Unit
                    </button>
                  )}
                </div>

                {/* UNIT FIELDS */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr_2fr]">
                  <SearchableDropdown label="Unit" required error={unitErrors?.unit_id?.message} theme={theme} icon={<FiLayers />}
                    value={watch(`variants.${variantIndex}.units.${unitIndex}.unit_id`)}
                    onChange={(v) => setValue(`variants.${variantIndex}.units.${unitIndex}.unit_id`, v, { shouldValidate: true })}
                    placeholder="Select unit"
                    options={[
                      ...units.map((u) => ({
                        value: String(u.id),
                        label: u.unit_name || u.unitName || u.unit_code || `Unit #${u.id}`,
                      })),
                    ]} />
                  <input type="hidden" {...register(`variants.${variantIndex}.units.${unitIndex}.unit_id`)} />
                  <FormInput label="Conversion Qty" required type="number" sanitize="number" allowDecimal={true} error={unitErrors?.conversion_qty?.message} theme={theme} icon={<FiHash />}
                    inputProps={register(`variants.${variantIndex}.units.${unitIndex}.conversion_qty`)} />
                  <div>
                    <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${theme.muted}`}>
                      <FiInfo /> Unit Options
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <CheckBox label="Base Unit" helper="Smallest stock unit, e.g. Can"
                        checked={watch(`variants.${variantIndex}.units.${unitIndex}.is_base_unit`)}
                        onChange={(c) => setValue(`variants.${variantIndex}.units.${unitIndex}.is_base_unit`, c, { shouldValidate: true })} />
                      <CheckBox label="Default Sale" helper="Default unit for selling"
                        checked={watch(`variants.${variantIndex}.units.${unitIndex}.is_default_sale_unit`)}
                        onChange={(c) => setValue(`variants.${variantIndex}.units.${unitIndex}.is_default_sale_unit`, c, { shouldValidate: true })} />
                      <CheckBox label="Default Purchase" helper="Default unit for buying"
                        checked={watch(`variants.${variantIndex}.units.${unitIndex}.is_default_purchase_unit`)}
                        onChange={(c) => setValue(`variants.${variantIndex}.units.${unitIndex}.is_default_purchase_unit`, c, { shouldValidate: true })} />
                      <CheckBox label="Active" helper="Can use this unit"
                        checked={watch(`variants.${variantIndex}.units.${unitIndex}.status`)}
                        onChange={(c) => setValue(`variants.${variantIndex}.units.${unitIndex}.status`, c, { shouldValidate: true })} />
                    </div>
                  </div>
                </div>

                {/* NESTED PRICE RULES for this unit */}
                <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-white/10">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold">
                      Prices for {unitLabel(unitItem, unitIndex)}
                    </p>
                    <button type="button" onClick={() => handleAddPriceForUnit(unitLocalKey)}
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
                    {rulesForUnit.map(({ rf, idx }) => {
                      const ruleErrors = variantErrors?.priceRules?.[idx];
                      const inputCurrency = watch(`variants.${variantIndex}.priceRules.${idx}.input_currency`);

                      return (
                        <div key={rf.id} className={`rounded-lg border p-3 ${theme.section}`}>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <FormSelectRHF label="Applies To" required error={ruleErrors?.applies_to?.message} theme={theme} icon={<FiTag />}
                              inputProps={register(`variants.${variantIndex}.priceRules.${idx}.applies_to`)}
                              options={[
                                { value: "retail", label: "Retail" },
                                { value: "wholesale", label: "Wholesale" },
                                { value: "both", label: "Both" },
                              ]} />
                            <FormInput label="Min Qty" required type="number" sanitize="number" allowDecimal={false} error={ruleErrors?.min_qty?.message} theme={theme} icon={<FiHash />}
                              inputProps={register(`variants.${variantIndex}.priceRules.${idx}.min_qty`)} />
                            <FormSelect label="Currency" required theme={theme} icon={<FiDollarSign />}
                              value={inputCurrency || "USD"}
                              onChange={(value) => handlePriceInputChange(idx, "input_currency", value)}
                              options={[{ value: "USD", label: "USD ($)" }, { value: "KHR", label: "KHR (៛)" }]} />
                            <FormInputControlled
                              label={`Input ${inputCurrency || "USD"}`}
                              required type="number" sanitize="number" allowDecimal={true} error={ruleErrors?.input_price?.message} theme={theme}
                              icon={inputCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />}
                              value={watch(`variants.${variantIndex}.priceRules.${idx}.input_price`)}
                              onChange={(value) => handlePriceInputChange(idx, "input_price", value)}
                              placeholder={inputCurrency === "KHR" ? "2000" : "0.50"} />
                            <PreviewBox theme={theme} label="USD (auto)"
                              value={`$${Number(watch(`variants.${variantIndex}.priceRules.${idx}.unit_price_usd`) || 0).toFixed(2)}`}
                              highlight={inputCurrency !== "USD"} />
                            <PreviewBox theme={theme} label="KHR (auto)"
                              value={`${Number(watch(`variants.${variantIndex}.priceRules.${idx}.unit_price_khr`) || 0).toLocaleString()}៛`}
                              highlight={inputCurrency !== "KHR"} />
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
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuickCreateUnitBox({
  theme, units, quickUnit, setQuickUnit,
  isCreatingUnit, isUpdatingUnit, isDeletingUnit,
  onCreateUnit, onUpdateUnit, onDeleteUnit, onClose, onCreated,
}) {
  const [editingUnitId, setEditingUnitId] = useState(null);

  const generateUnitCode = (unitName) =>
    String(unitName || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  const resetForm = () => {
    setEditingUnitId(null);
    setQuickUnit({ unit_code: "", unit_name: "", unit_type: "piece", allow_decimal: false, status: "active" });
  };

  const handleEdit = (unit) => {
    setEditingUnitId(unit.id);
    setQuickUnit({
      unit_code: unit.unit_code || "",
      unit_name: unit.unit_name || unit.unitName || "",
      unit_type: unit.unit_type || unit.unitType || "piece",
      allow_decimal: Boolean(unit.allow_decimal ?? unit.allowDecimal),
      status: unit.status || "active",
    });
  };

  const handleSave = async () => {
    const finalUnitName = quickUnit.unit_name.trim();
    const finalUnitCode = quickUnit.unit_code.trim() || generateUnitCode(finalUnitName);
    if (!finalUnitName) { alert("Please input unit name."); return; }
    if (!finalUnitCode) { alert("Unit code could not be generated."); return; }
    const payload = {
      unit_code: finalUnitCode.toUpperCase(),
      unit_name: finalUnitName,
      unit_type: quickUnit.unit_type || "piece",
      allow_decimal: Boolean(quickUnit.allow_decimal),
      status: quickUnit.status || "active",
    };
    if (editingUnitId) {
      if (!onUpdateUnit) { alert("Update unit handler is missing."); return; }
      await onUpdateUnit({ id: editingUnitId, payload });
      resetForm();
      return;
    }
    if (!onCreateUnit) { alert("Create unit handler is missing."); return; }
    await onCreateUnit(payload);
    onCreated?.();
  };

  const handleDelete = async (unit) => {
    const confirmed = window.confirm(`Delete unit "${unit.unit_name || unit.unitName || unit.unit_code}"?`);
    if (!confirmed) return;
    if (!onDeleteUnit) { alert("Delete unit handler is missing."); return; }
    await onDeleteUnit(unit.id);
    if (editingUnitId === unit.id) resetForm();
  };

  return (
    <div className={`mb-4 rounded-xl border p-4 ${theme.softCard}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{editingUnitId ? "Update Unit" : "Create New Unit"}</p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            Unit code auto generates from Unit Name. Example: Small Bottle → SMALL_BOTTLE.
          </p>
        </div>
        <div className="flex gap-2">
          {editingUnitId && (
            <button type="button" onClick={resetForm}
              className="rounded-lg bg-zinc-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-600">New</button>
          )}
          <button type="button" onClick={onClose}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600">Close</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <label className="block md:col-span-1">
          <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>Unit Name *</span>
          <input value={quickUnit.unit_name}
            onChange={(e) => { const n = e.target.value; setQuickUnit((p) => ({ ...p, unit_name: n, unit_code: generateUnitCode(n) })); }}
            placeholder="Case"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
        </label>
        <label className="block md:col-span-1">
          <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>Unit Code</span>
          <input value={quickUnit.unit_code}
            onChange={(e) => setQuickUnit((p) => ({ ...p, unit_code: generateUnitCode(e.target.value) }))}
            placeholder="CASE"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
        </label>
        <label className="block md:col-span-1">
          <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>Unit Type</span>
          <select value={quickUnit.unit_type}
            onChange={(e) => setQuickUnit((p) => ({ ...p, unit_type: e.target.value }))}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.select}`}>
            <option value="piece">Piece</option>
            <option value="weight">Weight</option>
            <option value="volume">Volume</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="block md:col-span-1">
          <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>Status</span>
          <select value={quickUnit.status}
            onChange={(e) => setQuickUnit((p) => ({ ...p, status: e.target.value }))}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.select}`}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" disabled={isCreatingUnit || isUpdatingUnit} onClick={handleSave}
            className="h-11 w-full rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            {editingUnitId ? (isUpdatingUnit ? "Updating..." : "Update Unit") : (isCreatingUnit ? "Creating..." : "Save Unit")}
          </button>
        </div>
      </div>

      <label className={`mt-3 flex cursor-pointer items-center gap-2 text-xs ${theme.muted}`}>
        <input type="checkbox" checked={Boolean(quickUnit.allow_decimal)}
          onChange={(e) => setQuickUnit((p) => ({ ...p, allow_decimal: e.target.checked }))}
          className="h-4 w-4 rounded" />
        Allow decimal quantity
      </label>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold">Existing Units</p>
        {units.length === 0 ? (
          <div className={`rounded-xl border px-4 py-3 text-xs ${theme.softCard}`}>No units found.</div>
        ) : (
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {units.map((unit) => (
              <div key={unit.id} className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${theme.softCard}`}>
                <div>
                  <p className="text-sm font-semibold">{unit.unit_name || unit.unitName || "-"}</p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>
                    Code: {unit.unit_code || "-"} · Type: {unit.unit_type || "piece"} · {unit.allow_decimal ? "Decimal" : "No decimal"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(unit)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Edit</button>
                  <button type="button" disabled={isDeletingUnit} onClick={() => handleDelete(unit)}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                    {isDeletingUnit ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`mt-2 text-[11px] leading-4 ${theme.muted}`}>
          Note: Delete may fail if this unit is already used by product variant units.
        </p>
      </div>
    </div>
  );
}

function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">{icon}</div>
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {subtitle && <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ImageInput({ label, theme, previewFile, onChange, uniqueId = "" }) {
  const inputId = `${label.replace(/\s+/g, "-").toLowerCase()}-${uniqueId}-input`;
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
            {previewUrl ? <img src={previewUrl} alt="Selected" className="h-full w-full object-cover" /> : <FiImage className="text-3xl text-red-500" />}
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

function FormInput({
  label, required = false, error = "", theme, icon, inputProps,
  type = "text", placeholder = "", inputMode, sanitize = "none", allowDecimal = true,
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
          inputMode={inputMode || (isNumberInput ? (allowDecimal ? "decimal" : "numeric") : undefined)}
          min={isNumberInput ? 0 : undefined}
          placeholder={placeholder}
          {...inputProps}
          onKeyDown={(e) => { if (isNumberInput) preventInvalidNumberKey(e, allowDecimal); inputProps?.onKeyDown?.(e); }}
          onPaste={(e) => {
            if (isNumberInput || isTextOnly) {
              e.preventDefault();
              const t = e.clipboardData.getData("text");
              const cleaned = isNumberInput ? onlyPositiveNumber(t, allowDecimal) : onlyText(t);
              e.currentTarget.value = cleaned;
              inputProps?.onChange?.({ target: { name: inputProps.name, value: cleaned } });
              return;
            }
            inputProps?.onPaste?.(e);
          }}
          onChange={(e) => {
            let v = e.target.value;
            if (isNumberInput) v = onlyPositiveNumber(v, allowDecimal);
            if (isTextOnly) v = onlyText(v);
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

function FormInputControlled({
  label, required = false, error = "", theme, icon, type = "text",
  value, onChange, inputMode, sanitize = "none", allowDecimal = true,
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
          inputMode={inputMode || (isNumberInput ? (allowDecimal ? "decimal" : "numeric") : undefined)}
          min={isNumberInput ? 0 : undefined}
          value={value ?? ""}
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
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormTextarea({ label, error = "", theme, icon, inputProps, placeholder = "" }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}>{icon}</span>}
        <textarea rows={3} placeholder={placeholder} {...inputProps}
          className={`w-full resize-none rounded-xl border ${icon ? "pl-10" : "px-3"} pr-3 py-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${error ? "border-red-500 focus:border-red-500" : ""}`} />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormSelectRHF({ label, required = false, error = "", theme, icon, inputProps, options }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}>{icon}</span>}
        <select {...inputProps}
          className={`h-11 w-full rounded-xl border ${icon ? "pl-10" : "pl-3"} pr-3 text-sm outline-none transition focus:ring-4 ${theme.select} ${error ? "border-red-500 focus:border-red-500" : ""}`}>
          {options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
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

function CheckBox({ label, helper, checked, onChange }) {
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