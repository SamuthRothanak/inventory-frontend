import { FiClipboard, FiFileText, FiHash, FiInfo, FiLayers, FiPackage, FiSave, FiTag, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { adjustmentReasons } from "../utils/inventoryConstants";
import { FormInput, FormSelect, FormTextarea, ModalShell, SectionTitle } from "./InventoryCommon";
export default function StockAdjustmentModal({
    mode,
    inventory,
    selectedItem,
    form,
    errors,
    theme,
    onChange,
    onClose,
    onSave,
    isSaving = false,
  }) {
    const isStockIn = mode === "adjustment_in";
    const title = isStockIn ? "Manual Adjustment In" : "Stock Out Adjustment";
    const reasonOptions = isStockIn
      ? adjustmentReasons.filter((r) => ["stock_count", "correction", "other"].includes(r.value))
      : adjustmentReasons;
    const subtitle = isStockIn
      ? "Use this only for stock count or correction, not normal purchase stock in."
      : "Use this for damaged, expired, internal use, lost item, or correction.";

    const activeItem =
      selectedItem ||
      inventory.find((item) => String(item.id) === String(form.inventoryId));

    const selectedUnit = activeItem?.units.find(
      (unit) => unit.unitName === form.unitName
    );

    const previewBaseQty =
      Number(form.qty || 0) * Number(selectedUnit?.conversionQty || 1);

    const truncateBatchNo = (batchNo) => {
      if (!batchNo) return "-";
      const parts = String(batchNo).split("-");
      if (parts.length <= 4) return batchNo;
      return `${parts.slice(0, 3).join("-")}-…${parts[parts.length - 1]}`;
    };
    const batchOptions = [
      { value: "", label: "No batch selected" },
      ...(activeItem?.batches || [])
        .filter((batch) => Number(batch.qtyRemainingBase || 0) > 0)
        .map((batch) => ({
          value: batch.id,
          label: `${truncateBatchNo(batch.batchNo)} · ${Number(batch.qtyRemainingBase).toLocaleString()} ${activeItem.baseUnit} · Exp: ${batch.expiredDate || "-"}`,
        })),
    ];

    return (
      <ModalShell
        title={title}
        subtitle={subtitle}
        theme={theme}
        onClose={onClose}
        width="max-w-3xl"
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
              onClick={onSave}
              disabled={isSaving}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm ${
                isStockIn
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-500 hover:bg-red-600"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <FiSave />
              {isSaving ? "Saving..." : "Save Adjustment"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <SectionTitle
            icon={isStockIn ? <FiTrendingUp /> : <FiTrendingDown />}
            title="Adjustment Information"
            subtitle="This creates stock_adjustments, stock_adjustment_items, and stock_movements."
            theme={theme}
          />

          <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Inventory Item"
                value={form.inventoryId}
                error={errors.inventoryId}
                onChange={(value) => {
                  const item = inventory.find(
                    (inventoryItem) => String(inventoryItem.id) === String(value)
                  );

                  onChange("inventoryId", value);
                  onChange("unitName", item?.baseUnit || "");
                  onChange("inventoryBatchId", "");
                }}
                theme={theme}
                icon={<FiPackage />}
                options={[
                  { value: "", label: "Select inventory item" },
                  ...inventory.map((item) => ({
                    value: item.id,
                    label: item.variantName,
                  })),
                ]}
                disabled={Boolean(selectedItem)}
                searchable={!selectedItem}
              />

              <FormSelect
                label="Reason"
                value={form.reason}
                error={errors.reason}
                onChange={(value) => onChange("reason", value)}
                theme={theme}
                icon={<FiTag />}
                options={reasonOptions}
                searchable={reasonOptions.length > 6}
              />

              <FormSelect
                label="Unit"
                value={form.unitName}
                error={errors.unitName}
                onChange={(value) => onChange("unitName", value)}
                theme={theme}
                icon={<FiLayers />}
                options={
                  activeItem
                    ? activeItem.units.map((unit) => ({
                        value: unit.unitName,
                        label: unit.unitName,
                      }))
                    : [{ value: "", label: "Select unit" }]
                }
                searchable={Number(activeItem?.units?.length || 0) > 6}
              />

              <FormInput
                label="Quantity"
                type="number"
                value={form.qty}
                error={errors.qty}
                onChange={(value) => onChange("qty", value)}
                theme={theme}
                placeholder="Enter qty"
                icon={<FiHash />}
              />

              <FormSelect
                label="Batch / Lot"
                value={form.inventoryBatchId}
                onChange={(value) => onChange("inventoryBatchId", value)}
                theme={theme}
                icon={<FiClipboard />}
                options={batchOptions}
                searchable
              />

              <div className={`rounded-xl border p-3 text-sm ${theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>
                  Base Qty Preview
                </p>
                <p className="mt-1 text-lg font-bold">
                  {Number(previewBaseQty || 0).toLocaleString()} {activeItem?.baseUnit || "base units"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <FormTextarea
                label="Note"
                value={form.note}
                onChange={(value) => onChange("note", value)}
                theme={theme}
                placeholder="Reason or note..."
                icon={<FiFileText />}
              />
            </div>
          </div>

          {activeItem && (
            <>
              <SectionTitle
                icon={<FiInfo />}
                title="Current Stock Preview"
                subtitle="Preview before saving this adjustment."
                theme={theme}
              />

              <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
                <p className="text-sm font-semibold">{activeItem.variantName}</p>

                <p className="mt-2 text-3xl font-bold">
                  {Number(activeItem.stockBaseQty).toLocaleString()} {activeItem.baseUnit}
                </p>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  Current status: {activeItem.status}
                </p>
              </div>
            </>
          )}
        </div>
      </ModalShell>
    );
  }


