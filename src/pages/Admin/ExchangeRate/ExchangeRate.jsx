import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "../../../components/ConfirmDialog";
import {
  FiActivity,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
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

  return response?.message || error?.message || "មានបញ្ហាមួយបានកើតឡើង។";
}

function normalizeStatus(value) {
  if (value === true || value === 1 || value === "1") return "active";
  if (value === false || value === 0 || value === "0") return "inactive";

  if (value === undefined || value === null || value === "") {
    return "inactive";
  }

  return String(value).toLowerCase();
}

const isDarkTheme = (theme = {}) => {
  const themeText = [theme.select, theme.input, theme.modal, theme.section].join(" ");
  return Boolean(theme.isDark) || themeText.includes("bg-[#") || themeText.includes("bg-zinc-900") || themeText.includes("text-white");
};

function ExchangeRateDropdown({
  label,
  theme,
  icon,
  value,
  onChange,
  options = [],
  searchable = false,
  heightClass = "h-12",
  roundedClass = "rounded-2xl",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const isDark = isDarkTheme(theme);
  const selectedOption = options.find((option) => String(option.value) === String(value)) || options[0];
  const visibleOptions =
    searchable && query
      ? options.filter((option) => String(option.label).toLowerCase().includes(query.toLowerCase()))
      : options;
  const dropdownClass = isDark
    ? "border-white/10 bg-[#18181b] text-zinc-100 shadow-2xl shadow-black/30"
    : "border-zinc-200 bg-white text-zinc-800 shadow-xl shadow-zinc-200/70";
  const searchInputClass = isDark
    ? "border-white/10 bg-[#111113] text-zinc-100 placeholder:text-zinc-500"
    : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>{label}</span>}
      <div className="relative">
        {icon && <span className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-lg ${theme.muted}`}>{icon}</span>}
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className={`flex ${heightClass} w-full items-center justify-between ${roundedClass} border ${icon ? "pl-11" : "pl-4"} pr-4 text-left text-sm outline-none transition focus:ring-4 ${theme.select}`}
        >
          <span className="truncate">{selectedOption?.label || "ជ្រើសរើស"}</span>
          <FiChevronDown className={`ml-2 shrink-0 text-lg transition ${theme.muted} ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className={`absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border ${dropdownClass}`}>
            {searchable && (
              <div className={`border-b p-2 ${isDark ? "border-white/10" : "border-zinc-200"}`}>
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ស្វែងរក..."
                  className={`h-9 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${searchInputClass}`}
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1">
              {visibleOptions.length === 0 ? (
                <div className={`px-4 py-3 text-sm ${theme.muted}`}>រកមិនឃើញជម្រើស</div>
              ) : (
                visibleOptions.map((option) => {
                  const isActive = String(option.value) === String(value);
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${isActive ? "bg-red-500/10 font-semibold text-red-500 dark:text-red-400" : isDark ? "text-zinc-200 hover:bg-white/[0.06] hover:text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"}`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isActive && <FiCheck className="ml-2 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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

const KHR_ROUNDING_OPTIONS_KM = [
  { value: "ceil", label: "បង្គត់ឡើង (2010 -> 2100)" },
  { value: "round", label: "បង្គត់ជិតបំផុត (2049 -> 2000, 2050 -> 2100)" },
  { value: "floor", label: "បង្គត់ចុះ (2090 -> 2000)" },
  { value: "none", label: "តម្លៃពិត (មិនបង្គត់)" },
];

function roundingLabel(value) {
  const map = {
    ceil: "បង្គត់ឡើង",
    round: "បង្គត់ជិតបំផុត",
    floor: "បង្គត់ចុះ",
    none: "តម្លៃពិត",
  };
  return map[value] || value || "បង្គត់ឡើង";
}

export default function ExchangeRate() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();
  const notify = useNotification();
  const confirm = useConfirm();

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
        "បានបង្កើតអត្រាប្តូរប្រាក់",
        "អត្រាប្តូរប្រាក់ថ្មីត្រូវបានរក្សាទុក។"
      );
      closeForm();
    },
    onError: (error) => {
      notify.error("បង្កើតមិនបាន", getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExchangeRateApi,
    onSuccess: () => {
      invalidateExchangeRateQueries();
      notify.success(
        "បានកែប្រែអត្រាប្តូរប្រាក់",
        "អត្រាប្តូរប្រាក់ត្រូវបានកែប្រែ។"
      );
      closeForm();
    },
    onError: (error) => {
      notify.error("កែប្រែមិនបាន", getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExchangeRateApi,
    onSuccess: () => {
      invalidateExchangeRateQueries();
      notify.success(
        "បានលុបអត្រាប្តូរប្រាក់",
        "ទិន្នន័យអត្រាប្តូរប្រាក់ត្រូវបានលុប។"
      );
    },
    onError: (error) => {
      notify.error("លុបមិនបាន", getErrorMessage(error));
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

  const handleDelete = async (rate) => {
    const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុបអត្រា ${formatRate(rate.usdToKhrRate)} រៀល នៅថ្ងៃ ${formatDate(rate.rateDate)}?`);
    if (!ok) return;
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
    "មានបញ្ហាមួយបានកើតឡើង។";

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          theme={theme}
          title="អត្រាកំពុងប្រើ"
          value={
            activeRate
              ? `1 USD = ${formatRate(activeRate.usdToKhrRate)} រៀល`
              : "-"
          }
          subtitle={
            activeRate ? formatDate(activeRate.rateDate) : "មិនទាន់មានអត្រាកំពុងប្រើ"
          }
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="អត្រាសរុប"
          value={exchangeRates.length}
          subtitle="ទិន្នន័យអត្រាប្តូរប្រាក់ទាំងអស់"
          icon={<FiRefreshCcw className="text-[34px] text-blue-500" />}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          theme={theme}
          title="មិនដំណើរការ"
          value={inactiveCount}
          subtitle="មិនត្រូវបានប្រើក្នុងប្រព័ន្ធ"
          icon={<FiXCircle className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 lg:max-w-[760px] lg:grid-cols-[minmax(280px,520px)_220px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="ស្វែងរកថ្ងៃ ឬអត្រាប្រាក់..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <ExchangeRateDropdown
            icon={<FiActivity />}
            value={statusFilter}
            onChange={setStatusFilter}
            theme={theme}
            options={[
              { value: "all", label: "ស្ថានភាពទាំងអស់" },
              { value: "active", label: "ដំណើរការ" },
              { value: "inactive", label: "មិនដំណើរការ" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row xl:shrink-0">
          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 xl:min-w-[190px]"
          >
            <FiPlusCircle className="text-lg" />
            បន្ថែមអត្រាប្តូរប្រាក់
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
          <h3 className="text-base font-bold">បញ្ជីអត្រាប្តូរប្រាក់</h3>
          <p className={`mt-1 text-sm ${theme.muted}`}>
            បង្ហាញ {rates.length} នៃ {total} អត្រា
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-left">
          <thead>
            <tr className="bg-red-600 text-sm text-white">
              <th className="px-5 py-4 font-bold">កាលបរិច្ឆេទ</th>
              <th className="px-5 py-4 font-bold">ដុល្លារ ទៅ រៀល</th>
              <th className="px-5 py-4 font-bold">ការបង្គត់</th>
              <th className="px-5 py-4 font-bold">ស្ថានភាព</th>
              <th className="px-5 py-4 text-right font-bold">សកម្មភាព</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <TableLoading
                theme={theme}
                colSpan={5}
                text="រង់ចាំបន្តិច..."
              />
            ) : rates.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className={`px-5 py-10 text-center ${theme.muted}`}
                >
                  រកមិនឃើញអត្រាប្តូរប្រាក់។
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
                      1 USD = {formatRate(rate.usdToKhrRate)} រៀល
                    </p>
                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      អត្រា: {Number(rate.usdToKhrRate || 0)}
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
                      <Tooltip label="កែប្រែ">
                        <button type="button" onClick={() => onEdit(rate)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700">
                          <FiEdit2 />
                        </button>
                      </Tooltip>
                      <Tooltip label="លុប">
                        <button type="button" disabled={isDeleting} onClick={() => onDelete(rate)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                          <FiTrash2 />
                        </button>
                      </Tooltip>
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

function Tooltip({ label, children }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
      </span>
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
      {isActive ? "ដំណើរការ" : "មិនដំណើរការ"}
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
      setError("សូមបញ្ចូលកាលបរិច្ឆេទអត្រាប្តូរប្រាក់។");
      return;
    }

    if (!form.usd_to_khr_rate || Number(form.usd_to_khr_rate) <= 0) {
      setError("អត្រា USD ទៅ KHR ត្រូវតែធំជាង 0។");
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
              {isEdit ? "កែប្រែអត្រាប្តូរប្រាក់" : "បន្ថែមអត្រាប្តូរប្រាក់"}
            </h2>
            <p className={`mt-1 text-sm ${theme.muted}`}>
              កំណត់អត្រា USD ទៅ KHR សម្រាប់ទំនិញ ការទិញ ការលក់ និងរបាយការណ៍។
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
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
                label="កាលបរិច្ឆេទអត្រា"
                required
                type="date"
                theme={theme}
                icon={<FiCalendar />}
                value={form.rate_date}
                onChange={(value) => updateForm("rate_date", value)}
              />

              <FormInput
                label="អត្រា USD ទៅ KHR"
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
                label="ស្ថានភាព"
                theme={theme}
                icon={<FiActivity />}
                value={form.status}
                onChange={(value) => updateForm("status", value)}
                options={[
                  { value: "active", label: "ដំណើរការ" },
                  { value: "inactive", label: "មិនដំណើរការ" },
                ]}
              />

              <FormSelect
                label="ការបង្គត់ប្រាក់រៀល"
                theme={theme}
                icon={<FiActivity />}
                value={form.khr_rounding}
                onChange={(value) => updateForm("khr_rounding", value)}
                options={KHR_ROUNDING_OPTIONS_KM}
              />

              <div className={`rounded-xl border p-4 ${theme.softCard}`}>
                <p className={`text-xs font-semibold ${theme.muted}`}>
                  មើលជាមុន
                </p>

                <p className="mt-2 text-2xl font-extrabold">
                  1 USD = {formatRate(form.usd_to_khr_rate)} រៀល
                </p>

                <p className={`mt-1 text-xs ${theme.muted}`}>
                  ការបង្គត់: <strong>{roundingLabel(form.khr_rounding)}</strong>។
                  ប្រើសម្រាប់តម្លៃទំនិញ និងថ្លៃដើមទិញ។
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
              បោះបង់
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheckCircle />
              {isSaving
                ? isEdit
                  ? "កំពុងកែប្រែ..."
                  : "កំពុងរក្សាទុក..."
                : isEdit
                ? "កែប្រែអត្រា"
                : "រក្សាទុកអត្រា"}
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
    <ExchangeRateDropdown
      label={label}
      theme={theme}
      icon={icon}
      value={value}
      onChange={onChange}
      options={options}
      searchable={options.length > 6}
      heightClass="h-11"
      roundedClass="rounded-xl"
    />
  );
}
