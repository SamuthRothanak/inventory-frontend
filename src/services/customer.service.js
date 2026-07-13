import api from "../lib/axios";

export const getCustomersApi = async (params = {}) => {
  const response = await api.get("/customers", { params });
  return response.data;
};

export const createCustomerApi = async (payload) => {
  const response = await api.post("/customers", {
    shop_name: payload.shop_name,
    contact_name: payload.contact_name || "",
    phone: payload.phone || "",
    address: payload.address || "",
    description: payload.description || "",
    status: payload.status === true || payload.status === "Active",
  });

  return response.data;
};

export const updateCustomerApi = async ({ id, payload }) => {
  const response = await api.put(`/customers/${id}`, {
    shop_name: payload.shop_name,
    contact_name: payload.contact_name || "",
    phone: payload.phone || "",
    address: payload.address || "",
    description: payload.description || "",
    status: payload.status === true || payload.status === "Active",
  });

  return response.data;
};

export const deleteCustomerApi = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

export const bulkDeleteCustomersApi = async (ids = []) => {
  const response = await api.post("/customers/bulk-delete", { ids });
  return response.data;
};
