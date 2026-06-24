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
  deliveryPaidByOptions,
  paymentModeOptions,
  paymentStatusOptions,
} from "../utils/purchaseConstants";
import { calculateCurrencyPreview, formatCurrencyPair, formatDateOnly } from "../utils/purchaseUtils";
import { purchaseFormSchema } from "../schemas/purchaseSchemas";
import { EmptyState, FormInput, FormSection, FormSelect, FormTextarea, ModalShell, SummaryMiniBox } from "./PurchaseCommon";

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

  const title = mode === "add" ? "បន្ថែមការទិញ" : isReceiveMode ? "ទទួលទំនិញ" : "កែការទិញ";

  const currencyPreview = calculateCurrencyPreview({ items, form });



  return (

    <ModalShell

      title={title}

      subtitle={isReceiveMode ? "បញ្ចូលចំនួនទទួល, ខូចខាត, ទទួលយក និងកាលបរិច្ឆេទផុតកំណត់។" : "គាំទ្រការបង់ប្រាក់ក្រោយពិនិត្យ, បង់ជាមុន, ទំនិញខូចខាត និងការទាមទារ អ្នកផ្គត់ផ្គង់។"}

      theme={theme}

      onClose={onClose}

      width="max-w-7xl"

      footer={

        <>

          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">បោះបង់</button>

          <button type="button" disabled={isSaving} onClick={handleSubmit(() => onSavePrimary())} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"><FiCheckCircle />{isSaving ? "កំពុងរក្សាទុក..." : primarySaveLabel}</button>

        </>

      }

    >

      <div className="space-y-6">

        <FlowHelper mode={form.paymentMode} theme={theme} />



        {!isReceiveMode && (

          <FormSection title="១. ព័ត៌មានការទិញ" subtitle="ជ្រើស អ្នកផ្គត់ផ្គង់ និងវិធីទូទាត់។" icon={<FiShoppingCart />} theme={theme}>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Controller control={control} name="purchaseNo" render={({ field }) => <FormInput label="លេខការទិញ" required value={field.value} error={fieldError("purchaseNo")} onChange={bindField("purchaseNo", field.onChange)} theme={theme} placeholder="PUR-001" icon={<FiHash />} />} />

              <Controller control={control} name="supplierId" render={({ field }) => <FormSelect label="អ្នកផ្គត់ផ្គង់" required value={field.value} error={fieldError("supplierId")} onChange={bindField("supplierId", field.onChange)} theme={theme} icon={<FiUser />} options={[{ value: "", label: "ជ្រើស អ្នកផ្គត់ផ្គង់" }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]} searchable />} />

              <Controller control={control} name="purchaseDate" render={({ field }) => <FormInput label="កាលបរិច្ឆេទទិញ" required type="date" value={field.value} error={fieldError("purchaseDate")} onChange={bindField("purchaseDate", field.onChange)} theme={theme} icon={<FiCalendar />} />} />

              <Controller control={control} name="paymentMode" render={({ field }) => <FormSelect label="របៀបទូទាត់" required value={field.value} error={fieldError("paymentMode")} onChange={bindField("paymentMode", field.onChange)} theme={theme} icon={<FiCreditCard />} options={paymentModeOptions} />} />

              {!isPayAfterCheck && (
                <>
                  <Controller control={control} name="inputCurrency" render={({ field }) => <FormSelect label="រូបិយប័ណ្ណវិក្កយបត្រ" required value={field.value} error={fieldError("inputCurrency")} onChange={bindField("inputCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

                  <Controller control={control} name="exchangeRateUsed" render={({ field }) => <FormInput label="អត្រាប្ដូររូបិយប័ណ្ណ" required type="number" value={field.value} error={fieldError("exchangeRateUsed")} onChange={bindField("exchangeRateUsed", field.onChange)} theme={theme} icon={<FiCreditCard />} helper={Number(field.value || 0) > 0 ? `1 USD = ${Number(field.value).toLocaleString()} KHR` : "ឧ: 1 USD = 4000 KHR"} />} />
                </>
              )}

              <Controller control={control} name="paymentStatus" render={({ field }) => <FormSelect label="ស្ថានភាពទូទាត់" required={!isPayAfterCheck} value={field.value} error={isPayAfterCheck ? "" : fieldError("paymentStatus")} onChange={bindField("paymentStatus", field.onChange)} theme={theme} icon={<FiDollarSign />} options={paymentStatusOptions} disabled={isPayAfterCheck} />} />

            </div>

            <PaymentModeHint mode={form.paymentMode} />

            <div className="mt-4">

              <FormTextarea label="កំណត់ចំណាំ" value={form.note} onChange={(value) => onChange("note", value)} theme={theme} placeholder="កំណត់ចំណាំការទិញ..." icon={<FiFileText />} />

            </div>

          </FormSection>

        )}



        <FormSection title={isReceiveMode ? "ទំនិញទទួល" : "២. ទំនិញ & ការទទួល"} subtitle={isReceiveMode ? "ចុចកែលើទំនិញ បំពេញចំនួនទទួល, ខូចខាត, ទទួលយក។" : "បន្ថែមទំនិញ, ចំនួនទទួល, ខូចខាត, ទទួលយក, បង់ប្រាក់ និងការទាមទារ។"} icon={<FiPackage />} theme={theme}>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm font-semibold">ទំនិញ</p>

              <p className={`mt-1 text-xs ${theme.muted}`}>តែចំនួនទទួលយកប៉ុណ្ណោះដែលចូលស្តុក បន្ទាប់ពីបញ្ជាក់ ស្តុក។</p>

            </div>

            {!isReceiveMode && <button type="button" onClick={onAddItem} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"><FiPlus />បន្ថែមទំនិញ</button>}

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

                    <th className="px-3 py-3 text-left">សរុប</th>

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

                      <td className="px-3 py-3 font-semibold">{formatCurrencyPair(item.lineTotalUsd ?? item.lineTotal, item.lineTotalKhr)}</td>

                      <td className="px-3 py-3"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => onEditItem(item, index)} className="flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white hover:bg-blue-700"><FiEdit2 size={14} />{isReceiveMode ? "ទទួល" : "កែ"}</button>{!isReceiveMode && <button type="button" onClick={() => onRemoveItem(index)} className="flex h-8 items-center justify-center gap-1 rounded-lg bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600"><FiTrash size={14} />លុប</button>}</div></td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </FormSection>



        {!isReceiveMode && (

          <FormSection title="៣. ការទូទាត់, ការដឹក & សង្ខេប" subtitle="ព័ត៌មានការដឹក, បញ្ចុះតម្លៃ, ប្រាក់បង់ និងតម្លៃសរុប។" icon={<FiTruck />} theme={theme}>

            {isPayAfterCheck && (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                មិនទាន់ត្រូវការបង់ប្រាក់ទាំងស្រុងទេ។ បន្ទាប់ពីទំនិញមកដល់ ចូរបំពេញចំនួនទទួល, ទទួលយក, ខូចខាត — ចំនួនត្រូវបង់នឹងគណនាពីចំនួនទទួលយកប៉ុណ្ណោះ។
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Controller control={control} name="deliveryOption" render={({ field }) => <FormSelect label="ជម្រើសដឹក" value={field.value} onChange={bindField("deliveryOption", field.onChange)} theme={theme} icon={<FiTruck />} options={deliveryOptions} />} />

              {form.deliveryOption !== "none" && form.deliveryOption !== "self_pickup" && <Controller control={control} name="deliveryPaidBy" render={({ field }) => <FormSelect label="ការដឹកបង់ដោយ" value={field.value} onChange={bindField("deliveryPaidBy", field.onChange)} theme={theme} icon={<FiUser />} options={deliveryPaidByOptions} />} />}

              {form.deliveryOption !== "none" && <Controller control={control} name="deliveryFeeCurrency" render={({ field }) => <FormSelect label="រូបិយប័ណ្ណដឹក" value={field.value} error={fieldError("deliveryFeeCurrency")} onChange={bindField("deliveryFeeCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />}

              {form.deliveryOption !== "none" && <Controller control={control} name="deliveryFee" render={({ field }) => <FormInput label="ថ្លៃដឹក" type="number" value={field.value} error={fieldError("deliveryFee")} onChange={bindField("deliveryFee", field.onChange)} theme={theme} icon={form.deliveryFeeCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />} />} />}

              <Controller control={control} name="discountCurrency" render={({ field }) => <FormSelect label="រូបិយប័ណ្ណបញ្ចុះ" value={field.value} error={fieldError("discountCurrency")} onChange={bindField("discountCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

              <Controller control={control} name="discountTotal" render={({ field }) => <FormInput label="ចំនួនបញ្ចុះ" type="number" value={field.value} error={fieldError("discountTotal")} onChange={bindField("discountTotal", field.onChange)} theme={theme} icon={<FiCreditCard />} />} />

              {!isPayAfterCheck && (
                <>
                  <Controller control={control} name="paidCurrency" render={({ field }) => <FormSelect label="រូបិយប័ណ្ណបង់" value={field.value} error={fieldError("paidCurrency")} onChange={bindField("paidCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

                  <Controller control={control} name="paidAmount" render={({ field }) => <FormInput label="ចំនួនបង់" type="number" value={form.paymentStatus === "paid" ? (form.paidCurrency === "KHR" ? currencyPreview.grandTotalKhr : currencyPreview.grandTotalUsd) : field.value} error={fieldError("paidAmount")} onChange={bindField("paidAmount", field.onChange)} theme={theme} icon={form.paidCurrency === "KHR" ? <span className="text-base font-bold">៛</span> : <FiDollarSign />} />} />
                </>
              )}

            </div>



            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

              <SummaryMiniBox theme={theme} label="តម្លៃមុនបញ្ចុះ" value={formatCurrencyPair(currencyPreview.subtotalUsd, currencyPreview.subtotalKhr)} />

              <SummaryMiniBox theme={theme} label="បញ្ចុះតម្លៃ" value={formatCurrencyPair(currencyPreview.discountUsd, currencyPreview.discountKhr)} />

              <SummaryMiniBox theme={theme} label="ថ្លៃដឹក" value={formatCurrencyPair(currencyPreview.deliveryUsd, currencyPreview.deliveryKhr)} />

              {!isPayAfterCheck && <SummaryMiniBox theme={theme} label="ចំនួនបង់" value={formatCurrencyPair(currencyPreview.paidAmountUsd, currencyPreview.paidAmountKhr)} />}

              {!isPayAfterCheck && <SummaryMiniBox theme={theme} label="នៅសល់" value={formatCurrencyPair(currencyPreview.balanceUsd, currencyPreview.balanceKhr)} strong />}

              <SummaryMiniBox theme={theme} label={isPayAfterCheck ? "ប្រមាណត្រូវបង់" : "តម្លៃសរុប"} value={formatCurrencyPair(currencyPreview.grandTotalUsd, currencyPreview.grandTotalKhr)} strong />

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

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><FiInfo /></div>

        <div>

          <p className="text-sm font-bold">ណែនាំការទិញ</p>

          <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{text[mode]}</p>

        </div>

      </div>

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



