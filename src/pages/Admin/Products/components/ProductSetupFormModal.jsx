import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useConfirm } from "../../../../components/ConfirmDialog";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiBox,
  FiCheckCircle,
  FiDollarSign,
  FiEdit2,
  FiFileText,
  FiGrid,
  FiHash,
  FiImage,
  FiInfo,
  FiLayers,
  FiPackage,
  FiPlus,
  FiSave,
  FiSettings,
  FiTag,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

import ModalShell from "./ModalShell";
import SearchableDropdown from "./SearchableDropdown";
import { CreatableOptionSelect, SizeUnitSelect } from "./SizeUnitSelect";
import {
  productSetupDefaultValues,
  productSetupSchema,
} from "../schemas/productSetup.schema";

const makeLocalKey = (prefix) => `${prefix}_${Date.now()}_${Math.random()}`;

// Rough phonetic Khmer→Latin map for auto-generating a unit code from a Khmer unit name
// (e.g. "ដប" → "DB" after transliteration + the existing uppercase/strip pipeline). Not a
// linguistically precise romanization (ignores consonant series/inherent-vowel rules and
// coeng-stacking nuances) — it only needs to produce a short, readable, non-empty code, not a
// faithful transliteration. Tone/register marks and the subscript joiner are dropped rather
// than mapped, since they don't contribute a distinct sound worth encoding into a short code.
const KHMER_LATIN_MAP = {
  "ក": "K", "ខ": "KH", "គ": "K", "ឃ": "KH", "ង": "NG",
  "ច": "CH", "ឆ": "CH", "ជ": "CH", "ឈ": "CH", "ញ": "NY",
  "ដ": "D", "ឋ": "TH", "ឌ": "D", "ឍ": "TH", "ណ": "N",
  "ត": "T", "ថ": "TH", "ទ": "T", "ធ": "TH", "ន": "N",
  "ប": "B", "ផ": "PH", "ព": "P", "ភ": "P", "ម": "M",
  "យ": "Y", "រ": "R", "ល": "L", "វ": "V", "ស": "S",
  "ហ": "H", "ឡ": "L", "អ": "A",
  "ឥ": "I", "ឦ": "EI", "ឧ": "U", "ឩ": "OU", "ឪ": "OU",
  "ឫ": "REU", "ឬ": "REU", "ឭ": "LEU", "ឮ": "LEU",
  "ឯ": "AE", "ឰ": "AI", "ឱ": "O", "ឲ": "O", "ឳ": "AU",
  "ា": "A", "ិ": "I", "ី": "EY", "ឹ": "EU", "ឺ": "EW",
  "ុ": "U", "ូ": "OU", "ួ": "UA", "ើ": "OE", "ឿ": "UE",
  "ៀ": "EA", "េ": "E", "ែ": "AE", "ៃ": "AI", "ោ": "OA", "ៅ": "AU",
  "ំ": "M", "ះ": "H",
  "០": "0", "១": "1", "២": "2", "៣": "3", "៤": "4",
  "៥": "5", "៦": "6", "៧": "7", "៨": "8", "៩": "9",
};

function transliterateKhmer(value) {
  return String(value || "")
    .split("")
    .map((char) => (char in KHMER_LATIN_MAP ? KHMER_LATIN_MAP[char] : char))
    .join("");
}

// A unit *name* describes what the unit is ("ដប", "Box") — digits/symbols belong in the
// separate conversion-quantity field, not here, so they're blocked at input time rather than
// silently accepted and then stripped later by generateUnitCode. \p{M} (combining marks) is
// required alongside \p{L} — Khmer dependent vowel signs like េ/ា/ិ are Unicode *marks*, not
// letters, so a letters-only filter would silently mutilate real Khmer words (e.g. "កេស"
// losing its េ and becoming "កស").
function sanitizeUnitNameInput(value) {
  return String(value || "").replace(/[^\p{L}\p{M}\s]/gu, "");
}

