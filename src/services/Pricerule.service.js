import api from "../lib/axios";

// GET /price-rules response (nested):
// { id, product_variant_unit_id, product_variant_unit: {id, unit_id, product_variant_id},
//   applies_to ("retail"|"wholesale"|"both"), min_qty (number),
//   unit_price_usd (string), unit_price_khr (string),
//   input_currency ("USD"|"KHR"), input_price (string),
//   exchange_rate_used (decimal), status ("active"|"inactive"), ... }

// status -> "active" | "inactive" (price_rules status enum ជា string)
const normalizeStatusForApi = (status) => {
  return status === true ||
    status === 1 ||
    status === "1" ||
    status === "Active" ||
    status === "active"
    ? "active"
    : "inactive";
};

// applies_to: retail | wholesale | both (មិនមែន public/customer)
const normalizeAppliesTo = (value) => {
  const v = String(value || "retail").toLowerCase();
  if (["retail", "wholesale", "both"].includes(v)) return v;
  // map legacy
  if (v === "public") return "retail";
  if (v === "customer") return "wholesale";
  return "retail";
};

export const getPriceRulesApi = async (params = {}) => {
  const response = await api.get("/price-rules", { params });
  return response.data;
};

export const getPriceRuleByIdApi = async (id) => {
  const response = await api.get(`/price-rules/${id}`);
  return response.data;
};

// សាងសង់ payload — ផ្ញើ input_price + input_currency ជាគោល
// ហើយផ្ញើ unit_price_usd/khr + exchange_rate_used ផងបើ frontend គណនារួច
// (backend អាច ignore/overwrite បើ backend គណនា auto)
const buildPayload = (payload) => {
  return {
    product_variant_unit_id: payload.product_variant_unit_id,
    applies_to: normalizeAppliesTo(
      payload.applies_to || payload.saleType || payload.sale_type
    ),
    min_qty: Number(payload.min_qty || payload.minQty || 1),
    input_currency: (payload.input_currency || payload.inputCurrency || "USD").toUpperCase(),
    input_price: Number(payload.input_price ?? payload.inputPrice ?? 0),
    unit_price_usd: Number(payload.unit_price_usd ?? payload.usd ?? 0),
    unit_price_khr: Number(payload.unit_price_khr ?? payload.khr ?? 0),
    exchange_rate_used: Number(
      payload.exchange_rate_used ?? payload.exchangeRateUsed ?? 0
    ),
    status: normalizeStatusForApi(payload.status),
  };
};

export const createPriceRuleApi = async (payload) => {
  const response = await api.post("/price-rules", buildPayload(payload));
  return response.data;
};

export const updatePriceRuleApi = async ({ id, payload }) => {
  const response = await api.put(`/price-rules/${id}`, buildPayload(payload));
  return response.data;
};

export const deletePriceRuleApi = async (id) => {
  const response = await api.delete(`/price-rules/${id}`);
  return response.data;
};