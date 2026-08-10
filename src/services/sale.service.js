import api from "../lib/axios";

export const createSaleApi = async (payload) => {
  const response = await api.post("/sales", payload);
  return response.data;
};

export const getSalesApi = async (params = {}) => {
  const response = await api.get("/sales", { params });
  return response.data;
};

export const getSalesSummaryApi = async (period = "today") => {
  const response = await api.get("/sales/summary", { params: { period } });
  return response.data;
};

export const getSalesActivityChartApi = async (period = "today") => {
  const response = await api.get("/sales/activity-chart", { params: { period } });
  return response.data;
};

export const getSaleByIdApi = async (id) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

export const recordSalePaymentApi = async (id, payload) => {
  const response = await api.post(`/sales/${id}/record-payment`, payload);
  return response.data;
};
