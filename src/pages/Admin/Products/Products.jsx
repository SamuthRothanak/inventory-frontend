import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiBox,
  FiSearch,
  FiPlusCircle,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiLayers,
  FiPackage,
  FiTag,
  FiGrid,
  FiFilter,
  FiX,
  FiImage,
  FiSave,
  FiPlus,
  FiChevronDown,
  FiHash,
  FiInfo,
  FiFileText,
  FiDollarSign,
  FiShoppingCart,
} from "react-icons/fi";

const initialProducts = [
  {
    id: 1,
    productCode: "PRD-001",
    name: "Coca-Cola",
    category: "Beverage",
    brand: "Coca-Cola",
    description: "Soft drink",
    imagePath: "",
    isExpirable: true,
    status: "Active",
    variants: [
      {
        id: 101,
        variantCode: "COKE-CAN-330",
        sku: "COKE-CAN-330",
        variantName: "Coca-Cola Can 330ml",
        packageType: "Can",
        color: "Red",
        sizeValue: "330",
        sizeUnit: "ml",
        imagePath: "",
        lowStockThreshold: 20,
        stockBaseQty: 4320,
        baseUnit: "Can",
        units: [
          {
            unitName: "Can",
            conversionQty: 1,
            isBaseUnit: true,
            isDefaultSaleUnit: true,
            isDefaultPurchaseUnit: false,
          },
          {
            unitName: "Case",
            conversionQty: 24,
            isBaseUnit: false,
            isDefaultSaleUnit: false,
            isDefaultPurchaseUnit: true,
          },
        ],
        priceRules: [
          {
            appliesTo: "public",
            unitName: "Can",
            minQty: 1,
            usd: 0.5,
            khr: 2000,
          },
          {
            appliesTo: "public",
            unitName: "Case",
            minQty: 1,
            usd: 5,
            khr: 20000,
          },
          {
            appliesTo: "customer",
            unitName: "Case",
            minQty: 5,
            usd: 4,
            khr: 16000,
          },
        ],
      },
      {
        id: 102,
        variantCode: "COKE-BTL-1500",
        sku: "COKE-BTL-1500",
        variantName: "Coca-Cola Big Bottle 1.5L",
        packageType: "Bottle",
        color: "",
        sizeValue: "1.5",
        sizeUnit: "L",
        imagePath: "",
        lowStockThreshold: 10,
        stockBaseQty: 120,
        baseUnit: "Bottle",
        units: [
          {
            unitName: "Bottle",
            conversionQty: 1,
            isBaseUnit: true,
            isDefaultSaleUnit: true,
            isDefaultPurchaseUnit: false,
          },
          {
            unitName: "Case",
            conversionQty: 6,
            isBaseUnit: false,
            isDefaultSaleUnit: false,
            isDefaultPurchaseUnit: true,
          },
        ],
        priceRules: [
          {
            appliesTo: "public",
            unitName: "Bottle",
            minQty: 1,
            usd: 1.25,
            khr: 5000,
          },
          {
            appliesTo: "public",
            unitName: "Case",
            minQty: 1,
            usd: 7,
            khr: 28000,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    productCode: "PRD-002",
    name: "Dove Shampoo",
    category: "Soap / Care",
    brand: "Dove",
    description: "Hair care product",
    imagePath: "",
    isExpirable: true,
    status: "Active",
    variants: [
      {
        id: 201,
        variantCode: "DOVE-SHAMPOO-250",
        sku: "DOVE-SHAMPOO-250",
        variantName: "Dove Shampoo Small Bottle 250ml",
        packageType: "Bottle",
        color: "",
        sizeValue: "250",
        sizeUnit: "ml",
        imagePath: "",
        lowStockThreshold: 15,
        stockBaseQty: 96,
        baseUnit: "Bottle",
        units: [
          {
            unitName: "Bottle",
            conversionQty: 1,
            isBaseUnit: true,
            isDefaultSaleUnit: true,
            isDefaultPurchaseUnit: false,
          },
          {
            unitName: "Case",
            conversionQty: 12,
            isBaseUnit: false,
            isDefaultSaleUnit: false,
            isDefaultPurchaseUnit: true,
          },
        ],
        priceRules: [
          {
            appliesTo: "public",
            unitName: "Bottle",
            minQty: 1,
            usd: 2.5,
            khr: 10000,
          },
          {
            appliesTo: "customer",
            unitName: "Case",
            minQty: 3,
            usd: 25,
            khr: 100000,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    productCode: "PRD-003",
    name: "Sugar",
    category: "Food",
    brand: "Local",
    description: "Loose sugar",
    imagePath: "",
    isExpirable: false,
    status: "Active",
    variants: [
      {
        id: 301,
        variantCode: "SUGAR-LOOSE",
        sku: "SUGAR-LOOSE",
        variantName: "Sugar Loose",
        packageType: "Loose",
        color: "",
        sizeValue: "",
        sizeUnit: "Kg",
        imagePath: "",
        lowStockThreshold: 5000,
        stockBaseQty: 25000,
        baseUnit: "Gram",
        units: [
          {
            unitName: "Gram",
            conversionQty: 1,
            isBaseUnit: true,
            isDefaultSaleUnit: false,
            isDefaultPurchaseUnit: false,
          },
          {
            unitName: "Kg",
            conversionQty: 1000,
            isBaseUnit: false,
            isDefaultSaleUnit: true,
            isDefaultPurchaseUnit: true,
          },
        ],
        priceRules: [
          {
            appliesTo: "public",
            unitName: "Kg",
            minQty: 1,
            usd: 1,
            khr: 4000,
          },
        ],
      },
    ],
  },
];

const emptyProductForm = {
  productCode: "",
  name: "",
  category: "Beverage",
  brand: "",
  description: "",
  imagePath: "",
  isExpirable: true,
  status: "Active",
};

const emptyVariantForm = {
  variantCode: "",
  sku: "",
  variantName: "",
  packageType: "",
  color: "",
  sizeValue: "",
  sizeUnit: "",
  imagePath: "",
  lowStockThreshold: 0,
  stockBaseQty: 0,

  baseUnitName: "Piece",
  purchaseUnitName: "Case",
  purchaseConversionQty: 1,

  publicUnitName: "Piece",
  publicPriceUsd: 0,
  publicPriceKhr: 0,

  caseUnitName: "Case",
  casePriceUsd: 0,
  casePriceKhr: 0,

  wholesaleUnitName: "Case",
  wholesaleMinQty: 5,
  wholesalePriceUsd: 0,
  wholesalePriceKhr: 0,
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

export default function Products() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [productVariants, setProductVariants] = useState([]);

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantEditIndex, setVariantEditIndex] = useState(null);
  const [variantForm, setVariantForm] = useState(emptyVariantForm);

  const [productErrors, setProductErrors] = useState({});
  const [variantErrors, setVariantErrors] = useState({});

  useLockBodyScroll(Boolean(modalMode || variantModalOpen));

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

    active: isDark ? "text-emerald-400" : "text-emerald-600",

    inactive: isDark ? "text-red-400" : "text-red-500",

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

  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((item) => item.category))];
  }, [products]);

  const activeProducts = products.filter(
    (item) => item.status === "Active"
  ).length;

  const totalVariants = products.reduce(
    (total, product) => total + product.variants.length,
    0
  );

  const lowStockProducts = products.filter((product) =>
    product.variants.some(
      (variant) =>
        Number(variant.stockBaseQty) <= Number(variant.lowStockThreshold)
    )
  ).length;

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.productCode.toLowerCase().includes(search) ||
      product.brand.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.variants.some(
        (variant) =>
          variant.variantName.toLowerCase().includes(search) ||
          variant.variantCode.toLowerCase().includes(search) ||
          variant.sku.toLowerCase().includes(search)
      );

    const matchesCategory =
      categoryFilter === "All" || product.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openAddProductModal = () => {
    setSelectedProduct(null);
    setProductErrors({});
    setVariantErrors({});
    setProductForm({
      ...emptyProductForm,
      productCode: `PRD-${String(products.length + 1).padStart(3, "0")}`,
    });
    setProductVariants([]);
    setModalMode("add");
  };

  const openViewProductModal = (product) => {
    setProductErrors({});
    setVariantErrors({});
    setSelectedProduct(product);
    setModalMode("view");
  };

  const openEditProductModal = (product) => {
    setProductErrors({});
    setVariantErrors({});
    setSelectedProduct(product);

    setProductForm({
      productCode: product.productCode,
      name: product.name,
      category: product.category,
      brand: product.brand,
      description: product.description,
      imagePath: product.imagePath,
      isExpirable: product.isExpirable,
      status: product.status,
    });

    setProductVariants(product.variants);
    setModalMode("edit");
  };

  const closeProductModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
    setProductForm(emptyProductForm);
    setProductVariants([]);
    setProductErrors({});
    setVariantErrors({});
    closeVariantModal();
  };

  const handleProductFormChange = (field, value) => {
    setProductForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setProductErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const handleVariantFormChange = (field, value) => {
    setVariantForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setVariantErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const openAddVariantModal = () => {
    setVariantErrors({});
    setVariantEditIndex(null);
    setVariantForm({
      ...emptyVariantForm,
      variantCode: `${productForm.productCode || "PRD"}-VAR-${String(
        productVariants.length + 1
      ).padStart(3, "0")}`,
      sku: `${productForm.productCode || "PRD"}-SKU-${String(
        productVariants.length + 1
      ).padStart(3, "0")}`,
      variantName: productForm.name ? `${productForm.name} ` : "",
    });
    setVariantModalOpen(true);
  };

  const openEditVariantModal = (variant, index) => {
    const baseUnit =
      variant.units.find((unit) => unit.isBaseUnit) || variant.units[0];

    const purchaseUnit =
      variant.units.find((unit) => unit.isDefaultPurchaseUnit) || baseUnit;

    const publicPrice =
      variant.priceRules.find((rule) => rule.appliesTo === "public") ||
      variant.priceRules[0] ||
      {};

    const casePrice =
      variant.priceRules.find(
        (rule) =>
          rule.appliesTo === "public" && rule.unitName !== publicPrice.unitName
      ) || {};

    const wholesalePrice =
      variant.priceRules.find((rule) => rule.appliesTo === "customer") || {};

    setVariantErrors({});
    setVariantEditIndex(index);
    setVariantForm({
      variantCode: variant.variantCode,
      sku: variant.sku,
      variantName: variant.variantName,
      packageType: variant.packageType,
      color: variant.color,
      sizeValue: variant.sizeValue,
      sizeUnit: variant.sizeUnit,
      imagePath: variant.imagePath,
      lowStockThreshold: variant.lowStockThreshold,
      stockBaseQty: variant.stockBaseQty,

      baseUnitName: baseUnit?.unitName || "Piece",
      purchaseUnitName: purchaseUnit?.unitName || "Case",
      purchaseConversionQty: purchaseUnit?.conversionQty || 1,

      publicUnitName: publicPrice?.unitName || baseUnit?.unitName || "Piece",
      publicPriceUsd: publicPrice?.usd || 0,
      publicPriceKhr: publicPrice?.khr || 0,

      caseUnitName: casePrice?.unitName || purchaseUnit?.unitName || "Case",
      casePriceUsd: casePrice?.usd || 0,
      casePriceKhr: casePrice?.khr || 0,

      wholesaleUnitName:
        wholesalePrice?.unitName || purchaseUnit?.unitName || "Case",
      wholesaleMinQty: wholesalePrice?.minQty || 5,
      wholesalePriceUsd: wholesalePrice?.usd || 0,
      wholesalePriceKhr: wholesalePrice?.khr || 0,
    });

    setVariantModalOpen(true);
  };

  const closeVariantModal = () => {
    setVariantModalOpen(false);
    setVariantEditIndex(null);
    setVariantForm(emptyVariantForm);
    setVariantErrors({});
  };

  const buildVariantFromForm = () => {
    const baseUnitName = variantForm.baseUnitName || "Piece";
    const purchaseUnitName = variantForm.purchaseUnitName || baseUnitName;
    const purchaseConversionQty = Number(variantForm.purchaseConversionQty || 1);

    const units = [
      {
        unitName: baseUnitName,
        conversionQty: 1,
        isBaseUnit: true,
        isDefaultSaleUnit: true,
        isDefaultPurchaseUnit: purchaseUnitName === baseUnitName,
      },
    ];

    if (purchaseUnitName !== baseUnitName) {
      units.push({
        unitName: purchaseUnitName,
        conversionQty: purchaseConversionQty,
        isBaseUnit: false,
        isDefaultSaleUnit: false,
        isDefaultPurchaseUnit: true,
      });
    }

    const priceRules = [
      {
        appliesTo: "public",
        unitName: variantForm.publicUnitName || baseUnitName,
        minQty: 1,
        usd: Number(variantForm.publicPriceUsd || 0),
        khr: Number(variantForm.publicPriceKhr || 0),
      },
    ];

    if (
      Number(variantForm.casePriceUsd || 0) > 0 ||
      Number(variantForm.casePriceKhr || 0) > 0
    ) {
      priceRules.push({
        appliesTo: "public",
        unitName: variantForm.caseUnitName || purchaseUnitName,
        minQty: 1,
        usd: Number(variantForm.casePriceUsd || 0),
        khr: Number(variantForm.casePriceKhr || 0),
      });
    }

    if (
      Number(variantForm.wholesalePriceUsd || 0) > 0 ||
      Number(variantForm.wholesalePriceKhr || 0) > 0
    ) {
      priceRules.push({
        appliesTo: "customer",
        unitName: variantForm.wholesaleUnitName || purchaseUnitName,
        minQty: Number(variantForm.wholesaleMinQty || 1),
        usd: Number(variantForm.wholesalePriceUsd || 0),
        khr: Number(variantForm.wholesalePriceKhr || 0),
      });
    }

    return {
      id: Date.now(),
      variantCode: variantForm.variantCode.trim(),
      sku: variantForm.sku.trim() || variantForm.variantCode.trim(),
      variantName: variantForm.variantName.trim(),
      packageType: variantForm.packageType.trim(),
      color: variantForm.color.trim(),
      sizeValue: variantForm.sizeValue,
      sizeUnit: variantForm.sizeUnit.trim(),
      imagePath: variantForm.imagePath.trim(),
      lowStockThreshold: Number(variantForm.lowStockThreshold || 0),
      stockBaseQty: Number(variantForm.stockBaseQty || 0),
      baseUnit: baseUnitName,
      units,
      priceRules,
    };
  };

  const validateVariantForm = () => {
    const nextErrors = {};

    if (!variantForm.variantCode.trim()) {
      nextErrors.variantCode = "Variant code is required.";
    }

    if (!variantForm.variantName.trim()) {
      nextErrors.variantName = "Variant name is required.";
    }

    if (!variantForm.baseUnitName.trim()) {
      nextErrors.baseUnitName = "Base unit is required.";
    }

    if (!variantForm.purchaseUnitName.trim()) {
      nextErrors.purchaseUnitName = "Purchase unit is required.";
    }

    if (
      !variantForm.purchaseConversionQty ||
      Number(variantForm.purchaseConversionQty) <= 0
    ) {
      nextErrors.purchaseConversionQty =
        "Purchase conversion qty must be greater than 0.";
    }

    if (Number(variantForm.stockBaseQty || 0) < 0) {
      nextErrors.stockBaseQty = "Stock cannot be negative.";
    }

    if (Number(variantForm.lowStockThreshold || 0) < 0) {
      nextErrors.lowStockThreshold = "Low stock threshold cannot be negative.";
    }

    if (!variantForm.publicUnitName.trim()) {
      nextErrors.publicUnitName = "Public unit is required.";
    }

    if (Number(variantForm.publicPriceUsd || 0) < 0) {
      nextErrors.publicPriceUsd = "USD price cannot be negative.";
    }

    if (Number(variantForm.publicPriceKhr || 0) < 0) {
      nextErrors.publicPriceKhr = "KHR price cannot be negative.";
    }

    if (Number(variantForm.wholesaleMinQty || 0) < 1) {
      nextErrors.wholesaleMinQty = "Wholesale min qty must be at least 1.";
    }

    setVariantErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveVariant = () => {
    if (!validateVariantForm()) return;

    const variant = buildVariantFromForm();

    if (variantEditIndex !== null) {
      setProductVariants((previous) =>
        previous.map((item, index) =>
          index === variantEditIndex ? { ...variant, id: item.id } : item
        )
      );
    } else {
      setProductVariants((previous) => [...previous, variant]);
    }

    setProductErrors((previous) => ({
      ...previous,
      variants: "",
    }));

    closeVariantModal();
  };

  const handleRemoveVariant = (index) => {
    setProductVariants((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const validateProductForm = () => {
    const nextErrors = {};

    if (!productForm.productCode.trim()) {
      nextErrors.productCode = "Product code is required.";
    }

    if (!productForm.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!productForm.category) {
      nextErrors.category = "Category is required.";
    }

    if (productVariants.length === 0) {
      nextErrors.variants = "Please add at least one variant.";
    }

    setProductErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveProduct = () => {
    if (!validateProductForm()) return;

    const payload = {
      id: selectedProduct?.id || Date.now(),
      ...productForm,
      productCode: productForm.productCode.trim(),
      name: productForm.name.trim(),
      brand: productForm.brand.trim(),
      description: productForm.description.trim(),
      imagePath: productForm.imagePath.trim(),
      variants: productVariants,
    };

    if (modalMode === "add") {
      setProducts((previous) => [payload, ...previous]);
    }

    if (modalMode === "edit") {
      setProducts((previous) =>
        previous.map((item) => (item.id === selectedProduct.id ? payload : item))
      );
    }

    closeProductModal();
  };

  const handleToggleStatus = (productId) => {
    setProducts((previous) =>
      previous.map((item) =>
        item.id === productId
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
            }
          : item
      )
    );
  };

  const getUnitsText = (product) => {
    const units = new Set();

    product.variants.forEach((variant) => {
      variant.units.forEach((unit) => units.add(unit.unitName));
    });

    return Array.from(units).join(", ");
  };

  const getPriceRuleCount = (product) => {
    return product.variants.reduce(
      (total, variant) => total + variant.priceRules.length,
      0
    );
  };

  const getPriceRange = (product) => {
    const prices = product.variants.flatMap((variant) =>
      variant.priceRules.map((rule) => Number(rule.usd))
    );

    if (!prices.length) return "No price";

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) return `$${min.toFixed(2)}`;

    return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  };

  const getStockText = (product) => {
    if (product.variants.length === 1) {
      const variant = product.variants[0];
      return `${Number(variant.stockBaseQty).toLocaleString()} ${
        variant.baseUnit
      }`;
    }

    return `${product.variants.length} variant stocks`;
  };

  const isLowStock = (product) => {
    return product.variants.some(
      (variant) =>
        Number(variant.stockBaseQty) <= Number(variant.lowStockThreshold)
    );
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          theme={theme}
          icon={<FiBox className="text-[34px] text-red-500" />}
          title="Total Products"
          value={products.length}
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
          title="Total Variants"
          value={totalVariants}
          iconBg="bg-blue-500/10"
        />

        <SummaryCard
          theme={theme}
          icon={<FiAlertTriangle className="text-[34px] text-amber-500" />}
          title="Low Stock"
          value={lowStockProducts}
          iconBg="bg-amber-500/10"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_200px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              placeholder="Search product, code, brand, variant..."
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
            options={categories.map((category) => ({
              value: category,
              label: category === "All" ? "All Categories" : category,
            }))}
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
        </div>

        <button
          type="button"
          onClick={openAddProductModal}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 xl:min-w-[170px]"
        >
          <FiPlusCircle className="text-lg" />
          Add Product
        </button>
      </div>

      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
              Product List
            </h2>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1280px] w-full">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Product
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Category / Brand
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold">
                  Variants
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Units
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Price Range
                </th>
                <th className="px-4 py-4 text-left text-sm font-semibold">
                  Stock
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold">
                  Expiry
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold">
                  Status
                </th>
                <th className="px-4 py-4 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`border-t transition ${theme.row}`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={product} />

                      <div>
                        <p className="text-sm font-semibold">{product.name}</p>
                        <p className={`mt-1 text-xs ${theme.subText}`}>
                          {product.productCode}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm font-medium">{product.category}</p>
                    <p className={`mt-1 text-xs ${theme.subText}`}>
                      {product.brand || "No brand"}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      {product.variants.length} variants
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex max-w-[220px] flex-wrap gap-1.5">
                      {getUnitsText(product)
                        .split(", ")
                        .map((unit) => (
                          <span
                            key={`${product.id}-${unit}`}
                            className={`rounded-full border px-2.5 py-1 text-xs ${theme.badge}`}
                          >
                            {unit}
                          </span>
                        ))}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <FiTag className="text-red-500" />

                      <div>
                        <p className="text-sm font-semibold">
                          {getPriceRange(product)}
                        </p>

                        <p className={`mt-1 text-xs ${theme.subText}`}>
                          {getPriceRuleCount(product)} price rules
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p
                      className={`text-sm font-semibold ${
                        isLowStock(product)
                          ? "text-amber-500"
                          : theme.pageTitle
                      }`}
                    >
                      {getStockText(product)}
                    </p>

                    {isLowStock(product) ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                        <FiAlertTriangle />
                        Low stock
                      </p>
                    ) : (
                      <p className={`mt-1 text-xs ${theme.subText}`}>
                        Normal stock
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      {product.isExpirable ? "Expirable" : "No Expiry"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <StatusBadge status={product.status} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openViewProductModal(product)}
                        title="View product"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditProductModal(product)}
                        title="Edit product"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FiEdit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product.id)}
                        title="Activate / Deactivate product"
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="9" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                      >
                        <FiSearch className={`text-3xl ${theme.muted}`} />
                      </div>

                      <p
                        className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}
                      >
                        No products found
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Try changing your search keyword or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode === "view" && selectedProduct && (
        <ViewProductModal
          product={selectedProduct}
          theme={theme}
          onClose={closeProductModal}
        />
      )}

      {(modalMode === "add" || modalMode === "edit") && (
        <ProductFormModal
          mode={modalMode}
          productForm={productForm}
          errors={productErrors}
          variants={productVariants}
          theme={theme}
          onProductChange={handleProductFormChange}
          onAddVariant={openAddVariantModal}
          onEditVariant={openEditVariantModal}
          onRemoveVariant={handleRemoveVariant}
          onClose={closeProductModal}
          onSave={handleSaveProduct}
        />
      )}

      {variantModalOpen && (
        <VariantFormModal
          mode={variantEditIndex === null ? "add" : "edit"}
          form={variantForm}
          errors={variantErrors}
          theme={theme}
          onChange={handleVariantFormChange}
          onClose={closeVariantModal}
          onSave={handleSaveVariant}
        />
      )}
    </section>
  );
}

function SummaryCard({ theme, icon, title, value, iconBg }) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div>
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-1 text-3xl font-bold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function ProductThumb({ product }) {
  const image =
    product.imagePath ||
    product.variants.find((variant) => variant.imagePath)?.imagePath;

  if (image) {
    return (
      <img
        src={image}
        alt={product.name}
        className="h-12 w-12 rounded-2xl object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
      <FiPackage className="text-xl text-red-500" />
    </div>
  );
}

function VariantThumb({ variant, size = "normal" }) {
  const className =
    size === "small"
      ? "h-12 w-12 rounded-xl object-cover"
      : "h-24 w-24 rounded-2xl object-cover";

  const placeholderClass =
    size === "small" ? "h-12 w-12 rounded-xl" : "h-24 w-24 rounded-2xl";

  if (variant.imagePath) {
    return (
      <img
        src={variant.imagePath}
        alt={variant.variantName}
        className={className}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-red-500/10 ${placeholderClass}`}
    >
      <FiImage
        className={
          size === "small" ? "text-xl text-red-500" : "text-4xl text-red-500"
        }
      />
    </div>
  );
}

function getVariantStockBreakdown(variant) {
  const baseUnit =
    variant.units.find((unit) => unit.isBaseUnit) || variant.units[0];

  const convertedUnits = variant.units.filter(
    (unit) => !unit.isBaseUnit && Number(unit.conversionQty) > 0
  );

  return {
    baseText: `${Number(variant.stockBaseQty).toLocaleString()} ${
      baseUnit?.unitName || variant.baseUnit
    }`,
    convertedTexts: convertedUnits.map((unit) => {
      const convertedQty =
        Number(variant.stockBaseQty || 0) / Number(unit.conversionQty || 1);

      return {
        unitName: unit.unitName,
        text: `${Number(convertedQty).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} ${unit.unitName}`,
      };
    }),
  };
}

function ModalShell({
  title,
  subtitle,
  theme,
  onClose,
  children,
  footer,
  width = "max-w-6xl",
}) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex h-auto max-h-[90dvh] w-full ${width} flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
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

function ProductFormModal({
  mode,
  productForm,
  errors,
  variants,
  theme,
  onProductChange,
  onAddVariant,
  onEditVariant,
  onRemoveVariant,
  onClose,
  onSave,
}) {
  const title = mode === "add" ? "Add Product" : "Edit Product";
  const subtitle =
    "Add product master once, then add multiple variants like can, bottle, case, kg, set.";

  return (
    <ModalShell
      title={title}
      subtitle={subtitle}
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            <FiSave />
            Save Product
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <FormSection
          title="1. Product Information"
          subtitle="Main product details, category, brand, status, and image."
          icon={<FiBox />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Product Code"
              required
              value={productForm.productCode}
              error={errors.productCode}
              onChange={(value) => onProductChange("productCode", value)}
              theme={theme}
              icon={<FiHash />}
            />

            <FormInput
              label="Product Name"
              required
              value={productForm.name}
              error={errors.name}
              onChange={(value) => onProductChange("name", value)}
              theme={theme}
              placeholder="Coca-Cola"
              icon={<FiPackage />}
            />

            <FormSelect
              label="Category"
              required
              value={productForm.category}
              error={errors.category}
              onChange={(value) => onProductChange("category", value)}
              options={[
                { value: "Beverage", label: "Beverage" },
                { value: "Soap / Care", label: "Soap / Care" },
                { value: "Snack", label: "Snack" },
                { value: "Food", label: "Food" },
                { value: "Cosmetic", label: "Cosmetic" },
              ]}
              theme={theme}
              icon={<FiGrid />}
            />

            <FormInput
              label="Brand Name"
              value={productForm.brand}
              onChange={(value) => onProductChange("brand", value)}
              theme={theme}
              placeholder="Coca-Cola"
              icon={<FiTag />}
            />

            <FormInput
              label="Product Image URL / Path"
              value={productForm.imagePath}
              onChange={(value) => onProductChange("imagePath", value)}
              theme={theme}
              placeholder="/uploads/products/coca-cola.png"
              icon={<FiImage />}
            />

            <FormSelect
              label="Status"
              value={productForm.status}
              onChange={(value) => onProductChange("status", value)}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              theme={theme}
              icon={
                productForm.status === "Active" ? (
                  <FiCheckCircle />
                ) : (
                  <FiXCircle />
                )
              }
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Description"
              value={productForm.description}
              onChange={(value) => onProductChange("description", value)}
              theme={theme}
              placeholder="Soft drink"
              icon={<FiFileText />}
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={productForm.isExpirable}
              onChange={(event) =>
                onProductChange("isExpirable", event.target.checked)
              }
              className="h-4 w-4 rounded border-zinc-300"
            />
            Product has expiry date
          </label>
        </FormSection>

        <FormSection
          title="2. Variants"
          subtitle="Add can, bottle, big bottle, box, set, kg, or custom unit variants."
          icon={<FiLayers />}
          theme={theme}
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Product Variants</p>

              <p className={`mt-1 text-xs ${theme.muted}`}>
                Every product should have at least one variant.
              </p>
            </div>

            <button
              type="button"
              onClick={onAddVariant}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <FiPlus />
              Add Variant
            </button>
          </div>

          {errors.variants && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">
              {errors.variants}
            </div>
          )}

          {variants.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${theme.softCard}`}
            >
              <FiPackage className="text-4xl text-red-500" />

              <p className="mt-3 text-sm font-semibold">No variants added</p>

              <p className={`mt-1 text-xs ${theme.muted}`}>
                Example: Coca-Cola Can 330ml, Coca-Cola Bottle 500ml.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Variant</th>
                    <th className="px-3 py-3 text-left">Size</th>
                    <th className="px-3 py-3 text-left">Units</th>
                    <th className="px-3 py-3 text-left">Stock</th>
                    <th className="px-3 py-3 text-left">Prices</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {variants.map((variant, index) => (
                    <tr
                      key={variant.id || variant.variantCode}
                      className="border-t border-zinc-200 dark:border-white/10"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <VariantThumb variant={variant} size="small" />

                          <div>
                            <p className="font-semibold">
                              {variant.variantName}
                            </p>

                            <p className={`text-xs ${theme.muted}`}>
                              {variant.variantCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {variant.sizeValue || "-"} {variant.sizeUnit || ""}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {variant.units.map((unit) => (
                            <span
                              key={unit.unitName}
                              className={`rounded-full border px-2 py-1 text-xs ${theme.badge}`}
                            >
                              {unit.unitName}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {Number(variant.stockBaseQty).toLocaleString()}{" "}
                        {variant.baseUnit}
                      </td>

                      <td className="px-3 py-3">
                        {variant.priceRules.length} rules
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditVariant(variant, index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <FiEdit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onRemoveVariant(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>
      </div>
    </ModalShell>
  );
}

function VariantFormModal({ mode, form, errors, theme, onChange, onClose, onSave }) {
  const title = mode === "add" ? "Add Variant" : "Edit Variant";

  return (
    <ModalShell
      title={title}
      subtitle="Set variant details, units, stock, and price rules."
      theme={theme}
      onClose={onClose}
      width="max-w-4xl"
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            <FiSave />
            Save Variant
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <FormSection
          title="1. Variant Information"
          subtitle="Variant identity, SKU, package, size, color, and image."
          icon={<FiPackage />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Variant Code"
              required
              value={form.variantCode}
              error={errors.variantCode}
              onChange={(value) => onChange("variantCode", value)}
              theme={theme}
              placeholder="COKE-CAN-330"
              icon={<FiHash />}
            />

            <FormInput
              label="SKU"
              value={form.sku}
              onChange={(value) => onChange("sku", value)}
              theme={theme}
              placeholder="Optional"
              icon={<FiTag />}
            />

            <FormInput
              label="Variant Name"
              required
              value={form.variantName}
              error={errors.variantName}
              onChange={(value) => onChange("variantName", value)}
              theme={theme}
              placeholder="Coca-Cola Can 330ml"
              icon={<FiPackage />}
            />

            <FormInput
              label="Package Type"
              value={form.packageType}
              onChange={(value) => onChange("packageType", value)}
              theme={theme}
              placeholder="Can, Bottle, Box, Loose"
              icon={<FiBox />}
            />

            <FormInput
              label="Color"
              value={form.color}
              onChange={(value) => onChange("color", value)}
              theme={theme}
              placeholder="Optional"
              icon={<FiInfo />}
            />

            <FormInput
              label="Variant Image URL / Path"
              value={form.imagePath}
              onChange={(value) => onChange("imagePath", value)}
              theme={theme}
              placeholder="/uploads/products/coke-can.png"
              icon={<FiImage />}
            />

            <FormInput
              label="Size Value"
              value={form.sizeValue}
              onChange={(value) => onChange("sizeValue", value)}
              theme={theme}
              placeholder="330"
              icon={<FiHash />}
            />

            <FormInput
              label="Size Unit"
              value={form.sizeUnit}
              onChange={(value) => onChange("sizeUnit", value)}
              theme={theme}
              placeholder="ml, L, Kg"
              icon={<FiTag />}
            />
          </div>
        </FormSection>

        <FormSection
          title="2. Units & Stock"
          subtitle="Base unit, purchase unit, conversion quantity, and opening stock."
          icon={<FiLayers />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Base Unit"
              required
              value={form.baseUnitName}
              error={errors.baseUnitName}
              onChange={(value) => onChange("baseUnitName", value)}
              theme={theme}
              placeholder="Can, Bottle, Gram, Box"
              icon={<FiLayers />}
            />

            <FormInput
              label="Opening Stock Base Qty"
              type="number"
              value={form.stockBaseQty}
              error={errors.stockBaseQty}
              onChange={(value) => onChange("stockBaseQty", value)}
              theme={theme}
              icon={<FiPackage />}
            />

            <FormInput
              label="Purchase Unit"
              required
              value={form.purchaseUnitName}
              error={errors.purchaseUnitName}
              onChange={(value) => onChange("purchaseUnitName", value)}
              theme={theme}
              placeholder="Case, Kg, Set"
              icon={<FiShoppingCart />}
            />

            <FormInput
              label="Purchase Conversion Qty"
              required
              type="number"
              value={form.purchaseConversionQty}
              error={errors.purchaseConversionQty}
              onChange={(value) => onChange("purchaseConversionQty", value)}
              theme={theme}
              placeholder="24"
              icon={<FiHash />}
            />

            <FormInput
              label="Low Stock Threshold"
              type="number"
              value={form.lowStockThreshold}
              error={errors.lowStockThreshold}
              onChange={(value) => onChange("lowStockThreshold", value)}
              theme={theme}
              icon={<FiAlertTriangle />}
            />
          </div>

          <p className={`mt-3 text-xs ${theme.muted}`}>
            Example: Base Unit = Can, Purchase Unit = Case, Conversion Qty = 24.
            Meaning: 1 Case = 24 Cans.
          </p>
        </FormSection>

        <FormSection
          title="3. Price Rules"
          subtitle="Set public, case/pack, and wholesale prices."
          icon={<FiDollarSign />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput
              label="Public Unit"
              required
              value={form.publicUnitName}
              error={errors.publicUnitName}
              onChange={(value) => onChange("publicUnitName", value)}
              theme={theme}
              placeholder="Can"
              icon={<FiTag />}
            />

            <FormInput
              label="Public Price USD"
              type="number"
              value={form.publicPriceUsd}
              error={errors.publicPriceUsd}
              onChange={(value) => onChange("publicPriceUsd", value)}
              theme={theme}
              icon={<FiDollarSign />}
            />

            <FormInput
              label="Public Price KHR"
              type="number"
              value={form.publicPriceKhr}
              error={errors.publicPriceKhr}
              onChange={(value) => onChange("publicPriceKhr", value)}
              theme={theme}
              icon={<FiDollarSign />}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput
              label="Case / Pack Unit"
              value={form.caseUnitName}
              onChange={(value) => onChange("caseUnitName", value)}
              theme={theme}
              placeholder="Case"
              icon={<FiLayers />}
            />

            <FormInput
              label="Case Price USD"
              type="number"
              value={form.casePriceUsd}
              onChange={(value) => onChange("casePriceUsd", value)}
              theme={theme}
              icon={<FiDollarSign />}
            />

            <FormInput
              label="Case Price KHR"
              type="number"
              value={form.casePriceKhr}
              onChange={(value) => onChange("casePriceKhr", value)}
              theme={theme}
              icon={<FiDollarSign />}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <FormInput
              label="Wholesale Unit"
              value={form.wholesaleUnitName}
              onChange={(value) => onChange("wholesaleUnitName", value)}
              theme={theme}
              placeholder="Case"
              icon={<FiLayers />}
            />

            <FormInput
              label="Wholesale Min Qty"
              type="number"
              value={form.wholesaleMinQty}
              error={errors.wholesaleMinQty}
              onChange={(value) => onChange("wholesaleMinQty", value)}
              theme={theme}
              icon={<FiHash />}
            />

            <FormInput
              label="Wholesale Price USD"
              type="number"
              value={form.wholesalePriceUsd}
              onChange={(value) => onChange("wholesalePriceUsd", value)}
              theme={theme}
              icon={<FiDollarSign />}
            />

            <FormInput
              label="Wholesale Price KHR"
              type="number"
              value={form.wholesalePriceKhr}
              onChange={(value) => onChange("wholesalePriceKhr", value)}
              theme={theme}
              icon={<FiDollarSign />}
            />
          </div>
        </FormSection>
      </div>
    </ModalShell>
  );
}

function ViewProductModal({ product, theme, onClose }) {
  return (
    <ModalShell
      title={product.name}
      subtitle={`${product.productCode} · ${product.category} · ${
        product.brand || "No brand"
      }`}
      theme={theme}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Close
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <div className={`rounded-2xl border p-4 shadow-sm ${theme.section}`}>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-red-500/10">
            {product.imagePath ? (
              <img
                src={product.imagePath}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <FiImage className="text-6xl text-red-500" />
            )}
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <InfoLine label="Product Code" value={product.productCode} />
            <InfoLine label="Category" value={product.category} />
            <InfoLine label="Brand" value={product.brand || "-"} />
            <InfoLine label="Status" value={product.status} />
            <InfoLine
              label="Expirable"
              value={product.isExpirable ? "Yes" : "No"}
            />
            <InfoLine label="Description" value={product.description || "-"} />
          </div>
        </div>

        <div className="space-y-5">
          {product.variants.map((variant) => {
            const stockBreakdown = getVariantStockBreakdown(variant);
            const isVariantLowStock =
              Number(variant.stockBaseQty) <=
              Number(variant.lowStockThreshold);

            return (
              <div
                key={variant.variantCode}
                className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex gap-4">
                    <VariantThumb variant={variant} />

                    <div>
                      <h3 className="text-base font-bold">
                        {variant.variantName}
                      </h3>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        {variant.variantCode} · SKU: {variant.sku}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                        >
                          {variant.packageType || "No Package"}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                        >
                          Size: {variant.sizeValue || "-"}{" "}
                          {variant.sizeUnit || ""}
                        </span>

                        {variant.color && (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                          >
                            Color: {variant.color}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`min-w-[220px] rounded-2xl border p-4 ${theme.softCard}`}
                  >
                    <p className={`text-xs font-semibold ${theme.muted}`}>
                      Current Stock
                    </p>

                    <p
                      className={`mt-2 text-xl font-bold ${
                        isVariantLowStock ? "text-amber-500" : ""
                      }`}
                    >
                      {stockBreakdown.baseText}
                    </p>

                    {stockBreakdown.convertedTexts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {stockBreakdown.convertedTexts.map((item) => (
                          <span
                            key={item.unitName}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                          >
                            ≈ {item.text}
                          </span>
                        ))}
                      </div>
                    )}

                    {isVariantLowStock && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-amber-500">
                        <FiAlertTriangle />
                        Low stock
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold">Units</h4>

                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {variant.units.map((unit) => (
                      <div
                        key={unit.unitName}
                        className={`rounded-xl border p-3 text-sm ${theme.softCard}`}
                      >
                        <p className="font-semibold">
                          {unit.unitName} = {unit.conversionQty}{" "}
                          {variant.baseUnit}
                        </p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {unit.isBaseUnit ? "Base unit" : "Converted unit"}
                          {unit.isDefaultSaleUnit ? " · Default sale" : ""}
                          {unit.isDefaultPurchaseUnit
                            ? " · Default purchase"
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold">Price Rules</h4>

                  <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-red-600 text-white">
                        <tr>
                          <th className="px-3 py-3 text-left">Applies To</th>
                          <th className="px-3 py-3 text-left">Unit</th>
                          <th className="px-3 py-3 text-left">Min Qty</th>
                          <th className="px-3 py-3 text-left">USD</th>
                          <th className="px-3 py-3 text-left">KHR</th>
                        </tr>
                      </thead>

                      <tbody>
                        {variant.priceRules.map((rule, index) => (
                          <tr
                            key={`${rule.appliesTo}-${rule.unitName}-${index}`}
                            className="border-t border-zinc-200 dark:border-white/10"
                          >
                            <td className="px-3 py-3 capitalize">
                              {rule.appliesTo}
                            </td>
                            <td className="px-3 py-3">{rule.unitName}</td>
                            <td className="px-3 py-3">{rule.minQty}</td>
                            <td className="px-3 py-3">
                              ${Number(rule.usd).toFixed(2)}
                            </td>
                            <td className="px-3 py-3">
                              {Number(rule.khr).toLocaleString()}៛
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}

function FilterSelect({ icon, value, onChange, options, theme }) {
  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
      >
        {icon}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${theme.select}`}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <FiChevronDown
        className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
      />
    </div>
  );
}

function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold">{title}</h3>

          {subtitle && (
            <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children}
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

function FormSelect({
  label,
  required = false,
  value,
  onChange,
  options,
  theme,
  error = "",
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

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm outline-none transition focus:ring-4 ${theme.select} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FiChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}