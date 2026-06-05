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
  FiSearch,
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
        Pay After Check: pay only accepted quantity. Damaged quantity is excluded from payment.
      </div>
    );
  }

  if (mode === "prepaid") {
    return (
      <div className="rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-400">
        Prepaid: paid quantity equals invoiced quantity. Damaged quantity becomes supplier claim.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-400">
      Partial Prepaid: enter paid quantity manually. Claim is calculated when paid quantity is greater than accepted quantity.
    </div>
  );
}

export function PurchaseItemModal({
  mode,
  form,
  errors,
  variantUnits,
  variantUnitSearch,
  setVariantUnitSearch,
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
  const lineTotalUsd = paymentMode === "pay_after_check" ? acceptedQty * unitCostUsd : paidQty * unitCostUsd;
  const lineTotalKhr = paymentMode === "pay_after_check" ? acceptedQty * unitCostKhr : paidQty * unitCostKhr;
  const isPrepaidWaiting = paymentMode === "prepaid" && Number(form.receivedQty || 0) === 0;
  const modalTitle = mode === "add" ? "Add Purchase Item" : isReceiveMode ? "Receive Purchase Item" : "Edit Purchase Item";
  const modalSubtitle = isReceiveMode
    ? "Enter received, damaged, accepted quantity, and expiry date for this invoice line."
    : "Set cost, quantity, receiving result, and expiry for this invoice line.";

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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(() => onSave())}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            <FiSave /> {isReceiveMode ? "Save Receiving Item" : "Save Item"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!isReceiveMode && <ItemPaymentModeHint mode={paymentMode} />}

        <FormSection
          title={isReceiveMode ? "Receiving Result" : "Purchase Item"}
          subtitle={isReceiveMode ? "The product, cost, and invoiced quantity are locked. Update only receiving result." : "Choose a product unit and enter invoice/receiving quantities."}
          icon={<FiPackage />}
          theme={theme}
        >
          {!isReceiveMode && <div className="mb-4">
            <FormInput
              label="Search Product Variant"
              value={variantUnitSearch}
              onChange={setVariantUnitSearch}
              theme={theme}
              placeholder="Search variant, SKU, product..."
              icon={<FiSearch />}
            />
          </div>}

          {isReceiveMode && selectedUnit && (
            <div className={`mb-4 rounded-2xl border p-4 ${theme.softCard}`}>
              <p className="text-sm font-bold">{selectedUnit.variantName}</p>
              <p className={`mt-1 text-xs ${theme.muted}`}>
                {selectedUnit.variantCode} - {selectedUnit.unitName} = {selectedUnit.conversionQty} {selectedUnit.baseUnit}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                <SummaryMiniBox theme={theme} label="Invoiced" value={`${invoicedQty} ${selectedUnit.unitName}`} />
                <SummaryMiniBox theme={theme} label="Paid" value={`${paidQty} ${selectedUnit.unitName}`} />
                <SummaryMiniBox theme={theme} label="Unit Cost" value={formatCurrencyPair(unitCostUsd, unitCostKhr)} />
                <SummaryMiniBox theme={theme} label="Current Total" value={formatCurrencyPair(lineTotalUsd, lineTotalKhr)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {!isReceiveMode && <Controller
              control={control}
              name="variantUnitId"
              render={({ field }) => (
                <FormSelect
                  label="Product Variant / Unit"
                  required
                  value={field.value}
                  error={fieldError("variantUnitId")}
                  onChange={bindField("variantUnitId", field.onChange)}
                  theme={theme}
                  icon={<FiPackage />}
                  options={[
                    { value: "", label: "Select product variant" },
                    ...purchaseUnitOptions.map((unit) => ({
                      value: unit.id,
                      label: `${unit.variantName} - ${unit.unitName}${unit.conversionQty > 1 ? ` (${unit.conversionQty} ${unit.baseUnit})` : ""}`,
                    })),
                  ]}
                />
              )}
            />}
            {!isReceiveMode && <Controller
              control={control}
              name="inputCurrency"
              render={({ field }) => (
                <FormSelect
                  label="Input Currency"
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
              name="inputUnitCost"
              render={({ field }) => (
                <FormInput
                  label="Input Unit Cost"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("inputUnitCost")}
                  onChange={bindField("inputUnitCost", field.onChange)}
                  theme={theme}
                  placeholder="0.00"
                  icon={form.inputCurrency === "KHR" ? <span className="text-xs font-bold">KHR</span> : <FiDollarSign />}
                />
              )}
            />}
            {!isReceiveMode && <Controller
              control={control}
              name="invoicedQty"
              render={({ field }) => (
                <FormInput
                  label="Invoiced Qty"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("invoicedQty")}
                  onChange={bindField("invoicedQty", field.onChange)}
                  theme={theme}
                  icon={<FiHash />}
                />
              )}
            />}
            {!isReceiveMode && paymentMode === "partial_prepaid" && (
              <Controller
                control={control}
                name="paidQty"
                render={({ field }) => (
                  <FormInput
                    label="Paid Qty"
                    required
                    type="number"
                    value={field.value}
                    error={fieldError("paidQty")}
                    onChange={bindField("paidQty", field.onChange)}
                    theme={theme}
                    icon={<FiCreditCard />}
                  />
                )}
              />
            )}
            <Controller
              control={control}
              name="receivedQty"
              render={({ field }) => (
                <FormInput
                  label="Received Qty"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("receivedQty")}
                  onChange={bindField("receivedQty", field.onChange)}
                  theme={theme}
                  icon={<FiTruck />}
                />
              )}
            />
            <Controller
              control={control}
              name="damagedQty"
              render={({ field }) => (
                <FormInput
                  label="Damaged Qty"
                  type="number"
                  value={field.value}
                  error={fieldError("damagedQty")}
                  onChange={bindField("damagedQty", field.onChange)}
                  theme={theme}
                  icon={<FiAlertTriangle />}
                />
              )}
            />
            <Controller
              control={control}
              name="acceptedQty"
              render={({ field }) => (
                <FormInput
                  label="Accepted Qty"
                  required
                  type="number"
                  value={field.value}
                  error={fieldError("acceptedQty")}
                  onChange={bindField("acceptedQty", field.onChange)}
                  theme={theme}
                  icon={<FiCheckCircle />}
                />
              )}
            />
            <Controller
              control={control}
              name="expiredDate"
              render={({ field }) => (
                <FormInput
                  label="Expiry Date"
                  type="date"
                  value={field.value}
                  error={fieldError("expiredDate")}
                  onChange={bindField("expiredDate", field.onChange)}
                  theme={theme}
                  icon={<FiCalendar />}
                />
              )}
            />
          </div>

          {isPrepaidWaiting && (
            <div className="mt-4 rounded-xl bg-blue-500/10 p-4 text-sm text-blue-700 dark:text-blue-300">
              Goods are not received yet. This purchase will wait in Pending Receive until receiving is recorded.
            </div>
          )}
        </FormSection>

        {selectedUnit && !isReceiveMode && (
          <FormSection
            title="Calculation Preview"
            subtitle={`${selectedUnit.unitName} purchase unit${selectedUnit.conversionQty > 1 ? ` converts to ${selectedUnit.conversionQty} ${selectedUnit.baseUnit}` : ""}`}
            icon={<FiInfo />}
            theme={theme}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <SummaryMiniBox theme={theme} label="Paid Qty" value={`${paidQty} ${selectedUnit.unitName}`} />
              <SummaryMiniBox
                theme={theme}
                label="Stock In Preview"
                value={`${acceptedQty * Number(selectedUnit.conversionQty || 1)} ${selectedUnit.baseUnit}`}
              />
              <SummaryMiniBox theme={theme} label="Claim Qty" value={`${claimQty} ${selectedUnit.unitName}`} />
              <SummaryMiniBox theme={theme} label="Unit Cost" value={formatCurrencyPair(unitCostUsd, unitCostKhr)} />
              <SummaryMiniBox theme={theme} label="Line Total" value={formatCurrencyPair(lineTotalUsd, lineTotalKhr)} strong />
            </div>
          </FormSection>
        )}
      </div>
    </ModalShell>
  );
}
