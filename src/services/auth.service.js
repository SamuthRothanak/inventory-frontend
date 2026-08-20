import api from "../lib/axios";

export const loginApi = async (payload) => {
  const response = await api.post("/auth/login", {
    login: payload.login,
    password: payload.password,
    device_name: "inventory-ui",
  });

  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const meApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const forgotPasswordApi = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const verifyResetCodeApi = async ({ email, code }) => {
  const response = await api.post("/auth/verify-reset-code", { email, code });
  return response.data;
};

export const resetPasswordApi = async ({ email, code, password, password_confirmation }) => {
  const response = await api.post("/auth/reset-password", {
    email,
    code,
    password,
    password_confirmation,
  });
  return response.data;
};