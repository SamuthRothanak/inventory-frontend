import React, { useEffect, useId, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiSearch,
  FiPlusCircle,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiGrid,
  FiCheckCircle,
  FiXCircle,
  FiImage,
  FiX,
  FiSave,
  FiFilter,
  FiChevronDown,
  FiFileText,
  FiTag,
  FiInfo,
  FiLink,
  FiUploadCloud,
} from "react-icons/fi";

import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "../../../services/category.service";

const emptyForm = {
  name: "",
  description: "",
  imagePath: "",
  imageFile: null,
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

export default function Category() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useLockBodyScroll(Boolean(modalMode));

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategoriesApi(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const categories = useMemo(() => {
    const responseData = categoriesQuery.data?.data;

    const list = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
        ? responseData.data
        : [];

    return list.map((item) => ({
      id: item.id,
      name: item.name || "",
      description: item.description || "",
      imagePath: item.image || "",
      imageFile: null,
      status: item.status ? "Active" : "Inactive",
      createdAt: item.created_at ? item.created_at.slice(0, 10) : "-",
      updatedAt: item.updated_at
        ? item.updated_at.slice(0, 10)
        : item.created_at
          ? item.created_at.slice(0, 10)
          : "-",
    }));
  }, [categoriesQuery.data]);

  const totalCategories = categories.length;

  const activeCategories = categories.filter(
    (item) => item.status === "Active",
  ).length;

  const inactiveCategories = categories.filter(
    (item) => item.status === "Inactive",
  ).length;

  const filteredCategories = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return categories.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  const theme = {
    title: isDark ? "text-white" : "text-zinc-900",

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
    setSelectedCategory(null);
    setErrors({});
    setForm(emptyForm);
    setModalMode("add");
  };

  const openViewModal = (category) => {
    setErrors({});
    setSelectedCategory(category);
    setModalMode("view");
  };

  const openEditModal = (category) => {
    setErrors({});
    setSelectedCategory(category);
    setForm({
      name: category.name,
      description: category.description,
      imagePath: category.imagePath,
      imageFile: null,
      status: category.status,
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedCategory(null);
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

    if (!form.name.trim()) {
      nextErrors.name = "Category name is required.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveCategory = async () => {
    if (!validateForm()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      imagePath: form.imagePath,
      imageFile: form.imageFile,
      status: form.status,
    };

    try {
      if (modalMode === "add") {
        await createCategoryMutation.mutateAsync(payload);
        closeModal();
        return;
      }

      if (modalMode === "edit" && selectedCategory) {
        await updateCategoryMutation.mutateAsync({
          id: selectedCategory.id,
          payload,
        });

        closeModal();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong.";

      setErrors((previous) => ({
        ...previous,
        form: message,
      }));
    }
  };

  const handleToggleStatus = async (categoryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmed) return;

    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to delete category.");
    }
  };

  const isSaving =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryCard
          theme={theme}
          title="Total Categories"
          value={totalCategories}
          icon={<FiGrid className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Active Categories"
          value={activeCategories}
          icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Inactive Categories"
          value={inactiveCategories}
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
              placeholder="Search categories..."
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
          Add Category
        </button>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.title}`}>
              Category List
            </h2>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Showing {filteredCategories.length} of {categories.length}{" "}
              categories
            </p>
          </div>
        </div>

        {categoriesQuery.isLoading && (
          <div className={`px-5 py-10 text-center text-sm ${theme.muted}`}>
            Loading categories...
          </div>
        )}

        {categoriesQuery.isError && (
          <div className="px-5 py-10 text-center text-sm text-red-500">
            {categoriesQuery.error?.response?.data?.message ||
              "Failed to load categories."}
          </div>
        )}

        {!categoriesQuery.isLoading && !categoriesQuery.isError && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold">
                    Category
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold">
                    Description
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
                {filteredCategories.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t transition ${theme.row}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <CategoryThumb category={item} />

                        <div>
                          <p className="text-sm font-semibold leading-5">
                            {item.name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
                            >
                              Category
                            </span>

                            <span className={`text-xs ${theme.muted}`}>
                              Updated: {item.updatedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className={`max-w-[520px] text-sm leading-6 ${theme.muted}`}
                      >
                        {item.description || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-500 dark:text-red-400"
                        }`}
                      >
                        {item.status === "Active" ? (
                          <FiCheckCircle />
                        ) : (
                          <FiXCircle />
                        )}
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                          title="View category"
                        >
                          <FiEye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                          title="Edit category"
                        >
                          <FiEdit2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                          title="Delete category"
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCategories.length === 0 && (
                  <tr className={`border-t ${theme.row}`}>
                    <td colSpan="4" className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                        >
                          <FiSearch className={`text-3xl ${theme.muted}`} />
                        </div>

                        <p
                          className={`mt-4 text-sm font-semibold ${theme.title}`}
                        >
                          No categories found
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
        )}
      </div>

      {modalMode === "view" && selectedCategory && (
        <ViewCategoryModal
          category={selectedCategory}
          theme={theme}
          onClose={closeModal}
          onEdit={() => openEditModal(selectedCategory)}
        />
      )}

      {(modalMode === "add" || modalMode === "edit") && (
        <CategoryFormModal
          mode={modalMode}
          form={form}
          errors={errors}
          theme={theme}
          onChange={handleFormChange}
          onClose={closeModal}
          onSave={handleSaveCategory}
          isSaving={isSaving}
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

function CategoryThumb({ category, size = "normal", fit = "cover" }) {
  const image = category.imagePath;

  const sizeClass =
    size === "hero"
      ? "h-[280px] w-full rounded-[28px]"
      : size === "large"
        ? "h-44 w-full rounded-2xl"
        : "h-14 w-14 rounded-2xl";

  const objectClass = fit === "contain" ? "object-contain" : "object-cover";

  if (image) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-white/10 bg-zinc-100 dark:bg-[#202024] ${sizeClass}`}
      >
        <img
          src={image}
          alt={category.name || "Category"}
          className={`h-full w-full ${objectClass}`}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-white/10 bg-red-500/10 ${sizeClass}`}
    >
      <FiImage
        className={
          size === "hero" || size === "large"
            ? "text-5xl text-red-500"
            : "text-2xl text-red-500"
        }
      />
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

function ViewCategoryModal({ category, theme, onClose, onEdit }) {
  const isActive = category.status === "Active";

  return (
    <ModalShell
      title="Category Details"
      subtitle="Preview category image, status, and product grouping information."
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
            Edit Category
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div
          className={`overflow-hidden rounded-[28px] border shadow-sm ${theme.section}`}
        >
          <div className="relative bg-zinc-100 p-4 dark:bg-[#202024]">
            <CategoryThumb category={category} size="hero" fit="contain" />

            <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-b-[24px] bg-gradient-to-t from-black/60 to-transparent p-5">
              <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    Category
                  </p>

                  <h3 className="mt-1 truncate text-2xl font-bold text-white">
                    {category.name || "-"}
                  </h3>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {isActive ? <FiCheckCircle /> : <FiXCircle />}
                  {category.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
            <MiniInfoCard
              theme={theme}
              label="Name"
              value={category.name}
              icon={<FiTag />}
            />

            <MiniInfoCard
              theme={theme}
              label="Created"
              value={category.createdAt}
              icon={<FiFileText />}
            />

            <MiniInfoCard
              theme={theme}
              label="Updated"
              value={category.updatedAt}
              icon={<FiFileText />}
            />
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <SectionTitle
            icon={<FiFileText />}
            title="Description"
            subtitle="Extra information shown for product or POS grouping."
            theme={theme}
          />

          <div
            className={`mt-4 rounded-2xl border p-4 shadow-inner ${
              theme.softCard
            }`}
          >
            <p
              className={`text-sm leading-7 ${
                category.description ? theme.title : theme.muted
              }`}
            >
              {category.description || "No description provided."}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <SectionTitle
            icon={<FiLink />}
            title="Image Source"
            subtitle="Current image path used by this category."
            theme={theme}
          />

          <div className={`mt-4 rounded-2xl border p-4 ${theme.softCard}`}>
            <p className={`break-all text-sm leading-6 ${theme.muted}`}>
              {category.imagePath || "No image path available."}
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function MiniInfoCard({ label, value, theme, icon }) {
  return (
    <div className={`rounded-2xl border p-4 ${theme.softCard}`}>
      <div className="flex items-center gap-2">
        <span className={theme.muted}>{icon}</span>
        <p
          className={`text-xs font-bold uppercase tracking-wide ${theme.muted}`}
        >
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-sm font-bold">{value || "-"}</p>
    </div>
  );
}

function CategoryFormModal({
  mode,
  form,
  errors,
  theme,
  onChange,
  onClose,
  onSave,
  isSaving,
}) {
  const title = mode === "add" ? "Add Category" : "Edit Category";

  return (
    <ModalShell
      title={title}
      subtitle="Category image is optional but useful for POS category filters."
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
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave />
            {isSaving ? "Saving..." : "Save Category"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {errors.form && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errors.form}
          </div>
        )}

        <SectionTitle
          icon={<FiTag />}
          title="Basic Information"
          subtitle="Required category details for product management."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Category Name"
              required
              value={form.name}
              error={errors.name}
              onChange={(value) => onChange("name", value)}
              theme={theme}
              placeholder="Beverage"
              icon={<FiTag />}
            />

            <FormSelect
              label="Status"
              value={form.status}
              onChange={(value) => onChange("status", value)}
              options={["Active", "Inactive"]}
              theme={theme}
              icon={
                form.status === "Active" ? <FiCheckCircle /> : <FiXCircle />
              }
            />

            <div className="md:col-span-2">
              <FormImageInput
                label="Image"
                file={form.imageFile}
                preview={form.imagePath}
                error={errors.imagePath}
                onChange={(file) => {
                  onChange("imageFile", file);

                  if (file) {
                    onChange("imagePath", URL.createObjectURL(file));
                  }
                }}
                onRemove={() => {
                  onChange("imageFile", null);
                  onChange("imagePath", "");
                }}
                theme={theme}
              />
            </div>
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Description"
              value={form.description}
              onChange={(value) => onChange("description", value)}
              theme={theme}
              placeholder="Drinks, soda, water, and juice"
              icon={<FiFileText />}
            />
          </div>
        </div>

        <SectionTitle
          icon={<FiImage />}
          title="Preview"
          subtitle="How this category may appear in the POS screen."
          theme={theme}
        />

        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="flex items-center gap-4">
            <CategoryThumb
              category={{
                name: form.name || "Category",
                imagePath: form.imagePath,
              }}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {form.name || "Category Name"}
              </p>

              <p className={`mt-1 line-clamp-2 text-xs ${theme.muted}`}>
                {form.description || "Category description"}
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  form.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-500 dark:text-red-400"
                }`}
              >
                {form.status === "Active" ? <FiCheckCircle /> : <FiXCircle />}
                {form.status}
              </span>
            </div>
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

function FormImageInput({
  label,
  file,
  preview,
  onChange,
  onRemove,
  theme,
  error = "",
}) {
  const inputId = useId();

  return (
    <div className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div
        className={`rounded-2xl border border-dashed p-4 transition ${
          error
            ? "border-red-500 bg-red-500/5"
            : "border-zinc-300 bg-white/0 hover:border-red-400 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-red-500"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
            {preview ? (
              <img
                src={preview}
                alt="Category preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <FiImage className="text-3xl text-red-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <label
              htmlFor={inputId}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <FiUploadCloud className="text-lg" />
              Choose Image
            </label>

            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                onChange(selectedFile);
              }}
            />

            <p className={`mt-3 truncate text-sm ${theme.muted}`}>
              {file?.name || "PNG, JPG, JPEG up to your backend limit."}
            </p>

            {file && (
              <p className="mt-1 text-xs text-zinc-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {(file || preview) && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
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

      <p className="mt-2 break-all text-sm leading-6">{value || "-"}</p>
    </div>
  );
}
