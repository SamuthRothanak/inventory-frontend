import React, { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiEdit2,
  FiPlusCircle,
  FiRefreshCcw,
  FiSearch,
  FiTrash2,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  getExchangeRatesApi,
  getActiveExchangeRateApi,
  createExchangeRateApi,
  updateExchangeRateApi,
  deleteExchangeRateApi,
} from "../../../services/exchangeRate.service";
import TableLoading from "../../../components/TableLoading";
import { useNotification } from "../../../components/AppNotification";

function extractApiData(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

function extractActiveRate(response) {
  if (!response) return null;
  if (response?.success === false) return null;

  return response?.data?.data || response?.data || response || null;
}

// API return status ច្បាស់លាស់ ("active" / "inactive")
// ដូច្នេះមិនត្រូវ fallback ទៅ "active" ពេលគ្មាន value ទេ
function getErrorMessage(error) {
  const response = error?.response?.data;

  if (response?.message && response?.errors) {
    const firstError = Object.values(response.errors)?.[0]?.[0];
    return firstError || response.message;
  }

  return response?.message || error?.message || "Something went wrong.";
}

function normalizeStatus(value) {
  if (value === true || value === 1 || value === "1") return "active";
  if (value === false || value === 0 || value === "0") return "inactive";

  if (value === undefined || value === null || value === "") {
    return "inactive";
  }

  return String(value).toLowerCase();
}

function formatDate(value) {
  if (!value) return "-";

  // rate_date ពី API ជា "2026-06-05" រួចស្រេច -> ប្រើផ្ទាល់
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

// usd_to_khr_rate ពី API ជា string "4100.0000"
function formatRate(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number === 0) return "0";

  return number.toLocaleString();
}

function formatRateInput(value) {
  const text = String(value ?? "");

  if (!text) return "";

  return text.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const defaultFormValues = {
  rate_date: todayDate(),
  usd_to_khr_rate: "",
  khr_rounding: "ceil",
  status: "active",
};

const KHR_ROUNDING_OPTIONS = [
  { value: "ceil", label: "Round Up (2010 → 2100)" },
  { value: "round", label: "Nearest (2049 → 2000, 2050 → 2100)" },
  { value: "floor", label: "Round Down (2090 → 2000)" },
  { value: "none", label: "Exact (no rounding)" },
];

function roundingLabel(value) {
  const map = {
    ceil: "Round Up",
    round: "Nearest",
    floor: "Round Down",
    none: "Exact",
  };
  return map[value] || value || "Round Up";
}

export default function ExchangeRate() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();
  const notify = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formState, setFormState] = useState({
    open: false,
    mode: "add",
    selectedRate: null,
  });

  const theme = {
    pageTitle: isDark ? "text-white" : "text-zinc-900",
    title: isDark ? "text-white" : "text-zinc-900",
    muted: isDark ? "text-zinc-400" : "text-zinc-500",

    card: isDark
      ? "border-white/10 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    softCard: isDark
      ? "border-white/10 bg-white/[0.04]"
      : "border-zinc-200 bg-white",

    input: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",

    select: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",

    tableWrap: isDark
      ? "border-white/10 bg-zinc-900"
      : "border-zinc-200 bg-white",

    row: isDark
      ? "border-white/10 text-zinc-200 hover:bg-white/[0.04]"
      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",

    modal: isDark
      ? "border-white/10 bg-[#111113] text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modalHeader: isDark
      ? "border-white/10 bg-[#111113]"
      : "border-zinc-200 bg-white",

    modalBody: isDark ? "bg-[#151518]" : "bg-zinc-50/70",
  };

  const exchangeRatesQuery = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => getExchangeRatesApi(),
  });

  const activeRateQuery = useQuery({
    queryKey: ["exchange-rates", "active"],
    queryFn: () => getActiveExchangeRateApi(),
    retry: false,
  });

  const exchangeRates = useMemo(() => {
    return extractApiData(exchangeRatesQuery.data).map((item) => ({
      id: item.id,
      rateDate: item.rate_date || item.rateDate,
      usdToKhrRate:
        item.usd_to_khr_rate ??
        item.usdToKhrRate ??
        item.rate ??
        item.usd_to_khr ??
        0,
      status: normalizeStatus(item.status),
      khrRounding: item.khr_rounding || "ceil",
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
      raw: item,
    }));
  }, [exchangeRatesQuery.data]);

  const activeRate = useMemo(() => {
    const active = extractActiveRate(activeRateQuery.data);

    if (active && (active.id || active.rate_date || active.usd_to_khr_rate)) {
      return {
        id: active.id,
        rateDate: active.rate_date || active.rateDate,
        usdToKhrRate:
          active.usd_to_khr_rate ??
          active.usdToKhrRate ??
          active.rate ??
          active.usd_to_khr ??
          0,
        status: normalizeStatus(active.status),
        raw: active,
      };
    }

    // Fallback: បើ /exchange-rates/active error
    // យក record active ពិតៗ ពី list (មិនយក inactive)
    const fallbackActive =
      exchangeRates.find((item) => item.status === "active") || null;

    return fallbackActive;
  }, [activeRateQuery.data, exchangeRates]);

  const filteredRates = exchangeRates.filter((item) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      String(item.id).includes(search) ||
      String(item.rateDate || "").toLowerCase().includes(search) ||
      String(item.usdToKhrRate || "").includes(search);

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const inactiveCount = exchangeRates.filter(
    (item) => item.status === "inactive"
  ).length;

  const invalidateExchangeRateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["exchange-rates"] });
    queryClient.invalidateQueries({ queryKey: ["exchange-rates", "active"] });
    // bulk recalc នៅ backend ប្តូរ price rules -> refresh Products data ផង
    queryClient.invalidateQueries({ queryKey: ["price-rules"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product-variant-units"] });
  };

  const createMutation = useMutation({
    mutationFn: createExchangeRateApi,
    onSuccess: () => {
      invalidateExchangeRateQueries();
      notify.success(
        "Exchange rate created",
        "The new exchange rate has been saved."
      );
      closeForm();
    },
    onError: (error) => {
      notify.error("Create failed", getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExchangeRateApi,
    onSuccess: () => {
      invalidateExchangeRateQueries();
      notify.success(
        "Exchange rate updated",
        "The exchange rate has been updated."
      );
      closeForm();
    },
    onError: (error) => {
      notify.error("Update failed", getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExchangeRateApi,
    onSuccess: () => {
      invalidateExchangeRateQueries();
      notify.success(
        "Exchange rate deleted",
        "The exchange rate record has been deleted."
      );
    },
    onError: (error) => {
      notify.error("Delete failed", getErrorMessage(error));
    },
  });

  const openAddForm = () => {
    setFormState({
      open: true,
      mode: "add",
      selectedRate: null,
    });
  };

  const openEditForm = (rate) => {
    setFormState({
      open: true,
      mode: "edit",
      selectedRate: rate,
    });
  };

  const closeForm = () => {
    setFormState({
      open: false,
      mode: "add",
      selectedRate: null,
    });
  };

  const handleSave = (values) => {
    if (formState.mode === "edit" && formState.selectedRate) {
      updateMutation.mutate({
        id: formState.selectedRate.id,
        payload: values,
      });
      return;
    }

    createMutation.mutate(values);
  };

  const handleDelete = (rate) => {
    const confirmed = window.confirm(
      `Delete exchange rate ${formatRate(rate.usdToKhrRate)} KHR on ${formatDate(
        rate.rateDate
      )}?`
    );

    if (!confirmed) return;

    deleteMutation.mutate(rate.id);
  };

  const isLoading = exchangeRatesQuery.isLoading || activeRateQuery.isLoading;

  const actionError =
    createMutation.error ||
    updateMutation.error ||
    deleteMutation.error ||
    exchangeRatesQuery.error;

  const errorMessage =
    actionError?.response?.data?.message ||
    actionError?.message ||
    "Something went wrong.";

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          theme={theme}
          title="Active Rate"
          value={
            activeRate
              ? `1 USD = ${formatRate(activeRate.usdToKhrRate)}៛`
              : "-"
          }
          subtitle={
            activeRate ? formatDate(activeRate.rateDate) : "No active rate"
          }
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Total Rates"
          value={exchangeRates.length}
          subtitle="All exchange rate records"
          icon={<FiRefreshCcw className="text-[34px] text-blue-500" />}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Inactive Records"
          value={inactiveCount}
          subtitle="Not used by system"
          icon={<FiXCircle className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="Search date, rate..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <div className="relative">
            <FiActivity
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.select}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row xl:shrink-0">
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 xl:min-w-[190px]"
          >
            <FiPlusCircle className="text-lg" />
            Add Exchange Rate
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {errorMessage}
        </div>
      )}

      <ExchangeRateTable
        theme={theme}
        rates={filteredRates}
        total={exchangeRates.length}
        isLoading={isLoading}
        isDeleting={deleteMutation.isPending}
        onEdit={openEditForm}
        onDelete={handleDelete}
      />

      {formState.open && (
        <ExchangeRateFormModal
          key={`${formState.mode}-${formState.selectedRate?.id ?? "new"}`}
          mode={formState.mode}
          selectedRate={formState.selectedRate}
          theme={theme}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}
    </section>
  );
}

function SummaryCard({ theme, icon, title, value, subtitle, iconBg }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${theme.muted}`}>
            {title}
          </p>

          <p className="mt-1 text-xl font-extrabold leading-tight break-words">
            {value}
          </p>

          {subtitle && (
            <p className={`mt-1 truncate text-xs ${theme.muted}`}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExchangeRateTable({
  theme,
  rates,
  total,
  isLoading,
  isDeleting,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-base font-bold">Exchange Rate List</h3>
          <p className={`mt-1 text-sm ${theme.muted}`}>
            Showing {rates.length} of {total} exchange rates
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left">
          <thead>
            <tr className="bg-red-600 text-sm text-white">
              <th className="px-5 py-4 font-bold">Date</th>
              <th className="px-5 py-4 font-bold">USD to KHR</th>
              <th className="px-5 py-4 font-bold">Rounding</th>
              <th className="px-5 py-4 font-bold">Status</th>
              <th className="px-5 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <TableLoading
                theme={theme}
                colSpan={5}
                text="Loading exchange rates..."
              />
            ) : rates.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className={`px-5 py-10 text-center ${theme.muted}`}
                >
                  No exchange rates found.
                </td>
              </tr>
            ) : (
              rates.map((rate) => (
                <tr key={rate.id} className={`border-t ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                        <FiCalendar />
                      </div>

                      <div>
                        <p className="font-bold">{formatDate(rate.rateDate)}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-extrabold">
                      1 USD = {formatRate(rate.usdToKhrRate)}៛
                    </p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Rate: {Number(rate.usdToKhrRate || 0)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${theme.softCard}`}
                    >
                      {roundingLabel(rate.khrRounding)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={rate.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(rate)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onDelete(rate)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isActive = normalizeStatus(status) === "active";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        isActive
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-red-500/10 text-red-500",
      ].join(" ")}
    >
      {isActive ? <FiCheckCircle /> : <FiXCircle />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ExchangeRateFormModal({
  mode,
  selectedRate,
  theme,
  isSaving,
  onClose,
  onSave,
}) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() => {
    if (isEdit && selectedRate) {
      return {
        rate_date: formatDate(selectedRate.rateDate),
        usd_to_khr_rate: formatRateInput(selectedRate.usdToKhrRate),
        khr_rounding:
          selectedRate.khrRounding ||
          selectedRate.khr_rounding ||
          selectedRate.raw?.khr_rounding ||
          "ceil",
        status: selectedRate.status || "active",
      };
    }

    return defaultFormValues;
  });

  const [error, setError] = useState("");

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const cleanPositiveNumber = (value, allowDecimal = true) => {
    let nextValue = String(value || "");

    nextValue = nextValue.replace(/-/g, "");
    nextValue = nextValue.replace(/\+/g, "");
    nextValue = nextValue.replace(/e/gi, "");

    if (allowDecimal) {
      nextValue = nextValue.replace(/[^0-9.]/g, "");

      const parts = nextValue.split(".");
      if (parts.length > 2) {
        nextValue = `${parts[0]}.${parts.slice(1).join("")}`;
      }

      return nextValue;
    }

    return nextValue.replace(/[^0-9]/g, "");
  };

  const preventInvalidNumberKey = (event, allowDecimal = true) => {
    const invalidKeys = ["-", "+", "e", "E"];

    if (!allowDecimal) {
      invalidKeys.push(".");
    }

    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  };

  const submitForm = (event) => {
    event.preventDefault();

    if (!form.rate_date) {
      setError("Rate date is required.");
      return;
    }

    if (!form.usd_to_khr_rate || Number(form.usd_to_khr_rate) <= 0) {
      setError("USD to KHR rate must be greater than 0.");
      return;
    }

    setError("");

    onSave({
      rate_date: form.rate_date,
      usd_to_khr_rate: Number(form.usd_to_khr_rate || 0),
      khr_rounding: form.khr_rounding || "ceil",
      status: form.status || "active",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div
        className={`flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
      >
        <div
          className={`flex items-start justify-between gap-4 border-b px-6 py-5 ${theme.modalHeader}`}
        >
          <div>
            <h2 className="text-xl font-extrabold">
              {isEdit ? "Edit Exchange Rate" : "Add Exchange Rate"}
            </h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>
              Set USD to KHR rate for Products, Purchases, Sales, and Reports.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <form
          onSubmit={submitForm}
          className={`overflow-y-auto p-6 ${theme.modalBody}`}
        >
          {error && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
              {error}
            </div>
          )}

          <div className={`rounded-2xl border p-5 shadow-sm ${theme.softCard}`}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Rate Date"
                required
                type="date"
                theme={theme}
                icon={<FiCalendar />}
                value={form.rate_date}
                onChange={(value) => updateForm("rate_date", value)}
              />

              <FormInput
                label="USD to KHR Rate"
                required
                theme={theme}
                icon={<span className="text-base font-bold">៛</span>}
                value={form.usd_to_khr_rate}
                onKeyDown={(event) => preventInvalidNumberKey(event, true)}
                onPaste={(event) => {
                  event.preventDefault();
                  const value = event.clipboardData.getData("text");
                  updateForm(
                    "usd_to_khr_rate",
                    cleanPositiveNumber(value, true)
                  );
                }}
                onChange={(value) =>
                  updateForm(
                    "usd_to_khr_rate",
                    cleanPositiveNumber(value, true)
                  )
                }
                placeholder="4000"
              />

              <FormSelect
                label="Status"
                theme={theme}
                icon={<FiActivity />}
                value={form.status}
                onChange={(value) => updateForm("status", value)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />

              <FormSelect
                label="KHR Rounding"
                theme={theme}
                icon={<FiActivity />}
                value={form.khr_rounding}
                onChange={(value) => updateForm("khr_rounding", value)}
                options={KHR_ROUNDING_OPTIONS}
              />

              <div className={`rounded-xl border p-4 ${theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>
                  Preview
                </p>

                <p className="mt-2 text-2xl font-extrabold">
                  1 USD = {formatRate(form.usd_to_khr_rate)}៛
                </p>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  Rounding: <strong>{form.khr_rounding}</strong>. Used for
                  product prices &amp; purchase costs.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheckCircle />
              {isSaving
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                ? "Update Rate"
                : "Save Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormInput({
  label,
  required = false,
  theme,
  icon,
  value,
  onChange,
  onKeyDown,
  onPaste,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <input
          type={type}
          inputMode={type === "text" ? "decimal" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input}`}
        />
      </div>
    </label>
  );
}

function FormSelect({ label, theme, icon, value, onChange, options }) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.select}`}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
