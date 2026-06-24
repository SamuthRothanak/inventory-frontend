import api from "../lib/axios";

export const getActivityLogsApi = async (params = {}) => {
  const response = await api.get("/activity-logs", { params });
  return response.data;
};
