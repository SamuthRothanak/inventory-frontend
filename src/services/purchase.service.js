import api from "../lib/axios";

const getCreatedData = (response) => {
  if (response?.data?.id) return response.data;
  if (response?.data?.data?.id) return response.data.data;
  if (response?.id) return response;
  return null;
};

const withoutItems = (payload = {}) => {
  const { items, ...header } = payload;
  return header;
};

const withoutClientId = (payload = {}) => {
  const { id, ...data } = payload;
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
  const items = Array.isArray(payload.items) ? payload.items : [];
  const response = await api.post("/purchases", withoutItems(payload));
  const purchase = getCreatedData(response.data);

  if (!items.length) return response.data;

  if (!purchase?.id) {
    throw new Error("Purchase created, but purchase id was not found.");
  }

  const createdItemIds = [];

  try {
    const createdItems = [];

    for (const item of items) {
      const itemResponse = await createPurchaseItemApi({
        ...item,
        purchase_id: purchase.id,
      });
      const createdItem = getCreatedData(itemResponse);
      if (createdItem?.id) createdItemIds.push(createdItem.id);
      createdItems.push(itemResponse);
    }

    return {
      ...response.data,
      items: createdItems,
    };
  } catch (error) {
    for (const item of [...createdItemIds].reverse()) {
      try {
        await deletePurchaseItemApi(item);
      } catch (cleanupError) {
        console.warn("Cleanup purchase item failed:", cleanupError);
      }
    }

    try {
      await deletePurchaseApi(purchase.id);
    } catch (cleanupError) {
      console.warn("Cleanup purchase failed:", cleanupError);
    }

    throw error;
  }
};

export const updatePurchaseApi = async ({ id, payload }) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const response = await api.put(`/purchases/${id}`, withoutItems(payload));

  for (const item of items) {
    const itemPayload = sanitizePurchaseItemPayload({
      ...withoutClientId(item),
      purchase_id: id,
    });

    if (isBackendId(item.id)) {
      await updatePurchaseItemApi({
        id: item.id,
        payload: itemPayload,
      });
    } else {
      await createPurchaseItemApi(itemPayload);
    }
  }

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
  const items = Array.isArray(payload.items) ? payload.items : [];
  const response = await api.post("/purchase-returns", withoutItems(payload));
  const purchaseReturn = getCreatedData(response.data);

  if (!items.length) return response.data;

  if (!purchaseReturn?.id) {
    throw new Error("Purchase return created, but return id was not found.");
  }

  const createdItemIds = [];

  try {
    const createdItems = [];

    for (const item of items) {
      const itemResponse = await createPurchaseReturnItemApi({
        ...item,
        purchase_return_id: purchaseReturn.id,
      });
      const createdItem = getCreatedData(itemResponse);
      if (createdItem?.id) createdItemIds.push(createdItem.id);
      createdItems.push(itemResponse);
    }

    return {
      ...response.data,
      items: createdItems,
    };
  } catch (error) {
    for (const item of [...createdItemIds].reverse()) {
      try {
        await deletePurchaseReturnItemApi(item);
      } catch (cleanupError) {
        console.warn("Cleanup purchase return item failed:", cleanupError);
      }
    }

    try {
      await deletePurchaseReturnApi(purchaseReturn.id);
    } catch (cleanupError) {
      console.warn("Cleanup purchase return failed:", cleanupError);
    }

    throw error;
  }
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

export const confirmPurchaseStockInApi = async (id) => {
  const response = await api.post(`/purchases/${id}/confirm-stock-in`);
  return response.data;
};
