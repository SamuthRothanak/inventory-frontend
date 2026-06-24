import api from "../lib/axios";

export const getReportSummaryApi = async (params = {}) => {
  const response = await api.get("/reports/summary", { params });
  return response.data;
};
