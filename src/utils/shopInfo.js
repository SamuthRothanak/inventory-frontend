export const SHOP_INFO_STORAGE_KEY = "hakley-shop-info";
export const SHOP_INFO_UPDATED_EVENT = "hakley-shop-info-updated";

export const DEFAULT_SHOP_INFO = {
  name: "Hak Ley Mart",
  khmerName: "ហាក់ ឡេ ម៉ាត",
  phone: "",
  address: "",
  receiptFooter: "សូមអរគុណសម្រាប់ការជាវ។",
};

export function normalizeShopInfo(value = {}) {
  return {
    ...DEFAULT_SHOP_INFO,
    ...value,
    name: String(value.name ?? DEFAULT_SHOP_INFO.name),
    khmerName: String(value.khmerName ?? DEFAULT_SHOP_INFO.khmerName),
    phone: String(value.phone ?? DEFAULT_SHOP_INFO.phone),
    address: String(value.address ?? DEFAULT_SHOP_INFO.address),
    receiptFooter: String(value.receiptFooter ?? DEFAULT_SHOP_INFO.receiptFooter),
  };
}

export function getStoredShopInfo() {
  try {
    const saved = localStorage.getItem(SHOP_INFO_STORAGE_KEY);
    return saved ? normalizeShopInfo(JSON.parse(saved)) : DEFAULT_SHOP_INFO;
  } catch {
    localStorage.removeItem(SHOP_INFO_STORAGE_KEY);
    return DEFAULT_SHOP_INFO;
  }
}

export function saveStoredShopInfo(shopInfo) {
  const normalized = normalizeShopInfo(shopInfo);
  localStorage.setItem(SHOP_INFO_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(SHOP_INFO_UPDATED_EVENT, { detail: normalized }));
  return normalized;
}

export function getShopInitials(name = "") {
  const text = String(name || DEFAULT_SHOP_INFO.name).trim();
  if (!text) return "HL";

  const words = text.split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => Array.from(word)[0]).join("");

  return initials || Array.from(text)[0] || "HL";
}
