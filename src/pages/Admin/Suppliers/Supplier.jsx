import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiChevronDown,
  FiFilter,
  FiPlusCircle,
  FiSearch,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import {
  createSupplierApi,
  deleteSupplierApi,
  getSuppliersApi,
  updateSupplierApi,
} from "../../../services/supplier.service";

import SummaryCard from "./components/SummaryCard";
import SupplierTable from "./components/SupplierTable";
import SupplierFormModal from "./components/SupplierFormModal";
import ViewSupplierModal from "./components/ViewSupplierModal";

import { extractSuppliers, toSupplierPayload } from "./utils/supplierUtils";

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

export default function Supplier() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [modalMode, setModalMode] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

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

  const createMutation = useMutation({
    mutationFn: createSupplierApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeModal();
    },
    onError: (error) => {
      alert(error?.response?.data?.message || "Failed to create supplier.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSupplierApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeModal();
    },
    onError: (error) => {
      alert(error?.response?.data?.message || "Failed to update supplier.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplierApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error) => {
      alert(
        error?.response?.data?.message ||
          "Failed to delete supplier. This supplier may already be used in purchases."
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
    setSelectedSupplier(null);
    setModalMode("add");
  };

  const openViewModal = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode("view");
  };

  const openEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSupplier(null);
  };

  const handleSaveSupplier = (form) => {
    const payload = toSupplierPayload(form);

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

  const handleDeleteSupplier = (supplier) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}"?`
    );

    if (!confirmed) return;

    deleteMutation.mutate(supplier.id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const actionError =
    createMutation.error || updateMutation.error || deleteMutation.error;

  const actionErrorMessage =
    actionError?.response?.data?.message ||
    actionError?.message ||
    "Something went wrong.";

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryCard
          theme={theme}
          title="Total Suppliers"
          value={summary.total}
          icon={<FiTruck className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Active Suppliers"
          value={summary.active}
          icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Inactive Suppliers"
          value={summary.inactive}
          icon={<FiXCircle className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:max-w-4xl xl:grid-cols-[1fr_220px_160px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="Search supplier, contact, phone, address..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <div className="relative">
            <FiFilter
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${theme.select}`}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <FiChevronDown
              className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />
          </div>

          <div className="relative">
            <select
              value={perPage}
              onChange={(event) => setPerPage(Number(event.target.value))}
              className={`h-12 w-full appearance-none rounded-2xl border px-4 pr-10 text-sm outline-none transition focus:ring-4 ${theme.select}`}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <FiChevronDown
              className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <FiPlusCircle className="text-lg" />
          Add Supplier
        </button>
      </div>

      {suppliersQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {suppliersQuery.error?.response?.data?.message ||
            "Failed to load suppliers."}
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
        isDeleting={deleteMutation.isPending}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={handleDeleteSupplier}
      />

      {modalMode === "view" && selectedSupplier && (
        <ViewSupplierModal
          supplier={selectedSupplier}
          theme={theme}
          onClose={closeModal}
          onEdit={() => openEditModal(selectedSupplier)}
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
        />
      )}
    </section>
  );
}