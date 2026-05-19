import api from "../lib/axios";

export const getCategoriesApi = async (params = {}) => {
  const response = await api.get("/categories", { params });
  return response.data;
};

export const createCategoryApi = async (payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("status", payload.status === "Active" ? "1" : "0");

  if (payload.imageFile instanceof File) {
    formData.append("image", payload.imageFile);
  }

  const response = await api.post("/categories", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateCategoryApi = async ({ id, payload }) => {
  const formData = new FormData();

  formData.append("_method", "PUT");
  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("status", payload.status === "Active" ? "1" : "0");

  if (payload.imageFile instanceof File) {
    formData.append("image", payload.imageFile);
  }

  const response = await api.post(`/categories/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteCategoryApi = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};