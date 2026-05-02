import api from "../lib/axios";

// Axios 
export const getUsersApi = async (params = {}) => {
  const response = await api.get("/users", { params });
  return response.data;
};

export const createUserApi = async (payload) => {
  const response = await api.post("/users", payload);
  return response.data;
};

export const updateUserApi = async ({ id, payload }) => {
  const response = await api.patch(`/users/${id}`, payload);
  return response.data;
};

export const updateUserStatusApi = async ({ id, status }) => {
  const response = await api.patch(`/users/${id}/status`, { status });
  return response.data;
};