import api from "../lib/axios";

// GET /categories response: { id, name, image, description, status (0|1), created_at }

export const getCategoriesApi = async (params = {}) => {
  const response = await api.get("/categories", { params });
  return response.data;
};

export const getCategoryByIdApi = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// helper: convert status to "1" or "0"
const statusToApi = (status) => {
  if (
    status === 1 ||
    status === "1" ||
    status === true ||
    status === "Active" ||
    status === "active"
  ) {
    return "1";
  }
  return "0";
};

// extract data array
const extractCategoriesFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

// extract meta
const getMetaFromResponse = (response) => response?.meta || response?.data?.meta || null;

// fetch all categories across pages (for dropdown)
export const getAllCategoriesApi = async (params = {}) => {
  const firstResponse = await getCategoriesApi({ ...params, page: 1, per_page: 9999 });
  const firstCategories = extractCategoriesFromResponse(firstResponse);
  const meta = getMetaFromResponse(firstResponse);

  const lastPage = Number(meta?.last_page || meta?.lastPage || 1);
  const apiPerPage = Number(meta?.per_page || meta?.perPage || 10);

  if (lastPage <= 1) return firstCategories;

  const requests = [];
  for (let page = 2; page <= lastPage; page += 1) {
    requests.push(getCategoriesApi({ ...params, page, per_page: apiPerPage }));
  }

  const responses = await Promise.all(requests);
  const otherCategories = responses.flatMap((res) => extractCategoriesFromResponse(res));
  return [...firstCategories, ...otherCategories];
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

export const bulkDeleteCategoriesApi = async (ids = []) => {
  const response = await api.post("/categories/bulk-delete", { ids });
  return response.data;
};
