import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "../../../components/ConfirmDialog";
import {
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiFileText,
  FiFilter,
  FiHash,
  FiPlusCircle,
  FiSearch,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import {
  bulkDeleteSuppliersApi,
  createSupplierApi,
  deleteSupplierApi,
  getSupplierCreditBalanceApi,
  getSuppliersApi,
  updateSupplierApi,
} from "../../../services/supplier.service";

import SummaryCard from "./components/SummaryCard";
import SupplierTable from "./components/SupplierTable";
import SupplierFormModal from "./components/SupplierFormModal";
import ViewSupplierModal from "./components/ViewSupplierModal";
import SupplierDropdown from "./components/SupplierDropdown";
import { useNotification } from "../../../components/AppNotification";

import { extractSuppliers, filterSuppliers, toSupplierPayload } from "./utils/supplierUtils";
import {
  exportSuppliersCsv,
  exportSuppliersExcel,
  exportSuppliersPdf,
} from "./utils/supplierExport";
import PermissionGate from "../../../components/PermissionGate";

function useLockBodyScroll(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
}

function getPaginationMeta(response, fallbackLength = 0) {
  const data = response?.data;
  const meta = data?.meta || response?.meta || null;

  if (meta) {
    return {
      currentPage: Number(meta.current_page || meta.currentPage || 1),
      perPage: Number(meta.per_page || meta.perPage || 10),
      total: Number(meta.total || fallbackLength),
      lastPage: Number(meta.last_page || meta.lastPage || 1),
      from: Number(meta.from || 0),
      to: Number(meta.to || 0),
    };
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      currentPage: Number(data.current_page || 1),
      perPage: Number(data.per_page || 10),
      total: Number(data.total || fallbackLength),
      lastPage: Number(data.last_page || 1),
      from: Number(data.from || 0),
      to: Number(data.to || 0),
    };
  }

  return {
    currentPage: 1,
    perPage: 10,
    total: fallbackLength,
    lastPage: Math.max(1, Math.ceil(fallbackLength / 10)),
    from: fallbackLength > 0 ? 1 : 0,
    to: fallbackLength,
  };
}

function getErrorMessage(error, fallback = "មានបញ្ហាមួយបានកើតឡើង។") {
  const response = error?.response?.data;

  if (response?.message && response?.errors) {
    const firstError = Object.values(response.errors)?.[0]?.[0];
    return firstError || response.message;
  }

  return response?.message || error?.message || fallback;
}