// Module-level (not inside QuickCreateUnitBox) and exported so the package-type "create
// matching unit" nudge — in this file's VariantSetupCard, and in ProductVariantFormModal.jsx's
// edit-existing-variant form — generates the same code a user typing directly into
// QuickCreateUnitBox would get. One code-generation rule, not several copies that could drift.
export function generateUnitCode(unitName) {
  return transliterateKhmer(String(unitName || "").trim())
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Shared by the existing "auto-assign matching unit" effect, the new-product-wizard nudge, and
// the edit-existing-variant nudge (ProductVariantFormModal.jsx) — one comparison rule everywhere
// this correlation is checked, not several copies that could drift apart.
export function findMatchingUnit(units, name) {
  const target = String(name || "").trim().toLowerCase();
  if (!target) return null;
  return units.find(
    (u) => (u.unit_name || u.unitName || u.unit_code || "").toLowerCase() === target
  ) || null;
}

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

export function detectUnitType(unitName) {
  const value = String(unitName || "").trim().toLowerCase();
  const exactWeightKeywords = ["kg", "kgs", "g"];
  const exactVolumeKeywords = ["ml", "l"];
  const weightKeywords = ["kilogram", "kilograms", "gram", "grams", "គីឡូ", "គីឡូក្រាម", "ក្រាម"];
  const volumeKeywords = ["milliliter", "milliliters", "liter", "liters", "litre", "litres", "លីត្រ", "មីលីលីត្រ"];

  if (
    exactWeightKeywords.includes(value) ||
    weightKeywords.some((keyword) => value.includes(keyword))
  ) {
    return "weight";
  }

  if (
    exactVolumeKeywords.includes(value) ||
    volumeKeywords.some((keyword) => value.includes(keyword))
  ) {
    return "volume";
  }

  return "piece";
}

function unitTypeDisplay(type) {
  return { weight: "ទម្ងន់", volume: "មាឌ", piece: "ចំនួន" }[type] ?? type;
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

export default function ProductSetupFormModal({
  categories,
  units,
  theme,
  isSaving,
  isCreatingUnit = false,
  isUpdatingUnit = false,
  isDeletingUnit = false,
  activeExchangeRate = 0,
  activeKhrRounding = "ceil",
  onCreateUnit,
  onUpdateUnit,
  onDeleteUnit,
  onClose,
  onSave,
}) {
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [activeVariantIndex, setActiveVariantIndex] = useState(null);
  const [pendingNewVariantIndex, setPendingNewVariantIndex] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

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
  const watchedVariants = watch("variants") || [];

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
          barcode: "",
          is_base_unit: true,
          is_default_sale_unit: true,
          is_default_purchase_unit: false,
          status: true,
        },
      ],
      priceRules: [],
    });
    setActiveVariantIndex(variantIndex);
    setPendingNewVariantIndex(variantIndex);
  };

  const handleOpenVariant = (variantIndex) => {
    setActiveVariantIndex(variantIndex);
    setPendingNewVariantIndex(null);
  };

  const handleSaveVariantModal = () => {
    setActiveVariantIndex(null);
    setPendingNewVariantIndex(null);
  };

  const handleCloseVariantModal = () => {
    if (pendingNewVariantIndex !== null) {
      removeVariant(pendingNewVariantIndex);
    }
    setActiveVariantIndex(null);
    setPendingNewVariantIndex(null);
  };

  const getUnitLabel = (unitId) => {
    const unit = units.find((item) => String(item.id) === String(unitId));
    return unit?.unit_name || unit?.unitName || unit?.unit_code || "ខ្នាតទំនិញ";
  };

  const getPackageTypeFromVariant = (variant = {}) => {
    const variantUnits = variant.units || [];
    const baseUnit = variantUnits.find((item) => item.is_base_unit) || variantUnits[0];
    const unitLabel = getUnitLabel(baseUnit?.unit_id);
    return unitLabel === "ខ្នាតទំនិញ" ? "" : unitLabel.toLowerCase();
  };

  const getVariantUnitSummary = (variant = {}) => {
    const variantUnits = variant.units || [];
    if (variantUnits.length === 0) return "គ្មានខ្នាតទំនិញ";
    return variantUnits
      .map((item) => `${Number(item.conversion_qty || 1)} ${getUnitLabel(item.unit_id)}`)
      .join(", ");
  };

  const getVariantPriceSummary = (variant = {}) => {
    const prices = variant.priceRules || [];
    if (prices.length === 0) return "-";
    const firstPrice = prices[0];
    const usd = Number(firstPrice.unit_price_usd || 0);
    const khr = Number(firstPrice.unit_price_khr || 0);
    return `$${usd.toFixed(2)} / ${khr.toLocaleString()} KHR`;
  };

  const submitForm = (values) => {
    setFormErrorMessage("");
    const normalizedValues = {
      ...values,
      variants: (values.variants || []).map((variant) => ({
        ...variant,
        package_type: String(variant.package_type || getPackageTypeFromVariant(variant) || "").trim(),
      })),
    };
    onSave(normalizedValues);
  };

  const handleInvalidSubmit = () => {
    setFormErrorMessage(
      "សូមពិនិត្យ ព័ត៌មានផលិតផល, មុខទំនិញ, ខ្នាតទំនិញ, និងច្បាប់តម្លៃ ។ ទុកដាក់ field ចាំបាច់មួយចំនួន ។",
    );
  };

  return (
    <ModalShell
      mobileFullScreen
      title="បន្ថែមផលិតផល"
      subtitle="បង្កើតផលិតផល បន្ទាប់មកបន្ថែមមុខទំនិញ បន្ទាប់មកជ្រើសរើសខ្នាតទំនិញ សម្រាប់មុខទំនិញនីមួយៗ និងចំនួនស្ដុកដែលជិតអស់។"
      theme={theme}
      onClose={onClose}
      width="max-w-7xl"
      footer={
        <>
          <button type="button" onClick={onClose}
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
            បោះបង់
          </button>
          <button type="submit" form="product-setup-form" disabled={isSaving}
            className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            <FiSave />
            {isSaving ? "កំពុងរក្សាទុក..." : "រក្សាទុកផលិតផល"}
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

        {Number(activeExchangeRate || 0) <= 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm font-semibold text-amber-500">
            គ្មានអត្រាប្ដូររូបិយប័ណ្ណ ។ សូមបង្កើត និងធ្វើឲ្យសកម្មអត្រាប្ដូររូបិយប័ណ្ណ មុនពេលរក្សាទុកតម្លៃផលិតផល ។
          </div>
        )}

        <FormSection title="១. ព័ត៌មានផលិតផល" subtitle="ទិន្នន័យផលិតផលចម្បង ។ ឧទាហរណ៍: Coca Cola ។" icon={<FiBox />} theme={theme}>
          {/* Status hidden — always Active on creation */}
          <input type="hidden" {...register("product.status")} defaultValue="active" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="ឈ្មោះផលិតផល" required error={errors.product?.name?.message} theme={theme} icon={<FiPackage />}
              inputProps={register("product.name")} placeholder="Coca Cola" />
            <SearchableDropdown label="ប្រភេទ" required error={errors.product?.category_id?.message} theme={theme} icon={<FiGrid />}
              value={watch("product.category_id")}
              onChange={(v) => setValue("product.category_id", v, { shouldValidate: true })}
              placeholder="ជ្រើសរើសប្រភេទ"
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
            <input type="hidden" {...register("product.category_id")} />
          </div>

          {/* Description — collapsible */}
          <div className="mt-3">
            {showDescription ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/3">
                <FormTextarea label="ការពិពណ៌នា" error={errors.product?.description?.message} theme={theme} icon={<FiFileText />}
                  inputProps={register("product.description")} placeholder="ភេសជ្ជៈ Coca Cola" />
                <button type="button" onClick={() => { setShowDescription(false); setValue("product.description", ""); }}
                  className={`mt-2 text-xs ${theme.muted} hover:text-red-500`}>
                  − លុបការពិពណ៌នា
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowDescription(true)}
                className={`inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs font-semibold transition hover:border-red-400 hover:text-red-500 dark:border-white/10 dark:hover:border-red-500/60 dark:hover:text-red-400 ${theme.muted}`}>
                <FiFileText className="text-sm" /> + បន្ថែមការពិពណ៌នា (ស្រេចចិត្ត)
              </button>
            )}
          </div>

          {/* Image — compact */}
          <div className="mt-4">
            <ImageInput label="រូបភាពផលិតផល(ស្រេចចិត្ត)" uniqueId="product-main" theme={theme}
              previewFile={selectedProductImage}
              onChange={(file) => setValue("product.imageFile", file, { shouldValidate: true })} />
          </div>
        </FormSection>
        <FormSection title="២. មុខទំនិញ" icon={<FiLayers />} theme={theme}>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div> 
              <p className={`mt-1 text-xs ${theme.muted}`}>
                ឧទាហរណ៍: Coca-Cola 330ml កំប៉ុង និង Coca-Cola 330ml ដប ។
              </p>
            </div>
            <button type="button" onClick={handleAddVariant}
              className="quick-action-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600">
              <FiPlus />
              បន្ថែមមុខទំនិញ
            </button>
          </div>

          {errors.variants?.message && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {errors.variants.message}
            </div>
          )}

          {variantFields.length === 0 && (
            <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${theme.softCard}`}>
              <span className="summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                <FiPackage className="text-4xl text-red-500" />
              </span>
              <p className="mt-3 text-sm font-semibold">មិនទាន់មានមុខទំនិញ</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>ចុច «បន្ថែមមុខទំនិញ» ដើម្បីចាប់ផ្ដើម ។</p>
            </div>
          )}

          {variantFields.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-230 text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">មុខទំនិញ</th>
                    <th className="px-4 py-3 text-left">ខ្ចប់ / ទំហំ</th>
                    <th className="px-4 py-3 text-left">ខ្នាតទំនិញ</th>
                    <th className="px-4 py-3 text-left">តម្លៃ</th>
                    <th className="px-4 py-3 text-left">ស្ថានភាព</th>
                    <th className="px-4 py-3 text-center">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {variantFields.map((variantField, variantIndex) => {
                    const variant = watchedVariants[variantIndex] || {};
                    return (
                      <tr key={variantField.id} className="border-t border-zinc-200 dark:border-white/10">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{variant.variant_name || `មុខទំនិញ #${variantIndex + 1}`}</p>
                          <p className={`mt-1 text-xs ${theme.muted}`}>{variant.variant_code || "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p>{variant.package_type || "-"}</p>
                          <p className={`mt-1 text-xs ${theme.muted}`}>
                            {[variant.size_value, variant.size_unit].filter(Boolean).join(" ") || "គ្មានទំហំ"}
                          </p>
                        </td>
                        <td className="px-4 py-3">{getVariantUnitSummary(variant)}</td>
                        <td className="px-4 py-3 font-semibold">{getVariantPriceSummary(variant)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${variant.status ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-400"}`}>
                            {variant.status ? "ដំណើរការ" : "មិនដំណើរការ"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => handleOpenVariant(variantIndex)}
                              className="quick-action-icon-3d inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700">
                              <FiEdit2 />
                              កែ
                            </button>
                            <button type="button" onClick={() => removeVariant(variantIndex)}
                              className="quick-action-icon-3d inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600">
                              <FiTrash2 />
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
          )}
        </FormSection>
      </form>

      {activeVariantIndex !== null && variantFields[activeVariantIndex] && (
        <ModalShell
          title={pendingNewVariantIndex !== null ? "បន្ថែមមុខទំនិញ" : "កែមុខទំនិញ"}
          theme={theme}
          onClose={handleCloseVariantModal}
          width="max-w-6xl"
          footer={
            <>
              <button type="button" onClick={handleCloseVariantModal}
                className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
                បោះបង់
              </button>
              <button type="button" onClick={handleSaveVariantModal}
                className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600">
                <FiSave />
                រក្សាទុកមុខទំនិញ
              </button>
            </>
          }
        >
          <VariantSetupCard
            key={variantFields[activeVariantIndex].id}
            variantIndex={activeVariantIndex}
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
            onRemoveVariant={null}
          />
        </ModalShell>
      )}
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
  const confirm = useConfirm();
  const [quickUnitOpen, setQuickUnitOpen] = useState(false);
  const quickUnitBoxRef = useRef(null);
  useEffect(() => {
    if (quickUnitOpen) {
      quickUnitBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [quickUnitOpen]);
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

  const productName = watch("product.name") || "";
  const variantNameValue = watch(`variants.${variantIndex}.variant_name`) || "";
  const packageTypeVal = watch(`variants.${variantIndex}.package_type`) || "";
  const sizeValueVal = watch(`variants.${variantIndex}.size_value`) || "";
  const sizeUnitVal = watch(`variants.${variantIndex}.size_unit`) || "";

  const autoSuffix = [
    sizeValueVal ? `${sizeValueVal}${sizeUnitVal}` : "",
    packageTypeVal,
  ].filter(Boolean).join(" ");

  const [isAutoName, setIsAutoName] = useState(true);
  const [isAutoUnit, setIsAutoUnit] = useState(true);
  const [thresholdUnitIdx, setThresholdUnitIdx] = useState(null);
  const prevLargestIdxRef = useRef(null);

  useEffect(() => {
    const nonBase = variantUnits
      .map((u, i) => ({ ...u, idx: i }))
      .filter(u => !u.is_base_unit && Number(u.conversion_qty) > 1 && u.unit_id);
    const largest = nonBase.length > 0
      ? nonBase.reduce((a, b) => Number(b.conversion_qty) > Number(a.conversion_qty) ? b : a)
      : null;
    const newIdx = largest ? largest.idx : null;
    if (newIdx !== prevLargestIdxRef.current) {
      prevLargestIdxRef.current = newIdx;
      setThresholdUnitIdx(newIdx);
      if (newIdx !== null) {
        setValue(`variants.${variantIndex}.low_stock_threshold`, 0);
      }
    }
  }, [variantUnits]);

  useEffect(() => {
    if (!isAutoName) return;
    const newName = productName
      ? (autoSuffix ? `${productName} ${autoSuffix}` : productName)
      : autoSuffix;
    setValue(`variants.${variantIndex}.variant_name`, newName, { shouldValidate: false });
  }, [autoSuffix, productName, isAutoName, variantIndex, setValue]);

  // Auto-match base unit when Package Type changes (only if unit is still in "auto" mode)
  useEffect(() => {
    if (!isAutoUnit) return;
    const baseUnitIndex = (watch(`variants.${variantIndex}.units`) || [])
      .findIndex((u) => u.is_base_unit);
    if (baseUnitIndex === -1) return;
    if (!packageTypeVal) return;
    const matched = findMatchingUnit(units, packageTypeVal);
    if (matched) {
      setValue(`variants.${variantIndex}.units.${baseUnitIndex}.unit_id`, String(matched.id), { shouldValidate: true });
    }
  }, [packageTypeVal, isAutoUnit, variantIndex, units, setValue, watch]);

  const variantSuffix = (() => {
    const prefix = productName + " ";
    if (variantNameValue.startsWith(prefix)) return variantNameValue.slice(prefix.length);
    if (variantNameValue.trim() === productName.trim()) return "";
    return variantNameValue;
  })();
  const variantErrors = errors.variants?.[variantIndex];

  const getUnitPackageType = (unitId) => {
    const unit = units.find((item) => String(item.id) === String(unitId));
    const name = unit?.unit_name || unit?.unitName || unit?.unit_code || "";
    return String(name).trim().toLowerCase();
  };

  const autoFillPackageType = (unitId) => {
    const currentPackageType = watch(`variants.${variantIndex}.package_type`);
    const packageType = getUnitPackageType(unitId);
    if (!currentPackageType && packageType) {
      setValue(`variants.${variantIndex}.package_type`, packageType, { shouldValidate: true });
    }
  };

  const unitLabel = (unitItem, index) => {
    const display = unitDisplay(unitItem, index);
    return `${display.name} (×${display.qty})`;
  };

  const unitDisplay = (unitItem, index) => {
    const unit = units.find((u) => String(u.id) === String(unitItem?.unit_id));
    const name = unit?.unit_name || unit?.unitName || unit?.unit_code;
    return {
      name: name || `ខ្នាតទំនិញ #${index + 1}`,
      qty: Number(unitItem?.conversion_qty || 1),
    };
  };

  const handleAddUnit = () => {
    appendUnit({
      local_key: makeLocalKey("unit"),
      unit_id: "",
      conversion_qty: "",
      barcode: "",
      is_base_unit: false,
      is_default_sale_unit: false,
      is_default_purchase_unit: true,
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
    <div className={`rounded-xl border p-4 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-white/10 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-extrabold">មុខទំនិញ #{variantIndex + 1}</h4>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំណត់ឈ្មោះ សណ្ឋាន ទំហំ រូបភាព ខ្នាត និងតម្លៃសម្រាប់មុខទំនិញនេះ។
          </p>
        </div>
        {onRemoveVariant && (
          <button type="button" onClick={onRemoveVariant}
            className="quick-action-icon-3d inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0">
            <FiTrash2 />
            លុបមុខទំនិញ
          </button>
        )}
      </div>

      {/* Status hidden — always Active on creation */}
      <input type="hidden" {...register(`variants.${variantIndex}.status`)} defaultValue="true" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Variant Code — read-only style, auto-generated */}
        <div>
          <label className={`mb-2 flex h-7 items-center text-xs font-semibold ${theme.muted}`}>
            លេខកូដមុខទំនិញ <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-white/10">ស្វ័យប្រវត្តិ</span>
          </label>
          <div className="relative">
            <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}><FiHash /></span>
            <input {...register(`variants.${variantIndex}.variant_code`)}
              readOnly
              aria-readonly="true"
              className={`h-11 w-full cursor-default rounded-xl border pl-10 pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} opacity-70`} />
          </div>
          <div className="min-h-[1.375rem]">
            {variantErrors?.variant_code?.message ? (
              <p className="mt-1.5 text-xs text-red-400">{variantErrors.variant_code.message}</p>
            ) : (
              <p className={`mt-1.5 text-xs ${theme.muted}`}>
                លេខកូដបង្កើតស្វ័យប្រវត្តិ។
              </p>
            )}
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
                onClick={() => setIsAutoName(true)}
                className={`inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-bold transition ${theme.muted} hover:border-emerald-500/40 hover:text-emerald-500`}
              >
                ↺ ស្វ័យប្រវត្តិ
              </button>
            )}
          </div>
          <div className={`flex h-11 overflow-hidden rounded-xl border bg-white transition focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20 dark:bg-white/[0.03] ${variantErrors?.variant_name?.message ? "border-red-500" : "border-zinc-200 dark:border-white/10"}`}>
            {productName && (
              <span className="flex shrink-0 items-center border-r border-zinc-200 bg-zinc-100 px-3 text-xs font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/10 dark:text-zinc-400">
                {productName}
              </span>
            )}
            <input
              placeholder={isAutoName ? "បំពេញសណ្ឋានទំនិញ & ទំហំ" : "ឧ. Can 330ml, ថង់ 5kg"}
              value={variantSuffix}
              readOnly={isAutoName}
              onChange={(e) => {
                setIsAutoName(false);
                const suffix = cleanNamePart(e.target.value);
                setValue(
                  `variants.${variantIndex}.variant_name`,
                  productName ? (suffix ? `${productName} ${suffix}` : productName) : suffix,
                  { shouldValidate: true }
                );
              }}
              className={`min-w-0 flex-1 bg-transparent px-3 text-sm outline-none ${isAutoName ? "cursor-default text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}
            />
          </div>
          <div className="min-h-[1.375rem]">
            {variantErrors?.variant_name?.message ? (
              <p className="mt-1.5 text-xs text-red-400">{variantErrors.variant_name.message}</p>
            ) : (
              <p className={`mt-1.5 text-xs ${theme.muted}`}>
                {isAutoName ? "ឈ្មោះបង្កើតស្វ័យប្រវត្តិពី សណ្ឋានទំនិញ និង ទំហំ។" : "កំពុងកែដោយខ្លួនឯង។ ចុច ↺ ស្វ័យប្រវត្តិ ដើម្បីបង្កើតវិញ។"}
              </p>
            )}
          </div>
        </div>

      </div>

      <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-white/10">
        <div className="mb-4">
          <div>
            <h5 className="text-sm font-bold">ព័ត៌មានលម្អិតបន្ថែម</h5>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>សណ្ឋាន ទំហំ ពណ៌ និងរូបភាពសម្រាប់មុខទំនិញនេះ។</p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <div>
            <PackageTypeCombobox
              label="សណ្ឋានទំនិញ"
              required
              error={variantErrors?.package_type?.message}
              theme={theme}
              value={watch(`variants.${variantIndex}.package_type`) || ""}
              onChange={(v) => setValue(`variants.${variantIndex}.package_type`, v, { shouldValidate: true })}
            />
            {packageTypeVal &&
              !findMatchingUnit(units, packageTypeVal) &&
              !(quickUnitOpen && quickUnit.unit_name.trim().toLowerCase() === packageTypeVal.trim().toLowerCase()) && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                <span>&quot;{packageTypeVal}&quot; មិនទាន់ជាខ្នាតទំនិញនៅឡើយ</span>
                <button
                  type="button"
                  onClick={() => {
                    setQuickUnit({
                      unit_code: generateUnitCode(packageTypeVal),
                      unit_name: packageTypeVal,
                      unit_type: detectUnitType(packageTypeVal),
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
                  {...register(`variants.${variantIndex}.size_value`)}
                  placeholder="330"
                  inputMode="decimal"
                  onKeyDown={(e) => preventInvalidNumberKey(e, true)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const cleaned = onlyPositiveNumber(e.clipboardData.getData("text"), true);
                    setValue(`variants.${variantIndex}.size_value`, cleaned, { shouldValidate: true });
                  }}
                  onChange={(e) => {
                    const cleaned = onlyPositiveNumber(e.target.value, true);
                    e.target.value = cleaned;
                    setValue(`variants.${variantIndex}.size_value`, cleaned, { shouldValidate: true });
                  }}
                  className="h-full w-full bg-transparent pl-10 pr-3 text-sm outline-none" />
              </div>
              <SizeUnitSelect value={sizeUnitVal} onChange={(v) => setValue(`variants.${variantIndex}.size_unit`, v)} theme={theme} embedded />
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
              ពណ៌ <span className="font-normal">(ស្រេចចិត្ត)</span>
            </label>
            <div className="relative">
              <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}><FiTag /></span>
              <input {...register(`variants.${variantIndex}.color`)} placeholder="ក្រហម"
                className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none transition focus:ring-4 ${variantErrors?.color?.message ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : theme.input}`} />
            </div>
            {variantErrors?.color?.message && <p className="mt-1.5 text-xs text-red-400">{variantErrors.color.message}</p>}
          </div>

          <div>
            <ImageInput label="រូបភាពមុខទំនិញ *" uniqueId={`variant-${variantIndex}`} theme={theme}
              previewFile={variantImage}
              onChange={(file) => setValue(`variants.${variantIndex}.imageFile`, file, { shouldValidate: true })} />
            {variantErrors?.imageFile && (
              <p className="mt-1 text-xs text-red-500">{variantErrors.imageFile.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* UNITS — each with nested price rules */}
      <div className="mt-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h5 className="text-sm font-bold">ខ្នាតទំនិញ &amp; តម្លៃ</h5>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setQuickUnitOpen(true)}
              className="quick-action-icon-3d inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-zinc-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-600">
              <FiSettings />
              ប្រភេទខ្នាតទំនិញ
            </button>
            <button type="button" onClick={handleAddUnit}
              className="quick-action-icon-3d inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600">
              <FiPlus />
              បន្ថែមខ្នាតទំនិញ
            </button>
          </div>
        </div>

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

        {variantErrors?.units?.message && (
          <p className="mb-3 text-xs text-red-400">{variantErrors.units.message}</p>
        )}
        {variantErrors?.priceRules?.message && (
          <p className="mb-3 text-xs text-red-400">{variantErrors.priceRules.message}</p>
        )}

        {units.length === 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
            <FiInfo className="mt-0.5 shrink-0" />
            <span>មិនទាន់មានប្រភេទខ្នាតទំនិញ ។ ចុច <strong>⚙ ប្រភេទខ្នាតទំនិញ</strong> ខាងលើ ដើម្បីបង្កើតខ្នាតទំនិញជាមុន — ឧ. Can, Bottle, Piece, Box ។</span>
          </div>
        )}

        <div className="space-y-4">
          {unitFields.map((unitField, unitIndex) => {
            const unitErrors = variantErrors?.units?.[unitIndex];
            const unitItem = variantUnits[unitIndex] || {};
            const unitLocalKey = unitItem.local_key || unitField.local_key;
            const display = unitDisplay(unitItem, unitIndex);

            // price rules ជាប់នឹង unit នេះ (filter តាម local_unit_key)
            const rulesForUnit = priceRuleFields
              .map((rf, idx) => ({ rf, idx }))
              .filter(({ idx }) => allPriceRules[idx]?.local_unit_key === unitLocalKey);

            return (
              <div
                key={unitField.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  unitIndex % 2 === 0
                    ? "border-emerald-200 bg-emerald-50/35 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]"
                    : "border-sky-200 bg-sky-50/35 dark:border-sky-500/20 dark:bg-sky-500/[0.06]"
                }`}
              >
                <input type="hidden" {...register(`variants.${variantIndex}.units.${unitIndex}.local_key`)} />

                {/* UNIT HEADER */}
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
                  {unitFields.length > 1 && (
                    <button type="button" onClick={() => handleRemoveUnit(unitIndex, unitLocalKey)}
                      className="quick-action-icon-3d inline-flex h-8 items-center gap-1 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600">
                      <FiTrash2 />
                      លុបខ្នាតទំនិញ
                    </button>
                  )}
                </div>

                {/* UNIT FIELDS */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <SearchableDropdown label="ខ្នាតទំនិញ" required error={unitErrors?.unit_id?.message} theme={theme} icon={<FiLayers />}
                    value={watch(`variants.${variantIndex}.units.${unitIndex}.unit_id`)}
                    onChange={(v) => {
                      setValue(`variants.${variantIndex}.units.${unitIndex}.unit_id`, v, { shouldValidate: true });
                      if (watch(`variants.${variantIndex}.units.${unitIndex}.is_base_unit`)) {
                        setIsAutoUnit(false); // user manually picked base unit — stop auto-match
                        autoFillPackageType(v);
                      }
                    }}
                    placeholder="ជ្រើសរើសខ្នាតទំនិញ"
                    options={[
                      ...units.map((u) => ({
                        value: String(u.id),
                        label: u.unit_name || u.unitName || u.unit_code || `ខ្នាតទំនិញ #${u.id}`,
                      })),
                    ]} />
                  <input type="hidden" {...register(`variants.${variantIndex}.units.${unitIndex}.unit_id`)} />
                  <div>
                    <FormInput label="ចំនួនក្នុងមួយខ្នាត" required type="number" sanitize="number" allowDecimal={true} error={unitErrors?.conversion_qty?.message} theme={theme} icon={<FiHash />}
                      hint="ឧ. កេសមួយមាន 24 កំប៉ុង/ដប"
                      inputProps={{
                        ...register(`variants.${variantIndex}.units.${unitIndex}.conversion_qty`),
                        onChange: (e) => {
                          register(`variants.${variantIndex}.units.${unitIndex}.conversion_qty`).onChange(e);
                          const qty = Number(e.target.value || 1);
                          const base = `variants.${variantIndex}.units.${unitIndex}`;
                          if (qty === 1) {
                            setValue(`${base}.is_base_unit`, true, { shouldValidate: true });
                            setValue(`${base}.is_default_sale_unit`, true, { shouldValidate: true });
                            setValue(`${base}.is_default_purchase_unit`, false, { shouldValidate: true });
                          } else {
                            setValue(`${base}.is_base_unit`, false, { shouldValidate: true });
                            setValue(`${base}.is_default_sale_unit`, false, { shouldValidate: true });
                            setValue(`${base}.is_default_purchase_unit`, true, { shouldValidate: true });
                          }
                        },
                      }} />
                  </div>
                  <div>
                    <FormInput label="បាកូដ (Barcode)" theme={theme} icon={<FiHash />}
                      hint="ស្រេចចិត្ត — ខ្នាតនីមួយៗអាចមាន barcode ខុសគ្នា"
                      inputProps={register(`variants.${variantIndex}.units.${unitIndex}.barcode`)} />
                  </div>
                </div>

                <p className={`mb-2 mt-3 flex items-center gap-1.5 text-xs font-semibold ${theme.muted}`}>
                  <FiInfo /> ជម្រើសខ្នាតទំនិញ
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <CheckBox label="ខ្នាតទំនិញស្តុក" helper="តាមដានស្តុកក្នុងខ្នាតទំនិញនេះ"
                    checked={watch(`variants.${variantIndex}.units.${unitIndex}.is_base_unit`)}
                    onChange={(c) => {
                      setValue(`variants.${variantIndex}.units.${unitIndex}.is_base_unit`, c, { shouldValidate: true });
                      if (c) {
                        autoFillPackageType(watch(`variants.${variantIndex}.units.${unitIndex}.unit_id`));
                      }
                    }} />
                  <CheckBox label="លក់ក្នុង POS" helper="ប្រើស្វ័យប្រវត្ដិពេលលក់ដល់អតិថិជន"
                    checked={watch(`variants.${variantIndex}.units.${unitIndex}.is_default_sale_unit`)}
                    onChange={(c) => setValue(`variants.${variantIndex}.units.${unitIndex}.is_default_sale_unit`, c, { shouldValidate: true })} />
                  <CheckBox label="ទិញពីអ្នកផ្គត់ផ្គង់" helper="ប្រើស្វ័យប្រវត្ដិពេលបញ្ជាទិញស្តុក"
                    checked={watch(`variants.${variantIndex}.units.${unitIndex}.is_default_purchase_unit`)}
                    onChange={(c) => setValue(`variants.${variantIndex}.units.${unitIndex}.is_default_purchase_unit`, c, { shouldValidate: true })} />
                  <CheckBox label="ដំណើរការ" helper="អាចប្រើខ្នាតទំនិញនេះ"
                    checked={watch(`variants.${variantIndex}.units.${unitIndex}.status`)}
                    onChange={(c) => setValue(`variants.${variantIndex}.units.${unitIndex}.status`, c, { shouldValidate: true })} />
                </div>

                {/* NESTED PRICE RULES for this unit */}
                <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-white/10">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold">
                      តម្លៃសម្រាប់ {unitLabel(unitItem, unitIndex)}
                    </p>
                    <button type="button" onClick={() => handleAddPriceForUnit(unitLocalKey)}
                      className="quick-action-icon-3d inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600">
                      <FiPlus />
                      បន្ថែមតម្លៃ
                    </button>
                  </div>

                  {rulesForUnit.length === 0 && (
                    <p className={`rounded-lg border border-dashed px-3 py-3 text-center text-xs ${theme.muted}`}>
                      មិនទាន់មានតម្លៃ ។ អាចបន្ថែមក្រោយបាន មុនយកទៅលក់។
                    </p>
                  )}

                  <div className="space-y-3">
                    {rulesForUnit.map(({ rf, idx }) => {
                      const ruleErrors = variantErrors?.priceRules?.[idx];
                      const inputCurrency = watch(`variants.${variantIndex}.priceRules.${idx}.input_currency`);

                      return (
                        <div key={rf.id} className={`rounded-lg border p-3 ${theme.section}`}>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <FormSelectRHF label="ប្រើសម្រាប់" required error={ruleErrors?.applies_to?.message} theme={theme} icon={<FiTag />}
                              value={watch(`variants.${variantIndex}.priceRules.${idx}.applies_to`)}
                              onChange={(value) => setValue(`variants.${variantIndex}.priceRules.${idx}.applies_to`, value, { shouldValidate: true })}
                              inputProps={register(`variants.${variantIndex}.priceRules.${idx}.applies_to`)}
                              options={[
                                { value: "retail",    label: "លក់រាយ" },
                                { value: "wholesale", label: "លក់ដុំ" },
                                { value: "both",      label: "ទាំងពីរ" },
                              ]} />
                            <FormInput label="លក់ចាប់ពីចំនួន" required type="number" sanitize="number" allowDecimal={false} error={ruleErrors?.min_qty?.message} theme={theme} icon={<FiHash />}
                              hint="ឧ. តម្លៃនេះប្រើពេលលក់ចាប់ពីចំនួននេះឡើងទៅ"
                              inputProps={register(`variants.${variantIndex}.priceRules.${idx}.min_qty`)} />
                            <FormSelect label="រូបិយប័ណ្ណ" required theme={theme} icon={<FiDollarSign />}
                              value={inputCurrency || "USD"}
                              onChange={(value) => handlePriceInputChange(idx, "input_currency", value)}
                              options={[{ value: "USD", label: "USD ($)" }, { value: "KHR", label: "KHR (៛)" }]} />
                            <FormInputControlled
                              label={`បញ្ចូល ${inputCurrency || "USD"}`}
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
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          {(() => {
            const stored = Number(watch(`variants.${variantIndex}.low_stock_threshold`) || 0);

            const baseUnit = variantUnits.find(u => u.is_base_unit);
            const baseUnitObj = units.find(u => String(u.id) === String(baseUnit?.unit_id));
            const baseUnitName = baseUnitObj?.unit_name || baseUnitObj?.unitName || baseUnitObj?.unit_code || "ខ្នាតមូលដ្ឋាន";

            const unitOptions = variantUnits
              .map((u, i) => {
                if (!u.unit_id) return null;
                const uObj = units.find(uu => String(uu.id) === String(u.unit_id));
                const name = uObj?.unit_name || uObj?.unitName || uObj?.unit_code || "ខ្នាត";
                return { value: String(i), label: `${name} (×${u.conversion_qty})` };
              })
              .filter(Boolean);

            const hasMultiple = unitOptions.length > 1;
            const autoNonBase = variantUnits
              .map((u, i) => ({ ...u, idx: i }))
              .filter(u => !u.is_base_unit && Number(u.conversion_qty) > 1 && u.unit_id);
            const autoUnit = autoNonBase.length > 0
              ? autoNonBase.reduce((a, b) => Number(b.conversion_qty) > Number(a.conversion_qty) ? b : a)
              : null;
            const effectiveIdx = thresholdUnitIdx !== null
              ? thresholdUnitIdx
              : (autoUnit ? autoUnit.idx : variantUnits.findIndex(u => u.is_base_unit));
            const threshUnit = effectiveIdx >= 0 ? variantUnits[effectiveIdx] : null;
            const convQty = Number(threshUnit?.conversion_qty || 1);

            const displayVal = convQty > 1 ? stored / convQty : stored;
            const displayStr = stored === 0 ? "" : (Number.isInteger(displayVal) ? String(displayVal) : displayVal.toFixed(2));

            const selectedIdx = String(effectiveIdx >= 0 ? effectiveIdx : 0);

            return (
              <>
                <div className={hasMultiple ? "flex items-end gap-2" : ""}>
                  <div className={hasMultiple ? "flex-1" : ""}>
                    <FormInputControlled
                      label="ជូនដំណឹងស្តុក"
                      sanitize="number"
                      allowDecimal={true}
                      error={variantErrors?.low_stock_threshold?.message}
                      theme={theme}
                      icon={<FiHash />}
                      value={displayStr}
                      onChange={(v) => {
                        const newStored = Math.round(Number(v || 0) * convQty);
                        setValue(`variants.${variantIndex}.low_stock_threshold`, newStored || 0);
                      }}
                    />
                  </div>
                  {hasMultiple && (
                    <div className="w-40 shrink-0">
                      <FormSelect
                        label="ខ្នាត"
                        theme={theme}
                        value={selectedIdx}
                        onChange={(v) => setThresholdUnitIdx(Number(v))}
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
      </div>
    </div>
  );
}

export function QuickCreateUnitBox({
  theme, units, quickUnit, setQuickUnit,
  isCreatingUnit, isUpdatingUnit, isDeletingUnit,
  onCreateUnit, onUpdateUnit, onDeleteUnit, onClose, onCreated,
}) {
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [unitError, setUnitError] = useState("");


  const getSuggestedUnitType = (unitName = quickUnit.unit_name) =>
    detectUnitType(unitName);

  const resetForm = () => {
    setEditingUnitId(null);
    setUnitError("");
    setQuickUnit({ unit_code: "", unit_name: "", unit_type: "piece", allow_decimal: false, status: "active" });
  };

  const handleEdit = (unit) => {
    setEditingUnitId(unit.id);
    setUnitError("");
    setQuickUnit({
      unit_code: unit.unit_code || "",
      unit_name: unit.unit_name || unit.unitName || "",
      unit_type: unit.unit_type || unit.unitType || "piece",
      allow_decimal: Boolean(unit.allow_decimal ?? unit.allowDecimal),
      status: unit.status || "active",
    });
  };

  const handleSave = async () => {
    setUnitError("");
    const finalUnitName = quickUnit.unit_name.trim();
    if (!finalUnitName) { alert("សូមបញ្ចូលឈ្មោះខ្នាតទំនិញ ។"); return; }
    const finalUnitCode = quickUnit.unit_code.trim() || generateUnitCode(finalUnitName) || `UNIT${Date.now().toString().slice(-5)}`;
    const duplicateUnit = units.find((unit) => {
      const unitCode = String(unit.unit_code || unit.unitCode || "").toUpperCase();
      const unitName = String(unit.unit_name || unit.unitName || "").trim().toLowerCase();
      const sameCode = unitCode === finalUnitCode.toUpperCase();
      const sameName = unitName === finalUnitName.toLowerCase();
      const sameRecord = editingUnitId && String(unit.id) === String(editingUnitId);

      return !sameRecord && (sameCode || sameName);
    });

    if (duplicateUnit) {
      setUnitError(`ខ្នាតទំនិញ "${finalUnitName}" មានរួចហើយ ។ សូមកែខ្នាតទំនិញដែលមានស្រាប់ ឬប្រើឈ្មោះផ្សេង ។`);
      return;
    }

    const payload = {
      unit_code: finalUnitCode.toUpperCase(),
      unit_name: finalUnitName,
      unit_type: getSuggestedUnitType(finalUnitName),
      allow_decimal: Boolean(quickUnit.allow_decimal),
      status: quickUnit.status || "active",
    };
    try {
      if (editingUnitId) {
        if (!onUpdateUnit) { alert("Update unit handler is missing."); return; }
        await onUpdateUnit({ id: editingUnitId, payload });
        resetForm();
        return;
      }
      if (!onCreateUnit) { alert("Create unit handler is missing."); return; }
      await onCreateUnit(payload);
      onCreated?.();
    } catch (error) {
      const validationMessage =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
        "មិនអាចរក្សាទុកខ្នាតទំនិញបានទេ ។ សូមពិនិត្យឈ្មោះ/លេខកូដខ្នាតទំនិញ ។";

      setUnitError(validationMessage);
    }
  };

  const handleDelete = async (unit) => {
    const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុបខ្នាតទំនិញ "${unit.unit_name || unit.unitName || unit.unit_code}" មែនទេ?`);
    if (!ok) return;
    if (!onDeleteUnit) { alert("Delete unit handler is missing."); return; }
    await onDeleteUnit(unit.id);
    if (editingUnitId === unit.id) resetForm();
  };

  return (
    <div className={`mb-4 rounded-xl border p-4 ${theme.softCard}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{editingUnitId ? "ធ្វើបច្ចុប្បន្នភាពខ្នាតទំនិញ" : "បង្កើតខ្នាតទំនិញថ្មី"}</p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            លេខកូដស្វ័យប្រវត្ដិ ។ ឧ: Small Bottle → SMALL_BOTTLE ។ ដប → DB ។
          </p>
        </div>
        <div className="flex gap-2">
          {editingUnitId && (
            <button type="button" onClick={resetForm}
              className="quick-action-icon-3d rounded-lg bg-zinc-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-600">ថ្មី</button>
          )}
          <button type="button" onClick={onClose}
            className="quick-action-icon-3d rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600">បិទ</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <label className="block md:col-span-1">
          <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>ឈ្មោះខ្នាតទំនិញ *</span>
          <input value={quickUnit.unit_name}
            onChange={(e) => {
              const n = sanitizeUnitNameInput(e.target.value);
              setQuickUnit((p) => ({
                ...p,
                unit_name: n,
                unit_code: generateUnitCode(n),
                unit_type: detectUnitType(n),
              }));
            }}
            placeholder="Case"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
        </label>
        <label className="block md:col-span-1">
          <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>លេខកូដខ្នាតទំនិញ</span>
          <input value={quickUnit.unit_code}
            onChange={(e) => setQuickUnit((p) => ({ ...p, unit_code: generateUnitCode(e.target.value) }))}
            placeholder="CASE"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`} />
        </label>
        <label className="block md:col-span-1">
          <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>ប្រភេទខ្នាតទំនិញ</span>
          <div className={`flex h-11 items-center rounded-xl border px-3 text-sm ${theme.softCard}`}>
            {unitTypeDisplay(getSuggestedUnitType())}
          </div>
        </label>
        <div className="md:col-span-1">
          <SearchableDropdown
            label="ស្ថានភាព"
            theme={theme}
            value={quickUnit.status}
            onChange={(value) => setQuickUnit((previous) => ({ ...previous, status: value }))}
            options={[
              { value: "active", label: "ដំណើរការ" },
              { value: "inactive", label: "មិនដំណើរការ" },
            ]}
            searchable={false}
          />
        </div>
        <div className="flex items-end">
          <button type="button" disabled={isCreatingUnit || isUpdatingUnit} onClick={handleSave}
            className="quick-action-icon-3d h-11 w-full rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            {editingUnitId ? (isUpdatingUnit ? "កំពុងធ្វើបច្ចុប្បន្នភាព..." : "ធ្វើបច្ចុប្បន្នភាព") : (isCreatingUnit ? "កំពុងបង្កើត..." : "រក្សាទុកខ្នាតទំនិញ")}
          </button>
        </div>
      </div>

      {unitError && (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
          {unitError}
        </div>
      )}

      <label className={`mt-3 flex cursor-pointer items-center gap-2 text-xs ${theme.muted}`}>
        <input type="checkbox" checked={Boolean(quickUnit.allow_decimal)}
          onChange={(e) => setQuickUnit((p) => ({ ...p, allow_decimal: e.target.checked }))}
          className="h-4 w-4 rounded" />
        អនុញ្ញាតបរិមាណទសភាគ
      </label>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold">ខ្នាតទំនិញដែលមានស្រាប់</p>
        {units.length === 0 ? (
          <div className={`rounded-xl border px-4 py-3 text-xs ${theme.softCard}`}>មិនទាន់មានខ្នាតទំនិញ ។</div>
        ) : (
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {units.map((unit) => (
              <div key={unit.id} className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${theme.softCard}`}>
                <div>
                  <p className="text-sm font-semibold">{unit.unit_name || unit.unitName || "-"}</p>
                  <p className={`mt-1 text-xs ${theme.muted}`}>
                    លេខកូដ: {unit.unit_code || "-"} · ប្រភេទ: {unitTypeDisplay(unit.unit_type || "piece")} · {unit.allow_decimal ? "ទសភាគ" : "គ្មានទសភាគ"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(unit)}
                    className="quick-action-icon-3d rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700">កែ</button>
                  <button type="button" disabled={isDeletingUnit} onClick={() => handleDelete(unit)}
                    className="quick-action-icon-3d rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                    {isDeletingUnit ? "កំពុងលុប..." : "លុប"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`mt-2 text-[11px] leading-4 ${theme.muted}`}>
          ចំណាំ: ការលុបអាចបរាជ័យ ប្រសិនបើខ្នាតទំនិញនេះត្រូវបានប្រើដោយ មុខទំនិញ ។
        </p>
      </div>
    </div>
  );
}

function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="summary-icon-3d mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">{icon}</div>
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
    <div>
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/0 p-3 transition hover:border-red-400 hover:bg-red-500/[0.03] focus-within:border-red-500 focus-within:bg-red-500/[0.04] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-red-500 dark:focus-within:border-red-500">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="summary-icon-3d flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
            {previewUrl ? <img src={previewUrl} alt="Selected" className="h-full w-full object-cover" /> : <FiImage className="text-3xl text-red-500" />}
          </div>
          <input id={inputId} type="file" accept="image/*" className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <label htmlFor={inputId}
                className="quick-action-icon-3d inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-700">
                <FiImage className="text-lg" /> {previewUrl ? "ប្ដូររូបភាព" : "ជ្រើសរើសរូបភាព"}
              </label>
              {previewUrl && (
                <button type="button" onClick={handleRemoveImage}
                  className="table-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">
                  <FiXCircle className="text-base" /> លុប
                </button>
              )}
            </div>
            <p className={`mt-2 truncate text-xs ${theme.muted}`}>
              {fileName || "JPG, PNG, WEBP · Max 2 MB"}
            </p>
            {previewFile instanceof File && <p className="mt-1 text-xs text-zinc-400">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label, required = false, error = "", theme, icon, inputProps,
  type = "text", placeholder = "", inputMode, sanitize = "none", allowDecimal = true, hint,
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
      {hint && <p className={`mt-1 text-xs ${theme.muted}`}>{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function PackageTypeCombobox({ label, required = false, error = "", theme, value = "", onChange }) {
  return (
    <div>
      <CreatableOptionSelect
        label={label}
        required={required}
        theme={theme}
        icon={<FiBox />}
        value={value}
        onChange={onChange}
        groups={[{ options: PACKAGE_TYPES }]}
        placeholder="-- រើស --"
        searchPlaceholder="ស្វែងរក ឬបញ្ចូលសណ្ឋានថ្មី"
        hint="មិនឃើញ? វាយសណ្ឋានថ្មី រួចចុចបន្ថែម។"
        createLabel="បន្ថែម"
        existingLabel="ជម្រើសដែលមានស្រាប់"
        widthClass="w-full"
        menuWidthClass="w-full"
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
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

function FormSelectRHF({ label, required = false, error = "", theme, icon, value, onChange, inputProps, options }) {
  const handleChange = (nextValue) => {
    if (onChange) {
      onChange(nextValue);
      return;
    }

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
    <div className={`rounded-xl border p-3 ${highlight ? "border-emerald-500/40 bg-emerald-500/6" : theme.softCard}`}>
      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      <p className="mt-1.5 font-bold">{value}</p>
    </div>
  );
}
