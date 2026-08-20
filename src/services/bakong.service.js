import api from "../lib/axios";

export const generateBakongQrApi = async (amount) => {
  const response = await api.post("/bakong/qr", { amount });
  return response.data;
};

export const checkBakongPaymentApi = async (md5) => {
  const response = await api.post("/bakong/check", { md5 });
  return response.data;
};
