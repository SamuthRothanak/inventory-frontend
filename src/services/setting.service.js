import api from "../lib/axios";

export const getSettingsApi = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const updateSettingsApi = async (payload) => {
  const response = await api.patch("/settings", payload);
  return response.data;
};
