import api from "../lib/axios";

export const getDashboardSummaryApi = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data;
};
