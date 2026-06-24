import api from "../lib/axios";

export const getBackupsApi = async (params = {}) => {
  const response = await api.get("/backups", { params });
  return response.data;
};

export const getBackupStatsApi = async () => {
  const response = await api.get("/backups/stats");
  return response.data;
};

export const createBackupApi = async () => {
  const response = await api.post("/backups");
  return response.data;
};

export const deleteBackupApi = async (id) => {
  const response = await api.delete(`/backups/${id}`);
  return response.data;
};

export const downloadBackupApi = async (id, fileName) => {
  const response = await api.get(`/backups/${id}/download`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(new Blob([response.data]));
  const a   = document.createElement("a");
  a.href    = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const restoreBackupApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/backups/restore", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const restoreBackupFromIdApi = async (id) => {
  const response = await api.post(`/backups/${id}/restore`);
  return response.data;
};
