import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createSalesReturnApi } from "../services/salesReturn.service";
import { defaultReturnForm, validateSaleReturn } from "../pages/Admin/Sales/schemas/saleReturnSchema";

// Same 3 outcomes both Admin and POS already agreed on before this hook existed — kept as the
// suggested default when condition changes, but the resulting stockAction stays user-editable
// (the POS behavior, chosen over Admin's old fixed/read-only version).
const CONDITION_STOCK_ACTION = {
  good: "restock",
  damaged: "damaged_write_off",
  defective: "damaged_write_off",
  expired: "discard",
};

// Strips everything but digits/one decimal point, drops leading zeros, caps at 3 decimals, and
// clamps to maxQty — ports ReturnSaleModal.jsx's original inline sanitizer verbatim.
const sanitizeQty = (rawValue, maxQty) => {
  const sanitized = String(rawValue ?? "")
    .replace(/-/g, "")
    .replace(/[^0-9.]/g, "")
    .split(".")
    .reduce((value, part, index) => (index === 0 ? part.replace(/^0+(?=\d)/, "") || "" : `${value}.${part}`), "")
    .split(".");
  const nextValue = sanitized.length === 1 ? sanitized[0] : `${sanitized[0] || "0"}.${sanitized.slice(1).join("").slice(0, 3)}`;
  const numeric = Number(nextValue || 0);
  return Number.isFinite(numeric) && numeric > Number(maxQty || 0) ? String(maxQty) : nextValue;
};

const buildInitialItems = (items) =>
  items.map((item) => ({
    ...item,
    selected: item.maxQty > 0,
    qty: item.maxQty,
    condition: "good",
    stockAction: "restock",
  }));

const computeSelectedTotal = (items) => {
  const sum = items
    .filter((item) => item.selected)
    .reduce((total, item) => total + Number(item.qty || 0) * Number(item.unitPrice || 0), 0);
  return Number(sum.toFixed(2));
};

/**
 * Shared logic behind "fill out a sales return" — used by both the Admin Sales page
 * (ReturnSaleModal) and the POS terminal's own return form. `items` must already be normalized
 * by the caller into { saleItemId, productVariantUnitId, productName, variantName, unitName,
 * conversionQty, unitPrice, maxQty, isPendingClaimed } — building that list stays host-specific
 * since Admin needs to additionally subtract qty already claimed by other pending returns.
 *
 * `resetKey` should change whenever `items` represents a different sale (e.g. the sale id) so
 * the form re-initializes — covers both a modal that mounts fresh per sale (Admin) and a
 * persistent component that finds a new sale via search (POS) with one mechanism.
 */
