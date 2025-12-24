import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("auth_token")
  );
}

export function setToken(token) {
  localStorage.setItem("token", token);
}
export function clearToken() {
  localStorage.removeItem("token");
}

// Request: token ekle
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: 401 yakala
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      clearToken();
      // basit çözüm: login’e yönlendir
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
