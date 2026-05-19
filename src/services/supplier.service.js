import api from "../lib/axios";

const normalizeStatusForApi = (status) => {
  return status === true || status === "Active" || status === "active"
    ? "active"
    : "inactive";
};

export const getSuppliersApi = async (params = {}) => {
  const response = await api.get("/suppliers", { params });
  return response.data;
};

export const createSupplierApi = async (payload) => {
  const response = await api.post("/suppliers", {
    name: payload.name,
    contact_person: payload.contact_person || "",
    phone: payload.phone || "",
    email: payload.email || "",
    address: payload.address || "",
    note: payload.note || "",
    status: normalizeStatusForApi(payload.status),
  });

  return response.data;
};

export const updateSupplierApi = async ({ id, payload }) => {
  const response = await api.put(`/suppliers/${id}`, {
    name: payload.name,
    contact_person: payload.contact_person || "",
    phone: payload.phone || "",
    email: payload.email || "",
    address: payload.address || "",
    note: payload.note || "",
    status: normalizeStatusForApi(payload.status),
  });

  return response.data;
};

export const deleteSupplierApi = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};