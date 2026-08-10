export const getToday = () => new Date().toISOString().slice(0, 10);
export const getNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export const initialInventory = [
  {
    id: 1,
    productName: "Coca-Cola",
    variantName: "Coca-Cola Can 330ml",
    variantCode: "COKE-CAN-330",
    category: "Beverage",
    imagePath: "",
    baseUnit: "Can",
    stockBaseQty: 0,
    lowStockThreshold: 20,
    unitCostBase: 0.3,
    status: "Out of Stock",
    units: [
      { id: 1, unitName: "Can", conversionQty: 1, isBaseUnit: true },
      { id: 2, unitName: "Case", conversionQty: 24, isBaseUnit: false },
    ],
    batches: [],
    movements: [],
  },
  {
    id: 2,
    productName: "Coca-Cola",
    variantName: "Coca-Cola Big Bottle 1.5L",
    variantCode: "COKE-BTL-1500",
    category: "Beverage",
    imagePath: "",
    baseUnit: "Bottle",
    stockBaseQty: 0,
    lowStockThreshold: 10,
    unitCostBase: 0.85,
    status: "Out of Stock",
    units: [
      { id: 5, unitName: "Bottle", conversionQty: 1, isBaseUnit: true },
      { id: 6, unitName: "Case", conversionQty: 6, isBaseUnit: false },
    ],
    batches: [],
    movements: [],
  },
  {
    id: 3,
    productName: "Face Mask",
    variantName: "Face Mask Box",
    variantCode: "MASK-BOX",
    category: "Cosmetic",
    imagePath: "",
    baseUnit: "Box",
    stockBaseQty: 8,
    lowStockThreshold: 10,
    unitCostBase: 0.45,
    status: "Low Stock",
    units: [
      { id: 11, unitName: "Box", conversionQty: 1, isBaseUnit: true },
      { id: 12, unitName: "Set", conversionQty: 6, isBaseUnit: false },
    ],
    batches: [
      {
        id: 1,
        batchNo: "BATCH-003",
        lotNo: "LOT-MASK-001",
        expiredDate: "2026-10-10",
        qtyReceivedBase: 60,
        qtyRemainingBase: 8,
        unitCostBase: 0.45,
        receivedAt: "2026-04-30",
        status: "active",
      },
    ],
    movements: [
      {
        type: "purchase_in",
        qtyBase: 60,
        refType: "purchase",
        refId: 1,
        note: "Purchase stock",
        createdAt: "2026-04-30",
      },
      {
        type: "sale_out",
        qtyBase: -52,
        refType: "sale",
        refId: 1,
        note: "POS sales",
        createdAt: "2026-05-01",
      },
    ],
  },
  {
    id: 4,
    productName: "Sugar",
    variantName: "Sugar Loose",
    variantCode: "SUGAR-LOOSE",
    category: "Food",
    imagePath: "",
    baseUnit: "Gram",
    stockBaseQty: 0,
    lowStockThreshold: 5000,
    unitCostBase: 0.001,
    status: "Out of Stock",
    units: [
      { id: 13, unitName: "Gram", conversionQty: 1, isBaseUnit: true },
      { id: 14, unitName: "Kg", conversionQty: 1000, isBaseUnit: false },
    ],
    batches: [],
    movements: [
      {
        type: "sale_out",
        qtyBase: -25000,
        refType: "sale",
        refId: 1,
        note: "Sold out",
        createdAt: "2026-05-01",
      },
    ],
  },
];

export const initialPendingPurchases = [
  {
    id: 1,
    purchaseNo: "PUR-001",
    supplierName: "Thai Huot Trading",
    purchaseDate: "2026-05-01",
    status: "Pending Stock In",
    totalItems: 2,
    note: "Products received from supplier and waiting stock confirmation.",
    items: [
      {
        inventoryId: 1,
        productVariantUnitId: 2,
        variantName: "Coca-Cola Can 330ml",
        qty: 180,
        unitName: "Case",
        conversionQty: 24,
        baseQty: 4320,
        unitCostBase: 0.3,
        expiredDate: "2026-12-31",
      },
      {
        inventoryId: 2,
        productVariantUnitId: 6,
        variantName: "Coca-Cola Big Bottle 1.5L",
        qty: 20,
        unitName: "Case",
        conversionQty: 6,
        baseQty: 120,
        unitCostBase: 0.85,
        expiredDate: "2026-12-31",
      },
    ],
  },
  {
    id: 2,
    purchaseNo: "PUR-002",
    supplierName: "Mengly Wholesale",
    purchaseDate: "2026-05-02",
    status: "Pending Stock In",
    totalItems: 1,
    note: "Face mask replacement stock.",
    items: [
      {
        inventoryId: 3,
        productVariantUnitId: 12,
        variantName: "Face Mask Box",
        qty: 10,
        unitName: "Set",
        conversionQty: 6,
        baseQty: 60,
        unitCostBase: 0.45,
        expiredDate: "2026-10-10",
      },
    ],
  },
];

export const initialStockAdjustments = [];

export const emptyAdjustmentForm = {
  inventoryId: "",
  adjustmentType: "decrease",
  reason: "damaged",
  qty: "",
  unitName: "",
  inventoryBatchId: "",
  note: "",
  // Optional — only used when a batch is selected during a "increase" adjustment, to fix that
  // batch's own unit cost in the same action (e.g. a purchase was entered with the wrong price).
  // Left empty, the batch's cost is untouched.
  correctedUnitCost: "",
};

export const adjustmentReasons = [
  { value: "damaged", label: "ខូចខាត" },
  { value: "expired", label: "ផុតកំណត់" },
  { value: "internal_use", label: "ដកប្រើប្រាស់ខ្លួនឯង" },
  { value: "lost", label: "បាត់" },
  { value: "stock_count", label: "រាប់ស្តុកពិតប្រាកដ" },
  { value: "correction", label: "កែតម្រូវការបញ្ចូលខុស" },
  { value: "other", label: "ផ្សេងទៀត" },
];

export const stockInReasons = [
  { value: "stock_count", label: "រាប់ស្តុកពិតប្រាកដ" },
  { value: "correction", label: "កែតម្រូវការបញ្ចូលខុស" },
  { value: "other", label: "ផ្សេងទៀត" },
];

export const stockOutReasons = [
  { value: "damaged", label: "ខូចខាត" },
  { value: "expired", label: "ផុតកំណត់" },
  { value: "internal_use", label: "ដកប្រើប្រាស់ខ្លួនឯង" },
  { value: "lost", label: "បាត់" },
  // "stock_count"/"correction" were missing here even though both are direction-agnostic —
  // a physical count or a data-entry mistake can just as easily reveal a SHORTAGE (needs
  // "ស្តុកចេញ") as an overage (needs "ការកែតម្រូវស្តុក"). Their own REASON_EXAMPLE guidance in
  // StockAdjustmentModal already describes a decrease scenario for both, but until now neither
  // reason was actually selectable while in the decrease modal.
  { value: "stock_count", label: "រាប់ស្តុកពិតប្រាកដ" },
  { value: "correction", label: "កែតម្រូវការបញ្ចូលខុស" },
  { value: "other", label: "ផ្សេងទៀត" },
];

export function getPageNumbers(currentPage, totalPages) {
  const current = Number(currentPage || 1);
  const total = Number(totalPages || 1);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
}
