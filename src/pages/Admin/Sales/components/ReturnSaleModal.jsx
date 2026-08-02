import { FiSave } from "react-icons/fi";
import { ModalShell } from "./SaleModalShared";
import { useSalesReturnForm } from "../../../../hooks/useSalesReturnForm";
import SalesReturnFormFields from "../../../../components/SalesReturnFormFields";

// Thin host around the shared useSalesReturnForm hook + SalesReturnFormFields component (also
// used by the POS terminal's own return form) — this file only owns the ModalShell chrome and
// footer buttons; the fields, validation, and submit payload are identical on both surfaces.
export function ReturnSaleModal({ sale, items, theme, onClose, onSuccess, onError }) {
  const {
    returnItems,
    form,
    errors,
    updateItem,
    updateForm,
    submit,
    isSaving,
    selectedCount,
    submitLabel,
  } = useSalesReturnForm({
    items,
    saleId: sale.id,
    saleGrandTotal: sale.grandTotal,
    resetKey: sale.id,
    onSuccess,
    onError,
  });

  return (
    <ModalShell
      mobileFullScreen
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
            className="table-icon-3d h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            បោះបង់
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={isSaving || selectedCount === 0}
            className={`quick-action-icon-3d inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0 ${isSaving || selectedCount === 0 ? "opacity-60 pointer-events-none" : ""}`}
          >
            <FiSave className={isSaving ? "animate-spin" : ""} />
            {submitLabel}
          </button>
        </>
      }
    >
      <SalesReturnFormFields
        items={returnItems}
        form={form}
        errors={errors}
        onItemChange={updateItem}
        onFormChange={updateForm}
      />
    </ModalShell>
  );
}
