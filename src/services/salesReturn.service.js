import api from "../lib/axios";

export const getSalesReturnsApi = async (params = {}) => {
  const response = await api.get("/sales-returns", { params });
  return response.data;
};

export const createSalesReturnApi = async (payload) => {
  const response = await api.post("/sales-returns", payload);
  return response.data;
};

export const approveSalesReturnApi = async (id) => {
  const response = await api.post(`/sales-returns/${id}/approve`);
  return response.data;
};

export const rejectSalesReturnApi = async (id, reason) => {
  const response = await api.post(`/sales-returns/${id}/reject`, { reject_reason: reason });
  return response.data;
};

export const completeSalesReturnApi = async (id) => {
  const response = await api.post(`/sales-returns/${id}/complete`);
  return response.data;
};

export const recordSalesReturnRefundApi = async (id, payload) => {
  const response = await api.post(`/sales-returns/${id}/refund`, payload);
  return response.data;
};

// Atomic "អនុម័ត" action — approve + complete + (for a refund return) recordRefund, all in one
// request/transaction. Replaces the old approve→complete→refund chain of 3 separate calls,
// which could leave a return stuck "completed" with refund_status still "pending" if the
// connection dropped between requests. Safe to call regardless of the return's current status
// (pending_approval/approved/completed) — the backend skips whichever steps are already done.
export const resolveSalesReturnApi = async (id, refundPayload = null) => {
  const response = await api.post(`/sales-returns/${id}/resolve`, {
    include_refund: Boolean(refundPayload),
    ...(refundPayload || {}),
  });
  return response.data;
};
