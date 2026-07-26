import api from "../lib/axios";

const withoutClientId = (payload = {}) => {
  const data = { ...payload };
  delete data.id;
  return data;
};

const isBackendId = (id) => {
  const value = Number(id);
  return Number.isFinite(value) && value > 0 && value < 100000000000;
};

const dateOnly = (value) => {
  if (!value) return null;
  const text = String(value);
  if (text.includes("T")) return text.split("T")[0];
  return text.slice(0, 10);
};

const sanitizePurchaseItemPayload = (payload = {}) => {
  const next = { ...payload };

  if ("expired_date" in next) next.expired_date = dateOnly(next.expired_date);
  if ("expiry_date" in next) next.expiry_date = dateOnly(next.expiry_date);

  return next;
};

const sanitizePurchasePayload = (payload = {}) => ({
  ...payload,
  items: Array.isArray(payload.items)
    ? payload.items.map((item) => {
        const next = sanitizePurchaseItemPayload(item);
        if (!isBackendId(next.id)) delete next.id;
        return next;
      })
    : payload.items,
});

export const getPurchasesApi = async (params = {}) => {
  const response = await api.get("/purchases", { params });
  return response.data;
};

export const getPurchaseStatsApi = async () => {
  try {
    const response = await api.get("/purchases/stats");
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      return { success: false, data: {} };
    }
    throw error;
  }
};

export const getPurchaseByIdApi = async (id) => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

export const createPurchaseApi = async (payload) => {
  const response = await api.post("/purchases", sanitizePurchasePayload(payload));
  return response.data;
};

export const updatePurchaseApi = async ({ id, payload }) => {
  const response = await api.put(`/purchases/${id}`, sanitizePurchasePayload(payload));
  return response.data;
};

export const deletePurchaseApi = async (id) => {
  const response = await api.delete(`/purchases/${id}`);
  return response.data;
};

export const createPurchaseItemApi = async (payload) => {
  const response = await api.post("/purchase-items", sanitizePurchaseItemPayload(payload));
  return response.data;
};

export const updatePurchaseItemApi = async ({ id, payload }) => {
  const response = await api.put(`/purchase-items/${id}`, sanitizePurchaseItemPayload(payload));
  return response.data;
};

export const syncPurchaseItemsApi = async ({ purchaseId, items = [] }) => {
  const responses = [];

  for (const item of items) {
    const itemPayload = sanitizePurchaseItemPayload({
      ...withoutClientId(item),
      purchase_id: purchaseId,
    });

    if (isBackendId(item.id)) {
      responses.push(await updatePurchaseItemApi({ id: item.id, payload: itemPayload }));
    } else {
      responses.push(await createPurchaseItemApi(itemPayload));
    }
  }

  return responses;
};

export const deletePurchaseItemApi = async (id) => {
  const response = await api.delete(`/purchase-items/${id}`);
  return response.data;
};

export const getPurchaseReturnsApi = async (params = {}) => {
  const response = await api.get("/purchase-returns", { params });
  return response.data;
};

export const createPurchaseReturnApi = async (payload) => {
  const response = await api.post("/purchase-returns", payload);
  return response.data;
};

export const updatePurchaseReturnApi = async ({ id, payload }) => {
  const response = await api.put(`/purchase-returns/${id}`, payload);
  return response.data;
};

export const deletePurchaseReturnApi = async (id) => {
  const response = await api.delete(`/purchase-returns/${id}`);
  return response.data;
};

export const createPurchaseReturnItemApi = async (payload) => {
  const response = await api.post("/purchase-return-items", payload);
  return response.data;
};

export const updatePurchaseReturnItemApi = async ({ id, payload }) => {
  const response = await api.put(`/purchase-return-items/${id}`, payload);
  return response.data;
};

export const deletePurchaseReturnItemApi = async (id) => {
  const response = await api.delete(`/purchase-return-items/${id}`);
  return response.data;
};

export const confirmPurchaseStockInApi = async (id, payload = {}) => {
  const response = await api.post(`/purchases/${id}/confirm-stock-in`, payload);
  return response.data;
};

export const recordPurchasePaymentApi = async ({ id, payload }) => {
  const response = await api.patch(`/purchases/${id}/record-payment`, payload);
  return response.data;
};

export const applyPurchaseCreditApi = async ({ id, payload }) => {
  const response = await api.post(`/purchases/${id}/apply-credit`, payload);
  return response.data;
};
