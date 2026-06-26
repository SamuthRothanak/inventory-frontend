import api from "../lib/axios";

export const getRolesApi = async (params = {}) => {
  const response = await api.get("/roles", { params });
  return response.data;
};

export const createRoleApi = async (payload) => {
  const response = await api.post("/roles", payload);
  return response.data;
};

export const deleteRoleApi = async (id) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};

export const getPermissionsApi = async () => {
  const response = await api.get("/permissions");
  return response.data;
};

export const syncRolePermissionsApi = async (id, permissions) => {
  const response = await api.post(`/roles/${id}/sync-permissions`, { permissions });
  return response.data;
};
