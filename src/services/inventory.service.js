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
