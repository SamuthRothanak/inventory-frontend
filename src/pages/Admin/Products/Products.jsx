import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiChevronDown,
  FiDollarSign,
  FiFilter,
  FiGrid,
  FiLayers,
  FiPlusCircle,
  FiSearch,
} from "react-icons/fi";

import { getCategoriesApi } from "../../../services/category.service";

import {
  deleteProductApi,
  getProductsApi,
  updateProductApi,
} from "../../../services/product.service";

import { createProductSetupApi } from "../../../services/productSetup.service";

import {
  createProductVariantApi,
  deleteProductVariantApi,
  getProductVariantsApi,
  updateProductVariantApi,
} from "../../../services/productVariant.service";

import {
  createProductVariantUnitApi,
  deleteProductVariantUnitApi,
  getProductVariantUnitsApi,
  updateProductVariantUnitApi,
} from "../../../services/productVariantUnit.service";

import {
  createPriceRuleApi,
  deletePriceRuleApi,
  getPriceRulesApi,
  updatePriceRuleApi,
} from "../../../services/priceRule.service";

import {
  createUnitApi,
  deleteUnitApi,
  getUnitsApi,
  updateUnitApi,
} from "../../../services/unit.service";

import { getExchangeRatesApi } from "../../../services/exchangeRate.service";

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

import {
  attachProductChildren,
  extractApiData,
  normalizePriceRules,
  normalizeProducts,
  normalizeVariantUnits,
  normalizeVariants,
} from "./utils/productHelpers";

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