export function useSalesReturnForm({ items, saleId, saleGrandTotal, resetKey, onSuccess, onError }) {
  const [returnItems, setReturnItems] = useState(() => buildInitialItems(items));
  const [form, setForm] = useState(() => ({
    ...defaultReturnForm,
    totalAmount: computeSelectedTotal(buildInitialItems(items)),
  }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initial = buildInitialItems(items);
    setReturnItems(initial);
    setForm({ ...defaultReturnForm, totalAmount: computeSelectedTotal(initial) });
    setErrors({});
    // items is intentionally excluded — resetKey is the contract callers use to signal "this is
    // a different sale now", so re-running on every items reference change (e.g. a parent
    // re-render building a new array with the same content) would wipe in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const updateItem = (saleItemId, field, value) => {
    setReturnItems((previous) => {
      const next = previous.map((item) => {
        if (item.saleItemId !== saleItemId) return item;
        const updated = { ...item, [field]: value };
        if (field === "qty") updated.qty = sanitizeQty(value, item.maxQty);
        if (field === "condition") updated.stockAction = CONDITION_STOCK_ACTION[value] ?? "restock";
        return updated;
      });

      // Keep the (editable) suggested refund amount in sync with whichever items are actually
      // selected — same behavior ReturnSaleModal.jsx already had.
      if (field === "selected" || field === "qty") {
        setForm((previousForm) => ({ ...previousForm, totalAmount: computeSelectedTotal(next) }));
      }

      return next;
    });
    setErrors((previous) => ({ ...previous, items: "" }));
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      ...(field === "resolutionType" && value === "replacement" ? { totalAmount: "" } : {}),
      ...(field === "resolutionType" && value !== "replacement" && previous.status === "approved"
        ? { status: "pending_approval" }
        : {}),
      [field]: value,
    }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = validateSaleReturn(form, saleGrandTotal);

    const selected = returnItems.filter((item) => item.selected);
    if (selected.length === 0) {
      nextErrors.items = "សូមជ្រើសរើសទំនិញយ៉ាងតិច ១ ដើម្បីត្រឡប់ ។";
    } else {
      for (const item of selected) {
        const qty = Number(item.qty);
        if (!qty || qty <= 0) {
          nextErrors.items = "ចំនួនត្រឡប់ ត្រូវ > 0 សម្រាប់ទំនិញដែលបានជ្រើស ។";
          break;
        }
        if (qty > item.maxQty) {
          nextErrors.items = `ចំនួនត្រឡប់ មិនអាចលើស ចំនួនដើម (ច្រើនបំផុត: ${item.maxQty}) ។`;
          break;
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload) => createSalesReturnApi(payload),
    onSuccess: (data) => onSuccess?.(data, form),
    onError: (err) => onError?.(err),
  });

  // return_type is 100% derivable from what's actually selected — auto-computing it here
  // (rather than asking the user to pick "full"/"partial" separately, ReturnSaleModal.jsx's
  // old behavior) removes a field that could silently disagree with the real selection.
  const submit = () => {
    if (!validate()) return;

    const selected = returnItems.filter((item) => item.selected);
    const returnableItems = returnItems.filter((item) => item.maxQty > 0);
    const isFullReturn =
      selected.length === returnableItems.length &&
      selected.every((item) => Number(item.qty) >= Number(item.maxQty) - 0.001);

    // "បានដោះស្រាយរួច" (status=completed) + resolution_type=refund means the cashier is telling
    // the server the cash was already handed over — refund_status=refunded here signals
    // SalesReturnService::create() to record the refund in the SAME transaction as the stock
    // update, instead of leaving refund_status=pending with no second step to ever complete it.
    const isImmediateRefund = form.status === "completed" && form.resolutionType === "refund";

    // base_qty/restocked_qty_base/damaged_qty_base are intentionally omitted — the backend
    // (SalesReturnService::resolveItemSnapshots) always recomputes base_qty from qty *
    // conversion_qty_snapshot server-side and derives restocked/damaged qty from stock_action
    // when they're absent, so sending them client-side is dead weight, not a real input.
    mutation.mutate({
      sale_id: saleId,
      verification_type: form.verificationType,
      return_type: isFullReturn ? "full" : "partial",
      resolution_type: form.resolutionType,
      reason: form.reason.trim(),
      status: form.status,
      refund_amount_input:
        form.resolutionType !== "replacement" && form.totalAmount ? Number(form.totalAmount) : undefined,
      ...(isImmediateRefund ? { refund_status: "refunded", refund_method: "cash", refund_currency: "USD" } : {}),
      items: selected.map((item) => ({
        sale_item_id: item.saleItemId,
        product_variant_unit_id: item.productVariantUnitId,
        qty: Number(item.qty),
        item_condition: item.condition,
        stock_action: item.stockAction,
      })),
    });
  };

  const selectedCount = returnItems.filter((item) => item.selected).length;

  const submitLabel = mutation.isPending
    ? "កំពុងរក្សាទុក..."
    : form.status === "approved"
      ? `កត់ត្រា ចាំស្តុក (${selectedCount} ទំនិញ)`
      : form.status === "completed"
        ? `បញ្ចប់ការត្រឡប់ (${selectedCount} ទំនិញ)`
        : `ដាក់ស្នើសំណើត្រឡប់ (${selectedCount} ទំនិញ)`;

  return {
    returnItems,
    form,
    errors,
    updateItem,
    updateForm,
    submit,
    isSaving: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    selectedCount,
    submitLabel,
  };
}
