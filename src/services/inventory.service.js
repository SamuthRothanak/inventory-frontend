import api from "../lib/axios";

export const getStockBalancesApi = async (params = {}) => {
  const response = await api.get("/stock-balances", { params });
  return response.data;
};

export const getInventoryBatchesApi = async (params = {}) => {
  const response = await api.get("/inventory-batches", { params });
  return response.data;
};

export const getStockMovementsApi = async (params = {}) => {
  const response = await api.get("/stock-movements", { params });
  return response.data;
};

export const getStockAdjustmentsApi = async (params = {}) => {
  const response = await api.get("/stock-adjustments", { params });
  return response.data;
};

export const createStockAdjustmentApi = async (payload) => {
  const response = await api.post("/stock-adjustments", payload);
  return response.data;
};

export const getStockAdjustmentByIdApi = async (id) => {
  const response = await api.get(`/stock-adjustments/${id}`);
  return response.data;
};

export const updateStockAdjustmentApi = async ({ id, payload }) => {
  const response = await api.patch(`/stock-adjustments/${id}`, payload);
  return response.data;
};
