import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiCheck, FiChevronDown, FiDollarSign, FiFileText, FiHash, FiInfo, FiPackage, FiRefreshCcw, FiShield } from "react-icons/fi";

const CONDITION_OPTIONS = [
  { value: "good",      label: "ល្អ" },
  { value: "damaged",   label: "ខូច" },
  { value: "defective", label: "មានបញ្ហា" },
  { value: "expired",   label: "ផុតកំណត់" },
];

const STOCK_ACTION_OPTIONS = [
  { value: "restock",           label: "ដាក់ចូលស្តុកវិញ" },
  { value: "damaged_write_off", label: "មិនដាក់ចូលស្តុកវិញទេ" },
  { value: "discard",           label: "បោះចោល" },
];

// "store_credit" removed — the shop doesn't use it, and it was never actually implemented
// backend-side (no customer credit-balance field/ledger/redemption path existed at all; picking
// it would only record a label with no way to ever honor it later).
const RESOLUTION_OPTIONS = [
  { value: "refund",       label: "សងប្រាក់" },
  { value: "replacement",  label: "ដូរទំនិញ" },
];

const VERIFICATION_OPTIONS = [
  { value: "receipt",       label: "វិក្កយបត្រ" },
  { value: "system_lookup", label: "ស្វែងរកប្រព័ន្ធ" },
  { value: "verbal",        label: "មាត់" },
  { value: "photo",         label: "រូបថត" },
];

const fieldClass =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white";
const labelClass = "mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400";

