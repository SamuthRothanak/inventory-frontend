import api from "../lib/axios";

// GET /categories response: { id, name, image (URL), description, status (0|1 number), created_at }
// POST/PUT ត្រូវផ្ញើ status ជា "1"/"0" និង image field

export const getCategoriesApi = async (params = {}) => {
  const response = await api.get("/categories", { params });
  return response.data;
};

export const getCategoryByIdApi = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// helper: បម្លែង status (number/string/bool) -> "1" | "0" សម្រាប់ផ្ញើ
const statusToApi = (status) => {
  if (status === 1 || status === "1" || status === true || status === "Active" || status === "active") {
    return "1";
  }
  return "0";
};

export const createCategoryApi = async (payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("status", statusToApi(payload.status));

  if (payload.imageFile instanceof File) {
    formData.append("image", payload.imageFile);
  }

  const response = await api.post("/categories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const updateCategoryApi = async ({ id, payload }) => {
  const formData = new FormData();

  formData.append("_method", "PUT");
  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("status", statusToApi(payload.status));

  if (payload.imageFile instanceof File) {
    formData.append("image", payload.imageFile);
  }

  const response = await api.post(`/categories/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const deleteCategoryApi = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};