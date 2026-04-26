import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Unwrap CommonResponse envelope: { success, message, data } → data
    if (
      res.data &&
      typeof res.data === "object" &&
      "success" in res.data &&
      "data" in res.data
    ) {
      res.data = res.data.data;
    }
    return res;
  },
  (error) => {
    const requestUrl = error.config?.url ?? "";
    if (error.response?.status === 401 && !requestUrl.includes("/auth/logout")) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
