import api from "../lib/axios";

// GET /units response: { id, unit_code, unit_name, unit_type, allow_decimal (bool), status (string "active"), ... }

export const getUnitsApi = async (params = {}) => {
  const response = await api.get("/units", { params });
  return response.data;
};

export const getUnitByIdApi = async (id) => {
  const response = await api.get(`/units/${id}`);
  return response.data;
};

export const createUnitApi = async (payload) => {
  const response = await api.post("/units", {
    unit_code: payload.unit_code,
    unit_name: payload.unit_name,
    unit_type: payload.unit_type || "piece",
    allow_decimal: Boolean(payload.allow_decimal),
    status: payload.status || "active",
  });

  return response.data;
};

export const updateUnitApi = async ({ id, payload }) => {
  const response = await api.put(`/units/${id}`, {
    unit_code: payload.unit_code,
    unit_name: payload.unit_name,
    unit_type: payload.unit_type || "piece",
    allow_decimal: Boolean(payload.allow_decimal),
    status: payload.status || "active",
  });

  return response.data;
};

export const deleteUnitApi = async (id) => {
  const response = await api.delete(`/units/${id}`);
  return response.data;
};