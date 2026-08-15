// ─── Sale Channels ────────────────────────────────────────────────
export const SALE_CHANNELS = [
  { value: "pos",         label: "POS"        },
  { value: "phone_order", label: "ទូរស័ព្ទ"   },
];

// ─── Delivery Options ─────────────────────────────────────────────
export const DELIVERY_OPTIONS = [
  { value: "customer_pickup",      label: "អតិថិជនមកយក"  },
  { value: "shop_delivery",        label: "ដឹកដោយហាង"    },
  { value: "third_party_delivery", label: "ភ្នាក់ងារដឹក" },
];

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Find the best price rule for a unit/qty/appliesTo combination.
 * applies_to values: 'public' (retail), 'customer' (wholesale).
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

/** Generate a temporary invoice number (backend replaces with real sale_no) */
export function generateInvoiceNo() {
  const ts = Date.now().toString().slice(-6);
  return `INV-${ts}`;
}
