// @ts-nocheck
import { api } from "../../shared/api/axios";
import { endpoints } from "../../shared/api/endpoints";

export const authApi = {
  login: (payload) => api.post(endpoints.auth.login, payload),
  logout: () => api.post(endpoints.auth.logout),
  register: (payload) => api.post(endpoints.auth.register, payload),
  forgotPassword: (payload) => api.post(endpoints.auth.forgotPassword, payload),
  resetPassword: (payload) => api.post(endpoints.auth.resetPassword, payload),
  getMe: () => api.get(endpoints.auth.me),
  changePassword: (payload) => api.put(endpoints.auth.changePassword, payload),
};