// ទាញ active rate + khr_rounding ពី list /exchange-rates
// យក record status === "active" ដែលមាន rate_date ថ្មីបំផុត
// return { rate, rounding }
function extractActiveRate(response) {
  const empty = { rate: 0, rounding: "ceil" };
  if (!response || response?.success === false) return empty;

  const list = extractApiData(response);
  if (!Array.isArray(list) || list.length === 0) return empty;

  const activeRecords = list.filter((item) => {
    const status = String(item.status ?? "").toLowerCase();
    return status === "active" || item.status === 1 || item.status === true;
  });

  const pool = activeRecords.length > 0 ? activeRecords : list;

  // sort តាម rate_date ថ្មីបំផុត (fallback id)
  const sorted = [...pool].sort((a, b) => {
    const dateA = new Date(a.rate_date || a.rateDate || 0).getTime();
    const dateB = new Date(b.rate_date || b.rateDate || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return Number(b.id || 0) - Number(a.id || 0);
  });

  const chosen = sorted[0];
  if (!chosen) return empty;

  const rate =
    chosen.usd_to_khr_rate ?? chosen.usdToKhrRate ?? chosen.rate ?? null;

  const num = Number(rate);
  const rounding =
    chosen.khr_rounding || chosen.khrRounding || "ceil";

  return {
    rate: Number.isFinite(num) && num > 0 ? num : 0,
    rounding,
  };
}

export default function Products() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [manageProduct, setManageProduct] = useState(null);

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

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, statusFilter, perPage]);

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
    queryKey: ["categories"],
    queryFn: () => getCategoriesApi({ per_page: 500 }),
  });

  const productsQuery = useQuery({
    queryKey: ["products", { page, perPage }],
    queryFn: () =>
      getProductsApi({
        page,
        per_page: perPage,
      }),
    keepPreviousData: true,
  });

  const variantsQuery = useQuery({
    queryKey: ["product-variants", "all"],
    queryFn: () => getProductVariantsApi({ per_page: 500 }),
  });

  const variantUnitsQuery = useQuery({
    queryKey: ["product-variant-units", "all"],
    queryFn: () => getProductVariantUnitsApi({ per_page: 500 }),
  });

  const priceRulesQuery = useQuery({
    queryKey: ["price-rules", "all"],
    queryFn: () => getPriceRulesApi({ per_page: 500 }),
  });

  const unitsQuery = useQuery({
    queryKey: ["units", "all"],
    queryFn: () => getUnitsApi({ per_page: 500 }),
  });

  // active exchange rate ពី list (ប្រើជំនួស hardcoded 4000)
  const activeRateQuery = useQuery({
    queryKey: ["exchange-rates", "list-for-active"],
    queryFn: () => getExchangeRatesApi({ per_page: 100 }),
    retry: false,
  });

  const { activeExchangeRate, activeKhrRounding } = useMemo(() => {
    const { rate, rounding } = extractActiveRate(activeRateQuery.data);
    return {
      activeExchangeRate: rate || 0, // 0 -> backend throw "No active rate"
      activeKhrRounding: rounding || "ceil",
    };
  }, [activeRateQuery.data]);

  const categories = useMemo(() => {
    return extractApiData(categoriesQuery.data);
  }, [categoriesQuery.data]);

  const units = useMemo(() => {
    return extractApiData(unitsQuery.data);
  }, [unitsQuery.data]);

  const products = useMemo(() => {
    const productItems = extractApiData(productsQuery.data);
    const variantItems = extractApiData(variantsQuery.data);
    const variantUnitItems = extractApiData(variantUnitsQuery.data);
    const priceRuleItems = extractApiData(priceRulesQuery.data);

    const normalizedProducts = normalizeProducts(productItems, categories);
    const normalizedVariants = normalizeVariants(variantItems);
    const normalizedVariantUnits = normalizeVariantUnits(variantUnitItems);
    const normalizedPriceRules = normalizePriceRules(priceRuleItems);

    return attachProductChildren({
      products: normalizedProducts,
      variants: normalizedVariants,
      variantUnits: normalizedVariantUnits,
      priceRules: normalizedPriceRules,
    });
  }, [
    productsQuery.data,
    variantsQuery.data,
    variantUnitsQuery.data,
    priceRulesQuery.data,
    categories,
  ]);

  const pagination = useMemo(() => {
    return getPaginationMeta(productsQuery.data, products.length);
  }, [productsQuery.data, products.length]);

  useEffect(() => {
    if (!selectedProduct) return;

    const freshProduct = products.find(
      (product) => Number(product.id) === Number(selectedProduct.id)
    );

    if (!freshProduct) {
      setSelectedProduct(null);
      return;
    }

    const changed =
      JSON.stringify(freshProduct) !== JSON.stringify(selectedProduct);

    if (changed) {
      setSelectedProduct(freshProduct);
    }
  }, [products, selectedProduct]);

  useEffect(() => {
    if (!manageProduct) return;

    const freshProduct = products.find(
      (product) => Number(product.id) === Number(manageProduct.id)
    );

    if (!freshProduct) {
      setManageProduct(null);
      return;
    }

    // update តែពេល data ពិតប្រែ (រួមទាំង nested priceRules)
    // ការពារ stale KHR ក្រោយ update price rule
    const changed =
      JSON.stringify(freshProduct) !== JSON.stringify(manageProduct);

    if (changed) {
      setManageProduct(freshProduct);
    }
  }, [products, manageProduct]);

  const isLoading =
    categoriesQuery.isLoading ||
    productsQuery.isLoading ||
    variantsQuery.isLoading ||
    variantUnitsQuery.isLoading ||
    priceRulesQuery.isLoading ||
    unitsQuery.isLoading;

  const isError =
    categoriesQuery.isError ||
    productsQuery.isError ||
    variantsQuery.isError ||
    variantUnitsQuery.isError ||
    priceRulesQuery.isError ||
    unitsQuery.isError;

  const invalidateProductQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product-variants"] });
    queryClient.invalidateQueries({ queryKey: ["product-variant-units"] });
    queryClient.invalidateQueries({ queryKey: ["price-rules"] });
    queryClient.invalidateQueries({ queryKey: ["units"] });
    queryClient.invalidateQueries({ queryKey: ["exchange-rates", "list-for-active"] });
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

  const openManageProduct = (product) => {
    setSelectedProduct(null);
    setManageProduct(product);
  };

  const closeManageProduct = () => {
    setManageProduct(null);
  };

  const createProductSetupMutation = useMutation({
    mutationFn: createProductSetupApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeProductSetupForm();
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
  });

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
  });

  const updateVariantUnitMutation = useMutation({
    mutationFn: updateProductVariantUnitApi,
    onSuccess: () => {
      invalidateProductQueries();
      closeVariantUnitForm();
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
  });

  const updatePriceRuleMutation = useMutation({
    mutationFn: updatePriceRuleApi,
    onSuccess: () => {
      invalidateProductQueries();
      closePriceRuleForm();
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

  const activeProducts = products.filter(
    (product) => product.status === "Active"
  ).length;

  const totalVariants = products.reduce(
    (total, product) => total + product.variants.length,
    0
  );

  const totalPriceRules = products.reduce(
    (total, product) =>
      total +
      product.variants.reduce(
        (variantTotal, variant) => variantTotal + variant.priceRules.length,
        0
      ),
    0
  );

  const productsWithoutVariants = products.filter(
    (product) => product.variants.length === 0
  ).length;

  const isCategoryActive = (category) => {
    const status = category.status ?? category.is_active;
    return (
      status === 1 ||
      status === "1" ||
      status === true ||
      status === "active"
    );
  };

  const categoryOptions = [
    { value: "All", label: "All Categories" },
    ...categories.filter(isCategoryActive).map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      String(product.id).includes(search) ||
      product.categoryName.toLowerCase().includes(search) ||
      product.variants.some(
        (variant) =>
          variant.variantName.toLowerCase().includes(search) ||
          variant.variantCode.toLowerCase().includes(search) ||
          variant.packageType.toLowerCase().includes(search)
      );

    const matchesCategory =
      categoryFilter === "All" ||
      String(product.categoryId) === String(categoryFilter);

    const matchesStatus =
      statusFilter === "All" || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openAddProductForm = () => {
    setSetupModalOpen(true);
  };

  const handleSaveProductSetup = (values) => {
    // pass active rate + rounding mode ទៅ orchestrator (pre-fill; backend re-calc)
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

    updateProductMutation.mutate({
      id: editingProduct.id,
      payload: values,
    });
  };

  const handleDeleteProduct = (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    deleteProductMutation.mutate(product.id);

    if (selectedProduct?.id === product.id) {
      setSelectedProduct(null);
    }

    if (manageProduct?.id === product.id) {
      setManageProduct(null);
    }
  };

  const openAddVariantSetupForm = (product) => {
    setVariantSetupState({
      open: true,
      product,
    });
  };

  const handleSaveVariantSetup = async (values) => {
    try {
      const variantResponse = await createVariantMutation.mutateAsync(
        values.variant
      );

      const variantId = getCreatedId(variantResponse);

      if (!variantId) {
        alert("Variant created, but variant id was not found in response.");
        return;
      }

      // Create each unit row; map local_key -> real product_variant_unit_id
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
            "Variant unit created, but variant unit id was not found in response."
          );
          return;
        }

        unitKeyToId[local_key] = variantUnitId;
      }

      // Create price rules; resolve unit by local_unit_key
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
        });
      }

      invalidateProductQueries();
      closeVariantSetupForm();
    } catch (error) {
      console.error("Create variant setup failed:", error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Create variant setup failed."
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
    const confirmed = window.confirm(
      `Delete variant "${variant.variantName}"?`
    );

    if (!confirmed) return;

    deleteVariantMutation.mutate(variant.id);
  };

  const openAddVariantUnitForm = (variant) => {
    setVariantUnitFormState({
      open: true,
      mode: "add",
      variant,
      variantUnit: null,
    });
  };

  const openEditVariantUnitForm = (variant, variantUnit) => {
    setVariantUnitFormState({
      open: true,
      mode: "edit",
      variant,
      variantUnit,
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
    const confirmed = window.confirm(`Delete unit "${variantUnit.unitName}"?`);

    if (!confirmed) return;

    deleteVariantUnitMutation.mutate(variantUnit.id);
  };

  const openAddPriceRuleForm = (variant, variantUnit) => {
    const unitId =
      variantUnit?.id ||
      variantUnit?.productVariantUnitId ||
      variantUnit?.product_variant_unit_id;

    if (!variant) {
      alert("Cannot find variant for this price rule.");
      return;
    }

    if (!variantUnit || !unitId) {
      alert("Please add or select a variant unit first before adding price.");
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
      alert("Cannot find variant for this price rule.");
      return;
    }

    if (!variantUnit || !unitId) {
      alert("Cannot find related unit for this price rule.");
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
    const productVariantUnitId =
      priceRuleFormState.variantUnit?.id ||
      priceRuleFormState.variantUnit?.productVariantUnitId ||
      priceRuleFormState.variantUnit?.product_variant_unit_id;

    if (!productVariantUnitId) {
      alert("Product variant unit id is missing.");
      return;
    }

    const payload = {
      ...values,
      product_variant_unit_id: productVariantUnitId,
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
    const confirmed = window.confirm("Delete this price rule?");

    if (!confirmed) return;

    deletePriceRuleMutation.mutate(priceRule.id);
  };

  const handleRefresh = () => {
    categoriesQuery.refetch();
    productsQuery.refetch();
    variantsQuery.refetch();
    variantUnitsQuery.refetch();
    priceRulesQuery.refetch();
    unitsQuery.refetch();
    activeRateQuery.refetch();
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          theme={theme}
          icon={<FiBox className="text-[34px] text-red-500" />}
          title="Total Products"
          value={pagination.total}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiCheckCircle className="text-[34px] text-emerald-500" />}
          title="Active Products"
          value={activeProducts}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiLayers className="text-[34px] text-blue-500" />}
          title="Variants on Page"
          value={totalVariants}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          title="Price Rules on Page"
          value={totalPriceRules}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiAlertTriangle className="text-[34px] text-amber-500" />}
          title="No Variant on Page"
          value={productsWithoutVariants}
          iconBg="bg-amber-500/10"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 xl:max-w-6xl xl:grid-cols-[1fr_220px_200px_160px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="Search product, category, variant, package..."
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
              { value: "All", label: "All Status" },
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
          />

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

        <div className="flex flex-col gap-3 sm:flex-row xl:shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 xl:min-w-[150px]"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddProductForm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 xl:min-w-[170px]"
          >
            <FiPlusCircle className="text-lg" />
            Add Product
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-500">
          Something went wrong while loading products. Please check your API,
          token, or service path.
        </div>
      )}

      {hasActionError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
          {getMutationErrorMessage()}
        </div>
      )}

      <ProductTable
        theme={theme}
        products={filteredProducts}
        totalProducts={pagination.total}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        isFetching={productsQuery.isFetching}
        isLoading={isLoading}
        isError={isError}
        isDeleting={deleteProductMutation.isPending}
        onViewProduct={setSelectedProduct}
        onEditProduct={openManageProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          theme={theme}
          onClose={() => setSelectedProduct(null)}
          onManageProduct={openManageProduct}
        />
      )}

      {manageProduct && (
        <ProductManageModal
          product={manageProduct}
          theme={theme}
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
        />
      )}

      {setupModalOpen && (
        <ProductSetupFormModal
          categories={categories}
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
          categories={categories}
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
    </section>
  );
}