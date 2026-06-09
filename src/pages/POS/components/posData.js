// ─── Exchange Rate ───────────────────────────────────────────────
export const EXCHANGE_RATE = 4000; // snapshot — never mutate old records

// ─── Customers ───────────────────────────────────────────────────
export const customers = [
  { id: "1", code: "CUS-001", shopName: "Dara Mini Mart",  contactName: "Dara",  phone: "012 345 678" },
  { id: "2", code: "CUS-002", shopName: "Sokha Mart",      contactName: "Sokha", phone: "098 765 432" },
  { id: "3", code: "CUS-003", shopName: "Bunna Store",     contactName: "Bunna", phone: "077 111 222" },
];

// ─── Categories ──────────────────────────────────────────────────
export const categories = ["All", "Drink", "Food", "Snack", "Care"];

// ─── Products (product_variant_units with price_rules) ───────────
// Per flow: products is container only.
// Each entry here = one product_variant_unit (the real sellable item).
export const products = [
  {
    id: "p1",
    category: "Drink",
    productName: "Coca-Cola",
    variantName: "Can Red 330ml",
    code: "CCA-001",
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 480,
    lowStockThreshold: 50,
    units: [
      {
        id: "u1",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r1", appliesTo: "public",   minQty: 1,  usd: 0.50, khr: 2000,  label: "Public · Piece" },
          { id: "r2", appliesTo: "customer", minQty: 1,  usd: 0.45, khr: 1800,  label: "Customer · Piece" },
        ],
      },
      {
        id: "u2",
        name: "Case",
        conversionQty: 24,
        priceRules: [
          { id: "r3", appliesTo: "public",   minQty: 1,  usd: 5.00, khr: 20000, label: "Public · Case" },
          { id: "r4", appliesTo: "customer", minQty: 1,  usd: 4.80, khr: 19200, label: "Customer · Case" },
          { id: "r5", appliesTo: "customer", minQty: 5,  usd: 4.50, khr: 18000, label: "Customer · 5+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p2",
    category: "Drink",
    productName: "Cambodia Beer",
    variantName: "Can Lite 330ml",
    code: "CBL-001",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 240,
    lowStockThreshold: 48,
    units: [
      {
        id: "u3",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r6", appliesTo: "public",   minQty: 1,  usd: 0.60, khr: 2400,  label: "Public · Piece" },
          { id: "r7", appliesTo: "customer", minQty: 1,  usd: 0.55, khr: 2200,  label: "Customer · Piece" },
        ],
      },
      {
        id: "u4",
        name: "Case",
        conversionQty: 24,
        priceRules: [
          { id: "r8",  appliesTo: "public",   minQty: 1, usd: 4.80, khr: 19200, label: "Public · Case" },
          { id: "r9",  appliesTo: "customer", minQty: 1, usd: 4.60, khr: 18400, label: "Customer · Case" },
          { id: "r10", appliesTo: "customer", minQty: 5, usd: 4.20, khr: 16800, label: "Customer · 5+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p3",
    category: "Food",
    productName: "Instant Noodle",
    variantName: "Chicken 70g",
    code: "INF-001",
    image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 300,
    lowStockThreshold: 30,
    units: [
      {
        id: "u5",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r11", appliesTo: "public",   minQty: 1, usd: 0.35, khr: 1400,  label: "Public · Piece" },
          { id: "r12", appliesTo: "customer", minQty: 1, usd: 0.32, khr: 1280,  label: "Customer · Piece" },
        ],
      },
      {
        id: "u6",
        name: "Case",
        conversionQty: 30,
        priceRules: [
          { id: "r13", appliesTo: "public",   minQty: 1, usd: 10.50, khr: 42000, label: "Public · Case" },
          { id: "r14", appliesTo: "customer", minQty: 1, usd: 10.00, khr: 40000, label: "Customer · Case" },
          { id: "r15", appliesTo: "customer", minQty: 3, usd:  9.50, khr: 38000, label: "Customer · 3+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p4",
    category: "Care",
    productName: "Dove",
    variantName: "Body Wash 500ml",
    code: "DVW-001",
    image: "https://images.unsplash.com/photo-1585386959984-a41552231658?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 90,
    lowStockThreshold: 24,
    units: [
      {
        id: "u7",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r16", appliesTo: "public",   minQty: 1, usd: 3.20, khr: 12800, label: "Public · Piece" },
          { id: "r17", appliesTo: "customer", minQty: 1, usd: 3.00, khr: 12000, label: "Customer · Piece" },
        ],
      },
      {
        id: "u8",
        name: "Case",
        conversionQty: 12,
        priceRules: [
          { id: "r18", appliesTo: "public",   minQty: 1, usd: 36.00, khr: 144000, label: "Public · Case" },
          { id: "r19", appliesTo: "customer", minQty: 1, usd: 34.00, khr: 136000, label: "Customer · Case" },
          { id: "r20", appliesTo: "customer", minQty: 5, usd: 32.00, khr: 128000, label: "Customer · 5+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p5",
    category: "Snack",
    productName: "Potato Chips",
    variantName: "BBQ 55g",
    code: "PCB-001",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 160,
    lowStockThreshold: 20,
    units: [
      {
        id: "u9",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r21", appliesTo: "public",   minQty: 1, usd: 0.75, khr: 3000,  label: "Public · Piece" },
          { id: "r22", appliesTo: "customer", minQty: 1, usd: 0.70, khr: 2800,  label: "Customer · Piece" },
        ],
      },
      {
        id: "u10",
        name: "Case",
        conversionQty: 24,
        priceRules: [
          { id: "r23", appliesTo: "public",   minQty: 1, usd: 16.50, khr: 66000, label: "Public · Case" },
          { id: "r24", appliesTo: "customer", minQty: 1, usd: 15.50, khr: 62000, label: "Customer · Case" },
        ],
      },
    ],
  },
  {
    id: "p6",
    category: "Care",
    productName: "Head & Shoulders",
    variantName: "Shampoo 320ml",
    code: "HSS-001",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 110,
    lowStockThreshold: 20,
    units: [
      {
        id: "u11",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r25", appliesTo: "public",   minQty: 1, usd: 2.50, khr: 10000, label: "Public · Piece" },
          { id: "r26", appliesTo: "customer", minQty: 1, usd: 2.30, khr: 9200,  label: "Customer · Piece" },
        ],
      },
      {
        id: "u12",
        name: "Case",
        conversionQty: 12,
        priceRules: [
          { id: "r27", appliesTo: "public",   minQty: 1, usd: 28.00, khr: 112000, label: "Public · Case" },
          { id: "r28", appliesTo: "customer", minQty: 1, usd: 26.00, khr: 104000, label: "Customer · Case" },
        ],
      },
    ],
  },
  {
    id: "p7",
    category: "Drink",
    productName: "Water Bottle",
    variantName: "Crystal 500ml",
    code: "WBC-001",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 600,
    lowStockThreshold: 60,
    units: [
      {
        id: "u13",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r29", appliesTo: "public",   minQty: 1, usd: 0.25, khr: 1000, label: "Public · Piece" },
          { id: "r30", appliesTo: "customer", minQty: 1, usd: 0.22, khr:  880, label: "Customer · Piece" },
        ],
      },
      {
        id: "u14",
        name: "Case",
        conversionQty: 24,
        priceRules: [
          { id: "r31", appliesTo: "public",   minQty: 1, usd: 5.50, khr: 22000, label: "Public · Case" },
          { id: "r32", appliesTo: "customer", minQty: 1, usd: 5.00, khr: 20000, label: "Customer · Case" },
        ],
      },
    ],
  },
  {
    id: "p8",
    category: "Food",
    productName: "Tiger Biscuit",
    variantName: "Chocolate 150g",
    code: "TBC-001",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 0,
    lowStockThreshold: 20,
    units: [
      {
        id: "u15",
        name: "Piece",
        conversionQty: 1,
        priceRules: [
          { id: "r33", appliesTo: "public",   minQty: 1, usd: 0.80, khr: 3200, label: "Public · Piece" },
          { id: "r34", appliesTo: "customer", minQty: 1, usd: 0.75, khr: 3000, label: "Customer · Piece" },
        ],
      },
    ],
  },
];

// ─── Sale Channels ────────────────────────────────────────────────
export const SALE_CHANNELS = [
  { value: "pos",         label: "POS"         },
  { value: "phone_order", label: "Phone Order" },
];

// ─── Delivery Options ─────────────────────────────────────────────
export const DELIVERY_OPTIONS = [
  { value: "customer_pickup",     label: "Customer Pickup" },
  { value: "shop_delivery",       label: "Shop Delivery" },
  { value: "third_party_delivery",label: "3rd Party Delivery" },
];

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Find the best matching price rule for a given unit, qty, and customer type.
 * Per flow: price_rules support appliesTo + minQty tiering.
 */
export function getAppliedRule(unit, qty, appliesTo) {
  const matches = unit.priceRules
    .filter((r) => r.appliesTo === appliesTo && qty >= r.minQty)
    .sort((a, b) => b.minQty - a.minQty);
  return matches[0] ?? unit.priceRules[0];
}

/** Format USD */
export function usd(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

/** Format KHR */
export function khr(value) {
  return `${new Intl.NumberFormat("km-KH").format(Math.round(Number(value || 0)))} ៛`;
}

/** Tailwind class joiner */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/** Generate a simple invoice number (frontend preview only — backend assigns real one) */
export function generateInvoiceNo() {
  const ts = Date.now().toString().slice(-6);
  return `INV-${ts}`;
}