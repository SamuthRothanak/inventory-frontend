export const EXCHANGE_RATE = 4000;

export const customers = [
  { id: "1", code: "CUS-001", shopName: "Dara Mini Mart", contactName: "Dara", phone: "012345678" },
  { id: "2", code: "CUS-002", shopName: "Sokha Mart", contactName: "Sokha", phone: "098765432" },
];

export const categories = ["All", "Drink", "Food", "Snack", "Care"];

export const products = [
  {
    id: "p1",
    category: "Drink",
    productName: "Coca-Cola",
    variantName: "Can Red 330ml",
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 480,
    lowStockThreshold: 50,
    units: [
      {
        id: "u1",
        name: "piece",
        conversionQty: 1,
        priceRules: [
          { id: "r1", appliesTo: "public", minQty: 1, usd: 0.5, khr: 2000, label: "Public / Piece" },
          { id: "r2", appliesTo: "customer", minQty: 1, usd: 0.5, khr: 2000, label: "Customer / Piece" },
        ],
      },
      {
        id: "u2",
        name: "case",
        conversionQty: 24,
        priceRules: [
          { id: "r3", appliesTo: "public", minQty: 1, usd: 5, khr: 20000, label: "Public / Case" },
          { id: "r4", appliesTo: "customer", minQty: 1, usd: 5, khr: 20000, label: "Customer / Case" },
          { id: "r5", appliesTo: "customer", minQty: 5, usd: 4, khr: 16000, label: "Customer / 5+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p2",
    category: "Drink",
    productName: "Cambodia Beer",
    variantName: "Can Lite 330ml",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 240,
    lowStockThreshold: 48,
    units: [
      {
        id: "u3",
        name: "piece",
        conversionQty: 1,
        priceRules: [
          { id: "r6", appliesTo: "public", minQty: 1, usd: 0.5, khr: 2000, label: "Public / Piece" },
          { id: "r7", appliesTo: "customer", minQty: 1, usd: 0.5, khr: 2000, label: "Customer / Piece" },
        ],
      },
      {
        id: "u4",
        name: "case",
        conversionQty: 24,
        priceRules: [
          { id: "r8", appliesTo: "public", minQty: 1, usd: 4.8, khr: 19200, label: "Public / Case" },
          { id: "r9", appliesTo: "customer", minQty: 1, usd: 4.8, khr: 19200, label: "Customer / Case" },
          { id: "r10", appliesTo: "customer", minQty: 5, usd: 4.0, khr: 16000, label: "Customer / 5+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p3",
    category: "Food",
    productName: "Instant Noodle",
    variantName: "Chicken 70g",
    image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 300,
    lowStockThreshold: 30,
    units: [
      {
        id: "u5",
        name: "piece",
        conversionQty: 1,
        priceRules: [
          { id: "r11", appliesTo: "public", minQty: 1, usd: 0.35, khr: 1400, label: "Public / Piece" },
          { id: "r12", appliesTo: "customer", minQty: 1, usd: 0.35, khr: 1400, label: "Customer / Piece" },
        ],
      },
      {
        id: "u6",
        name: "case",
        conversionQty: 30,
        priceRules: [
          { id: "r13", appliesTo: "public", minQty: 1, usd: 10.5, khr: 42000, label: "Public / Case" },
          { id: "r14", appliesTo: "customer", minQty: 1, usd: 10.5, khr: 42000, label: "Customer / Case" },
          { id: "r15", appliesTo: "customer", minQty: 3, usd: 9.9, khr: 39600, label: "Customer / 3+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p4",
    category: "Care",
    productName: "Dove",
    variantName: "Body Wash 500ml",
    image: "https://images.unsplash.com/photo-1585386959984-a41552231658?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 90,
    lowStockThreshold: 24,
    units: [
      {
        id: "u7",
        name: "piece",
        conversionQty: 1,
        priceRules: [
          { id: "r16", appliesTo: "public", minQty: 1, usd: 3.2, khr: 12800, label: "Public / Piece" },
          { id: "r17", appliesTo: "customer", minQty: 1, usd: 3.2, khr: 12800, label: "Customer / Piece" },
        ],
      },
      {
        id: "u8",
        name: "case",
        conversionQty: 12,
        priceRules: [
          { id: "r18", appliesTo: "public", minQty: 1, usd: 36, khr: 144000, label: "Public / Case" },
          { id: "r19", appliesTo: "customer", minQty: 1, usd: 36, khr: 144000, label: "Customer / Case" },
          { id: "r20", appliesTo: "customer", minQty: 5, usd: 32, khr: 128000, label: "Customer / 5+ Cases" },
        ],
      },
    ],
  },
  {
    id: "p5",
    category: "Snack",
    productName: "Potato Chips",
    variantName: "BBQ 55g",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 160,
    lowStockThreshold: 20,
    units: [
      {
        id: "u9",
        name: "piece",
        conversionQty: 1,
        priceRules: [
          { id: "r21", appliesTo: "public", minQty: 1, usd: 0.75, khr: 3000, label: "Public / Piece" },
          { id: "r22", appliesTo: "customer", minQty: 1, usd: 0.75, khr: 3000, label: "Customer / Piece" },
        ],
      },
      {
        id: "u10",
        name: "case",
        conversionQty: 24,
        priceRules: [
          { id: "r23", appliesTo: "public", minQty: 1, usd: 16.5, khr: 66000, label: "Public / Case" },
          { id: "r24", appliesTo: "customer", minQty: 1, usd: 16.5, khr: 66000, label: "Customer / Case" },
        ],
      },
    ],
  },
  {
    id: "p6",
    category: "Care",
    productName: "Shampoo",
    variantName: "Fresh 320ml",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800&auto=format&fit=crop",
    stockBaseQty: 110,
    lowStockThreshold: 20,
    units: [
      {
        id: "u11",
        name: "piece",
        conversionQty: 1,
        priceRules: [
          { id: "r25", appliesTo: "public", minQty: 1, usd: 2.5, khr: 10000, label: "Public / Piece" },
          { id: "r26", appliesTo: "customer", minQty: 1, usd: 2.5, khr: 10000, label: "Customer / Piece" },
        ],
      },
      {
        id: "u12",
        name: "case",
        conversionQty: 12,
        priceRules: [
          { id: "r27", appliesTo: "public", minQty: 1, usd: 28, khr: 112000, label: "Public / Case" },
          { id: "r28", appliesTo: "customer", minQty: 1, usd: 28, khr: 112000, label: "Customer / Case" },
        ],
      },
    ],
  },
];

export function getAppliedRule(unit, qty, appliesTo) {
  const matches = unit.priceRules
    .filter((rule) => rule.appliesTo === appliesTo && qty >= rule.minQty)
    .sort((a, b) => b.minQty - a.minQty);

  return matches[0] ?? unit.priceRules[0];
}

export function usd(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function khr(value) {
  return `${new Intl.NumberFormat().format(Number(value || 0))} ៛`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}