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

  const title = mode === "add" ? "Add Purchase" : isReceiveMode ? "Receive Goods" : "Edit Purchase";

  const currencyPreview = calculateCurrencyPreview({ items, form });



  return (

    <ModalShell

      title={title}

      subtitle={isReceiveMode ? "Update received, damaged, accepted quantity and expiry date." : "Support Pay After Check, Prepaid, damaged goods, and supplier claims."}

      theme={theme}

      onClose={onClose}

      width="max-w-7xl"

      footer={

        <>

          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white">Cancel</button>

          <button type="button" disabled={isSaving} onClick={handleSubmit(() => onSavePrimary())} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"><FiCheckCircle />{isSaving ? "Saving..." : primarySaveLabel}</button>

        </>

      }

    >

      <div className="space-y-6">

        <FlowHelper mode={form.paymentMode} theme={theme} />



        {!isReceiveMode && (

          <FormSection title="1. Purchase Information" subtitle="Choose supplier and payment workflow." icon={<FiShoppingCart />} theme={theme}>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Controller control={control} name="purchaseNo" render={({ field }) => <FormInput label="Purchase No" required value={field.value} error={fieldError("purchaseNo")} onChange={bindField("purchaseNo", field.onChange)} theme={theme} placeholder="PUR-001" icon={<FiHash />} />} />

              <Controller control={control} name="supplierId" render={({ field }) => <FormSelect label="Supplier" required value={field.value} error={fieldError("supplierId")} onChange={bindField("supplierId", field.onChange)} theme={theme} icon={<FiUser />} options={[{ value: "", label: "Select supplier" }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]} searchable />} />

              <Controller control={control} name="purchaseDate" render={({ field }) => <FormInput label="Purchase Date" required type="date" value={field.value} error={fieldError("purchaseDate")} onChange={bindField("purchaseDate", field.onChange)} theme={theme} icon={<FiCalendar />} />} />

              <Controller control={control} name="paymentMode" render={({ field }) => <FormSelect label="Payment Mode" required value={field.value} error={fieldError("paymentMode")} onChange={bindField("paymentMode", field.onChange)} theme={theme} icon={<FiCreditCard />} options={paymentModeOptions} />} />

              {!isPayAfterCheck && (
                <>
                  <Controller control={control} name="inputCurrency" render={({ field }) => <FormSelect label="Invoice Currency" required value={field.value} error={fieldError("inputCurrency")} onChange={bindField("inputCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

                  <Controller control={control} name="exchangeRateUsed" render={({ field }) => <FormInput label="Exchange Rate Used" required type="number" value={field.value} error={fieldError("exchangeRateUsed")} onChange={bindField("exchangeRateUsed", field.onChange)} theme={theme} icon={<FiCreditCard />} helper={Number(field.value || 0) > 0 ? `1 USD = ${Number(field.value).toLocaleString()} KHR` : "Example: 1 USD = 4000 KHR"} />} />

                  <Controller control={control} name="paymentStatus" render={({ field }) => <FormSelect label="Payment Status" required value={field.value} error={fieldError("paymentStatus")} onChange={bindField("paymentStatus", field.onChange)} theme={theme} icon={<FiDollarSign />} options={paymentStatusOptions} />} />
                </>
              )}

            </div>

            <PaymentModeHint mode={form.paymentMode} />

            <div className="mt-4">

              <FormTextarea label="Note" value={form.note} onChange={(value) => onChange("note", value)} theme={theme} placeholder="Purchase note..." icon={<FiFileText />} />

            </div>

          </FormSection>

        )}



        <FormSection title={isReceiveMode ? "Receiving Items" : "2. Items & Receiving"} subtitle={isReceiveMode ? "Click edit on each item and enter received, damaged, accepted quantity." : "Add items, received qty, damaged qty, accepted qty, paid qty, and claim qty."} icon={<FiPackage />} theme={theme}>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm font-semibold">Items</p>

              <p className={`mt-1 text-xs ${theme.muted}`}>Only accepted quantity enters inventory after Inventory confirmation.</p>

            </div>

            {!isReceiveMode && <button type="button" onClick={onAddItem} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"><FiPlus />Add Item</button>}

          </div>



          {errors.items && <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">{errors.items}</div>}



          {items.length === 0 ? (

            <EmptyState theme={theme} icon={<FiPackage />} title="No purchase items" description="Example: Coca-Cola Case, received 200, damaged 10, accepted 190." />

          ) : (

            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">

              <table className="w-full min-w-[1160px] text-sm">

                <thead className="bg-red-600 text-white">

                  <tr>

                    <th className="px-3 py-3 text-left">Product Variant</th>

                    <th className="px-3 py-3 text-left">Invoiced</th>

                    <th className="px-3 py-3 text-left">Paid</th>

                    <th className="px-3 py-3 text-left">Received</th>

                    <th className="px-3 py-3 text-left">Accepted</th>

                    <th className="px-3 py-3 text-left">Damaged</th>

                    <th className="px-3 py-3 text-left">Claim</th>

                    <th className="px-3 py-3 text-left">Expiry</th>

                    <th className="px-3 py-3 text-left">Total</th>

                    <th className="px-3 py-3 text-center">Actions</th>

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

                      <td className="px-3 py-3"><div className="flex items-center justify-center gap-2"><button type="button" onClick={() => onEditItem(item, index)} className="flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white hover:bg-blue-700"><FiEdit2 size={14} />{isReceiveMode ? "Receive" : "Edit"}</button>{!isReceiveMode && <button type="button" onClick={() => onRemoveItem(index)} className="flex h-8 items-center justify-center gap-1 rounded-lg bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600"><FiTrash size={14} />Remove</button>}</div></td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </FormSection>



        {!isReceiveMode && (

          <FormSection title="3. Payment, Delivery & Summary" subtitle="Delivery information, discount, paid amount, balance, and total amount." icon={<FiTruck />} theme={theme}>

            {isPayAfterCheck && (
              <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                Final payment is not required yet. After goods arrive, enter received, accepted, and damaged quantities; the payable amount will be calculated from accepted quantity only.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Controller control={control} name="deliveryOption" render={({ field }) => <FormSelect label="Delivery Option" value={field.value} onChange={bindField("deliveryOption", field.onChange)} theme={theme} icon={<FiTruck />} options={deliveryOptions} />} />

              <Controller control={control} name="deliveryPaidBy" render={({ field }) => <FormSelect label="Delivery Paid By" value={field.value} onChange={bindField("deliveryPaidBy", field.onChange)} theme={theme} icon={<FiUser />} options={deliveryPaidByOptions} />} />

              <Controller control={control} name="deliveryFeeCurrency" render={({ field }) => <FormSelect label="Delivery Currency" value={field.value} error={fieldError("deliveryFeeCurrency")} onChange={bindField("deliveryFeeCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

              <Controller control={control} name="deliveryFee" render={({ field }) => <FormInput label="Delivery Fee" type="number" value={field.value} error={fieldError("deliveryFee")} onChange={bindField("deliveryFee", field.onChange)} theme={theme} icon={form.deliveryFeeCurrency === "KHR" ? <span className="text-base font-bold">KHR</span> : <FiDollarSign />} />} />

              <Controller control={control} name="discountCurrency" render={({ field }) => <FormSelect label="Discount Currency" value={field.value} error={fieldError("discountCurrency")} onChange={bindField("discountCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

              <Controller control={control} name="discountTotal" render={({ field }) => <FormInput label="Discount Total" type="number" value={field.value} error={fieldError("discountTotal")} onChange={bindField("discountTotal", field.onChange)} theme={theme} icon={<FiCreditCard />} />} />

              {!isPayAfterCheck && (
                <>
                  <Controller control={control} name="paidCurrency" render={({ field }) => <FormSelect label="Paid Currency" value={field.value} error={fieldError("paidCurrency")} onChange={bindField("paidCurrency", field.onChange)} theme={theme} icon={<FiDollarSign />} options={[{ value: "USD", label: "USD" }, { value: "KHR", label: "KHR" }]} />} />

                  <Controller control={control} name="paidAmount" render={({ field }) => <FormInput label="Paid Amount" type="number" value={form.paymentStatus === "paid" ? (form.paidCurrency === "KHR" ? currencyPreview.grandTotalKhr : currencyPreview.grandTotalUsd) : field.value} error={fieldError("paidAmount")} onChange={bindField("paidAmount", field.onChange)} theme={theme} icon={form.paidCurrency === "KHR" ? <span className="text-base font-bold">KHR</span> : <FiDollarSign />} />} />
                </>
              )}

            </div>



            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

              <SummaryMiniBox theme={theme} label="Subtotal" value={formatCurrencyPair(currencyPreview.subtotalUsd, currencyPreview.subtotalKhr)} />

              <SummaryMiniBox theme={theme} label="Discount" value={formatCurrencyPair(currencyPreview.discountUsd, currencyPreview.discountKhr)} />

              <SummaryMiniBox theme={theme} label="Delivery Fee" value={formatCurrencyPair(currencyPreview.deliveryUsd, currencyPreview.deliveryKhr)} />

              {!isPayAfterCheck && <SummaryMiniBox theme={theme} label="Paid Amount" value={formatCurrencyPair(currencyPreview.paidAmountUsd, currencyPreview.paidAmountKhr)} />}

              {!isPayAfterCheck && <SummaryMiniBox theme={theme} label="Balance" value={formatCurrencyPair(currencyPreview.balanceUsd, currencyPreview.balanceKhr)} strong />}

              <SummaryMiniBox theme={theme} label={isPayAfterCheck ? "Estimated Payable" : "Grand Total"} value={formatCurrencyPair(currencyPreview.grandTotalUsd, currencyPreview.grandTotalKhr)} strong />

            </div>

            {!isPayAfterCheck && (!form.exchangeRateUsed || Number(form.exchangeRateUsed) <= 0) && (

              <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm font-semibold text-red-500">

                Exchange rate is required before saving this purchase.

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

    pay_after_check: "Pay After Check flow: Receive goods → exclude damaged quantity → pay accepted quantity → send to Inventory for one-time stock confirmation.",

    prepaid: "Prepaid flow: Pay first → receive goods → damaged quantity becomes supplier claim → accepted quantity waits for Inventory confirmation.",

    partial_prepaid: "Partial Prepaid flow: Enter paid quantity carefully. If paid quantity is greater than accepted quantity, claim may be required before Inventory confirmation.",

  };



  return (

    <div className={`rounded-2xl border p-4 ${theme.softCard}`}>

      <div className="flex items-start gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><FiInfo /></div>

        <div>

          <p className="text-sm font-bold">Purchase Workflow Guide</p>

          <p className={`mt-1 text-sm leading-6 ${theme.muted}`}>{text[mode]}</p>

        </div>

      </div>

    </div>

  );

}




export function PaymentModeHint({ mode }) {

  if (mode === "pay_after_check") {

    return <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-700 dark:text-emerald-400">Pay After Check: do not collect final payment before goods arrive. Payable amount is calculated after receiving from accepted quantity only; damaged goods are excluded from payment and stock.</div>;

  }

  if (mode === "prepaid") {

    return <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-400">Prepaid: goods are paid before arrival. If goods arrive damaged, claim qty is created for replacement, credit note, or refund.</div>;

  }

  return <div className="mt-4 rounded-xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-400">Partial Prepaid: enter paid qty manually. If paid qty is more than accepted qty, claim qty may be required.</div>;

}



