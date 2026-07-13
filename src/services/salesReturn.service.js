import api from "../lib/axios";

export const getSalesReturnsApi = async (params = {}) => {
  const response = await api.get("/sales-returns", { params });
  return response.data;
};

export const createSalesReturnApi = async (payload) => {
  const response = await api.post("/sales-returns", payload);
  return response.data;
};
