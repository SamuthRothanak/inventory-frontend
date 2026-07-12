import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiHash,
  FiInfo,
  FiPackage,
  FiSave,
  FiTruck,
} from "react-icons/fi";
import { convertCost, formatCurrencyPair } from "../utils/purchaseUtils";
import { createPurchaseItemSchema } from "../schemas/purchaseSchemas";
import { FormInput, FormSection, FormSelect, ModalShell, SummaryMiniBox } from "./PurchaseCommon";

const PURCHASE_UNIT_KEYWORDS = ["case", "carton", "box", "pack", "crate", "dozen", "bundle", "tray"];

function getPurchaseUnitOptions(variantUnits = []) {
  const defaultPurchaseUnits = variantUnits.filter((unit) => unit.isDefaultPurchaseUnit);
  if (defaultPurchaseUnits.length > 0) return defaultPurchaseUnits;

  const packageUnits = variantUnits.filter((unit) => {
    const name = String(unit.unitName || "").toLowerCase();
    const code = String(unit.unitCode || "").toLowerCase();
    return PURCHASE_UNIT_KEYWORDS.some((keyword) => name.includes(keyword) || code.includes(keyword));
  });

  return packageUnits.length > 0 ? packageUnits : variantUnits;
}

function ItemPaymentModeHint({ mode }) {
  if (mode === "pay_after_check") {
    return (
      <div className="rounded-xl bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-400">
        បង់ប្រាក់ក្រោយពិនិត្យ: បង់តែចំនួនទទួលយក។ ចំនួនខូចត្រូវបានដកចេញពីការទូទាត់។
      </div>
    );
  }

  if (mode === "prepaid") {
    return (
      <div className="rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-400">
        បង់ជាមុន: ចំនួនបានបង់ស្មើចំនួនកម្មង់។ ចំនួនខូចក្លាយជាការទាមទារ អ្នកផ្គត់ផ្គង់។
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-400">
      បង់ជាមុនមួយផ្នែក: បញ្ចូលចំនួនបានបង់ដោយខ្លួនឯង។ ការទាមទារគណនាពីចំនួនបានបង់លើសចំនួនទទួលយក។
    </div>
  );
}

export function PurchaseItemModal({
  mode,
  form,
  errors,
  variantUnits,
  exchangeRateUsed,
  paymentMode,
  theme,
  onChange,
  onClose,
  onSave,
}) {
  const isReceiveMode = mode === "receive";
  const {
    control,
    handleSubmit,
    formState: { errors: hookErrors },
  } = useForm({
    resolver: zodResolver(createPurchaseItemSchema(paymentMode)),
    values: form,
    mode: "onChange",
  });
  const fieldError = (field) => hookErrors[field]?.message || errors[field] || "";
  const bindField = (field, controllerOnChange) => (value) => {
    controllerOnChange(value);
    onChange(field, value);
  };
  const purchaseUnitOptions = getPurchaseUnitOptions(variantUnits);
  const selectedUnit = variantUnits.find((unit) => String(unit.id) === String(form.variantUnitId));
  const invoicedQty = Number(form.invoicedQty || 0);
  const paidQty =
    paymentMode === "pay_after_check"
      ? Number(form.acceptedQty || 0)
      : paymentMode === "prepaid"
        ? invoicedQty
        : Number(form.paidQty || 0);
  const acceptedQty = Number(form.acceptedQty || 0);
  const damagedQty = Number(form.damagedQty || 0);
  const claimQty =
    paymentMode === "prepaid"
      ? damagedQty
      : paymentMode === "pay_after_check"
        ? 0
        : Math.max(0, paidQty - acceptedQty);
  const inputCurrency = form.inputCurrency || "USD";
  const inputUnitCost = Number(form.inputUnitCost || form.unitCost || 0);
  const { unitCostUsd, unitCostKhr } = convertCost({
    inputCurrency,
    inputUnitCost,
    exchangeRate: exchangeRateUsed,
  });
  const payableQty = paymentMode === "pay_after_check" ? acceptedQty : paidQty;
  const exactInvoiceTotal = Number(form.invoiceTotal || 0);
  const exactPaidAmount = Number(form.paidAmount || 0);
  let inputLineTotal = payableQty * inputUnitCost;
  if (paymentMode !== "pay_after_check" && exactPaidAmount > 0) {
    inputLineTotal = exactPaidAmount;
  } else if (exactInvoiceTotal > 0 && invoicedQty > 0 && Math.abs(payableQty - invoicedQty) < 0.0001) {
    inputLineTotal = exactInvoiceTotal;
  }
  const lineTotalUsd =
    inputCurrency === "KHR" ? Number((inputLineTotal / Number(exchangeRateUsed || 1)).toFixed(2)) : Number(inputLineTotal.toFixed(2));
  const lineTotalKhr =
    inputCurrency === "KHR" ? Number(inputLineTotal.toFixed(2)) : Number((inputLineTotal * Number(exchangeRateUsed || 0)).toFixed(2));
  const isPartialPrepaidCreate = !isReceiveMode && (paymentMode === "partial_prepaid" || paymentMode === "pay_after_check" || paymentMode === "prepaid");
  const modalTitle = mode === "add" ? "បន្ថែមទំនិញការទិញ" : isReceiveMode ? "ទទួលទំនិញការទិញ" : "កែទំនិញការទិញ";
  const modalSubtitle = isReceiveMode
    ? "បញ្ចូលចំនួនទទួល, ខូច, ទទួលបាន, និងថ្ងៃផុតកំណត់សម្រាប់បន្ទាត់វិក្កយបត្រនេះ។"
    : "កំណត់តម្លៃ, ចំនួន, លទ្ធផលទទួល, និងថ្ងៃផុតកំណត់សម្រាប់បន្ទាត់វិក្កយបត្រនេះ។";

  return (
    <ModalShell
      title={modalTitle}
      subtitle={modalSubtitle}
      theme={theme}
      onClose={onClose}
      width="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={handleSubmit(() => onSave())}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            <FiSave /> {isReceiveMode ? "រក្សាទំនិញទទួល" : "រក្សាទំនិញ"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!isReceiveMode && <ItemPaymentModeHint mode={paymentMode} />}

        <FormSection
          title={isReceiveMode ? "លទ្ធផលទទួល" : "ទំនិញការទិញ"}
          subtitle={isReceiveMode ? "ផលិតផល, តម្លៃ, និងចំនួនកម្មង់ចាក់សោ។ កែតែលទ្ធផលទទួល។" : "ជ្រើសUnit ផលិតផល ហើយបញ្ចូលចំនួនកម្មង់/ទទួល។"}
          icon={<FiPackage />}
          theme={theme}
        >
          {isReceiveMode && selectedUnit && (
            <div className={`mb-4 rounded-2xl border p-4 ${theme.softCard}`}>
              <p className="text-sm font-bold">{selectedUnit.variantName}</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                {selectedUnit.variantCode} - {selectedUnit.unitName} = {selectedUnit.conversionQty} {selectedUnit.baseUnit}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                <SummaryMiniBox theme={theme} label="ចំនួនកម្មង់" value={`${invoicedQty} ${selectedUnit.unitName}`} />
                <SummaryMiniBox theme={theme} label="បានបង់" value={`${paidQty} ${selectedUnit.unitName}`} />
                <SummaryMiniBox theme={theme} label="តម្លៃទិញចូល" value={formatCurrencyPair(unitCostUsd, unitCostKhr)} />
                <SummaryMiniBox theme={theme} label="សរុបបច្ចុប្បន្ន" value={formatCurrencyPair(lineTotalUsd, lineTotalKhr)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {!isReceiveMode && <Controller
              control={control}
              name="variantUnitId"
              render={({ field }) => (
                <FormSelect
                  label="ប្រភេទផលិតផល / ខ្នាត"
                  required
                  value={field.value}
                  error={fieldError("variantUnitId")}
                  onChange={bindField("variantUnitId", field.onChange)}
                  theme={theme}
                  icon={<FiPackage />}
                  options={[
                    { value: "", label: "ជ្រើសប្រភេទផលិតផល" },
                    ...purchaseUnitOptions.map((unit) => ({
                      value: unit.id,
                      label: `${unit.variantName} - ${unit.unitName}${unit.conversionQty > 1 ? ` (${unit.conversionQty} ${unit.baseUnit})` : ""}`,
                    })),
                  ]}
                  searchable
                />
              )}
            />}
            {!isReceiveMode && <Controller
              control={control}
              name="inputCurrency"
              render={({ field }) => (
                <FormSelect
                  label="រូបិយប័ណ្ណបញ្ចូល"
                  required
                  value={field.value}
                  error={fieldError("inputCurrency")}
                  onChange={bindField("inputCurrency", field.onChange)}
                  theme={theme}
                  icon={<FiDollarSign />}
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "KHR", label: "KHR" },
                  ]}
                />
              )}
            />}
            {!isReceiveMode && <Controller
              control={control}
              name="invoicedQty"
              render={({ field }) => (
                <FormInput
                  label="ចំនួនកម្មង់"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("invoicedQty")}
                  onChange={bindField("invoicedQty", field.onChange)}
                  theme={theme}
                  icon={<FiHash />}
                  decimalPlaces={4}
                />
              )}
            />}
            {!isReceiveMode && <Controller
              control={control}
              name="invoiceTotal"
              render={({ field }) => (
                <FormInput
                  label="សរុបលុយវិក្កយបត្រ"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("invoiceTotal")}
                  onChange={bindField("invoiceTotal", field.onChange)}
                  theme={theme}
                  placeholder="0.00"
                  decimalPlaces={2}
                  icon={form.inputCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />}
                />
              )}
            />}
            {!isReceiveMode && <Controller
              control={control}
              name="inputUnitCost"
              render={({ field }) => (
                <FormInput
                  label="តម្លៃទិញចូល (auto)"
                  type="number"
                  value={field.value}
                  error={fieldError("inputUnitCost")}
                  onChange={bindField("inputUnitCost", field.onChange)}
                  theme={theme}
                  placeholder="0.00"
                  decimalPlaces={2}
                  icon={form.inputCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />}
                />
              )}
            />}
            {!isReceiveMode && paymentMode === "partial_prepaid" && (
              <Controller
                control={control}
                name="paidAmount"
                render={({ field }) => (
                  <FormInput
                    label="ទឹកប្រាក់បានបង់"
                    required
                    type="number"
                    value={field.value}
                    error={fieldError("paidAmount")}
                    onChange={bindField("paidAmount", field.onChange)}
                    theme={theme}
                    placeholder="0.00"
                    decimalPlaces={2}
                    icon={form.inputCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />}
                  />
                )}
              />
            )}
            {!isPartialPrepaidCreate && <Controller
              control={control}
              name="receivedQty"
              render={({ field }) => (
                <FormInput
                  label="ចំនួនទទួល"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("receivedQty")}
                  onChange={bindField("receivedQty", field.onChange)}
                  theme={theme}
                  icon={<FiTruck />}
                  decimalPlaces={4}
                />
              )}
            />}
            {!isPartialPrepaidCreate && <Controller
              control={control}
              name="damagedQty"
              render={({ field }) => (
                <FormInput
                  label="ចំនួនខូច"
                  type="number"
                  value={field.value}
                  error={fieldError("damagedQty")}
                  onChange={bindField("damagedQty", field.onChange)}
                  theme={theme}
                  icon={<FiAlertTriangle />}
                  decimalPlaces={4}
                />
              )}
            />}
            {!isPartialPrepaidCreate && <Controller
              control={control}
              name="acceptedQty"
              render={({ field }) => (
                <FormInput
                  label="ចំនួនទទួលយក"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("acceptedQty")}
                  onChange={bindField("acceptedQty", field.onChange)}
                  theme={theme}
                  icon={<FiCheckCircle />}
                  decimalPlaces={4}
                />
              )}
            />}
            {!isPartialPrepaidCreate && <Controller
              control={control}
              name="expiredDate"
              render={({ field }) => (
                <FormInput
                  label="ថ្ងៃផុតកំណត់"
                  type="date"
                  value={field.value}
                  error={fieldError("expiredDate")}
                  onChange={bindField("expiredDate", field.onChange)}
                  theme={theme}
                  icon={<FiCalendar />}
                />
              )}
            />}
          </div>

          {isPartialPrepaidCreate && (
            <div className="mt-4 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
              ចំនួនទទួល, ខូច, ទទួលយក និងថ្ងៃផុតកំណត់ នឹងបំពេញនៅពេល "ទទួលទំនិញ"។
            </div>
          )}
        </FormSection>

        {selectedUnit && !isReceiveMode && paymentMode === "partial_prepaid" && (() => {
          const paid = Number(form.paidAmount || 0);
          const total = Number(form.invoiceTotal || 0);
          const balance = Math.max(0, total - paid);
          return (
            <FormSection
              title="សង្ខេបការបង់ប្រាក់"
              subtitle="ទឹកប្រាក់បានបង់ និងចំនួននៅខ្វះ"
              icon={<FiInfo />}
              theme={theme}
            >
              <div className="grid grid-cols-2 gap-4">
                <SummaryMiniBox theme={theme} label="ទឹកប្រាក់បានបង់" value={`$${paid.toFixed(2)}`} />
                <SummaryMiniBox theme={theme} label="ទឹកប្រាក់នៅខ្វះ" value={`$${balance.toFixed(2)}`} strong />
              </div>
            </FormSection>
          );
        })()}
      </div>
    </ModalShell>
  );
}
