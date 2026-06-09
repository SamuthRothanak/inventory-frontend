import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiFilter,
  FiGrid,
  FiHash,
  FiPlusCircle,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";

import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  bulkDeleteCategoriesApi,
} from "../../../services/category.service";

import CategorySummaryCard from "./components/CategorySummaryCard";
import CategoryTable from "./components/CategoryTable";
import CategoryFormModal from "./components/CategoryFormModal";
import CategoryViewModal from "./components/CategoryViewModal";
import CategoryDropdown from "./components/CategoryDropdown";
import { useNotification } from "../../../components/AppNotification";

import { extractCategories, normalizeCategory } from "./utils/categoryUtils";

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

function getMeta(response) {
  const data = response?.data;
  return data?.meta || response?.meta || null;
}

function getErrorMessage(error, fallback = "Something went wrong.") {
  const response = error?.response?.data;

  if (response?.message && response?.errors) {
    const firstError = Object.values(response.errors)?.[0]?.[0];
    return firstError || response.message;
  }

  return response?.message || error?.message || fallback;
}

async function getAllCategoriesForStats() {
  const firstResponse = await getCategoriesApi({
    page: 1,
    per_page: 9999,
  });

  const firstCategories = extractCategories(firstResponse);
  const meta = getMeta(firstResponse);

  const lastPage = Number(meta?.last_page || meta?.lastPage || 1);
  const apiPerPage = Number(meta?.per_page || meta?.perPage || 10);

  if (lastPage <= 1) {
    return {
      data: firstCategories,
    };
  }

  const pageRequests = [];

  for (let nextPage = 2; nextPage <= lastPage; nextPage += 1) {
    pageRequests.push(
      getCategoriesApi({
        page: nextPage,
        per_page: apiPerPage,
      })
    );
  }

  const otherResponses = await Promise.all(pageRequests);

  const otherCategories = otherResponses.flatMap((response) =>
    extractCategories(response)
  );

  return {
    data: [...firstCategories, ...otherCategories],
  };
}

