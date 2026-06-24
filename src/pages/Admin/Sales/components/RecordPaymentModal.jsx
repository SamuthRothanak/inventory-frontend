import {
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiInfo,
  FiSave,
} from "react-icons/fi";
import { FormInput, FormSection, FormSelect, FormTextarea, ModalShell, SummaryMiniBox } from "./SaleModalShared";

export function RecordPaymentModal({ sale, form, onChange, onClose, onSubmit, isLoading, theme }) {
  const balance = Number(sale.balanceTotal);
  const paid = Number(sale.paidTotal);

  const enteredAmt = Number(form.amount_received) || 0;
  const rate = Number(form.exchange_rate_used) || Number(sale.exchangeRateKhrPerUsd) || 4100;
  const amountInUsd = form.currency_code === "KHR" ? enteredAmt / rate : enteredAmt;
  const overBalance = amountInUsd > balance + 0.001;
  const amountError = overBalance
    ? `លើសតម្លៃជំពាក់ ($${balance.toFixed(2)})`
    : "";

  return (
    <ModalShell
      title="កត់ត្រាការទូទាត់"
      subtitle={`${sale.saleNo} · ${sale.customerName}`}
      theme={theme}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || overBalance}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <FiSave />
            {isLoading ? "កំពុងរក្សាទុក..." : "កត់ត្រាការទូទាត់"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <SummaryMiniBox theme={theme} label="តម្លៃសរុប" value={`$${Number(sale.grandTotal).toFixed(2)}`} />
          <SummaryMiniBox theme={theme} label="បានបង់ហើយ" value={`$${paid.toFixed(2)}`} />
          <SummaryMiniBox
            theme={theme}
            label="ប្រាក់ជំពាក់"
            value={`$${balance.toFixed(2)}`}
            subValue={`≈ ${Math.round(balance * Number(sale.exchangeRateKhrPerUsd)).toLocaleString()} ៛`}
            strong
          />
        </div>

        <FormSection
          title="ព័ត៌មានការទូទាត់"
          subtitle="បញ្ចូលការទូទាត់ដែលបានទទួលពីអតិថិជន ។"
          icon={<FiCreditCard />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="វិធីសាស្ត្រទូទាត់"
              required
              value={form.payment_method}
              onChange={(v) => onChange("payment_method", v)}
              theme={theme}
              icon={<FiCreditCard />}
              options={[
                { value: "cash", label: "សាច់ប្រាក់" },
                { value: "bank_transfer", label: "ផ្ទេរធនាគារ" },
                { value: "qr", label: "QR Code" },
                { value: "card", label: "កាត" },
                { value: "other", label: "ផ្សេងៗ" },
              ]}
            />

            <FormSelect
              label="រូបិយប័ណ្ណ"
              required
              value={form.currency_code}
              onChange={(v) => onChange("currency_code", v)}
              theme={theme}
              icon={<FiDollarSign />}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "KHR", label: "KHR (៛)" },
              ]}
            />

            <FormInput
              label="ចំនួនទទួល"
              required
              type="number"
              value={form.amount_received}
              onChange={(v) => onChange("amount_received", v)}
              theme={theme}
              placeholder="0.00"
              icon={<FiDollarSign />}
              error={amountError}
            />

            {form.currency_code === "KHR" && (
              <FormInput
                label="អត្រាប្ដូររូបិយប័ណ្ណ (KHR ក្នុង 1 USD)"
                type="number"
                value={form.exchange_rate_used}
                onChange={(v) => onChange("exchange_rate_used", v)}
                theme={theme}
                placeholder="4100"
                icon={<FiDollarSign />}
              />
            )}

            {form.payment_method !== "cash" && (
              <FormInput
                label="ធនាគារ / គ្រឹះស្ថាន"
                value={form.provider_name}
                onChange={(v) => onChange("provider_name", v)}
                theme={theme}
                placeholder="ABA, Wing, ..."
                icon={<FiInfo />}
              />
            )}

            {form.payment_method !== "cash" && (
              <FormInput
                label="លេខយោង"
                value={form.reference_no}
                onChange={(v) => onChange("reference_no", v)}
                theme={theme}
                placeholder="លេខផ្ទេរ, slip..."
                icon={<FiFileText />}
              />
            )}

            <FormInput
              label="ថ្ងៃទូទាត់"
              type="date"
              value={form.paid_at}
              onChange={(v) => onChange("paid_at", v)}
              theme={theme}
              icon={<FiCalendar />}
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="ចំណាំ (ស្រេចចិត្ត)"
              value={form.note}
              onChange={(v) => onChange("note", v)}
              theme={theme}
              placeholder="ចំណាំអំពីការទូទាត់នេះ..."
              icon={<FiFileText />}
            />
          </div>
        </FormSection>
      </div>
    </ModalShell>
  );
}
