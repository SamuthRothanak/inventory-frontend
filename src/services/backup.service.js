import api from "../lib/axios";
import { useAuthStore } from "../store/authStore";

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

export const downloadBackupApi = (id) => {
  const { token } = useAuthStore.getState();
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
  const url = `${baseUrl}/backups/${id}/download?token=${encodeURIComponent(token)}`;
  const a = document.createElement("a");
  a.href = url;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