export default function Category() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const queryClient = useQueryClient();
  const notify = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);

  const [modalState, setModalState] = useState({
    open: false,
    mode: null,
    selectedCategory: null,
  });

  const [serverMessage, setServerMessage] = useState("");

  useLockBodyScroll(modalState.open);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, perPage]);

  const categoriesQuery = useQuery({
    queryKey: ["categories", { page, perPage, searchTerm, statusFilter }],
    queryFn: () =>
      getCategoriesApi({
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

  const statsQuery = useQuery({
    queryKey: ["categories", "all-for-stats"],
    queryFn: getAllCategoriesForStats,
    keepPreviousData: true,
  });

  const rawCategories = useMemo(() => {
    return extractCategories(categoriesQuery.data);
  }, [categoriesQuery.data]);

  const categories = useMemo(() => {
    return rawCategories.map((item) => normalizeCategory(item));
  }, [rawCategories]);

  const pagination = useMemo(() => {
    return getPaginationMeta(categoriesQuery.data, categories.length);
  }, [categoriesQuery.data, categories.length]);

  const allCategories = useMemo(() => {
    return extractCategories(statsQuery.data).map((item) =>
      normalizeCategory(item)
    );
  }, [statsQuery.data]);

  const summary = useMemo(() => {
    const total = allCategories.length;
    const active = allCategories.filter(
      (item) => item.status === "Active"
    ).length;

    return {
      total,
      active,
      inactive: total - active,
    };
  }, [allCategories]);

  useEffect(() => {
    const visibleIds = new Set(categories.map((item) => Number(item.id)));
    setSelectedCategoryIds((previous) =>
      previous.filter((id) => visibleIds.has(Number(id)))
    );
  }, [categories]);

  const theme = {
    title: isDark ? "text-white" : "text-zinc-900",
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

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createCategoryMutation = useMutation({
    mutationFn: createCategoryApi,
    onSuccess: () => {
      invalidateCategories();
      notify.success("Category created", "The category has been saved.");
      closeModal();
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Create category failed.");
      setServerMessage(message);
      notify.error("Create failed", message);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategoryApi,
    onSuccess: () => {
      invalidateCategories();
      notify.success("Category updated", "The category has been updated.");
      closeModal();
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Update category failed.");
      setServerMessage(message);
      notify.error("Update failed", message);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategoryApi,
    onSuccess: () => {
      invalidateCategories();
      notify.success("Category deleted", "The category has been deleted.");
    },
    onError: (error) => {
      notify.error(
        "Delete failed",
        getErrorMessage(error, "Failed to delete category.")
      );
    },
  });

  const bulkDeleteCategoryMutation = useMutation({
    mutationFn: bulkDeleteCategoriesApi,
    onSuccess: () => {
      setSelectedCategoryIds([]);
      setBulkSelectMode(false);
      invalidateCategories();
      notify.success(
        "Categories deleted",
        "Selected categories have been deleted."
      );
    },
    onError: (error) => {
      notify.error(
        "Bulk delete failed",
        getErrorMessage(error, "Failed to delete selected categories.")
      );
    },
  });

  const openAddModal = () => {
    setServerMessage("");
    setModalState({
      open: true,
      mode: "add",
      selectedCategory: null,
    });
  };

  const openViewModal = (category) => {
    setServerMessage("");
    setModalState({
      open: true,
      mode: "view",
      selectedCategory: category,
    });
  };

  const openEditModal = (category) => {
    setServerMessage("");
    setModalState({
      open: true,
      mode: "edit",
      selectedCategory: category,
    });
  };

  const closeModal = () => {
    setServerMessage("");
    setModalState({
      open: false,
      mode: null,
      selectedCategory: null,
    });
  };

  const handleSaveCategory = (values) => {
    setServerMessage("");
    const normalizedName = values.name.trim().toLowerCase();
    const duplicateCategory = allCategories.find((category) => {
      const isSameCategory =
        modalState.mode === "edit" &&
        Number(category.id) === Number(modalState.selectedCategory?.id);

      return !isSameCategory && category.name.trim().toLowerCase() === normalizedName;
    });

    if (duplicateCategory) {
      const message = "This category name already exists.";
      setServerMessage(message);
      notify.error("Duplicate category", message);
      return;
    }

    if (modalState.mode === "edit" && modalState.selectedCategory) {
      updateCategoryMutation.mutate({
        id: modalState.selectedCategory.id,
        payload: values,
      });
      return;
    }

    createCategoryMutation.mutate(values);
  };

  const handleDeleteCategory = (categoryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    deleteCategoryMutation.mutate(categoryId);
  };

  const handleToggleCategory = (categoryId) => {
    if (!bulkSelectMode) return;

    setSelectedCategoryIds((previous) => {
      const id = Number(categoryId);
      if (previous.some((item) => Number(item) === id)) {
        return previous.filter((item) => Number(item) !== id);
      }

      return [...previous, id];
    });
  };

  const handleToggleAllCategories = () => {
    if (!bulkSelectMode) return;

    const pageIds = categories.map((category) => Number(category.id));
    const allSelected = pageIds.every((id) =>
      selectedCategoryIds.some((selectedId) => Number(selectedId) === id)
    );

    setSelectedCategoryIds((previous) => {
      if (allSelected) {
        return previous.filter((id) => !pageIds.includes(Number(id)));
      }

      return [...new Set([...previous.map(Number), ...pageIds])];
    });
  };

  const handleBulkDeleteCategories = () => {
    if (selectedCategoryIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCategoryIds.length} selected categor${selectedCategoryIds.length > 1 ? "ies" : "y"}?`
    );

    if (!confirmed) return;

    bulkDeleteCategoryMutation.mutate(selectedCategoryIds);
  };

  const openBulkSelectMode = () => {
    setBulkSelectMode(true);
  };

  const closeBulkSelectMode = () => {
    setBulkSelectMode(false);
    setSelectedCategoryIds([]);
  };

  const isSaving =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;
  const isDeleting =
    deleteCategoryMutation.isPending || bulkDeleteCategoryMutation.isPending;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CategorySummaryCard
          theme={theme}
          title="Total Categories"
          value={summary.total}
          icon={<FiGrid className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <CategorySummaryCard
          theme={theme}
          title="Active Categories"
          value={summary.active}
          icon={<FiCheckCircle className="text-[44px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <CategorySummaryCard
          theme={theme}
          title="Inactive Categories"
          value={summary.inactive}
          icon={<FiXCircle className="text-[44px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      {statsQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {statsQuery.error?.response?.data?.message ||
            "Failed to load category summary."}
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:max-w-4xl xl:grid-cols-[1fr_220px_160px]">
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

          <CategoryDropdown
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

          <CategoryDropdown
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
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 xl:min-w-[170px]"
        >
          <FiPlusCircle className="text-lg" />
          Add Category
        </button>
      </div>

      <CategoryTable
        categories={categories}
        totalCategories={pagination.total}
        pagination={pagination}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        isFetching={categoriesQuery.isFetching}
        isLoading={categoriesQuery.isLoading}
        isError={categoriesQuery.isError}
        error={categoriesQuery.error}
        deleteIsPending={isDeleting}
        bulkDeleteIsPending={bulkDeleteCategoryMutation.isPending}
        bulkSelectMode={bulkSelectMode}
        selectedCategoryIds={selectedCategoryIds}
        theme={theme}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={handleDeleteCategory}
        onOpenBulkSelect={openBulkSelectMode}
        onCancelBulkSelect={closeBulkSelectMode}
        onToggleSelect={handleToggleCategory}
        onToggleSelectAll={handleToggleAllCategories}
        onBulkDelete={handleBulkDeleteCategories}
      />

      {modalState.open &&
        modalState.mode === "view" &&
        modalState.selectedCategory && (
          <CategoryViewModal
            category={modalState.selectedCategory}
            theme={theme}
            onClose={closeModal}
            onEdit={() => openEditModal(modalState.selectedCategory)}
          />
        )}

      {modalState.open &&
        (modalState.mode === "add" || modalState.mode === "edit") && (
          <CategoryFormModal
            mode={modalState.mode}
            selectedCategory={modalState.selectedCategory}
            theme={theme}
            serverMessage={serverMessage}
            isSaving={isSaving}
            onClose={closeModal}
            onSave={handleSaveCategory}
          />
        )}
    </section>
  );
}
