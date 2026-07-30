import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSalesReturnsApi, createSalesReturnApi } from "../../../services/salesReturn.service";
import { getSalesApi, getSaleByIdApi } from "../../../services/sale.service";
import {
  X, RotateCcw, Search, Receipt, Clock, CheckCircle, AlertCircle,
} from "./posIcons";

const STATUS_COLORS = {
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved:         "bg-blue-100 text-blue-700",
  rejected:         "bg-red-100 text-red-700",
  completed:        "bg-emerald-100 text-emerald-700",
};
const STATUS_LABELS = {
  pending_approval: "រង់ចាំ",
  approved:         "យល់ព្រម",
  rejected:         "បដិសេធ",
  completed:        "បញ្ចប់ហើយ",
};

const CONDITION_OPTIONS = [
  { value: "good",      label: "ល្អ" },
  { value: "damaged",   label: "ខូច" },
  { value: "expired",   label: "ផុតកំណត់" },
  { value: "defective", label: "មានបញ្ហា" },
];
const STOCK_ACTION_OPTIONS = [
  { value: "restock",           label: "ដាក់ស្តុកត្រឡប់" },
  { value: "discard",           label: "បោះចោល" },
  { value: "damaged_write_off", label: "លុបបំណុល" },
];

function extractArray(res) {
  if (Array.isArray(res))           return res;
  if (Array.isArray(res?.data))     return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function usd(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

function sanitizeQtyInput(value, maxQty) {
  let nextValue = String(value || "").replace(/-/g, "").replace(/[^0-9.]/g, "");
  const parts = nextValue.split(".");
  const integerPart = (parts[0] || "").replace(/^0+(?=\d)/, "") || (nextValue.startsWith(".") ? "0" : parts[0]);
  const decimalPart = parts.slice(1).join("").slice(0, 3);
  const sanitized = parts.length === 1 ? integerPart : `${integerPart || "0"}.${decimalPart}`;
  const numeric = Number(sanitized || 0);
  if (Number.isFinite(numeric) && numeric > Number(maxQty || 0)) return String(maxQty);
  return sanitized;
}

// ── Returns List Tab ────────────────────────────────────────────────
function ReturnsList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pos", "sales-returns"],
    queryFn:  () => getSalesReturnsApi({ per_page: 30 }),
    staleTime: 30 * 1000,
  });

  const returns = useMemo(() => extractArray(data), [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-500">មិនអាចផ្ទុកការត្រឡប់ទំនិញទេ។</p>
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-300">
          <RotateCcw className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-slate-600">មិនទាន់មានការត្រឡប់ទំនិញ</p>
          <p className="mt-0.5 text-xs text-slate-400">ប្រើប្រអប់ "ការត្រឡប់ថ្មី" ដើម្បីដំណើរការ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {returns.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{r.sales_return_no}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {r.original_sale_no_snapshot}
              {r.customer_name_snapshot ? ` · ${r.customer_name_snapshot}` : ""}
            </p>
          </div>
          <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}`}>
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
            <p className="text-xs font-extrabold text-slate-700">{usd(r.total_amount_usd)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── New Return Tab ──────────────────────────────────────────────────
function NewReturn({ onSuccess }) {
  const queryClient = useQueryClient();

  const [invoiceNo,    setInvoiceNo]    = useState("");
  const [isSearching,  setIsSearching]  = useState(false);
  const [searchError,  setSearchError]  = useState("");
  const [foundSale,    setFoundSale]    = useState(null);
  const [returnItems,  setReturnItems]  = useState([]);

  const [verificationType, setVerificationType] = useState("receipt");
  const [resolutionType,   setResolutionType]   = useState("refund");
  const [reason,           setReason]           = useState("");
  // Default to pending — sometimes the person at the register IS the boss and can flip this
  // to "resolved already" to skip the approval queue, per the shop's actual policy.
  const [returnStatus,     setReturnStatus]     = useState("pending_approval");

  const mutation = useMutation({
    mutationFn: createSalesReturnApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos", "sales-returns"] });
      setTimeout(() => onSuccess?.(), 1200);
    },
  });

  async function handleSearch() {
    const q = invoiceNo.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError("");
    setFoundSale(null);
    setReturnItems([]);
    mutation.reset();
    try {
      const listRes = await getSalesApi({ search: q, per_page: 5 });
      const list = extractArray(listRes);
      if (list.length === 0) {
        setSearchError("រកមិនឃើញវិក្កយបត្រ។");
        return;
      }
      const match = list.find((s) => s.sale_no === q) ?? list[0];
      const detailRes = await getSaleByIdApi(match.id);
      const sale = detailRes?.data ?? detailRes;
      setFoundSale(sale);

      // Qty already claimed by a return still pending_approval/approved for this sale — without
      // this, a duplicate return request for the same item would be offered again here and only
      // get rejected after the whole form is filled out and submitted.
      const pendingReturnsRes = await getSalesReturnsApi({
        sale_id: match.id,
        status: ["pending_approval", "approved"],
        per_page: 50,
      });
      const pendingReturns = extractArray(pendingReturnsRes);
      const pendingClaimedBySaleItemId = {};
      pendingReturns.forEach((ret) => {
        (ret.items || []).forEach((item) => {
          pendingClaimedBySaleItemId[item.sale_item_id] =
            (pendingClaimedBySaleItemId[item.sale_item_id] || 0) + Number(item.base_qty || 0);
        });
      });

      const saleItems = Array.isArray(sale.items) ? sale.items : [];
      setReturnItems(
        saleItems.map((item) => {
          const convQty         = Number(item.conversion_qty_snapshot) || 1;
          const origBase        = Number(item.base_qty)                || 0;
          const returnedBase    = Number(item.returned_qty_base)       || 0;
          const pendingClaimed  = Number(pendingClaimedBySaleItemId[item.id] || 0);
          const remainingAfterCompleted = Math.max(0, origBase - returnedBase);
          const remainingBase  = Math.max(0, remainingAfterCompleted - pendingClaimed);
          const maxQty         = Math.round((remainingBase / convQty) * 1000) / 1000;
          const isPendingClaimed = remainingAfterCompleted > 0 && remainingBase <= 0;
          return {
            saleItemId:           item.id,
            productVariantUnitId: item.product_variant_unit_id,
            productName:          item.product_name_snapshot || "",
            variantName:          item.variant_name_snapshot || "",
            unitName:             item.unit_name_snapshot    || "",
            conversionQty:        convQty,
            maxQty,
            isPendingClaimed,
            checked:       false,
            qty:           String(maxQty),
            itemCondition: "good",
            stockAction:   "restock",
          };
        })
      );
    } catch {
      setSearchError("ការស្វែងរកបរាជ័យ។ សូមព្យាយាមម្តងទៀត។");
    } finally {
      setIsSearching(false);
    }
  }

  function updateItem(index, field, value) {
    setReturnItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "itemCondition") {
          if (value === "good")                              updated.stockAction = "restock";
          else if (value === "damaged" || value === "defective") updated.stockAction = "damaged_write_off";
          else if (value === "expired")                     updated.stockAction = "discard";
        }
        return updated;
      })
    );
  }

  function handleSubmit() {
    const selectedItems  = returnItems.filter((i) => i.checked && Number(i.qty) > 0);
    if (!foundSale || selectedItems.length === 0) return;

    const returnableItems = returnItems.filter((i) => i.maxQty > 0);
    const isFullReturn    =
      selectedItems.length === returnableItems.length &&
      selectedItems.every((si) => Number(si.qty) >= si.maxQty - 0.001);

    const payload = {
      sale_id:           foundSale.id,
      verification_type: verificationType,
      return_type:       isFullReturn ? "full" : "partial",
      resolution_type:   resolutionType,
      reason:            reason || null,
      status:            returnStatus,
      items: selectedItems.map((item) => {
        const returnQty = Number(item.qty || 0);
        const baseQty = Math.round(returnQty * item.conversionQty * 1000) / 1000;
        return {
          sale_item_id:            item.saleItemId,
          product_variant_unit_id: item.productVariantUnitId,
          qty:                     returnQty,
          base_qty:                baseQty,
          item_condition:          item.itemCondition,
          stock_action:            item.stockAction,
          restocked_qty_base:      item.stockAction === "restock" ? baseQty : 0,
          damaged_qty_base:        item.stockAction !== "restock" ? baseQty : 0,
        };
      }),
    };

    mutation.mutate(payload);
  }

  const selectedCount  = returnItems.filter((i) => i.checked && Number(i.qty) > 0).length;
  const allReturned    = returnItems.length > 0 && returnItems.every((i) => i.maxQty <= 0);

  return (
    <div className="space-y-4">

      {/* Invoice search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isSearching && handleSearch()}
          placeholder="វាយបញ្ចូលលេខវិក្កយបត្រ..."
          className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-red-300"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !invoiceNo.trim()}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-700 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {isSearching
            ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <Search className="h-3.5 w-3.5" />
          }
          ស្វែងរក
        </button>
      </div>

      {/* Alerts */}
      {searchError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {searchError}
        </div>
      )}
      {mutation.isError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          មិនអាចដាក់ការត្រឡប់ទំនិញទេ។ សូមព្យាយាមម្តងទៀត។
        </div>
      )}
      {mutation.isSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
          ការត្រឡប់ទំនិញបានដាក់ស្នើដោយជោគជ័យ។
        </div>
      )}

      {/* Found sale */}
      {foundSale && (
        <>
          {/* Sale info strip */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{foundSale.sale_no}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {foundSale.customer_name_snapshot || "ភ្ញៀវដើរចូល"} · {usd(foundSale.grand_total_usd ?? foundSale.total_amount_usd)}
                </p>
              </div>
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <Clock className="h-3 w-3" />
                {foundSale.sold_at?.slice(0, 10) ?? foundSale.created_at?.slice(0, 10)}
              </span>
            </div>
          </div>

          {/* Item rows */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ជ្រើសរើសទំនិញដើម្បីត្រឡប់
            </p>

            {allReturned && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                ទំនិញទាំងអស់ក្នុងការលក់នេះត្រូវបានត្រឡប់ហើយ។ មិនអាចត្រឡប់បន្ថែមទៀតទេ។
              </div>
            )}

            {returnItems.map((item, i) => (
              <div
                key={item.saleItemId}
                className={`rounded-xl border p-3 transition ${
                  item.checked ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-slate-50"
                } ${item.maxQty <= 0 ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    disabled={item.maxQty <= 0}
                    onChange={(e) => updateItem(i, "checked", e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-red-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">
                      {item.productName} {item.variantName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {item.unitName} · អតិបរមា:{" "}
                      <span className="font-semibold text-slate-700">{item.maxQty}</span>
                      {item.maxQty <= 0 && (item.isPendingClaimed ? " (កំពុងរង់ចាំអនុម័តរួចហើយ)" : " (ត្រឡប់ហើយ)")}
                    </p>

                    {item.checked && (
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        <div>
                          <p className="mb-1 text-[10px] font-bold text-slate-500">បរិមាណ</p>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(i, "qty", sanitizeQtyInput(e.target.value, item.maxQty))
                            }
                            className="h-7 w-full rounded-lg border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-bold text-slate-500">មូលហេតុ</p>
                          <select
                            value={item.itemCondition}
                            onChange={(e) => updateItem(i, "itemCondition", e.target.value)}
                            className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                          >
                            {CONDITION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-bold text-slate-500">ស្តុក</p>
                          <select
                            value={item.stockAction}
                            onChange={(e) => updateItem(i, "stockAction", e.target.value)}
                            className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                          >
                            {STOCK_ACTION_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Return details + submit */}
          {selectedCount > 0 && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ព័ត៌មានការត្រឡប់</p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[10px] font-bold text-slate-500">ផ្ទៀងផ្ទាត់</p>
                  <select
                    value={verificationType}
                    onChange={(e) => setVerificationType(e.target.value)}
                    className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                  >
                    <option value="receipt">វិក្កយបត្រ</option>
                    <option value="system_lookup">ស្វែងរកប្រព័ន្ធ</option>
                    <option value="verbal">មាត់</option>
                    <option value="photo">រូបថត</option>
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold text-slate-500">ដំណោះស្រាយ</p>
                  <select
                    value={resolutionType}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setResolutionType(nextValue);
                      if (nextValue !== "replacement" && returnStatus === "approved") {
                        setReturnStatus("pending_approval");
                      }
                    }}
                    className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                  >
                    <option value="refund">សងប្រាក់</option>
                    <option value="replacement">ដូរទំនិញ</option>
                    <option value="store_credit">Credit ហាង</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold text-slate-500">ស្ថានភាព</p>
                <select
                  value={returnStatus}
                  onChange={(e) => setReturnStatus(e.target.value)}
                  className="h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-red-300"
                >
                  <option value="pending_approval">រង់ចាំការយល់ព្រម</option>
                  <option value="completed">បានដោះស្រាយរួច</option>
                  {resolutionType === "replacement" && (
                    <option value="approved">ចាំទំនិញចូលស្តុក</option>
                  )}
                </select>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold text-slate-500">មូលហេតុ (ស្រេចចិត្ត)</p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="ពណ៌នាមូលហេតុការត្រឡប់..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-red-300"
                />
              </div>

              <p className="text-[10px] text-slate-400">
                {returnStatus === "completed"
                  ? "ស្តុក/ការសងប្រាក់ នឹងប៉ះពាល់ភ្លាមៗពេលដាក់ស្នើ — ជ្រើសរើសនេះលុះត្រាតែមានសិទ្ធិអនុម័តដោយផ្ទាល់។"
                  : returnStatus === "approved"
                    ? "ស្តុក/ការសងប្រាក់ មិនទាន់ប៉ះពាល់ទេ — កត់ត្រាថាចាំទំនិញចូលស្តុក, បញ្ចប់វានៅ tab \"រង់ចាំអនុម័ត\" ពេលទំនិញចូល។"
                    : "សំណើនេះនឹងរង់ចាំការអនុម័តពីអ្នកគ្រប់គ្រង — ស្តុក/ការសងប្រាក់ មិនទាន់ប៉ះពាល់រហូតដល់អនុម័ត។"}
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={mutation.isPending || mutation.isSuccess}
                className="quick-action-icon-3d flex h-8 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0 disabled:opacity-50"
              >
                {mutation.isPending
                  ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <RotateCcw className="h-3.5 w-3.5" />
                }
                {returnStatus === "completed"
                  ? `បញ្ចប់ការត្រឡប់ (${selectedCount} មុខ)`
                  : returnStatus === "approved"
                    ? `កត់ត្រា ចាំស្តុក (${selectedCount} មុខ)`
                    : `ដាក់ស្នើការត្រឡប់ (${selectedCount} មុខ)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────
export default function SalesReturnsModal({ onClose }) {
  const [tab, setTab] = useState("list");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "88vh" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">ការត្រឡប់ទំនិញ</p>
              <p className="text-[10px] text-slate-400">ដំណើរការការត្រឡប់ទំនិញ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-slate-100 bg-slate-50 px-5 pt-3">
          {[
            { id: "list",   label: "ការត្រឡប់" },
            { id: "create", label: "ការត្រឡប់ថ្មី" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`mb-[-1px] border-b-2 px-4 py-2 text-xs font-bold transition ${
                tab === t.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "list"
            ? <ReturnsList />
            : <NewReturn onSuccess={() => setTab("list")} />
          }
        </div>
      </div>
    </div>
  );
}
