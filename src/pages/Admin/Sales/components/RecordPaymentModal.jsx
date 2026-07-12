import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiInfo,
  FiSave,
} from "react-icons/fi";
import { FormInput, FormSection, FormTextarea, ModalShell, SummaryMiniBox } from "./SaleModalShared";

const money = (value) => Number(value || 0);
const bankProviders = ["ABA", "Wing", "ACLEDA", "Bakong", "ផ្សេងៗ"];

const formatPaymentAmount = (amount, currency) => {
  if (currency === "KHR") return `${Math.round(money(amount)).toLocaleString()} ៛`;
  return `$${money(amount).toFixed(2)}`;
};

function SegmentButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-xl border px-4 text-sm font-bold transition ${
        active
          ? "border-red-500 bg-red-500 text-white shadow-sm"
          : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function CurrencyToggle({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SegmentButton active={value === "USD"} onClick={() => onChange("USD")}>USD ($)</SegmentButton>
      <SegmentButton active={value === "KHR"} onClick={() => onChange("KHR")}>KHR (៛)</SegmentButton>
    </div>
  );
}

export function RecordPaymentModal({ sale, form, onChange, onClose, onSubmit, isLoading, theme }) {
  const balance = Number(sale.balanceTotal);
  const paid = Number(sale.paidTotal);

  const rate = Number(form.exchange_rate_used) || Number(sale.exchangeRateKhrPerUsd) || 4100;
  const toUsd = (amount, currency) => (currency === "KHR" ? money(amount) / rate : money(amount));
  const singleAmountUsd = form.payment_mode === "full" ? balance : toUsd(form.amount_received, form.currency_code);
  const splitAmountUsd =
    toUsd(form.transfer_amount_received, form.transfer_currency_code) +
    toUsd(form.cash_amount_received, form.cash_currency_code);
  const amountInUsd = form.payment_method === "split" ? splitAmountUsd : singleAmountUsd;
  const overBalance = amountInUsd > balance + 0.001;
  const splitNeedsAmount = form.payment_method === "split" && form.payment_mode === "full" && Math.abs(splitAmountUsd - balance) > 0.001;
  const amountError = overBalance
    ? `លើសចំនួនត្រូវទូទាត់ ($${balance.toFixed(2)})`
    : "";
  const remaining = Math.max(balance - amountInUsd, 0);
  const submitDisabled = isLoading || overBalance || splitNeedsAmount || amountInUsd <= 0;
  const isBank = form.payment_method === "bank_transfer";
  const isSplit = form.payment_method === "split";
  const selectedAmount =
    form.payment_mode === "full"
      ? (form.currency_code === "KHR" ? balance * rate : balance)
      : form.amount_received;
  const recordAmountLabel = isSplit
    ? `$${amountInUsd.toFixed(2)}`
    : formatPaymentAmount(selectedAmount, form.currency_code);
  const recordAmountSubLabel = isSplit
    ? "សរុបគិតជា USD"
    : form.currency_code === "KHR"
      ? `= $${amountInUsd.toFixed(2)}`
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
            disabled={submitDisabled}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <FiSave />
            {isLoading
              ? "កំពុងរក្សាទុក..."
              : form.payment_mode === "full"
                ? "កត់ត្រាបង់ពេញ"
                : "កត់ត្រាបង់មួយផ្នែក"}
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
            subValue={`= ${Math.round(balance * Number(sale.exchangeRateKhrPerUsd)).toLocaleString()} ៛`}
            strong
          />
        </div>

        <FormSection
          title="ព័ត៌មានការទូទាត់"
          subtitle="បញ្ចូលការទូទាត់ដែលបានទទួលពីអតិថិជន ។"
          icon={<FiCreditCard />}
          theme={theme}
        >
          <div className="space-y-5">
            <div>
              <p className={`mb-2 text-xs font-semibold ${theme.muted}`}>ស្ថានភាពទូទាត់</p>
              <div className="grid grid-cols-2 gap-2">
                <SegmentButton active={form.payment_mode === "full"} onClick={() => onChange("payment_mode", "full")}>
                  <span className="inline-flex items-center gap-2"><FiCheckCircle /> បង់ពេញ</span>
                </SegmentButton>
                <SegmentButton active={form.payment_mode === "partial"} onClick={() => onChange("payment_mode", "partial")}>
                  បង់មួយផ្នែក
                </SegmentButton>
              </div>
            </div>

            <div>
              <p className={`mb-2 text-xs font-semibold ${theme.muted}`}>វិធីសាស្ត្រទូទាត់</p>
              <div className="grid grid-cols-3 gap-2">
                <SegmentButton active={form.payment_method === "cash"} onClick={() => onChange("payment_method", "cash")}>សាច់ប្រាក់</SegmentButton>
                <SegmentButton active={isBank} onClick={() => onChange("payment_method", "bank_transfer")}>ធនាគារ / QR</SegmentButton>
                <SegmentButton active={isSplit} onClick={() => onChange("payment_method", "split")}>បំបែក</SegmentButton>
              </div>
            </div>

            {!isSplit && (
              <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{isBank ? "ធនាគារ / QR" : "សាច់ប្រាក់"}</p>
                  <p className="text-sm font-bold text-blue-600">${balance.toFixed(2)}</p>
                </div>

                {isBank && (
                  <div className="mb-4">
                    <p className={`mb-2 text-xs font-semibold ${theme.muted}`}>ធនាគារ</p>
                    <div className="flex flex-wrap gap-2">
                      {bankProviders.map((provider) => (
                        <SegmentButton
                          key={provider}
                          active={form.provider_name === provider}
                          onClick={() => onChange("provider_name", provider)}
                        >
                          {provider}
                        </SegmentButton>
                      ))}
                    </div>
                  </div>
                )}

                {isBank && form.provider_name === "ផ្សេងៗ" && (
                  <div className="mb-4">
                    <FormInput
                      label="ឈ្មោះធនាគារ / គ្រឹះស្ថាន"
                      value={form.provider_other_name}
                      onChange={(v) => onChange("provider_other_name", v)}
                      theme={theme}
                      placeholder="ឧ. Sathapana, Canadia..."
                      icon={<FiInfo />}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <p className={`mb-2 text-xs font-semibold ${theme.muted}`}>រូបិយប័ណ្ណ</p>
                  <CurrencyToggle value={form.currency_code} onChange={(v) => onChange("currency_code", v)} />
                </div>

                {form.payment_mode === "partial" ? (
                  <FormInput
                    label="ចំនួនទទួល"
                    required
                    type="number"
                    value={form.amount_received}
                    onChange={(v) => onChange("amount_received", v)}
                    theme={theme}
                    placeholder={form.currency_code === "KHR" ? "0" : "0.00"}
                    icon={<FiDollarSign />}
                    error={amountError}
                    decimalPlaces={form.currency_code === "KHR" ? 0 : 2}
                  />
                ) : (
                  <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                    បង់ពេញដោយ {form.currency_code}៖{" "}
                    <span className="font-bold">
                      {form.currency_code === "KHR"
                        ? `${Math.round(balance * rate).toLocaleString()} ៛`
                        : `$${balance.toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {isSplit && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
                  <p className="mb-3 text-sm font-bold">ធនាគារ / QR</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {bankProviders.map((provider) => (
                      <SegmentButton
                        key={provider}
                        active={form.provider_name === provider}
                        onClick={() => onChange("provider_name", provider)}
                      >
                        {provider}
                      </SegmentButton>
                    ))}
                  </div>
                  {form.provider_name === "ផ្សេងៗ" && (
                    <div className="mb-4">
                      <FormInput
                        label="ឈ្មោះធនាគារ / គ្រឹះស្ថាន"
                        value={form.provider_other_name}
                        onChange={(v) => onChange("provider_other_name", v)}
                        theme={theme}
                        placeholder="ឧ. Sathapana, Canadia..."
                        icon={<FiInfo />}
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <p className={`mb-2 text-xs font-semibold ${theme.muted}`}>រូបិយប័ណ្ណ</p>
                    <CurrencyToggle value={form.transfer_currency_code} onChange={(v) => onChange("transfer_currency_code", v)} />
                  </div>
                  <FormInput
                    label="ចំនួន Transfer"
                    required
                    type="number"
                    value={form.transfer_amount_received}
                    onChange={(v) => onChange("transfer_amount_received", v)}
                    theme={theme}
                    placeholder={form.transfer_currency_code === "KHR" ? "0" : "0.00"}
                    icon={<FiDollarSign />}
                    decimalPlaces={form.transfer_currency_code === "KHR" ? 0 : 2}
                  />
                </div>

                <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
                  <p className="mb-3 text-sm font-bold">សាច់ប្រាក់</p>
                  <div className="mb-4">
                    <p className={`mb-2 text-xs font-semibold ${theme.muted}`}>រូបិយប័ណ្ណ</p>
                    <CurrencyToggle value={form.cash_currency_code} onChange={(v) => onChange("cash_currency_code", v)} />
                  </div>
                  <FormInput
                    label="ចំនួនសាច់ប្រាក់"
                    required
                    type="number"
                    value={form.cash_amount_received}
                    onChange={(v) => onChange("cash_amount_received", v)}
                    theme={theme}
                    placeholder={form.cash_currency_code === "KHR" ? "0" : "0.00"}
                    icon={<FiDollarSign />}
                    error={amountError}
                    decimalPlaces={form.cash_currency_code === "KHR" ? 0 : 2}
                  />
                </div>
              </div>
            )}

            {form.currency_code === "KHR" || form.cash_currency_code === "KHR" || form.transfer_currency_code === "KHR" ? (
              <FormInput
                label="អត្រាប្ដូររូបិយប័ណ្ណ (KHR ក្នុង 1 USD)"
                type="number"
                value={form.exchange_rate_used}
                onChange={(v) => onChange("exchange_rate_used", v)}
                theme={theme}
                placeholder="4100"
                icon={<FiDollarSign />}
                decimalPlaces={2}
              />
            ) : null}

            {isBank || isSplit ? (
              <FormInput
                label="លេខយោង"
                value={form.reference_no}
                onChange={(v) => onChange("reference_no", v)}
                theme={theme}
                placeholder="លេខផ្ទេរ, slip..."
                icon={<FiFileText />}
              />
            ) : null}

            <FormInput
              label="ថ្ងៃទូទាត់"
              type="date"
              value={form.paid_at}
              onChange={(v) => onChange("paid_at", v)}
              theme={theme}
              icon={<FiCalendar />}
            />

            <FormTextarea
              label="ចំណាំ (ស្រេចចិត្ត)"
              value={form.note}
              onChange={(v) => onChange("note", v)}
              theme={theme}
              placeholder="ចំណាំអំពីការទូទាត់នេះ..."
              icon={<FiFileText />}
            />

            <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
              <div className="flex items-center justify-between text-sm">
                <span className={theme.muted}>ចំនួនដែលនឹងកត់ត្រា</span>
                <span className="text-right font-bold">
                  {recordAmountLabel}
                  {recordAmountSubLabel && (
                    <span className={`mt-0.5 block text-xs font-semibold ${theme.muted}`}>
                      {recordAmountSubLabel}
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className={theme.muted}>នៅសល់ក្រោយបង់</span>
                <span className={remaining > 0 ? "font-bold text-orange-500" : "font-bold text-emerald-600"}>
                  ${remaining.toFixed(2)}
                </span>
              </div>
              {splitNeedsAmount && (
                <p className="mt-2 text-xs font-semibold text-orange-500">
                  បង់ពេញត្រូវឲចំនួនបំបែកស្មើនឹង ${balance.toFixed(2)}។
                </p>
              )}
            </div>
          </div>
        </FormSection>
      </div>
    </ModalShell>
  );
}
