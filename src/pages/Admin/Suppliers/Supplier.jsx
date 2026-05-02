import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiTruck,
  FiSearch,
  FiPlusCircle,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiSave,
  FiPhone,
  FiMapPin,
  FiUser,
  FiFilter,
  FiFileText,
  FiChevronDown,
  FiHash,
  FiInfo,
} from "react-icons/fi";

const initialSuppliers = [
  {
    id: 1,
    supplierCode: "SUP-001",
    name: "Thai Huot Trading",
    contactPerson: "Sok Dara",
    phone: "0887193924",
    address:
      "Kampong Po village, Kampong Phnim commune, Loek Dek district, Kandal province",
    note: "Main beverage supplier. Usually delivers Coca-Cola and other drinks.",
    status: "Active",
    createdAt: "2026-04-30",
    updatedAt: "2026-04-30",
  },
  {
    id: 2,
    supplierCode: "SUP-002",
    name: "Mengly Wholesale",
    contactPerson: "Mengly",
    phone: "0887193925",
    address: "Prek Pnov district, Phnom Penh, Cambodia",
    note: "Delivers every Monday.",
    status: "Inactive",
    createdAt: "2026-04-30",
    updatedAt: "2026-04-30",
  },
];

const emptyForm = {
  supplierCode: "",
  name: "",
  contactPerson: "",
  phone: "",
  address: "",
  note: "",
  status: "Active",
};

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

  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useLockBodyScroll(Boolean(modalMode));

  const totalSuppliers = suppliers.length;

  const activeSuppliers = suppliers.filter(
    (item) => item.status === "Active"
  ).length;

  const inactiveSuppliers = suppliers.filter(
    (item) => item.status === "Inactive"
  ).length;

  const filteredSuppliers = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return suppliers.filter((item) => {
      const matchesSearch =
        item.supplierCode.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.contactPerson.toLowerCase().includes(search) ||
        item.phone.toLowerCase().includes(search) ||
        item.address.toLowerCase().includes(search) ||
        item.note.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
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
    setErrors({});
    setForm({
      ...emptyForm,
      supplierCode: `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
    });
    setModalMode("add");
  };

  const openViewModal = (supplier) => {
    setErrors({});
    setSelectedSupplier(supplier);
    setModalMode("view");
  };

  const openEditModal = (supplier) => {
    setErrors({});
    setSelectedSupplier(supplier);
    setForm({
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      address: supplier.address,
      note: supplier.note,
      status: supplier.status,
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSupplier(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleFormChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.supplierCode.trim()) {
      nextErrors.supplierCode = "Supplier code is required.";
    }

    if (!form.name.trim()) {
      nextErrors.name = "Supplier name is required.";
    }

    if (form.phone.trim() && !/^[0-9+\-\s()]{6,20}$/.test(form.phone.trim())) {
      nextErrors.phone = "Please enter a valid phone number.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveSupplier = () => {
    if (!validateForm()) return;

    const now = new Date().toISOString().slice(0, 10);

    if (modalMode === "add") {
      const newSupplier = {
        id: Date.now(),
        supplierCode: form.supplierCode.trim(),
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        status: form.status,
        createdAt: now,
        updatedAt: now,
      };

      setSuppliers((previous) => [newSupplier, ...previous]);
      closeModal();
      return;
    }

    if (modalMode === "edit" && selectedSupplier) {
      setSuppliers((previous) =>
        previous.map((item) =>
          item.id === selectedSupplier.id
            ? {
                ...item,
                supplierCode: form.supplierCode.trim(),
                name: form.name.trim(),
                contactPerson: form.contactPerson.trim(),
                phone: form.phone.trim(),
                address: form.address.trim(),
                note: form.note.trim(),
                status: form.status,
                updatedAt: now,
              }
            : item
        )
      );

      closeModal();
    }
  };

  const handleToggleStatus = (supplierId) => {
    const now = new Date().toISOString().slice(0, 10);

    setSuppliers((previous) =>
      previous.map((item) =>
        item.id === supplierId
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
              updatedAt: now,
            }
          : item
      )
    );
  };

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

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
              Supplier List
            </h2>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Supplier
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Contact
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Address / Note
                </th>
                <th className="px-5 py-3 text-center text-sm font-semibold">
                  Status
                </th>
                <th className="px-5 py-3 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.map((item) => (
                <tr key={item.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiTruck size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {item.name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                          >
                            {item.supplierCode}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            Updated: {item.updatedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FiUser className={theme.muted} />
                        <span>{item.contactPerson || "No contact person"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <FiPhone className={theme.muted} />
                        <span>{item.phone || "-"}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <div
                        className={`flex max-w-[380px] gap-2 text-sm leading-6 ${theme.address}`}
                      >
                        <FiMapPin className="mt-1 shrink-0" />
                        <span className="line-clamp-2">
                          {item.address || "-"}
                        </span>
                      </div>

                      {item.note && (
                        <div
                          className={`flex max-w-[380px] gap-2 text-xs leading-5 ${theme.note}`}
                        >
                          <FiFileText className="mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{item.note}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openViewModal(item)}
                        title="View supplier"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title="Edit supplier"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id)}
                        title="Activate / Deactivate supplier"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSuppliers.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="5" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                      >
                        <FiSearch className={`text-3xl ${theme.muted}`} />
                      </div>

                      <p
                        className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                      >
                        No suppliers found
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Try changing your search keyword or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
          form={form}
          errors={errors}
          theme={theme}
          onChange={handleFormChange}
          onClose={closeModal}
          onSave={handleSaveSupplier}
        />
      )}
    </section>
  );
}

function SummaryCard({ theme, icon, iconBg, title, value }) {
  return (
    <div className={`rounded-2xl border px-6 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-5">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div>
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-2 text-4xl font-semibold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, theme, onClose, children, footer }) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex h-auto max-h-[90dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
      >
        <div className={`shrink-0 border-b px-6 py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>

              {subtitle && (
                <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        <div
          className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 ${theme.modalBody}`}
        >
          {children}
        </div>

        {footer && (
          <div className={`shrink-0 border-t px-6 py-4 ${theme.modalHeader}`}>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewSupplierModal({ supplier, theme, onClose, onEdit }) {
  return (
    <ModalShell
      title={supplier.name}
      subtitle={`${supplier.supplierCode} · Supplier / Distributor`}
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <FiEdit2 />
            Edit Supplier
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <SectionTitle
          icon={<FiInfo />}
          title="Supplier Information"
          subtitle="Main supplier profile and current status."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBox
              theme={theme}
              label="Supplier Code"
              value={supplier.supplierCode}
              icon={<FiHash />}
            />

            <InfoBox
              theme={theme}
              label="Supplier Name"
              value={supplier.name}
              icon={<FiTruck />}
            />

            <InfoBox
              theme={theme}
              label="Contact Person"
              value={supplier.contactPerson || "-"}
              icon={<FiUser />}
            />

            <InfoBox
              theme={theme}
              label="Phone"
              value={supplier.phone || "-"}
              icon={<FiPhone />}
            />

            <InfoBox
              theme={theme}
              label="Status"
              value={supplier.status}
              icon={
                supplier.status === "Active" ? <FiCheckCircle /> : <FiXCircle />
              }
            />

            <InfoBox
              theme={theme}
              label="Created At"
              value={supplier.createdAt}
              icon={<FiFileText />}
            />

            <InfoBox
              theme={theme}
              label="Updated At"
              value={supplier.updatedAt}
              icon={<FiFileText />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiMapPin />}
          title="Address & Note"
          subtitle="Delivery location and supplier remarks."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <DetailBlock
            theme={theme}
            label="Address"
            value={supplier.address || "-"}
            icon={<FiMapPin />}
          />

          <div className="mt-5">
            <DetailBlock
              theme={theme}
              label="Note"
              value={supplier.note || "-"}
              icon={<FiFileText />}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function SupplierFormModal({
  mode,
  form,
  errors,
  theme,
  onChange,
  onClose,
  onSave,
}) {
  const title = mode === "add" ? "Add Supplier" : "Edit Supplier";

  return (
    <ModalShell
      title={title}
      subtitle="Save supplier or distributor information used in purchase invoices."
      theme={theme}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            <FiSave />
            Save Supplier
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <SectionTitle
          icon={<FiTruck />}
          title="Basic Information"
          subtitle="Required supplier details for purchase management."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Supplier Code"
              required
              value={form.supplierCode}
              error={errors.supplierCode}
              onChange={(value) => onChange("supplierCode", value)}
              theme={theme}
              placeholder="SUP-001"
              icon={<FiHash />}
            />

            <FormInput
              label="Supplier Name"
              required
              value={form.name}
              error={errors.name}
              onChange={(value) => onChange("name", value)}
              theme={theme}
              placeholder="Thai Huot Trading"
              icon={<FiTruck />}
            />

            <FormInput
              label="Contact Person"
              value={form.contactPerson}
              onChange={(value) => onChange("contactPerson", value)}
              theme={theme}
              placeholder="Sok Dara"
              icon={<FiUser />}
            />

            <FormInput
              label="Phone"
              value={form.phone}
              error={errors.phone}
              onChange={(value) => onChange("phone", value)}
              theme={theme}
              placeholder="012345678"
              icon={<FiPhone />}
            />

            <FormSelect
              label="Status"
              value={form.status}
              onChange={(value) => onChange("status", value)}
              options={["Active", "Inactive"]}
              theme={theme}
              icon={form.status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiFileText />}
          title="Additional Information"
          subtitle="Optional address and note for this supplier."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <FormTextarea
            label="Address"
            value={form.address}
            onChange={(value) => onChange("address", value)}
            theme={theme}
            placeholder="Supplier address"
            icon={<FiMapPin />}
          />

          <div className="mt-4">
            <FormTextarea
              label="Note"
              value={form.note}
              onChange={(value) => onChange("note", value)}
              theme={theme}
              placeholder="Any supplier note..."
              icon={<FiFileText />}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function SectionTitle({ icon, title, subtitle, theme }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        status === "Active"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-500 dark:text-red-400"
      }`}
    >
      {status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
      {status}
    </span>
  );
}

function FormInput({
  label,
  required = false,
  value,
  onChange,
  theme,
  error = "",
  type = "text",
  placeholder = "",
  icon,
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
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  theme,
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`w-full resize-none rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${
            theme.input
          }`}
        />
      </div>
    </label>
  );
}

function FormSelect({ label, value, onChange, options, theme, icon }) {
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
          className={`h-11 w-full appearance-none rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm outline-none transition focus:ring-4 ${theme.select}`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <FiChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
        />
      </div>
    </label>
  );
}

function InfoBox({ label, value, theme, icon }) {
  return (
    <div className={`rounded-xl border p-3 ${theme.softCard}`}>
      <div className="flex items-center gap-2">
        {icon && <span className={theme.muted}>{icon}</span>}
        <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      </div>

      <p className="mt-2 text-sm font-semibold leading-6">{value || "-"}</p>
    </div>
  );
}

function DetailBlock({ label, value, theme, icon }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon && <span className={theme.muted}>{icon}</span>}
        <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>
      </div>

      <p className="mt-2 text-sm leading-6">{value || "-"}</p>
    </div>
  );
}