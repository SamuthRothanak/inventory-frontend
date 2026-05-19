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
} from "../../../services/customer.service";

import SummaryCard from "./components/SummaryCard";
import CustomerTable from "./components/CustomerTable";
import CustomerFormModal from "./components/CustomerFormModal";
import ViewCustomerModal from "./components/ViewCustomerModal";

import {
  extractCustomers,
  filterCustomers,
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

export default function Customer() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useLockBodyScroll(Boolean(modalMode));

  const {
    data: customers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomersApi,
    select: extractCustomers,
  });

  const createMutation = useMutation({
    mutationFn: createCustomerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      closeModal();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: updateCustomerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (item) => item.status === "Active"
  ).length;

  const inactiveCustomers = customers.filter(
    (item) => item.status === "Inactive"
  ).length;

  const filteredCustomers = useMemo(() => {
    return filterCustomers(customers, searchTerm, statusFilter);
  }, [customers, searchTerm, statusFilter]);

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

  const handleToggleStatus = (customer) => {
    const nextStatus = customer.status === "Active" ? "Inactive" : "Active";

    toggleStatusMutation.mutate({
      id: customer.id,
      payload: {
        shop_name: customer.shopName,
        contact_name: customer.contactName,
        phone: customer.phone,
        address: customer.address,
        description: customer.note,
        status: nextStatus === "Active",
      },
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryCard
          theme={theme}
          title="Total Customers"
          value={totalCustomers}
          icon={<FiUsers className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Active Customers"
          value={activeCustomers}
          icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Inactive Customers"
          value={inactiveCustomers}
          icon={<FiXCircle className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:max-w-4xl xl:grid-cols-[1fr_220px]">
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

      <CustomerTable
        theme={theme}
        customers={customers}
        filteredCustomers={filteredCustomers}
        isLoading={isLoading}
        isError={isError}
        onView={openViewModal}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
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