// Same look as Admin's SaleModalShared.jsx FormSelect (checkmark dropdown, red highlight on the
// selected row) but self-contained — no `theme` prop — so it drops into POS cleanly too, which
// has no dark/light theme system of its own. Kept local to this file rather than a new shared
// component since nothing else needs it yet.
function Select({ value, onChange, options, icon }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find((o) => String(o.value) === String(value)) || options[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${fieldClass} flex items-center text-left ${icon ? "pl-9" : ""} pr-9`}
      >
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
            {icon}
          </span>
        )}
        <span className="truncate">{selectedOption?.label || "ជ្រើសរើស"}</span>
      </button>
      <FiChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-transform dark:text-zinc-500 ${open ? "rotate-180" : ""}`}
      />

      {open && (
        <div
          role="listbox"
          className="absolute z-[80] mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-2xl dark:border-white/10 dark:bg-[#202024]"
        >
          {options.map((option) => {
            const selected = String(option.value) === String(value);
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                  selected
                    ? "bg-red-500/10 font-semibold text-red-500"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/[0.06] dark:hover:text-white"
                }`}
              >
                <span>{option.label}</span>
                {selected && <FiCheck className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Shared by both the Admin Sales page (ReturnSaleModal) and the POS terminal's return form —
// no outer chrome (modal shell vs compact panel) and no submit button, since each host wraps
// this differently; just the fields both surfaces need to be identical for.
//
// showImmediateOption (POS only) reveals a "បានដោះស្រាយរួច" status choice — the shop owner
// trusts cashiers to resolve small/routine returns on the spot instead of always waiting for
// manager approval, with the activity log as the after-the-fact accountability trail. Admin's
// ReturnSaleModal doesn't pass this — every admin-created return still goes through the
// approval queue, since an admin who wants it resolved immediately can just approve it
// themselves in the same session.
export default function SalesReturnFormFields({ items, form, errors, onItemChange, onFormChange, showImmediateOption = false }) {
  const showStatusPicker = form.resolutionType === "replacement" || showImmediateOption;
  const statusOptions = [
    { value: "pending_approval", label: "រង់ចាំការយល់ព្រម" },
    ...(form.resolutionType === "replacement" ? [{ value: "approved", label: "ចាំទំនិញចូលស្តុក" }] : []),
    ...(showImmediateOption ? [{ value: "completed", label: "បានដោះស្រាយរួច" }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
        <FiAlertTriangle className="mt-0.5 shrink-0" size={14} />
        <span>
          {form.status === "approved"
            ? 'ស្តុក និងការសងប្រាក់ មិនទាន់ប៉ះពាល់ទេ។ សំណើនេះនឹងចូលជា "ចាំទំនិញចូលស្តុក" — បញ្ចប់វានៅ tab "រង់ចាំអនុម័ត" នៅពេលទំនិញចូលស្តុករួច។'
            : form.status === "completed"
              ? "ស្តុក និងការសងប្រាក់ (បើមាន) នឹងប៉ះពាល់ភ្លាមៗពេលរក្សាទុក — ជ្រើសរើសនេះលុះត្រាតែជឿជាក់ថាការត្រឡប់នេះត្រឹមត្រូវ។"
              : 'សំណើនេះនឹងចូលជា "រង់ចាំអនុម័ត" — ស្តុក និងការសងប្រាក់ មិនទាន់ប៉ះពាល់ទេ រហូតដល់អ្នកគ្រប់គ្រងអនុម័តពី tab "រង់ចាំអនុម័ត"។'}
        </span>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-white">
          <FiPackage size={14} /> ជ្រើសរើសទំនិញត្រឡប់
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          ជ្រើសទំនិញ, កំណត់ចំនួន, ស្ថានភាព និងការចាត់ការស្តុកសម្រាប់ទំនិញម្នាក់ៗ ។
        </p>

        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div
              key={item.saleItemId}
              className={`rounded-xl border p-3 transition ${
                item.selected
                  ? "border-red-400/50 bg-red-500/5 dark:border-red-500/30"
                  : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.selected}
                  disabled={item.maxQty <= 0}
                  onChange={(e) => onItemChange(item.saleItemId, "selected", e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-red-500 disabled:cursor-not-allowed"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-zinc-900 dark:text-white">
                    {item.variantName || item.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.productName} · {item.unitName} · ច្រើនបំផុត: {item.maxQty}
                    {item.maxQty <= 0 && (item.isPendingClaimed ? " (កំពុងរង់ចាំអនុម័តរួចហើយ)" : " (ត្រឡប់អស់ហើយ)")}
                  </p>
                </div>
              </div>

              {item.selected && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className={labelClass}>ចំនួន</p>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.qty}
                      onChange={(e) => onItemChange(item.saleItemId, "qty", e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <p className={labelClass}>មូលហេតុ</p>
                    <Select
                      value={item.condition}
                      onChange={(value) => onItemChange(item.saleItemId, "condition", value)}
                      options={CONDITION_OPTIONS}
                    />
                  </div>

                  <div>
                    <p className={labelClass}>ការចាត់ការស្តុក</p>
                    <Select
                      value={item.stockAction}
                      onChange={(value) => onItemChange(item.saleItemId, "stockAction", value)}
                      options={STOCK_ACTION_OPTIONS}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {errors.items && <p className="mt-2 text-xs text-red-500">{errors.items}</p>}
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-white">
          <FiRefreshCcw size={14} /> ព័ត៌មានការត្រឡប់
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          កំណត់ដំណោះស្រាយ, របៀបផ្ទៀងផ្ទាត់, និងមូលហេតុ ។
        </p>

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className={labelClass}><FiInfo size={12} /> ប្រភេទដំណោះស្រាយ</p>
            <Select
              value={form.resolutionType}
              onChange={(value) => onFormChange("resolutionType", value)}
              options={RESOLUTION_OPTIONS}
            />
          </div>

          <div>
            <p className={labelClass}><FiShield size={12} /> ផ្ទៀងផ្ទាត់</p>
            <Select
              value={form.verificationType}
              onChange={(value) => onFormChange("verificationType", value)}
              options={VERIFICATION_OPTIONS}
            />
          </div>

          {form.resolutionType !== "replacement" && (
            <div>
              <p className={labelClass}><FiDollarSign size={12} /> ចំនួនត្រឡប់ (ស្រេចចិត្ត)</p>
              <input
                type="number"
                step="0.01"
                value={form.totalAmount}
                onChange={(e) => onFormChange("totalAmount", e.target.value)}
                placeholder="0.00"
                className={fieldClass}
              />
              {errors.totalAmount && <p className="mt-1 text-xs text-red-500">{errors.totalAmount}</p>}
            </div>
          )}

          {/* "ចាំទំនិញចូលស្តុក" only applies to a replacement whose stock hasn't arrived yet —
              a genuinely different timing, not a queue-skip. "បានដោះស្រាយរួច" only appears when
              the host opts in (showImmediateOption, POS-only) — everywhere else every return
              resolves via one "អនុម័ត" click in the approval queue. */}
          {showStatusPicker && (
            <div>
              <p className={labelClass}><FiHash size={12} /> ស្ថានភាព</p>
              <Select
                value={form.status}
                onChange={(value) => onFormChange("status", value)}
                options={statusOptions}
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className={labelClass}><FiFileText size={12} /> មូលហេតុ</p>
          <textarea
            value={form.reason}
            onChange={(e) => onFormChange("reason", e.target.value)}
            rows={2}
            placeholder="ឧ: អតិថិជនត្រឡប់ទំនិញខូច..."
            className={`${fieldClass} h-auto resize-none py-2`}
          />
          {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
        </div>
      </div>
    </div>
  );
}