export default function Supplier() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();
  const notify = useNotification();
  const confirm = useConfirm();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [serverMessage, setServerMessage] = useState("");

  useLockBodyScroll(Boolean(modalMode));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, perPage]);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", { page, perPage, searchTerm, statusFilter }],
    queryFn: () =>
      getSuppliersApi({
        page,
        per_page: perPage,
        search: searchTerm || undefined,
        status:
          statusFilter === "All"
            ? undefined
            : statusFilter === "Active"
              ? "active"
              : "inactive",
      }),
    keepPreviousData: true,
  });

  // Stats — fetch all (per_page=9999) គណនា total/active/inactive ត្រឹមត្រូវ
  // (មិនមែនតែ page) — backend confirmed per_page=9999 return ទាំងអស់។
  const statsQuery = useQuery({
    queryKey: ["suppliers", "all-for-stats"],
    queryFn: () => getSuppliersApi({ per_page: 9999 }),
    keepPreviousData: true,
  });

  const suppliers = useMemo(() => {
    return extractSuppliers(suppliersQuery.data);
  }, [suppliersQuery.data]);

  // Only fetched while the view modal is actually open — no need to know every supplier's
  // credit balance up front just to render the list/table.
  const supplierCreditQuery = useQuery({
    queryKey: ["supplier-credit-balance", selectedSupplier?.id],
    queryFn: () => getSupplierCreditBalanceApi(selectedSupplier.id),
    enabled: modalMode === "view" && Boolean(selectedSupplier?.id),
  });
  const supplierCreditBalance = supplierCreditQuery.data?.data || null;

  const pagination = useMemo(() => {
    return getPaginationMeta(suppliersQuery.data, suppliers.length);
  }, [suppliersQuery.data, suppliers.length]);

  const summary = useMemo(() => {
    const allSuppliers = extractSuppliers(statsQuery.data);
    const total = allSuppliers.length;
    const active = allSuppliers.filter((s) => s.status === "Active").length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [statsQuery.data]);

  const allSuppliers = useMemo(() => {
    return extractSuppliers(statsQuery.data);
  }, [statsQuery.data]);

  const exportSuppliers = useMemo(
    () => filterSuppliers(allSuppliers, searchTerm, statusFilter),
    [allSuppliers, searchTerm, statusFilter]
  );

  useEffect(() => {
    const visibleIds = new Set(suppliers.map((item) => Number(item.id)));
    setSelectedSupplierIds((previous) =>
      previous.filter((id) => visibleIds.has(Number(id)))
    );
  }, [suppliers]);

  const invalidateSuppliers = () => {
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
  };

  const createMutation = useMutation({
    mutationFn: createSupplierApi,
    onSuccess: () => {
      invalidateSuppliers();
      notify.success("បង្កើតអ្នកផ្គត់ផ្គង់រួចរាល់", "អ្នកផ្គត់ផ្គង់ត្រូវបានរក្សាទុករួចហើយ។");
      closeModal();
    },
    onError: (error) => {
      const message = getErrorMessage(error, "មិនអាចបង្កើតអ្នកផ្គត់ផ្គង់បានទេ។");
      setServerMessage(message);
      notify.error("បង្កើតបរាជ័យ", message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSupplierApi,
    onSuccess: () => {
      invalidateSuppliers();
      notify.success("កែអ្នកផ្គត់ផ្គង់រួចរាល់", "អ្នកផ្គត់ផ្គង់ត្រូវបានធ្វើបច្ចុប្បន្នភាពរួចហើយ។");
      closeModal();
    },
    onError: (error) => {
      const message = getErrorMessage(error, "មិនអាចកែអ្នកផ្គត់ផ្គង់បានទេ។");
      setServerMessage(message);
      notify.error("កែបរាជ័យ", message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplierApi,
    onSuccess: () => {
      invalidateSuppliers();
      notify.success("លុបអ្នកផ្គត់ផ្គង់រួចរាល់", "អ្នកផ្គត់ផ្គង់ត្រូវបានលុបចោលរួចហើយ។");
    },
    onError: (error) => {
      notify.error(
        "លុបបរាជ័យ",
        getErrorMessage(
          error,
          "មិនអាចលុបអ្នកផ្គត់ផ្គង់បានទេ។ អ្នកផ្គត់ផ្គង់នេះអាចត្រូវបានប្រើរួចហើយក្នុងការទិញ។"
        )
      );
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteSuppliersApi,
    onSuccess: () => {
      setSelectedSupplierIds([]);
      setBulkSelectMode(false);
      invalidateSuppliers();
      notify.success(
        "លុបអ្នកផ្គត់ផ្គង់រួចរាល់",
        "អ្នកផ្គត់ផ្គង់ដែលបានជ្រើសរើសត្រូវបានលុបចោលរួចហើយ។"
      );
    },
    onError: (error) => {
      notify.error(
        "លុបជាក្រុមបរាជ័យ",
        getErrorMessage(error, "មិនអាចលុបអ្នកផ្គត់ផ្គង់ដែលបានជ្រើសរើសបានទេ។")
      );
    },
  });

  const theme = {
    pageTitle: isDark ? "text-white" : "text-zinc-900",

    card: isDark
      ? "border-white/10 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modal: isDark
      ? "border-white/10 bg-[#111113] text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modalHeader: isDark
      ? "border-white/10 bg-[#111113]"
      : "border-zinc-200 bg-white",

    modalBody: isDark ? "bg-[#151518]" : "bg-zinc-50/70",

    muted: isDark ? "text-zinc-400" : "text-zinc-500",

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

    address: isDark ? "text-zinc-400" : "text-zinc-600",

    note: isDark ? "text-zinc-400" : "text-zinc-600",

    badge: isDark
      ? "border-white/10 bg-white/5 text-zinc-200"
      : "border-zinc-200 bg-zinc-100 text-zinc-700",

    softCard: isDark
      ? "border-white/10 bg-white/[0.04]"
      : "border-zinc-200 bg-white",

    section: isDark
      ? "border-white/10 bg-[#18181b]"
      : "border-zinc-200 bg-white",
  };

  const openAddModal = () => {
    setServerMessage("");
    setSelectedSupplier(null);
    setModalMode("add");
  };

  const openViewModal = (supplier) => {
    setServerMessage("");
    setSelectedSupplier(supplier);
    setModalMode("view");
  };

  const openEditModal = (supplier) => {
    setServerMessage("");
    setSelectedSupplier(supplier);
    setModalMode("edit");
  };

  const closeModal = () => {
    setServerMessage("");
    setModalMode(null);
    setSelectedSupplier(null);
  };

  const handleSaveSupplier = (form) => {
    setServerMessage("");
    const payload = toSupplierPayload(form);
    const normalizedName = payload.name.trim().toLowerCase();
    const duplicateSupplier = allSuppliers.find((supplier) => {
      const isSameSupplier =
        modalMode === "edit" &&
        Number(supplier.id) === Number(selectedSupplier?.id);

      return !isSameSupplier && supplier.name.trim().toLowerCase() === normalizedName;
    });

    if (duplicateSupplier) {
      const message = "ឈ្មោះអ្នកផ្គត់ផ្គង់នេះមានរួចហើយ។";
      setServerMessage(message);
      notify.error("អ្នកផ្គត់ផ្គង់ស្ទួន", message);
      return;
    }

    if (modalMode === "add") {
      createMutation.mutate(payload);
      return;
    }

    if (modalMode === "edit" && selectedSupplier) {
      updateMutation.mutate({
        id: selectedSupplier.id,
        payload,
      });
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុប "${supplier.name}" មែនទេ?`);
    if (!ok) return;
    deleteMutation.mutate(supplier.id);
  };

  const handleToggleSupplier = (supplierId) => {
    if (!bulkSelectMode) return;

    setSelectedSupplierIds((previous) => {
      const id = Number(supplierId);
      if (previous.some((item) => Number(item) === id)) {
        return previous.filter((item) => Number(item) !== id);
      }

      return [...previous, id];
    });
  };

  const handleToggleAllSuppliers = () => {
    if (!bulkSelectMode) return;

    const pageIds = suppliers.map((supplier) => Number(supplier.id));
    const allSelected = pageIds.every((id) =>
      selectedSupplierIds.some((selectedId) => Number(selectedId) === id)
    );

    setSelectedSupplierIds((previous) => {
      if (allSelected) {
        return previous.filter((id) => !pageIds.includes(Number(id)));
      }

      return [...new Set([...previous.map(Number), ...pageIds])];
    });
  };

  const handleBulkDeleteSuppliers = async () => {
    if (selectedSupplierIds.length === 0) return;
    const ok = await confirm(`តើអ្នកប្រាកដថាចង់លុបអ្នកផ្គត់ផ្គង់ចំនួន ${selectedSupplierIds.length} ដែលបានជ្រើសរើសមែនទេ?`);
    if (!ok) return;
    bulkDeleteMutation.mutate(selectedSupplierIds);
  };

  const openBulkSelectMode = () => {
    setBulkSelectMode(true);
  };

  const closeBulkSelectMode = () => {
    setBulkSelectMode(false);
    setSelectedSupplierIds([]);
  };

  const handleExport = (type) => {
    setExportMenuOpen(false);
    if (type === "pdf") {
      const opened = exportSuppliersPdf(exportSuppliers);
      if (!opened) window.alert("Browser បាន block popup។ សូមអនុញ្ញាត popup រួច Export ម្តងទៀត។");
      return;
    }
    if (type === "excel") {
      exportSuppliersExcel(exportSuppliers);
      return;
    }
    exportSuppliersCsv(exportSuppliers);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending;

  const actionError =
    createMutation.error || updateMutation.error || deleteMutation.error;

  const actionErrorMessage =
    actionError?.response?.data?.message ||
    actionError?.message ||
          "មានបញ្ហាមួយបានកើតឡើង។";

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryCard
          theme={theme}
          title="ចំនួនអ្នកផ្គត់ផ្គង់សរុប"
          value={summary.total}
          icon={<FiTruck className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="អ្នកផ្គត់ផ្គង់ដំណើរការ"
          value={summary.active}
          icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="អ្នកផ្គត់ផ្គង់មិនដំណើរការ"
          value={summary.inactive}
          icon={<FiXCircle className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,1fr)_220px_160px_auto] xl:items-center">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="ស្វែងរកអ្នកផ្គត់ផ្គង់ ទំនាក់ទំនង ទូរស័ព្ទ ឬអាសយដ្ឋាន..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <SupplierDropdown
            icon={<FiFilter />}
            value={statusFilter}
            onChange={setStatusFilter}
            theme={theme}
            options={[
              { value: "All", label: "ស្ថានភាពទាំងអស់" },
              { value: "Active", label: "ដំណើរការ" },
              { value: "Inactive", label: "មិនដំណើរការ" },
            ]}
          />

          <SupplierDropdown
            icon={<FiHash />}
            value={perPage}
            onChange={(value) => setPerPage(Number(value))}
            theme={theme}
            options={[10, 25, 50].map((value) => ({
              value,
              label: `${value} / ទំព័រ`,
            }))}
          />

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap xl:justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => exportSuppliers.length > 0 && setExportMenuOpen((open) => !open)}
              disabled={exportSuppliers.length === 0}
              className={`inline-flex h-12 min-w-[142px] items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${theme.badge} hover:border-red-400 hover:text-red-500`}
            >
              <FiDownload className="text-lg" />
              Export
              <FiChevronDown className={`text-base transition ${exportMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {exportMenuOpen && (
              <div className={`absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border py-1 shadow-xl ${isDark ? "border-white/10 bg-zinc-900" : "border-zinc-200 bg-white"}`}>
                {[
                  ["pdf", "PDF", FiFileText],
                  ["excel", "Excel", FiFileText],
                  ["csv", "CSV", FiDownload],
                ].map(([type, label, Icon]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleExport(type)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition ${isDark ? "text-zinc-100 hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100"}`}
                  >
                    <Icon className="text-base" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <PermissionGate permission="suppliers.create">
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-12 min-w-[210px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              <FiPlusCircle className="text-lg" />
              បន្ថែមអ្នកផ្គត់ផ្គង់
            </button>
          </PermissionGate>
        </div>
      </div>

      {suppliersQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {suppliersQuery.error?.response?.data?.message ||
            "មិនអាចផ្ទុកអ្នកផ្គត់ផ្គង់បានទេ។"}
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {actionErrorMessage}
        </div>
      )}

      <SupplierTable
        theme={theme}
        suppliers={suppliers}
        totalSuppliers={pagination.total}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        isFetching={suppliersQuery.isFetching}
        isLoading={suppliersQuery.isLoading}
        isError={suppliersQuery.isError}
        isDeleting={isDeleting}
        bulkDeleteIsPending={bulkDeleteMutation.isPending}
        bulkSelectMode={bulkSelectMode}
        selectedSupplierIds={selectedSupplierIds}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={handleDeleteSupplier}
        onOpenBulkSelect={openBulkSelectMode}
        onCancelBulkSelect={closeBulkSelectMode}
        onToggleSelect={handleToggleSupplier}
        onToggleSelectAll={handleToggleAllSuppliers}
        onBulkDelete={handleBulkDeleteSuppliers}
      />

      {modalMode === "view" && selectedSupplier && (
        <ViewSupplierModal
          supplier={selectedSupplier}
          theme={theme}
          onClose={closeModal}
          onEdit={() => openEditModal(selectedSupplier)}
          creditBalance={supplierCreditBalance}
          creditBalanceLoading={supplierCreditQuery.isLoading}
        />
      )}

      {(modalMode === "add" || modalMode === "edit") && (
        <SupplierFormModal
          mode={modalMode}
          supplier={selectedSupplier}
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSaveSupplier}
          isSaving={isSaving}
          serverMessage={serverMessage}
        />
      )}
    </section>
  );
}
