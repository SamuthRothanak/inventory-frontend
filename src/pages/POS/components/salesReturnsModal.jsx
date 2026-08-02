import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesReturnsApi } from "../../../services/salesReturn.service";
import { getSalesApi, getSaleByIdApi } from "../../../services/sale.service";
import { useSalesReturnForm } from "../../../hooks/useSalesReturnForm";
import SalesReturnFormFields from "../../../components/SalesReturnFormFields";
import { useAuthStore } from "../../../store/authStore";
import {
  X, RotateCcw, Search, Clock, CheckCircle, AlertCircle,
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

function extractArray(res) {
  if (Array.isArray(res))           return res;
  if (Array.isArray(res?.data))     return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function usd(v) {
  return `$${Number(v || 0).toFixed(2)}`;
}

// ── Returns List Tab ────────────────────────────────────────────────
// Scoped to the logged-in cashier's own returns — previously showed every return system-wide
// regardless of who's at the register, which is more than any one cashier needs to see day to
// day. Admin's own "គ្រប់គ្រងការលក់" page is the place for cross-user oversight of all returns.
function ReturnsList() {
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pos", "sales-returns", currentUserId],
    queryFn:  () => getSalesReturnsApi({ per_page: 30, created_by: currentUserId }),
    enabled: Boolean(currentUserId),
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
// Item list + return-detail fields are the shared useSalesReturnForm hook +
// SalesReturnFormFields component (also used by the Admin Sales page) — this component only
// owns the invoice-search step and its own compact submit button, since the fields/validation/
// payload building are identical on both surfaces.
function NewReturn({ onSuccess }) {
  const queryClient = useQueryClient();

  const [invoiceNo,   setInvoiceNo]   = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundSale,   setFoundSale]   = useState(null);
  const [saleItems,   setSaleItems]   = useState([]);

  const {
    returnItems,
    form,
    errors,
    updateItem,
    updateForm,
    submit,
    isSaving,
    isSuccess,
    isError,
    selectedCount,
    submitLabel,
  } = useSalesReturnForm({
    items: saleItems,
    saleId: foundSale?.id,
    saleGrandTotal: foundSale?.grand_total_usd ?? foundSale?.total_amount_usd,
    resetKey: foundSale?.id ?? null,
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
    setSaleItems([]);
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

      const rawItems = Array.isArray(sale.items) ? sale.items : [];
      const normalizedItems = rawItems.map((item) => {
        const convQty = Number(item.conversion_qty_snapshot) || 1;
        const origBase = Number(item.base_qty) || 0;
        const returnedBase = Number(item.returned_qty_base) || 0;
        const pendingClaimed = Number(pendingClaimedBySaleItemId[item.id] || 0);
        const remainingAfterCompleted = Math.max(0, origBase - returnedBase);
        const remainingBase = Math.max(0, remainingAfterCompleted - pendingClaimed);
        const maxQty = Math.round((remainingBase / convQty) * 1000) / 1000;
        const isPendingClaimed = remainingAfterCompleted > 0 && remainingBase <= 0;
        return {
          saleItemId: item.id,
          productVariantUnitId: item.product_variant_unit_id,
          productName: item.product_name_snapshot || "",
          variantName: item.variant_name_snapshot || "",
          unitName: item.unit_name_snapshot || "",
          conversionQty: convQty,
          unitPrice: item.unit_price_usd ?? item.unit_price ?? 0,
          maxQty,
          isPendingClaimed,
        };
      });

      setFoundSale(sale);
      setSaleItems(normalizedItems);
    } catch {
      setSearchError("ការស្វែងរកបរាជ័យ។ សូមព្យាយាមម្តងទៀត។");
    } finally {
      setIsSearching(false);
    }
  }

  const allReturned = returnItems.length > 0 && returnItems.every((i) => i.maxQty <= 0);

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
      {isError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          មិនអាចដាក់ការត្រឡប់ទំនិញទេ។ សូមព្យាយាមម្តងទៀត។
        </div>
      )}
      {isSuccess && (
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

          {allReturned && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              ទំនិញទាំងអស់ក្នុងការលក់នេះត្រូវបានត្រឡប់ហើយ។ មិនអាចត្រឡប់បន្ថែមទៀតទេ។
            </div>
          )}

          <SalesReturnFormFields
            items={returnItems}
            form={form}
            errors={errors}
            onItemChange={updateItem}
            onFormChange={updateForm}
            showImmediateOption
          />

          <button
            type="button"
            onClick={submit}
            disabled={isSaving || isSuccess || selectedCount === 0}
            className="quick-action-icon-3d flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-red-500 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0 disabled:opacity-50"
          >
            {isSaving
              ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <RotateCcw className="h-3.5 w-3.5" />
            }
            {submitLabel}
          </button>
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
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "95vh" }}
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
