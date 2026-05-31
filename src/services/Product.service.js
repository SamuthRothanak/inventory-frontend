import api from "../lib/axios";

// products table: id, name, category_id, images, description, status, timestamps
// មិនមាន expiry_date / product_code / has_expiry

export const getProductsApi = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

export const getProductByIdApi = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProductApi = async (payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);

  // category_id nullable ក្នុង table — ផ្ញើតែពេលមាន
  if (payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== "") {
    formData.append("category_id", payload.category_id);
  }

  formData.append("description", payload.description || "");
  formData.append("status", payload.status || "active");

  // images = column name ក្នុង table (single file)
  if (payload.imageFile instanceof File) {
    formData.append("images", payload.imageFile);
  }

  const response = await api.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const updateProductApi = async ({ id, payload }) => {
  const formData = new FormData();

  formData.append("_method", "PUT");
  formData.append("name", payload.name);

  if (payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== "") {
    formData.append("category_id", payload.category_id);
  }

  formData.append("description", payload.description || "");
  formData.append("status", payload.status || "active");

  if (payload.imageFile instanceof File) {
    formData.append("images", payload.imageFile);
  }

  const response = await api.post(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const deleteProductApi = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const getProductStatsApi = async () => {
  const response = await api.get("/products/stats");
  return response.data;
};