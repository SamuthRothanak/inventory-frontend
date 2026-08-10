import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiEye,
  FiFileText,
  FiFilter,
  FiHash,
  FiInfo,
  FiPackage,
  FiPlus,
  FiRotateCcw,
  FiShoppingCart,
  FiTrash,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  deliveryOptions,
  paymentModeOptions,
  paymentStatusOptions,
} from "../utils/purchaseConstants";
import { calculateCurrencyPreview, formatCurrencyPair, formatDateOnly } from "../utils/purchaseUtils";
import { purchaseFormSchema } from "../schemas/purchaseSchemas";
import { EmptyState, FormInput, FormSection, FormSelect, FormTextarea, ModalShell, SummaryMiniBox } from "./PurchaseCommon";

// Damaged items resolved as credit_note within the SAME claim/invoice each get their own
// SupplierCredit ledger row on the backend (needed there for per-item traceability), but they're
// one invoice's worth of credit, not independent things to pick and choose between — group them
// so checking one box selects the WHOLE source purchase's credit, not just one product line's cut.
function groupAvailableCreditsBySourcePurchase(credits) {
  const groups = new Map();
  credits.forEach((credit) => {
    const key = credit.source_purchase_id ?? `standalone-${credit.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        sourcePurchaseNo: credit.source_purchase?.purchase_no || credit.source_purchase_id || "-",
        amountUsd: 0,
        amountKhr: 0,
        creditIds: [],
      });
    }
    const group = groups.get(key);
    group.amountUsd += Number(credit.remaining_usd || 0);
    group.amountKhr += Number(credit.remaining_khr || 0);
    group.creditIds.push(Number(credit.id));
  });
  return Array.from(groups.values());
}

function DeliveryChoiceCards({ theme, value, onChange, options, error = "" }) {
  const choices = options.filter((option) => option.value);
  const iconMap = {
    supplier_delivery: <FiTruck />,
    self_pickup: <FiCheckCircle />,
    third_party: <FiPackage />,
  };
  const helperMap = {
    supplier_delivery: "អ្នកផ្គត់ផ្គង់ដឹកមកហាង",
    self_pickup: "មិនគិតថ្លៃដឹក",
    third_party: "ជួលអ្នកផ្សេងដឹកមកហាង",
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-xs font-semibold ${theme.muted}`}>ជម្រើសដឹក <span className="text-red-400">*</span></span>
        {!value && <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">មិនទាន់ជ្រើស</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {choices.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex min-h-[82px] items-center gap-3 rounded-xl border px-4 text-left transition ${
                selected
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : `${theme.input} ${theme.text} hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10`
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "quick-action-icon-3d bg-emerald-600 text-white" : "table-icon-3d bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300"}`}>
                {iconMap[option.value] || <FiTruck />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold">{option.label}</span>
                <span className={`mt-1 block truncate text-xs ${selected ? "text-emerald-700 dark:text-emerald-300" : theme.muted}`}>
                  {helperMap[option.value]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>}
    </div>
  );
}

function DeliveryFeeChoice({ theme, value, onChange }) {
  const choices = [
    { value: "free", label: "មិនគិតថ្លៃ", helper: "អ្នកផ្គត់ផ្គង់ដឹកដោយឥតគិតថ្លៃ" },
    { value: "paid", label: "មានថ្លៃដឹក", helper: "ហាងត្រូវបង់ថ្លៃដឹកបន្ថែម" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => onChange(choice.value)}
            className={`flex min-h-[76px] items-center gap-3 rounded-xl border px-4 text-left transition ${
              selected
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                : `${theme.input} ${theme.text} hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10`
            }`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "quick-action-icon-3d bg-emerald-600 text-white" : "table-icon-3d bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300"}`}>
              {choice.value === "free" ? <FiCheckCircle /> : <FiDollarSign />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold">{choice.label}</span>
              <span className={`mt-1 block text-xs ${selected ? "text-emerald-700 dark:text-emerald-300" : theme.muted}`}>
                {choice.helper}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PurchaseFormModal({

  mode,

  form,

  errors,

  items,

  suppliers,

  theme,

  onChange,

  onAddItem,

  onEditItem,

  onRemoveItem,

  onClose,

  onSavePrimary,

  primarySaveLabel,

  isSaving = false,

  supplierCreditBalance = null,

  creditAppliedMaxUsd = 0,

}) {
  const {
    control,
    handleSubmit,
    formState: { errors: hookErrors },
  } = useForm({
    resolver: zodResolver(purchaseFormSchema),
    values: form,
    mode: "onChange",
  });
  const fieldError = (field) => hookErrors[field]?.message || errors[field] || "";
  const bindField = (field, controllerOnChange) => (value) => {
    controllerOnChange(value);
    onChange(field, value);
  };

  const isReceiveMode = mode === "receive_goods";
  const isPayAfterCheck = form.paymentMode === "pay_after_check";
  const isPartialPrepaid = form.paymentMode === "partial_prepaid";
  const supportsDeliveryFee = ["supplier_delivery", "third_party"].includes(form.deliveryOption);
  const availableCreditUsd = Number(supplierCreditBalance?.available_usd || 0);
  const availableCreditKhr = Number(supplierCreditBalance?.available_khr || 0);
  const hasAvailableSupplierCredit = availableCreditUsd > 0 || availableCreditKhr > 0;
  // Where this balance actually came from — shown so the user isn't asked to trust/apply an
  // unfamiliar number with no traceable origin (see the supplier's own Credit History for the
  // full ledger; this is just the still-available portion, scoped to this one form).
  const availableSupplierCredits = Array.isArray(supplierCreditBalance?.credits)
    ? supplierCreditBalance.credits.filter((credit) => credit.status === "available")
    : [];
  // One selectable row per SOURCE PURCHASE, not per underlying ledger row — two damaged items
  // claimed within the same invoice are one invoice's worth of credit, not two independent
  // things to pick between.
  const groupedAvailableCredits = groupAvailableCreditsBySourcePurchase(availableSupplierCredits);
  const [deliveryFeeMode, setDeliveryFeeMode] = React.useState(Number(form.deliveryFee || 0) > 0 ? "paid" : "free");
  const hasDeliveryFee = supportsDeliveryFee && deliveryFeeMode === "paid";
  const shouldShowBalance = isPayAfterCheck || form.paymentStatus === "partial";
  const hasDiscountValue = Number(form.discountTotal || 0) > 0;
  const [showDiscountFields, setShowDiscountFields] = React.useState(hasDiscountValue);
  const invoiceCurrencies = Array.from(
    new Set(
      items
        .map((item) => String(item.inputCurrency || "").toUpperCase())
        .filter((currency) => currency === "USD" || currency === "KHR")
    )
  );
  const isMixedInvoiceCurrency = invoiceCurrencies.length > 1;
  const invoiceCurrency = isMixedInvoiceCurrency
    ? form.discountCurrency || "USD"
    : invoiceCurrencies[0] || form.inputCurrency || "USD";

  React.useEffect(() => {
    if (hasDiscountValue) setShowDiscountFields(true);
  }, [hasDiscountValue]);

  React.useEffect(() => {
    if (!isMixedInvoiceCurrency && showDiscountFields && (form.discountType || "amount") === "amount" && form.discountCurrency !== invoiceCurrency) {
      onChange("discountCurrency", invoiceCurrency);
    }
  }, [form.discountCurrency, form.discountType, invoiceCurrency, isMixedInvoiceCurrency, onChange, showDiscountFields]);

  React.useEffect(() => {
    if (!hasDeliveryFee && Number(form.deliveryFee || 0) !== 0) {
      onChange("deliveryFee", 0);
    }
  }, [form.deliveryFee, hasDeliveryFee, onChange]);

  React.useEffect(() => {
    if (!supportsDeliveryFee) setDeliveryFeeMode("free");
  }, [supportsDeliveryFee]);

  const title = mode === "add" ? "បន្ថែមការទិញ" : isReceiveMode ? "ទទួលទំនិញ" : "កែការទិញ";

  const currencyPreview = calculateCurrencyPreview({ items, form });
  const paidAmountLabel =
    form.paidCurrency === "KHR"
      ? `៛${Number(currencyPreview.paidAmountKhr || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : `$${Number(currencyPreview.paidAmountUsd || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const paidAmountFieldLabel = form.paymentMode === "partial_prepaid" ? "ចំនួនបង់មុន" : "ចំនួនបានបង់";
  const paidAmountSummaryLabel = form.paymentMode === "partial_prepaid" ? "បានបង់មុន" : "ចំនួនបានបង់";
  // Includes credit applied, not just cash paid — otherwise this stayed frozen at the same % even
  // though "នៅសល់ត្រូវបង់" right below it visibly drops once supplier credit is applied, reading
  // as if credit hadn't done anything at all.
  const paidProgress = currencyPreview.grandTotalUsd > 0
    ? Math.min(100, Math.max(0, ((currencyPreview.paidAmountUsd + (currencyPreview.creditAppliedUsd || 0)) / currencyPreview.grandTotalUsd) * 100))
    : 0;
  const hasReceivePaymentContext =
    isReceiveMode && (
      Number(currencyPreview.paidAmountUsd || 0) > 0 ||
      Number(currencyPreview.paidAmountKhr || 0) > 0 ||
      Number(currencyPreview.balanceUsd || 0) > 0 ||
      Number(currencyPreview.balanceKhr || 0) > 0
    );
  const getItemDisplayTotal = (item) => {
    const lineTotalUsd = Number(item.lineTotalUsd ?? item.lineTotal ?? 0);
    const lineTotalKhr = Number(item.lineTotalKhr ?? 0);
    if (lineTotalUsd > 0 || lineTotalKhr > 0) {
      return { usd: lineTotalUsd, khr: lineTotalKhr };
    }

    const invoiceTotal = Number(item.invoiceTotal || 0) || Number(item.inputUnitCost || item.unitCost || 0) * Number(item.invoicedQty || 0);
    const rate = Number(form.exchangeRateUsed || item.exchangeRateUsed || 0);
    if (!invoiceTotal || !rate) return { usd: 0, khr: 0 };

    if (String(item.inputCurrency || form.inputCurrency || "USD").toUpperCase() === "KHR") {
      return { usd: invoiceTotal / rate, khr: invoiceTotal };
    }

    return { usd: invoiceTotal, khr: invoiceTotal * rate };
  };



  return (

    <ModalShell
      mobileFullScreen

      title={title}

      subtitle={isReceiveMode ? "បញ្ចូលចំនួនមកដល់, ខូចខាត, ទទួលយក និងកាលបរិច្ឆេទផុតកំណត់។" : "គាំទ្រការបង់ប្រាក់ក្រោយពិនិត្យ, បង់ជាមុន, ទំនិញខូចខាត និងការទាមទារ អ្នកផ្គត់ផ្គង់។"}

      theme={theme}

      onClose={onClose}

      width="max-w-7xl"

      footer={

        <>

          <button type="button" onClick={onClose} className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">បោះបង់</button>

          <button type="button" disabled={isSaving} onClick={handleSubmit(() => onSavePrimary())} className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"><FiCheckCircle />{isSaving ? "កំពុងរក្សាទុក..." : primarySaveLabel}</button>

        </>

      }

    >

      <div className="space-y-6">

        <FlowHelper mode={form.paymentMode} theme={theme} />



        {!isReceiveMode && (

          <FormSection title="១. ព័ត៌មានការទិញ" subtitle="ជ្រើស អ្នកផ្គត់ផ្គង់ និងវិធីទូទាត់។" icon={<FiShoppingCart />} theme={theme}>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Controller control={control} name="purchaseNo" render={({ field }) => <FormInput label="លេខការទិញ" required value={field.value} error={fieldError("purchaseNo")} onChange={bindField("purchaseNo", field.onChange)} theme={theme} placeholder="PUR-001" icon={<FiHash />} readOnly />} />

              <Controller control={control} name="supplierId" render={({ field }) => <FormSelect label="អ្នកផ្គត់ផ្គង់" required value={field.value} error={fieldError("supplierId")} onChange={bindField("supplierId", field.onChange)} theme={theme} icon={<FiUser />} options={[{ value: "", label: "ជ្រើស អ្នកផ្គត់ផ្គង់" }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]} searchable />} />

              <Controller control={control} name="purchaseDate" render={({ field }) => <FormInput label="កាលបរិច្ឆេទទិញ" required type="date" value={field.value} error={fieldError("purchaseDate")} onChange={bindField("purchaseDate", field.onChange)} theme={theme} icon={<FiCalendar />} />} />

              <Controller control={control} name="paymentMode" render={({ field }) => <FormSelect label="របៀបទូទាត់" required value={field.value} error={fieldError("paymentMode")} onChange={bindField("paymentMode", field.onChange)} theme={theme} icon={<FiCreditCard />} options={paymentModeOptions} />} />

              {!isPayAfterCheck && (
                <>
                  <Controller control={control} name="exchangeRateUsed" render={({ field }) => <FormInput label="អត្រាប្ដូររូបិយប័ណ្ណ" required type="number" value={field.value} error={fieldError("exchangeRateUsed")} onChange={bindField("exchangeRateUsed", field.onChange)} theme={theme} icon={<FiCreditCard />} decimalPlaces={2} helper={Number(field.value || 0) > 0 ? `1 USD = ${Number(field.value).toLocaleString()} KHR` : "ឧ: 1 USD = 4000 KHR"} />} />

                  <Controller control={control} name="paymentStatus" render={({ field }) => <FormSelect label="ស្ថានភាពទូទាត់" required value={field.value} error={fieldError("paymentStatus")} onChange={bindField("paymentStatus", field.onChange)} theme={theme} icon={<FiDollarSign />} options={paymentStatusOptions} />} />
                </>
              )}

            </div>

            <PaymentModeHint mode={form.paymentMode} />

            <div className="mt-4">

              <FormTextarea label="កំណត់ចំណាំ" value={form.note} onChange={(value) => onChange("note", value)} theme={theme} placeholder="កំណត់ចំណាំការទិញ..." icon={<FiFileText />} />

            </div>

          </FormSection>

        )}



        <FormSection title={isReceiveMode ? "ទំនិញទទួល" : "២. ទំនិញ & ការទទួល"} subtitle={isReceiveMode ? "ចុចកែលើទំនិញ បំពេញចំនួនមកដល់, ខូចខាត, ទទួលយក។" : "បន្ថែមទំនិញ, ចំនួនមកដល់, ខូចខាត, ទទួលយក, បង់ប្រាក់ និងការទាមទារ។"} icon={<FiPackage />} theme={theme}>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm font-semibold">ទំនិញ</p>

              <p className={`mt-1 text-xs ${theme.muted}`}>តែចំនួនទទួលយកប៉ុណ្ណោះដែលចូលស្តុក បន្ទាប់ពីបញ្ជាក់ ស្តុក។</p>

            </div>

            {!isReceiveMode && <button type="button" onClick={onAddItem} className="quick-action-icon-3d inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"><FiPlus />បន្ថែមទំនិញ</button>}

          </div>



          {errors.items && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">{errors.items}</div>}



          {items.length === 0 ? (

            <EmptyState theme={theme} icon={<FiPackage />} title="គ្មានទំនិញ" description="ឧ: Coca-Cola Case, ទទួល 200, ខូច 10, ទទួលយក 190។" />

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">

              <table className="w-full min-w-[1160px] text-sm">

                <thead className="bg-red-600 text-white">

                  <tr>

                    <th className="px-3 py-3 text-left">ទំនិញ</th>

                    <th className="px-3 py-3 text-left">វិក្កយបត្រ</th>

                    <th className="px-3 py-3 text-left">បង់</th>

                    <th className="px-3 py-3 text-left">ទទួល</th>

                    <th className="px-3 py-3 text-left">ទទួលយក</th>

                    <th className="px-3 py-3 text-left">ខូច</th>

                    <th className="px-3 py-3 text-left">ទាមទារ</th>

                    <th className="px-3 py-3 text-left">ផុតកំណត់</th>

                    <th className="px-3 py-3 text-left">{isReceiveMode ? "សរុបទំនិញ" : "សរុប"}</th>

                    <th className="px-3 py-3 text-center">សកម្មភាព</th>

                  </tr>

                </thead>

                <tbody>

                  {items.map((item, index) => (

                    <tr key={item.id} className="border-t border-zinc-200 dark:border-white/10">

                      <td className="px-3 py-3"><p className="font-semibold">{item.variantName}</p><p className={`mt-1 text-xs ${theme.muted}`}>{item.variantCode} - {item.unitName} = {item.conversionQty} {item.baseUnit}</p></td>

                      <td className="px-3 py-3">{item.invoicedQty} {item.unitName}</td>

                      <td className="px-3 py-3">{item.paidQty} {item.unitName}</td>

                      <td className="px-3 py-3">{item.receivedQty} {item.unitName}</td>

                      <td className="px-3 py-3 text-emerald-500">{item.acceptedQty} {item.unitName}</td>

                      <td className="px-3 py-3"><span className={Number(item.damagedQty || 0) > 0 ? "font-semibold text-amber-500" : ""}>{item.damagedQty} {item.unitName}</span></td>

                      <td className="px-3 py-3"><span className={Number(item.claimQty || 0) > 0 ? "font-semibold text-red-500" : ""}>{item.claimQty} {item.unitName}</span></td>

                      <td className="px-3 py-3">{formatDateOnly(item.expiredDate)}</td>

                      <td className="px-3 py-3 font-semibold">
                        {(() => {
                          const total = getItemDisplayTotal(item);
                          return formatCurrencyPair(total.usd, total.khr);
                        })()}
                      </td>

                      <td className="px-3 py-3"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => onEditItem(item, index)} className="quick-action-icon-3d flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"><FiEdit2 size={14} />{isReceiveMode ? "ទទួល" : "កែ"}</button>{!isReceiveMode && <button type="button" onClick={() => onRemoveItem(index)} className="quick-action-icon-3d flex h-8 items-center justify-center gap-1 rounded-lg bg-red-500 px-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600"><FiTrash size={14} />លុប</button>}</div></td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

          {isReceiveMode && items.length > 0 && (
            <div className={`mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs dark:border-emerald-500/20 dark:bg-emerald-500/10 ${hasReceivePaymentContext ? "md:grid-cols-3 xl:grid-cols-6" : "md:grid-cols-4"}`}>
              <SummaryMiniBox theme={theme} label="តម្លៃទំនិញ" value={formatCurrencyPair(currencyPreview.subtotalUsd, currencyPreview.subtotalKhr)} />
              <SummaryMiniBox theme={theme} label="បញ្ចុះតម្លៃ" value={formatCurrencyPair(currencyPreview.discountUsd, currencyPreview.discountKhr)} />
              <SummaryMiniBox theme={theme} label="ថ្លៃដឹក" value={formatCurrencyPair(currencyPreview.deliveryUsd, currencyPreview.deliveryKhr)} />
              {(Number(currencyPreview.creditAppliedUsd || 0) > 0 || Number(currencyPreview.creditAppliedKhr || 0) > 0) && (
                <SummaryMiniBox theme={theme} label="លុយកាត់លើកក្រោយបានប្រើ" value={`-${formatCurrencyPair(currencyPreview.creditAppliedUsd, currencyPreview.creditAppliedKhr)}`} />
              )}
              <SummaryMiniBox theme={theme} label="សរុបត្រូវបង់" value={formatCurrencyPair(currencyPreview.grandTotalUsd, currencyPreview.grandTotalKhr)} colorClass="text-emerald-600 dark:text-emerald-400" />
              {hasReceivePaymentContext && (Number(currencyPreview.claimDeductionUsd || 0) > 0 || Number(currencyPreview.claimDeductionKhr || 0) > 0) && (
                <SummaryMiniBox theme={theme} label="ដកទំនិញខូច" value={formatCurrencyPair(currencyPreview.claimDeductionUsd, currencyPreview.claimDeductionKhr)} />
              )}
              {hasReceivePaymentContext && <SummaryMiniBox theme={theme} label="បានបង់មុន" value={formatCurrencyPair(currencyPreview.paidAmountUsd, currencyPreview.paidAmountKhr)} />}
              {hasReceivePaymentContext && <SummaryMiniBox theme={theme} label="នៅសល់" value={formatCurrencyPair(currencyPreview.balanceUsd, currencyPreview.balanceKhr)} />}
            </div>
          )}

        </FormSection>



        {!isReceiveMode && (

          <FormSection title="៣. ការទូទាត់, ការដឹក & សង្ខេប" subtitle="ព័ត៌មានការដឹក, បញ្ចុះតម្លៃ, ប្រាក់បង់ និងតម្លៃសរុប។" icon={<FiTruck />} theme={theme}>

            {isPayAfterCheck && (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                មិនទាន់ត្រូវការបង់ប្រាក់ទាំងស្រុងទេ។ បន្ទាប់ពីទំនិញមកដល់ ចូរបំពេញចំនួនមកដល់, ទទួលយក, ខូចខាត — ចំនួនត្រូវបង់នឹងគណនាពីចំនួនទទួលយកប៉ុណ្ណោះ។
              </div>
            )}

            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="deliveryOption"
                  render={({ field }) => (
                    <DeliveryChoiceCards
                      theme={theme}
                      value={field.value}
                      error={fieldError("deliveryOption")}
                      options={deliveryOptions}
                      onChange={(value) => {
                        field.onChange(value);
                        onChange("deliveryOption", value);
                        onChange("deliveryFee", 0);
                        onChange("deliveryPaidBy", "buyer");
                        setDeliveryFeeMode("free");
                      }}
                    />
                  )}
                />

                {supportsDeliveryFee && (
                  <div className={`rounded-2xl border p-4 ${theme.card}`}>
                    <div className="mb-3">
                      <p className="text-sm font-bold">ថ្លៃដឹក</p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>ជ្រើសថាអ្នកផ្គត់ផ្គង់ដឹកឥតគិតថ្លៃ ឬហាងត្រូវបង់ថ្លៃដឹក។</p>
                    </div>

                    <DeliveryFeeChoice
                      theme={theme}
                      value={deliveryFeeMode}
                      onChange={(value) => {
                        setDeliveryFeeMode(value);
                        onChange("deliveryPaidBy", "buyer");
                        if (value === "free") onChange("deliveryFee", 0);
                      }}
                    />

                    {hasDeliveryFee && (
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Controller control={control} name="deliveryFeeCurrency" render={({ field }) => <FormSelect label="រូបិយប័ណ្ណដឹក" value={field.value} error={fieldError("deliveryFeeCurrency")} onChange={bindField("deliveryFeeCurrency", field.onChange)} theme={theme} icon={field.value === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />} options={[{ value: "KHR", label: "KHR" }, { value: "USD", label: "USD" }]} />} />

                        <Controller control={control} name="deliveryFee" render={({ field }) => <FormInput label="ថ្លៃដឹក" type="number" value={field.value} error={fieldError("deliveryFee")} onChange={bindField("deliveryFee", field.onChange)} theme={theme} decimalPlaces={2} icon={form.deliveryFeeCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />} />} />
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const next = !showDiscountFields;
                    setShowDiscountFields(next);
                    if (!next) {
                      onChange("discountTotal", 0);
                      onChange("discountPercent", 0);
                      onChange("discountType", "amount");
                      onChange("discountCurrency", invoiceCurrency);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    showDiscountFields
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : `${theme.input} ${theme.text}`
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">បញ្ចុះពីអ្នកផ្គត់ផ្គង់</span>
                    <span className={`mt-0.5 block text-xs ${showDiscountFields ? "text-emerald-600 dark:text-emerald-300" : theme.muted}`}>
                      បើអ្នកផ្គត់ផ្គង់បញ្ចុះតម្លៃ សូមបំពេញចំនួននៅទីនេះ
                    </span>
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${showDiscountFields ? "bg-emerald-600 text-white" : theme.badge}`}>
                    {showDiscountFields ? "មាន" : "មិនមាន"}
                  </span>
                </button>

                {showDiscountFields && (
                  <div className={`rounded-2xl border p-4 ${theme.card}`}>
                    {(form.discountType || "amount") === "percent" ? (
                      <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[190px_minmax(0,1fr)_260px]">
                        <div>
                          <p className={`mb-1.5 text-xs font-semibold ${theme.muted}`}>របៀបបញ្ចុះ</p>
                          <DiscountTypeSwitch theme={theme} value={form.discountType || "amount"} onChange={(value) => onChange("discountType", value)} />
                        </div>

                        <Controller control={control} name="discountPercent" render={({ field }) => <FormInput label="ភាគរយបញ្ចុះ" type="number" value={field.value} error={fieldError("discountPercent")} onChange={bindField("discountPercent", field.onChange)} theme={theme} decimalPlaces={2} icon={<span className="text-base font-bold">%</span>} />} />

                        <div className={`rounded-xl border px-4 py-3 ${theme.input}`}>
                          <p className={`text-xs font-semibold ${theme.muted}`}>ស្មើនឹង</p>
                          <p className={`mt-1 text-base font-extrabold ${theme.text}`}>
                            {formatCurrencyPair(currencyPreview.discountUsd, currencyPreview.discountKhr)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`grid grid-cols-1 items-end gap-4 ${isMixedInvoiceCurrency ? "lg:grid-cols-[190px_220px_minmax(0,1fr)]" : "lg:grid-cols-[190px_minmax(0,1fr)]"}`}>
                        <div>
                          <p className={`mb-1.5 text-xs font-semibold ${theme.muted}`}>របៀបបញ្ចុះ</p>
                          <DiscountTypeSwitch theme={theme} value={form.discountType || "amount"} onChange={(value) => onChange("discountType", value)} />
                        </div>

                        {isMixedInvoiceCurrency && (
                          <Controller control={control} name="discountCurrency" render={({ field }) => <FormSelect label="រូបិយប័ណ្ណបញ្ចុះ" value={field.value} error={fieldError("discountCurrency")} onChange={bindField("discountCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />
                        )}

                        <Controller control={control} name="discountTotal" render={({ field }) => <FormInput label={`ចំនួនបញ្ចុះតាម invoice (${invoiceCurrency})`} type="number" value={field.value} error={fieldError("discountTotal")} onChange={bindField("discountTotal", field.onChange)} theme={theme} decimalPlaces={2} icon={invoiceCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />} />} />
                      </div>
                    )}
                  </div>
                )}

                {hasAvailableSupplierCredit && (
                  <div className={`rounded-2xl border border-emerald-300 p-4 dark:border-emerald-500/30 ${theme.card}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-semibold ${theme.text}`}>ប្រើលុយកាត់លើកក្រោយ</p>
                        <p className={`mt-0.5 text-xs ${theme.muted}`}>
                          លុយកាត់លើកក្រោយនៅសល់: {formatCurrencyPair(availableCreditUsd, availableCreditKhr)}
                        </p>
                      </div>
                      <div className="table-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <FiCreditCard />
                      </div>
                    </div>

                    {/* Checkbox per SOURCE PURCHASE instead of one typed amount — lets the user
                        pick EXACTLY which invoice's credit gets consumed, instead of the backend
                        silently picking oldest-first on its own. Grouped by source purchase (not
                        one row per underlying ledger entry) since multiple damaged items claimed
                        within the same invoice are one invoice's worth of credit, not separate
                        things to pick between. */}
                    <div className="space-y-2">
                      {groupedAvailableCredits.map((group) => {
                        const isSelected = Array.isArray(form.selectedCreditIds) && group.creditIds.every((id) => form.selectedCreditIds.includes(id));
                        // Disabled (not silently clamped) when checking it would push the total
                        // past this purchase's own remaining balance / the supplier's available
                        // credit — mirrors PurchaseService::applyCredit's two caps on the
                        // backend. Never disables an already-checked box, so unchecking always
                        // stays possible regardless of how the cap shifts elsewhere.
                        const wouldExceedCap = !isSelected && Number(form.creditApplied || 0) + group.amountUsd > creditAppliedMaxUsd + 0.001;
                        return (
                          <label
                            key={group.id}
                            className={`group relative flex items-center justify-between gap-3 rounded-xl border p-3 text-xs transition ${
                              wouldExceedCap
                                ? "cursor-not-allowed opacity-50"
                                : `cursor-pointer ${isSelected ? "border-emerald-400 bg-emerald-500/10" : theme.softCard}`
                            }`}
                          >
                            {/* Styled to match this app's own Tooltip component (dark bubble,
                                fades in on hover) instead of the native title= attribute, which
                                rendered as an unstyled OS tooltip. Built inline rather than
                                reusing PurchaseTable's shared Tooltip — that one is inline-flex
                                (sized to its content), which would break this row's full-width
                                justify-between layout. */}
                            {wouldExceedCap && (
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-60 -translate-x-1/2 whitespace-normal rounded-lg bg-zinc-800 px-2.5 py-1.5 text-center text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
                                លុយកាត់លើកក្រោយនេះ លើសពីចំនួននៅសល់ត្រូវបង់នៃការទិញនេះ
                                <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
                              </span>
                            )}
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={wouldExceedCap}
                                onChange={() => onChange("toggleCreditGroup", group.creditIds)}
                                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className={theme.muted}>
                                ការទិញ #{group.sourcePurchaseNo}
                              </span>
                            </span>
                            <span className="font-semibold">
                              {formatCurrencyPair(group.amountUsd, group.amountKhr)}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {fieldError("creditApplied") && (
                      <p className="mt-2 text-xs font-semibold text-red-500">{fieldError("creditApplied")}</p>
                    )}

                    {Number(form.creditApplied || 0) > 0 && (
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-emerald-200 pt-3 text-xs dark:border-emerald-500/20">
                        <span className={theme.muted}>បានជ្រើសរើសសរុប</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyPair(currencyPreview.creditAppliedUsd, currencyPreview.creditAppliedKhr)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!isPayAfterCheck && (
                  <div className={`rounded-2xl border p-4 ${theme.card}`}>
                    <div className="mb-3">
                      <p className={`text-sm font-semibold ${theme.text}`}>ការបង់ប្រាក់</p>
                      <p className={`mt-0.5 text-xs ${theme.muted}`}>រូបិយប័ណ្ណនេះសម្រាប់ប្រាក់ដែលបានបង់ទៅអ្នកផ្គត់ផ្គង់</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Controller control={control} name="paidCurrency" render={({ field }) => <FormSelect label="រូបិយប័ណ្ណបង់ប្រាក់" value={field.value} error={fieldError("paidCurrency")} onChange={bindField("paidCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

                      {/* "Paid in full" shows currencyPreview.paidAmountUsd/khr, NOT the raw grand
                          total — that figure already subtracts any supplier credit applied above,
                          so this correctly reflects how much CASH is actually still needed once
                          credit covers the rest (see calculateCurrencyPreview). */}
                      <Controller control={control} name="paidAmount" render={({ field }) => <FormInput label={paidAmountFieldLabel} type="number" value={form.paymentStatus === "paid" ? (form.paidCurrency === "KHR" ? currencyPreview.paidAmountKhr : currencyPreview.paidAmountUsd) : field.value} error={fieldError("paidAmount")} onChange={bindField("paidAmount", field.onChange)} theme={theme} decimalPlaces={2} icon={form.paidCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />} />} />
                    </div>
                  </div>
                )}
              </div>

              <div className={`h-fit rounded-2xl border p-5 shadow-sm ${theme.card}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className={`text-base font-extrabold ${theme.text}`}>សង្ខេបការទូទាត់</p>
                    <p className={`mt-0.5 text-xs ${theme.muted}`}>ពិនិត្យចំនួនមុនរក្សាទុក</p>
                  </div>
                  <div className="summary-icon-3d flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <FiCreditCard />
                  </div>
                </div>

                <div className="space-y-3">
                  <SummaryLine theme={theme} label="តម្លៃមុនបញ្ចុះ" value={formatCurrencyPair(currencyPreview.subtotalUsd, currencyPreview.subtotalKhr)} />
                  <SummaryLine theme={theme} label="បញ្ចុះតម្លៃ" value={formatCurrencyPair(currencyPreview.discountUsd, currencyPreview.discountKhr)} muted />
                  <SummaryLine theme={theme} label="ថ្លៃដឹក" value={formatCurrencyPair(currencyPreview.deliveryUsd, currencyPreview.deliveryKhr)} muted />
                  {(currencyPreview.creditAppliedUsd > 0 || currencyPreview.creditAppliedKhr > 0) && (
                    <SummaryLine
                      theme={theme}
                      label="លុយកាត់លើកក្រោយ"
                      value={`-${formatCurrencyPair(currencyPreview.creditAppliedUsd, currencyPreview.creditAppliedKhr)}`}
                    />
                  )}
                  {isPartialPrepaid ? (
                    <PartialPrepaidSummary
                      theme={theme}
                      total={formatCurrencyPair(currencyPreview.grandTotalUsd, currencyPreview.grandTotalKhr)}
                      paid={paidAmountLabel}
                      balance={formatCurrencyPair(currencyPreview.balanceUsd, currencyPreview.balanceKhr)}
                      progress={paidProgress}
                    />
                  ) : (
                    <>
                      {!isPayAfterCheck && <SummaryLine theme={theme} label={paidAmountSummaryLabel} value={paidAmountLabel} />}
                      {shouldShowBalance && <SummaryLine theme={theme} label={isPayAfterCheck ? "នៅជំពាក់" : "នៅសល់"} value={formatCurrencyPair(currencyPreview.balanceUsd, currencyPreview.balanceKhr)} />}
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                        <SummaryLine theme={theme} label={isPayAfterCheck ? "ត្រូវបង់សរុប" : "តម្លៃសរុប"} value={formatCurrencyPair(currencyPreview.grandTotalUsd, currencyPreview.grandTotalKhr)} strong />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isPayAfterCheck && (!form.exchangeRateUsed || Number(form.exchangeRateUsed) <= 0) && (

              <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm font-semibold text-red-500">

                ត្រូវការអត្រាប្ដូររូបិយប័ណ្ណ មុនពេលរក្សាទុកការទិញ។

              </div>

            )}

          </FormSection>

        )}

      </div>

    </ModalShell>

  );

}




export function FlowHelper({ mode, theme }) {

  const text = {

    pay_after_check: "លំហូរ បង់ក្រោយពិនិត្យ: ទទួលទំនិញ → ដកចំនួនខូច → បង់តែចំនួនទទួលយក → ផ្ញើទៅ ស្តុក ដើម្បីបញ្ជាក់ស្តុកម្ដង។",

    prepaid: "លំហូរ បង់ជាមុន: បង់មុន → ទទួលទំនិញ → ចំនួនខូចក្លាយជាការទាមទារ អ្នកផ្គត់ផ្គង់ → ចំនួនទទួលយករង់ចាំ ស្តុក។",

    partial_prepaid: "លំហូរ បង់ជាមុនមួយផ្នែក: បំពេញចំនួនបង់ដោយប្រុងប្រយ័ត្ន។ ប្រសិនចំនួនបង់លើសចំនួនទទួលយក ការទាមទារអាចនឹងត្រូវការ។",

  };



  return (

    <div className={`rounded-2xl border p-4 ${theme.softCard}`}>

      <div className="flex items-start gap-3">

        <div className="summary-icon-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><FiInfo /></div>

        <div>

          <p className="text-sm font-bold">ណែនាំការទិញ</p>

          <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{text[mode]}</p>

        </div>

      </div>

    </div>

  );

}

function SummaryLine({ theme, label, value, strong = false, muted = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`${strong ? "text-sm font-bold" : "text-sm"} ${muted ? theme.muted : theme.text}`}>{label}</span>
      <span className={`${strong ? "text-xl font-extrabold text-emerald-700 dark:text-emerald-300" : "text-sm font-bold"} text-right ${strong ? "" : theme.text}`}>
        {value}
      </span>
    </div>
  );
}

function PartialPrepaidSummary({ theme, total, paid, balance, progress }) {
  const percent = Math.round(progress);

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-extrabold ${theme.text}`}>បង់មុនមួយផ្នែក</p>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>បង្ហាញចំនួនបង់មុន និងប្រាក់នៅសល់</p>
          </div>
          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold text-white">{percent}%</span>
        </div>

        <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-white/10">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${percent}%` }} />
        </div>

        <div className="grid grid-cols-1 gap-2">
          <PartialAmountRow label="តម្លៃសរុប" value={total} />
          <PartialAmountRow label="បានបង់មុន" value={paid} highlight="paid" />
          <PartialAmountRow label="នៅសល់ត្រូវបង់" value={balance} highlight="balance" />
        </div>
      </div>
    </div>
  );
}

function PartialAmountRow({ label, value, highlight = "" }) {
  const valueClass =
    highlight === "paid"
      ? "text-amber-700 dark:text-amber-300"
      : highlight === "balance"
        ? "text-red-600 dark:text-red-300"
        : "text-zinc-900 dark:text-zinc-100";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm dark:bg-white/5">
      <span className="font-semibold text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`text-right font-extrabold ${valueClass}`}>{value}</span>
    </div>
  );
}

function DiscountTypeSwitch({ theme, value, onChange }) {
  return (
    <div className={`grid h-12 grid-cols-2 rounded-xl border p-1 ${theme.input}`}>
      {[
        { value: "amount", label: "ចំនួន" },
        { value: "percent", label: "ភាគរយ" },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg text-sm font-extrabold transition ${
            value === option.value ? "bg-emerald-600 text-white shadow-sm" : theme.muted
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}




export function PaymentModeHint({ mode }) {

  if (mode === "pay_after_check") {

    return <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-400">បង់ក្រោយពិនិត្យ: កុំទទួលប្រាក់ទាំងស្រុងមុនទំនិញមកដល់។ ចំនួនត្រូវបង់គណនាពីចំនួនទទួលយកប៉ុណ្ណោះ — ទំនិញខូចដក ចេញពីការបង់និងស្តុក។</div>;

  }

  if (mode === "prepaid") {

    return <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-400">បង់ជាមុន: ទំនិញត្រូវបង់ប្រាក់ជាមុន។ ប្រសិនទំនិញមកដល់ខូច ចំនួនខូចក្លាយជាការទាមទារ អ្នកផ្គត់ផ្គង់ (ជំនួស, ការបញ្ចុះ, ឬប្រាក់សង)។</div>;

  }

  return <div className="mt-4 rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-400">បង់ជាមុនមួយផ្នែក: បំពេញចំនួនបង់ដោយខ្លួនឯង។ ប្រសិនចំនួនបង់លើសចំនួនទទួលយក ការទាមទារអាចត្រូវការ។</div>;

}



