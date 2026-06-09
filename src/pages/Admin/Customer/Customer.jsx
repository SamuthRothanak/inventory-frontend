import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiFilter,
  FiHash,
  FiPlusCircle,
  FiSearch,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";

import {
  bulkDeleteCustomersApi,
  getCustomersApi,
  createCustomerApi,
  updateCustomerApi,
  deleteCustomerApi,
} from "../../../services/customer.service";

import SummaryCard from "./components/SummaryCard";
import CustomerTable from "./components/CustomerTable";
import CustomerFormModal from "./components/CustomerFormModal";
import ViewCustomerModal from "./components/ViewCustomerModal";
import CustomerDropdown from "./components/CustomerDropdown";
import { useNotification } from "../../../components/AppNotification";

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

function getErrorMessage(error, fallback = "Something went wrong.") {
  const response = error?.response?.data;

  if (response?.message && response?.errors) {
    const firstError = Object.values(response.errors)?.[0]?.[0];
    return firstError || response.message;
  }

  return response?.message || error?.message || fallback;
}

export default function Customer() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();
  const notify = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);

  const [modalMode, setModalMode] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [serverMessage, setServerMessage] = useState("");

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

  // Stats — fetch all (per_page=9999) គណនា total/active/inactive ត្រឹមត្រូវ
  // (មិនមែនតែ page)។ Customer = អ្នកទិញដុំ (តិច) → fetch all OK។
  const statsQuery = useQuery({
    queryKey: ["customers", "all-for-stats"],
    queryFn: () => getCustomersApi({ per_page: 9999 }),
    keepPreviousData: true,
  });

  const customers = useMemo(() => {
    return extractCustomers(customersQuery.data);
  }, [customersQuery.data]);

  const pagination = useMemo(() => {
    return getPaginationMeta(customersQuery.data, customers.length);
  }, [customersQuery.data, customers.length]);

  const summary = useMemo(() => {
    const allCustomers = extractCustomers(statsQuery.data);
    const total = allCustomers.length;
    const active = allCustomers.filter((c) => c.status === "Active").length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [statsQuery.data]);

  const allCustomers = useMemo(() => {
    return extractCustomers(statsQuery.data);
  }, [statsQuery.data]);

  useEffect(() => {
    const visibleIds = new Set(customers.map((item) => Number(item.id)));
    setSelectedCustomerIds((previous) =>
      previous.filter((id) => visibleIds.has(Number(id)))
    );
  }, [customers]);

  const invalidateCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

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
      invalidateCustomers();
      notify.success("Customer created", "The customer has been saved.");
      closeModal();
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to create customer.");
      setServerMessage(message);
      notify.error("Create failed", message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomerApi,
    onSuccess: () => {
      invalidateCustomers();
      notify.success("Customer updated", "The customer has been updated.");
      closeModal();
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to update customer.");
      setServerMessage(message);
      notify.error("Update failed", message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerApi,
    onSuccess: () => {
      invalidateCustomers();
      notify.success("Customer deleted", "The customer has been deleted.");
    },
    onError: (error) => {
      notify.error(
        "Delete failed",
        getErrorMessage(
          error,
          "Failed to delete customer. This customer may already be used in sales."
        )
      );
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteCustomersApi,
    onSuccess: () => {
      setSelectedCustomerIds([]);
      setBulkSelectMode(false);
      invalidateCustomers();
      notify.success(
        "Customers deleted",
        "Selected customers have been deleted."
      );
    },
    onError: (error) => {
      notify.error(
        "Bulk delete failed",
        getErrorMessage(error, "Failed to delete selected customers.")
      );
    },
  });

  const openAddModal = () => {
    setServerMessage("");
    setSelectedCustomer(null);
    setModalMode("add");
  };

  const openViewModal = (customer) => {
    setServerMessage("");
    setSelectedCustomer(customer);
    setModalMode("view");
  };

  const openEditModal = (customer) => {
    setServerMessage("");
    setSelectedCustomer(customer);
    setModalMode("edit");
  };

  const closeModal = () => {
    setServerMessage("");
    setModalMode(null);
    setSelectedCustomer(null);
  };

  const handleSaveCustomer = (form) => {
    setServerMessage("");
    const payload = toCustomerPayload(form);
    const normalizedShopName = payload.shop_name.trim().toLowerCase();
    const duplicateCustomer = allCustomers.find((customer) => {
      const isSameCustomer =
        modalMode === "edit" &&
        Number(customer.id) === Number(selectedCustomer?.id);

      return (
        !isSameCustomer &&
        customer.shopName.trim().toLowerCase() === normalizedShopName
      );
    });

    if (duplicateCustomer) {
      const message = "This customer shop name already exists.";
      setServerMessage(message);
      notify.error("Duplicate customer", message);
      return;
    }

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

  const handleToggleCustomer = (customerId) => {
    if (!bulkSelectMode) return;

    setSelectedCustomerIds((previous) => {
      const id = Number(customerId);
      if (previous.some((item) => Number(item) === id)) {
        return previous.filter((item) => Number(item) !== id);
      }

      return [...previous, id];
    });
  };

  const handleToggleAllCustomers = () => {
    if (!bulkSelectMode) return;

    const pageIds = customers.map((customer) => Number(customer.id));
    const allSelected = pageIds.every((id) =>
      selectedCustomerIds.some((selectedId) => Number(selectedId) === id)
    );

    setSelectedCustomerIds((previous) => {
      if (allSelected) {
        return previous.filter((id) => !pageIds.includes(Number(id)));
      }

      return [...new Set([...previous.map(Number), ...pageIds])];
    });
  };

  const handleBulkDeleteCustomers = () => {
    if (selectedCustomerIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCustomerIds.length} selected customer${selectedCustomerIds.length > 1 ? "s" : ""}?`
    );

    if (!confirmed) return;

    bulkDeleteMutation.mutate(selectedCustomerIds);
  };

  const openBulkSelectMode = () => {
    setBulkSelectMode(true);
  };

  const closeBulkSelectMode = () => {
    setBulkSelectMode(false);
    setSelectedCustomerIds([]);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending || bulkDeleteMutation.isPending;

  const actionError =
    createMutation.error ||
    updateMutation.error ||
    deleteMutation.error ||
    bulkDeleteMutation.error;

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

          <CustomerDropdown
            icon={<FiFilter />}
            value={statusFilter}
            onChange={setStatusFilter}
            theme={theme}
            options={[
              { value: "All", label: "All Status" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />

          <CustomerDropdown
            icon={<FiHash />}
            value={perPage}
            onChange={(value) => setPerPage(Number(value))}
            theme={theme}
            options={[10, 25, 50].map((value) => ({
              value,
              label: `${value} / page`,
            }))}
          />
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
        isDeleting={isDeleting}
        bulkDeleteIsPending={bulkDeleteMutation.isPending}
        bulkSelectMode={bulkSelectMode}
        selectedCustomerIds={selectedCustomerIds}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={handleDeleteCustomer}
        onOpenBulkSelect={openBulkSelectMode}
        onCancelBulkSelect={closeBulkSelectMode}
        onToggleSelect={handleToggleCustomer}
        onToggleSelectAll={handleToggleAllCustomers}
        onBulkDelete={handleBulkDeleteCustomers}
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
          serverMessage={serverMessage}
        />
      )}
    </section>
  );
}
