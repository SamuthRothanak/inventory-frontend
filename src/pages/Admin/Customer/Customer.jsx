import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiChevronDown,
  FiFilter,
  FiPlusCircle,
  FiSearch,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";

import {
  getCustomersApi,
  createCustomerApi,
  updateCustomerApi,
  deleteCustomerApi,
} from "../../../services/customer.service";

import SummaryCard from "./components/SummaryCard";
import CustomerTable from "./components/CustomerTable";
import CustomerFormModal from "./components/CustomerFormModal";
import ViewCustomerModal from "./components/ViewCustomerModal";

import {
  extractCustomers,
  toCustomerPayload,
} from "./utils/customerUtils";

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

function getSummaryFromResponse(response, customers) {
  const data = response?.data;
  const summary = data?.summary || response?.summary || null;

  if (summary) {
    return {
      total: Number(summary.total || 0),
      active: Number(summary.active || 0),
      inactive: Number(summary.inactive || 0),
    };
  }

  return {
    total: customers.length,
    active: customers.filter((item) => item.status === "Active").length,
    inactive: customers.filter((item) => item.status === "Inactive").length,
  };
}

export default function Customer() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [modalMode, setModalMode] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useLockBodyScroll(Boolean(modalMode));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, perPage]);

  const customersQuery = useQuery({
    queryKey: ["customers", { page, perPage, searchTerm, statusFilter }],
    queryFn: () =>
      getCustomersApi({
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

  const customers = useMemo(() => {
    return extractCustomers(customersQuery.data);
  }, [customersQuery.data]);

  const pagination = useMemo(() => {
    return getPaginationMeta(customersQuery.data, customers.length);
  }, [customersQuery.data, customers.length]);

  const summary = useMemo(() => {
    return getSummaryFromResponse(customersQuery.data, customers);
  }, [customersQuery.data, customers]);

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

  const createMutation = useMutation({
    mutationFn: createCustomerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      closeModal();
    },
    onError: (error) => {
      alert(error?.response?.data?.message || "Failed to create customer.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      closeModal();
    },
    onError: (error) => {
      alert(error?.response?.data?.message || "Failed to update customer.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      alert(
        error?.response?.data?.message ||
          "Failed to delete customer. This customer may already be used in sales."
      );
    },
  });

  const openAddModal = () => {
    setSelectedCustomer(null);
    setModalMode("add");
  };

  const openViewModal = (customer) => {
    setSelectedCustomer(customer);
    setModalMode("view");
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCustomer(null);
  };

  const handleSaveCustomer = (form) => {
    const payload = toCustomerPayload(form);

    if (modalMode === "add") {
      createMutation.mutate(payload);
      return;
    }

    if (modalMode === "edit" && selectedCustomer) {
      updateMutation.mutate({
        id: selectedCustomer.id,
        payload,
      });
    }
  };

  const handleDeleteCustomer = (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${customer.shopName}"?`
    );

    if (!confirmed) return;

    deleteMutation.mutate(customer.id);
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
          title="Total Customers"
          value={summary.total}
          icon={<FiUsers className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Active Customers"
          value={summary.active}
          icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Inactive Customers"
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
              placeholder="Search customer, shop, phone, address..."
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
          Add Customer
        </button>
      </div>

      {customersQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {customersQuery.error?.response?.data?.message ||
            "Failed to load customers."}
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {actionErrorMessage}
        </div>
      )}

      <CustomerTable
        theme={theme}
        customers={customers}
        totalCustomers={pagination.total}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        isFetching={customersQuery.isFetching}
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        isDeleting={deleteMutation.isPending}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={handleDeleteCustomer}
      />

      {modalMode === "view" && selectedCustomer && (
        <ViewCustomerModal
          customer={selectedCustomer}
          theme={theme}
          onClose={closeModal}
          onEdit={() => openEditModal(selectedCustomer)}
        />
      )}

      {(modalMode === "add" || modalMode === "edit") && (
        <CustomerFormModal
          mode={modalMode}
          customer={selectedCustomer}
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSaveCustomer}
          isSaving={isSaving}
        />
      )}
    </section>
  );
}