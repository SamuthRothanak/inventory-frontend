import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiBox,
  FiCheckCircle,
  FiDollarSign,
  FiFilter,
  FiGrid,
  FiHash,
  FiLayers,
  FiPlusCircle,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";

// ── Confirm Modal ──────────────────────────────────────────────
function ConfirmModal({ open, title, body, onConfirm, onCancel, theme }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl ${theme.modal}`}>
        <div className={`border-b px-5 py-4 ${theme.modalHeader}`}>
          <p className={`text-base font-bold ${theme.pageTitle}`}>{title}</p>
        </div>
        <div className="px-5 py-5">
          <p className={`text-sm leading-relaxed ${theme.muted}`}>{body}</p>
        </div>
        <div className={`flex justify-end gap-3 border-t px-5 py-4 ${theme.modalHeader}`}>
          <button type="button" onClick={onCancel}
            className="h-10 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10">
            បោះបង់
          </button>
          <button type="button" onClick={() => { onConfirm?.(); onCancel(); }}
            className="h-10 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600">
            បញ្ជាក់
          </button>
        </div>
      </div>
    </div>
  );
}

import { getAllCategoriesApi } from "../../../services/category.service";

import {
  bulkDeleteProductsApi,
  deleteProductApi,
  getProductByIdApi,
  getProductStatsApi,
  getProductsApi,
  toggleProductStatusApi,
  updateProductApi,
} from "../../../services/product.service";

import { createProductSetupApi } from "../../../services/productSetup.service";

import {
  createProductVariantApi,
  deleteProductVariantApi,
  updateProductVariantApi,
} from "../../../services/productVariant.service";

import {
  createProductVariantUnitApi,
  deleteProductVariantUnitApi,
  updateProductVariantUnitApi,
} from "../../../services/productVariantUnit.service";

import {
  createPriceRuleApi,
  deletePriceRuleApi,
  updatePriceRuleApi,
} from "../../../services/priceRule.service";

import {
  createUnitApi,
  deleteUnitApi,
  getUnitsApi,
  updateUnitApi,
} from "../../../services/unit.service";

import { getActiveExchangeRateApi } from "../../../services/exchangeRate.service";
import { useNotification } from "../../../components/AppNotification";

import ProductTable from "./components/ProductTable";
import ProductFormModal from "./components/ProductFormModal";
import ProductSetupFormModal from "./components/ProductSetupFormModal";
import ProductDetailModal from "./components/ProductDetailModal";
import ProductManageModal from "./components/ProductManageModal";
import ProductVariantFormModal from "./components/ProductVariantFormModal";
import ProductVariantUnitFormModal from "./components/ProductVariantUnitFormModal";
import VariantSetupFormModal from "./components/VariantSetupFormModal";
import PriceRuleFormModal from "./components/PriceRuleFormModal";
import SummaryCard from "./components/SummaryCard";
import FilterSelect from "./components/FilterSelect";

import { extractApiData } from "./utils/productHelpers";
import { extractActiveRate } from "./utils/productExchangeRate";
import {
  getSingleProductFromResponse,
  isActiveStatus,
  normalizeProduct,
} from "./utils/productNormalizers";
import { getPaginationMeta } from "./utils/productPagination";

export default function Products() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const queryClient = useQueryClient();
  const notify = useNotification();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [manageProductId, setManageProductId] = useState(null);

  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const [formMode, setFormMode] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [variantSetupState, setVariantSetupState] = useState({
    open: false,
    product: null,
  });

  const [variantFormState, setVariantFormState] = useState({
    open: false,
    mode: "add",
    product: null,
    variant: null,
  });

  const [variantUnitFormState, setVariantUnitFormState] = useState({
    open: false,
    mode: "add",
    variant: null,
    variantUnit: null,
  });

  const [priceRuleFormState, setPriceRuleFormState] = useState({
    open: false,
    mode: "add",
    variant: null,
    variantUnit: null,
    priceRule: null,
  });

  const [confirmState, setConfirmState] = useState({
    open: false, title: "", body: "", onConfirm: null,
  });
  const openConfirm = (title, body, onConfirm) =>
    setConfirmState({ open: true, title, body, onConfirm });
  const closeConfirm = () =>
    setConfirmState({ open: false, title: "", body: "", onConfirm: null });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, categoryFilter, statusFilter, perPage]);

  const theme = {
    isDark,

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

    subText: isDark ? "text-zinc-400" : "text-zinc-500",

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

  const categoriesQuery = useQuery({
    queryKey: ["categories", "active-for-products", { status: "active" }],
    queryFn: () => getAllCategoriesApi({ status: "active" }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  });

  const productsQuery = useQuery({
    queryKey: [
      "products",
      {
        page,
        perPage,
        search: debouncedSearchTerm,
        categoryFilter,
        statusFilter,
      },
    ],
    queryFn: () =>
      getProductsApi({
        page,
        per_page: perPage,
        search: debouncedSearchTerm || undefined,
        category_id: categoryFilter === "All" ? undefined : categoryFilter,
        status:
          statusFilter === "All"
            ? undefined
            : statusFilter === "Active"
              ? "active"
              : "inactive",
      }),
    keepPreviousData: true,
  });

  const productNameValidationQuery = useQuery({
    queryKey: ["products", "name-validation"],
    queryFn: () => getProductsApi({ per_page: 1000 }),
    enabled: setupModalOpen || formMode === "edit",
    staleTime: 1000 * 60,
  });

  const productStatsQuery = useQuery({
    queryKey: ["products", "stats"],
    queryFn: getProductStatsApi,
    staleTime: 1000 * 60 * 2,
  });

  const shouldLoadUnits =
    setupModalOpen ||
    variantSetupState.open ||
    variantUnitFormState.open;

  const unitsQuery = useQuery({
    queryKey: ["units", "all"],
    queryFn: () => getUnitsApi({ per_page: 500 }),
    enabled: shouldLoadUnits,
    staleTime: 1000 * 60 * 5,
  });

  const activeRateQuery = useQuery({
    queryKey: ["exchange-rates", "active"],
    queryFn: getActiveExchangeRateApi,
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  const selectedProductQuery = useQuery({
    queryKey: ["products", "detail", selectedProductId],
    queryFn: () => getProductByIdApi(selectedProductId),
    enabled: Boolean(selectedProductId),
  });

  const manageProductQuery = useQuery({
    queryKey: ["products", "detail", manageProductId],
    queryFn: () => getProductByIdApi(manageProductId),
    enabled: Boolean(manageProductId),
  });

  const { activeExchangeRate, activeKhrRounding } = useMemo(() => {
    const { rate, rounding } = extractActiveRate(activeRateQuery.data);

    return {
      activeExchangeRate: rate || 0,
      activeKhrRounding: rounding || "ceil",
    };
  }, [activeRateQuery.data]);

  const requireActiveExchangeRate = () => {
    if (Number(activeExchangeRate || 0) > 0) return true;

    notify.error(
      "គ្មានអត្រាប្តូរប្រាក់",
      "សូមបង្កើត និងដំណើរការអត្រាប្តូរប្រាក់មុនពេលរក្សាទុកតម្លៃ។"
    );

    return false;
  };

  const categories = useMemo(() => {
    return extractApiData(categoriesQuery.data);
  }, [categoriesQuery.data]);

  const activeCategories = useMemo(() => {
    return categories.filter((category) => {
      const status = category.status ?? category.is_active;
      return isActiveStatus(status);
    });
  }, [categories]);

  const units = useMemo(() => {
    return extractApiData(unitsQuery.data);
  }, [unitsQuery.data]);

  const products = useMemo(() => {
    const productItems = extractApiData(productsQuery.data);

    return productItems.map((product) => normalizeProduct(product, categories));
  }, [productsQuery.data, categories]);

  const productsForNameValidation = useMemo(() => {
    const productItems = extractApiData(productNameValidationQuery.data);
    const normalizedProducts = productItems.map((product) => normalizeProduct(product, categories));

    return normalizedProducts.length > 0 ? normalizedProducts : products;
  }, [productNameValidationQuery.data, products, categories]);

  const pagination = useMemo(() => {
    return getPaginationMeta(productsQuery.data, products.length);
  }, [productsQuery.data, products.length]);

  const productStats = useMemo(() => {
    const data = productStatsQuery.data?.data || productStatsQuery.data || {};

    return {
      total: Number(data.total_products || pagination.total || 0),
      active: Number(data.active_products || 0),
      inactive: Number(data.inactive_products || 0),
      variants: Number(data.total_variants || 0),
      priceRules: Number(data.total_price_rule || data.total_price_rules || 0),
      noVariant: Number(data.products_without_variants || 0),
    };
  }, [productStatsQuery.data, pagination.total]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;

    const detail = getSingleProductFromResponse(selectedProductQuery.data);

    if (detail) {
      return normalizeProduct(detail, categories);
    }

    return (
      products.find(
        (product) => Number(product.id) === Number(selectedProductId)
      ) || null
    );
  }, [selectedProductId, selectedProductQuery.data, products, categories]);

  const manageProduct = useMemo(() => {
    if (!manageProductId) return null;

    const detail = getSingleProductFromResponse(manageProductQuery.data);

    if (detail) {
      return normalizeProduct(detail, categories);
    }

    return (
      products.find(
        (product) => Number(product.id) === Number(manageProductId)
      ) || null
    );
  }, [manageProductId, manageProductQuery.data, products, categories]);

  const isLoading = categoriesQuery.isLoading || productsQuery.isLoading;

  const isError = categoriesQuery.isError || productsQuery.isError;

  const invalidateProductQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["units"] });
    queryClient.invalidateQueries({
      queryKey: ["exchange-rates", "active"],
    });
  };

  const getCreatedId = (response) => {
    return (
      response?.data?.id ||
      response?.id ||
      response?.data?.data?.id ||
      response?.data?.data?.data?.id ||
      response?.data?.data?.data?.data?.id ||
      null
    );
  };

  const getApiErrorMessage = (error, fallback = "Action failed.") => {
    const response = error?.response?.data;

    if (response?.message && response?.errors) {
      const firstError = Object.values(response.errors)?.[0]?.[0];
      return firstError || response.message;
    }

    return response?.message || error?.message || fallback;
  };

  const closeProductSetupForm = () => {
    setSetupModalOpen(false);
  };

  const closeProductForm = () => {
    setFormMode(null);
    setEditingProduct(null);
  };

  const closeVariantSetupForm = () => {
    setVariantSetupState({
      open: false,
      product: null,
    });
  };

  const closeVariantForm = () => {
    setVariantFormState({
      open: false,
      mode: "add",
      product: null,
      variant: null,
    });
  };

  const closeVariantUnitForm = () => {
    setVariantUnitFormState({
      open: false,
      mode: "add",
      variant: null,
      variantUnit: null,
    });
  };

  const closePriceRuleForm = () => {
    setPriceRuleFormState({
      open: false,
      mode: "add",
      variant: null,
      variantUnit: null,
      priceRule: null,
    });
  };

  const openViewProduct = (product) => {
    setManageProductId(null);
    setSelectedProductId(product.id);
  };

  const openManageProduct = (product) => {
    setSelectedProductId(null);
    setManageProductId(product.id);
  };

  const closeViewProduct = () => {
    setSelectedProductId(null);
  };

  const closeManageProduct = () => {
    setManageProductId(null);
  };

  const createProductSetupMutation = useMutation({
    mutationFn: createProductSetupApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeProductSetupForm();
    },
    onError: (error) => {
      invalidateProductQueries();
      notify.error("បង្កើតផលិតផលបរាជ័យ", getApiErrorMessage(error));
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: updateProductApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeProductForm();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      invalidateProductQueries();
    },
    onError: (error) => {
      notify.error("លុបផលិតផលបរាជ័យ", getApiErrorMessage(error, "មិនអាចលុបផលិតផលបានទេ។"));
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleProductStatusApi,
    onSuccess: () => {
      invalidateProductQueries();
    },
    onError: (error) => {
      notify.error("ផ្លាស់ប្ដូរស្ថានភាពបរាជ័យ", getApiErrorMessage(error));
    },
  });

  const handleToggleStatus = (product) => {
    const newStatus = String(product.status ?? "").toLowerCase() === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate({ id: product.id, status: newStatus });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteProductsApi,
    onSuccess: () => {
      setSelectedProductIds([]);
      setBulkSelectMode(false);
      invalidateProductQueries();
      notify.success("លុបផលិតផលរួចរាល់", "ផលិតផលដែលបានជ្រើសរើសត្រូវបានលុបចោលរួចហើយ។");
    },
    onError: (error) => {
      notify.error("លុបជាក្រុមបរាជ័យ", getApiErrorMessage(error, "មិនអាចលុបផលិតផលដែលបានជ្រើសរើសបានទេ។"));
    },
  });

  const openBulkSelectMode = () => setBulkSelectMode(true);
  const closeBulkSelectMode = () => {
    setBulkSelectMode(false);
    setSelectedProductIds([]);
  };

  const handleToggleProduct = (productId) => {
    if (!bulkSelectMode) return;
    setSelectedProductIds((prev) => {
      const id = Number(productId);
      return prev.some((item) => Number(item) === id)
        ? prev.filter((item) => Number(item) !== id)
        : [...prev, id];
    });
  };

  const handleToggleAllProducts = () => {
    if (!bulkSelectMode) return;
    const pageIds = products.map((p) => Number(p.id));
    const allSelected = pageIds.every((id) => selectedProductIds.some((sid) => Number(sid) === id));
    setSelectedProductIds((prev) => {
      if (allSelected) return prev.filter((id) => !pageIds.includes(Number(id)));
      return [...new Set([...prev.map(Number), ...pageIds])];
    });
  };

  const handleBulkDeleteProducts = () => {
    if (selectedProductIds.length === 0) return;
    openConfirm(
      "លុបផលិតផលជាក្រុម",
      `តើអ្នកប្រាកដថាចង់លុបផលិតផលចំនួន ${selectedProductIds.length} ដែលបានជ្រើសរើសមែនទេ? សកម្មភាពនេះមិនអាចប្ដូរវិញបាន។`,
      () => bulkDeleteMutation.mutate(selectedProductIds)
    );
  };

  const createVariantMutation = useMutation({
    mutationFn: createProductVariantApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeVariantForm();
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: updateProductVariantApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeVariantForm();
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: deleteProductVariantApi,
    onSuccess: () => {
      invalidateProductQueries();
    },
  });

  const createVariantUnitMutation = useMutation({
    mutationFn: createProductVariantUnitApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeVariantUnitForm();
    },
    onError: (error) => {
      notify.error("រក្សាទុក unit បរាជ័យ", getApiErrorMessage(error));
    },
  });

  const updateVariantUnitMutation = useMutation({
    mutationFn: updateProductVariantUnitApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeVariantUnitForm();
    },
    onError: (error) => {
      notify.error("ធ្វើបច្ចុប្បន្នភាព unit បរាជ័យ", getApiErrorMessage(error));
    },
  });

  const deleteVariantUnitMutation = useMutation({
    mutationFn: deleteProductVariantUnitApi,
    onSuccess: () => {
      invalidateProductQueries();
    },
  });

  const createPriceRuleMutation = useMutation({
    mutationFn: createPriceRuleApi,
    onSuccess: () => {
      invalidateProductQueries();
      closePriceRuleForm();
    },
    onError: (error) => {
      notify.error("រក្សាទុកតម្លៃបរាជ័យ", getApiErrorMessage(error));
    },
  });

  const updatePriceRuleMutation = useMutation({
    mutationFn: updatePriceRuleApi,
    onSuccess: () => {
      invalidateProductQueries();
      closePriceRuleForm();
    },
    onError: (error) => {
      notify.error("ធ្វើបច្ចុប្បន្នភាពតម្លៃបរាជ័យ", getApiErrorMessage(error));
    },
  });

  const deletePriceRuleMutation = useMutation({
    mutationFn: deletePriceRuleApi,
    onSuccess: () => {
      invalidateProductQueries();
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: createUnitApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: updateUnitApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: deleteUnitApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });

  const categoryOptions = [
    { value: "All", label: "ប្រភេទទាំងអស់" },
    ...activeCategories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];

  const openAddProductForm = () => {
    setSetupModalOpen(true);

    queryClient.prefetchQuery({
      queryKey: ["units", "all"],
      queryFn: () => getUnitsApi({ per_page: 500 }),
    });
  };

  const handleSaveProductSetup = (values) => {
    if (!requireActiveExchangeRate()) return;

    const newName = (values.product?.name || "").trim().toLowerCase();
    const isDuplicate = productsForNameValidation.some((p) => (p.name || "").trim().toLowerCase() === newName);
    if (isDuplicate) {
      notify.error("ឈ្មោះផលិតផលស្ទួន", `ផលិតផលឈ្មោះ "${values.product?.name}" មានរួចហើយ។`);
      return;
    }

    createProductSetupMutation.mutate({
      ...values,
      exchangeRate: activeExchangeRate,
      khrRounding: activeKhrRounding,
    });
  };

  const openEditProductForm = (product) => {
    setEditingProduct(product);
    setFormMode("edit");
  };

  const handleSaveProduct = (values) => {
    if (!editingProduct) return;

    const newName = (values.name || "").trim().toLowerCase();
    const isDuplicate = productsForNameValidation.some(
      (p) => (p.name || "").trim().toLowerCase() === newName && Number(p.id) !== Number(editingProduct.id)
    );
    if (isDuplicate) {
      notify.error("ឈ្មោះផលិតផលស្ទួន", `ផលិតផលឈ្មោះ "${values.name}" មានរួចហើយ។`);
      return;
    }

    updateProductMutation.mutate({
      id: editingProduct.id,
      payload: values,
    });
  };

  const handleDeleteProduct = (product) => {
    openConfirm(
      "លុបផលិតផល",
      `តើអ្នកប្រាកដថាចង់លុប "${product.name}"? សកម្មភាពនេះមិនអាចប្ដូរវិញបាន។`,
      () => {
        deleteProductMutation.mutate(product.id);
        if (Number(selectedProductId) === Number(product.id)) setSelectedProductId(null);
        if (Number(manageProductId) === Number(product.id)) setManageProductId(null);
      }
    );
  };

  const openAddVariantSetupForm = (product) => {
    setVariantSetupState({
      open: true,
      product,
    });

    queryClient.prefetchQuery({
      queryKey: ["units", "all"],
      queryFn: () => getUnitsApi({ per_page: 500 }),
    });
  };

  const handleSaveVariantSetup = async (values) => {
    if (!requireActiveExchangeRate()) return;

    try {
      const variantResponse = await createVariantMutation.mutateAsync(
        values.variant
      );

      const variantId = getCreatedId(variantResponse);

      if (!variantId) {
        alert("Variant ត្រូវបានបង្កើត ប៉ុន្តែ id រកមិនឃើញ។");
        return;
      }

      const unitKeyToId = {};

      for (const unit of values.units || []) {
        const { local_key, ...unitPayload } = unit;

        const variantUnitResponse =
          await createVariantUnitMutation.mutateAsync({
            ...unitPayload,
            product_variant_id: variantId,
          });

        const variantUnitId = getCreatedId(variantUnitResponse);

        if (!variantUnitId) {
          alert(
            "Variant unit ត្រូវបានបង្កើត ប៉ុន្តែ id រកមិនឃើញ។"
          );
          return;
        }

        unitKeyToId[local_key] = variantUnitId;
      }

      for (const rule of values.priceRules || []) {
        const { local_unit_key, ...rulePayload } = rule;
        const variantUnitId = unitKeyToId[local_unit_key];

        if (!variantUnitId) {
          console.warn(
            "Skip price rule: no matching unit for key",
            local_unit_key
          );
          continue;
        }

        await createPriceRuleMutation.mutateAsync({
          ...rulePayload,
          product_variant_unit_id: variantUnitId,
          exchange_rate_used: activeExchangeRate,
        });
      }

      invalidateProductQueries();

      if (manageProductId) {
        queryClient.invalidateQueries({
          queryKey: ["products", "detail", manageProductId],
        });
      }

      closeVariantSetupForm();
    } catch (error) {
      console.error("Create variant setup failed:", error);

      notify.error(
        "បង្កើត variant បរាជ័យ",
        getApiErrorMessage(error, "Create variant setup failed.")
      );
    }
  };

  const openAddVariantForm = (product) => {
    setVariantFormState({
      open: true,
      mode: "add",
      product,
      variant: null,
    });
  };

  const openEditVariantForm = (product, variant) => {
    setVariantFormState({
      open: true,
      mode: "edit",
      product,
      variant,
    });
  };

  const handleSaveVariant = (values) => {
    if (variantFormState.mode === "edit" && variantFormState.variant) {
      updateVariantMutation.mutate({
        id: variantFormState.variant.id,
        payload: values,
      });
      return;
    }

    createVariantMutation.mutate(values);
  };

  const handleDeleteVariant = (variant) => {
    openConfirm(
      "លុប Variant",
      `លុប variant "${variant.variantName}"? unit និងតម្លៃទាំងអស់នឹងត្រូវបានលុបផងដែរ។`,
      () => deleteVariantMutation.mutate(variant.id)
    );
  };

  const openAddVariantUnitForm = (variant) => {
    setVariantUnitFormState({
      open: true,
      mode: "add",
      variant,
      variantUnit: null,
    });

    queryClient.prefetchQuery({
      queryKey: ["units", "all"],
      queryFn: () => getUnitsApi({ per_page: 500 }),
    });
  };

  const openEditVariantUnitForm = (variant, variantUnit) => {
    setVariantUnitFormState({
      open: true,
      mode: "edit",
      variant,
      variantUnit,
    });

    queryClient.prefetchQuery({
      queryKey: ["units", "all"],
      queryFn: () => getUnitsApi({ per_page: 500 }),
    });
  };

  const handleSaveVariantUnit = (values) => {
    if (
      variantUnitFormState.mode === "edit" &&
      variantUnitFormState.variantUnit
    ) {
      updateVariantUnitMutation.mutate({
        id: variantUnitFormState.variantUnit.id,
        payload: values,
      });
      return;
    }

    createVariantUnitMutation.mutate(values);
  };

  const handleDeleteVariantUnit = (variantUnit) => {
    openConfirm(
      "លុប Unit",
      `លុប unit "${variantUnit.unitName}"? តម្លៃដែលភ្ជាប់នឹង unit នេះនឹងត្រូវបានលុបផងដែរ។`,
      () => deleteVariantUnitMutation.mutate(variantUnit.id)
    );
  };

  const openAddPriceRuleForm = (variant, variantUnit) => {
    const unitId =
      variantUnit?.id ||
      variantUnit?.productVariantUnitId ||
      variantUnit?.product_variant_unit_id;

    if (!variant) {
      alert("រកមិនឃើញ variant សម្រាប់តម្លៃនេះ។");
      return;
    }

    if (!variantUnit || !unitId) {
      alert("សូមបន្ថែម variant unit មុនពេលបញ្ចូលតម្លៃ។");
      return;
    }

    setPriceRuleFormState({
      open: true,
      mode: "add",
      variant,
      variantUnit: {
        ...variantUnit,
        id: unitId,
      },
      priceRule: null,
    });
  };

  const openEditPriceRuleForm = (variant, variantUnit, priceRule) => {
    const unitId =
      variantUnit?.id ||
      variantUnit?.productVariantUnitId ||
      variantUnit?.product_variant_unit_id;

    if (!variant) {
      alert("រកមិនឃើញ variant សម្រាប់តម្លៃនេះ។");
      return;
    }

    if (!variantUnit || !unitId) {
      alert("រកមិនឃើញ unit ដែលទាក់ទង។");
      return;
    }

    setPriceRuleFormState({
      open: true,
      mode: "edit",
      variant,
      variantUnit: {
        ...variantUnit,
        id: unitId,
      },
      priceRule,
    });
  };

  const handleSavePriceRule = (values) => {
    if (!requireActiveExchangeRate()) return;

    const productVariantUnitId =
      priceRuleFormState.variantUnit?.id ||
      priceRuleFormState.variantUnit?.productVariantUnitId ||
      priceRuleFormState.variantUnit?.product_variant_unit_id;

    if (!productVariantUnitId) {
      alert("Product variant unit id បាត់។");
      return;
    }

    const payload = {
      ...values,
      product_variant_unit_id: productVariantUnitId,
      exchange_rate_used: activeExchangeRate,
    };

    if (priceRuleFormState.mode === "edit" && priceRuleFormState.priceRule) {
      updatePriceRuleMutation.mutate({
        id: priceRuleFormState.priceRule.id,
        payload,
      });
      return;
    }

    createPriceRuleMutation.mutate(payload);
  };

  const handleDeletePriceRule = (priceRule) => {
    openConfirm(
      "លុបតម្លៃ",
      "តើអ្នកប្រាកដថាចង់លុបតម្លៃនេះ?",
      () => deletePriceRuleMutation.mutate(priceRule.id)
    );
  };

  const handleRefresh = () => {
    categoriesQuery.refetch();
    productsQuery.refetch();
    productStatsQuery.refetch();
    activeRateQuery.refetch();

    if (shouldLoadUnits) {
      unitsQuery.refetch();
    }

    if (selectedProductId) {
      selectedProductQuery.refetch();
    }

    if (manageProductId) {
      manageProductQuery.refetch();
    }
  };

  const hasActionError =
    createProductSetupMutation.isError ||
    updateProductMutation.isError ||
    deleteProductMutation.isError ||
    createVariantMutation.isError ||
    updateVariantMutation.isError ||
    deleteVariantMutation.isError ||
    createVariantUnitMutation.isError ||
    updateVariantUnitMutation.isError ||
    deleteVariantUnitMutation.isError ||
    createPriceRuleMutation.isError ||
    updatePriceRuleMutation.isError ||
    deletePriceRuleMutation.isError ||
    createUnitMutation.isError ||
    updateUnitMutation.isError ||
    deleteUnitMutation.isError;

  const getMutationErrorMessage = () => {
    const error =
      createProductSetupMutation.error ||
      updateProductMutation.error ||
      deleteProductMutation.error ||
      createVariantMutation.error ||
      updateVariantMutation.error ||
      deleteVariantMutation.error ||
      createVariantUnitMutation.error ||
      updateVariantUnitMutation.error ||
      updatePriceRuleMutation.error ||
      createPriceRuleMutation.error ||
      deletePriceRuleMutation.error ||
      createUnitMutation.error ||
      updateUnitMutation.error ||
      deleteUnitMutation.error;

    const response = error?.response?.data;

    if (response?.message && response?.errors) {
      const firstError = Object.values(response.errors)?.[0]?.[0];
      return firstError || response.message;
    }

    if (response?.message) return response.message;

    return (
      error?.message ||
      "Action failed. Please check Laravel validation error or API response."
    );
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          theme={theme}
          icon={<FiBox className="text-[34px] text-red-500" />}
          title="ផលិតផល"
          value={productStats.total}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiCheckCircle className="text-[34px] text-emerald-500" />}
          title="ដំណើរការ"
          value={productStats.active}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiLayers className="text-[34px] text-blue-500" />}
          title="មុខទំនិញ"
          value={productStats.variants}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          title="ចំនួនកំណត់តម្លៃលក់"
          value={productStats.priceRules}
          iconBg="bg-emerald-500/10"
        />

      </div>

      {productStatsQuery.isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {productStatsQuery.error?.response?.data?.message ||
            "មិនអាចផ្ទុកស្ថិតិផលិតផល។"}
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:max-w-6xl xl:grid-cols-[1fr_220px_200px_160px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="ស្វែងរកផលិតផល ឬប្រភេទ..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <FilterSelect
            icon={<FiGrid />}
            value={categoryFilter}
            onChange={setCategoryFilter}
            theme={theme}
            options={categoryOptions}
            searchable
          />

          <FilterSelect
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

          <FilterSelect
            icon={<FiHash />}
            value={perPage}
            onChange={(value) => setPerPage(Number(value))}
            theme={theme}
            options={[10, 20, 25, 50].map((value) => ({
              value,
              label: `${value} / ទំព័រ`,
            }))}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row xl:shrink-0">
          <button
            type="button"
            onClick={openAddProductForm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 xl:min-w-[170px]"
          >
            <FiPlusCircle className="text-lg" />
            បន្ថែមផលិតផល
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-500">
          មានបញ្ហាក្នុងការផ្ទុកផលិតផល។ សូមពិនិត្យ API ឬ token។
        </div>
      )}

      {hasActionError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {getMutationErrorMessage()}
        </div>
      )}

      <ProductTable
        theme={theme}
        products={products}
        totalProducts={pagination.total}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        isFetching={productsQuery.isFetching}
        isLoading={isLoading}
        isError={isError}
        isDeleting={deleteProductMutation.isPending}
        bulkSelectMode={bulkSelectMode}
        selectedProductIds={selectedProductIds}
        bulkDeleteIsPending={bulkDeleteMutation.isPending}
        onViewProduct={openViewProduct}
        onEditProduct={openManageProduct}
        onDeleteProduct={handleDeleteProduct}
        onToggleStatus={handleToggleStatus}
        onOpenBulkSelect={openBulkSelectMode}
        onCancelBulkSelect={closeBulkSelectMode}
        onToggleSelect={handleToggleProduct}
        onToggleSelectAll={handleToggleAllProducts}
        onBulkDelete={handleBulkDeleteProducts}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          theme={theme}
          isLoading={selectedProductQuery.isFetching}
          onClose={closeViewProduct}
          onManageProduct={openManageProduct}
        />
      )}

      {manageProduct && (
        <ProductManageModal
          product={manageProduct}
          theme={theme}
          isLoading={manageProductQuery.isFetching}
          onClose={closeManageProduct}
          onEditProduct={openEditProductForm}
          onAddVariant={openAddVariantSetupForm}
          onEditVariant={openEditVariantForm}
          onDeleteVariant={handleDeleteVariant}
          onAddVariantUnit={openAddVariantUnitForm}
          onEditVariantUnit={openEditVariantUnitForm}
          onDeleteVariantUnit={handleDeleteVariantUnit}
          onAddPriceRule={openAddPriceRuleForm}
          onEditPriceRule={openEditPriceRuleForm}
          onDeletePriceRule={handleDeletePriceRule}
          units={units}
          isCreatingUnit={createUnitMutation.isPending}
          isUpdatingUnit={updateUnitMutation.isPending}
          isDeletingUnit={deleteUnitMutation.isPending}
          onCreateUnit={async (payload) => {
            await createUnitMutation.mutateAsync(payload);
            await unitsQuery.refetch();
          }}
          onUpdateUnit={async ({ id, payload }) => {
            await updateUnitMutation.mutateAsync({ id, payload });
            await unitsQuery.refetch();
          }}
          onDeleteUnit={async (id) => {
            await deleteUnitMutation.mutateAsync(id);
            await unitsQuery.refetch();
          }}
        />
      )}

      {setupModalOpen && (
        <ProductSetupFormModal
          categories={activeCategories}
          units={units}
          theme={theme}
          activeExchangeRate={activeExchangeRate}
          activeKhrRounding={activeKhrRounding}
          isSaving={createProductSetupMutation.isPending}
          isCreatingUnit={createUnitMutation.isPending}
          isUpdatingUnit={updateUnitMutation.isPending}
          isDeletingUnit={deleteUnitMutation.isPending}
          onCreateUnit={async (payload) => {
            await createUnitMutation.mutateAsync(payload);
            await unitsQuery.refetch();
          }}
          onUpdateUnit={async ({ id, payload }) => {
            await updateUnitMutation.mutateAsync({ id, payload });
            await unitsQuery.refetch();
          }}
          onDeleteUnit={async (id) => {
            await deleteUnitMutation.mutateAsync(id);
            await unitsQuery.refetch();
          }}
          onClose={closeProductSetupForm}
          onSave={handleSaveProductSetup}
        />
      )}

      {variantSetupState.open && (
        <VariantSetupFormModal
          product={variantSetupState.product}
          units={units}
          theme={theme}
          activeExchangeRate={activeExchangeRate}
          activeKhrRounding={activeKhrRounding}
          isSaving={
            createVariantMutation.isPending ||
            createVariantUnitMutation.isPending ||
            createPriceRuleMutation.isPending
          }
          onClose={closeVariantSetupForm}
          onSave={handleSaveVariantSetup}
        />
      )}

      {formMode === "edit" && (
        <ProductFormModal
          mode={formMode}
          product={editingProduct}
          categories={activeCategories}
          theme={theme}
          isSaving={updateProductMutation.isPending}
          onClose={closeProductForm}
          onSave={handleSaveProduct}
        />
      )}

      {variantFormState.open && (
        <ProductVariantFormModal
          mode={variantFormState.mode}
          product={variantFormState.product}
          variant={variantFormState.variant}
          theme={theme}
          isSaving={
            createVariantMutation.isPending || updateVariantMutation.isPending
          }
          onClose={closeVariantForm}
          onSave={handleSaveVariant}
        />
      )}

      {variantUnitFormState.open && (
        <ProductVariantUnitFormModal
          mode={variantUnitFormState.mode}
          variant={variantUnitFormState.variant}
          variantUnit={variantUnitFormState.variantUnit}
          units={units}
          theme={theme}
          isSaving={
            createVariantUnitMutation.isPending ||
            updateVariantUnitMutation.isPending
          }
          onClose={closeVariantUnitForm}
          onSave={handleSaveVariantUnit}
        />
      )}

      {priceRuleFormState.open && (
        <PriceRuleFormModal
          mode={priceRuleFormState.mode}
          variant={priceRuleFormState.variant}
          variantUnit={priceRuleFormState.variantUnit}
          priceRule={priceRuleFormState.priceRule}
          theme={theme}
          activeExchangeRate={activeExchangeRate}
          activeKhrRounding={activeKhrRounding}
          isSaving={
            createPriceRuleMutation.isPending ||
            updatePriceRuleMutation.isPending
          }
          onClose={closePriceRuleForm}
          onSave={handleSavePriceRule}
        />
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        body={confirmState.body}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
        theme={theme}
      />
    </section>
  );
}
