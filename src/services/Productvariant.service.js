import api from "../lib/axios";

// GET /product-variants response (nested):
// { id, product: {id, name}, variant_code, variant_name, package_type,
//   color, size: {value, unit}, images (URL), low_stock_threshold, status (bool), ... }

export const getProductVariantsApi = async (params = {}) => {
  const response = await api.get("/product-variants", { params });
  return response.data;
};

export const getProductVariantByIdApi = async (id) => {
  const response = await api.get(`/product-variants/${id}`);
  return response.data;
};

// status ក្នុង table ជា boolean -> ផ្ញើ "1"/"0"
const statusToApi = (status) =>
  status === true || status === 1 || status === "1" ? "1" : "0";

export const createProductVariantApi = async (payload) => {
  const formData = new FormData();

  formData.append("product_id", payload.product_id);
  formData.append("variant_code", payload.variant_code);
  formData.append("variant_name", payload.variant_name);
  formData.append("package_type", payload.package_type || "");
  formData.append("color", payload.color || "");
  formData.append("size_value", payload.size_value || "");
  formData.append("size_unit", payload.size_unit || "");
  formData.append("low_stock_threshold", payload.low_stock_threshold || 0);
  formData.append("status", statusToApi(payload.status));

  if (payload.imageFile instanceof File) {
    formData.append("images", payload.imageFile);
  }

  const response = await api.post("/product-variants", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const updateProductVariantApi = async ({ id, payload }) => {
  const formData = new FormData();

  formData.append("_method", "PUT");
  formData.append("product_id", payload.product_id);
  formData.append("variant_code", payload.variant_code);
  formData.append("variant_name", payload.variant_name);
  formData.append("package_type", payload.package_type || "");
  formData.append("color", payload.color || "");
  formData.append("size_value", payload.size_value || "");
  formData.append("size_unit", payload.size_unit || "");
  formData.append("low_stock_threshold", payload.low_stock_threshold || 0);
  formData.append("status", statusToApi(payload.status));

  if (payload.imageFile instanceof File) {
    formData.append("images", payload.imageFile);
  }

  const response = await api.post(`/product-variants/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const deleteProductVariantApi = async (id) => {
  const response = await api.delete(`/product-variants/${id}`);
  return response.data;
};