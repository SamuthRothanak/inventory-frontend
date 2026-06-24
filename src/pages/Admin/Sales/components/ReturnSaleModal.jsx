import {
  FiAlertTriangle,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiInfo,
  FiPackage,
  FiRefreshCcw,
  FiSave,
} from "react-icons/fi";
import { FormInput, FormSection, FormSelect, FormTextarea, ModalShell } from "./SaleModalShared";

const CONDITION_OPTIONS = [
  { value: "good",      label: "ល្អ" },
  { value: "damaged",   label: "ខូច" },
  { value: "defective", label: "មានបញ្ហា" },
  { value: "expired",   label: "ផុតកំណត់" },
];

const STOCK_LABEL = {
  good:      "ដាក់ស្តុកត្រឡប់",
  damaged:   "លុបបំណុលស្តុក",
  defective: "លុបបំណុលស្តុក",
  expired:   "បោះចោល",
};

const STOCK_COLOR = {
  good:      "text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
  damaged:   "text-red-500 bg-red-500/10 border-red-200 dark:border-red-500/20",
  defective: "text-red-500 bg-red-500/10 border-red-200 dark:border-red-500/20",
  expired:   "text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
};

export function ReturnSaleModal({
  sale,
  form,
  errors,
  theme,
  onChange,
  onClose,
  onSave,
  isSaving = false,
  returnItems = [],
  onItemChange,
}) {
  const selectedCount = returnItems.filter((i) => i.selected).length;

  return (
    <ModalShell
      title="ត្រឡប់ / សងប្រាក់"
      subtitle={`${sale.saleNo} · ${sale.customerName} · សរុប $${Number(sale.grandTotal).toFixed(2)}`}
      theme={theme}
      onClose={onClose}
      width="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || selectedCount === 0}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 ${isSaving || selectedCount === 0 ? "opacity-60 pointer-events-none" : ""}`}
          >
            <FiSave className={isSaving ? "animate-spin" : ""} />
            {isSaving ? "កំពុងរក្សាទុក..." : `រក្សាទុក (${selectedCount} ទំនិញ)`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          <span>
            ការត្រឡប់ទំនិញ នឹងបង្កើតកំណត់ត្រាការត្រឡប់ ។ ទំនិញ​ល្អ​នឹង​ត្រូវ​ដាក់​ស្តុក​ត្រឡប់; ទំនិញ​ខូច​ឬ​មាន​បញ្ហា​នឹង​ត្រូវ​លុប​ចោល​ពី​ស្តុក ។
          </span>
        </div>

        {/* Per-item selection */}
        <FormSection
          title="ជ្រើសរើសទំនិញត្រឡប់"
          subtitle="ជ្រើសទំនិញ, កំណត់ចំនួន និងស្ថានភាពសម្រាប់ទំនិញម្នាក់ៗ ។"
          icon={<FiPackage />}
          theme={theme}
        >
          <div className="space-y-3">
            {returnItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition ${
                  item.selected
                    ? "border-red-400/50 bg-red-500/5 dark:border-red-500/30"
                    : `${theme.softCard} opacity-60`
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => onItemChange(item.id, "selected", e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-red-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">
                      {item.variantNameSnapshot || item.productNameSnapshot}
                    </p>
                    <p className={`mt-0.5 text-xs ${theme.muted}`}>
                      {item.productNameSnapshot} · {item.unitNameSnapshot} · ច្រើនបំផុត: {item.maxQty}
                    </p>
                  </div>
                </div>

                {item.selected && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <p className={`mb-1.5 text-xs font-semibold ${theme.muted}`}>ចំនួន</p>
                      <input
                        type="number"
                        min="1"
                        max={item.maxQty}
                        value={item.qty}
                        onChange={(e) => onItemChange(item.id, "qty", e.target.value)}
                        className={`h-10 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
                      />
                    </div>

                    <div>
                      <p className={`mb-1.5 text-xs font-semibold ${theme.muted}`}>ស្ថានភាព</p>
                      <div className="relative">
                        <select
                          value={item.condition}
                          onChange={(e) => onItemChange(item.id, "condition", e.target.value)}
                          className={`h-10 w-full appearance-none rounded-xl border pl-3 pr-8 text-sm outline-none transition focus:ring-4 ${theme.select}`}
                        >
                          {CONDITION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <FiChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm ${theme.muted}`} />
                      </div>
                    </div>

                    <div>
                      <p className={`mb-1.5 text-xs font-semibold ${theme.muted}`}>ការចាត់ការស្តុក</p>
                      <div className={`flex h-10 items-center rounded-xl border px-3 text-sm font-semibold ${STOCK_COLOR[item.condition]}`}>
                        {STOCK_LABEL[item.condition]}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {errors.items && (
            <p className="mt-2 text-xs text-red-400">{errors.items}</p>
          )}
        </FormSection>

        {/* Return details */}
        <FormSection
          title="ព័ត៌មានការត្រឡប់"
          subtitle="កំណត់ប្រភេទត្រឡប់, ដំណោះស្រាយ, និងមូលហេតុ ។"
          icon={<FiRefreshCcw />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="ប្រភេទការត្រឡប់"
              required
              value={form.returnType}
              onChange={(value) => onChange("returnType", value)}
              theme={theme}
              icon={<FiRefreshCcw />}
              options={[
                { value: "full",    label: "ត្រឡប់ទាំងអស់" },
                { value: "partial", label: "ត្រឡប់មួយចំណែក" },
              ]}
            />

            <FormSelect
              label="ប្រភេទដំណោះស្រាយ"
              required
              value={form.resolutionType}
              onChange={(value) => onChange("resolutionType", value)}
              theme={theme}
              icon={<FiInfo />}
              options={[
                { value: "refund",       label: "សងប្រាក់" },
                { value: "replacement",  label: "ដូរទំនិញ" },
                { value: "store_credit", label: "ប្រាក់ credit ហាង" },
              ]}
            />

            <FormInput
              label="ចំនួនត្រឡប់ (ស្រេចចិត្ត)"
              type="number"
              value={form.totalAmount}
              error={errors.totalAmount}
              onChange={(value) => onChange("totalAmount", value)}
              theme={theme}
              placeholder="0.00"
              icon={<FiDollarSign />}
            />

            <FormSelect
              label="ស្ថានភាព"
              value={form.status}
              onChange={(value) => onChange("status", value)}
              theme={theme}
              icon={<FiClock />}
              options={[
                { value: "pending_approval", label: "រង់ចាំការយល់ព្រម" },
                { value: "approved",         label: "យល់ព្រមហើយ" },
                { value: "completed",        label: "បញ្ចប់ហើយ" },
                { value: "rejected",         label: "បដិសេធ" },
              ]}
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="មូលហេតុ"
              value={form.reason}
              error={errors.reason}
              onChange={(value) => onChange("reason", value)}
              theme={theme}
              placeholder="ឧ: អតិថិជនត្រឡប់ទំនិញខូច..."
              icon={<FiFileText />}
            />
          </div>
        </FormSection>
      </div>
    </ModalShell>
  );
}
