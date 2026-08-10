import { FiDollarSign, FiFileText, FiSave } from "react-icons/fi";
import { FormInput, FormSection, FormSelect, ModalShell, SummaryMiniBox } from "./SaleModalShared";

// "store_credit" removed for the same reason as the resolution-type option — no backend
// customer credit-balance tracking exists, and marking a refund "refunded" via a method that
// moves no real cash and records no credit either was actively misleading.
const REFUND_METHOD_OPTIONS = [
  { value: "cash", label: "សាច់ប្រាក់" },
  { value: "bank_transfer", label: "ធនាគារ / QR" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "KHR", label: "KHR (៛)" },
];

export default function RecordRefundModal({ salesReturn, form, onChange, onClose, onSubmit, isLoading, theme }) {
  if (!salesReturn) return null;
  const ret = salesReturn;

  const amount = Number(form.refund_amount_input || 0);
  const amountError = amount <= 0 ? "ចំនួនត្រូវធំជាង 0" : "";
  const submitDisabled = isLoading || amount <= 0;

  return (
    <ModalShell
      title="កត់ត្រាការសងប្រាក់"
      subtitle={`${ret.sales_return_no} · ${ret.customer_name_snapshot || "អតិថិជនទូទៅ"}`}
      theme={theme}
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-700 active:translate-y-0 disabled:opacity-60"
          >
            <FiSave />
            {isLoading ? "កំពុងកត់ត្រា..." : "កត់ត្រាការសងប្រាក់"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <SummaryMiniBox
            theme={theme}
            label="ចំនួនត្រឡប់សរុប"
            value={`$${Number(ret.total_amount_usd || 0).toFixed(2)}`}
            subValue={`៛${Number(ret.total_amount_khr || 0).toLocaleString("en-US")}`}
            strong
          />
          <SummaryMiniBox
            theme={theme}
            label="នឹងកត់ត្រាសង"
            value={form.refund_currency === "KHR"
              ? `៛${Math.round(amount).toLocaleString("en-US")}`
              : `$${amount.toFixed(2)}`}
            strong
          />
        </div>

        <FormSection title="ព័ត៌មានការសងប្រាក់" subtitle="បញ្ចូលព័ត៌មានលុយដែលបានប្រគល់ជូនអតិថិជនជាក់ស្តែង។" icon={<FiDollarSign />} theme={theme}>
          <div className="space-y-4">
            <FormSelect
              label="វិធីសងប្រាក់"
              required
              value={form.refund_method}
              onChange={(v) => onChange("refund_method", v)}
              options={REFUND_METHOD_OPTIONS}
              theme={theme}
            />

            {form.refund_method === "bank_transfer" && (
              <FormInput
                label="ឈ្មោះធនាគារ / គ្រឹះស្ថាន"
                value={form.refund_provider_name}
                onChange={(v) => onChange("refund_provider_name", v)}
                theme={theme}
                placeholder="ឧ. ABA, ACLEDA, Wing..."
                icon={<FiFileText />}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="រូបិយប័ណ្ណ"
                required
                value={form.refund_currency}
                onChange={(v) => onChange("refund_currency", v)}
                options={CURRENCY_OPTIONS}
                theme={theme}
              />
              <FormInput
                label="ចំនួនទឹកប្រាក់"
                required
                type="number"
                value={form.refund_amount_input}
                onChange={(v) => onChange("refund_amount_input", v)}
                theme={theme}
                placeholder={form.refund_currency === "KHR" ? "0" : "0.00"}
                icon={<FiDollarSign />}
                error={amountError}
                decimalPlaces={form.refund_currency === "KHR" ? 0 : 2}
              />
            </div>

            {form.refund_currency === "KHR" && (
              <FormInput
                label="អត្រាប្ដូររូបិយប័ណ្ណ (KHR ក្នុង 1 USD)"
                type="number"
                value={form.refund_exchange_rate_used}
                onChange={(v) => onChange("refund_exchange_rate_used", v)}
                theme={theme}
                placeholder="4100"
                icon={<FiDollarSign />}
                decimalPlaces={2}
              />
            )}

            {form.refund_method !== "cash" && (
              <FormInput
                label="លេខយោង"
                value={form.refund_reference_no}
                onChange={(v) => onChange("refund_reference_no", v)}
                theme={theme}
                placeholder="លេខផ្ទេរ, slip..."
                icon={<FiFileText />}
              />
            )}
          </div>
        </FormSection>
      </div>
    </ModalShell>
  );
}
