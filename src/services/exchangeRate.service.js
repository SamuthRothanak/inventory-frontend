import api from "../lib/axios";

export const getExchangeRatesApi = async (params = {}) => {
  const response = await api.get("/exchange-rates", { params });
  return response.data;
};

export const getActiveExchangeRateApi = async () => {
  try {
    const response = await api.get("/exchange-rates/active");
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: null,
      message:
        error.response?.data?.message || "No active exchange rate found.",
    };
  }
};

export const createExchangeRateApi = async (payload) => {
  const response = await api.post("/exchange-rates", {
    rate_date: payload.rate_date,
    usd_to_khr_rate: Number(payload.usd_to_khr_rate || 0),
    khr_rounding: payload.khr_rounding || "ceil",
    status: payload.status || "active",
  });

  return response.data;
};

export const updateExchangeRateApi = async ({ id, payload }) => {
  const response = await api.put(`/exchange-rates/${id}`, {
    rate_date: payload.rate_date,
    usd_to_khr_rate: Number(payload.usd_to_khr_rate || 0),
    khr_rounding: payload.khr_rounding || "ceil",
    status: payload.status || "active",
  });

  return response.data;
};

export const deleteExchangeRateApi = async (id) => {
  const response = await api.delete(`/exchange-rates/${id}`);
  return response.data;
};