// @ts-nocheck
import axios from "axios";

export const api = axios.create({
  baseURL: "https://medicine-server-95ck.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Произошла ошибка при обращении к серверу";

    return Promise.reject(new Error(message));
  }
);
