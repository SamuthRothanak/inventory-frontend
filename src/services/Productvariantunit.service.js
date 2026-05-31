import api from "../lib/axios";

// GET /product-variant-units response (nested):
// { id, product_variant_id, unit_id, conversion_qty (string "1.0000"),
//   is_base_unit (bool), is_default_sale_unit (bool), is_default_purchase_unit (bool),
//   status (bool), unit: {...}, product_variant: {...} }

export const getProductVariantUnitsApi = async (params = {}) => {
  const response = await api.get("/product-variant-units", { params });
  return response.data;
};

export const getProductVariantUnitByIdApi = async (id) => {
  const response = await api.get(`/product-variant-units/${id}`);
  return response.data;
};

export const createProductVariantUnitApi = async (payload) => {
  const response = await api.post("/product-variant-units", {
    product_variant_id: payload.product_variant_id,
    unit_id: payload.unit_id,
    conversion_qty: Number(payload.conversion_qty || 1),
    is_base_unit: Boolean(payload.is_base_unit),
    is_default_sale_unit: Boolean(payload.is_default_sale_unit),
    is_default_purchase_unit: Boolean(payload.is_default_purchase_unit),
    status: Boolean(payload.status),
  });

  return response.data;
};

export const updateProductVariantUnitApi = async ({ id, payload }) => {
  const response = await api.put(`/product-variant-units/${id}`, {
    product_variant_id: payload.product_variant_id,
    unit_id: payload.unit_id,
    conversion_qty: Number(payload.conversion_qty || 1),
    is_base_unit: Boolean(payload.is_base_unit),
    is_default_sale_unit: Boolean(payload.is_default_sale_unit),
    is_default_purchase_unit: Boolean(payload.is_default_purchase_unit),
    status: Boolean(payload.status),
  });

  return response.data;
};

export const deleteProductVariantUnitApi = async (id) => {
  const response = await api.delete(`/product-variant-units/${id}`);
  return response.data;
};