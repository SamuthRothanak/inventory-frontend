import api from "../lib/axios";

export const getSalesReturnsApi = async (params = {}) => {
  const response = await api.get("/sales-returns", { params });
  return response.data;
};

export const createSalesReturnApi = async (payload) => {
  const response = await api.post("/sales-returns", payload);
  return response.data;
};

export const approveSalesReturnApi = async (id) => {
  const response = await api.post(`/sales-returns/${id}/approve`);
  return response.data;
};

export const rejectSalesReturnApi = async (id, reason) => {
  const response = await api.post(`/sales-returns/${id}/reject`, { reject_reason: reason });
  return response.data;
};

export const completeSalesReturnApi = async (id) => {
  const response = await api.post(`/sales-returns/${id}/complete`);
  return response.data;
};

export const recordSalesReturnRefundApi = async (id, payload) => {
  const response = await api.post(`/sales-returns/${id}/refund`, payload);
  return response.data;
};
