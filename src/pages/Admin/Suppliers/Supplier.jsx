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
  getSuppliersApi,
  updateSupplierApi,
} from "../../../services/supplier.service";

import SummaryCard from "./components/SummaryCard";
import SupplierTable from "./components/SupplierTable";
import SupplierFormModal from "./components/SupplierFormModal";
import ViewSupplierModal from "./components/ViewSupplierModal";

import {
  extractSuppliers,
  filterSuppliers,
  toSupplierPayload,
} from "./utils/supplierUtils";

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

export default function Supplier() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useLockBodyScroll(Boolean(modalMode));

  const {
    data: suppliers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliersApi,
    select: extractSuppliers,
  });

  const createMutation = useMutation({
    mutationFn: createSupplierApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSupplierApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      closeModal();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: updateSupplierApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const totalSuppliers = suppliers.length;

  const activeSuppliers = suppliers.filter(
    (item) => item.status === "Active"
  ).length;

  const inactiveSuppliers = suppliers.filter(
    (item) => item.status === "Inactive"
  ).length;

  const filteredSuppliers = useMemo(() => {
    return filterSuppliers(suppliers, searchTerm, statusFilter);
  }, [suppliers, searchTerm, statusFilter]);

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

  const handleToggleStatus = (supplier) => {
    const nextStatus = supplier.status === "Active" ? "inactive" : "active";

    toggleStatusMutation.mutate({
      id: supplier.id,
      payload: {
        name: supplier.name,
        contact_person: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        note: supplier.note,
        status: nextStatus,
      },
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryCard
          theme={theme}
          title="Total Suppliers"
          value={totalSuppliers}
          icon={<FiTruck className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Active Suppliers"
          value={activeSuppliers}
          icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Inactive Suppliers"
          value={inactiveSuppliers}
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

      <SupplierTable
        theme={theme}
        suppliers={suppliers}
        filteredSuppliers={filteredSuppliers}
        isLoading={isLoading}
        isError={isError}
        onView={openViewModal}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
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